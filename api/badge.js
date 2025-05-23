
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  const { action, handle, badge } = req.body;
  if (!handle || (action === "claim" && !badge)) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    const didResponse = await fetch(
      `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`
    );
    const didData = await didResponse.json();
    const did = didData.did;
    if (!did) return res.status(400).json({ message: "Invalid handle or DID not found." });

    if (action === "claim") {
      // Simulate successful label push
      return res.status(200).json({ message: "✅ Badge assigned successfully!" });
    }

    if (action === "remove") {
      // Simulate badge removal success
      return res.status(200).json({ message: "🗑️ Badge removal request received!" });
    }

    return res.status(400).json({ message: "Unknown action" });

  } catch (err) {
    console.error("Badge API error:", err);
    return res.status(500).json({ message: "🚨 Server error. Please try again later." });
  }
}
