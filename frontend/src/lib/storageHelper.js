
import { supabase } from './supabase';

/**
 * Recursively deletes a folder and all its contents from a Supabase storage bucket.
 * 
 * @param {string} bucket - The name of the storage bucket.
 * @param {string} folderPath - The path to the folder (should end with '/').
 * @param {string} storeId - (Optional) Store ID to track storage decrement.
 */
export const deleteFolderRecursive = async (bucket, folderPath, storeId = null) => {
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
                // Calculate size for decrement if storeId provided
                let batchSize = 0;
                if (storeId) {
                    data.forEach(item => {
                        if (item.id !== null) { // It's a file
                            batchSize += (item.metadata?.size || 0);
                        }
                    });
                }

                const { error: removeError } = await supabase.storage
                    .from(bucket)
                    .remove(filesToDelete);

                if (removeError) {
                    console.error(`Error removing files in ${bucket}/${folderPath}:`, removeError);
                } else {
                    console.log(`Deleted ${filesToDelete.length} files from ${bucket}/${folderPath}`);
                    if (storeId && batchSize > 0) {
                        await trackStorageDelete(storeId, batchSize);
                    }
                }
            }

            // 2. Recursively delete subfolders
            // We do this sequentially to avoid overwhelming the client/requests, 
            // though Promise.all could be faster. Safety first.
            for (const subfolder of foldersToRecurse) {
                await deleteFolderRecursive(bucket, `${folderPath}${subfolder}/`, storeId);
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

/**
 * Syncs the total storage usage of a store to the database.
 * This is a "heavy" operation that scans all files and updates the DB.
 * @param {string} storeId
 * @returns {Promise<number>} The calculated total bytes
 */
export const syncStoreStorage = async (storeId) => {
    const totalBytes = await getStoreTotalStorage(storeId);

    const { error } = await supabase
        .from('stores')
        .update({ storage_used: totalBytes })
        .eq('id', storeId);

    if (error) {
        console.error('Failed to sync storage usage:', error);
        throw error;
    }

    return totalBytes;
};

/**
 * Checks if the store has enough space for a new file.
 * @param {string} storeId 
 * @param {number} newFileSize in bytes
 * @param {number} currentDbUsage (Optional) Current usage from DB. If not provided, it will be fetched.
 * @returns {Promise<boolean>} true if allowed
 * @throws {Error} if storage limit exceeded
 */
export const validateStorageAllowance = async (storeId, newFileSize, currentDbUsage = null) => {
    const MAX_STORAGE_MB = 30;
    const MAX_STORAGE_BYTES = MAX_STORAGE_MB * 1024 * 1024;

    let usage = currentDbUsage;

    // If not provided, fetch fresh from DB
    if (usage === null || usage === undefined) {
        const { data, error } = await supabase
            .from('stores')
            .select('storage_used')
            .eq('id', storeId)
            .single();

        if (error || !data) {
            // Fallback to 0 if we can't read, but log warning. 
            // We don't want to block upload purely on read error unless critical.
            console.warn('Could not fetch storage_usage for validation', error);
            usage = 0;
        } else {
            usage = data.storage_used || 0;
        }
    }

    if (usage + newFileSize > MAX_STORAGE_BYTES) {
        throw new Error(`Storage Limit Exceeded. You have used ${(usage / (1024 * 1024)).toFixed(1)}MB of ${MAX_STORAGE_MB}MB. Cannot upload ${(newFileSize / (1024 * 1024)).toFixed(2)}MB file.`);
    }

    return true;
};

/**
 * Increment storage usage in DB via RPC.
 * @param {string} storeId 
 * @param {number} bytes 
 */
export const trackStorageUpload = async (storeId, bytes) => {
    if (!bytes || bytes <= 0) return;

    const { error } = await supabase
        .rpc('increment_storage', { row_id: storeId, amount: bytes });

    if (error) console.error('Failed to track storage upload:', error);
};

/**
 * Decrement storage usage in DB via RPC.
 * @param {string} storeId 
 * @param {number} bytes 
 */
export const trackStorageDelete = async (storeId, bytes) => {
    if (!bytes || bytes <= 0) return;

    const { error } = await supabase
        .rpc('decrement_storage', { row_id: storeId, amount: bytes });

    if (error) console.error('Failed to track storage delete:', error);
};
