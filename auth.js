// auth.js
const { google } = require('googleapis');

function getAuthenticatedClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });

  return oauth2Client;
}

module.exports = { getAuthenticatedClient };