const fs = require('fs');
const path = require('path');

/**
 * Deletes folders older than the specified time (in milliseconds).
 * @param {string} baseDir - The base directory to search for folders.
 * @param {number} olderThanMs - The time in milliseconds (e.g., 3 minutes = 180000 ms).
 */
function deleteOldFolders(baseDir, olderThanMs) {
    try {
        // Ensure the base directory exists
        if (!fs.existsSync(baseDir)) {
            console.log(`Base directory does not exist: ${baseDir}`);
            return;
        }

        // Get all folders in the base directory
        const folders = fs.readdirSync(baseDir).filter((file) => {
            const filePath = path.join(baseDir, file);
            return fs.statSync(filePath).isDirectory();
        });

        // Current time
        const now = Date.now();

        // Iterate through folders and delete old ones
        folders.forEach((folder) => {
            const folderPath = path.join(baseDir, folder);
            const folderStat = fs.statSync(folderPath);

            // Check if the folder is older than the specified time
            if (now - folderStat.mtimeMs > olderThanMs) {
                console.log(`Deleting folder: ${folderPath}`);
                fs.rmSync(folderPath, { recursive: true, force: true });
            }
        });
    } catch (error) {
        console.error(`Error deleting old folders: ${error.message}`);
    }
}

module.exports = { deleteOldFolders };