import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import WordManager from "./pages/WordManager";
import Practice from "./pages/Practice";
import Test from "./pages/Test";
import Flashcard from "./pages/Flashcard";
import History from "./pages/History";
import { getWords } from "./api";
import { SpeechLangProvider, LanguagePicker } from "./hooks/useSpeech";

const navItems = [
  { to: "/", icon: "📚", label: "Từ Vựng", end: true },
  { to: "/practice", icon: "🎯", label: "Luyện Tập" },
  { to: "/test", icon: "⏱️", label: "Kiểm Tra" },
  { to: "/flashcard", icon: "🃏", label: "Flashcard" },
  { to: "/history", icon: "📅", label: "Lịch Sử" },
];

function AppInner() {
  const [wordCount, setWordCount] = useState("–");

  useEffect(() => {
    getWords()
      .then((r) => setWordCount(r.data.data?.length ?? 0))
      .catch(() => {});
  }, []);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>VocabMaster</h1>
          <span>Luyện tập từ vựng</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Language Picker */}
        <LanguagePicker />

        <div className="sidebar-stat">
          <strong>{wordCount}</strong>
          từ vựng trong kho
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={<WordManager onWordChange={setWordCount} />}
          />
          <Route path="/practice" element={<Practice />} />
          <Route path="/test" element={<Test />} />
          <Route path="/flashcard" element={<Flashcard />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SpeechLangProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </SpeechLangProvider>
  );
}
