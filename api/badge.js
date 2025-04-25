
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  const { action, handle, badge } = req.body;

  if (!handle || (action === "claim" && !badge)) {
    return res.status(400).send("Missing data");
  }

  console.log(`[${new Date().toISOString()}] Action: ${action}, Handle: ${handle}, Badge: ${badge || 'none'}`);

  // Resolve handle to DID
  const didResponse = await fetch(`https://plc.directory/did/${encodeURIComponent(handle)}`);
  const didData = await didResponse.json();
  const did = didData.didDocument?.id;
  if (!did) return res.status(400).send("Invalid handle or DID not found.");

  // Prepare label payload
  if (action === "claim") {
    await fetch('https://your-labeler-server/label', { // <-- your labeler URL
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uri: did,
        val: badge
      })
    });
  }

  res.status(200).send("OK");
}
