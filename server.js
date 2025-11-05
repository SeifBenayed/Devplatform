const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const https = require('https');

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

// File upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create form data for external API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Create custom HTTPS agent that accepts self-signed certificates
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });

    // Send to external API
    const response = await fetch('https://40.119.130.55/analyze', {
      method: 'POST',
      headers: {
        'X-API-Key': 'QkQg8h4LtaK3hrTkZyiv-ogCW38WJrH9dbKnQ5SUkm4',
        ...formData.getHeaders()
      },
      body: formData,
      agent: httpsAgent
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'API request failed',
        details: errorText,
        status: response.status
      });
    }

    const result = await response.json();
    res.json(result);

  } catch (error) {
    console.error('Error:', error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
