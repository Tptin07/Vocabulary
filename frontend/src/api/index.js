import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Words
export const getWords = (params = {}) => api.get("/words", { params });
export const getWordsByDate = () => api.get("/words/by-date");
export const getCategories = () => api.get("/words/categories");
export const addWord = (data) => api.post("/words", data);
export const updateWord = (id, data) => api.put(`/words/${id}`, data);
export const deleteWord = (id) => api.delete(`/words/${id}`);

// Test Results
export const getTestResults = () => api.get("/test-results");
export const getTestStats = () => api.get("/test-results/stats");
export const saveTestResult = (data) => api.post("/test-results", data);

// Dictionary
export const dictEN = (word) => api.get(`/dict/en/${encodeURIComponent(word)}`);
export const dictZH = (word) => api.get(`/dict/zh/${encodeURIComponent(word)}`);
export const translate = (q, sl = "auto", tl = "vi") =>
  api.get("/dict/translate", { params: { q, sl, tl } });

export default api;
