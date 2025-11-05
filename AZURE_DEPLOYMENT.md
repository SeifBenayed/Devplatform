# Azure Static Web Apps Deployment Guide

This guide will walk you through deploying the File Upload & Analysis app to **Azure Static Web Apps**.

## 🌟 Why Azure Static Web Apps?

Azure Static Web Apps is perfect for this application because:
- ✅ Hosts static frontend files (HTML, CSS, JS)
- ✅ Integrates with Azure Functions for backend API
- ✅ Automatic HTTPS and custom domains
- ✅ Built-in CI/CD with GitHub
- ✅ Free tier available
- ✅ Global CDN distribution

## 📋 Prerequisites

1. **Azure Account**: Sign up at https://azure.microsoft.com/free/
2. **GitHub Account**: Your code repository
3. **Azure CLI** (optional): Install from https://aka.ms/installazurecli

## 🚀 Deployment Methods

### Method 1: Deploy via Azure Portal (Easiest)

#### Step 1: Create Static Web App

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Static Web App"** and click **Create**

#### Step 2: Configure the App

**Basics Tab:**
- **Subscription**: Select your subscription
- **Resource Group**: Create new or use existing
- **Name**: `file-upload-analyzer` (or your choice)
- **Plan type**: Free (or Standard for production)
- **Region**: Choose closest to your users

**Deployment Details:**
- **Source**: GitHub
- **Sign in** to GitHub
- **Organization**: Your GitHub username
- **Repository**: `Devplatform`
- **Branch**: `main` (or your deployment branch)

**Build Details:**
- **Build Presets**: Custom
- **App location**: `/` (root)
- **Api location**: `api`
- **Output location**: `public`

#### Step 3: Deploy

1. Click **"Review + create"**
2. Click **"Create"**
3. Wait for deployment (2-5 minutes)
4. Azure will automatically:
   - Create a GitHub Actions workflow
   - Build and deploy your app
   - Set up the Azure Functions backend

#### Step 4: Access Your App

1. Go to your resource in Azure Portal
2. Click **"Browse"** to open your live app
3. Your URL will be: `https://<app-name>.azurestaticapps.net`

### Method 2: Deploy via Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name file-upload-rg --location eastus

# Create static web app
az staticwebapp create \
  --name file-upload-analyzer \
  --resource-group file-upload-rg \
  --source https://github.com/<your-username>/Devplatform \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "public" \
  --login-with-github
```

### Method 3: Manual GitHub Actions Setup

If Azure didn't create the workflow automatically:

1. Create `.github/workflows/azure-static-web-apps.yml`:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: "api"
          output_location: "public"

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

2. Get your deployment token:
   - Go to your Static Web App in Azure Portal
   - Click **"Manage deployment token"**
   - Copy the token

3. Add to GitHub Secrets:
   - Go to your GitHub repo → Settings → Secrets → Actions
   - Add secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Paste the token

## 📁 Project Structure for Azure

```
Devplatform/
├── api/                          # Azure Functions (Backend)
│   ├── upload/
│   │   ├── function.json        # Function configuration
│   │   └── index.js             # Upload handler
│   ├── host.json                # Functions runtime config
│   └── package.json             # API dependencies
├── public/                       # Static frontend files
│   └── index.html
├── staticwebapp.config.json     # Azure Static Web Apps config
├── package.json                 # Root package.json
└── README.md
```

## 🔧 Configuration Files Explained

### `staticwebapp.config.json`
- Configures routing, CORS, and fallback rules
- Already created and configured

### `api/host.json`
- Azure Functions runtime configuration
- Already configured with proper settings

### `api/upload/function.json`
- Defines the HTTP trigger for file upload
- Route: `/api/upload`
- Method: POST

## 🧪 Local Development

Test locally before deploying:

```bash
# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Install dependencies
npm install
cd api && npm install && cd ..

# Start local development server
swa start public --api-location api
```

Access at: `http://localhost:4280`

## 🔍 Monitoring and Logs

### View Logs in Azure Portal:
1. Go to your Static Web App
2. Click **"Application Insights"** (if enabled)
3. Or use **"Log stream"** for real-time logs

