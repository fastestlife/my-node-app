const express = require('express');
const app = express();

const PORT = process.env.PORT;
if (!PORT) {
  throw new Error('Render requires process.env.PORT to be defined');
}

app.use(express.json());

app.get('/healthcheck', (req, res) => {
  res.status(200).send('Server is up and running!');
});

app.post('/upload', (req, res) => {
  console.log('Webhook received:', req.body);
  res.status(200).send({ message: 'Upload webhook received successfully.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});