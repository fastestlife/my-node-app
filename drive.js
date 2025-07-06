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
 * 업로드 성공 후 파일을 FINISH 폴더로 이동 + 리네이밍 (timestamp 기반)
 * @param {string} fileId - 이동할 파일 ID
 * @param {boolean} isLong - 롱폼 여부
 * @param {object} auth - 인증된 OAuth 클라이언트
 */
async function moveFileToFinishFolder(fileId, isLong, auth) {
  const drive = google.drive({ version: 'v3', auth });

  const targetFolderId = isLong
    ? process.env.LONGFORM_FINISH_FOLDER_ID
    : process.env.SHORTFORM_FINISH_FOLDER_ID;

  try {
    const file = await drive.files.get({
      fileId,
      fields: 'parents, name'
    });

    const previousParents = file.data.parents
      ? file.data.parents.join(',')
      : '';

    const oldName = file.data.name;
    const extension = path.extname(oldName);
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const suffix = isLong ? '_long' : '_short';
    const newName = `${timestamp}${suffix}${extension}`;

    await drive.files.update({
      fileId,
      addParents: targetFolderId,
      removeParents: previousParents,
      requestBody: {
        name: newName
      },
      fields: 'id, parents, name'
    });

    console.log(`파일이 FINISH 폴더로 이동되었고 이름이 변경되었습니다: ${newName}`);
  } catch (err) {
    console.error('파일 이동/리네이밍 실패:', err.message || err);
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
  moveFileToFinishFolder,
  downloadThumbnail
};