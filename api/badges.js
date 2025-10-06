/**
 * GAF Labeler — badges.js
 * Public endpoint to read badges from /tmp/badges.json
 * © The Gaf
 */

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  // === Basic CORS ===
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ message: "Only GET allowed" });

  const filePath = path.join("/tmp", "badges.json");

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ badges: [] });
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return res.status(200).json(data);
  } catch (err) {
    console.error("🚨 Failed to read badges.json:", err);
    return res.status(500).json({ message: "Failed to load badges." });
  }
}
