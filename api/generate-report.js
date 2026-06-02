const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const apiToken = process.env.GEMINI_API_KEY;
    if (!apiToken) return res.status(500).json({ error: "Gemini API key tanımlı değil." });

    const { image, roomType, style } = req.body;
    if (!image) return res.status(400).json({ error: "Görsel gerekli." });

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : "image/jpeg";
    const base64Data = matches ? matches[2] : image;

    let roomTypeTr = roomType === "kitchen" ? "Mutfak" : (roomType === "living_room" ? "Salon / TV Ünitesi" : (roomType === "bathroom" ? "Banyo" : "Yatak Odası"));
    let styleTr = style === "modern" ? "Modern ve Lüks" : (style === "classic" ? "Klasik ve Ağırbaşlı" : (style === "industrial" ? "Endüstriyel ve Loft" : "Minimalist ve Fonksiyonel"));

    const promptText = `Sana gönderilen ${roomTypeTr} fotoğrafındaki ana duvar ve yerleşim yapısını bozmadan, kullanıcının seçtiği ${styleTr} tarzda yepyeni, modern, lüks ve gerçekçi bir iç mekan tadilat/dekorasyon tasarımı hakkında profesyonel bir iç mimar gibi Türkçe bir değerlendirme ve tadilat raporu yaz. 
Raporda şunlara değin:
1. Mevcut durumun kısa bir analizi (aydınlatma, dolap yerleşimleri vb.).
2. Seçilen tarzda (${styleTr}) yapılacak lüks değişiklikler (önerilen malzeme kaplamaları, renk kombinasyonları, aydınlatma detayları).
3. Bu yenilemenin mekana katacağı değer.
Lütfen başlıklar kullanarak profesyonel ve kurumsal bir dil kullan.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType, data: base64Data } }] }]
      })
    });

    if (!response.ok) return res.status(response.status).json({ error: await response.text() });

    const result = await response.json();
    const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text || "Rapor oluşturulamadı.";
    return res.status(200).json({ report: textOutput });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
