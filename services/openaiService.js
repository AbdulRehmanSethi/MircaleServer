const { OpenAI } = require("openai");
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a response from OpenAI based on the user's message.
 * @param {string} userMessage - The message sent by the user.
 * @returns {string} - The AI-generated response.
 */
const generateResponse = async (messages) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages, // Send the entire message history
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI Error:', error);
        throw new Error('Failed to generate response');
    }
};

/**
 * Generates a conversation name using OpenAI.
 * @param {string} userPrompt - The user's prompt to generate a name from.
 * @returns {string} - The generated conversation name.
 */
const generateConversationName = async (userPrompt) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'Generate a short and relevant conversation name based on the user\'s prompt. Keep it under 5 words.',
                },
                { role: 'user', content: userPrompt },
            ],
            max_tokens: 20,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI Error:', error);
        return "New Chat"; // Fallback name
    }
};

module.exports = { generateResponse, generateConversationName };