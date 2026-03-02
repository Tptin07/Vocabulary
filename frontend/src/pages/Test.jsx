import { useState, useEffect, useRef, useCallback } from "react";
import { getWords, saveTestResult } from "../api";
import { SpeakButton } from "../hooks/useSpeech";

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
  return { word: currentWord, options, selectedId: null };
}

const TIME_PER_QUESTION = 20; // seconds

export default function Test() {
  const [words, setWords] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [phase, setPhase] = useState("setup"); // setup | quiz | result
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [answers, setAnswers] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    getWords()
      .then((res) => {
        setWords(res.data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const endQuiz = useCallback(async (finalAnswers, elapsed) => {
    clearInterval(timerRef.current);
    const score = finalAnswers.filter((a) => a.correct).length;
    const total = finalAnswers.length;
    const duration = Math.round(elapsed / 1000);
    try {
      await saveTestResult({ score, total, duration, mode: "test" });
    } catch {}
    setPhase("result");
  }, []);

  const goToNext = useCallback(
    (currentQ, selectedId, currentAnswers) => {
      clearInterval(timerRef.current);
      const isCorrect = selectedId === currentQ.word.id;
      const newAnswers = [
        ...currentAnswers,
        {
          term: currentQ.word.term,
          correctDef: currentQ.word.definition,
          selectedDef:
            currentQ.options.find((o) => o.id === selectedId)?.definition ||
            "Bỏ qua",
          correct: isCorrect,
        },
      ];
      setAnswers(newAnswers);

      if (current + 1 >= questions.length) {
        endQuiz(newAnswers, Date.now() - startTime);
      } else {
        setCurrent((c) => c + 1);
        setTimeLeft(TIME_PER_QUESTION);
      }
    },
    [current, questions, startTime, endQuiz],
  );

  useEffect(() => {
    if (phase !== "quiz") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time up — auto skip
          goToNext(questions[current], null, answers);
          return TIME_PER_QUESTION;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, current, questions, answers, goToNext]);

  const startQuiz = () => {
    if (words.length < 4) return;
    const pool = shuffle(words).slice(0, Math.min(count, words.length));
    const qs = pool.map((w) => buildQuestion(words, w));
    setQuestions(qs);
    setCurrent(0);
    setAnswers([]);
    setTimeLeft(TIME_PER_QUESTION);
    setStartTime(Date.now());
    setPhase("quiz");
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
          <h1>⏱️ Kiểm Tra</h1>
          <p>Quiz có thời gian — mỗi câu {TIME_PER_QUESTION} giây</p>
        </div>
        <div className="quiz-container">
          <div className="glow-card">
            <div style={{ fontSize: "3.5rem", marginBottom: 20 }}>⏱️</div>
            <h2 style={{ marginBottom: 8, fontSize: "1.4rem" }}>
              Bài Kiểm Tra
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 28 }}>
              Mỗi câu có{" "}
              <strong style={{ color: "var(--warning)" }}>
                {TIME_PER_QUESTION} giây
              </strong>{" "}
              để trả lời. Kết quả sẽ được lưu lại.
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
                ⚠️ Cần ít nhất 4 từ vựng. Hãy thêm thêm từ!
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
    const score = answers.filter((a) => a.correct).length;
    const total = answers.length;
    const pct = Math.round((score / total) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "🎯" : "💪";

    return (
      <div>
        <div className="page-header">
          <h1>⏱️ Kiểm Tra — Kết Quả</h1>
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
                  : "Cần ôn thêm!"}
            </div>
            <div className="result-subtitle">
              {score}/{total} câu đúng — Đã lưu kết quả
            </div>
            <div className="result-stats">
              <div className="result-stat">
                <div
                  className="result-stat-value"
                  style={{ color: "var(--success)" }}
                >
                  {score}
                </div>
                <div className="result-stat-label">Đúng</div>
              </div>
              <div className="result-stat">
                <div
                  className="result-stat-value"
                  style={{ color: "var(--error)" }}
                >
                  {total - score}
                </div>
                <div className="result-stat-label">Sai / Bỏ</div>
              </div>
              <div className="result-stat">
                <div className="result-stat-value">{pct}%</div>
                <div className="result-stat-label">Điểm</div>
              </div>
            </div>
          </div>

          {/* Review Answers */}
          <div>
            <h3
              style={{
                marginBottom: 14,
                fontSize: "1rem",
                color: "var(--text-secondary)",
              }}
            >
              Chi tiết bài làm:
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {answers.map((a, i) => (
                <div
                  key={i}
                  className="card"
                  style={{
                    padding: "14px 18px",
                    borderColor: a.correct
                      ? "rgba(16,185,129,0.3)"
                      : "rgba(239,68,68,0.3)",
                    background: a.correct
                      ? "var(--success-bg)"
                      : "var(--error-bg)",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    {a.correct ? "✅" : "❌"} {a.term}
                  </div>
                  <div
                    style={{
                      fontSize: "0.83rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {a.correct
                      ? `Đúng: ${a.correctDef}`
                      : `Sai: "${a.selectedDef}" (Đúng: "${a.correctDef}")`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={() => setPhase("setup")}
            >
              ← Quay lại
            </button>
            <button className="btn btn-primary" onClick={startQuiz}>
              Thi lại 🔁
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const progress = (current / questions.length) * 100;
  const timePct = (timeLeft / TIME_PER_QUESTION) * 100;
  const timerClass =
    timePct > 50 ? "safe" : timePct > 25 ? "warning" : "danger";
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
          <h1>⏱️ Kiểm Tra</h1>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            {current + 1} / {questions.length}
          </span>
        </div>
      </div>
      <div className="quiz-container">
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div
          className="timer-display"
          style={{
            color:
              timerClass === "danger"
                ? "var(--error)"
                : timerClass === "warning"
                  ? "var(--warning)"
                  : "var(--success)",
          }}
        >
          {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
          {String(timeLeft % 60).padStart(2, "0")}
        </div>

        <div className="timer-bar-wrap">
          <div
            className={`timer-bar ${timerClass}`}
            style={{ width: `${timePct}%` }}
          />
        </div>

        <div className="question-card">
          <div className="question-label">Từ vựng</div>
          <div className="question-term">{q.word.term}</div>
          {q.word.category && (
            <span className="badge badge-purple">{q.word.category}</span>
          )}
          <div style={{ marginTop: 14 }}>
            <SpeakButton
              text={q.word.term}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
          </div>
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
          {q.options.map((opt, i) => (
            <button
              key={opt.id}
              className="option-btn"
              onClick={() => goToNext(q, opt.id, answers)}
            >
              <span className="option-letter">{letters[i]}</span>
              {opt.definition}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
