export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  const { action, handle, badge } = req.body;
  if (!handle || (action === "claim" && !badge)) {
    return res.status(400).send("Missing data");
  }

const didResponse = await fetch(`https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`);
const did = (await didResponse.json()).did;
if (!did) return res.status(400).send("Invalid handle or DID not found.");


  if (action === "claim") {
    await fetch('https://your-labeler-server/label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri: did, val: badge })
    });
  }

  res.status(200).send("OK");
}
