/**
 * =========================================================================
 * STORAGE & CONFIGURATION MANAGER (With IndexedDB for Large Media)
 * =========================================================================
 * Manages runtime state, localStorage persistence, IndexedDB media blobs,
 * and JSON import/export for seamless customization.
 */

const STORAGE_KEY = "FOR_VANSHIKA_CONFIG_V3";
const IDB_NAME = "VanshikaBirthdayMediaDB";
const IDB_VERSION = 1;
const IDB_STORE = "media_blobs";

class StorageManager {
  constructor() {
    this.db = null;
    this.config = this.loadConfig();
    this.initIndexedDB();
  }

  initIndexedDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => {
        console.warn("IndexedDB initialization error:", e);
        resolve(null);
      };
    });
  }

  async saveMediaBlob(key, blobOrFile) {
    if (!this.db) await this.initIndexedDB();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("No IndexedDB available");
      const tx = this.db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(blobOrFile, key);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e);
    });
  }

  async getMediaBlob(key) {
    if (!this.db) await this.initIndexedDB();
    return new Promise((resolve) => {
      if (!this.db) return resolve(null);
      const tx = this.db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async deleteMediaBlob(key) {
    if (!this.db) await this.initIndexedDB();
    return new Promise((resolve) => {
      if (!this.db) return resolve(false);
      const tx = this.db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = this.deepMerge(window.DEFAULT_CONFIG || {}, parsed);
        // Ensure non-empty photos & videos arrays
        if ((!merged.PHOTOS || merged.PHOTOS.length === 0) && window.DEFAULT_CONFIG && window.DEFAULT_CONFIG.PHOTOS) {
          merged.PHOTOS = window.DEFAULT_CONFIG.PHOTOS;
        }
        if ((!merged.VIDEOS || merged.VIDEOS.length === 0) && window.DEFAULT_CONFIG && window.DEFAULT_CONFIG.VIDEOS) {
          merged.VIDEOS = window.DEFAULT_CONFIG.VIDEOS;
        }
        return merged;
      }
    } catch (e) {
      console.warn("Could not parse saved configuration from localStorage, using defaults.", e);
    }
    return JSON.parse(JSON.stringify(window.DEFAULT_CONFIG || {}));
  }

  saveConfig(newConfig) {
    this.config = newConfig;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      return true;
    } catch (e) {
      console.error("Storage limit reached or localStorage disabled", e);
      return false;
    }
  }

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.config = JSON.parse(JSON.stringify(window.DEFAULT_CONFIG || {}));
    return this.config;
  }

  exportConfigJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.config, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vanshika_birthday_config_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  exportConfigFileJS() {
    const jsContent = `/**
 * "FOR VANSHIKA" — CENTRAL CONFIGURATION
 * Generated on ${new Date().toLocaleString()}
 */

const DEFAULT_CONFIG = ${JSON.stringify(this.config, null, 2)};

window.DEFAULT_CONFIG = DEFAULT_CONFIG;
`;
    try {
      const blob = new Blob([jsContent], { type: "text/javascript;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = url;
      downloadAnchor.download = "config.js";
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      setTimeout(() => {
        downloadAnchor.remove();
        URL.revokeObjectURL(url);
      }, 2000);
      return true;
    } catch (e) {
      console.warn("Blob download failed, trying data URI:", e);
      const dataUri = "data:text/javascript;charset=utf-8," + encodeURIComponent(jsContent);
      const a = document.createElement("a");
      a.href = dataUri;
      a.download = "config.js";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 1000);
      return true;
    }
  }

  getConfigJSString() {
    return `/**
 * "FOR VANSHIKA" — CENTRAL CONFIGURATION
 * Generated on ${new Date().toLocaleString()}
 */

const DEFAULT_CONFIG = ${JSON.stringify(this.config, null, 2)};

window.DEFAULT_CONFIG = DEFAULT_CONFIG;
`;
  }

  importConfigJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const merged = this.deepMerge(window.DEFAULT_CONFIG || {}, parsed);
      this.saveConfig(merged);
      return { success: true, config: merged };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  static fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }
}

window.storageManager = new StorageManager();
