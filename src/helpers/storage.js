// src/storage.js
export function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getItem(key) {
  const raw = localStorage.getItem(key);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function removeItem(key) {
  localStorage.removeItem(key);
}
