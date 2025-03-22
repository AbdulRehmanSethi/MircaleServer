const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { OpenAI } = require('openai');
const cleanupScheduler = require('../../utils/cleanupScheduler');
const { checkAndUpdateUsage } = require('../../utils/usageChecker');
const promptToShortsModel = require('../../models/promptToShortsModel');
const basePath = path.join(__dirname, '../../public');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Pexels API client
const pexelsClient = axios.create({
  baseURL: 'https://api.pexels.com/v1/',
  headers: { Authorization: process.env.PEXELS_API_KEY },
});

// Helper to ensure directories exist
function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to generate a random folder name
function generateRandomFolderName() {
  const length = 25;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Function to clean up intermediate files
function cleanUpGeneratedFiles(folderPath, excludeFile) {
  fs.readdirSync(folderPath).forEach((file) => {
    const filePath = path.join(folderPath, file);
    if (filePath !== excludeFile) {
      fs.unlinkSync(filePath);
    }
  });
}

// Generate a clean script using OpenAI
async function generateCleanScript(prompt) {
  console.log('Generating refined script...');
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a professional scriptwriter. Write an engaging, concise 1-minute narration script based on the provided prompt. Avoid including video directions, timestamps, or unnecessary words. The tone should be captivating, clear, and aligned with YouTube Shorts standards.',
      },
      { role: 'user', content: `Write a script for the following topic: "${prompt}"` },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  const script = response.choices[0].message.content
    .replace(/\(\d{2}:\d{2} - \d{2}:\d{2}\)/g, '') // Remove timestamps
    .replace(/\b(fade in|fade out|transition)\b/gi, '') // Remove unnecessary effects
    .trim();

  console.log('Refined script generated:', script);
  return script;
}

