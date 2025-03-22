const vision = require('@google-cloud/vision');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { checkAndUpdateUsage } = require('../../utils/usageChecker');

const client = new vision.ImageAnnotatorClient();


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });




async function processImages(req, res) {
    try {
        const files = req.files;
        const { userId, featureName } = req.body;
        console.log(req.body);



        if (files.length !== 3) {
            return res.status(400).json({ error: 'Please upload exactly 3 images.' });
        }

        // Check usage and increment if allowed
        const usageCheckResult = await checkAndUpdateUsage(userId, featureName);
        if (!usageCheckResult.allowed) {
            return res.status(403).json({
                status: "Failed",
                message: usageCheckResult.message,
            });
        }

        let allLabels = new Set(); // Using a Set to store unique labels
        let filePaths = [];

        for (let file of files) {
            const filePath = path.join(__dirname, '../../uploads', file.filename);
            filePaths.push(filePath); // Store file paths for deletion later

            if (!fs.existsSync(filePath)) {
                return res.status(400).json({ error: `File not found: ${file.filename}` });
            }

            const imageBuffer = fs.readFileSync(filePath);

            // Use Vision API to extract all labels
            const [result] = await client.labelDetection(imageBuffer);
            const labels = result.labelAnnotations.map(label => label.description);

            labels.forEach(label => allLabels.add(label)); // Add labels to Set to ensure uniqueness
        }

        // Convert Set to Array for processing
        const uniqueLabels = Array.from(allLabels);

        // Step 1: Use GPT to generate a properly formatted image generation prompt
        const gptResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You generate precise and structured prompts for AI image generation, ensuring all provided elements are combined into a single, visually coherent image. " },
                {
                    role: "user",
                    content: `I have extracted key visual elements from three images. These are the unique visual elements detected:
                    
                    **${uniqueLabels.join(', ')}**
                    
                    Generate a highly detailed and structured prompt that seamlessly blends these elements into a **single** visually cohesive and realistic AI-generated image. 
                    
                    🔹 **Rules:**
                    - Do **not** create a title or extra description.
                    - Ensure all features are naturally incorporated.
                    - Focus on **realistic composition** instead of a surreal or overly artistic interpretation.
                    - Maintain **clarity, precision, and conciseness**.
                    - Dont generate a prompty that does not followed by safety system.
                    `
                }
            ],
            max_tokens: 200
        });

        const bestPrompt = gptResponse.choices[0].message.content.trim();
        console.log(bestPrompt);

        // Step 2: Generate image using DALL·E with the refined prompta
        const dalleResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: bestPrompt,
            n: 1,
            size: "1024x1024"
        });

        const imageUrl = dalleResponse.data[0].url;

        // Step 3: Delete Uploaded Images After Processing
        filePaths.forEach(filePath => {
            fs.unlink(filePath, (err) => {
                if (err) console.error(`Error deleting file: ${filePath}`, err);
            });
        });

        // Respond with the generated image and extracted descriptions
        res.json({
            message: 'Image generated successfully',
            bestPrompt,
            imageUrl,
            extractedDescriptions: uniqueLabels
        });

    } catch (error) {
        console.error(error);

        // Cleanup: Delete uploaded files in case of any error
        req.files.forEach(file => {
            const filePath = path.join(__dirname, '../../uploads', file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        res.status(500).json({ error: 'Something went wrong.', details: error.message });
    }
}



module.exports = { processImages };