### View Function Logs:
1. Go to **"Functions"** in your Static Web App
2. Select the `upload` function
3. Click **"Monitor"** to see invocations and logs

## 🔐 Environment Variables & Secrets

To add environment variables (like moving the API key):

### Via Azure Portal:
1. Go to your Static Web App
2. Click **"Configuration"**
3. Click **"Application settings"** → **"Add"**
4. Add: `EXTERNAL_API_KEY` = `QkQg8h4LtaK3hrTkZyiv-ogCW38WJrH9dbKnQ5SUkm4`

### Update `api/upload/index.js`:
```javascript
// Instead of hardcoded key:
'X-API-Key': process.env.EXTERNAL_API_KEY
```

## 🌐 Custom Domain

1. Go to your Static Web App → **"Custom domains"**
2. Click **"Add"**
3. Choose **"Custom domain on other DNS"**
4. Follow instructions to add DNS records
5. Azure will validate and provision SSL certificate

## 💰 Pricing

**Free Tier Includes:**
- 100 GB bandwidth per subscription
- 0.5 GB storage
- 2 custom domains
- Free SSL certificates

**Standard Tier** (~$9/month):
- Unlimited bandwidth
- Custom authentication
- SLA guarantee

## 🐛 Troubleshooting

### Issue: "404 Not Found" on /api/upload

**Solution:**
- Check `api/upload/function.json` exists
- Verify `api_location` is set to `api` in deployment
- Check Azure Functions logs in Portal

### Issue: File upload fails with CORS error

**Solution:**
- Verify `staticwebapp.config.json` has proper CORS headers
- Check function returns correct CORS headers

### Issue: Build fails in GitHub Actions

**Solution:**
- Check `api/package.json` has all required dependencies
- Verify Node.js version compatibility
- Check GitHub Actions logs for specific errors

### Issue: Function timeout

**Solution:**
- Azure Functions on Free tier have 5-minute timeout
- Upgrade to Standard if processing takes longer
- Consider Azure Blob Storage for large files

## 📊 Success Checklist

- [ ] Azure Static Web App created
- [ ] GitHub repository connected
- [ ] Automatic deployment configured
- [ ] Frontend accessible via Azure URL
- [ ] `/api/upload` endpoint working
- [ ] File upload and analysis functional
- [ ] HTTPS enabled (automatic)
- [ ] (Optional) Custom domain configured
- [ ] (Optional) Application Insights enabled for monitoring

## 🎉 Next Steps

1. **Test Your App**: Upload a PDF/PNG/JPEG and verify analysis works
2. **Monitor Usage**: Check Azure Portal for metrics
3. **Set up Alerts**: Configure alerts for errors or high usage
4. **Enable Auth** (Optional): Add authentication if needed
5. **Optimize**: Monitor function execution time and optimize if needed

## 📚 Useful Links

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Static Web Apps CLI](https://github.com/Azure/static-web-apps-cli)
- [Pricing Details](https://azure.microsoft.com/pricing/details/app-service/static/)

## 🆚 Azure Static Web Apps vs Other Platforms

| Feature | Azure SWA | AWS Amplify | Railway | Render |
|---------|-----------|-------------|---------|--------|
| Static Hosting | ✅ | ✅ | ❌ | ✅ |
| Serverless Backend | ✅ (Functions) | ✅ (Lambda) | ❌ | ❌ |
| Container Support | ❌ | ❌ | ✅ | ✅ |
| Free Tier | ✅ Good | ✅ Limited | ✅ Great | ✅ Good |
| CI/CD | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| Custom Domains | ✅ Free SSL | ✅ Free SSL | ✅ Free SSL | ✅ Free SSL |

**Choose Azure Static Web Apps if:**
- ✅ You want a static frontend + serverless backend
- ✅ You're already using Azure
- ✅ You want built-in GitHub integration
- ✅ You need global CDN

**Choose Railway/Render if:**
- ✅ You prefer a traditional Node.js server
- ✅ You need more backend flexibility
- ✅ You want simpler deployment

---

Need help? Check the [main README](README.md) or [deployment options](DEPLOYMENT.md).
