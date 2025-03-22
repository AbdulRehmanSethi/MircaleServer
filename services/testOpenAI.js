const { generateResponse } = require('./openaiService');

(async () => {
    try {
        const userMessage = "What is the capital of France?";
        const response = await generateResponse(userMessage);
        console.log('AI Response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
})();