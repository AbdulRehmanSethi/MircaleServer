

const OpenAI = require('openai');
const { checkAndUpdateUsage } = require('../../utils/usageChecker');

const fs = require('fs/promises');


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});






exports.generateSummary = async (req, res) => {
    try {
        const { userId, featureName } = req.body;
        const file = req.file;

        if (!file.mimetype || file.mimetype !== 'application/pdf') {
            return res.status(400).json({ message: 'Uploaded file is not a valid PDF.' });
        }

        // Check usage and increment if allowed
        const usageCheckResult = await checkAndUpdateUsage(userId, featureName);
        if (!usageCheckResult.allowed) {
            // Clean up the uploaded file
            await fs.unlink(file.path);

            return res.status(403).json({
                status: "Failed",
                message: usageCheckResult.message,
            });
        }

        const pdfBuffer = await fs.readFile(file.path);

        // Dynamically import pdfjs-dist
        const pdfjs = await import('pdfjs-dist/build/pdf.js');
        const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise;

        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item) => item.str).join(' ');
            text += pageText + '\n';
        }

        if (!text.trim()) {
            // Clean up the uploaded file
            await fs.unlink(file.path);

            return res.status(400).json({ message: 'PDF contains no readable text.' });
        }

        const summary = await generateTextSummary(text);

        // Clean up the uploaded file
        await fs.unlink(file.path);

        res.status(200).json({ summary });
    } catch (error) {
        console.error('Error parsing PDF:', error.message);
        res.status(500).json({
            message: 'Invalid PDF structure or corrupted file.',
            error: error.message,
        });
    }
};


const generateTextSummary = async (text) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that summarizes documents.',
                },
                {
                    role: 'user',
                    content: `Summarize the following text:\n\n${text}`,
                },
            ],
            max_tokens: 500,
            temperature: 0.7,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating summary:', error.message);
        throw new Error('Failed to generate text summary');
    }
};






