# Running CivilVerify locally (Windows)

This is specific to this machine — Node is installed but isn't on PATH in a
plain PowerShell window, so the commands below account for that.

## One-time setup

Open PowerShell in the `civilverify-ai` folder (the one with `package.json`,
**not** the `app` subfolder) and run:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path

npm install
Copy-Item .env.example .env.local
npm run seed
```

- `npm install` — installs all dependencies (~2 min the first time).
- `Copy-Item .env.example .env.local` — turns on mock AI mode (no API key
  needed); skip this if `.env.local` already exists.
- `npm run seed` — creates one demo project so you have something to click
  into right away.

## Every time you want to run it

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm run dev
```

Then open **http://localhost:3000** in your browser.

Leave that PowerShell window open — closing it or pressing Ctrl+C stops the
server. To stop it deliberately, click into that window and press Ctrl+C.

## Making `node`/`npm` permanently available (optional, do once)

So you don't have to run the `$env:Path = ...` line every time:

1. Press Start → search **"Edit the system environment variables"** → open it.
2. Click **Environment Variables…**
3. Under **User variables**, select `Path` → **Edit** → **New** → paste:
   `C:\Program Files\nodejs`
4. OK out of all the dialogs, then **close and reopen** PowerShell.
5. Test with `node -v` and `npm -v` — both should print a version with no
   extra setup needed after that.

Once this is done, the "every time" step above is just `npm run dev`.

## If something looks broken

- **Blank/error page right after `npm install`**: make sure you ran
  `npm run seed` at least once, and that `.env.local` exists (copy it from
  `.env.example` if not).
- **Port already in use**: another `npm run dev` is probably still running
  in a different window — close it, or run `npm run dev -- -p 3001` and
  open that port instead.
- **Weird native-module crash mentioning `better-sqlite3`**: this project
  pins `better-sqlite3` to `^12.2.0` specifically because older versions
  crash on newer Node — if `package.json` ever shows an older version here,
  run `npm install better-sqlite3@^12.2.0` again.
