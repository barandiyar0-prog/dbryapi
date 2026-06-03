module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) return res.status(500).json({ error: "Replicate API token tanımlı değil." });

    const { image, roomType } = req.body;
    if (!image) return res.status(400).json({ error: "Görsel gerekli." });

    let roomTypeEng = "bathroom";
    if (roomType === "kitchen") roomTypeEng = "kitchen";
    else if (roomType === "living_room") roomTypeEng = "living room";
    else if (roomType === "bedroom") roomTypeEng = "bedroom";

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "7660b4ddb8a4410dd5674c398314e3b334225be31d74d1502cf5c7b30faabb57",
        input: {
          image: image,
          prompt: `Transform this ${roomTypeEng} into a stunning modern luxury renovation. Keep the exact same room perspective and layout. Replace all surfaces with premium materials. Photorealistic interior design photo, 8K quality.`,
          structure: "canny",
          replicate_weights: "stability-ai/sdxl",
          prompt_strength: 0.70,
          num_inference_steps: 30
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const prediction = await response.json();

    return res.status(200).json({
      id: prediction.id,
      status: prediction.status,
      output: prediction.output ? [prediction.output] : null
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
