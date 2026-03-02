const express = require("express");
const router = express.Router();
const https = require("https");
const http = require("http");

/** Generic HTTP GET returning parsed JSON */
function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "vi,en;q=0.9",
          ...headers,
        },
      },
      (res) => {
        // Follow redirects
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return fetchJSON(res.headers.location, headers)
            .then(resolve)
            .catch(reject);
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

// ─── English Dictionary ─────────────────────────────────────────────────────
// Using dictionaryapi.dev (free, no key needed)
router.get("/en/:word", async (req, res) => {
  try {
    const word = encodeURIComponent(req.params.word.trim());
    const { status, body } = await fetchJSON(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    );
    if (status !== 200)
      return res.status(status).json({ error: "Word not found" });
    res.json({ source: "dictionaryapi", data: body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Chinese Dictionary ──────────────────────────────────────────────────────
// Proxy to Hanzii (server-side to bypass CORS)
router.get("/zh/:word", async (req, res) => {
  try {
    const word = encodeURIComponent(req.params.word.trim());
    const url = `https://api.hanzii.net/api/search/${word}?type=word&limit=5&page=1&langdetect=vi`;
    const { status, body } = await fetchJSON(url, {
      Referer: "https://hanzii.net/",
      Origin: "https://hanzii.net",
    });
    if (status !== 200)
      return res.status(status).json({ error: "Không tìm thấy từ", raw: body });
    res.json({ source: "hanzii", data: body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Vietnamese / General Translation ───────────────────────────────────────
// Google Translate unofficial (gtx client, no key needed)
router.get("/translate", async (req, res) => {
  try {
    const { q, sl = "auto", tl = "vi" } = req.query;
    if (!q) return res.status(400).json({ error: "Missing query" });

    const text = encodeURIComponent(q.trim());
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=bd&dj=1&q=${text}`;
    const { status, body } = await fetchJSON(url);
    if (status !== 200)
      return res.status(status).json({ error: "Translate failed" });
    res.json({ source: "google", data: body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
