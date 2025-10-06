/**
 * GAF Labeler Express Server
 * Runs on HostPapa or any Node-capable host.
 * Exposes:  https://gaf.nyc/gaf_Bluesky/api/badge
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import handler from "./badge.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // serves badges.html, badges.json, etc.

// === API Route ===
app.post("/gaf_Bluesky/api/badge", handler);

// Optional: health check route
app.get("/gaf_Bluesky/api/health", (req, res) => {
  res.json({ status: "ok", labeler: "GAF Labeler Active" });
});

// === Start server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ GAF Labeler running on http://localhost:${PORT}`);
});
