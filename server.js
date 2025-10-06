/**
 * GAF Labeler Express Server
 * Deployed on Vercel
 * Exposes: https://gaf-badges.vercel.app/gaf_Bluesky/badge
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import handler from "./badge.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // serves badges.json, etc.

// === API Routes ===
app.post("/gaf_Bluesky/badge", handler);
app.get("/gaf_Bluesky/health", (req, res) => {
  res.json({ status: "ok", labeler: "GAF Labeler Active" });
});

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ GAF Labeler running on http://localhost:${PORT}`);
});
