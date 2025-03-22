const ffprobeStatic = require('ffprobe-static');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const { generateRandomFolderName, validateAndExtractYouTubeID } = require('../../utils/helpers');
const cleanupScheduler = require('../../utils/cleanupScheduler');
const youtubeDlExec = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const SHORTS_DURATION = 60;
const { checkAndUpdateUsage } = require('../../utils/usageChecker');
const PORTRAIT_RESOLUTION = '1080:1920';
const Shorts = require('../../models/urlToShorts'); 

const basePath = path.join(__dirname, '../../public');
ffmpeg.setFfprobePath(ffprobeStatic.path);
ffmpeg.setFfmpegPath(ffmpegStatic);

const publicBaseUrl = 'youai/public';

// async function downloadVideo(url, outputFolder) {
//     try {
//         const outputPattern = path.join(outputFolder, 'original.%(ext)s'); // Save as "original" with any extension

//         // Download the video with MP4 format for video and M4A for audio
//         await youtubeDlExec(url, {
//             output: outputPattern,
//             format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]' // This ensures MP4 format for video
//         });

//         // Find the actual downloaded file by matching the 'original' prefix
//         const downloadedFiles = fs.readdirSync(outputFolder);
//         const downloadedFile = downloadedFiles.find(file => file.startsWith('original.'));

//         if (!downloadedFile) {
//             throw new Error("Download failed: No matching file found.");
//         }

//         const finalVideoPath = path.join(outputFolder, downloadedFile);
//         console.log("Download complete:", finalVideoPath);
//         return finalVideoPath; // Return the actual file path with the correct extension
//     } catch (error) {
//         console.error("Download failed:", error.message);
//         throw error;
//     }
// }
async function downloadVideo(url, outputFolder) {
    try {
        const outputPattern = path.join(outputFolder, 'original.%(ext)s');

        // Download the video with MP4 format for video and M4A for audio
        await youtubeDlExec(url, {
            output: outputPattern,
            // format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]'
        });

        const downloadedFiles = fs.readdirSync(outputFolder);
        const downloadedFile = downloadedFiles.find(file => file.startsWith('original.'));

        if (!downloadedFile) {
            throw new Error("Download failed: No matching file found.");
        }

        const finalVideoPath = path.join(outputFolder, downloadedFile);
        console.log("Download complete:", finalVideoPath);
        return finalVideoPath;
    } catch (error) {
        console.error("Download failed:", error.message);
        throw error;
    }
}
async function getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            resolve(metadata.format.duration);
        });
    });
}

async function processVideo(url, folderPath) {
    let videoPath;
    const shortsPaths = [];

    try {
        const videoID = validateAndExtractYouTubeID(url);
        if (!videoID) throw new Error('Invalid YouTube URL');
        const canonicalURL = `https://www.youtube.com/watch?v=${videoID}`;

        // Download the video
        videoPath = await downloadVideo(canonicalURL, folderPath);
        if (!fs.existsSync(videoPath)) {
            throw new Error(`Downloaded file not found: ${videoPath}`);
        }

        // Get video duration
        const duration = await getVideoDuration(videoPath);
        const segmentCount = Math.ceil(duration / SHORTS_DURATION);

        // Process each segment
        for (let i = 0; i < segmentCount; i++) {
            const startTime = i * SHORTS_DURATION;
            const finalPath = path.join(folderPath, `short_${i + 1}.mp4`);

            // await new Promise((resolve, reject) => {
            //     ffmpeg(videoPath)
            //         .outputOptions([
            //             '-ss', startTime.toString(),
            //             '-t', SHORTS_DURATION.toString(),
            //             '-c:v', 'libx264',
            //             '-b:v', '1M', // Set a fixed video bitrate
            //             '-b:a', '128k', // Set audio bitrate
            //             '-crf', '28', // Adjust CRF for better compression
            //             '-vf', `scale=${PORTRAIT_RESOLUTION}:force_original_aspect_ratio=increase,crop=${PORTRAIT_RESOLUTION}`
            //         ])
            //         .output(finalPath)
            //         .on('end', resolve)
            //         .on('error', reject)
            //         .run();
            // });
            await new Promise((resolve, reject) => {
                ffmpeg(videoPath)
                    .outputOptions([
                        '-ss', startTime.toString(),
                        '-t', SHORTS_DURATION.toString(),
                        '-c:v', 'libx264',
                        '-b:v', '1M', // Set a fixed video bitrate
                        '-b:a', '128k', // Set audio bitrate
                        '-crf', '28', // Adjust CRF for better compression
                        '-vf', `scale=${PORTRAIT_RESOLUTION}:force_original_aspect_ratio=increase,crop=${PORTRAIT_RESOLUTION}`
                    ])
                    .output(finalPath)
                    .on('start', (commandLine) => {
                        console.log('FFmpeg process started with command:', commandLine);
                    })
                    .on('progress', (progress) => {
                        console.log('Processing:', progress.percent + '% done');
                    })
                    .on('end', () => {
                        console.log('Processing finished:', finalPath);
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error('Error during processing:', err.message);
                        reject(err);
                    })
                    .run();
            });

            shortsPaths.push(finalPath);
        }

        // Delete the original video after processing
        fs.unlinkSync(videoPath);
        console.log("Original video deleted:", videoPath);

        return shortsPaths;

    } catch (error) {
        console.error("Processing Error:", error);
        throw error;
    }
}

