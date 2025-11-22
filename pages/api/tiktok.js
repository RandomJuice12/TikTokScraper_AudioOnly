import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 86400 }); // 24h cache

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  const cacheKey = `tiktok-audio:${url}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.status(200).json({ ...cached, cached: true });

  try {
    const apiKey = process.env.SCRAPERAPI_KEY;
    const params = { api_key: apiKey, url, render: true };
    const html = (await axios.get("https://api.scraperapi.com", { params, timeout: 30000 })).data;

    // Extract audio only
    const audioMatch = html.match(/"music":{[^}]*"playUrl":"(https?:\\\/\\\/[^"]+)"/);
    const audio = audioMatch ? audioMatch[1].replace(/\\\//g, "/") : null;
    if (!audio) return res.status(404).json({ error: "Audio not found" });

    const titleMatch = html.match(/property="og:title" content="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : null;

    const result = { audio, title };
    cache.set(cacheKey, result);
    res.status(200).json(result);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch audio" });
  }
}
