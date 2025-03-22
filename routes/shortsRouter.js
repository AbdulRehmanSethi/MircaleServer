// const express = require('express');
// const { generateVideo } = require('../Controllers/shorts/shortsGenerator');


// const shortsRouter = express.Router();

// shortsRouter.post('/generate-video', generateVideo);

// module.exports = shortsRouter;

const express = require('express');
const { generateVideoShort, getAllPromptToShortsByUserId } = require('../Controllers/shorts/shortsGenerator');
const { generateFromURL, getAllUrlToShortsByUserId } = require('../Controllers/urlToShorts/urlShortController');

const shortsRouter = express.Router();

shortsRouter.post('/generate-video', generateVideoShort);
shortsRouter.post('/generate-from-url', generateFromURL);
shortsRouter.post('/getallurltoshorts', getAllUrlToShortsByUserId);
shortsRouter.post('/getallprompttoshorts', getAllPromptToShortsByUserId);


module.exports = shortsRouter;