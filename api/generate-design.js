export default async function handler(req, res) {
  // CORS Ayarları
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const apiToken = process.env.GEMINI_API_KEY;
    if (!apiToken) return res.status(500).json({ error: "Gemini API key tanımlı değil." });

    const { image, roomType, style } = req.body;
    if (!image) return res.status(400).json({ error: "Görsel gerekli." });

    let roomTypeEng = "bathroom";
    if (roomType === "kitchen") roomTypeEng = "kitchen";
    else if (roomType === "living_room") roomTypeEng = "living room";
    else if (roomType === "bedroom") roomTypeEng = "bedroom";

    // Profesyonel mimari dönüşüm promptu
    const prompt = `Transform this ${roomTypeEng} into a stunning modern luxury renovation. Keep the exact same room perspective and layout. Replace all surfaces with premium materials. Photorealistic interior design photo, 8K quality.`;

    // Base64 verisini ayrıştırma
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : "image/jpeg";
    const base64Data = matches ? matches[2] : image;

    // Google Imagen API uç noktasına doğru model ve fonksiyonla istek atıyoruz
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          numberOfImages: 1,
          outputMimeType: mimeType,
          aspectRatio: "3:4", // Dikey fotoğraflar için en uygun oran
          personGeneration: "DONT_ALLOW"
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Imagen API Error:", errText);
      return res.status(response.status).json({ error: errText });
    }

    const result = await response.json();
    
    // Gelen görsel verisini Imagen mimarisine uygun şekilde alıyoruz
    const generatedImage = result.generatedImages?.[0]?.image?.imageBytes;

    if (!generatedImage) {
      console.error("No image in response:", JSON.stringify(result).substring(0, 500));
      return res.status(500).json({ error: "Model görsel üretmedi." });
    }

    // Ön yüzün (frontend) beklediği formata birebir sadık kalarak yanıt dönüyoruz
    return res.status(200).json({
      status: "succeeded",
      output: [`data:${mimeType};base64,${generatedImage}`]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
