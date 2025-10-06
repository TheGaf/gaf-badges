/**
 * GAF Labeler — /api/badges
 * Returns current badge list
 * © The Gaf
 */

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ message: "Only GET allowed" });

  const filePath = path.join("/tmp", "badges.json");
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ badges: [] }, null, 2));
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Error reading badges.json:", err);
    res.status(500).json({ message: "Server error reading badges.json" });
  }
}
