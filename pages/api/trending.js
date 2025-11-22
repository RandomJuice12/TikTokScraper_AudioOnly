export default async function handler(req, res) {
  // Example hardcoded trending audio for demo
  const trending = [
    {
      title: "Viral Song #1",
      audio: "https://example.com/audio1.mp3"
    },
    {
      title: "Viral Song #2",
      audio: "https://example.com/audio2.mp3"
    },
    {
      title: "Viral Song #3",
      audio: "https://example.com/audio3.mp3"
    },
    {
      title: "Viral Song #4",
      audio: "https://example.com/audio4.mp3"
    },
    {
      title: "Viral Song #5",
      audio: "https://example.com/audio5.mp3"
    }
  ];

  res.status(200).json({ trending });
}
