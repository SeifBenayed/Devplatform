# Azure Static Web Apps Deployment Guide

This guide explains how to deploy the Document Fraud Detection Platform to Azure Static Web Apps with Azure Functions backend.

## Prerequisites

- Azure Account
- Azure Static Web Apps resource
- GitHub repository (for CI/CD)

## Project Structure

```
Devplatform/
├── public/                 # Frontend files
│   └── index.html         # Main HTML file
├── api/                    # Azure Functions (serverless backend)
│   ├── upload/            # Upload function
│   │   ├── function.json  # Function configuration
│   │   └── index.js       # Function handler
│   ├── package.json       # API dependencies
│   └── host.json          # Functions host configuration
├── staticwebapp.config.json  # Azure Static Web Apps configuration
├── server.js              # Local development server (not deployed)
└── package.json           # Root dependencies
```

## Deployment Steps

### Option 1: Deploy via Azure Portal (Recommended for first-time deployment)

1. **Create Azure Static Web App**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Create a new **Static Web App** resource
   - Choose your subscription and resource group
   - Name your app (e.g., "document-fraud-detection")
   - Select **Free** tier for testing
   - Choose **GitHub** as deployment source
   - Authorize Azure to access your GitHub repository
   - Select your repository and branch (e.g., `main`)

2. **Configure Build Settings**:
   - **App location**: `/public` (where index.html is located)
   - **API location**: `/api` (where Azure Functions are)
   - **Output location**: (leave empty, as we're serving static files directly)

3. **Environment Variables** (if needed):
   - Go to Configuration > Application settings
   - Add any environment variables needed (API keys should be stored here, not in code)

4. **Deploy**:
   - Azure will automatically set up GitHub Actions workflow
   - Push code to trigger deployment
   - Monitor deployment in GitHub Actions tab

### Option 2: Deploy via Azure CLI

```bash
# Install Azure CLI if not already installed
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login to Azure
az login

# Create resource group (if needed)
az group create --name myResourceGroup --location eastus

# Create Static Web App
az staticwebapp create \\
    --name document-fraud-detection \\
    --resource-group myResourceGroup \\
    --location eastus \\
    --source https://github.com/YOUR_USERNAME/YOUR_REPO \\
    --branch main \\
    --app-location "/public" \\
    --api-location "/api" \\
    --login-with-github
```

### Option 3: Manual Deployment via VS Code

1. Install the **Azure Static Web Apps** extension for VS Code
2. Right-click on the project folder
3. Select **Create Static Web App**
4. Follow the prompts

## Local Development

For local development, use the Express server:

```bash
# Install dependencies
npm install

# Start local server
npm start

# Access at http://localhost:3000
```

The local server mimics Azure Functions by using the same `/api/upload` route.

## Testing Azure Functions Locally

You can test Azure Functions locally before deploying:

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Navigate to the api folder
cd api

# Install dependencies
npm install

# Start Azure Functions locally
func start

# Test the function
curl -X POST http://localhost:7071/api/upload \\
  -F "file=@path/to/test-file.png"
```

## Configuration Files Explained

### `staticwebapp.config.json`
Configures routing, CORS, and API integration for Azure Static Web Apps.

### `api/host.json`
Configures Azure Functions runtime settings (timeout, logging, etc.).

### `api/upload/function.json`
Defines the HTTP trigger for the upload function (POST method, anonymous auth).

### `api/upload/index.js`
Handles file uploads and forwards to the external forensic API.

## Troubleshooting

### 405 Method Not Allowed
- **Cause**: API route not correctly configured or function not deployed
- **Solution**:
  - Check `staticwebapp.config.json` has correct API routing
  - Verify `api/upload/function.json` allows POST method
  - Ensure GitHub Actions deployment succeeded

### CORS Errors
- **Cause**: Missing CORS headers
- **Solution**: Verify `staticwebapp.config.json` has correct `globalHeaders` configuration

### Function Timeout
- **Cause**: Large file upload or slow external API
- **Solution**: Increase timeout in `api/host.json` (max 10 minutes for consumption plan)

### Dependencies Not Found
- **Cause**: `package.json` not in `/api` folder
- **Solution**: Ensure `api/package.json` exists with all dependencies

## Monitoring

- View logs in Azure Portal > Your Static Web App > Application Insights
- Monitor function executions in Functions section
- Check GitHub Actions for deployment logs

## Cost Estimation

- **Azure Static Web Apps (Free tier)**:
  - 100 GB bandwidth/month
  - Custom domains
  - SSL certificates
  - FREE for hobby projects

- **Azure Functions (Consumption plan)**:
  - First 1 million executions FREE
  - $0.20 per million executions after that
  - Pay only for what you use

## Security Notes

- Store API keys in Azure Application Settings, not in code
- Use HTTPS only (enforced by Azure Static Web Apps)
- Consider adding authentication for production use
- Implement rate limiting for API endpoints

## Next Steps

1. Add authentication (Azure AD, GitHub OAuth, etc.)
2. Implement serverless database for storing results
3. Add email notifications
4. Set up CI/CD pipeline for automated testing
5. Configure custom domain
