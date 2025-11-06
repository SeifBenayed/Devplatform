const https = require('https');
const FormData = require('form-data');
const Busboy = require('busboy');

module.exports = async function (context, req) {
    context.log('Upload function triggered');

    // Check if request has content
    if (!req.body || !req.headers['content-type']) {
        context.res = {
            status: 400,
            body: { error: 'No file uploaded' }
        };
        return;
    }

    try {
        // Parse multipart form data
        const fileData = await parseMultipartForm(req);

        if (!fileData || !fileData.buffer || !fileData.filename) {
            context.res = {
                status: 400,
                body: { error: 'No file in request' }
            };
            return;
        }

        context.log(`Processing file: ${fileData.filename}`);

        // Create form data for external API
        const formData = new FormData();
        formData.append('file', fileData.buffer, {
            filename: fileData.filename,
            contentType: fileData.mimetype
        });

        // Create HTTPS agent that accepts self-signed certificates
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false
        });

        // Forward to external API
        const response = await fetch('https://40.119.130.55/analyze', {
            method: 'POST',
            headers: {
                'X-API-Key': 'QkQg8h4LtaK3hrTkZyiv-ogCW38WJrH9dbKnQ5SUkm4',
                ...formData.getHeaders()
            },
            body: formData,
            agent: httpsAgent
        });

        // Get response text
        const responseText = await response.text();
        context.log(`API Response received, length: ${responseText.length}`);

        // Check if response is OK
        if (!response.ok) {
            context.log.error(`API Error: ${response.status}`);
            context.res = {
                status: response.status,
                body: {
                    error: 'API request failed',
                    details: responseText,
                    status: response.status
                }
            };
            return;
        }

        // Parse JSON response
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            context.log.error('JSON Parse Error:', parseError);
            context.res = {
                status: 500,
                body: {
                    error: 'Invalid JSON response from API',
                    details: parseError.message
                }
            };
            return;
        }

        // Return successful response
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: result
        };

    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 500,
            body: {
                error: 'Server error',
                details: error.message
            }
        };
    }
};

// Helper function to parse multipart form data
function parseMultipartForm(req) {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({
            headers: req.headers,
            limits: {
                fileSize: 10 * 1024 * 1024 // 10MB limit
            }
        });

        let fileData = null;

        busboy.on('file', (fieldname, file, info) => {
            const { filename, encoding, mimeType } = info;
            const chunks = [];

            // Validate file type
            const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
            if (!allowedTypes.includes(mimeType)) {
                file.resume(); // Drain the stream
                reject(new Error('Invalid file type. Only PDF, PNG, and JPEG files are allowed.'));
                return;
            }

            file.on('data', (chunk) => {
                chunks.push(chunk);
            });

            file.on('end', () => {
                fileData = {
                    buffer: Buffer.concat(chunks),
                    filename: filename,
                    mimetype: mimeType,
                    encoding: encoding
                };
            });
        });

        busboy.on('finish', () => {
            resolve(fileData);
        });

        busboy.on('error', (error) => {
            reject(error);
        });

        // Azure Functions provides the body as Buffer for binary data
        if (Buffer.isBuffer(req.body)) {
            busboy.end(req.body);
        } else if (req.rawBody) {
            busboy.end(Buffer.from(req.rawBody));
        } else {
            reject(new Error('Unable to parse request body'));
        }
    });
}
