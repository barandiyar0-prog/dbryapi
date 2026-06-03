const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent";

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
    if (style === "modern") styleDesc = "premium modern luxury, marble tiles, LED lighting, high-end fixtures, clean lines";
    else if (style === "classic") styleDesc = "classic elegant, ornate details, warm tones, traditional fixtures";
    else if (style === "industrial") styleDesc = "industrial loft, exposed concrete, metal accents, Edison lighting";
    else if (style === "minimalist") styleDesc = "minimalist, white walls, simple clean design, natural light";

    const prompt = `Transform this ${roomTypeEng} photo into a ${styleDesc} interior design renovation. Keep the same room layout and perspective. Make it photorealistic, professional architectural photography quality.`;

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : "image/jpeg";
    const base64Data = matches ? matches[2] : image;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } }
          ]
        }],
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
    const parts = result.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart) {
      return res.status(500).json({ error: "Görsel üretilemedi." });
    }

    return res.status(200).json({
      status: "succeeded",
      output: [`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
