/**
 * SPY PARTY - Scoring & Win Condition Engine
 * Thẩm định điều kiện thắng, xử lý Mr. White đoán từ và cập nhật thống kê
 */

class ScoringManager {
  /**
   * Chuẩn hóa chuỗi tiếng Việt để so sánh từ khóa thông minh
   * (bỏ dấu, chuyển chữ thường, loại bỏ khoảng trắng dư thừa)
   */
  normalizeVietnamese(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Kiểm tra phán đoán từ khóa của Mr. White
   * Hỗ trợ so sánh chuẩn hóa và phát hiện từ khóa nằm trong cụm
   */
  checkMrWhiteGuess(guessText, targetKeyword) {
    if (!guessText || !targetKeyword) return false;
    const cleanGuess = this.normalizeVietnamese(guessText);
    const cleanTarget = this.normalizeVietnamese(targetKeyword);

    if (cleanGuess === cleanTarget) return true;

    // Cho phép đoán trúng cụm từ khóa chính (ví dụ từ khóa "Phở bò", đoán "Phở bò" hoặc "Phở")
    const targetWords = cleanTarget.split(' ');
    if (targetWords.length > 1 && cleanGuess === cleanTarget) return true;

    return false;
  }

  /**
   * Đánh giá điều kiện thắng sau mỗi lượt hoặc sự kiện loại người
   * @param {Array} players - Danh sách tất cả người chơi kèm trạng thái isAlive và role
   * @returns {Object} { isGameOver: boolean, winner: string|null, reason: string }
   */
  evaluateWinCondition(players) {
    const alivePlayers = players.filter(p => p.isAlive);
    const aliveCivilians = alivePlayers.filter(p => p.role === ROLES.CIVILIAN.id);
    const aliveSpies = alivePlayers.filter(p => p.role === ROLES.SPY.id);
    const aliveMrWhites = alivePlayers.filter(p => p.role === ROLES.MR_WHITE.id);

    // 1. Kiểm tra phe Dân thường thắng: Toàn bộ Gián điệp đã bị loại
    if (aliveSpies.length === 0) {
      return {
        isGameOver: true,
        winner: 'civilian',
        winnerTitle: 'PHE DÂN THƯỜNG CHIẾN THẮNG! 🛡️',
        reason: 'Toàn bộ Gián điệp đã bị lật tẩy và loại khỏi cuộc chơi!'
      };
    }

    // 2. Kiểm tra phe Gián điệp thắng: Số Gián điệp >= Số Dân thường còn sống
    // (Lưu ý luật: Không tính Mr. White vào so sánh này)
    if (aliveSpies.length >= aliveCivilians.length) {
      return {
        isGameOver: true,
        winner: 'spy',
        winnerTitle: 'PHE GIÁN ĐIỆP CHIẾN THẮNG! 🕵️',
        reason: `Số Gián điệp (${aliveSpies.length}) đã bằng hoặc áp đảo số Dân thường (${aliveCivilians.length})!`
      };
    }

    // Trận đấu vẫn chưa ngã ngũ
    return {
      isGameOver: false,
      winner: null,
      winnerTitle: '',
      reason: ''
    };
  }

  /**
   * Tạo báo cáo tổng kết chi tiết cho Result Screen
   */
  generateGameSummary(gameState) {
    const { players, winner, rounds, civilianWord, spyWord, mode } = gameState;
    const eliminated = players.filter(p => !p.isAlive);

    return {
      winner,
      mode,
      rounds,
      totalPlayers: players.length,
      eliminatedCount: eliminated.length,
      civilianWord,
      spyWord: mode === 'undercover' ? spyWord : null,
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        role: p.role,
        roleName: p.roleDetails.name,
        roleColor: p.roleDetails.color,
        isAlive: p.isAlive,
        isWinner: (winner === 'civilian' && p.role === 'civilian') ||
                  (winner === 'spy' && p.role === 'spy') ||
                  (winner === 'mr_white' && p.role === 'mr_white')
      }))
    };
  }
}

// Khởi tạo instance dùng chung
window.appScoringManager = new ScoringManager();

