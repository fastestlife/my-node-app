// auth.js
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, 'tokens.json');

function getAuthenticatedClient() {
  const credentials = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  oauth2Client.setCredentials(credentials); // 🔄 전체 토큰 객체 그대로 넣기

  return oauth2Client;
}

module.exports = { getAuthenticatedClient };