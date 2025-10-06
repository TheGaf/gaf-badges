/**
 * GAF Labeler Core — badge.js
 * Handles verification, label creation, and local badge logging
 * Deployed with Express on Vercel
 * © The Gaf
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// GafComment: Express imports this as a function (req, res)
export default async function handler(req, res) {
  // === Basic CORS ===
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Only POST allowed");

  const { action, handle, badge } = req.body;
  if (!handle || (action === "claim" && !badge)) {
    return res.status(400).json({ message: "Missing data." });
  }

  // === Environment credentials (from Vercel) ===
  const token = process.env.BLUESKY_TOKEN;
  const labelerDid = process.env.LABELER_DID;
  if (!token || !labelerDid) {
    return res.status(500).json({ message: "Missing Bluesky credentials." });
  }

  // === File path for badges.json ===
  // GafComment: On Vercel, only /tmp is writable. Use it for runtime persistence.
  const isVercel = process.env.VERCEL === "1";
  const filePath = isVercel
    ? path.join("/tmp", "badges.json")
    : path.join(process.cwd(), "badges.json");

  try {
    // Ensure file exists
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ badges: [] }, null, 2), "utf8");
    }

    // === Resolve DID from handle ===
    const didResponse = await fetch(
      `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`
    );
    const didData = await didResponse.json();
    const did = didData.did;
    if (!did) {
      return res.status(400).json({ message: "Invalid handle or DID not found." });
    }

    // === Read existing badges.json ===
    const data = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf8"))
      : { badges: [] };

    // === Handle badge claiming ===
    if (action === "claim") {
      const labelResponse = await fetch("https://bsky.social/xrpc/com.atproto.label.create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          labels: [
            {
              src: labelerDid,
              uri: `at://${did}/app.bsky.actor.profile/self`,
              val: badge,
              cts: new Date().toISOString(),
            },
          ],
        }),
      });

      if (!labelResponse.ok) {
        const errText = await labelResponse.text();
        console.error("Label creation failed:", errText);
        return res.status(500).json({ message: "Label creation failed." });
      }

      // Update badges.json
      const existing = data.badges.find((b) => b.handle === handle);
      if (existing) {
        existing.badge = badge;
        existing.timestamp = new Date().toISOString();
      } else {
        data.badges.push({
          handle,
          did,
          badge,
          timestamp: new Date().toISOString(),
        });
      }

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

      return res.status(200).json({ message: `✅ ${badge} badge assigned successfully!` });
    }

    // === Handle badge removal ===
    if (action === "remove") {
      data.badges = data.badges.filter((b) => b.handle !== handle);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

      return res.status(200).json({
        message: "🗑️ Badge removed locally. (Bluesky label removal pending API support.)",
      });
    }

    return res.status(400).json({ message: "Unknown action." });
} catch (err) {
  console.error("🚨 Badge API error:", err.message, err.stack);
  return res.status(500).json({ 
    message: "🚨 Server error. Check logs on Vercel for details.",
    error: err.message
  });
}
