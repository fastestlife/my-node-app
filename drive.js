const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Google Drive에서 파일 다운로드 (영상 파일)
 * @param {string} fileId - 다운로드할 파일의 ID
 * @param {object} auth - 인증된 OAuth 클라이언트
 * @returns {Promise<{filePath: string, mimeType: string, originalName: string}>}
 */
async function downloadFile(fileId, auth) {
  const drive = google.drive({ version: 'v3', auth });

  try {
    const metadata = await drive.files.get({
      fileId,
      fields: 'name, mimeType'
    });

    const fileName = metadata.data.name;
    const mimeType = metadata.data.mimeType;

    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, fileName);
    const dest = fs.createWriteStream(filePath);

    await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    ).then(res => {
      return new Promise((resolve, reject) => {
        res.data
          .on('end', () => resolve())
          .on('error', err => reject(err))
          .pipe(dest);
      });
    });

    console.log(`파일 다운로드 완료: ${filePath}`);
    return { filePath, mimeType, originalName: fileName };

  } catch (err) {
    console.error('파일 다운로드 실패:', err.message);
    throw err;
  }
}

/**
 * 썸네일 이미지 파일 다운로드 (timestamp 기반 리네이밍)
 * @param {string} fileId - 썸네일 파일의 ID
 * @param {object} auth - 인증된 OAuth 클라이언트
 * @returns {Promise<{filePath: string, fileName: string}>}
 */
async function downloadThumbnail(fileId, auth) {
  const drive = google.drive({ version: 'v3', auth });

  try {
    const metadata = await drive.files.get({
      fileId,
      fields: 'name'
    });

    const originalName = metadata.data.name;
    const ext = path.extname(originalName) || '.jpg';

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const fileName = `${timestamp}_thumbnail${ext}`;
    const filePath = path.join(os.tmpdir(), fileName);
    const dest = fs.createWriteStream(filePath);

    await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    ).then(res => {
      return new Promise((resolve, reject) => {
        res.data
          .on('end', () => resolve())
          .on('error', err => reject(err))
          .pipe(dest);
      });
    });

    console.log(`썸네일 다운로드 완료: ${filePath}`);
    return { filePath, fileName };
  } catch (err) {
    console.error('썸네일 다운로드 실패:', err.message);
    throw err;
  }
}

module.exports = {
  downloadFile,
  downloadThumbnail
};