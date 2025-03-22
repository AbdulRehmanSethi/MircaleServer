// const pdfParse = require("pdf-parse");
const { checkAndUpdateUsage } = require('../../utils/usageChecker');
const pdfParse = require("pdf-parse");
exports.extractTextFromPdf = async (req, res) => {
  try {
    const { userId, featureName } = req.body;

    if (!req.files || !req.files.pdf) {
      return res.status(400).send("No PDF file uploaded.");
    }

    // Check usage and increment if allowed
    const usageCheckResult = await checkAndUpdateUsage(userId, featureName);
    if (!usageCheckResult.allowed) {
      return res.status(403).json({
        status: "Failed",
        message: usageCheckResult.message,
      });
    }

    const pdfBuffer = req.files.pdf.data;

    try {
      const data = await pdfParse(pdfBuffer);
      res.send(data.text);
    } catch (error) {
      res.status(500).send("Error extracting text from PDF.");
    }
  } catch (error) {
    console.error('Error extracting text from PDF:', error.message);
    res.status(500).send("Error extracting text from PDF.");
  }
};
