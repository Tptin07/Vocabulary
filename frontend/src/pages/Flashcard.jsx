import { useState, useEffect } from "react";
import { getWords } from "../api";
import { useSpeech, SpeakButton } from "../hooks/useSpeech";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Flashcard() {
  const [words, setWords] = useState([]);
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("study"); // study | result
  const [shuffled, setShuffled] = useState(false);
  const { speak } = useSpeech();

  useEffect(() => {
    getWords()
      .then((res) => {
        const data = res.data.data || [];
        setWords(data);
        setCards(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFlip = () => {
    setFlipped((f) => !f);
  };

  // Auto-speak term when moving to a new card
  useEffect(() => {
    if (cards.length > 0 && phase === "study") {
      speak(cards[current].term);
    }
  }, [current, cards, phase]);

  const handleKnow = (val) => {
    const newKnown = new Set(known);
    if (val) newKnown.add(cards[current].id);
    else newKnown.delete(cards[current].id);
    setKnown(newKnown);

    if (current + 1 >= cards.length) {
      setPhase("result");
    } else {
      setCurrent((c) => c + 1);
      setFlipped(false);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent((c) => c - 1);
      setFlipped(false);
    }
  };

  const handleNext = () => {
    if (current + 1 < cards.length) {
      setCurrent((c) => c + 1);
      setFlipped(false);
    }
  };

  const restart = (onlyUnknown = false) => {
    const pool = onlyUnknown ? cards.filter((c) => !known.has(c.id)) : words;
    setCards(shuffle(pool));
    setCurrent(0);
    setFlipped(false);
    setKnown(new Set());
    setPhase("study");
  };

  const handleShuffle = () => {
    setCards((c) => shuffle([...c]));
    setCurrent(0);
    setFlipped(false);
    setShuffled(true);
  };

  if (loading)
    return (
      <div className="loading-center">
        <div
          className="loading-spinner"
          style={{ width: 32, height: 32, borderWidth: 3 }}
        />
      </div>
    );

  if (!words.length) {
    return (
      <div>
        <div className="page-header">
          <h1>🃏 Flashcard</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🃏</div>
          <p>Chưa có từ vựng nào để học. Hãy thêm từ trước!</p>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const knownCount = known.size;
    const unknownCount = cards.length - knownCount;
    return (
      <div>
        <div className="page-header">
          <h1>🃏 Flashcard — Kết Quả</h1>
        </div>
        <div className="quiz-container">
          <div className="result-screen">
            <span className="result-emoji">
              {knownCount >= cards.length * 0.8 ? "🎉" : "📖"}
            </span>
            <div className="result-score">
              {knownCount}/{cards.length}
            </div>
            <div className="result-title">Hoàn thành bộ thẻ!</div>
            <div className="result-subtitle">
              Bạn biết {knownCount} từ, chưa biết {unknownCount} từ
            </div>
            <div
              className="result-stats"
              style={{ gridTemplateColumns: "1fr 1fr" }}
            >
              <div className="result-stat">
                <div
                  className="result-stat-value"
                  style={{ color: "var(--success)" }}
                >
                  {knownCount}
                </div>
                <div className="result-stat-label">✅ Đã biết</div>
              </div>
              <div className="result-stat">
                <div
                  className="result-stat-value"
                  style={{ color: "var(--error)" }}
                >
                  {unknownCount}
                </div>
                <div className="result-stat-label">❌ Chưa biết</div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => restart(false)}
              >
                Học lại tất cả
              </button>
              {unknownCount > 0 && (
                <button
                  className="btn btn-primary"
                  onClick={() => restart(true)}
                >
                  Ôn {unknownCount} từ chưa biết
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[current];
  const progress = ((current + 1) / cards.length) * 100;

  return (
    <div>
      <div className="page-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1>🃏 Flashcard</h1>
            <p>Nhấn vào thẻ để lật — ghi nhớ từ vựng</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleShuffle}>
            🔀 Trộn thẻ
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Thẻ {current + 1} / {cards.length}
          </span>
          <span style={{ fontSize: "0.85rem" }}>
            <span style={{ color: "var(--success)" }}>✅ {known.size}</span>
            <span style={{ color: "var(--text-muted)", margin: "0 8px" }}>
              ·
            </span>
            <span style={{ color: "var(--error)" }}>
              ❌ {current - known.size + (known.has(card.id) ? 1 : 0)}
            </span>
          </span>
        </div>

        {/* Flashcard */}
        <div className="flashcard-scene" onClick={handleFlip}>
          <div className={`flashcard-inner${flipped ? " flipped" : ""}`}>
            <div className="flashcard-face flashcard-front">
              <div className="flashcard-label">từ vựng</div>
              <div className="flashcard-term">{card.term}</div>
              {card.category && (
                <span className="badge badge-purple" style={{ marginTop: 12 }}>
                  {card.category}
                </span>
              )}
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SpeakButton
                  text={card.term}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "0.78rem",
                  }}
                >
                  Nhấn thẻ để xem nghĩa →
                </span>
              </div>
            </div>
            <div className="flashcard-face flashcard-back">
              <div className="flashcard-label">định nghĩa</div>
              <div
                className="flashcard-def"
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 12,
                }}
              >
                {card.definition}
              </div>
              {card.example && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "var(--radius-sm)",
                    borderLeft: "2px solid var(--cyan)",
                    textAlign: "left",
                  }}
                >
                  "{card.example}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flashcard-nav">
          <button
            className="btn btn-secondary"
            onClick={handlePrev}
            disabled={current === 0}
          >
            ← Trước
          </button>
          <span className="flashcard-counter">
            {current + 1} / {cards.length}
          </span>
          <button
            className="btn btn-secondary"
            onClick={handleNext}
            disabled={current + 1 >= cards.length}
          >
            Sau →
          </button>
        </div>

        {/* Know / Don't Know */}
        <div className="flashcard-actions">
          <button
            className="btn"
            style={{
              background: "var(--error-bg)",
              color: "var(--error)",
              border: "1px solid rgba(239,68,68,0.3)",
              padding: "12px 28px",
              fontSize: "0.95rem",
            }}
            onClick={() => handleKnow(false)}
          >
            ❌ Chưa biết
          </button>
          <button
            className="btn"
            style={{
              background: "var(--success-bg)",
              color: "var(--success)",
              border: "1px solid rgba(16,185,129,0.3)",
              padding: "12px 28px",
              fontSize: "0.95rem",
            }}
            onClick={() => handleKnow(true)}
          >
            ✅ Đã biết
          </button>
        </div>
      </div>
    </div>
  );
}
