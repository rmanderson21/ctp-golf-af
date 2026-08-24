# Closest to the Pin — Night Golf Bracket

Your ESPN-style closest-to-the-pin bracket, running on your own domain.
Same admin panel + TV display as before — just backed by a small server
you host, instead of Claude's storage.

## What's in this folder

- `server.js` — a tiny Node server. Serves the site and stores the
  current event/bracket as one JSON file on disk, so the admin panel
  (phone/iPad) and the TV display stay in sync.
- `public/index.html` — the whole app (design, admin, TV display).
- `package.json` — just one dependency (Express).

## Try it on your own computer first (optional but recommended)

You'll need [Node.js](https://nodejs.org) installed (v18 or newer).

```
cd ctp-site
npm install
npm start
```

Then open `http://localhost:3000` in a browser. Confirm the admin panel
and display work the same as before. Ctrl+C to stop it.

## Getting it onto your domain

The easiest path is **Render.com** — one account, free custom domains,
and you can add a small persistent disk so your event data survives
restarts. Total cost is about $7/month for the smallest instance with a
persistent disk (Render's free tier works too, but its disk is not
guaranteed to survive a redeploy — see the note at the end).

### 1. Put this folder in a GitHub repo
- Create a new repo on GitHub (can be private).
- Upload this whole `ctp-site` folder to it (drag-and-drop on
  github.com works fine if you don't use git normally).

### 2. Create the web service on Render
1. Go to [render.com](https://render.com) and sign up / log in.
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and pick the repo you just created.
4. Fill in:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Create Web Service**. Render will build and deploy it —
   you'll get a URL like `https://your-app.onrender.com` that already
   works.

### 3. Add a persistent disk (so your data doesn't reset)
1. On your new service in Render, go to **Disks** → **Add Disk**.
2. Mount path: `/data`, size: 1 GB is plenty.
3. Go to **Environment** and add a variable:
   - `DATA_DIR` = `/data`
4. Save — Render will redeploy automatically. Your event data now
   lives on that disk permanently.

### 4. Point your domain at it
1. On the Render service, go to **Settings** → **Custom Domains** →
   **Add Custom Domain**. Enter something like `golf.yourdomain.com`
   (a subdomain is simplest) or your root domain.
2. Render shows you a DNS record to add (usually a `CNAME` pointing to
   something like `your-app.onrender.com`, or an `A` record for a root
   domain).
3. Go to wherever you manage your domain's DNS (GoDaddy, Namecheap,
   Google Domains, Cloudflare, etc.), and add that record.
4. DNS changes can take anywhere from a few minutes to a few hours to
   go live. Render will show a green checkmark once it's verified, and
   will automatically issue you free HTTPS.

That's it — `https://golf.yourdomain.com` (or whatever you chose) now
runs the exact same site, admin panel included.

## Day-of-event checklist

- Open the site on the TV's browser — leave it on the default
  **Display** view (that's what shows on the projector/TV).
- Open the same URL on your phone or iPad, tap **Admin View** top
  right, and manage players/scores from there.
- Both stay in sync automatically every few seconds.

## A note on the free tier

Render's free web services spin down after ~15 minutes of no traffic
and take a few seconds to wake back up on the next visit — fine for a
once-a-week event, just expect a short delay on the very first load.
Free instances also don't support persistent disks, so if you skip
step 3 above, a redeploy (or Render restarting the service) will reset
your event data back to empty. If that's fine for your use case (fresh
bracket each event anyway), the free tier alone works great — just add
the disk if you'd rather not risk it.
