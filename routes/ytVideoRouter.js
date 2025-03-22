const express = require('express');
const { getVideoSummary, getVideoTranscript, getAllTranscribeSummary } = require('../Controllers/ytVideo/ytVideoCtrl');

const ytRouter = express.Router();

ytRouter.post('/summarize', getVideoSummary);

ytRouter.post('/transcript', getVideoTranscript);

ytRouter.post('/getalltranscribesummary', getAllTranscribeSummary);


// router.post('/generate-shorts', generateShorts);

module.exports = ytRouter;
