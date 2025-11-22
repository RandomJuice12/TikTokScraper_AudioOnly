import { useState, useEffect } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    // Fetch trending audio on load
    async function fetchTrending() {
      try {
        const res = await fetch("/api/trending");
        const data = await res.json();
        setTrending(data.trending || []);
      } catch {}
    }
    fetchTrending();
  }, []);

  async function fetchAudio() {
    if (!url) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>TikTok Audio Downloader</h1>

      <input
        type="text"
        placeholder="Paste TikTok URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />
      <button
        onClick={fetchAudio}
        disabled={loading || !url}
        style={{ padding: "10px 20px", cursor: "pointer" }}
      >
        {loading ? "Fetching..." : "Download Audio (MP3)"}
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {result && result.audio && (
        <div style={{ marginTop: "20px" }}>
          <p style={{ marginBottom: "5px" }}>{result.title || "Untitled Audio"}</p>
          <audio controls src={result.audio} style={{ width: "100%", marginBottom: "10px" }} />
          <a href={result.audio} target="_blank" rel="noopener noreferrer">
            <button style={{ padding: "10px 20px", cursor: "pointer" }}>Download MP3</button>
          </a>
        </div>
      )}

      <h2 style={{ marginTop: "40px" }}>🔥 Trending TikTok Audio</h2>
      <div>
        {trending.length === 0 && <p>Loading trending audio...</p>}
        {trending.map((item, index) => (
          <div key={index} style={{ marginBottom: "20px" }}>
            <p style={{ marginBottom: "5px" }}>{item.title}</p>
            <audio controls src={item.audio} style={{ width: "100%", marginBottom: "5px" }} />
            <a href={item.audio} target="_blank" rel="noopener noreferrer">
              <button style={{ padding: "5px 15px", cursor: "pointer" }}>Download MP3</button>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
