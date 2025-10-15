# Deploy backend to Render

This guide walks through deploying the FastAPI backend (`backend/`) to Render as a Web Service.

## 1. Prerequisites
- A Render account and logged in at <https://dashboard.render.com>.
- This repository pushed to GitHub/GitLab/Bitbucket so Render can access it.
- The repository contains `render.yaml` (added in this commit) at the root and `backend/requirements.txt` lists all Python dependencies.

## 2. One-click deploy via `render.yaml`
1. From the Render dashboard choose **New +** → **Blueprint**.
2. Select your Git repository and branch.
3. Render reads `render.yaml` and suggests creating a Web Service named `video-dictation-backend`.
4. Confirm the region/plan (Free by default) and click **Create Resources**.
5. Render installs dependencies with `pip install --upgrade pip && pip install -r requirements.txt` and starts Uvicorn with `uvicorn main:app --host 0.0.0.0 --port $PORT` inside the `backend/` directory.
6. Wait for the build logs to show `Server startup complete`. Your backend will be available at the URL shown in the Render dashboard (for example `https://video-dictation-backend.onrender.com`).

## 3. Configure environment variables (optional)
- The service automatically sets the `PORT` environment variable. Do **not** hard-code a port in the app; `render.yaml` already passes `$PORT` to Uvicorn.
- If you later add secrets (e.g. API keys), open the service → **Environment** tab and add them there.

## 4. Test the deployment
After the service reports it is live, use `curl` or any HTTP client:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"videoId": "<YOUTUBE_ID>"}' \
  https://video-dictation-backend.onrender.com/api/captions
```

You should receive a JSON response containing `sentences`.

## 5. Triggering new deployments
- Every push to the selected branch triggers a new build.
- You can also click **Manual Deploy** → **Deploy Latest Commit** from the service dashboard.

## 6. Troubleshooting tips
- If the build fails because dependencies are missing, add them to `backend/requirements.txt` and redeploy.
- Render logs are available in the **Logs** tab; use them to inspect errors when the service fails to boot.
- Ensure the backend can reach YouTube; Render Free plan allows outbound requests but rate limits may apply.
