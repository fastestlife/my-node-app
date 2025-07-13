const { google } = require('googleapis');
const fs = require('fs');

/**
 * YouTube에 영상 업로드
 * @param {object} auth - 인증된 OAuth 클라이언트
 * @param {object} metadata - 영상 메타데이터 (title, description, tags, playlistId, visibility 등)
 * @param {string} filePath - 업로드할 영상의 로컬 경로
 * @param {string} mimeType - 영상의 MIME 타입
 */
async function uploadVideoToYouTube(auth, metadata, filePath, mimeType) {
  const youtube = google.youtube({ version: 'v3', auth });

  const videoRequest = {
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: parseInt(metadata.category || 22),
      },
      status: {
        privacyStatus: metadata.visibility || 'unlisted',
        madeForKids: false
      },
    },
    media: {
      body: fs.createReadStream(filePath),
      mimeType,
    },
  };

  try {
    const response = await youtube.videos.insert(videoRequest);
    const videoId = response.data.id;
    console.log(`영상 업로드 성공! videoId: ${videoId}`);

     // categoryId 강제 적용
     try {
       const categoryId = Number.isNaN(parseInt(metadata.category))
         ? 22
         : parseInt(metadata.category);

       await youtube.videos.update({
         part: ['snippet'],
         requestBody: {
           id: videoId,
           snippet: {
             title: metadata.title,
             description: metadata.description,
             tags: metadata.tags,
             categoryId,
           },
         },
       });
       console.log('📌 categoryId 강제 적용 완료');
     } catch (updateError) {
       console.warn('⚠️ categoryId 업데이트 실패:', updateError.message || updateError);
     }

    // 플레이리스트에 추가
    if (metadata.playlistId) {
      await youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId: metadata.playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId,
            },
          },
        },
      });
      console.log('플레이리스트에 추가 완료');
    }

    return videoId;
  } catch (err) {
    console.error('YouTube 업로드 오류:', err.message || err);
    throw err;
  }
}

/**
 * 업로드된 영상에 썸네일 이미지 설정
 * @param {string} videoId - 유튜브 영상 ID
 * @param {string} thumbnailPath - 로컬 썸네일 이미지 경로
 * @param {object} auth - 인증된 OAuth 클라이언트
 */
async function uploadThumbnailToYouTube(videoId, thumbnailPath, auth) {
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    const res = await youtube.thumbnails.set({
      videoId,
      media: {
        mimeType: 'image/jpeg',
        body: fs.createReadStream(thumbnailPath),
      },
    });

    console.log('썸네일 업로드 완료');
  } catch (err) {
    console.error('썸네일 업로드 실패:', err.message || err);
    throw err;
  }
}

module.exports = {
  uploadVideoToYouTube,
  uploadThumbnailToYouTube,
};