/**
 * SPY PARTY - Player Engine
 * Quản lý danh sách người chơi, avatar, tạo tên ngẫu nhiên
 */

class PlayerManager {
  constructor() {
    this.avatars = [
      '🕵️‍♂️', '🕵️‍♀️', '🕶️', '🎩', '🐺', '🦊', '🦅', '🦉',
      '🐯', '🦁', '🐱', '🎭', '⚡', '🔥', '🔮', '🎲'
    ];

    this.defaultCodeNames = [
      'Bóng Ma', 'Điệp Viên X', 'Cú Đêm', 'Sói Xám', 'Chim Ưng',
      'Hắc Báo', 'Thần Mã', 'Mật Vụ', 'Tia Chớp', 'Hỏa Long',
      'Kẻ Giấu Mặt', 'Mật Mã 007', 'Mắt Thần', 'Kỵ Sĩ', 'Tắc Kè'
    ];

    this.players = [];
    this.loadInitialPlayers();
  }

  loadInitialPlayers() {
    if (window.appStorage) {
      const recent = window.appStorage.getItem('spy_party_recent_players');
      if (recent && Array.isArray(recent) && recent.length >= 3 && recent.length <= 7) {
        this.players = recent.map((p, idx) => ({
          id: 'p_' + Date.now() + '_' + idx,
          name: p.name || `Người chơi ${idx + 1}`,
          avatar: p.avatar || this.avatars[idx % this.avatars.length]
        }));
        return;
      }
    }

    // Mặc định 4 người chơi ban đầu
    this.players = [
      { id: 'p_1', name: 'Điệp Viên X', avatar: '🕵️‍♂️' },
      { id: 'p_2', name: 'Cú Đêm', avatar: '🦉' },
      { id: 'p_3', name: 'Sói Xám', avatar: '🐺' },
      { id: 'p_4', name: 'Bóng Ma', avatar: '🕶️' }
    ];
  }

  getPlayers() {
    return this.players;
  }

  getCount() {
    return this.players.length;
  }

  canAdd() {
    return this.players.length < 7;
  }

  canRemove() {
    return this.players.length > 3;
  }

  addPlayer(customName = null, customAvatar = null) {
    if (!this.canAdd()) return null;

    const usedNames = this.players.map(p => p.name.toLowerCase());
    const availableNames = this.defaultCodeNames.filter(name => !usedNames.includes(name.toLowerCase()));
    const name = customName || (availableNames.length > 0
      ? availableNames[Math.floor(Math.random() * availableNames.length)]
      : `Đặc vụ ${this.players.length + 1}`);

    const usedAvatars = this.players.map(p => p.avatar);
    const availableAvatars = this.avatars.filter(a => !usedAvatars.includes(a));
    const avatar = customAvatar || (availableAvatars.length > 0
      ? availableAvatars[0]
      : this.avatars[this.players.length % this.avatars.length]);

    const newPlayer = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      avatar
    };

    this.players.push(newPlayer);
    this.saveRecentPlayers();
    return newPlayer;
  }

  removePlayer(id) {
    if (!this.canRemove()) return false;
    this.players = this.players.filter(p => p.id !== id);
    this.saveRecentPlayers();
    return true;
  }

  updatePlayer(id, { name, avatar }) {
    const player = this.players.find(p => p.id === id);
    if (!player) return false;

    if (name !== undefined && name.trim()) {
      player.name = name.trim();
    }
    if (avatar !== undefined) {
      player.avatar = avatar;
    }

    this.saveRecentPlayers();
    return true;
  }

  generateRandomName(id) {
    const player = this.players.find(p => p.id === id);
    if (!player) return null;

    const otherNames = this.players.filter(p => p.id !== id).map(p => p.name.toLowerCase());
    const available = this.defaultCodeNames.filter(n => !otherNames.includes(n.toLowerCase()));

    const newName = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : 'Điệp viên ' + Math.floor(Math.random() * 900 + 100);

    player.name = newName;
    this.saveRecentPlayers();
    return newName;
  }

  changeRandomAvatar(id) {
    const player = this.players.find(p => p.id === id);
    if (!player) return null;

    const otherAvatars = this.players.filter(p => p.id !== id).map(p => p.avatar);
    const available = this.avatars.filter(a => !otherAvatars.includes(a));

    const newAvatar = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : this.avatars[Math.floor(Math.random() * this.avatars.length)];

    player.avatar = newAvatar;
    this.saveRecentPlayers();
    return newAvatar;
  }

  saveRecentPlayers() {
    if (window.appStorage) {
      window.appStorage.setItem('spy_party_recent_players', this.players.map(p => ({
        name: p.name,
        avatar: p.avatar
      })));
    }
  }

  validate() {
    if (this.players.length < 3) return { isValid: false, error: 'Cần tối thiểu 3 người chơi!' };
    if (this.players.length > 7) return { isValid: false, error: 'Tối đa chỉ hỗ trợ 7 người chơi!' };

    // Kiểm tra tên rỗng hoặc trùng nhau
    const names = [];
    for (let p of this.players) {
      const clean = p.name.trim();
      if (!clean) return { isValid: false, error: 'Tên người chơi không được để trống!' };
      if (names.includes(clean.toLowerCase())) {
        return { isValid: false, error: `Tên "${clean}" bị trùng lặp. Vui lòng đặt tên khác nhau!` };
      }
      names.push(clean.toLowerCase());
    }

    return { isValid: true, error: null };
  }
}

// Khởi tạo instance dùng chung
window.appPlayerManager = new PlayerManager();

