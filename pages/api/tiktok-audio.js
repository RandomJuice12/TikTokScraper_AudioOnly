// api/tiktok-audio.js
const fetch = require('node-fetch');

const SCRAPEAPI_KEY = process.env.SCRAPEAPI_KEY; // Set in Vercel dashboard

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url || !url.includes('tiktok.com')) {
    return res.status(400).json({ error: 'Please provide a valid TikTok URL' });
  }

  if (!SCRAPEAPI_KEY) {
    return res.status(500).json({ error: 'ScrapeAPI key not configured' });
  }

  try {
    // ScrapeAPI endpoint (automatically rotates IPs, solves CAPTCHAs, etc.)
    const scrapeUrl = `http://api.scrapeapi.com/?api_key=${SCRAPEAPI_KEY}&url=${encodeURIComponent(url)}`;

    const response = await fetch(scrapeUrl);
    const html = await response.text();

    // Extract the JSON data from TikTok's <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">
    const jsonMatch = html.match(/__UNIVERSAL_DATA_FOR_REHYDRATION__={.+?}"music":({.+?})}/);
    
    if (!jsonMatch || !jsonMatch[1]) {
      return res.status(404).json({ error: 'Audio not found or video is private' });
    }

    const musicData = JSON.parse(jsonMatch[1]);

    const audioUrl = musicData.playUrl || musicData.playUrlList?.[0];
    const title = musicData.title || 'tiktok_audio';
    const author = musicData.author || 'unknown';

    if (!audioUrl) {
      return res.status(404).json({ error: 'No audio URL found' });
    }

    res.json({
      success: true,
      title,
      author,
      audioUrl, // Direct .mp3 link!
      downloadUrl: `/api/download?audio=${encodeURIComponent(audioUrl)}&name=${encodeURIComponent(title)}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to extract audio', details: err.message });
  }
};
