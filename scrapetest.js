// const axios = require('axios');

// const token = 'd724c164fbe64a00b05c019b1cbe70e3f2235ea2428';
// const sessionId = '1234';
// const targetUrl = 'https://httpbin.org/ip';

// const proxyConfig = {
//     protocol: 'http',
//     host: 'proxy.scrape.do',
//     port: 8080,
//     auth: {
//         username: token,
//         password: 'maddy22442'
//     }
// };

// const testRequest = async () => {
//     try {
//         console.log('Sending request to:', targetUrl);
//         console.log('Using proxy:', proxyConfig);

//         // Construct the full URL with the token and sessionId as query parameters
//         const fullUrl = `https://api.scrape.do?token=${token}&url=${encodeURIComponent(targetUrl)}&sessionId=${sessionId}`;

//         const response = await axios({
//             method: 'GET',
//             url: fullUrl,
//             // Disable the proxy as the request is being sent directly to Scrape.do
//             proxy: false
//         });

//         console.log('Response data:', response.data);
//     } catch (error) {
//         console.error('Proxy Test Error:', error.message);
//         console.error('Response status:', error.response?.status);
//         console.error('Response data:', error.response?.data);
//     }
// };

// testRequest();

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// const youtubedl = require('youtube-dl-exec');

// async function downloadVideo(url, outputPath) {
//     try {
//         await youtubedl(url, {
//             output: outputPath,
//             format: 'bestvideo+bestaudio'
//         });
//         console.log("Download complete:", outputPath);
//     } catch (error) {
//         console.error("Download failed:", error.message);
//     }
// }

// downloadVideo('https://www.youtube.com/watch?v=cbA0TqUY8JQ&ab', 'video');

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');
const fs = require('fs');

// Create FormData and append files
const form = new FormData();
form.append('images', fs.createReadStream(path.join(__dirname, 'uploads', 'IMG_0929.jpg')));
form.append('images', fs.createReadStream(path.join(__dirname, 'uploads', 'IMG_0930.jpg')));
form.append('images', fs.createReadStream(path.join(__dirname, 'uploads', 'IMG_0932.jpg')));

// Log headers for debugging
console.log('Form headers:', form.getHeaders());

// Send request with correct Content-Type and headers
axios.post('http://localhost:8080/youai/images/process-images', form, {
    headers: {
        ...form.getHeaders(), // Add the headers from the form
        'Content-Length': form.getLengthSync(), // Ensure Content-Length is set
    }
}).then(response => {
    console.log('Server response:', response.data);
}).catch(error => {
    console.error('Error occurred:', error.response ? error.response.data : error.message);
});


// C:\Users\mohai>
// curl -X POST http://localhost:8080/youai/images/process-images ^
// More?   -F "images=@E:\\YouAI\\server\\uploads\\IMG_0929.jpg" ^
// More?   -F "images=@E:\\YouAI\\server\\uploads\\IMG_0930.jpg" ^
// More?   -F "images=@E:\\YouAI\\server\\uploads\\IMG_0932.jpg"

