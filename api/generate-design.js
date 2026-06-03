const REPLICATE_API_URL = "https://api.replicate.com/v1";
// Flux Canny Pro - orijinal fotoğrafın yapısını koruyarak yeniden tasarlar
const MODEL_VERSION = "black-forest-labs/flux-canny-pro";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) return res.status(500).json({ error: "Replicate API token tanımlı değil." });

    const { action, id, image, roomType, style } = req.body;

    if (action === "create") {
      if (!image) return res.status(400).json({ error: "Görsel gerekli." });

      let roomTypeEng = "room";
      if (roomType === "kitchen") roomTypeEng = "kitchen";
      else if (roomType === "living_room") roomTypeEng = "living room";
      else if (roomType === "bathroom") roomTypeEng = "bathroom";
      else if (roomType === "bedroom") roomTypeEng = "bedroom";

      let styleDesc = "modern luxury";
      if (style === "modern") styleDesc = "premium modern luxury, marble tiles, LED lighting, high-end fixtures, clean lines";
      else if (style === "classic") styleDesc = "classic elegant, ornate details, warm tones, traditional fixtures";
      else if (style === "industrial") styleDesc = "industrial loft, exposed concrete, metal accents, Edison lighting";
      else if (style === "minimalist") styleDesc = "minimalist, white walls, simple clean design, natural light";

      const prompt = `Professional interior design photo of a renovated ${roomTypeEng}, ${styleDesc}, photorealistic, architectural magazine quality, 8K, luxury renovation`;

      const response = await fetch(`${REPLICATE_API_URL}/models/${MODEL_VERSION}/predictions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
          "Prefer": "wait"
        },
        body: JSON.stringify({
          input: {
            prompt: prompt,
            control_image: image,
            steps: 28,
            guidance: 7,
            output_format: "jpg",
            safety_tolerance: 5
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `Replicate API hatası: ${errText}` });
      }

      const prediction = await response.json();
      
      if (prediction.status === "succeeded" && prediction.output) {
        const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        return res.status(200).json({ status: "succeeded", output: [outputUrl] });
      }

      return res.status(200).json({ id: prediction.id, status: prediction.status });
    }

    if (action === "status") {
      if (!id) return res.status(400).json({ error: "ID gerekli." });
      const response = await fetch(`${REPLICATE_API_URL}/predictions/${id}`, {
        headers: { "Authorization": `Bearer ${apiToken}` }
      });
      if (!response.ok) return res.status(response.status).json({ error: await response.text() });
      const prediction = await response.json();
      return res.status(200).json({ id: prediction.id, status: prediction.status, output: prediction.output, error: prediction.error });
    }

    return res.status(400).json({ error: "Geçersiz action." });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
