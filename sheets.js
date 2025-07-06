const { google } = require('googleapis');

async function fetchMetadataFromSheets(fileName, auth) {
  const sheets = google.sheets({ version: 'v4', auth });

  const spreadsheetId = '1kqemYKybH00eKY5Qpa7lisYycrC6cfjGkcXOZlu7BtI'; // D시트 ID
  const sheetName = 'D_Sheet';

  try {
    const range = `${sheetName}!A2:H1000`; // A열: Video File Name ~ H열: Playlist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      throw new Error('시트에 데이터가 없습니다.');
    }

    const matchedRow = rows.find(row =>
      String(row[0]).trim().toLowerCase() === fileName.trim().toLowerCase()
    );

    if (!matchedRow) {
      throw new Error(`"${fileName}"에 해당하는 메타데이터를 찾을 수 없습니다.`);
    }

    return {
      title: matchedRow[1] || '',
      description: matchedRow[2] || '',
      tags: matchedRow[3] ? matchedRow[3].split(',').map(tag => tag.trim()) : [],
      thumbnail: matchedRow[4] || '',
      categoryId: matchedRow[5] || '22',
      visibility: matchedRow[6] || 'unlisted',
      playlistId: matchedRow[7] || ''
    };

  } catch (err) {
    console.error('❌ Sheets API 에러:', err.message);
    throw err;
  }
}

module.exports = { fetchMetadataFromSheets };