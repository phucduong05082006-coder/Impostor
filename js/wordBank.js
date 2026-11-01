/**
 * SPY PARTY - Word Bank Engine
 * Quản lý kho từ vựng tiếng Việt, phân loại chủ đề, độ khó và các cặp từ Undercover.
 * Tích hợp sẵn dữ liệu fallback để chạy tốt ngay cả trên file:// protocol không cần web server.
 */

class WordBank {
  constructor() {
    this.topics = [];
    this.pairs = [];
    this.isLoaded = false;
    this.init();
  }

  async init() {
    // Thử fetch file JSON, nếu thất bại (ví dụ mở trực tiếp file://) sẽ dùng embedded fallback
    try {
      const wordsRes = await fetch('data/words.json');
      if (wordsRes.ok) {
        const data = await wordsRes.json();
        this.topics = data.topics || [];
      }
    } catch (e) {
      console.warn('Không thể fetch data/words.json, kích hoạt bộ từ vựng dự phòng tích hợp:', e);
    }

    try {
      const pairsRes = await fetch('data/wordPairs.json');
      if (pairsRes.ok) {
        const data = await pairsRes.json();
        this.pairs = data.pairs || [];
      }
    } catch (e) {
      console.warn('Không thể fetch data/wordPairs.json, dùng bộ cặp từ tích hợp:', e);
    }

    // Nếu fetch không có dữ liệu, nạp fallback tối thiểu đảm bảo trò chơi luôn chạy
    if (!this.topics || this.topics.length === 0) {
      this.loadBuiltinFallback();
    }
    this.isLoaded = true;
  }

  loadBuiltinFallback() {
    this.topics = [
      {
        id: 'do_an', name: 'Đồ ăn', icon: '🍜',
        words: [
          { word: 'Phở bò', difficulty: 'easy' },
          { word: 'Bánh mì', difficulty: 'easy' },
          { word: 'Cơm tấm', difficulty: 'easy' },
          { word: 'Bún chả', difficulty: 'easy' },
          { word: 'Bánh xèo', difficulty: 'easy' },
          { word: 'Gỏi cuốn', difficulty: 'easy' },
          { word: 'Pizza', difficulty: 'easy' },
          { word: 'Hamburger', difficulty: 'easy' },
          { word: 'Gà rán', difficulty: 'easy' },
          { word: 'Khoai tây chiên', difficulty: 'easy' },
          { word: 'Bánh chưng', difficulty: 'medium' },
          { word: 'Bún bò Huế', difficulty: 'medium' },
          { word: 'Lẩu Thái', difficulty: 'medium' },
          { word: 'Sushi', difficulty: 'medium' },
          { word: 'Dimsum', difficulty: 'medium' },
          { word: 'Bún đậu mắm tôm', difficulty: 'hard' },
          { word: 'Phá lấu', difficulty: 'hard' },
          { word: 'Vịt quay Bắc Kinh', difficulty: 'hard' }
        ]
      },
      {
        id: 'do_uong', name: 'Đồ uống', icon: '☕',
        words: [
          { word: 'Cà phê sữa đá', difficulty: 'easy' },
          { word: 'Trà sữa', difficulty: 'easy' },
          { word: 'Nước cam', difficulty: 'easy' },
          { word: 'Trà chanh', difficulty: 'easy' },
          { word: 'Nước dừa', difficulty: 'easy' },
          { word: 'Bia hơi', difficulty: 'easy' },
          { word: 'Coca Cola', difficulty: 'easy' },
          { word: 'Bạc xỉu', difficulty: 'medium' },
          { word: 'Rượu vang', difficulty: 'medium' },
          { word: 'Cocktail', difficulty: 'medium' },
          { word: 'Cà phê trứng', difficulty: 'hard' },
          { word: 'Kombucha', difficulty: 'hard' }
        ]
      },
      {
        id: 'dong_vat', name: 'Động vật', icon: '🐾',
        words: [
          { word: 'Con chó', difficulty: 'easy' },
          { word: 'Con mèo', difficulty: 'easy' },
          { word: 'Con gà', difficulty: 'easy' },
          { word: 'Con bò', difficulty: 'easy' },
          { word: 'Con voi', difficulty: 'easy' },
          { word: 'Con hổ', difficulty: 'easy' },
          { word: 'Sư tử', difficulty: 'medium' },
          { word: 'Cá heo', difficulty: 'medium' },
          { word: 'Chim cánh cụt', difficulty: 'medium' },
          { word: 'Chó sói', difficulty: 'medium' },
          { word: 'Tắc kè hoa', difficulty: 'hard' },
          { word: 'Thú mỏ vịt', difficulty: 'hard' }
        ]
      },
      {
        id: 'dia_diem', name: 'Địa điểm', icon: '📍',
        words: [
          { word: 'Bệnh viện', difficulty: 'easy' },
          { word: 'Trường học', difficulty: 'easy' },
          { word: 'Siêu thị', difficulty: 'easy' },
          { word: 'Rạp chiếu phim', difficulty: 'easy' },
          { word: 'Sân bay', difficulty: 'easy' },
          { word: 'Công viên', difficulty: 'easy' },
          { word: 'Bãi biển', difficulty: 'easy' },
          { word: 'Bảo tàng', difficulty: 'medium' },
          { word: 'Ga tàu hỏa', difficulty: 'medium' },
          { word: 'Kim tự tháp Ai Cập', difficulty: 'hard' },
          { word: 'Tháp Eiffel', difficulty: 'hard' }
        ]
      },
      {
        id: 'nghe_nghiep', name: 'Nghề nghiệp', icon: '💼',
        words: [
          { word: 'Bác sĩ', difficulty: 'easy' },
          { word: 'Giáo viên', difficulty: 'easy' },
          { word: 'Công an', difficulty: 'easy' },
          { word: 'Đầu bếp', difficulty: 'easy' },
          { word: 'Ca sĩ', difficulty: 'easy' },
          { word: 'Lập trình viên', difficulty: 'medium' },
          { word: 'Phi công', difficulty: 'medium' },
          { word: 'Thám tử tư', difficulty: 'medium' },
          { word: 'Điệp viên ngầm', difficulty: 'hard' },
          { word: 'Phi hành gia', difficulty: 'hard' }
        ]
      }
    ];

    this.pairs = [
      { topic: 'do_an', difficulty: 'easy', wordA: 'Phở bò', wordB: 'Bún bò Huế' },
      { topic: 'do_an', difficulty: 'easy', wordA: 'Bánh mì', wordB: 'Bánh bao' },
      { topic: 'do_an', difficulty: 'easy', wordA: 'Pizza', wordB: 'Hamburger' },
      { topic: 'do_uong', difficulty: 'easy', wordA: 'Cà phê', wordB: 'Trà sữa' },
      { topic: 'do_uong', difficulty: 'easy', wordA: 'Nước cam', wordB: 'Nước chanh' },
      { topic: 'dong_vat', difficulty: 'easy', wordA: 'Con chó', wordB: 'Chó sói' },
      { topic: 'dong_vat', difficulty: 'easy', wordA: 'Con mèo', wordB: 'Con hổ' },
      { topic: 'dia_diem', difficulty: 'easy', wordA: 'Bãi biển', wordB: 'Hồ bơi' },
      { topic: 'nghe_nghiep', difficulty: 'easy', wordA: 'Bác sĩ', wordB: 'Y tá' }
    ];
  }

