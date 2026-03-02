import { useState } from "react";
import { SpeakButton } from "../hooks/useSpeech";
import { dictEN, dictZH, translate } from "../api";

const LANGS = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

const PLACEHOLDERS = {
  en: "Search English word…",
  vi: "Nhập từ tiếng Việt…",
  zh: "输入中文…",
};

/* ─── English dict result (dictionaryapi.dev) ─────────────────────────── */
function ENResult({ data }) {
  if (!data?.length) return <Empty />;
  const entry = data[0];
  const phonetic = entry.phonetics?.find((p) => p.text)?.text || "";
  const audioUrl = entry.phonetics?.find((p) => p.audio)?.audio || "";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-1px" }}
        >
          {entry.word}
        </h2>
        {phonetic && (
          <span
            style={{
              fontSize: "1rem",
              color: "var(--ink3)",
              fontFamily: "monospace",
            }}
          >
            {phonetic}
          </span>
        )}
        <SpeakButton text={entry.word} />
        {audioUrl && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => new Audio(audioUrl).play()}
          >
            ▶ MP3
          </button>
        )}
      </div>
      {entry.meanings?.map((m, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <span className="badge badge-blue" style={{ padding: "3px 12px" }}>
              {m.partOfSpeech}
            </span>
            {m.synonyms?.length > 0 && (
              <span style={{ fontSize: "0.75rem", color: "var(--ink3)" }}>
                Synonyms:{" "}
                <strong style={{ color: "var(--ink2)" }}>
                  {m.synonyms.slice(0, 4).join(", ")}
                </strong>
              </span>
            )}
          </div>
          <ol
            style={{
              paddingLeft: 20,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {m.definitions.slice(0, 5).map((d, j) => (
              <li key={j} style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                {d.definition}
                {d.example && (
                  <div
                    style={{
                      marginTop: 5,
                      padding: "5px 12px",
                      background: "var(--bg3)",
                      borderLeft: "2px solid var(--border2)",
                      borderRadius: "0 6px 6px 0",
                      fontSize: "0.82rem",
                      color: "var(--ink3)",
                      fontStyle: "italic",
                    }}
                  >
                    "{d.example}"
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

/* ─── Hanzii result for Chinese ──────────────────────────────────────────── */
function ZHResult({ hanziiData, word }) {
  const results =
    hanziiData?.result ||
    hanziiData?.data ||
    (Array.isArray(hanziiData) ? hanziiData : null);
  if (!results?.length) return null;

  return (
    <div>
      {results.slice(0, 3).map((item, i) => (
        <div key={i} className="card" style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            {item.simplified && (
              <span style={{ fontSize: "2rem", fontWeight: 900 }}>
                {item.simplified}
              </span>
            )}
            {item.traditional && item.traditional !== item.simplified && (
              <span style={{ fontSize: "1.5rem", color: "var(--ink3)" }}>
                ({item.traditional})
              </span>
            )}
            {item.pinyin && (
              <span
                style={{
                  fontSize: "1rem",
                  color: "var(--ink2)",
                  fontStyle: "italic",
                  fontFamily: "serif",
                }}
              >
                {item.pinyin}
              </span>
            )}
            <SpeakButton text={item.simplified || word} />
          </div>
          {item.content?.map((c, j) => (
            <div key={j} style={{ marginBottom: 10 }}>
              <span className="badge badge-cyan" style={{ marginBottom: 7 }}>
                {c.type || "nghĩa"}
              </span>
              {c.means?.map((m, k) => (
                <div key={k} style={{ marginLeft: 12, marginBottom: 6 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                    {m.mean}
                  </div>
                  {m.examples?.slice(0, 2).map((ex, l) => (
                    <div
                      key={l}
                      style={{
                        marginTop: 4,
                        padding: "5px 10px",
                        background: "var(--bg3)",
                        borderLeft: "2px solid var(--border2)",
                        borderRadius: "0 5px 5px 0",
                        fontSize: "0.79rem",
                        color: "var(--ink3)",
                      }}
                    >
                      <div>{ex.e}</div>
                      {ex.v && (
                        <div style={{ color: "var(--ink2)", marginTop: 2 }}>
                          {ex.v}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Google Translate result ────────────────────────────────────────────── */
function GTResult({ word, data, targetLang }) {
  if (!data) return <Empty />;

  const translation = (data.sentences || [])
    .map((s) => s.trans)
    .filter(Boolean)
    .join("");
  const dictEntries = data.dict || [];
  const targetLabel =
    LANGS.find((l) => l.code === targetLang)?.label || targetLang;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ fontSize: "1.8rem", fontWeight: 900 }}>{word}</h2>
        <SpeakButton text={word} />
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--ink3)",
            padding: "2px 8px",
            background: "var(--bg3)",
            borderRadius: 6,
          }}
        >
          Google Translate
        </span>
      </div>

      {translation && (
        <div
          className="card"
          style={{ marginBottom: 16, padding: "14px 20px" }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--ink3)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.7px",
            }}
          >
            Dịch sang {targetLabel}
          </div>
          <div
            style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--ink)" }}
          >
            {translation}
          </div>
        </div>
      )}

      {dictEntries.map((d, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <span className="badge badge-purple" style={{ marginBottom: 7 }}>
            {d.pos}
          </span>
          {d.entry?.slice(0, 5).map((e, j) => (
            <div
              key={j}
              style={{ marginLeft: 12, marginBottom: 4, fontSize: "0.88rem" }}
            >
              <span style={{ fontWeight: 700 }}>{e.word}</span>
              {e.reverse_translation?.length > 0 && (
                <span style={{ color: "var(--ink3)", marginLeft: 8 }}>
                  — {e.reverse_translation.slice(0, 3).join(", ")}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="empty-state" style={{ padding: 40 }}>
      <div className="empty-icon">📭</div>
      <p>Không tìm thấy kết quả. Hãy thử từ khác!</p>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function Dictionary() {
  const [srcLang, setSrcLang] = useState("en");
  const [tgtLang, setTgtLang] = useState("vi");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Map lang code → Google Translate language code
  const gtCode = { en: "en", vi: "vi", zh: "zh-CN" };

  const search = async (q = query) => {
    const word = (q || query).trim();
    if (!word) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      if (srcLang === "en") {
        // Fetch EN dictionary AND optional translation to target
        const [dictRes, gtRes] = await Promise.allSettled([
          dictEN(word),
          tgtLang !== "en"
            ? translate(word, "en", gtCode[tgtLang])
            : Promise.resolve(null),
        ]);
        const dictData =
          dictRes.status === "fulfilled" ? dictRes.value.data.data : null;
        const gtData =
          gtRes.status === "fulfilled" ? gtRes.value?.data?.data : null;
        setResult({ type: "en", dictData, gtData, word });
      } else if (srcLang === "zh") {
        const [hanziiRes, gtRes] = await Promise.allSettled([
          dictZH(word),
          translate(word, "zh-CN", gtCode[tgtLang]),
        ]);
        const hanziiData =
          hanziiRes.status === "fulfilled" ? hanziiRes.value.data.data : null;
        const gtData =
          gtRes.status === "fulfilled" ? gtRes.value?.data?.data : null;
        setResult({ type: "zh", hanziiData, gtData, word });
      } else {
        // VI
        const gtRes = await translate(word, gtCode[srcLang], gtCode[tgtLang]);
        setResult({ type: "vi", gtData: gtRes.data.data, word });
      }
    } catch (err) {
      if (err?.response?.status === 404)
        setResult({ type: srcLang, dictData: null, word });
      else
        setError(
          "Lỗi kết nối. Hãy đảm bảo backend đang chạy (node server.js | port 3001)!",
        );
    }
    setLoading(false);
  };

  const quickSearch = (word, slc) => {
    setSrcLang(slc);
    setQuery(word);
    setTimeout(() => search(word), 30);
  };

  // Prevent same source = target
  const handleSrcChange = (code) => {
    setSrcLang(code);
    if (tgtLang === code)
      setTgtLang(LANGS.find((l) => l.code !== code)?.code || "vi");
    setResult(null);
  };

  const tgtOptions = LANGS.filter((l) => l.code !== srcLang);

  return (
    <div>
      <div className="page-header">
        <h1>🔍 Từ Điển</h1>
        <p>Tra nghĩa và dịch sang ngôn ngữ bạn muốn</p>
      </div>

      {/* Lang selector row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Source */}
        <div>
          <div
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "var(--ink3)",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              marginBottom: 5,
            }}
          >
            Ngôn ngữ nhập
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => handleSrcChange(l.code)}
                className={`btn btn-sm ${srcLang === l.code ? "btn-primary" : "btn-secondary"}`}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            fontSize: "1.4rem",
            color: "var(--ink3)",
            alignSelf: "flex-end",
            paddingBottom: 4,
          }}
        >
          →
        </div>

        {/* Target */}
        <div>
          <div
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "var(--ink3)",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              marginBottom: 5,
            }}
          >
            Dịch sang
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {tgtOptions.map((l) => (
              <button
                key={l.code}
                onClick={() => setTgtLang(l.code)}
                className={`btn btn-sm ${tgtLang === l.code ? "btn-primary" : "btn-secondary"}`}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <input
          className="input"
          placeholder={PLACEHOLDERS[srcLang]}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          autoFocus
          style={{ flex: 1, fontSize: "1.05rem", padding: "11px 16px" }}
        />
        <button
          className="btn btn-primary"
          onClick={() => search()}
          disabled={loading || !query.trim()}
          style={{ minWidth: 80 }}
        >
          {loading ? (
            <span
              className="loading-spinner"
              style={{ width: 16, height: 16, borderWidth: 2 }}
            />
          ) : (
            "🔍 Tra"
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "13px 18px",
            background: "var(--err-bg)",
            border: "1px solid rgba(220,38,38,.2)",
            borderRadius: 10,
            color: "var(--err)",
            marginBottom: 20,
            fontSize: "0.88rem",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-center">
          <div
            className="loading-spinner"
            style={{ width: 32, height: 32, borderWidth: 3 }}
          />
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="card" style={{ padding: "26px 28px" }}>
          {result.type === "en" && (
            <>
              {result.dictData && <ENResult data={result.dictData} />}
              {!result.dictData && <Empty />}
              {result.gtData && tgtLang !== "en" && (
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 20,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <GTResult
                    word={result.word}
                    data={result.gtData}
                    targetLang={tgtLang}
                  />
                </div>
              )}
            </>
          )}
          {result.type === "zh" && (
            <>
              {result.hanziiData && (
                <ZHResult hanziiData={result.hanziiData} word={result.word} />
              )}
              {result.gtData && (
                <div
                  style={{
                    marginTop: result.hanziiData ? 20 : 0,
                    paddingTop: result.hanziiData ? 20 : 0,
                    borderTop: result.hanziiData
                      ? "1px solid var(--border)"
                      : "none",
                  }}
                >
                  <GTResult
                    word={result.word}
                    data={result.gtData}
                    targetLang={tgtLang}
                  />
                </div>
              )}
              {!result.hanziiData && !result.gtData && <Empty />}
            </>
          )}
          {result.type === "vi" && (
            <GTResult
              word={result.word}
              data={result.gtData}
              targetLang={tgtLang}
            />
          )}
        </div>
      )}

      {/* Tips */}
      {!loading && !result && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
            marginTop: 4,
          }}
        >
          {[
            { code: "en", examples: ["ephemeral", "resilient", "pragmatic"] },
            { code: "zh", examples: ["你好", "学习", "词典"] },
            { code: "vi", examples: ["từ vựng", "kiên nhẫn", "học tập"] },
          ].map((card) => {
            const lang = LANGS.find((l) => l.code === card.code);
            return (
              <div key={card.code} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: "1.3rem", marginBottom: 6 }}>
                  {lang.flag}
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    marginBottom: 10,
                  }}
                >
                  {lang.label}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {card.examples.map((ex) => (
                    <button
                      key={ex}
                      className="badge badge-purple"
                      style={{
                        cursor: "pointer",
                        border: "none",
                        fontSize: "0.73rem",
                        padding: "3px 9px",
                      }}
                      onClick={() => quickSearch(ex, card.code)}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
