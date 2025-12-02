# Deployment Guide: Netlify (Frontend) & Railway/Render (Backend)

## 1. GitHub Repository Setup
Ensure your latest code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

## 2. Backend Deployment (Railway or Render)

### Option A: Railway (Recommended for Ease of Use)
1.  Log in to [Railway](https://railway.app/).
2.  Click **New Project** > **Deploy from GitHub repo**.
3.  Select your repository.
4.  **Configuration:**
    *   **Root Directory:** `/backend`
    *   **Build Command:** (Leave empty or use default)
    *   **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` (Railway often detects the `Procfile` or `Dockerfile.prod` if you point to it).
5.  **Database:**
    *   In the Railway project view, right-click > **New** > **Database** > **PostgreSQL**.
    *   Railway will provide a `DATABASE_URL`.
6.  **Environment Variables (Variables tab):**
    *   `DATABASE_URL`: (Paste the value from the Postgres service)
    *   `LIVEKIT_URL`: (Your LiveKit URL)
    *   `LIVEKIT_API_KEY`: (Your Key)
    *   `LIVEKIT_API_SECRET`: (Your Secret)
    *   `GEMINI_API_KEY`: (Your Gemini Key)
7.  **Deploy:** Railway will build and deploy. Copy the **Service URL** (e.g., `https://backend-production.up.railway.app`).

### Option B: Render (Good Free Tier)
1.  Log in to [Render](https://render.com/).
2.  Click **New +** > **Web Service**.
3.  Connect your GitHub repo.
4.  **Settings:**
    *   **Root Directory:** `backend`
    *   **Runtime:** Python 3
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5.  **Environment Variables:**
    *   Add `DATABASE_URL`, `GEMINI_API_KEY`, etc.
6.  **Database:** You will need a Postgres DB. You can create a **PostgreSQL** service on Render (free tier available) and link it.

---

## 3. Frontend Deployment (Netlify)

1.  Log in to [Netlify](https://www.netlify.com/).
2.  Click **Add new site** > **Import from an existing project**.
3.  Select **GitHub** and choose your repository.
4.  **Build Settings:**
    *   **Base directory:** `frontend`
    *   **Build command:** `npm run build`
    *   **Publish directory:** `dist`
5.  **Environment Variables:**
    *   Click **Show advanced** > **New Variable**.
    *   Key: `VITE_API_URL`
    *   Value: (The Backend URL you got from Railway/Render, e.g., `https://your-app.railway.app/api`) -> **IMPORTANT:** Ensure you append `/api` if your backend routes are prefixed or just the base URL depending on your code.
    *   *Note based on code:* Your frontend expects the base URL. If your backend routes are like `/api/auth/login`, and your `api.ts` says `baseURL: API_URL`, then set `VITE_API_URL` to `https://your-backend.com/api`.
6.  **Deploy:** Click **Deploy site**.

## 4. Final Verification
1.  Open your Netlify URL.
2.  Try to **Login** (Client or Lawyer).
3.  If you get a "Network Error" or "404", check:
    *   **Browser Console:** Is it hitting the correct backend URL?
    *   **CORS:** The backend is currently set to allow `*` (all origins), so this should work.
    *   **Database:** Did the backend successfully connect to the DB? Check Railway/Render logs.
