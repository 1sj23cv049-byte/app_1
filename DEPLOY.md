# Deploying CivilVerify to an always-on host

The Android app is just a thin shell around a live website, so the backend
(Next.js server + SQLite + uploaded files) has to run somewhere that stays up
when your PC is off. This walks through **Railway**, which is the least
fiddly option for this stack: it builds straight from the `Dockerfile` in
this repo and gives you a persistent disk for `data/`.

Other hosts that work the same way: **Render** (add a "Persistent Disk"),
**Fly.io** (`fly volumes create`), or any VPS with Docker. The only hard
requirement is a persistent volume mounted at `/app/data`.

---

## 1. Put the code on GitHub

The repo is already initialised and committed locally (`D:\civilverify-ai`).
You just need a GitHub repo to push it to.

1. Go to <https://github.com/new>
2. Name it `civilverify-ai`, leave it **empty** (no README, no .gitignore,
   no licence), Private is fine. Create it.
3. Back in a terminal in `D:\civilverify-ai`, run what GitHub shows under
   *"…or push an existing repository"* — it will look like:

   ```powershell
   $env:Path = "D:\devtools\git\cmd;" + $env:Path
   git remote add origin https://github.com/<your-username>/civilverify-ai.git
   git branch -M main
   git push -u origin main
   ```

   The first `git push` will pop up a GitHub sign-in — sign in with your
   browser when it asks. (Tell me once it's pushed and I can take it from
   here for the app build.)

---

## 2. Deploy on Railway

1. Sign up at <https://railway.com> (use the **Login with GitHub** button —
   it makes the next step one click).
2. **New Project → Deploy from GitHub repo → `civilverify-ai`.**
3. Railway detects the `Dockerfile` and starts building. Let the first build
   finish (it will deploy, then we'll fix storage + the URL).

### 2a. Add the persistent disk

Uploaded PDFs/photos and the database live in `data/` — without a volume
they vanish on every redeploy.

1. In the project, click your service → **Variables** tab is fine to skip.
2. Go to the service's **Settings** → scroll to **Volumes** → **New Volume**.
3. Mount path: `/app/data`  — save.
4. Railway redeploys with the disk attached.

### 2b. Set environment variables

Service → **Variables** → add:

| Name           | Value        |
| -------------- | ------------ |
| `USE_MOCK_AI`  | `true`       |
| `NODE_ENV`     | `production` |

(Leave `ANTHROPIC_API_KEY` out for now — mock AI needs no key. Add it later
with `USE_MOCK_AI=false` when you want real analysis.)

### 2c. Get the public URL

Service → **Settings** → **Networking** → **Generate Domain**. Pick port
`3000` if it asks. You'll get something like
`https://civilverify-ai-production.up.railway.app`.

Open that URL in a browser — you should see the CivilVerify home screen.

---

## 3. Hand the URL back

Once that public URL loads, give it to me. I'll point the Android app at it,
build the APK, and hand you the file.

---

## Redeploying later

Any `git push` to `main` triggers a fresh Railway build automatically. The
`data/` volume is untouched by redeploys, so projects/photos/rates persist.
