
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
