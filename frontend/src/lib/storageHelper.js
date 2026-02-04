
import { supabase } from './supabase';

/**
 * Recursively deletes a folder and all its contents from a Supabase storage bucket.
 * 
 * @param {string} bucket - The name of the storage bucket.
 * @param {string} folderPath - The path to the folder (should end with '/').
 */
export const deleteFolderRecursive = async (bucket, folderPath) => {
    try {
        let hasMore = true;

        // Supabase list usually has a limit (default 100). We loop until empty.
        while (hasMore) {
            const { data, error } = await supabase.storage
                .from(bucket)
                .list(folderPath, { limit: 100 });

            if (error) {
                console.warn(`Error listing ${bucket}/${folderPath}:`, error.message);
                throw error;
            }

            if (!data || data.length === 0) {
                hasMore = false;
                break;
            }

            const filesToDelete = [];
            const foldersToRecurse = [];

            data.forEach(item => {
                if (item.id === null) {
                    // It's a folder (Supabase storage convention)
                    foldersToRecurse.push(item.name);
                } else {
                    filesToDelete.push(`${folderPath}${item.name}`);
                }
            });

            // 1. Delete files in this batch
            if (filesToDelete.length > 0) {
                const { error: removeError } = await supabase.storage
                    .from(bucket)
                    .remove(filesToDelete);

                if (removeError) {
                    console.error(`Error removing files in ${bucket}/${folderPath}:`, removeError);
                } else {
                    console.log(`Deleted ${filesToDelete.length} files from ${bucket}/${folderPath}`);
                }
            }

            // 2. Recursively delete subfolders
            // We do this sequentially to avoid overwhelming the client/requests, 
            // though Promise.all could be faster. Safety first.
            for (const subfolder of foldersToRecurse) {
                await deleteFolderRecursive(bucket, `${folderPath}${subfolder}/`);
            }

            // After deleting files and recursing folders, we check if there are more items 
            // (in case pagination kicked in, though usually deleting them clears the "page")
            // If we processed everything returned, we List again to see if anything remains.
            // If the folder is now empty, the next List returns empty array, exiting loop.
        }
    } catch (err) {
        console.error(`Recursive delete failed for ${bucket}/${folderPath}`, err);
    }
};

/**
 * Recursively gets the total size in bytes of files in a folder.
 */
export const getFolderSize = async (bucket, folderPath) => {
    let totalSize = 0;
    try {
        let hasMore = true;
        let offset = 0;
        const LIMIT = 100;

        // Supabase storage list doesn't support offset directly, but we can loop
        // Note: For deep recursion, we list, sum files, and recurse folders.
        // To be simpler and safer, we use the same recursive patterns as delete.

        const { data, error } = await supabase.storage
            .from(bucket)
            .list(folderPath, { limit: 100 });

        if (error) throw error;
        if (!data) return 0;

        const foldersToRecurse = [];

        for (const item of data) {
            if (item.id === null) {
                // Folder
                foldersToRecurse.push(item.name);
            } else {
                // File - add size (metadata.size is in bytes)
                totalSize += (item.metadata?.size || 0);
            }
        }

        // Recurse subfolders
        for (const subfolder of foldersToRecurse) {
            totalSize += await getFolderSize(bucket, `${folderPath}${subfolder}/`);
        }

    } catch (err) {
        console.warn(`Error getting size for ${bucket}/${folderPath}`, err);
    }
    return totalSize;
};

/**
 * Calculates total storage used by a store across all known buckets.
 * @param {string} storeId 
 * @returns {Promise<number>} Total bytes used
 */
export const getStoreTotalStorage = async (storeId) => {
    const targets = [
        { bucket: 'products', path: `products/${storeId}/` },
        { bucket: 'products', path: `products/variants/${storeId}/` },
        { bucket: 'store-images', path: `${storeId}/` },
        { bucket: 'store-assets', path: `${storeId}/` },
        { bucket: 'categories', path: `thumbnails/${storeId}/` }
    ];

    let totalBytes = 0;

    // Process sequentially to be gentle on connection
    for (const target of targets) {
        totalBytes += await getFolderSize(target.bucket, target.path);
    }

    return totalBytes;
};
