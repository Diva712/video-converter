const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs").promises;
const path = require('path');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/temp/",
  })
);

ffmpeg.setFfmpegPath("C:/ffmpeg/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("C:/ffmpeg/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe");

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/convert', async (req, res) => {
  try {
    let to = req.body.to;
    let file = req.files.file;
    let inputPath = path.join(__dirname, "temp", file.name);
    let outputPath = path.join(__dirname, `output.${to}`);

    await file.mv(inputPath);
    console.log("File Uploaded Successfully!");

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .withOutputFormat(to)
        .on("end", resolve)
        .on("error", reject)
        .saveToFile(outputPath);
    });

    res.download(outputPath, async (err) => {
      if (err) {
        console.error("Download error:", err);
        return res.status(500).send("Error during file download");
      }

      try {
        await fs.unlink(outputPath);
        await fs.unlink(inputPath);
        console.log("Files deleted successfully!");
      } catch (deleteErr) {
        console.error("Error deleting files:", deleteErr);
      }
    });
  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).send("Error during file conversion");

    // Attempt to clean up the input file if it exists
    try {
      await fs.unlink(path.join(__dirname, "temp", req.files.file.name));
    } catch (deleteErr) {
      console.error("Error deleting input file:", deleteErr);
    }
  }
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});