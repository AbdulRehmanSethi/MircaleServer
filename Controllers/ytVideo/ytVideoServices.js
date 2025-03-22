const { YoutubeTranscript } = require('youtube-transcript');
const OpenAI = require('openai');
require('dotenv').config();

exports.fetchTranscript = async (youtubeLink) => {
    const videoId = getYouTubeVideoId(youtubeLink);
    if (!videoId) {
        throw new Error('Invalid YouTube link');
    }

    // Fetch video transcript
    const transcript = await fetchVideoTranscript(videoId);
    return transcript;
};

// Fetch video transcript using YoutubeTranscript
const fetchVideoTranscript = async (videoId) => {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        return transcript.map((entry) => entry.text).join(' ');
    } catch (error) {
        console.error('Error fetching transcript:', error.message);
        throw new Error('Unable to fetch transcript for this video.');
    }
};



exports.generateSummary = async (youtubeLink) => {
    const videoId = getYouTubeVideoId(youtubeLink);
    if (!videoId) {
        throw new Error('Invalid YouTube link');
    }

    // Fetch transcript first
    const transcript = await fetchVideoTranscript(videoId);
    if (!transcript) {
        throw new Error('Transcript not available for this video');
    }

    // Generate summary from the transcript
    const summary = await generateTextSummary(transcript);
    return summary;
};

// Extract YouTube video ID from the link
const getYouTubeVideoId = (url) => {
    if (typeof url !== 'string') {
        throw new TypeError('URL must be a string');
    }

    const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/) ||
        url.match(/(?:https?:\/\/)?youtu\.be\/([^?&]+)/);

    return match ? match[1] : null;
};

// Generate summary using OpenAI
const generateTextSummary = async (text) => {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            {
                role: 'system',
                content: 'You are a helpful assistant that summarizes YouTube video transcripts.',
            },
            {
                role: 'user',
                content: `Summarize the following transcript:\n\n${text}`,
            },
        ],
        max_tokens: 150,
        temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
};


// const { YoutubeTranscript } = require('youtube-transcript');
// const OpenAI = require('openai');
// require('dotenv').config();

// const cleanTranscript = (transcript) => {
//     return transcript
//         .replace(/\[.*?\]/g, '') // Remove annotations like [Music], [Laughter]
//         .replace(/\s\s+/g, ' ') // Remove extra whitespace
//         .trim(); // Trim leading/trailing whitespace
// };

// const summarizeTranscript = async (transcript) => {
//     const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//     const response = await openai.chat.completions.create({
//         model: "gpt-4",
//         messages: [
//             { role: "system", content: "Summarize this transcript to retain key points while removing unnecessary details." },
//             { role: "user", content: transcript },
//         ],
//     });
//     return response.choices[0].message.content;
// };

// exports.fetchTranscript = async (youtubeLink) => {
//     const videoId = getYouTubeVideoId(youtubeLink);
//     if (!videoId) {
//         throw new Error('Invalid YouTube link');
//     }

//     const transcript = await fetchVideoTranscript(videoId);
//     const cleanedTranscript = cleanTranscript(transcript);
//     const summarizedTranscript = await summarizeTranscript(cleanedTranscript);
//     return summarizedTranscript;
// };

// const fetchVideoTranscript = async (videoId) => {
//     try {
//         const transcript = await YoutubeTranscript.fetchTranscript(videoId);
//         return transcript.map((entry) => entry.text).join(' ');
//     } catch (error) {
//         console.error('Error fetching transcript:', error.message);
//         throw new Error('Unable to fetch transcript for this video.');
//     }
// };



// exports.generateSummary = async (youtubeLink) => {
//     const videoId = getYouTubeVideoId(youtubeLink);
//     if (!videoId) {
//         throw new Error('Invalid YouTube link');
//     }

//     // Fetch transcript first
//     const transcript = await fetchVideoTranscript(videoId);
//     if (!transcript) {
//         throw new Error('Transcript not available for this video');
//     }

//     // Generate summary from the transcript
//     const summary = await generateTextSummary(transcript);
//     return summary;
// };

// // Extract YouTube video ID from the link
// const getYouTubeVideoId = (url) => {
//     if (typeof url !== 'string') {
//         throw new TypeError('URL must be a string');
//     }

//     const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/) ||
//         url.match(/(?:https?:\/\/)?youtu\.be\/([^&]+)/);
//     return match ? match[1] : null;
// };

// // Generate summary using OpenAI
// const generateTextSummary = async (text) => {
//     const openai = new OpenAI({
//         apiKey: process.env.OPENAI_API_KEY,
//     });

//     const response = await openai.chat.completions.create({
//         model: 'gpt-4',
//         messages: [
//             {
//                 role: 'system',
//                 content: 'You are a helpful assistant that summarizes YouTube video transcripts.',
//             },
//             {
//                 role: 'user',
//                 content: `Summarize the following transcript:\n\n${text}`,
//             },
//         ],
//         max_tokens: 150,
//         temperature: 0.7,
//     });

//     return response.choices[0].message.content.trim();
// };
