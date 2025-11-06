# Document Fraud Detection Platform

A comprehensive web application for document forensic analysis and fraud detection. Upload documents (PDF, PNG, JPEG) to analyze authenticity, detect tampering, AI-generated content, and identify digital print manipulation.

## Features

### Upload & Processing
- 📤 Drag-and-drop or click-to-upload interface
- ✅ File type validation (PDF, PNG, JPEG only)
- 📏 File size limit (10MB)
- 🔄 Real-time upload progress
- 🎨 Modern, responsive UI

### Forensic Analysis Dashboard
- 🖼️ **Visual Heatmap Display** - Tampering detection heatmap shown first
- ✅ **Decision Banner** - Color-coded verdict (Accept/Review/Reject) with risk scores
- 🚨 **Key Indicators** - Highlighted suspicious findings with severity badges
- 📊 **Score Breakdown** - Detailed forensic and deduplication score contributions
- 🤖 **AI Detection** - Binary classification (AI-generated vs Human-created) with confidence scores
- 🔬 **Detailed Forensic Analysis**:
  - Digital Print Detection (VLM + EXIF analysis)
  - Image Forensics (ELA, JPEG ghost, noise analysis, font analysis)
  - Document Tampering Detection with visualizations
  - Character Variance Analysis
- 🔍 **Deduplication Analysis**:
  - File hashes (SHA256 + image hashes)
  - Duplicate detection (exact, fuzzy, partial)
  - Online duplicate search results
  - Fraud network analysis
- 📈 **Visual Elements**: Progress bars, badges, expandable sections, and color-coded severity indicators

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

3. Upload and analyze a document:
   - Click the upload area or drag and drop a file
   - Supported formats: PDF, PNG, JPEG
   - Maximum file size: 10MB
   - Click "Analyze File" to send to the forensic API
   - View comprehensive analysis dashboard with:
     - Tampering heatmap visualization
     - Fraud detection verdict (Accept/Review/Reject)
     - Risk scores and confidence levels
     - AI-generated content detection
     - Detailed forensic analysis (expandable sections)
     - Deduplication and fraud network analysis

## API Endpoint

The app sends files to:
```
POST https://40.119.130.55/analyze
Header: X-API-Key: QkQg8h4LtaK3hrTkZyiv-ogCW38WJrH9dbKnQ5SUkm4
```

### API Response Structure

The forensic analysis API returns a comprehensive JSON response containing:

- **Decision**: Final verdict (accept/review/reject) with risk score and reasoning
- **Routing**: Document classification, type, country, format detection
- **Forensics**:
  - Forensic score and confidence level
  - Suspicious indicators with severity levels
  - Image forensics (ELA, JPEG ghost, noise analysis, font analysis)
  - Digital print detection (VLM + EXIF)
  - AI-generated content detection
  - Document tampering analysis with **Base64 visualizations** (heatmap, mask, original)
  - Character variance analysis
- **Deduplication**:
  - File hashes (SHA256, perceptual, average, difference, wavelet)
  - Duplicate detection (exact, fuzzy, partial)
  - Online duplicate search
  - Fraud network analysis
- **Processing metadata**: Timestamps, processing times, cache statistics

## Understanding the Analysis Dashboard

### Color-Coded Severity System
- 🔴 **High (Red)**: Critical issues detected - likely fraudulent
- 🟠 **Medium (Orange)**: Suspicious patterns - requires review
- 🟢 **Low (Green)**: Minor concerns or authentic

### Decision Verdicts
- ✅ **ACCEPT (Green)**: Document appears authentic, low risk score
- ⚠️ **REVIEW (Orange)**: Manual review recommended, medium risk score
- ❌ **REJECT (Red)**: Document rejected, high risk score

### Interpreting Results
1. **Heatmap Visualization**: Red/hot areas indicate detected tampering or manipulation
2. **Risk Score**: 0-100% overall fraud probability
3. **AI Detection**: Confidence score for AI-generated content
4. **Forensic Score**: Combined score from multiple forensic tests
5. **Deduplication**: Checks if document has been used fraudulently before

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
- Comprehensive forensic analysis dashboard
- Dynamic JSON parsing and data visualization
- Base64 image rendering for tampering heatmaps
- Color-coded severity system (High/Medium/Low)
- Expandable/collapsible detailed sections
- Responsive card-based layout
- Real-time feedback and error handling

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

## License

See LICENSE file for details.
