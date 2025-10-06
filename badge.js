/**
 * GAF Labeler Core — badge.js
 * Handles verification, label creation, and local badge logging
 * Works with server.js via Express route /gaf_Bluesky/api/badge
 * © The Gaf
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// GafComment: The Express server imports this as a function (req, res)
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

  // === Environment credentials (with fallback for local testing) ===
  const token = process.env.BLUESKY_TOKEN || "your-local-test-token";
  const labelerDid =
    process.env.LABELER_DID || "did:plc:7s64rkmtimbhralueam7rxnl";

  if (!token || !labelerDid) {
    return res
      .status(500)
      .json({ message: "Missing Bluesky credentials (env vars)." });
  }

  // === File path for local JSON mirror ===
  const filePath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "badges.json"
  );

  // === Ensure badges.json exists ===
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(JSON.stringify({ badges: [] }, null, 2), "utf8");
  }

  try {
    // === Resolve DID from handle ===
    const didResponse = await fetch(
      `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(
        handle
      )}`
    );
    const didData = await didResponse.json();
    const did = didData.did;
    if (!did)
      return res
        .status(400)
        .json({ message: "Invalid handle or DID not found." });

    console.log(
      `[${new Date().toISOString()}] ${handle} → ${action} ${badge || ""}`
    );

    // === Handle badge claiming ===
    if (action === "claim") {
      const labelResponse = await fetch(
        "https://bsky.social/xrpc/com.atproto.label.defs.create",
        {
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
        }
      );

      if (!labelResponse.ok) {
        const err = await labelResponse.text();
        throw new Error(`Label creation failed: ${err}`);
      }

      // === Update local badges.json ===
      const data = fs.existsSync(filePath)
        ? JSON.parse(fs.readFileSync(filePath, "utf8"))
        : { badges: [] };

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

      return res
        .status(200)
        .json({ message: `✅ ${badge} badge assigned successfully!` });
    }

    // === Handle badge removal ===
    if (action === "remove") {
      let data = { badges: [] };
      if (fs.existsSync(filePath)) {
        data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        data.badges = data.badges.filter((b) => b.handle !== handle);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      }

      return res.status(200).json({
        message:
          "🗑️ Badge removed locally. (Bluesky label removal pending API support.)",
      });
    }

    return res.status(400).json({ message: "Unknown action." });
  } catch (err) {
    console.error("Badge API error:", err);
    return res
      .status(500)
      .json({ message: "🚨 Server error. Please try again later." });
  }
}
