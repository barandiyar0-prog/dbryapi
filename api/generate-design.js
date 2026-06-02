const REPLICATE_API_URL = "https://api.replicate.com/v1";
const MODEL_VERSION = "a3c091059a25590ce2d5ea13651fab63f447f21760e50c358d4b850e844f59ee";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) return res.status(500).json({ error: "Replicate API token tanımlı değil." });

    const { action, id, image, roomType, style, strength } = req.body;

    if (action === "create") {
      if (!image) return res.status(400).json({ error: "Görsel gerekli." });

      let roomTypeEng = "room";
      if (roomType === "kitchen") roomTypeEng =
