# 🌐 Ngrok Deployment Guide

## 📋 Prerequisites

1. **Install ngrok:**
   ```bash
   # Linux (snap)
   sudo snap install ngrok
   
   # macOS (homebrew)
   brew install ngrok/ngrok/ngrok
   
   # Or download from: https://ngrok.com/download
   ```

2. **Get ngrok auth token:**
   - Sign up at: https://dashboard.ngrok.com/signup
   - Get your token: https://dashboard.ngrok.com/get-started/your-authtoken

3. **Configure ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

---

## 🚀 Quick Start

### Method 1: Using the Script (Recommended)

```bash
# 1. Make script executable
chmod +x ngrok-start.sh ngrok-update-frontend.sh

# 2. Start your backend
cd backend
npm run dev
# Keep this terminal running

# 3. In a new terminal, start ngrok
cd ..
./ngrok-start.sh
```

The script will:
- ✅ Check if backend is running
- ✅ Start ngrok tunnel
- ✅ Display the public URL
- ✅ Show test endpoints

### Method 2: Manual Setup

```bash
# Start ngrok manually
ngrok http 3001

# Copy the URL from output
# Example: https://abc123.ngrok.io

# Update frontend
./ngrok-update-frontend.sh https://abc123.ngrok.io
```

---

## 📊 What Gets Exposed

Your backend will be accessible at: `https://YOUR-ID.ngrok.io`

Available endpoints:
- **Health**: `https://YOUR-ID.ngrok.io/health`
- **Events**: `https://YOUR-ID.ngrok.io/api/events`
- **Oracle**: `https://YOUR-ID.ngrok.io/api/oracle/prices`
- **Whitelist**: `https://YOUR-ID.ngrok.io/api/admin/whitelist`

---

## 🔧 Configuration

### Frontend Integration

After starting ngrok, update your frontend:

```bash
# Automatic (using script)
./ngrok-update-frontend.sh https://abc123.ngrok.io

# Manual (edit frontend/.env.local)
NEXT_PUBLIC_BACKEND_URL=https://abc123.ngrok.io
```

Then restart your frontend:
```bash
cd frontend
npm run dev
```

### Custom Domain (Paid Plan)

If you have ngrok paid plan:

```bash
# Use custom subdomain
ngrok http 3001 --subdomain=tokenized-assets

# Use custom domain
ngrok http 3001 --hostname=api.yourdomain.com
```

---

## 🛠️ Ngrok Dashboard

Access the ngrok web interface:
```
http://localhost:4040
```

Features:
- 📊 Request/response inspection
- 🔄 Replay requests
- 📈 Traffic statistics
- 🐛 Debug information

---

## 🔍 Testing the Deployment

### 1. Test Health Endpoint
```bash
curl https://YOUR-ID.ngrok.io/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-25T10:30:00.000Z",
  "uptime": 123.456
}
```

### 2. Test from Frontend
```bash
# Update frontend
NEXT_PUBLIC_BACKEND_URL=https://YOUR-ID.ngrok.io

# Test in browser console
fetch('https://YOUR-ID.ngrok.io/health')
  .then(r => r.json())
  .then(console.log)
```

### 3. Test API Endpoints
```bash
# Get events
curl https://YOUR-ID.ngrok.io/api/events

# Get oracle prices
curl https://YOUR-ID.ngrok.io/api/oracle/prices

# Check indexer status
curl https://YOUR-ID.ngrok.io/api/indexer/status
```

---

## 🔒 Security Considerations

### Free Tier Limitations
- ⚠️ URL changes every restart
- ⚠️ No custom domains
- ⚠️ Limited to 40 connections/minute
- ⚠️ No IP whitelisting

### Best Practices

1. **Use for development/testing only**
   - Not recommended for production
   - Temporary URLs

2. **Protect sensitive endpoints**
   ```javascript
   // Add API key check
   if (req.path.startsWith('/api/admin')) {
     if (req.headers['x-api-key'] !== process.env.BACKEND_API_KEY) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
   }
   ```

3. **Enable CORS properly**
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL || '*',
     credentials: true
   }));
   ```

4. **Monitor the dashboard**
   - Check for suspicious requests
   - Review all API calls
   - Watch for abuse

---

## 📦 Production Alternative

For production deployment, use proper hosting:

### Option 1: Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 2: Render
```bash
# Connect GitHub repo
# Auto-deploys on push
# Free tier: render.com
```

### Option 3: DigitalOcean App Platform
```bash
# Connect repo
# Automatic deployments
# Starts at $5/month
```

### Option 4: AWS/GCP/Azure
```bash
# Full control
# More complex setup
# Scalable
```

---

## 🐛 Troubleshooting

### Ngrok won't start
```bash
# Check if already running
ps aux | grep ngrok
pkill ngrok

# Check port availability
lsof -i :3001
lsof -i :4040
```

### Backend not accessible
```bash
# Verify backend is running
curl http://localhost:3001/health

# Check ngrok status
curl http://localhost:4040/api/tunnels | jq
```

### CORS errors
```bash
# Update backend CORS settings
# backend/src/server.ts
app.use(cors({
  origin: '*', // Allow all origins for testing
  credentials: true
}));
```

### SSL/HTTPS errors
```bash
# ngrok provides HTTPS automatically
# Use the https:// URL, not http://
```

---

## 📝 Common Commands

```bash
# Start ngrok
ngrok http 3001

# Start with custom subdomain (paid)
ngrok http 3001 --subdomain=myapp

# Start with specific region
ngrok http 3001 --region=eu

# Start with config file
ngrok start backend

# Get tunnel info via API
curl http://localhost:4040/api/tunnels

# Kill ngrok
pkill ngrok

# View logs
tail -f /tmp/ngrok.log
```

---

## 🎯 Quick Commands Reference

```bash
# Complete setup in 3 steps:

# 1. Start backend
cd backend && npm run dev &

# 2. Start ngrok
./ngrok-start.sh

# 3. Update frontend (new terminal)
./ngrok-update-frontend.sh https://YOUR-URL.ngrok.io
cd frontend && npm run dev
```

---

## 💡 Tips

1. **Keep URL for testing**
   - Save the ngrok URL
   - Share with team members
   - Valid until you restart ngrok

2. **Use ngrok dashboard**
   - Inspect all requests
   - Debug API calls
   - Replay failed requests

3. **Monitor performance**
   - Check response times
   - Watch for rate limits
   - Monitor bandwidth

4. **Paid plan benefits**
   - Custom subdomains
   - Reserved domains
   - More connections
   - IP whitelisting
   - Password protection

---

Your backend is now accessible from anywhere! 🌍
