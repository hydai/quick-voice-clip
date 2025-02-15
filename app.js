// app.js
const express = require('express');
const app = express();
const port = 3000;
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
app.post('/upload', upload.single('file'), (req, res) => {
  const uploadedFile = req.file.path;
  const outputDir = 'public/audios/';
  const outputFileName = `${Date.now()}.mp3`;
  const outputFilePath = path.join(outputDir, outputFileName);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  ffmpeg(uploadedFile)
    .audioBitrate(320)
    .toFormat('mp3')
    .save(outputFilePath)
    .on('end', () => {
      fs.unlink(uploadedFile, (err) => {
        if (err) console.error(err);
      });
      res.json({ filename: outputFileName });
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).send('Audio processing failed');
    });
});

app.post('/clip', (req, res) => {
  const { filename, startTime, endTime } = req.body;
  const startTimeSeconds = startTime / 1e6;
  const durationSeconds = (endTime - startTime) / 1e6;
  const inputFilePath = path.join(__dirname, 'public', 'audios', filename);
  const outputFileName = `${Date.now()}_clipped.mp3`;
  const outputFilePath = path.join(__dirname, 'public', 'audios', outputFileName);

  ffmpeg(inputFilePath)
    .setStartTime(startTimeSeconds)
    .setDuration(durationSeconds)
    .toFormat('mp3')
    .save(outputFilePath)
    .on('end', () => {
      res.download(outputFilePath, outputFileName, (err) => {
        if (err) console.error(err);
        fs.unlink(outputFilePath, (err) => {
          if (err) console.error(err);
        });
      });
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).send('Audio clipping failed');
    });
});

app.listen(port, () => {
  console.log(`Server started, visit http://localhost:${port}`);
});
