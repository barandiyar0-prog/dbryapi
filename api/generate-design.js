const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent";

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

    let styleDesc = "modern luxury";
    if (style === "modern") styleDesc = "premium modern luxury with clean lines, high-end materials, warm LED lighting, marble or wood surfaces";
    else if (style === "classic") styleDesc = "timeless classic with elegant moldings, marble surfaces, golden fixtures, warm lighting";
    else if (style === "industrial") styleDesc = "loft industrial with exposed brick, steel structures, concrete surfaces, Edison bulb lighting";
    else if (style === "minimalist") styleDesc = "clean minimalist with neutral tones, seamless cabinets, hidden handles, bright soft lighting";

    const prompt = `Transform this ${roomTypeEng} into a stunning ${styleDesc} interior design. Keep the same room layout and dimensions but completely renovate the surfaces, materials, furniture and lighting. Make it look like a professional architectural magazine photo. Photorealistic, 8K quality.`;

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : "image/jpeg";
    const base64Data = matches ? matches[2] : image;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      return res.status(response.status).json({ error: `Gemini API hatası: ${errText}` });
    }

    const result = await response.json();
    
    // Görseli bul
    const parts = result.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);
    
    if (!imagePart) {
      return res.status(500).json({ error: "Görsel üretilemedi. Model görsel döndürmedi." });
    }

    const imageData = imagePart.inlineData.data;
    const imageMime = imagePart.inlineData.mimeType || "image/png";

    return res.status(200).json({
      status: "succeeded",
      output: [`data:${imageMime};base64,${imageData}`]
    });

  } catch (error) {
    console.error("Internal Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
