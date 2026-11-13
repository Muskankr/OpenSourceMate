# OpenSourceMate Deployment Guide & Production Checklist

This guide provides end-to-end instructions for deploying **OpenSourceMate** to production environments, configuring cross-origin communication between the Next.js frontend and FastAPI backend, and performing pre-release verification.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend Deployment (Vercel)](#2-frontend-deployment-vercel)
3. [Backend Deployment (Render, Railway, or VPS)](#3-backend-deployment)
4. [Connecting Frontend and Backend (CORS & Networking)](#4-connecting-frontend-and-backend)
5. [Complete Environment Variable Reference](#5-complete-environment-variable-reference)
6. [Pre-Release Production Checklist](#6-pre-release-production-checklist)
7. [Troubleshooting & Common Deployment Issues](#7-troubleshooting--common-deployment-issues)

---

## 1. Architecture Overview

OpenSourceMate consists of two independently deployable components:

```text
┌─────────────────────────────────┐         HTTPS / JSON REST          ┌──────────────────────────────────┐
│        Next.js Frontend         │ ─────────────────────────────────> │         FastAPI Backend          │
│       (Hosted on Vercel)        │                                    │  (Render / Railway / Fly.io / VPS)│
│ open-source-mate-tawny.vercel...│ <───────────────────────────────── │    api.opensourcemate.com        │
└─────────────────────────────────┘           CORS Allowed             └──────────────────────────────────┘
                                                                                         │
                                                                                         ▼
                                                                               GitHub REST API v3
                                                                               api.github.com
```

- **Frontend**: Next.js 15 (React 19, TypeScript, Tailwind CSS), optimized for edge delivery on **Vercel**.
- **Backend**: Python 3.10+ FastAPI application served with Uvicorn, deployable to any container platform or PaaS (Render, Railway, Fly.io, AWS, or Ubuntu VPS).

---

## 2. Frontend Deployment (Vercel)

Follow these steps to deploy the frontend from a fresh Vercel account:

### Step 1: Import GitHub Repository
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Select your fork or the official `OpenSourceMate` repository and click **Import**.

### Step 2: Configure Project Settings
In the Vercel project configuration screen:
- **Project Name**: `opensource-mate` (or your preferred name).
- **Framework Preset**: `Next.js` (detected automatically).
- **Root Directory**: Click **Edit** and set it to:
  ```text
  frontend
  ```
- **Build Command**: `npm run build` (default).
- **Output Directory**: `.next` (default).
- **Install Command**: `npm install` (default).

### Step 3: Set Environment Variables
Expand the **Environment Variables** section and configure:

| Variable | Recommended Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.your-backend-domain.com` | Base URL of your deployed FastAPI backend server (no trailing slash). |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app` | Canonical domain used for sitemap generation and OpenGraph cards. |

> **Note**: Variables prefixed with `NEXT_PUBLIC_` are baked into client bundles at build time. Never place secrets or private API keys here.

### Step 4: Deploy
Click **Deploy**. Vercel will build and deploy the Next.js frontend within 1-2 minutes.

---

## 3. Backend Deployment

The backend can be hosted on any service supporting Python 3.10+ and long-running web processes.

### Option A: Render (Web Service)
1. In your [Render Dashboard](https://dashboard.render.com), click **New** > **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Under **Advanced** > **Environment Variables**, configure required production settings (see [Environment Variables](#backend-production-variables) below).

### Option B: Railway
1. In your [Railway Dashboard](https://railway.app), click **New Project** > **Deploy from GitHub repo**.
2. In service settings, set **Root Directory** to `/backend`.
3. Set build command: `pip install -r requirements.txt`.
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add production environment variables.

### Option C: Ubuntu VPS with Systemd & Nginx
If deploying on a Linux VM:
```bash
# 1. Clone and set up virtualenv
cd /var/www/OpenSourceMate/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Run with production settings
export ENVIRONMENT=production
export DEBUG=False
export SECRET_KEY="your-secure-random-32-byte-secret"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Configure Nginx as a reverse proxy passing `Host`, `X-Real-IP`, and `X-Forwarded-For` headers.

---

## 4. Connecting Frontend and Backend

Cross-origin resource sharing (CORS) must be configured so the browser allows the frontend to communicate with the backend:

1. **Frontend to Backend**:
   - In Vercel, set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`.
   - The frontend's `apiClient.ts` will direct all profile, skill, and recommendation queries to this endpoint.
2. **Backend to Frontend (CORS)**:
   - In your backend environment settings, configure:
     ```bash
     CORS_ORIGINS=https://your-project.vercel.app,https://open-source-mate-tawny.vercel.app
     ```
   - Multiple origins can be comma-separated without spaces.
3. **Allowed Hosts**:
   - Set `ALLOWED_HOSTS` to your backend hostname (e.g. `api.yourdomain.com`) to prevent HTTP Host Header injection attacks.

---

## 5. Complete Environment Variable Reference

### Backend Production Variables

| Variable | Required in Prod? | Example Value | Description |
|---|---|---|---|
| `ENVIRONMENT` | **Yes** | `production` | Enables strict production assertions. |
| `DEBUG` | **Yes** | `False` | **Must be False** in production. Startup fails if True. |
| `SECRET_KEY` | **Yes** | `8f4b2c1e9a3d7f0e...` | Cryptographic secret (minimum 16 chars). Generate with `python -c "import secrets; print(secrets.token_hex(32))"`. |
| `ALLOWED_HOSTS` | **Yes** | `api.opensourcemate.com` | Permitted Host headers for TrustedHostMiddleware. |
| `CORS_ORIGINS` | **Yes** | `https://your-frontend.vercel.app` | Comma-separated list of allowed frontend origins. |
| `GITHUB_TOKEN` | Recommended | `ghp_xxxxxxxxxxxx` | Personal Access Token raising GitHub API rate limit from 60 to 5,000 req/hr. |
| `GITHUB_CACHE_TTL` | Optional | `300` | In-memory cache duration in seconds (default: 300). |
| `AI_API_KEY` | Optional | `sk-proj-...` | OpenAI API key for AI match explanations (gracefully falls back if omitted). |
| `AI_MODEL` | Optional | `gpt-4o-mini` | LLM model name. |

---

## 6. Pre-Release Production Checklist

Run through this checklist before launching or rolling out a new release:

### ⚙️ 1. Environment & Configuration
- [ ] `ENVIRONMENT=production` is set in the backend host.
- [ ] `DEBUG=False` is confirmed (FastAPI will abort startup if set to True).
- [ ] `SECRET_KEY` is set to a unique, cryptographically random string (32+ characters).
- [ ] `CORS_ORIGINS` includes the exact production Vercel URL (with `https://`, no trailing slash).
- [ ] `ALLOWED_HOSTS` matches the production API domain.
- [ ] `NEXT_PUBLIC_API_URL` on Vercel points to the backend API domain.

### 🩺 2. Health & Connectivity Verification
- [ ] Test public health endpoint:
  ```bash
  curl -i https://api.yourdomain.com/api/health
  # Expected: HTTP 200 OK with {"status": "healthy", "service": "OpenSourceMate API"}
  ```
- [ ] Test diagnostics endpoint:
  ```bash
  curl -i https://api.yourdomain.com/api/health/diagnostics
  # Expected: HTTP 200 OK with github_api status "reachable" and rate_limit remaining > 0
  ```

The same health check, plus a profile and skill analysis for a known user, runs automatically after production deployments and every 6 hours. See [Post-Deployment Smoke Test](smoke-test.md).

### 🧪 3. End-to-End User Verification
- [ ] Open frontend in a browser (e.g., `https://your-frontend.vercel.app`).
- [ ] Enter a real GitHub username (e.g., `octocat` or `torvalds`) and click **Analyze Profile**.
- [ ] Verify profile stats (avatar, repo count, followers) load without errors.
- [ ] Verify skill chart and proficiency badges render.
- [ ] Verify recommended issues appear and the starter contribution claim comment copies to clipboard.
- [ ] Test Dark and Light theme toggles.
- [ ] Verify `/privacy` page loads and the `/sitemap.xml` returns valid XML.

---

## 7. Troubleshooting & Common Deployment Issues

### Issue 1: CORS Error in Browser Console
* **Symptom**: `Access to fetch at 'https://api.yourdomain.com/...' from origin 'https://frontend.vercel.app' has been blocked by CORS policy`.
* **Fix**: Ensure your frontend domain is present in `CORS_ORIGINS` in your backend environment variables (exact match, including `https://` and no trailing slash). Restart backend after updating.

### Issue 2: Backend Fails on Startup with `ValueError: SECRET_KEY...`
* **Symptom**: Application crashes immediately on boot with `ValueError: SECRET_KEY must be set to a secure, unique string...`.
* **Fix**: In production mode (`ENVIRONMENT=production`), OpenSourceMate enforces strict security and rejects blank or default secret keys. Set a random 32-character secret key.

### Issue 3: GitHub 429 Rate Limit Errors
* **Symptom**: API returns `RATE_LIMIT_EXCEEDED` error code.
* **Fix**: Unauthenticated GitHub requests are capped at 60 requests/hour across the server IP. Set a `GITHUB_TOKEN` (classic or fine-grained with public read-only access) in backend environment variables to raise the limit to 5,000 requests/hour.
