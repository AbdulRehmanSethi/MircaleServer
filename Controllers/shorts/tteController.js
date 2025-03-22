const fetch = require('node-fetch');

exports.generateSpeech = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { text, voice } = req.body;
    if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Valid text is required." });
    }

    const API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                input: { text },
                voice: {
                    languageCode: "cmn-TW",
                    name: voice ? voice : "cmn-TW-Wavenet-A",
                },
                audioConfig: {
                    audioEncoding: "MP3",
                    speakingRate: 0.75, // Slow down speech (0.5 to 1.0 is slow range)
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Google TTS API Error:", errorData);
            throw new Error(`API error: ${response.statusText} - ${errorData}`);
        }

        const data = await response.json();
        return res.status(200).json({ audioContent: data.audioContent });
    } catch (error) {
        console.error("Error calling Google TTS API:", error.message);
        res
            .status(500)
            .json({ error: error.message || "Failed to generate speech." });
    }
};