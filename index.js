const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 상태 확인
app.get('/healthcheck', (req, res) => {
  res.status(200).send('Server is up and running!');
});

// Webhook 수신
app.post('/upload', (req, res) => {
  console.log('Webhook received:', req.body);
  res.status(200).send({ message: 'Upload webhook received successfully.' });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});