# LQ Dashboard Deployment Instructions
## For Interns - Step by Step Guide

Welcome! This guide will help you deploy the LQ Dashboard to the production server. Don't worry if you're new to this - we'll explain everything step by step.

---

## 📋 What You'll Need

Before starting, make sure you have:

1. **Access to the VPS server** (ask your supervisor for SSH credentials)
2. **Git repository access** (the code repository URL)
3. **Database credentials** (PostgreSQL username and password)
4. **Domain access** (to set up lqdashboard.esensigroup.com)

---

## 🎯 Deployment Overview

Here's what we're going to do:
1. Connect to the server
2. Download the code
3. Set up the backend
4. Set up the frontend
5. Configure nginx (web server)
6. Get SSL certificate (HTTPS)
7. Test everything

**Estimated time:** 30-45 minutes

---

## 📝 Step-by-Step Instructions

### Step 1: Connect to the VPS Server

**What is SSH?** It's a way to access and control the server remotely from your computer.

1. Open your terminal (Command Prompt on Windows, Terminal on Mac/Linux)
2. Type this command (replace with your actual server details):

```bash
ssh username@server-ip-address
```

**Example:**
```bash
ssh taktis@192.168.1.100
```

3. Enter the password when prompted (you won't see it as you type - this is normal!)
4. You're now connected! You should see a command prompt like: `username@server:~$`

---

### Step 2: Create Project Directory

**What we're doing:** Creating a folder to store our dashboard code.

```bash
# Navigate to the apps folder
cd ~/taktis/apps

# Create the project folder
mkdir -p leadsqualifier-dashboard

# Go into the new folder
cd leadsqualifier-dashboard
```

**Check it worked:**
```bash
pwd
```
You should see: `/home/your-username/taktis/apps/leadsqualifier-dashboard`

---

### Step 3: Download the Code

**What is Git?** It's a tool that helps us download and manage code.

```bash
# Clone the repository (download the code)
git clone YOUR_REPOSITORY_URL .
```

**Note:** The dot (.) at the end means "download into the current folder"

**Example:**
```bash
git clone https://github.com/taktis-ai/lq-dashboard.git .
```

**Check it worked:**
```bash
ls
```
You should see folders like: `frontend`, `backend`, `docs`

---

### Step 4: Set Up the Backend

**What is the backend?** It's the part that talks to the database and provides data to the frontend.

#### 4.1: Install Dependencies

```bash
# Go to the backend folder
cd backend

# Install required packages
npm install --production
```

**This will take 2-3 minutes.** You'll see a lot of text scrolling - that's normal!

#### 4.2: Create Environment File

**What is .env?** It's a file that stores secret information like passwords.

```bash
# Create the .env file
nano .env
```

**Nano is a text editor.** Now copy and paste this template:

```env
# Server Configuration
NODE_ENV=production
PORT=3002

# Database Configuration
DATABASE_URL=postgresql://lq_user:YOUR_DATABASE_PASSWORD@localhost:5432/leadsqualifier
DB_POOL_MAX=10

# Security
JWT_SECRET=GENERATE_THIS_BELOW
CORS_ORIGIN=https://lqdashboard.esensigroup.com

# Authentication (Phase 1 - Simple)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD_HERE
```

**Important: Replace these values:**
- `YOUR_DATABASE_PASSWORD` - Ask your supervisor for the PostgreSQL password
- `YOUR_ADMIN_PASSWORD_HERE` - Create a strong password for logging into the dashboard
- `GENERATE_THIS_BELOW` - We'll generate this next!

**To save in nano:**
1. Press `Ctrl + X`
2. Press `Y` (for yes)
3. Press `Enter`

#### 4.3: Generate JWT Secret

**What is JWT Secret?** It's a random string used to keep logins secure.

```bash
# Generate a secure random secret
openssl rand -base64 32
```

**Copy the output** (it looks like: `8K3j9fL2mN5pQ7rS9tU1vW3xY5zA2bC4dE6fG8hI0jK=`)

Now open the .env file again and paste it:

```bash
nano .env
```

Replace `GENERATE_THIS_BELOW` with the secret you just copied.

Save again (`Ctrl + X`, `Y`, `Enter`)

#### 4.4: Test the Backend

```bash
# Try to start the backend
node src/server.js
```

**If it works**, you'll see:
```
✓ Database connected
✓ Server running on port 3002
```

**Stop it:** Press `Ctrl + C`

If you see errors, **don't panic!** Check:
- Is the database password correct in .env?
- Is PostgreSQL running? (Ask your supervisor)

---

### Step 5: Set Up the Frontend

**What is the frontend?** It's the visual part users see and interact with.

```bash
# Go back to the main project folder
cd ..

# Go to the frontend folder
cd frontend

# Install packages
npm install
```

**This will take 3-5 minutes.**

#### 5.1: Create Frontend Environment File

```bash
nano .env
```

Add this single line:

```env
VITE_API_URL=/api
```

Save (`Ctrl + X`, `Y`, `Enter`)

#### 5.2: Build the Frontend

**What is building?** Converting the React code into optimized HTML/CSS/JS files.

```bash
npm run build
```

**This takes 1-2 minutes.** When done, you'll see: `✓ built in XXXms`

**Check it worked:**
```bash
ls dist
```

You should see files like: `index.html`, `assets/`

---

### Step 6: Set Up PM2 (Process Manager)

**What is PM2?** It keeps the backend running even if it crashes or the server restarts.

```bash
# Go back to project root
cd ..

# Start the backend with PM2
pm2 start ecosystem.config.js

# Save the PM2 configuration
pm2 save

# Make PM2 start automatically on server reboot
pm2 startup
```

**The last command will show you a command to copy.** Copy it and run it!

**Check it's running:**
```bash
pm2 status
```

You should see `lq-dashboard-backend` with status `online` ✅

**Useful PM2 commands:**
```bash
pm2 logs lq-dashboard-backend   # View logs
pm2 restart lq-dashboard-backend # Restart the backend
pm2 stop lq-dashboard-backend    # Stop the backend
```

---

### Step 7: Configure Nginx

**What is Nginx?** It's the web server that:
- Serves the frontend files
- Routes API requests to the backend
- Handles HTTPS (secure connections)

#### 7.1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/lqdashboard.esensigroup.com
```

**You'll need sudo password** (ask your supervisor if you don't have it)

Paste this configuration (replace `your-user` with your actual username):

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name lqdashboard.esensigroup.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name lqdashboard.esensigroup.com;
    
    # SSL certificates will be added by certbot
    
    # Frontend static files
    root /home/your-user/taktis/apps/leadsqualifier-dashboard/frontend/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_vary on;
    
    # API proxy to backend
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Frontend routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Save the file.

#### 7.2: Enable the Site

```bash
# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/lqdashboard.esensigroup.com /etc/nginx/sites-enabled/

# Test the configuration
sudo nginx -t
```

**You should see:**
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**If you see errors:**
- Check for typos in the config file
- Make sure you replaced `your-user` with your actual username
- Ask your supervisor for help!

#### 7.3: Reload Nginx

```bash
sudo systemctl reload nginx
```

---

### Step 8: Set Up SSL Certificate (HTTPS)

**What is SSL?** It makes the connection secure (the lock icon in the browser).

**Important:** Before this step, make sure the domain `lqdashboard.esensigroup.com` points to your server's IP address. Ask your supervisor to check this!

```bash
# Install Certbot (if not already installed)
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d lqdashboard.esensigroup.com
```

**Answer the questions:**
1. Email address: Enter your work email
2. Terms of Service: Type `Y` for yes
3. Share email: Type `N` for no
4. Redirect HTTP to HTTPS: Type `2` (Redirect)

**This will automatically:**
- Get a certificate from Let's Encrypt (free!)
- Update your nginx config
- Set up auto-renewal

**Check it worked:**
```bash
sudo certbot certificates
```

You should see your certificate listed!

---

### Step 9: Create Logs Directory

```bash
# Create directory for PM2 logs
mkdir -p ~/taktis/logs
```

---

### Step 10: Test the Dashboard! 🎉

#### 10.1: Test Backend Health

```bash
curl http://localhost:3002/api/health
```

**You should see:**
```json
{"status":"ok","timestamp":"..."}
```

#### 10.2: Test Frontend

Open your web browser and go to:
```
https://lqdashboard.esensigroup.com
```

**You should see:**
- The login page
- No security warnings (green lock)

#### 10.3: Test Login

1. Username: `admin` (or whatever you set in .env)
2. Password: (the ADMIN_PASSWORD you set)

**If login works**, you should see the dashboard! 🎊

---

## ✅ Post-Deployment Checklist

- [ ] Backend is running: `pm2 status` shows `online`
- [ ] Frontend loads at https://lqdashboard.esensigroup.com
- [ ] No SSL warnings in browser
- [ ] Login works
- [ ] Dashboard displays without errors
- [ ] Filters work (try selecting a client)
- [ ] Table shows data
- [ ] CSV export works

---

## 🔄 How to Update the Dashboard (Future Deployments)

When code changes are made:

```bash
# 1. Connect to server
ssh username@server-ip

# 2. Go to project folder
cd ~/taktis/apps/leadsqualifier-dashboard

# 3. Pull latest code
git pull

# 4. Update backend
cd backend
npm install
pm2 restart lq-dashboard-backend

# 5. Update frontend
cd ../frontend
npm install
npm run build

# Done! Changes are live
```

---

## 🆘 Troubleshooting

### Problem: Backend won't start

**Check logs:**
```bash
pm2 logs lq-dashboard-backend
```

**Common issues:**
- Database connection error → Check password in backend/.env
- Port already in use → Make sure nothing else uses port 3002
- Missing environment variable → Check all values in .env are filled

### Problem: Frontend shows "Cannot connect to API"

**Checks:**
1. Is backend running? `pm2 status`
2. Can you access health endpoint? `curl http://localhost:3002/api/health`
3. Is nginx configured correctly? `sudo nginx -t`
4. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Problem: SSL certificate error

**Checks:**
1. Does domain point to server? `ping lqdashboard.esensigroup.com`
2. Is port 80 and 443 open? Ask your supervisor
3. Try getting certificate again: `sudo certbot --nginx -d lqdashboard.esensigroup.com`

### Problem: Dashboard loads but no data

**Checks:**
1. Check browser console for errors (F12 → Console tab)
2. Are there database errors in backend logs? `pm2 logs lq-dashboard-backend`
3. Is PostgreSQL running? `sudo systemctl status postgresql`
4. Can backend connect to database? Check connection string in .env

### Problem: "Permission denied" errors

**Solution:**
```bash
# Make sure you own the project files
sudo chown -R $USER:$USER ~/taktis/apps/leadsqualifier-dashboard
```

---

## 📞 Getting Help

If you're stuck:

1. **Check the logs first:**
   - Backend: `pm2 logs lq-dashboard-backend`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`

2. **Take a screenshot** of any error messages

3. **Ask your supervisor** with:
   - What step you're on
   - What command you ran
   - The error message/screenshot
   - What you've already tried

---

## 🎓 What You've Learned

Congratulations! You've now:
- ✅ Deployed a full-stack web application
- ✅ Used Git, npm, and PM2
- ✅ Configured a web server (nginx)
- ✅ Set up SSL/HTTPS
- ✅ Managed environment variables
- ✅ Debugged server applications

These are real professional skills! 🌟

---

## 📚 Additional Resources

**Want to learn more?**

- **Git:** https://git-scm.com/docs
- **Node.js:** https://nodejs.org/docs
- **PM2:** https://pm2.keymetrics.io/docs
- **Nginx:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/docs/

---

**Last Updated:** March 13, 2026  
**Contact:** Ask your supervisor if you need help!
