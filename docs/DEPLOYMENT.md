# EchoSelf Deployment Guide

This guide covers deploying EchoSelf to various platforms for the Cal Hacks demo and beyond.

---

## 🚀 Quick Deploy to Vercel (Recommended)

Vercel is the easiest option for Next.js apps.

### Steps:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env`:
     - `FISH_AUDIO_API_KEY`
     - `ANTHROPIC_API_KEY`
     - `DATABASE_URL`
     - `CHROMA_HOST` (if using external ChromaDB)
     - `CHROMA_PORT`
     - `FETCH_AI_API_KEY` (optional)
     - `NEXT_PUBLIC_BASE_URL` (set to your Vercel URL)

5. **Configure Database**
   - For production, use PostgreSQL instead of SQLite
   - Update `DATABASE_URL` to PostgreSQL connection string
   - Run migrations:
     ```bash
     vercel env pull .env.local
     npx prisma migrate deploy
     ```

6. **File Upload Storage**
   - Vercel's filesystem is ephemeral
   - Use cloud storage (S3, Cloudinary, Vercel Blob) for user uploads
   - Update upload logic in `/app/api/upload/route.ts`

---

## 🐳 Docker Deployment

### Build Image

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

Update `next.config.js`:

```javascript
module.exports = {
  // ... other config
  output: 'standalone',
}
```

### Build and Run

```bash
docker build -t echoself .
docker run -p 3000:3000 --env-file .env echoself
```

### Docker Compose (with ChromaDB)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./data/dev.db
      - CHROMA_HOST=chroma
      - CHROMA_PORT=8000
    env_file:
      - .env
    depends_on:
      - chroma
    volumes:
      - ./data:/app/data

  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma-data:/chroma/chroma

volumes:
  chroma-data:
```

Run:
```bash
docker-compose up -d
```

---

## ☁️ Cloud Platforms

### Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables
5. Railway auto-detects Next.js and builds

**Database:** Railway provides PostgreSQL - add as service

### Render

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repository
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add environment variables

**Database:** Use Render PostgreSQL instance

### Fly.io

1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Deploy: `fly deploy`

### AWS (EC2)

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone <your-repo>
cd CalHacks

# Install dependencies
npm ci

# Setup environment
nano .env  # Add your environment variables

# Build
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start with PM2
pm2 start npm --name "echoself" -- start

# Setup PM2 to start on boot
pm2 startup
pm2 save
```

**Nginx Configuration** (`/etc/nginx/sites-available/echoself`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🗄️ Database Options

### Development
- **SQLite** (current setup)
- File-based, no server needed

### Production

#### PostgreSQL (Recommended)

**Vercel Postgres:**
```bash
# Install Vercel Postgres in dashboard
# Update DATABASE_URL to provided connection string
```

**Railway Postgres:**
- Add PostgreSQL plugin
- Copy connection string

**Supabase:**
```bash
# Sign up at supabase.com
# Create project
# Get connection string from Settings → Database
```

Update `.env`:
```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
```

Run migrations:
```bash
npx prisma migrate deploy
```

#### MongoDB (Alternative)

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
```

---

## 💾 File Storage

Vercel's filesystem is read-only in production. Options:

### Vercel Blob

```bash
npm install @vercel/blob
```

Update upload handler:
```typescript
import { put } from '@vercel/blob'

const blob = await put('audio.webm', audioFile, {
  access: 'public',
})
// blob.url
```

### AWS S3

```bash
npm install @aws-sdk/client-s3
```

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: 'us-east-1' })
await s3.send(new PutObjectCommand({
  Bucket: 'your-bucket',
  Key: 'path/to/file',
  Body: buffer,
}))
```

### Cloudinary

```bash
npm install cloudinary
```

```typescript
import { v2 as cloudinary } from 'cloudinary'

const result = await cloudinary.uploader.upload(file, {
  resource_type: 'auto',
})
// result.secure_url
```

---

## 🔍 ChromaDB Deployment

### Option 1: Chroma Cloud
- Sign up at [trychroma.com](https://trychroma.com)
- Get hosted instance URL
- Update `.env` with remote URL

### Option 2: Self-Hosted (Docker)

On separate server:
```bash
docker run -d -p 8000:8000 \
  -v chroma-data:/chroma/chroma \
  --name chromadb \
  chromadb/chroma
```

### Option 3: Railway/Render
- Deploy ChromaDB container
- Expose port 8000
- Update `CHROMA_HOST` in main app

---

## 🌐 Custom Domain

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Other Platforms
1. Get server IP or CNAME
2. Add DNS records:
   ```
   A     @    your-server-ip
   CNAME www  your-app.platform.com
   ```

### SSL/HTTPS
- Vercel: Automatic
- Let's Encrypt: Use Certbot
  ```bash
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d yourdomain.com
  ```

---

## 📊 Monitoring

### Vercel Analytics
```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Sentry (Error Tracking)
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## 🔒 Security Checklist

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS
- [ ] Implement rate limiting on API routes
- [ ] Validate and sanitize user inputs
- [ ] Set up CORS properly
- [ ] Use secure database connections
- [ ] Implement authentication (if needed)
- [ ] Regular dependency updates
- [ ] Monitor logs for suspicious activity

---

## 🧪 Pre-Deployment Testing

```bash
# Build test
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Production mode locally
npm run build && npm start
```

---

## 📈 Performance Optimization

1. **Image Optimization**
   - Use Next.js `<Image>` component
   - Compress user uploads

2. **API Route Caching**
   ```typescript
   export const revalidate = 60 // Cache for 60 seconds
   ```

3. **Database Indexing**
   ```prisma
   model User {
     id String @id @default(cuid())
     email String? @unique
     @@index([email])
   }
   ```

4. **CDN for Static Assets**
   - Vercel handles this automatically
   - Or use Cloudflare

---

## 🎉 Launch Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] File storage configured
- [ ] ChromaDB accessible
- [ ] API keys valid and funded
- [ ] Domain configured (if custom)
- [ ] SSL certificate active
- [ ] Error tracking setup
- [ ] Analytics configured
- [ ] Tested all user flows
- [ ] Performance checked
- [ ] Security review completed

---

## 🆘 Rollback Procedure

### Vercel
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Docker
```bash
# Revert to previous image
docker run previous-image-tag
```

### Git
```bash
# Revert to previous commit
git revert HEAD
git push
```

---

Good luck with your Cal Hacks demo! 🚀

