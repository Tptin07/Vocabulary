import { useState, useEffect, useCallback } from "react";
import {
  getWords,
  addWord,
  updateWord,
  deleteWord,
  getCategories,
} from "../api";

const CATEGORIES = [
  "General",
  "Noun",
  "Verb",
  "Adjective",
  "Adverb",
  "Phrase",
  "Idiom",
  "Other",
];

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast ${type}`}>
      <span>{type === "success" ? "✅" : "❌"}</span>
      {message}
    </div>
  );
}

function WordModal({ word, onSave, onClose }) {
  const [form, setForm] = useState({
    term: word?.term || "",
    definition: word?.definition || "",
    example: word?.example || "",
    category: word?.category || "General",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.term.trim() || !form.definition.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{word ? "✏️ Chỉnh Sửa Từ" : "➕ Thêm Từ Mới"}</h2>
          <button
            className="btn btn-secondary btn-sm btn-icon"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Từ vựng *</label>
            <input
              className="input"
              placeholder="Nhập từ hoặc cụm từ..."
              value={form.term}
              onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="input-group">
            <label>Định nghĩa *</label>
            <textarea
              className="input"
              placeholder="Nhập nghĩa của từ..."
              value={form.definition}
              onChange={(e) =>
                setForm((p) => ({ ...p, definition: e.target.value }))
              }
              required
            />
          </div>
          <div className="input-group">
            <label>Ví dụ</label>
            <textarea
              className="input"
              placeholder="Ví dụ câu..."
              value={form.example}
              onChange={(e) =>
                setForm((p) => ({ ...p, example: e.target.value }))
              }
            />
          </div>
          <div className="input-group">
            <label>Danh mục</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <span className="loading-spinner" />
              ) : word ? (
                "Lưu thay đổi"
              ) : (
                "Thêm từ"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <h2>⚠️ Xác nhận</h2>
          <button
            className="btn btn-secondary btn-sm btn-icon"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <p className="confirm-text">{message}</p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WordManager({ onWordChange }) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null); // null | 'add' | word object
  const [confirmDelete, setConfirmDelete] = useState(null); // word id
  const [toast, setToast] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const loadWords = useCallback(async (q = search, cat = category) => {
    try {
      const params = {};
      if (q) params.search = q;
      if (cat !== "All") params.category = cat;
      const res = await getWords(params);
      setWords(res.data.data || []);
    } catch {
      showToast("Không thể tải từ vựng", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(["All", ...(res.data.data || [])]);
    } catch {}
  };

  useEffect(() => {
    loadWords("", "All");
    loadCategories();
  }, []);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => loadWords(val, category), 300));
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    loadWords(search, cat);
  };

  const handleSave = async (form) => {
    try {
      if (modal && modal.id) {
        await updateWord(modal.id, form);
        showToast("Đã cập nhật từ vựng ✓");
      } else {
        await addWord(form);
        showToast("Đã thêm từ vựng mới ✓");
      }
      setModal(null);
      loadWords(search, category);
      loadCategories();
    } catch {
      showToast("Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWord(confirmDelete);
      setConfirmDelete(null);
      showToast("Đã xóa từ vựng");
      loadWords(search, category);
    } catch {
      showToast("Không thể xóa", "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1>📚 Từ Vựng</h1>
            <p>Quản lý danh sách từ vựng của bạn ({words.length} từ)</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModal("add")}>
            ➕ Thêm Từ
          </button>
        </div>
      </div>

      <div className="search-bar">
        <input
          className="input"
          placeholder="🔍 Tìm kiếm từ vựng..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          className="input"
          style={{ width: 160 }}
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          {(categories.length ? categories : ["All", ...CATEGORIES]).map(
            (c) => (
              <option key={c}>{c}</option>
            ),
          )}
        </select>
      </div>

      {loading ? (
        <div className="loading-center">
          <div
            className="loading-spinner"
            style={{ width: 32, height: 32, borderWidth: 3 }}
          />
        </div>
      ) : words.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>
            {search || category !== "All"
              ? "Không tìm thấy từ nào phù hợp."
              : "Chưa có từ vựng nào. Hãy thêm từ đầu tiên!"}
          </p>
          {!search && category === "All" && (
            <button className="btn btn-primary" onClick={() => setModal("add")}>
              ➕ Thêm Từ Đầu Tiên
            </button>
          )}
        </div>
      ) : (
        <div className="word-list">
          {words.map((word) => (
            <div key={word.id} className="word-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 6,
                }}
              >
                <div className="word-card-term">{word.term}</div>
                <span className="badge badge-purple">{word.category}</span>
              </div>
              <div className="word-card-def">{word.definition}</div>
              {word.example && (
                <div className="word-card-example">"{word.example}"</div>
              )}
              <div className="word-card-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModal(word)}
                >
                  ✏️ Sửa
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setConfirmDelete(word.id)}
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === "add" || (modal && modal.id)) && (
        <WordModal
          word={modal === "add" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Bạn có chắc muốn xóa từ vựng này? Hành động này không thể hoàn tác."
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
