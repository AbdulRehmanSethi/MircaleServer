// const { google } = require('googleapis');
// require('dotenv').config();

// // const oauth2Client = new google.auth.OAuth2(
// //     process.env.CLIENT_ID,
// //     process.env.CLIENT_SECRET,
// //     "https://developers.google.com/oauthplayground"
// // );

// // // Generate the authorization URL
// // const authUrl = oauth2Client.generateAuthUrl({
// //     access_type: 'offline',
// //     scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
// // });

// // console.log('Authorize this app by visiting this URL:', authUrl);



// // Initialize OAuth2 Client
// const oauth2Client = new google.auth.OAuth2(
//     process.env.CLIENT_ID,
//     process.env.CLIENT_SECRET,
//     "https://developers.google.com/oauthplayground"
// );

// // Function to exchange authorization code for tokens
// const getToken = async (code) => {
//     try {
//         const { tokens } = await oauth2Client.getToken(code);
//         console.log('Access Token:', tokens.access_token);
//         console.log('Refresh Token:', tokens.refresh_token);
//         console.log('Tokens:', tokens); // Optional: print all tokens
//     } catch (error) {
//         console.error('Error fetching tokens:', error.message);
//     }
// };

// // Replace 'your_authorization_code_here' with the code you receive from the OAuth URL
// const authorizationCode = '4/0AanRRrsWebHRCwGZy3IKgZBz6_fMMpBblAHU8FneDPxjxa7PZAWh3sqPndL7UBEWjmnNDQ';
// getToken(authorizationCode);
