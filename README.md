# 🏷️ The GAF Labeler

**A custom Bluesky labeler and badge assignment system by The Gaf**

---

### 🔧 Overview

The GAF Labeler is a simple Node-based backend that connects to the Bluesky Labeler API.
It lets users claim verified-style badges through a hosted HTML form — and automatically writes them to your Bluesky labeler DID.

The system consists of:

* **Frontend (HTML)** hosted at [gaf.nyc/gaf_Bluesky/badges.html](https://gaf.nyc/gaf_Bluesky/badges.html)
* **Backend (Node + Express)** deployed on [Vercel](https://vercel.com/the-gafs-projects/gaf-badges)
* **Local badge mirror** stored in `badges.json`

---

### 🧹 How It Works

1. A user visits the public badge page on **gaf.nyc**
2. They pick a badge and enter their Bluesky handle
3. The HTML form calls the API endpoint:

   ```
   https://gaf-badges.vercel.app/api/badge
   ```
4. The backend:

   * Resolves the user’s **DID**
   * Sends a `com.atproto.label.create` request to the Bluesky network
   * Updates `badges.json` as a local mirror
5. The user’s badge now appears under their Bluesky moderation labels — and on the live **Badge Wall**.

---

### 🧩 Folder Structure

```
/gaf-badges
 ├── server.js       # Express entrypoint for Vercel
 ├── badge.js        # Core logic (label creation + local mirror)
 ├── badges.json     # Local mirror of all claimed badges
 ├── package.json    # Node dependencies + metadata
 └── README.md       # This file
```

---

### 🔑 Environment Variables

Before deploying, set these in your **Vercel → Settings → Environment Variables**:

| Variable        | Description                                                 |
| --------------- | ----------------------------------------------------------- |
| `BLUESKY_TOKEN` | Your Bluesky app password (from Settings → App Passwords)   |
| `LABELER_DID`   | Your labeler DID (e.g., `did:plc:7s64rkmtimbhralueam7rxnl`) |

---

### 🚀 Deploying to Vercel

1. Push this repo to GitHub: [`https://github.com/TheGaf/gaf-badges`](https://github.com/TheGaf/gaf-badges)
2. Connect it to your [Vercel project](https://vercel.com/the-gafs-projects/gaf-badges)
3. Make sure your environment variables are added
4. Deploy — Vercel will automatically install dependencies from `package.json`

You can verify it’s running by visiting:

```
https://gaf-badges.vercel.app/api/health
```

If you see:

```json
{ "status": "ok", "labeler": "GAF Labeler Active" }
```

you’re live.

---

### 🌐 Frontend Connection

Your public HTML form should call the Vercel API endpoint:

```js
const API_ENDPOINT = "https://gaf-badges.vercel.app/api/badge";
```

This file lives on **gaf.nyc** and does not need to be in the repo.

---

### 🧠 Notes

* `badge.php` was a static-only prototype and is no longer used.
* All writes to `badges.json` are safe and deduplicated by handle.
* `badge.js` includes local mirroring and basic error handling.
* You can expand this later to support multiple labelers or categories.

---

### 💬 Author

**Created by The Gaf**
[gaf.nyc](https://gaf.nyc) | [bsky.app/profile/thegaf.bsky.social](https://bsky.app/profile/thegaf.bsky.social)

---

### ⚡ License

Copyright © The Gaf
Open for reference and inspiration — attribution appreciated.
