/**
 * GAF Labeler Express Server (Vercel)
 * Exposes:
 *   POST https://gaf-badges.vercel.app/gaf_Bluesky/badge
 *   GET  https://gaf-badges.vercel.app/gaf_Bluesky/health
 *   GET  https://gaf-badges.vercel.app/badges.json
 */
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cors from "cors";
import handler from "./badge.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use Vercel's ephemeral /tmp for writes
const TMP_BADGES = path.join(process.env.TMPDIR || "/tmp", "badges.json");
const SEED_BADGES = path.join(__dirname, "badges.json");

// Seed /tmp/badges.json once per container
try {
  if (!fs.existsSync(TMP_BADGES)) {
    const seed = fs.existsSync(SEED_BADGES)
      ? fs.readFileSync(SEED_BADGES, "utf8")
      : JSON.stringify({ badges: [] }, null, 2);
    fs.writeFileSync(TMP_BADGES, seed, "utf8");
  }
} catch (e) {
  console.error("Init badges.json failed:", e);
}

const app = express();

// CORS for your site + local dev + preflight
app.use(
  cors({
    origin: ["https://gaf.nyc", "https://www.gaf.nyc", "http://localhost:3000", "http://127.0.0.1:5500"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.options("*", cors());

app.use(express.json());

// Serve live badges.json from /tmp (CORS-enabled)
app.get("/badges.json", (req, res) => {
  try {
    const json = fs.readFileSync(TMP_BADGES, "utf8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.type("application/json").send(json);
  } catch (e) {
    const fallback = fs.existsSync(SEED_BADGES)
      ? fs.readFileSync(SEED_BADGES, "utf8")
      : JSON.stringify({ badges: [] });
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.type("application/json").send(fallback);
  }
});

// Your routes (keep the gaf_Bluesky prefix only here)
app.post("/gaf_Bluesky/badge", handler);
app.get("/gaf_Bluesky/health", (_req, res) =>
  res.json({ status: "ok", labeler: "GAF Labeler Active" })
);

// --- Vercel serverless export (no listen in prod) ---
export default app;

// Local dev only
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`✅ GAF Labeler http://localhost:${PORT}`));
}