exports.generateFromURL = async (req, res) => {
    const { url, userId, featureName } = req.body;

    try {
        if (!validateAndExtractYouTubeID(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL format' });
        }

        // Check usage and increment if allowed
        const usageCheckResult = await checkAndUpdateUsage(userId, featureName);
        if (!usageCheckResult.allowed) {
            return res.status(403).json({
                status: "Failed",
                message: usageCheckResult.message,
            });
        }

        // Create folders: userId/urlToShorts/randomFolderName
        const userFolder = path.join(basePath, userId);
        const urlToShortsFolder = path.join(userFolder, 'urlToShorts');
        const randomFolderName = generateRandomFolderName();
        const folderPath = path.join(urlToShortsFolder, randomFolderName);

        // Create folders recursively
        fs.mkdirSync(folderPath, { recursive: true, mode: 0o755 });

        // Schedule folder deletion after 30 minutes
        cleanupScheduler.scheduleFolderDeletion(folderPath, 30);

        // Process the video and generate shorts
        const shortsPaths = await processVideo(url, folderPath);

        // Construct public URLs for the generated short videos
        const publicUrls = shortsPaths.map(filePath =>
            `${publicBaseUrl}/${userId}/urlToShorts/${randomFolderName}/${path.basename(filePath)}`
        );

        // Store the paths in the database
        const shortsData = await Shorts.create({
            userId,
            url,
            folderPath,
            shortsPaths: publicUrls,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // Expiration time (30 minutes from now)
        });

        res.json({
            success: true,
            shorts: publicUrls,
            expiresAt: shortsData.expiresAt.toISOString()
        });

    } catch (error) {
        console.error('Processing Error:', error);
        res.status(500).json({
            error: 'Video processing failed',
            message: error.message,
            details: error.stack
        });
    }
};


exports.getAllUrlToShortsByUserId = async (req, res) => {
    const { userId } = req.body;

    try {
        // Fetch all shorts associated with the given userId
        const shorts = await Shorts.find({ userId });
  

        if (shorts.length === 0) {
            return res.status(404).json({
                status: "Failed",
                message: "No shorts found for the given user ID",
            });
        }

        // Map through the shorts to include only necessary information
        const shortsList = shorts.map(short => ({
            id: short._id,
            url: short.url,
            shortsPaths: short.shortsPaths,
            expiresAt: short.expiresAt.toISOString()
        }));

        res.json({
            success: true,
            shorts: shortsList
        });

    } catch (error) {
        console.error('Fetching Error:', error);
        res.status(500).json({
            error: 'Failed to fetch shorts',
            message: error.message,
            details: error.stack
        });
    }
};


