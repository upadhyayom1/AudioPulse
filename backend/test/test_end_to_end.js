/**
 * End-to-end integration test testing actual YouTube extraction and MP3 return.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PORT = parseInt(process.env.PORT || '5001', 10);

async function testFullTrim() {
  console.log('Testing full trim pipeline on sample video (10s to 15s)...');
  const postData = JSON.stringify({
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    start: '00:10',
    end: '00:15'
  });

  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/api/audio/trim',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log('Response Status:', res.statusCode);
      console.log('Response Headers:', res.headers);

      if (res.statusCode !== 200) {
        let errBody = '';
        res.on('data', chunk => errBody += chunk);
        res.on('end', () => reject(new Error(`Server returned status ${res.statusCode}: ${errBody}`)));
        return;
      }

      const testOutputPath = path.join(__dirname, 'received_trimmed.mp3');
      const fileStream = fs.createWriteStream(testOutputPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(() => {
          const stats = fs.statSync(testOutputPath);
          console.log(`✅ Success! Received MP3 file (${stats.size} bytes).`);
          fs.unlinkSync(testOutputPath);
          resolve();
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

testFullTrim()
  .then(() => {
    console.log('End-to-end API trim test passed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('End-to-end test failed:', err);
    process.exit(1);
  });
