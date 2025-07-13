require('dotenv').config(); // .env 파일 로드

const express = require('express');
const axios = require('axios');
const fs = require('fs');
// OAuth 인증 모듈
const { getAuthenticatedClient } = require('./auth');
// 구글 API
const { google } = require('googleapis');
// 메타데이터 조회
const { fetchMetadataFromSheets } = require('./sheets');
// 파일 다운로드 업로드 성공 후 FINISH 폴더로 이동
const { downloadFile, moveFileToFinishFolder, downloadThumbnail } = require('./drive');
// 유튜브 업로드
const { uploadVideoToYouTube, uploadThumbnailToYouTube } = require('./youtube');


const app = express();

// PORT 환경변수 확인 (없으면 3000 기본값)
const PORT = process.env.PORT;

app.use(express.json());

// 서버 상태 확인용 엔드포인트 
app.get('/healthcheck', (req, res) => {
  res.status(200).send('Server is up and running!');
});


// Google OAuth 인증 시작 (/auth 라우터) 
app.get('/auth', (req, res) => {
  const redirect_uri = process.env.REDIRECT_URI;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${redirect_uri}&scope=https://www.googleapis.com/auth/youtube.upload%20https://www.googleapis.com/auth/drive.readonly&access_type=offline&prompt=consent`;

  res.redirect(authUrl);
});

// Google OAuth 인증 완료 후 콜백 처리 (/oauth2callback 라우터) 
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  const redirect_uri = process.env.REDIRECT_URI;

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri,
      grant_type: 'authorization_code'
    });

    // 토큰 파일 저장
    fs.writeFileSync('tokens.json', JSON.stringify(response.data, null, 2));
    res.send('인증 완료! 토큰이 저장되었습니다.'); 
  } catch (error) {
    console.error('OAuth 인증 오류:', error.response?.data || error.message);
    res.status(500).send('인증 실패'); 
  }
});

app.post('/upload', async (req, res) => {
  const { fileName, fileId, isLong } = req.body;

  console.log('📩 업로드 요청 수신됨:', { fileName, fileId, isLong });

  if (!fileName || !fileId) {
    return res.status(400).send({ error: 'fileName과 fileId는 필수입니다.' });
  }

  try {
    console.log('🔑 OAuth 인증 시작');
    const auth = getAuthenticatedClient();
    console.log('✅ OAuth 인증 완료');

    // 1. 시트에서 메타데이터 가져오기
    console.log('📄 시트에서 메타데이터 가져오는 중...');
    const metadata = await fetchMetadataFromSheets(fileName, auth);
    console.log('✅ 메타데이터 가져오기 성공:', metadata);

    // 2. 드라이브에서 파일 다운로드
    console.log('📥 드라이브에서 영상 파일 다운로드 중...');
    const { filePath, mimeType } = await downloadFile(fileId, auth);
    console.log('✅ 파일 다운로드 완료:', filePath, mimeType);

    // 3. 유튜브 업로드
    console.log('📤 유튜브 업로드 시작...');
    const videoId = await uploadVideoToYouTube(auth, metadata, filePath, mimeType);
    console.log('✅ 유튜브 업로드 완료, videoId:', videoId);

    // 4. 썸네일 파일이 있다면 → 다운로드 후 업로드
    if (metadata.thumbnailFileId) {
     console.log('🖼️ 썸네일 파일 다운로드 중...');
     const { filePath: thumbnailPath } = await downloadThumbnail(metadata.thumbnailFileId, auth);
     console.log('✅ 썸네일 다운로드 완료:', thumbnailPath);
  
     console.log('📤 썸네일 유튜브 업로드 중...');
     await uploadThumbnailToYouTube(videoId, thumbnailPath, auth);
     console.log('✅ 썸네일 업로드 완료');
    }

    // 5. 업로드 성공 후 FINISH 폴더로 이동
    console.log('📂 파일 FINISH 폴더로 이동 중...');
    await moveFileToFinishFolder(fileId, isLong, auth);
    console.log('✅ FINISH 폴더 이동 완료');
    
    res.status(200).send({ message: '업로드 성공', videoId });
  } catch (err) {
    console.error('업로드 실패:', err.message || err);
    res.status(500).send({ error: '업로드 중 오류 발생' });
  }
});

// 서버 실행 
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});