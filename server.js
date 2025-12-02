const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const https = require('https');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, PNG, and JPEG files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve static files
app.use(express.static('public'));

// File upload endpoint (matches Azure Functions route)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  let fileToSend = null;
  let filenameToSend = null;
  let mimetypeToSend = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Compress image if needed (> 1MB)
    fileToSend = req.file.path;
    filenameToSend = req.file.originalname;
    mimetypeToSend = req.file.mimetype;
    const isImage = req.file.mimetype === 'image/png' || req.file.mimetype === 'image/jpeg';
    const originalSize = req.file.size;
    const oneMB = 1 * 1024 * 1024;

    if (isImage && originalSize > oneMB) {
      console.log('=== IMAGE COMPRESSION START ===');
      console.log('Original size:', (originalSize / 1024 / 1024).toFixed(2), 'MB');

      try {
        const compressionStartTime = Date.now();
        const compressedPath = req.file.path + '-compressed.jpg';

        // Compress image: resize to max 1920px, convert to JPEG quality 90%
        await sharp(req.file.path)
          .resize(1920, 1920, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 90 })
          .toFile(compressedPath);

        const compressedStats = fs.statSync(compressedPath);
        const compressedSize = compressedStats.size;
        const compressionTime = Date.now() - compressionStartTime;

        console.log('Compressed size:', (compressedSize / 1024 / 1024).toFixed(2), 'MB');
        console.log('Compression ratio:', ((originalSize - compressedSize) / originalSize * 100).toFixed(1), '%');
        console.log('Compression time:', compressionTime, 'ms');
        console.log('=== IMAGE COMPRESSION COMPLETE ===');

        // Use compressed file
        fileToSend = compressedPath;
        filenameToSend = req.file.originalname.replace(/\.(png|jpeg|jpg)$/i, '.jpg');
        mimetypeToSend = 'image/jpeg';
      } catch (compressionError) {
        console.error('=== IMAGE COMPRESSION FAILED ===');
        console.error('Error:', compressionError.message);
        console.log('Proceeding with original file');
        // Continue with original file if compression fails
      }
    }

    // Create form data for external API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(fileToSend), {
      filename: filenameToSend,
      contentType: mimetypeToSend
    });

    // Create custom HTTPS agent that accepts self-signed certificates
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });

    // Send to external API with timeout
    console.log('=== API CALL START ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('File Details:', {
      name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    });

    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.error('REQUEST TIMEOUT - Aborting after 30 minutes');
      controller.abort();
    }, 1800000); // 30 minute timeout

    const response = await fetch('https://40.119.130.55/analyze', {
      method: 'POST',
      headers: {
        'X-API-Key': 'QkQg8h4LtaK3hrTkZyiv-ogCW38WJrH9dbKnQ5SUkm4',
        ...formData.getHeaders()
      },
      body: formData,
      agent: httpsAgent,
      signal: controller.signal
    });

    clearTimeout(timeout);
    const duration = Date.now() - startTime;
    console.log(`API Call Duration: ${duration}ms (${(duration/1000).toFixed(2)}s)`);

    // Check response status first
    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== API ERROR RESPONSE ===');
      console.error('HTTP Status:', response.status, response.statusText);
      console.error('Response Headers:', JSON.stringify([...response.headers.entries()], null, 2));
      console.error('Error Body:', errorText);
      console.error('Error Body Length:', errorText.length);
      console.error('Error Body Type:', typeof errorText);

      // Try to parse error as JSON for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed Error JSON:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('Error body is not valid JSON');
      }

      // Clean up uploaded files
      fs.unlinkSync(req.file.path);
      if (fileToSend !== req.file.path && fs.existsSync(fileToSend)) {
        fs.unlinkSync(fileToSend);
      }

      return res.status(response.status).json({
        error: 'API request failed',
        details: errorText,
        status: response.status
      });
    }

    // Get response text first to inspect it
    let responseText;
    try {
      responseText = await response.text();
      console.log('=== API SUCCESS RESPONSE ===');
      console.log('HTTP Status:', response.status, response.statusText);
      console.log('Response Headers:', JSON.stringify([...response.headers.entries()], null, 2));
      console.log('Response Body Length:', responseText.length, 'bytes');
      console.log('Response Preview (first 200 chars):', responseText.substring(0, 200));
      console.log('Response End (last 100 chars):', responseText.substring(Math.max(0, responseText.length - 100)));
    } catch (textError) {
      console.error('=== ERROR READING RESPONSE ===');
      console.error('Error Type:', textError.name);
      console.error('Error Message:', textError.message);
      console.error('Error Stack:', textError.stack);

      // Clean up uploaded files
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      if (fileToSend !== req.file.path && fs.existsSync(fileToSend)) {
        fs.unlinkSync(fileToSend);
      }

      return res.status(500).json({
        error: 'Failed to read API response',
        details: textError.message
      });
    }

    // Clean up uploaded files
    fs.unlinkSync(req.file.path);
    if (fileToSend !== req.file.path && fs.existsSync(fileToSend)) {
      fs.unlinkSync(fileToSend);
    }

    // Check if response is empty
    if (!responseText || responseText.trim().length === 0) {
      console.error('Empty response from API');
      return res.status(500).json({
        error: 'Empty response from API',
        details: 'API returned no data'
      });
    }

    // Try to parse JSON
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('JSON parsed successfully, result keys:', Object.keys(result));
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Response text preview:', responseText.substring(0, 500));
      console.error('Response text end:', responseText.substring(responseText.length - 100));
      return res.status(500).json({
        error: 'Invalid JSON response from API',
        details: parseError.message,
        preview: responseText.substring(0, 200)
      });
    }

    res.json(result);

  } catch (error) {
    console.error('=== CAUGHT EXCEPTION ===');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Stack:', error.stack);

    // Log abort-specific errors
    if (error.name === 'AbortError') {
      console.error('Request was aborted (likely timeout)');
    }

    // Log network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.error('Network error - external API may be unreachable');
    }

    // Clean up files if they exist
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (fileToSend !== req.file.path && fs.existsSync(fileToSend)) {
      fs.unlinkSync(fileToSend);
    }

    res.status(500).json({
      error: 'Server error',
      details: error.message,
      errorType: error.name,
      errorCode: error.code
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
