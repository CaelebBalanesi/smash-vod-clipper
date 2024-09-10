const { exec } = require('child_process');
const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware to parse JSON body data
app.use(express.json());
app.use(cors());

// Endpoint to download video and convert to GIF
app.post('/download', async (req, res) => {
  const { youtubeUrl, startTime, endTime } = req.body;

  if (!youtubeUrl || startTime === undefined || endTime === undefined) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    // Define paths for saving the video, palette, and the gif
    const timestamp = Date.now();
    const videoPath = path.resolve(__dirname, `video-${timestamp}.mp4`);
    const palettePath = path.resolve(__dirname, `palette-${timestamp}.png`);
    const gifPath = path.resolve(__dirname, `video-${timestamp}.gif`);

    let startTime_formatted = formatTime(startTime);
    let endTime_formatted = formatTime(endTime);

    // Download the video using yt-dlp with mp4 format
    const command = `yt-dlp -f "mp4" --download-sections "*${startTime_formatted} - ${endTime_formatted}"  --output ${videoPath} ${youtubeUrl}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error downloading video: ${error.message}`);
        return res.status(500).json({ message: 'Error downloading video' });
      }
      if (stderr) {
        console.error(`yt-dlp stderr: ${stderr}`);
      }
      if (stdout) {
        console.log(stdout);
      }

      // Step 1: Generate the palette for the GIF
      ffmpeg(videoPath)
        .output(palettePath)
        .videoFilters('fps=15,scale=480:-1:flags=lanczos,palettegen')
        .on('end', () => {
          console.log('Palette generated');

          // Step 2: Use the palette to create the GIF
          ffmpeg(videoPath)
            .input(palettePath)
            .complexFilter(['fps=15,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse'])
            .output(gifPath)
            .on('end', () => {
              console.log('GIF created');

              // Send the generated GIF back to the client
              res.sendFile(gifPath, () => {
                // Cleanup: remove the video, palette, and gif files from the server after sending
                fs.unlinkSync(videoPath);
                fs.unlinkSync(palettePath);
                // fs.unlinkSync(gifPath);
              });
            })
            .on('error', (err) => {
              console.error('Error converting video to GIF:', err);
              res.status(500).json({ message: 'Error processing video' });
            })
            .run();
        })
        .on('error', (err) => {
          console.error('Error generating palette:', err);
          res.status(500).json({ message: 'Error generating palette' });
        })
        .run();
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 10); // One decimal place for seconds

  // Pad the hours, minutes, and seconds with leading zeros if needed
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(secs).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${milliseconds}`;
}
