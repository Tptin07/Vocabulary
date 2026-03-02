/**
 * useSpeech — Text-to-Speech with language support
 * Languages: en-US, vi-VN, zh-CN
 */

import {
  useState,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";

// --- Language Context ---
export const LANGUAGES = [
  { code: "en-US", label: "English", flag: "🇺🇸", short: "EN" },
  { code: "vi-VN", label: "Tiếng Việt", flag: "🇻🇳", short: "VI" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳", short: "ZH" },
];

export const SpeechLangContext = createContext({
  lang: "en-US",
  setLang: () => {},
});

export function SpeechLangProvider({ children }) {
  const [lang, setLang] = useState("en-US");
  return (
    <SpeechLangContext.Provider value={{ lang, setLang }}>
      {children}
    </SpeechLangContext.Provider>
  );
}

// --- Hook ---
export function useSpeech() {
  const { lang } = useContext(SpeechLangContext);
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(
    (text, overrideLang) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      const useLang = overrideLang || lang;
      utter.lang = useLang;
      utter.rate = 0.9;
      utter.pitch = 1;
      utter.volume = 1;

      // Pick best voice for language
      const voices = window.speechSynthesis.getVoices();
      const match =
        voices.find(
          (v) =>
            v.name.toLowerCase().includes("google") &&
            v.lang.startsWith(useLang.split("-")[0]),
        ) ||
        voices.find((v) => v.lang === useLang) ||
        voices.find((v) => v.lang.startsWith(useLang.split("-")[0])) ||
        null;

      if (match) utter.voice = match;

      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utter);
    },
    [lang],
  );

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported: !!window.speechSynthesis };
}

// --- SpeakButton ---
export function SpeakButton({ text, style = {} }) {
  const { speak, speaking, supported } = useSpeech();
  if (!supported) return null;

  return (
    <button
      className="btn btn-secondary btn-sm speak-btn"
      style={{ minWidth: 30, padding: "4px 9px", ...style }}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      title={`Đọc: "${text}"`}
      aria-label="Phát âm"
    >
      {speaking ? "🔈" : "🔊"}
    </button>
  );
}

// --- Language Picker (for sidebar) ---
export function LanguagePicker() {
  const { lang, setLang } = useContext(SpeechLangContext);

  return (
    <div style={{ margin: "0 12px", marginBottom: 12 }}>
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "var(--ink3)",
          textTransform: "uppercase",
          letterSpacing: "0.7px",
          marginBottom: 8,
        }}
      >
        🔊 Giọng đọc
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            title={l.label}
            style={{
              flex: 1,
              padding: "6px 4px",
              borderRadius: 8,
              border:
                lang === l.code
                  ? "1.5px solid var(--ink)"
                  : "1.5px solid var(--border2)",
              background: lang === l.code ? "var(--ink)" : "var(--surface)",
              color: lang === l.code ? "#fff" : "var(--ink2)",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              transition: "all .15s ease",
              lineHeight: 1,
            }}
          >
            <span style={{ fontSize: "1rem" }}>{l.flag}</span>
            <span>{l.short}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
