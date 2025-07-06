const { google } = require('googleapis');

/**
 * 구글 시트에서 영상 메타데이터를 가져오는 함수
 * @param {string} fileName - 영상 파일명 (예: 'abc_long.mp4')
 * @param {object} auth - 인증된 OAuth2 클라이언트 객체
 * @returns {Promise<object|null>} - 메타데이터 객체 또는 null
 */
async function fetchMetadataFromSheets(fileName, auth) {
  const sheets = google.sheets({ version: 'v4', auth });

  const spreadsheetId = '1kqemYKybH00eKY5Qpa7lisYycrC6cfjGkcXOZlu7BtI'; // D시트 ID
  const sheetName = 'D_Sheet';
  const range = `${sheetName}!A2:H`;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('❌ 시트에 데이터가 없습니다.');
      return null;
    }

    // 첫 번째 열이 fileName 열이라고 가정
    for (const row of rows) {
      if (row[0] === fileName) {
        return {
          fileName: row[0],
          title: row[1],
          description: row[2],
          tags: row[3],
          thumbnailFileName: row[4],
          category: row[5],
          visibility: row[6],
          playlist: row[7],
        };
      }
    }

    console.log(`❌ 해당 파일명을 찾을 수 없습니다: ${fileName}`);
    return null;
  } catch (error) {
    console.error('❌ Sheets API 에러:', error.message);
    return null;
  }
}

module.exports = { fetchMetadataFromSheets };