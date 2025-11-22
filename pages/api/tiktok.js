import { NextApiRequest, NextApiResponse } from "next";
import NodeCache from "node-cache";
import puppeteer from "puppeteer";

const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL_SECONDS || 86400) });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing TikTok URL" });

  const cacheKey = `tiktok-audio:${url}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.status(200).json({ ...cached, cached: true });

  try {
    // Launch Puppeteer headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000); // 30s timeout
    await page.goto(url, { waitUntil: "networkidle2" });

    // Extract __NEXT_DATA__ JSON from TikTok page
    const jsonData = await page.evaluate(() => {
      const script = document.querySelector("#__NEXT_DATA__")?.textContent;
      return script ? JSON.parse(script) : null;
    });

    if (!jsonData) {
      await browser.close();
      return res.status(404).json({ error: "TikTok JSON data not found" });
    }

    // Navigate JSON to get audio URL
    const audio =
      jsonData.props?.pageProps?.itemInfo?.itemStruct?.music?.playUrl ||
      jsonData.props?.pageProps?.videoData?.music?.playUrl;

    const title =
      jsonData.props?.pageProps?.itemInfo?.itemStruct?.music?.title ||
      jsonData.props?.pageProps?.videoData?.music?.title ||
      "TikTok Audio";

    await browser.close();

    if (!audio) {
      return res.status(404).json({ error: "Audio not found" });
    }

    const result = { audio, title };
    cache.set(cacheKey, result); // cache for future requests

    return res.status(200).json(result);
  } catch (err) {
    console.error("Puppeteer fetch error:", err.message);
    return res.status(502).json({ error: "Failed to fetch audio from TikTok" });
  }
}
