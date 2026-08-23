import { useEffect, useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if chrome.tabs API is available
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setUrl(tabs[0].url);
        }
      });
    }
  }, []);

  const shortenUrl = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setError("");
    setShortUrl("");
    setCopied(false);

    try {
      const response = await fetch("http://localhost:8080/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to shorten URL. Please check your connection or try again.");
      }

      const data = await response.json();
      setShortUrl(`http://localhost:8080/${data.shortCode}`);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="container">
      <h2 className="header">URL Shortener</h2>

      <div className="input-group">
        <label className="input-label" htmlFor="url-input">Target URL</label>
        <input
          id="url-input"
          className="url-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/your-long-url"
          autoFocus
        />
      </div>

      <button className="btn-primary" onClick={shortenUrl} disabled={loading || !url.trim()}>
        {loading ? "Shortening..." : "Shorten"}
      </button>

      {error && <div className="error-message">{error}</div>}

      {shortUrl && (
        <div className="result-card">
          <div className="result-label">Shortened Link</div>
          <div className="result-url">{shortUrl}</div>
          <button className="btn-secondary" onClick={copyUrl}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;