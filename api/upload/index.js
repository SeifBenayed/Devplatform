const FormData = require('form-data');
const fetch = require('node-fetch');
const https = require('https');
const Busboy = require('busboy');

module.exports = async function (context, req) {
    context.log('File upload request received');

    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: headers
        };
        return;
    }

    try {
        // Parse multipart form data
        const { file, filename, mimetype } = await parseMultipartForm(req);

        if (!file) {
            context.res = {
                status: 400,
                headers: headers,
                body: JSON.stringify({ error: 'No file uploaded' })
            };
            return;
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
        if (!allowedTypes.includes(mimetype)) {
            context.res = {
                status: 400,
                headers: headers,
                body: JSON.stringify({
                    error: 'Invalid file type. Only PDF, PNG, and JPEG files are allowed.'
                })
            };
            return;
        }

        // Create form data for external API
        const formData = new FormData();
        formData.append('file', file, {
            filename: filename,
            contentType: mimetype
        });

        // Create custom HTTPS agent that accepts self-signed certificates
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false
        });

        // Send to external API
        context.log('Sending to external API...');
        const response = await fetch('https://40.119.130.55/analyze', {
            method: 'POST',
            headers: {
                'X-API-Key': 'QkQg8h4LtaK3hrTkZyiv-ogCW38WJrH9dbKnQ5SUkm4',
                ...formData.getHeaders()
            },
            body: formData,
            agent: httpsAgent
        });

        if (!response.ok) {
            const errorText = await response.text();
            context.log('API Error:', errorText);
            context.res = {
                status: response.status,
                headers: headers,
                body: JSON.stringify({
                    error: 'API request failed',
                    details: errorText,
                    status: response.status
                })
            };
            return;
        }

        const result = await response.json();
        context.log('Analysis completed successfully');

        context.res = {
            status: 200,
            headers: headers,
            body: JSON.stringify(result)
        };

    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 500,
            headers: headers,
            body: JSON.stringify({
                error: 'Server error',
                details: error.message
            })
        };
    }
};

// Helper function to parse multipart form data
function parseMultipartForm(req) {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({
            headers: {
                'content-type': req.headers['content-type']
            }
        });

        let fileData = null;
        let filename = null;
        let mimetype = null;
        const chunks = [];

        busboy.on('file', (fieldname, file, info) => {
            filename = info.filename;
            mimetype = info.mimeType;

            file.on('data', (data) => {
                chunks.push(data);
            });

            file.on('end', () => {
                fileData = Buffer.concat(chunks);
            });
        });

        busboy.on('finish', () => {
            resolve({ file: fileData, filename, mimetype });
        });

        busboy.on('error', (error) => {
            reject(error);
        });

        // Azure Functions provides the body as a Buffer
        if (req.body) {
            busboy.write(req.body);
            busboy.end();
        } else {
            reject(new Error('No body in request'));
        }
    });
}
