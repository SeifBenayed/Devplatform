# File Upload & Analysis App

A web application that allows users to upload files (PDF, PNG, JPEG) and send them to an external analysis API for processing.

## Features

- 📤 Drag-and-drop or click-to-upload interface
- ✅ File type validation (PDF, PNG, JPEG only)
- 📏 File size limit (10MB)
- 🔄 Real-time upload progress
- 📊 JSON results display
- 🎨 Modern, responsive UI

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Devplatform
```

2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Upload a file:
   - Click the upload area or drag and drop a file
   - Supported formats: PDF, PNG, JPEG
   - Maximum file size: 10MB
   - Click "Analyze File" to send to the API
   - View results in JSON format

## API Endpoint

The app sends files to:
```
POST https://40.119.130.55/analyze
Header: X-API-Key: QkQg8h4LtaK3hrTkZyiv-ogCW38WJrH9dbKnQ5SUkm4
```

## Project Structure

```
Devplatform/
├── server.js           # Express server with file upload handling
├── package.json        # Project dependencies
├── public/
│   └── index.html     # Frontend interface
├── uploads/           # Temporary file storage (auto-created)
└── README.md          # This file
```

## Technical Details

### Backend (server.js)
- Express.js web server
- Multer for multipart/form-data file uploads
- Form-data for sending files to external API
- File validation and cleanup
- HTTPS agent for self-signed certificates

### Frontend (public/index.html)
- Vanilla JavaScript (no frameworks)
- Drag-and-drop file upload
- Client-side file validation
- Responsive design
- Real-time feedback

## Security Notes

- The app accepts self-signed certificates (rejectUnauthorized: false)
- API key is embedded in the server code
- Uploaded files are temporarily stored and deleted after processing
- File size and type restrictions are enforced

## Error Handling

The app handles various error scenarios:
- Invalid file types
- Oversized files
- Network errors
- API failures
- Server errors

## Deployment

This application can be deployed to multiple platforms:

### ☁️ Azure Static Web Apps (Recommended for Static + Serverless)
- **Frontend**: Static files served via CDN
- **Backend**: Azure Functions (serverless)
- **Free Tier**: 100 GB bandwidth/month
- **Setup Time**: 5-10 minutes
- 📖 **[Full Azure Deployment Guide →](AZURE_DEPLOYMENT.md)**

### 🚂 Railway / Render (Recommended for Full Node.js Server)
- **Type**: Full Node.js server deployment
- **Free Tier**: Available on both
- **Setup Time**: 5 minutes
- 📖 **[Other Deployment Options →](DEPLOYMENT.md)**

### Quick Deployment Options:

| Platform | Type | Free Tier | Best For |
|----------|------|-----------|----------|
| **Azure Static Web Apps** | Static + Serverless | ✅ Yes | Production, global CDN |
| **Railway** | Node.js Server | ✅ Yes | Quick deployment, dev/prod |
| **Render** | Node.js Server | ✅ Yes | Similar to Railway |
| **AWS Amplify** | Static only | ✅ Yes | ❌ Won't work (needs backend) |
| **Heroku** | Node.js Server | ❌ $5/month | Traditional hosting |

**Quick Start:**
- For Azure: See [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md)
- For others: See [DEPLOYMENT.md](DEPLOYMENT.md)

## Project Structure (Azure Static Web Apps Version)

```
Devplatform/
├── api/                          # Azure Functions backend
│   ├── upload/
│   │   ├── function.json        # Function config
│   │   └── index.js             # Upload handler
│   ├── host.json                # Functions runtime
│   └── package.json             # API dependencies
├── public/                       # Static frontend
│   └── index.html
├── staticwebapp.config.json     # Azure SWA config
├── server.js                    # Express server (for local/Railway)
└── package.json
```

## License

See LICENSE file for details.
