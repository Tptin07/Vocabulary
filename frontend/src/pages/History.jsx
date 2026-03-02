import { useState, useEffect } from "react";
import { getWords, getWordsByDate, getTestResults } from "../api";
import { format } from "date-fns";

function formatDateLabel(dateStr) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Hôm nay";
    if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";
    return format(d, "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}

export default function History() {
  const [wordsByDate, setWordsByDate] = useState([]);
  const [wordDetails, setWordDetails] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("words"); // words | tests

  useEffect(() => {
    Promise.all([getWordsByDate(), getTestResults()])
      .then(([datesRes, testsRes]) => {
        const dates = datesRes.data.data || [];
        setWordsByDate(dates);
        setTestResults(testsRes.data.data || []);

        // Fetch words for each date
        const fetchPromises = dates.map((d) =>
          getWords({ date: d.date }).then((r) => ({
            date: d.date,
            words: r.data.data || [],
          })),
        );
        Promise.all(fetchPromises).then((results) => {
          const map = {};
          results.forEach((r) => {
            map[r.date] = r.words;
          });
          setWordDetails(map);
          setLoading(false);
        });
      })
      .catch(() => setLoading(false));
  }, []);

  const totalWords = wordsByDate.reduce((s, d) => s + d.count, 0);
  const totalTests = testResults.length;
  const avgScore = testResults.length
    ? Math.round(
        testResults.reduce((s, r) => s + (r.score / r.total) * 100, 0) /
          testResults.length,
      )
    : 0;

  if (loading)
    return (
      <div className="loading-center">
        <div
          className="loading-spinner"
          style={{ width: 32, height: 32, borderWidth: 3 }}
        />
      </div>
    );

  return (
    <div>
      <div className="page-header">
        <h1>📅 Lịch Sử</h1>
        <p>Theo dõi quá trình học tập của bạn</p>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-value">{totalWords}</div>
          <div className="stat-card-label">Tổng từ vựng</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{wordsByDate.length}</div>
          <div className="stat-card-label">Ngày học</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{totalTests}</div>
          <div className="stat-card-label">Bài kiểm tra</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{avgScore}%</div>
          <div className="stat-card-label">Điểm trung bình</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button
          className={`btn ${tab === "words" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("words")}
        >
          📚 Từ Vựng
        </button>
        <button
          className={`btn ${tab === "tests" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("tests")}
        >
          ⏱️ Bài Kiểm Tra
        </button>
      </div>

      {tab === "words" && (
        <div>
          {wordsByDate.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>Chưa có từ vựng nào được thêm.</p>
            </div>
          ) : (
            <div className="history-timeline">
              {wordsByDate.map(({ date, count }) => {
                const wordsForDate = wordDetails[date] || [];
                return (
                  <div key={date} className="history-day">
                    <div className="history-day-header">
                      <div className="history-day-dot" />
                      <div>
                        <span className="history-day-label">
                          {formatDateLabel(date)}
                        </span>
                        <span
                          style={{
                            marginLeft: 10,
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {count} từ mới
                        </span>
                      </div>
                    </div>
                    <div className="history-day-words">
                      {wordsForDate.map((word) => (
                        <div
                          key={word.id}
                          className="card"
                          style={{ padding: "12px 14px" }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "0.95rem",
                              marginBottom: 4,
                            }}
                          >
                            {word.term}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-secondary)",
                              marginBottom: 6,
                            }}
                          >
                            {word.definition}
                          </div>
                          <span className="badge badge-purple">
                            {word.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "tests" && (
        <div>
          {testResults.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>Chưa có bài kiểm tra nào. Hãy thử thi xem!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {testResults.map((r) => {
                const pct = Math.round((r.score / r.total) * 100);
                const mins = Math.floor(r.duration / 60);
                const secs = r.duration % 60;
                const timeStr = mins > 0 ? `${mins}p ${secs}s` : `${secs}s`;
                return (
                  <div
                    key={r.id}
                    className="card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 20px",
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background:
                          pct >= 80
                            ? "var(--success-bg)"
                            : pct >= 50
                              ? "var(--warning-bg)"
                              : "var(--error-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "1rem",
                        color:
                          pct >= 80
                            ? "var(--success)"
                            : pct >= 50
                              ? "var(--warning)"
                              : "var(--error)",
                        flexShrink: 0,
                      }}
                    >
                      {pct}%
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>
                        {r.score}/{r.total} câu đúng
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        ⏱️ {timeStr} ·{" "}
                        {r.created_at?.slice(0, 16).replace("T", " ")}
                      </div>
                    </div>
                    <div>{pct >= 80 ? "🏆" : pct >= 50 ? "🎯" : "💪"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
