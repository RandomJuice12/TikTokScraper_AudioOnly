import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 86400 }); // 24h cache

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing TikTok URL" });

  const cacheKey = `tiktok-audio:${url}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.status(200).json({ ...cached, cached: true });

  try {
    const apiKey = process.env.SCRAPERAPI_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing SCRAPERAPI_KEY" });

    const params = { api_key: apiKey, url, render: true };
    const response = await axios.get("https://api.scraperapi.com", {
      params,
      timeout: 90000, // increase timeout to 90s
    });

    const html = response.data;

    // 1️⃣ Try extracting audio from "music" JSON
    let audioMatch =
      html.match(/"music":\s*{[^}]*"playUrl":"(https?:\\\/\\\/[^"]+)"/) ||
      html.match(/"playAddr":"(https?:\\\/\\\/[^"]+)"/); // fallback

    if (!audioMatch) {
      return res.status(404).json({ error: "Audio not found in TikTok page" });
    }

    const audio = audioMatch[1].replace(/\\\//g, "/");

    // Extract title for display
    const titleMatch = html.match(/property="og:title" content="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : "TikTok Audio";

    const result = { audio, title };
    cache.set(cacheKey, result);
    res.status(200).json(result);
  } catch (err) {
    console.error("TikTok audio fetch error:", err.message);
    res.status(502).json({ error: "Failed to fetch audio from TikTok" });
  }
}
