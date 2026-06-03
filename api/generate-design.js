const IMAGEN_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const apiToken = process.env.GEMINI_API_KEY;
    if (!apiToken) return res.status(500).json({ error: "Gemini API key tanımlı değil." });

    const { image, roomType, style } = req.body;
    if (!image) return res.status(400).json({ error: "Görsel gerekli." });

    let roomTypeEng = "room";
    if (roomType === "kitchen") roomTypeEng = "kitchen";
    else if (roomType === "living_room") roomTypeEng = "living room";
    else if (roomType === "bathroom") roomTypeEng = "bathroom";
    else if (roomType === "bedroom") roomTypeEng = "bedroom";

    let styleDesc = "modern luxury style, premium materials, warm lighting";
    if (style === "modern") styleDesc = "premium modern luxury style, clean geometric lines, high-end materials, warm architectural lighting, sophisticated contrast, photorealistic";
    else if (style === "classic") styleDesc = "timeless classic style, elegant wall molding, marble surfaces, golden brass fixtures, warm illumination, luxury interior";
    else if (style === "industrial") styleDesc = "loft industrial style, exposed brick, steel structures, concrete surfaces, warm edison bulb lighting";
    else if (style === "minimalist") styleDesc = "clean minimalist style, neutral earth tones, seamless cabinets, hidden handles, bright soft light, spacious";

    const prompt = `A stunning ${styleDesc} interior design renovation of a ${roomTypeEng}. Professional architectural photography, 8K resolution, photorealistic, magazine quality, dramatic lighting, high-end furniture, luxury finishes.`;

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : "image/jpeg";
    const base64Data = matches ? matches[2] : image;

    const response = await fetch(`${IMAGEN_API_URL}?key=${apiToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
            referenceImages: [
              {
                referenceType: "REFERENCE_TYPE_STYLE",
                referenceId: 1,
                referenceImage: {
                  bytesBase64Encoded: base64Data,
                  mimeType: mimeType
                }
              }
            ]
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          safetyFilterLevel: "block_few",
          personGeneration: "allow_adult"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Imagen API hatası: ${errText}` });
    }

    const result = await response.json();
    const imageData = result.predictions?.[0]?.bytesBase64Encoded;

    if (!imageData) {
      return res.status(500).json({ error: "Görsel üretilemedi." });
    }

    return res.status(200).json({
      status: "succeeded",
      output: [`data:image/png;base64,${imageData}`]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
