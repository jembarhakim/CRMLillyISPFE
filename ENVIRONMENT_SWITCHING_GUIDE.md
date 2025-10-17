# 🔄 Environment Switching Guide

This guide shows you how to easily switch between local development and production environments.

## 🚀 Quick Commands

### Switch to Local Development (localhost:3001)
```bash
npm run switch:local
# or
node switch-env.js local
```

### Switch to Production (Railway)
```bash
npm run switch:production
# or
node switch-env.js production
```

## 📝 What Happens When You Switch

When you run a switch command, it creates/updates a `.env` file with the appropriate API endpoints:

**Local Environment:**
```
NUXT_PUBLIC_API_HOST=http://localhost:3001
NUXT_PUBLIC_WA_HOST=http://localhost:3001
```

**Production Environment:**
```
NUXT_PUBLIC_API_HOST=https://crm-be-production-cfa1.up.railway.app
NUXT_PUBLIC_WA_HOST=https://crm-be-production-cfa1.up.railway.app
```

## 🛠️ Development Workflow

### For Local Development:
1. **Switch to local**: `npm run switch:local`
2. **Start your local backend** (Go app on port 3001)
3. **Run frontend**: `npm run dev`

### For Production Build:
1. **Switch to production**: `npm run switch:production`
2. **Generate static build**: `npm run generate`
3. **Upload `.output/public/` to cPanel**

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run switch:local` | Switch to local development environment |
| `npm run switch:production` | Switch to production environment |
| `npm run dev:local` | Switch to local + start dev server |
| `npm run dev:production` | Switch to production + start dev server |
| `npm run generate:local` | Switch to local + generate static build |
| `npm run generate:production` | Switch to production + generate static build |

## ⚠️ Important Notes

- **Always switch environments before building** for deployment
- **Local development** requires your Go backend to be running on `localhost:3001`
- **Production builds** will connect to your Railway backend
- The `.env` file is automatically generated and should be committed to git

## 🎯 Current Status

✅ **Environment switching system configured**
✅ **Local development ready** (localhost:3001)
✅ **Production deployment ready** (Railway)
✅ **Easy one-command switching**

---

**Need help?** Just run `node switch-env.js` without arguments to see available options.
