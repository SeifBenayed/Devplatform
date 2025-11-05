# Deployment Guide

## ⚠️ Important: AWS Amplify Limitation

AWS Amplify is designed for **static sites** (React, Vue, Angular) or **SSR frameworks** (Next.js, Nuxt.js).

Our application is a **full-stack Node.js server** that needs to run continuously to handle file uploads. Amplify cannot host this type of application directly.

## Recommended Deployment Options

### Option 1: Railway (Easiest - Recommended)

1. Create account at https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the Node.js app
5. Your app will be live at `https://your-app.up.railway.app`

**No configuration needed!** Railway automatically detects `npm start` from package.json.

### Option 2: Render

1. Create account at https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Deploy!

### Option 3: Heroku

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Run commands:
```bash
heroku login
heroku create your-app-name
git push heroku main
```

3. Add a `Procfile`:
```
web: node server.js
```

### Option 4: AWS Elastic Beanstalk (AWS Alternative)

If you want to stay on AWS, use Elastic Beanstalk instead of Amplify:

1. Install EB CLI:
```bash
pip install awsebcli
```

2. Initialize and deploy:
```bash
eb init -p node.js your-app-name
eb create production-env
eb open
```

### Option 5: Split Architecture (Frontend on Amplify + Backend Elsewhere)

Deploy the frontend on Amplify and backend on another service:

1. **Frontend (Amplify)**: Deploy only the `public` folder
2. **Backend (Railway/Render)**: Deploy the server
3. **Update frontend**: Change the fetch URL in `public/index.html`:
```javascript
const response = await fetch('https://your-backend.railway.app/upload', {
    method: 'POST',
    body: formData
});
```

## Quick Start: Railway Deployment (5 minutes)

1. Go to https://railway.app and sign up with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `Devplatform` repository
5. Click "Deploy"

That's it! Railway will:
- Detect it's a Node.js app
- Run `npm install`
- Run `npm start`
- Give you a live URL

## Environment Variables

If you need to add environment variables later (like moving the API key to env vars):

**Railway**: Settings → Variables → Add Variable
**Render**: Environment → Environment Variables → Add Variable
**Heroku**: `heroku config:set API_KEY=your-key`

## Cost Comparison

- **Railway**: Free tier (500 hours/month)
- **Render**: Free tier available
- **Heroku**: $5/month minimum (free tier removed)
- **AWS Elastic Beanstalk**: ~$10-20/month
- **AWS Amplify**: Not suitable for this app type

## Recommendation

🚀 **Use Railway** - It's the easiest and has the best free tier for Node.js apps.