// Generate TTS audio
async function generateTTS(script, outputPath) {
  const API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

  console.log('Generating TTS audio...');
  const response = await axios.post(
    url,
    {
      input: { text: script },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const audioContent = response.data.audioContent;
  fs.writeFileSync(outputPath, audioContent, 'base64');
  console.log(`Audio content written to file: ${outputPath}`);
}

// Generate search keywords using OpenAI
async function generateSearchKeywords(script) {
  console.log('Generating search keywords...');
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Extract specific, meaningful, and actionable keywords to optimize video search based on the provided script. Focus on identifying entities, places, and concepts directly tied to the narration.`,
      },
      { role: 'user', content: `Extract keywords from this script: "${script}"` }
    ],
    max_tokens: 100,
    temperature: 0.7,
  });

  const rawKeywords = response.choices[0]?.message?.content || '';
  const keywords = rawKeywords
    .split(',')
    .map((kw) => kw.trim())
    .filter((kw) => kw.length > 2);

  console.log('Generated keywords:', keywords);
  return keywords;
}

// Fetch videos based on keywords with portrait orientation
async function fetchMediaUsingKeywords(keywords) {
  console.log(`Fetching videos using keywords: ${keywords}`);
  const results = [];
  keywords = keywords.slice(0, 5); // Limit to 5 keywords

  for (const keyword of keywords) {
    try {
      console.log(`Fetching video for keyword: ${keyword}`);
      const response = await pexelsClient.get('videos/search', {
        params: {
          query: keyword,
          per_page: 1,
          orientation: 'portrait',
        },
      });

      const fetchedVideos = response.data.videos || [];
      if (fetchedVideos.length > 0) {
        const videoFile = fetchedVideos[0].video_files.find(
          (file) => file.quality === 'hd' && file.file_type === 'video/mp4'
        ) || fetchedVideos[0].video_files[0];

        const videoUrl = videoFile?.link;
        if (videoUrl) {
          console.log(`Fetched video URL for keyword "${keyword}": ${videoUrl}`);
          results.push(videoUrl);
        }
      } else {
        console.warn(`No videos found for keyword: ${keyword}`);
      }
    } catch (err) {
      console.error(`Error fetching video for keyword "${keyword}": ${err.message}`);
    }
  }

  if (results.length === 0) {
    throw new Error('No videos found for the provided keywords.');
  }

  console.log('Fetched video URLs:', results);
  return results;
}

// Download and trim videos dynamically based on script segments
async function downloadAndTrimMedia(mediaLinks, durations, folderPath) {
  const mediaPaths = [];
  ensureDirSync(folderPath);

  for (let i = 0; i < mediaLinks.length; i++) {
    const mediaUrl = mediaLinks[i];
    const mediaPath = path.join(folderPath, `media_${i + 1}.mp4`);
    const duration = durations[i];
    console.log(`Downloading video ${i + 1} from URL: ${mediaUrl}`);

    await axios.get(mediaUrl, { responseType: 'stream' }).then((response) => {
      const writer = fs.createWriteStream(mediaPath);
      response.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    });

    const trimmedPath = path.join(folderPath, `trimmed_video_${i + 1}.mp4`);
    await new Promise((resolve, reject) => {
      ffmpeg(mediaPath)
        .outputOptions(`-t ${duration.toFixed(2)}`)
        .save(trimmedPath)
        .on('end', () => {
          mediaPaths.push(trimmedPath);
          resolve();
        })
        .on('error', reject);
    });
  }

  return mediaPaths;
}

// Combine media into a single video with audio
async function combineMediaWithAudio(mediaPaths, audioPath, outputPath) {
  const fileListPath = path.join(path.dirname(outputPath), 'file_list.txt');
  const fileListContent = mediaPaths
    .map((file) => `file '${file.replace(/\\/g, '/')}'`)
    .join('\n');

  console.log('Generated file_list.txt content:\n', fileListContent);
  fs.writeFileSync(fileListPath, fileListContent);

  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(fileListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .input(audioPath)
      .outputOptions(['-c:v libx264', '-c:a aac', '-shortest'])
      .save(outputPath)
      .on('start', (cmd) => console.log(`FFmpeg command: ${cmd}`))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Video created successfully at ${outputPath}`);
}

// API Endpoint
// exports.generateVideoShort = async (req, res) => {
//   const { prompt, userId, featureName } = req.body;
//   const publicUrl = '/youai/public'; // Base URL for static files
//   const randomFolderName = generateRandomFolderName();
//   const folderPath = path.join(__dirname, '../../public/promptToShorts', randomFolderName);
//   cleanupScheduler.scheduleFolderDeletion(folderPath, 30); // 30 minutes
//   ensureDirSync(folderPath);

//   const ttsPath = path.join(folderPath, 'output.mp3');
//   const finalVideoFileName = 'final_video.mp4';
//   const finalVideoPath = path.join(folderPath, finalVideoFileName);

//   try {
//     console.log('Starting video generation process...');

//     // Check usage and increment if allowed
//     const usageCheckResult = await checkAndUpdateUsage(userId, featureName);
//     if (!usageCheckResult.allowed) {
//       return res.status(403).json({
//         status: "Failed",
//         message: usageCheckResult.message,
//       });
//     }

//     // Step 1: Generate script
//     const script = await generateCleanScript(prompt);
//     const segments = script.split('. ').map((segment) => segment.trim());

//     // Step 2: Generate TTS
//     await generateTTS(script, ttsPath);

//     // Step 3: Generate search keywords
//     const keywords = await generateSearchKeywords(script);

//     // Step 4: Fetch videos using keywords
//     const videos = await fetchMediaUsingKeywords(keywords);

//     // Step 5: Calculate durations
//     const totalDuration = 60;
//     const durationPerSegment = totalDuration / segments.length;

//     // Step 6: Download and trim videos
//     const videoPaths = await downloadAndTrimMedia(videos, Array(segments.length).fill(durationPerSegment), folderPath);

//     // Step 7: Combine videos and audio
//     await combineMediaWithAudio(videoPaths, ttsPath, finalVideoPath);

//     // Clean up intermediate files
//     cleanUpGeneratedFiles(folderPath, finalVideoPath);

//     console.log('Video generation process completed.');

//     // Return the public URL for the video
//     res.status(200).json({
//       message: 'Video generated successfully',
//       videoPath: `${publicUrl}/promptToShorts/${randomFolderName}/${finalVideoFileName}`, // Publicly accessible URL
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error generating video', error: error.message });
//   }
// };


exports.generateVideoShort = async (req, res) => {
  const { prompt, userId, featureName } = req.body;
  const publicUrl = '/youai/public'; // Base URL for static files

  try {
    console.log('Starting video generation process...');

    // Check usage and increment if allowed
    const usageCheckResult = await checkAndUpdateUsage(userId, featureName);
    if (!usageCheckResult.allowed) {
      return res.status(403).json({
        status: "Failed",
        message: usageCheckResult.message,
      });
    }

    // Define folder structure: basePath/userId/promptToShorts/randomFolderName
    const userFolder = path.join(basePath, userId);
    const promptToShortsFolder = path.join(userFolder, 'promptToShorts');
    const randomFolderName = generateRandomFolderName();
    const folderPath = path.join(promptToShortsFolder, randomFolderName);

    // Ensure directory exists
    fs.mkdirSync(folderPath, { recursive: true, mode: 0o755 });

    // Schedule folder deletion after 30 minutes
    cleanupScheduler.scheduleFolderDeletion(folderPath, 30);

    const ttsPath = path.join(folderPath, 'output.mp3');
    const finalVideoFileName = 'final_video.mp4';
    const finalVideoPath = path.join(folderPath, finalVideoFileName);

    // Step 1: Generate script
    const script = await generateCleanScript(prompt);
    const segments = script.split('. ').map((segment) => segment.trim());

    // Step 2: Generate TTS
    await generateTTS(script, ttsPath);

    // Step 3: Generate search keywords
    const keywords = await generateSearchKeywords(script);

    // Step 4: Fetch videos using keywords
    const videos = await fetchMediaUsingKeywords(keywords);

    // Step 5: Calculate durations
    const totalDuration = 60;
    const durationPerSegment = totalDuration / segments.length;

    // Step 6: Download and trim videos
    const videoPaths = await downloadAndTrimMedia(videos, Array(segments.length).fill(durationPerSegment), folderPath);

    // Step 7: Combine videos and audio
    await combineMediaWithAudio(videoPaths, ttsPath, finalVideoPath);

    // Clean up intermediate files
    cleanUpGeneratedFiles(folderPath, finalVideoPath);

    console.log('Video generation process completed.');

    // Construct public URL
    const finalVideoPublicUrl = `${publicUrl}/${userId}/promptToShorts/${randomFolderName}/${finalVideoFileName}`;

    // Store data in the database
    const shortData = await promptToShortsModel.create({
      userId,
      prompt,
      folderPath,
      shortPath: finalVideoPublicUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Expires in 30 minutes
    });

    res.status(200).json({
      success: true,
      message: 'Video generated successfully',
      shorts: [finalVideoPublicUrl],
      expiresAt: shortData.expiresAt.toISOString(),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating video', error: error.message });
  }
};

exports.getAllPromptToShortsByUserId = async (req, res) => {
  const { userId } = req.body; // Extract userId from the request body

  try {
      // Fetch all shorts associated with the given userId
      const shorts = await promptToShortsModel.find({ userId });
 

      if (shorts.length === 0) {
          return res.status(404).json({
              status: "Failed",
              message: "No shorts found for the given user ID",
          });
      }

      // Map through the shorts to include only necessary information
      const shortsList = shorts.map(short => ({
          id: short._id,
          prompt: short.prompt,
          shortPath: short.shortPath,
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