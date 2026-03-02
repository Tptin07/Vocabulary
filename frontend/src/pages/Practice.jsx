import { useState, useEffect } from "react";
import { getWords } from "../api";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestion(words, currentWord) {
  const others = words.filter((w) => w.id !== currentWord.id);
  const shuffledOthers = shuffle(others).slice(0, 3);
  const options = shuffle([currentWord, ...shuffledOthers]);
  return { word: currentWord, options };
}

export default function Practice() {
  const [words, setWords] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState("setup"); // setup | quiz | result
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWords()
      .then((res) => {
        setWords(res.data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const startQuiz = () => {
    if (words.length < 4) return;
    const pool = shuffle(words).slice(0, Math.min(count, words.length));
    const qs = pool.map((w) => buildQuestion(words, w));
    setQuestions(qs);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setPhase("quiz");
  };

  const handleSelect = (option) => {
    if (selected !== null) return;
    setSelected(option.id);
    if (option.id === questions[current].word.id) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setPhase("result");
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
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

  if (phase === "setup") {
    return (
      <div>
        <div className="page-header">
          <h1>🎯 Luyện Tập</h1>
          <p>Trả lời câu hỏi trắc nghiệm không giới hạn thời gian</p>
        </div>
        <div className="quiz-container">
          <div
            className="glow-card"
            style={{ textAlign: "center", padding: 40 }}
          >
            <div style={{ fontSize: "3.5rem", marginBottom: 20 }}>🎯</div>
            <h2 style={{ marginBottom: 8, fontSize: "1.4rem" }}>
              Bắt Đầu Luyện Tập
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 28 }}>
              Bạn có{" "}
              <strong style={{ color: "var(--accent-light)" }}>
                {words.length} từ vựng
              </strong>{" "}
              trong kho. Chọn số câu muốn luyện.
            </p>

            {words.length < 4 ? (
              <div
                style={{
                  padding: "16px",
                  background: "var(--error-bg)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--error)",
                  marginBottom: 20,
                }}
              >
                ⚠️ Cần ít nhất 4 từ vựng để luyện tập. Hãy thêm thêm từ!
              </div>
            ) : (
              <>
                <div
                  className="input-group"
                  style={{ maxWidth: 240, margin: "0 auto 24px" }}
                >
                  <label>Số câu hỏi</label>
                  <select
                    className="input"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  >
                    {[5, 10, 15, 20, words.length]
                      .filter(
                        (v, i, a) => a.indexOf(v) === i && v <= words.length,
                      )
                      .map((n) => (
                        <option key={n} value={n}>
                          {n} câu
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary btn-hero"
                  style={{ padding: "14px 36px", fontSize: "1rem" }}
                  onClick={startQuiz}
                >
                  Bắt Đầu ▶
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const pct = Math.round((score / questions.length) * 100);
    const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪";
    return (
      <div>
        <div className="page-header">
          <h1>🎯 Luyện Tập</h1>
        </div>
        <div className="quiz-container">
          <div className="result-screen">
            <span className="result-emoji">{emoji}</span>
            <div className="result-score">{pct}%</div>
            <div className="result-title">
              {pct >= 80
                ? "Xuất sắc!"
                : pct >= 50
                  ? "Khá tốt!"
                  : "Cần cố gắng hơn!"}
            </div>
            <div className="result-subtitle">
              {score}/{questions.length} câu đúng
            </div>
            <div className="result-stats">
              <div className="result-stat">
                <div
                  className="result-stat-value"
                  style={{ color: "var(--success)" }}
                >
                  {score}
                </div>
                <div className="result-stat-label">Câu đúng</div>
              </div>
              <div className="result-stat">
                <div
                  className="result-stat-value"
                  style={{ color: "var(--error)" }}
                >
                  {questions.length - score}
                </div>
                <div className="result-stat-label">Câu sai</div>
              </div>
              <div className="result-stat">
                <div className="result-stat-value">{pct}%</div>
                <div className="result-stat-label">Tỉ lệ đúng</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPhase("setup")}
              >
                ← Quay lại
              </button>
              <button className="btn btn-primary" onClick={startQuiz}>
                Luyện tiếp 🔁
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const progress = (current / questions.length) * 100;
  const letters = ["A", "B", "C", "D"];

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
          <h1>🎯 Luyện Tập</h1>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            {current + 1} / {questions.length}
          </span>
        </div>
      </div>
      <div className="quiz-container">
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="question-card">
          <div className="question-label">Từ vựng</div>
          <div className="question-term">{q.word.term}</div>
          {q.word.category && (
            <span className="badge badge-purple">{q.word.category}</span>
          )}
        </div>

        <div
          style={{
            marginBottom: 8,
            color: "var(--text-muted)",
            fontSize: "0.85rem",
          }}
        >
          Chọn đáp án đúng:
        </div>

        <div className="options-grid">
          {q.options.map((opt, i) => {
            let cls = "option-btn";
            if (selected !== null) {
              if (opt.id === q.word.id) cls += " correct";
              else if (opt.id === selected) cls += " wrong";
            }
            return (
              <button
                key={opt.id}
                className={cls}
                onClick={() => handleSelect(opt)}
                disabled={selected !== null}
              >
                <span className="option-letter">{letters[i]}</span>
                {opt.definition}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div style={{ marginTop: 20, textAlign: "right" }}>
            <button className="btn btn-primary" onClick={handleNext}>
              {current + 1 >= questions.length
                ? "Xem kết quả 🏁"
                : "Câu tiếp theo →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
