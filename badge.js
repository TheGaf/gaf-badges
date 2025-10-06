/**
 * GAF Labeler Core — badge.js
 * Handles verification, label creation, and local badge logging
 * Deployed with Express on Vercel
 * © The Gaf
 */

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  console.log("🛰️ Incoming badge request:", req.body);

  // === Basic CORS ===
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Only POST allowed");

  const { action, handle, badge } = req.body || {};
  if (!handle || (action === "claim" && !badge)) {
    return res.status(400).json({ message: "Missing data." });
  }

  const token = process.env.BLUESKY_TOKEN;
  const labelerDid = process.env.LABELER_DID;
  if (!token || !labelerDid) {
    console.error("❌ Missing Bluesky credentials.");
    return res.status(500).json({ message: "Missing Bluesky credentials." });
  }

  const filePath = path.join("/tmp", "badges.json");
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ badges: [] }, null, 2));
  }

  try {
    // === Resolve DID ===
    const didRes = await fetch(
      `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`
    );
    const didData = await didRes.json();
    const did = didData?.did;
    if (!did) {
      console.warn("⚠️ DID not found for handle:", handle);
      return res.status(400).json({ message: "Invalid handle or DID not found." });
    }

    // === Claim badge ===
    if (action === "claim") {
      const labelRes = await fetch("https://bsky.social/xrpc/com.atproto.label.create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token, // already includes "Bearer"
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

      const labelText = await labelRes.text();
      if (!labelRes.ok) {
        console.error("❌ Label creation failed:", labelText);
        return res.status(500).json({ message: labelText });
      }

      let data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const existing = data.badges.find((b) => b.handle === handle);
      if (existing) existing.badge = badge;
      else data.badges.push({ handle, did, badge, timestamp: new Date().toISOString() });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      return res.status(200).json({ message: `✅ ${badge} badge assigned successfully!` });
    }

    // === Remove badge ===
    if (action === "remove") {
      let data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      data.badges = data.badges.filter((b) => b.handle !== handle);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return res.status(200).json({ message: "🗑️ Badge removed locally." });
    }

    // === Unknown action ===
    return res.status(400).json({ message: "Unknown action." });

  } catch (err) {
    console.error("🚨 Server crash:", err);
    return res.status(500).json({ message: err.message });
  }
}
