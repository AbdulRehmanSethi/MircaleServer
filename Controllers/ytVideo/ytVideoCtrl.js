


// const ytVideoService = require('./ytVideoServices');
// const { checkAndUpdateUsage } = require('../../utils/usageChecker');
// const transcribeSummaryModel = require('../../models/transcribeSummaryModel');


// exports.getVideoTranscript = async (req, res) => {
//     try {
//         const { youtubeLink, userId, featureName } = req.body;

//         if (!youtubeLink || typeof youtubeLink !== 'string') {
//             return res.status(400).json({ message: 'YouTube link is required and must be a valid string' });
//         }

//         // Check usage and increment if allowed
//         const usageCheckResult = await checkAndUpdateUsage(userId, featureName);
//         if (!usageCheckResult.allowed) {
//             return res.status(403).json({
//                 status: "Failed",
//                 message: usageCheckResult.message,
//             });
//         }

//         const transcript = await ytVideoService.fetchTranscript(youtubeLink);

//         // Save transcript to database
//         await transcribeSummaryModel.findOneAndUpdate(
//             { youtubeLink, userId },
//             { transcript, userId },
//             { upsert: true, new: true }
//         );

//         res.status(200).json({ transcript });
//     } catch (error) {
//         console.error('Error fetching transcript:', error.message);

//         let errorMessage = 'Error fetching transcript.';
//         if (error.message.includes('Unable to fetch transcript')) {
//             errorMessage = 'Unable to fetch transcript for this video. Please ensure the video is public and captions are enabled.';
//         }

//         res.status(500).json({
//             message: errorMessage,
//         });
//     }
// };

// exports.getVideoSummary = async (req, res) => {
//     try {
//         const { youtubeLink, userId, featureName } = req.body;

//         if (!youtubeLink || typeof youtubeLink !== 'string') {
//             return res.status(400).json({ message: 'YouTube link is required and must be a valid string' });
//         }

//         // Check usage and increment if allowed
//         const usageCheckResult = await checkAndUpdateUsage(userId, featureName);
//         if (!usageCheckResult.allowed) {
//             return res.status(403).json({
//                 status: "Failed",
//                 message: usageCheckResult.message,
//             });
//         }

//         const summary = await ytVideoService.generateSummary(youtubeLink);

//         // Save summary to database
//         await transcribeSummaryModel.findOneAndUpdate(
//             { youtubeLink, userId },
//             { summary, userId },
//             { upsert: true, new: true }
//         );

//         res.status(200).json({ summary });
//     } catch (error) {
//         console.error('Error generating summary:', error.message);

//         let errorMessage = 'Error generating summary.';
//         if (error.message.includes('Transcript not available')) {
//             errorMessage = 'Transcript is not available for this video.';
//         } else if (error.message.includes('Unable to fetch transcript')) {
//             errorMessage = 'Unable to fetch transcript for this video. Please ensure the video is public and captions are enabled.';
//         }

//         res.status(500).json({
//             message: errorMessage,
//         });
//     }
// };

// exports.getAllTranscribeSummary = async (req, res) => {
//     try {
//         const { userId } = req.query;

//         if (!userId) {
//             return res.status(400).json({ message: 'User ID is required.' });
//         }

//         // Fetch all data for the user
//         const userData = await VideoData.find({ userId });

//         if (!userData || userData.length === 0) {
//             return res.status(404).json({ message: 'No data found for this user.' });
//         }

//         res.status(200).json({ data: userData });
//     } catch (error) {
//         console.error('Error fetching user data:', error.message);
//         res.status(500).json({ message: 'Error fetching user data.' });
//     }
// };

const ytVideoService = require('./ytVideoServices');
const { checkAndUpdateUsage } = require('../../utils/usageChecker');
const { validateAndExtractYouTubeID } = require('../../utils/helpers');
const transcribeSummaryModel = require('../../models/transcribeSummaryModel');


exports.getVideoTranscript = async (req, res) => {
    try {
        const { youtubeLink, userId, featureName } = req.body;

        if (!youtubeLink || typeof youtubeLink !== 'string') {
            return res.status(400).json({ message: 'YouTube link is required and must be a valid string' });
        }

        // Extract video ID
        // const videoId = extractVideoId(youtubeLink);
        const videoId = validateAndExtractYouTubeID(youtubeLink);
        if (!videoId) {
            return res.status(400).json({ message: 'Invalid YouTube link. Video ID could not be extracted.' });
        }

        // Check usage and increment if allowed
        const usageCheckResult = await checkAndUpdateUsage(userId, featureName);
        if (!usageCheckResult.allowed) {
            return res.status(403).json({
                status: "Failed",
                message: usageCheckResult.message,
            });
        }

        // Fetch transcript
        const transcript = await ytVideoService.fetchTranscript(youtubeLink);

        // Save transcript to database
        await transcribeSummaryModel .findOneAndUpdate(
            { videoId, userId }, // Use videoId and userId as the unique identifier
            { videoId, youtubeLink, transcript, userId },
            { upsert: true, new: true }
        );

        res.status(200).json({ transcript });
    } catch (error) {
        console.error('Error fetching transcript:', error.message);

        let errorMessage = 'Error fetching transcript.';
        if (error.message.includes('Unable to fetch transcript')) {
            errorMessage = 'Unable to fetch transcript for this video. Please ensure the video is public and captions are enabled.';
        }

        res.status(500).json({
            message: errorMessage,
        });
    }
};

exports.getVideoSummary = async (req, res) => {
    try {
        const { youtubeLink, userId, featureName } = req.body;

        if (!youtubeLink || typeof youtubeLink !== 'string') {
            return res.status(400).json({ message: 'YouTube link is required and must be a valid string' });
        }

        // Extract video ID
        const videoId = validateAndExtractYouTubeID(youtubeLink);
        if (!videoId) {
            return res.status(400).json({ message: 'Invalid YouTube link. Video ID could not be extracted.' });
        }

        // Check usage and increment if allowed
        const usageCheckResult = await checkAndUpdateUsage(userId, featureName);
        if (!usageCheckResult.allowed) {
            return res.status(403).json({
                status: "Failed",
                message: usageCheckResult.message,
            });
        }

        // Generate summary
        const summary = await ytVideoService.generateSummary(youtubeLink);

        // Save summary to database
        await transcribeSummaryModel.findOneAndUpdate(
            { videoId, userId }, // Use videoId and userId as the unique identifier
            { videoId, youtubeLink, summary, userId },
            { upsert: true, new: true }
        );

        res.status(200).json({ summary });
    } catch (error) {
        console.error('Error generating summary:', error.message);

        let errorMessage = 'Error generating summary.';
        if (error.message.includes('Transcript not available')) {
            errorMessage = 'Transcript is not available for this video.';
        } else if (error.message.includes('Unable to fetch transcript')) {
            errorMessage = 'Unable to fetch transcript for this video. Please ensure the video is public and captions are enabled.';
        }

        res.status(500).json({
            message: errorMessage,
        });
    }
};

exports.getAllTranscribeSummary = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        // Fetch all data for the user
        const userData = await transcribeSummaryModel.find({ userId });

        if (!userData || userData.length === 0) {
            return res.status(404).json({ message: 'No data found for this user.' });
        }

        res.status(200).json( userData );
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        res.status(500).json({ message: 'Error fetching user data.' });
    }
};