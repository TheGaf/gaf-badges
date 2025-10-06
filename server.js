/**
 * GAF Labeler Express Server (Vercel)
 * Exposes:
 *   POST https://gaf-badges.vercel.app/gaf_Bluesky/badge
 *   GET  https://gaf-badges.vercel.app/gaf_Bluesky/health
 *   GET  https://gaf-badges.vercel.app/badges.json
 */


import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import handler from "./badge.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ CORS for gaf.nyc and localhost
app.use(
  cors({
    origin: [
      "https://gaf.nyc",
      "https://www.gaf.nyc",
      "http://localhost:3000",
      "http://127.0.0.1:5500",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());
app.use(express.static(__dirname));

// === API Route ===
// This must match your HTML constant
app.post("/badge", handler);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", labeler: "GAF Labeler Active" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ GAF Labeler running on http://localhost:${PORT}`)
);
