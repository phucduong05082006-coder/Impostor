/**
 * SPY PARTY - Storage Module
 * Quản lý LocalStorage an toàn với dự phòng in-memory
 */

class StorageManager {
  constructor() {
    this.memoryFallback = {};
    this.isStorageAvailable = this.checkStorage();
    this.initDefaultData();
  }

  checkStorage() {
    try {
      const testKey = '__spy_party_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('LocalStorage không khả dụng, sử dụng bộ nhớ tạm thời:', e);
      return false;
    }
  }

  getItem(key, defaultValue = null) {
    try {
      if (this.isStorageAvailable) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      }
      return this.memoryFallback[key] !== undefined ? this.memoryFallback[key] : defaultValue;
    } catch (e) {
      console.error(`Lỗi đọc key ${key}:`, e);
      return defaultValue;
    }
  }

  setItem(key, value) {
    try {
      if (this.isStorageAvailable) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        this.memoryFallback[key] = value;
      }
      return true;
    } catch (e) {
      console.error(`Lỗi ghi key ${key}:`, e);
      return false;
    }
  }

  initDefaultData() {
    // 1. Cài đặt mặc định
    if (!this.getItem('spy_party_settings')) {
      this.setItem('spy_party_settings', {
        soundEnabled: true,
        volume: 0.7,
        vibrationEnabled: true,
        effectsEnabled: true,
        clueTime: 45,        // giây cho mỗi lượt gợi ý
        discussionTime: 90,  // giây cho thảo luận chung
        allowTieNoElim: true // cho phép hòa phiếu không ai bị loại
      });
    }

    // 2. Thống kê ban đầu
    if (!this.getItem('spy_party_stats')) {
      this.setItem('spy_party_stats', {
        totalGames: 0,
        civilianWins: 0,
        spyWins: 0,
        mrWhiteWins: 0,
        roleCounts: {
          civilian: 0,
          spy: 0,
          mr_white: 0
        }
      });
    }

    // 3. Lịch sử ban đầu
    if (!this.getItem('spy_party_history')) {
      this.setItem('spy_party_history', []);
    }

    // 4. Người chơi gần đây
    if (!this.getItem('spy_party_recent_players')) {
      this.setItem('spy_party_recent_players', [
        { name: 'Chiến Binh', avatar: '🕵️' },
        { name: 'Mật Thám', avatar: '🕶️' },
        { name: 'Đặc Nhiệm', avatar: '🎩' }
      ]);
    }

    // 5. Từ khóa tự tạo
    if (!this.getItem('spy_party_custom_words')) {
      this.setItem('spy_party_custom_words', []);
    }
    if (!this.getItem('spy_party_custom_pairs')) {
      this.setItem('spy_party_custom_pairs', []);
    }

    // 6. Danh sách từ vừa chơi (tránh trùng lặp)
    if (!this.getItem('spy_party_recent_words')) {
      this.setItem('spy_party_recent_words', []);
    }
  }

  // --- Helpers truy xuất cấu hình ---
  getSettings() {
    return this.getItem('spy_party_settings');
  }

  saveSettings(settings) {
    return this.setItem('spy_party_settings', settings);
  }

  // --- Helpers thống kê ---
  getStats() {
    return this.getItem('spy_party_stats');
  }

  recordGameResult({ winner, rolesPlayed, rounds, eliminatedCount, wordA, wordB, mode }) {
    const stats = this.getStats();
    stats.totalGames += 1;

    if (winner === 'civilian') stats.civilianWins += 1;
    else if (winner === 'spy') stats.spyWins += 1;
    else if (winner === 'mr_white') stats.mrWhiteWins += 1;

    if (rolesPlayed && Array.isArray(rolesPlayed)) {
      rolesPlayed.forEach(role => {
        if (stats.roleCounts[role] !== undefined) {
          stats.roleCounts[role] += 1;
        }
      });
    }
    this.setItem('spy_party_stats', stats);

    // Lưu vào lịch sử (giới hạn 30 trận gần nhất)
    const history = this.getItem('spy_party_history', []);
    history.unshift({
      id: Date.now(),
      date: new Date().toLocaleString('vi-VN'),
      winner,
      mode,
      rounds,
      eliminatedCount,
      wordA,
      wordB,
      players: rolesPlayed ? rolesPlayed.length : 0
    });
    if (history.length > 30) history.pop();
    this.setItem('spy_party_history', history);
  }

  clearHistory() {
    this.setItem('spy_party_history', []);
    this.setItem('spy_party_stats', {
      totalGames: 0,
      civilianWins: 0,
      spyWins: 0,
      mrWhiteWins: 0,
      roleCounts: { civilian: 0, spy: 0, mr_white: 0 }
    });
  }

  // --- Helpers từ khóa gần đây ---
  addRecentWord(word) {
    if (!word) return;
    let recents = this.getItem('spy_party_recent_words', []);
    recents.unshift(word.toLowerCase().trim());
    if (recents.length > 40) recents = recents.slice(0, 40);
    this.setItem('spy_party_recent_words', recents);
  }

  isWordRecent(word) {
    if (!word) return false;
    const recents = this.getItem('spy_party_recent_words', []);
    return recents.includes(word.toLowerCase().trim());
  }

  // --- Helpers từ khóa tự tạo ---
  getCustomWords() {
    return this.getItem('spy_party_custom_words', []);
  }

  addCustomWord(word, difficulty = 'easy', topic = 'custom') {
    if (!word || !word.trim()) return false;
    const words = this.getCustomWords();
    const cleanWord = word.trim();
    if (words.some(w => w.word.toLowerCase() === cleanWord.toLowerCase())) {
      return false; // Đã tồn tại
    }
    words.push({ id: 'c_' + Date.now(), word: cleanWord, difficulty, topic });
    this.setItem('spy_party_custom_words', words);
    return true;
  }

  deleteCustomWord(wordId) {
    let words = this.getCustomWords();
    words = words.filter(w => w.id !== wordId && w.word !== wordId);
    this.setItem('spy_party_custom_words', words);
    return true;
  }

  getCustomPairs() {
    return this.getItem('spy_party_custom_pairs', []);
  }

  addCustomPair(wordA, wordB, difficulty = 'easy') {
    if (!wordA || !wordB) return false;
    const pairs = this.getCustomPairs();
    pairs.push({
      id: 'cp_' + Date.now(),
      wordA: wordA.trim(),
      wordB: wordB.trim(),
      difficulty,
      topic: 'custom'
    });
    this.setItem('spy_party_custom_pairs', pairs);
    return true;
  }

  deleteCustomPair(pairId) {
    let pairs = this.getCustomPairs();
    pairs = pairs.filter(p => p.id !== pairId);
    this.setItem('spy_party_custom_pairs', pairs);
    return true;
  }
}

// Khởi tạo instance dùng chung
window.appStorage = new StorageManager();

