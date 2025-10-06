/**
 * GAF Labeler Express Server
 * Deployed on Vercel
 * Exposes: https://gaf-badges.vercel.app/gaf_Bluesky/badge
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import handler from "./badge.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Allow CORS from both live and local origins
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "https://gaf.nyc",
        "https://www.gaf.nyc",
        "http://localhost:3000",
        "http://127.0.0.1:5500",
        undefined, // allows local file:// testing
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());
app.use(express.static(__dirname));

// === API Route ===
app.post("/gaf_Bluesky/api/badge", handler);

// Optional: health check
app.get("/gaf_Bluesky/health", (req, res) => {
  res.json({ status: "ok", labeler: "GAF Labeler Active" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ GAF Labeler running on http://localhost:${PORT}`)
);
