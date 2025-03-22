const express = require("express");
const { extractTextFromPdf } = require("../Controllers/PDF/pdfCtrl");
const pdfRouter = express.Router();

pdfRouter.post("/extract-text", extractTextFromPdf);

module.exports = pdfRouter;
