import axios from "axios";
import NodeCache from "node-cache";
import cheerio from "cheerio";

const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL_SECONDS || 86400) });

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing TikTok URL" });

  const cacheKey = `tiktok-audio:${url}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.status(200).json({ ...cached, cached: true });

  try {
    // Request ssstik.io mobile download page
    const apiUrl = `https://ssstik.io/en/ajax/convert`;
    const payload = new URLSearchParams();
    payload.append("url", url);
    payload.append("action", "convert");

    const response = await axios.post(apiUrl, payload.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
      },
      timeout: 30000,
    });

    const data = response.data;

    // ssstik.io returns JSON with audio link under data.audio or similar
    if (!data || !data.audio) {
      return res.status(404).json({ error: "Audio not found from ssstik.io" });
    }

    const audio = data.audio; // direct MP3 URL
    const title = data.title || "TikTok Audio";

    const result = { audio, title };
    cache.set(cacheKey, result);

    res.status(200).json(result);
  } catch (err) {
    console.error("ssstik.io fetch error:", err.message);
    res.status(502).json({ error: "Failed to fetch audio from ssstik.io" });
  }
}
