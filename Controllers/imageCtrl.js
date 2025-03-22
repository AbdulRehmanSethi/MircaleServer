// const fs = require("fs");
// const path = require("path");
// const { OpenAI } = require("openai");
// const vision = require("@google-cloud/vision"); // Google Vision API

// // Load environment variables
// require("dotenv").config();

// // Initialize Google Vision client
// const client = new vision.ImageAnnotatorClient();

// // Function to process images and generate a new image
// const processImages = async (req, res) => {
//     try {
//         const { files } = req;

//         // Validate file count
//         if (!files || files.length < 2 || files.length > 3) {
//             return res.status(400).json({
//                 message: "Please upload at least 2 and at most 3 images.",
//             });
//         }

//         // Analyze the content of each image
//         const descriptions = [];
//         for (const file of files) {
//             const filePath = path.join(__dirname, "../uploads", file.filename);
//             const [result] = await client.labelDetection(filePath);
//             const labels = result.labelAnnotations.map((label) => label.description);
//             descriptions.push(labels.join(", "));
//         }

//         // Dynamically generate a prompt based on image content
//         const prompt = generateDynamicPrompt(descriptions);

//         // Generate the image using OpenAI's DALL·E
//         const generatedImageUrl = await generateImage(prompt);

//         // Cleanup uploaded files to avoid storage issues
//         files.forEach((file) =>
//             fs.unlinkSync(path.join(__dirname, "../uploads", file.filename))
//         );

//         // Respond with the generated image URL
//         res.status(200).json({
//             message: "Image generated successfully.",
//             imageUrl: generatedImageUrl,
//         });
//     } catch (error) {
//         console.error("Error processing images:", error.message);

//         res.status(500).json({
//             message: "An error occurred while processing the images.",
//             error: error.message,
//         });
//     }
// };

// // Function to dynamically generate a prompt based on image descriptions
// const generateDynamicPrompt = (descriptions) => {
//     return `
//         Combine the following themes into a single artistic image:
//         ${descriptions.join(" | ")}.
//         Create a visually appealing and cohesive scene based on these themes.
//     `;
// };

// // Function to generate an image using OpenAI's DALL·E
// const generateImage = async (prompt) => {
//     try {
//         const openai = new OpenAI({
//             apiKey: process.env.OPENAI_API_KEY,
//         });

//         const response = await openai.images.generate({
//             prompt,
//             n: 1,
//             size: "1024x1024",
//         });

//         if (!response || !response.data || !response.data[0].url) {
//             throw new Error("Failed to generate an image.");
//         }

//         return response.data[0].url;
//     } catch (error) {
//         console.error("Error generating image:", error.message);
//         throw new Error("Image generation failed.");
//     }
// };

// module.exports = {
//     processImages,
// };


const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");
const { OpenAI } = require("openai");

const OCR_API_URL = "https://api.ocr.space/parse/image";
const OCR_API_KEY = "K88473487388957";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const validateFile = (filePath) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const ext = path.extname(filePath).toLowerCase();
    return allowedExtensions.includes(ext);
};

const preprocessImage = async (filePath) => {
    const processedPath = `${filePath}-processed.jpg`;
    await sharp(filePath)
        .resize(1024, 1024, { fit: "inside" })
        .toFormat("jpeg")
        .toFile(processedPath);
    return processedPath;
};

const processImages = async (req, res) => {
    console.log("Starting processImages...");

    try {
        const { files } = req;

        if (!files || files.length < 2 || files.length > 3) {
            return res.status(400).json({
                message: "Please upload at least 2 and at most 3 images.",
            });
        }

        const descriptions = [];
        for (const file of files) {
            const filePath = path.join(__dirname, "../uploads", file.filename);

            if (!validateFile(filePath)) {
                throw new Error(`Unsupported file type for ${filePath}.`);
            }

            try {
                const processedPath = await preprocessImage(filePath);
                const description = await describeImageWithOCR(processedPath);
                descriptions.push(description);
                fs.unlinkSync(processedPath); // Clean up the processed file
            } catch (error) {
                console.error(`Error processing file ${file.filename}:`, error.message);
                throw new Error(`Failed to process file ${file.filename}.`);
            }
        }

        const prompt = generateDynamicPrompt(descriptions);
        const generatedImageUrl = await generateImage(prompt);

        files.forEach((file) => {
            const filePath = path.join(__dirname, "../uploads", file.filename);
            fs.unlinkSync(filePath); // Clean up original files
        });

        res.status(200).json({
            message: "Image generated successfully.",
            imageUrl: generatedImageUrl,
        });
    } catch (error) {
        console.error("Error processing images:", error.message);
        res.status(500).json({
            message: "An error occurred while processing the images.",
            error: error.message,
        });
    }
};

module.exports = {
    processImages,
};