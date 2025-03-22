// utils/cleanupScheduler.js
const fs = require('fs');
const path = require('path');

class CleanupScheduler {
    constructor() {
        this.foldersToClean = new Map(); // Map of folder paths to cleanup times
    }

    // Add folder to cleanup schedule
    scheduleFolderDeletion(folderPath, minutesUntilDeletion = 30) {
        const deletionTime = Date.now() + minutesUntilDeletion * 60 * 1000;
        this.foldersToClean.set(folderPath, deletionTime);
        console.log(`Scheduled deletion for ${folderPath} at ${new Date(deletionTime)}`);
    }

    // Main cleanup method
    performCleanup() {
        const now = Date.now();
        console.log(`Starting cleanup at ${new Date(now)}`);

        this.foldersToClean.forEach((deletionTime, folderPath) => {
            if (now >= deletionTime) {
                try {
                    console.log(`Deleting folder: ${folderPath}`);
                    fs.rmSync(folderPath, { recursive: true, force: true });
                    this.foldersToClean.delete(folderPath);
                    console.log(`Successfully deleted ${folderPath}`);
                } catch (error) {
                    console.error(`Error deleting ${folderPath}:`, error.message);
                    this.foldersToClean.delete(folderPath); // Remove from tracking even if deletion fails
                }
            }
        });
    }

    // Start the periodic checker
    start(intervalMinutes = 10) {
        setInterval(() => this.performCleanup(), intervalMinutes * 60 * 1000);
        console.log(`Cleanup scheduler started, running every ${intervalMinutes} minutes`);
    }
}

// Singleton instance
const cleanupScheduler = new CleanupScheduler();

module.exports = cleanupScheduler; 