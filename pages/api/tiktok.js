import axios from "axios";
import NodeCache from "node-cache";

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
    const apiKey = process.env.SCRAPERAPI_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing SCRAPERAPI_KEY" });

    // Fetch TikTok page through ScraperAPI
    const params = { api_key: apiKey, url, render: true };
    const response = await axios.get("https://api.scraperapi.com", { params, timeout: 90000 });
    const html = response.data;

    // 1️⃣ Extract __NEXT_DATA__ JSON from HTML
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
    if (!nextDataMatch) {
      return res.status(404).json({ error: "TikTok __NEXT_DATA__ not found" });
    }

    const jsonData = JSON.parse(nextDataMatch[1]);

    // 2️⃣ Navigate to audio URL in JSON
    let audio = null;
    let title = null;

    try {
      const videoData = jsonData.props.pageProps.itemInfo.itemStruct;
      audio = videoData.music.playUrl; // audio URL
      title = videoData.desc || "TikTok Audio";
    } catch (err) {
      return res.status(404).json({ error: "Audio info not found in TikTok JSON" });
    }

    if (!audio) return res.status(404).json({ error: "Audio not found in TikTok page" });

    // 3️⃣ Cache and return
    const result = { audio, title };
    cache.set(cacheKey, result);

    res.status(200).json(result);
  } catch (err) {
    console.error("TikTok audio fetch error:", err.message);
    res.status(502).json({ error: "Failed to fetch audio from TikTok" });
  }
}