  getTopicsList() {
    const list = this.topics.map(t => ({ id: t.id, name: t.name, icon: t.icon, count: t.words.length }));
    // Bổ sung topic Tự tạo nếu có
    if (window.appStorage) {
      const customWords = window.appStorage.getCustomWords();
      if (customWords && customWords.length > 0) {
        list.push({ id: 'custom', name: 'Từ khóa tự tạo', icon: '⭐', count: customWords.length });
      }
    }
    return list;
  }

  /**
   * Lấy 1 từ khóa ngẫu nhiên theo chủ đề & độ khó cho Classic Mode
   */
  getRandomWord(topicId = 'all', difficulty = 'all') {
    let pool = [];

    // Tập hợp từ các chủ đề phù hợp
    if (topicId === 'custom' && window.appStorage) {
      pool = window.appStorage.getCustomWords();
    } else {
      let filteredTopics = this.topics;
      if (topicId !== 'all') {
        filteredTopics = this.topics.filter(t => t.id === topicId);
      }
      filteredTopics.forEach(t => {
        pool.push(...t.words);
      });
      // Nếu chọn all, thêm cả từ tự tạo vào pool
      if (topicId === 'all' && window.appStorage) {
        const customWords = window.appStorage.getCustomWords();
        if (customWords.length > 0) pool.push(...customWords);
      }
    }

    // Lọc theo độ khó nếu có chỉ định
    if (difficulty !== 'all') {
      const diffPool = pool.filter(w => w.difficulty === difficulty);
      if (diffPool.length > 0) pool = diffPool;
    }

    if (pool.length === 0) {
      return 'Bí mật';
    }

    // Ưu tiên các từ chưa xuất hiện gần đây
    const freshWords = pool.filter(w => !window.appStorage.isWordRecent(w.word));
    const targetPool = freshWords.length > 0 ? freshWords : pool;

    const randomIndex = Math.floor(Math.random() * targetPool.length);
    const chosen = targetPool[randomIndex].word;

    // Lưu lại vào danh sách gần đây
    window.appStorage.addRecentWord(chosen);
    return chosen;
  }

  /**
   * Lấy 1 cặp từ tương đồng cho Undercover Mode
   * wordA: Dành cho dân thường
   * wordB: Dành cho Gián điệp
   */
  getRandomPair(topicId = 'all', difficulty = 'all') {
    let pool = [...this.pairs];

    // Bổ sung các cặp tự tạo
    if (window.appStorage) {
      const customPairs = window.appStorage.getCustomPairs();
      if (customPairs.length > 0) {
        if (topicId === 'custom') {
          pool = [...customPairs];
        } else if (topicId === 'all') {
          pool.push(...customPairs);
        }
      }
    }

    if (topicId !== 'all' && topicId !== 'custom') {
      const topicFiltered = pool.filter(p => p.topic === topicId);
      if (topicFiltered.length > 0) pool = topicFiltered;
    }

    if (difficulty !== 'all') {
      const diffFiltered = pool.filter(p => p.difficulty === difficulty);
      if (diffFiltered.length > 0) pool = diffFiltered;
    }

    if (pool.length === 0) {
      return { wordA: 'Cà phê', wordB: 'Trà sữa' };
    }

    // Ưu tiên cặp chưa chơi gần đây
    const freshPairs = pool.filter(p => !window.appStorage.isWordRecent(p.wordA) && !window.appStorage.isWordRecent(p.wordB));
    const targetPool = freshPairs.length > 0 ? freshPairs : pool;

    const chosen = targetPool[Math.floor(Math.random() * targetPool.length)];

    window.appStorage.addRecentWord(chosen.wordA);
    window.appStorage.addRecentWord(chosen.wordB);

    // Xáo trộn ngẫu nhiên phe nào nhận từ nào
    const swap = Math.random() > 0.5;
    return {
      civilianWord: swap ? chosen.wordB : chosen.wordA,
      spyWord: swap ? chosen.wordA : chosen.wordB
    };
  }
}

// Khởi tạo instance dùng chung
window.appWordBank = new WordBank();

