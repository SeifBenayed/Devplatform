const https = require('https');
const fetch = require('node-fetch');
const FormData = require('form-data');
const Busboy = require('busboy');
const AbortController = require('abort-controller');

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

        // Forward to external API with timeout
        context.log('=== API CALL START ===');
        context.log('Timestamp:', new Date().toISOString());
        context.log('File Details:', JSON.stringify({
            name: fileData.filename,
            size: fileData.buffer.length,
            mimetype: fileData.mimetype
        }));

        const startTime = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            context.log.error('REQUEST TIMEOUT - Aborting after 9 minutes');
            controller.abort();
        }, 540000); // 9 minute timeout

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
        context.log(`API Call Duration: ${duration}ms (${(duration/1000).toFixed(2)}s)`);

        // Get response text
        const responseText = await response.text();

        // Check if response is OK
        if (!response.ok) {
            context.log.error('=== API ERROR RESPONSE ===');
            context.log.error('HTTP Status:', response.status, response.statusText);
            context.log.error('Response Headers:', JSON.stringify([...response.headers.entries()], null, 2));
            context.log.error('Error Body:', responseText);
            context.log.error('Error Body Length:', responseText.length);
            context.log.error('Error Body Type:', typeof responseText);

            // Try to parse error as JSON for more details
            try {
                const errorJson = JSON.parse(responseText);
                context.log.error('Parsed Error JSON:', JSON.stringify(errorJson, null, 2));
            } catch (e) {
                context.log.error('Error body is not valid JSON');
            }

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

        // Success response logging
        context.log('=== API SUCCESS RESPONSE ===');
        context.log('HTTP Status:', response.status, response.statusText);
        context.log('Response Headers:', JSON.stringify([...response.headers.entries()], null, 2));
        context.log('Response Body Length:', responseText.length, 'bytes');
        context.log('Response Preview (first 200 chars):', responseText.substring(0, 200));
        context.log('Response End (last 100 chars):', responseText.substring(Math.max(0, responseText.length - 100)));

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
        context.log.error('=== CAUGHT EXCEPTION ===');
        context.log.error('Error Type:', error.name);
        context.log.error('Error Message:', error.message);
        context.log.error('Error Code:', error.code);
        context.log.error('Error Stack:', error.stack);

        // Log abort-specific errors
        if (error.name === 'AbortError') {
            context.log.error('Request was aborted (likely timeout)');
        }

        // Log network errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            context.log.error('Network error - external API may be unreachable');
        }

        context.res = {
            status: 500,
            body: {
                error: 'Server error',
                details: error.message,
                errorType: error.name,
                errorCode: error.code
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
