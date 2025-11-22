// api/download.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { audio, name = 'tiktok_audio' } = req.query;

  if (!audio) return res.status(400).send('Missing audio URL');

  try {
    const response = await fetch(audio);
    const buffer = await response.buffer();

    res.setHeader('Content-Disposition', `attachment; filename="${name}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (err) {
    res.status(500).send('Download failed');
  }
};
