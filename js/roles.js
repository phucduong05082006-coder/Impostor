/**
 * SPY PARTY - Roles Engine
 * Định nghĩa vai trò, thẩm định cấu hình và phân bổ ngẫu nhiên
 */

const ROLES = {
  CIVILIAN: {
    id: 'civilian',
    name: 'Dân Thường',
    team: 'civilian',
    color: '#06b6d4',      // Neon Aqua
    bgGradient: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(14,165,233,0.05) 100%)',
    borderColor: '#06b6d4',
    icon: '🛡️',
    title: 'PHE DÂN THƯỜNG',
    description: 'Bạn nắm giữ từ khóa bí mật cùng các dân thường khác. Hãy đưa ra gợi ý khéo léo để nhận diện đồng đội và loại trừ gián điệp, tuyệt đối không được nói trực tiếp từ khóa!'
  },
  SPY: {
    id: 'spy',
    name: 'Gián Điệp',
    team: 'spy',
    color: '#ef4444',      // Neon Crimson Red
    bgGradient: 'linear-gradient(135deg, rgba(239,68,68,0.25) 0%, rgba(185,28,28,0.08) 100%)',
    borderColor: '#ef4444',
    icon: '🕵️',
    title: 'PHE GIÁN ĐIỆP',
    description: 'Nhiệm vụ tối mật: Đóng vai dân thường, dựa vào gợi ý của người khác để suy luận từ khóa và tung hỏa mù. Sống sót đến khi số gián điệp bằng hoặc vượt dân thường!'
  },
  MR_WHITE: {
    id: 'mr_white',
    name: 'Mr. White',
    team: 'neutral',
    color: '#f8fafc',      // Platinum White
    bgGradient: 'linear-gradient(135deg, rgba(248,250,252,0.25) 0%, rgba(148,163,184,0.08) 100%)',
    borderColor: '#f8fafc',
    icon: '👤',
    title: 'BÓNG MA MR. WHITE',
    description: 'Bạn hoàn toàn KHÔNG CÓ từ khóa! Hãy hòa nhập không chút sơ hở. Nếu bị cả nhóm vote loại, bạn sẽ có cơ hội đoán từ khóa của dân thường: Đoán đúng sẽ THẮNG NGAY LẬP TỨC!'
  }
};

class RoleManager {
  /**
   * Cấu hình mặc định theo số lượng người chơi (3 - 7 người)
   */
  getDefaultConfig(playerCount) {
    const configs = {
      3: { civilian: 2, spy: 1, mrWhite: 0 },
      4: { civilian: 3, spy: 1, mrWhite: 0 },
      5: { civilian: 4, spy: 1, mrWhite: 0 },
      6: { civilian: 4, spy: 1, mrWhite: 1 },
      7: { civilian: 5, spy: 1, mrWhite: 1 }
    };
    return configs[playerCount] || { civilian: playerCount - 1, spy: 1, mrWhite: 0 };
  }

  /**
   * Thẩm định cấu hình vai trò
   * Trả về { isValid: boolean, error: string|null }
   */
  validateConfig(playerCount, { civilian, spy, mrWhite = 0 }) {
    if (playerCount < 3 || playerCount > 7) {
      return { isValid: false, error: 'Số lượng người chơi phải từ 3 đến 7 người.' };
    }
    if (civilian < 1) {
      return { isValid: false, error: 'Phải có ít nhất 1 Dân thường.' };
    }
    if (spy < 1) {
      return { isValid: false, error: 'Phải có ít nhất 1 Gián điệp.' };
    }
    if (mrWhite < 0) {
      return { isValid: false, error: 'Số lượng Mr. White không được âm.' };
    }
    const total = civilian + spy + mrWhite;
    if (total !== playerCount) {
      return { isValid: false, error: `Tổng số vai trò (${total}) không khớp với số người chơi (${playerCount}).` };
    }
    if (spy >= civilian) {
      return { isValid: false, error: 'Số lượng Dân thường ban đầu phải nhiều hơn Gián điệp.' };
    }
    return { isValid: true, error: null };
  }

  /**
   * Tạo danh sách vai trò và xáo trộn ngẫu nhiên bằng thuật toán Fisher-Yates
   */
  generateShuffledRoles(config) {
    const roleList = [];
    for (let i = 0; i < config.civilian; i++) roleList.push(ROLES.CIVILIAN.id);
    for (let i = 0; i < config.spy; i++) roleList.push(ROLES.SPY.id);
    for (let i = 0; i < config.mrWhite; i++) roleList.push(ROLES.MR_WHITE.id);

    // Fisher-Yates shuffle
    for (let i = roleList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roleList[i], roleList[j]] = [roleList[j], roleList[i]];
    }

    return roleList;
  }

  /**
   * Phân chia vai trò & từ khóa cho danh sách người chơi
   */
  assignRolesToPlayers(players, roleList, { mode, civilianWord, spyWord }) {
    return players.map((player, index) => {
      const roleId = roleList[index];
      const roleDef = ROLES[roleId.toUpperCase()] || ROLES.CIVILIAN;

      let secretWord = null;
      let wordLabel = '';

      if (roleId === ROLES.CIVILIAN.id) {
        secretWord = civilianWord;
        wordLabel = 'Từ khóa bí mật';
      } else if (roleId === ROLES.SPY.id) {
        if (mode === 'undercover') {
          secretWord = spyWord;
          wordLabel = 'Từ khóa bí mật của bạn';
        } else {
          // Classic Mode: Gián điệp không biết từ khóa
          secretWord = null;
          wordLabel = 'Không có từ khóa (Bạn là Gián Điệp!)';
        }
      } else if (roleId === ROLES.MR_WHITE.id) {
        secretWord = null;
        wordLabel = 'Không có từ khóa (Bạn là Mr. White!)';
      }

      return {
        ...player,
        role: roleId,
        roleDetails: roleDef,
        secretWord,
        wordLabel,
        isAlive: true,
        hasViewedRole: false,
        hasGivenClue: false,
        votedForId: null
      };
    });
  }
}

// Khởi tạo instance dùng chung
window.appRoleManager = new RoleManager();

