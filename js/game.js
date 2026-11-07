/**
 * SPY PARTY - Core Game Engine & State Machine
 * Quản lý vòng đời trận đấu, trạng thái các giai đoạn, đồng hồ đếm ngược
 */

const GAME_STATES = {
  IDLE: 'IDLE',
  SETUP_PLAYERS: 'SETUP_PLAYERS',
  SETUP_GAME: 'SETUP_GAME',
  ROLE_REVEAL: 'ROLE_REVEAL',
  CLUE_ROUND: 'CLUE_ROUND',
  DISCUSSION: 'DISCUSSION',
  VOTING: 'VOTING',
  VOTING_RESULT: 'VOTING_RESULT',
  RE_VOTING: 'RE_VOTING',
  MR_WHITE_GUESS: 'MR_WHITE_GUESS',
  ELIMINATION: 'ELIMINATION',
  GAME_OVER: 'GAME_OVER'
};

class GameEngine {
  constructor() {
    this.state = GAME_STATES.IDLE;
    this.mode = 'classic'; // 'classic' | 'undercover' | 'custom'
    this.topic = 'all';
    this.difficulty = 'all';

    this.roleConfig = { civilian: 3, spy: 1, mrWhite: 0 };
    this.players = [];
    this.currentRevealIndex = 0;

    this.roundNumber = 1;
    this.currentCluePlayerIndex = 0;
    this.clueOrder = [];

    this.civilianWord = '';
    this.spyWord = '';

    // Timer
    this.timerInterval = null;
    this.timerRemaining = 0;
    this.timerTotal = 0;
    this.onTimerTick = null;
    this.onTimerEnd = null;

    // Lưu trữ thông tin loại người tạm thời
    this.lastEliminatedPlayer = null;
    this.winner = null;
    this.gameSummary = null;
  }

  /**
   * Khởi tạo trận đấu mới từ danh sách người chơi và cấu hình
   */
  startNewGame({ mode, topic, difficulty, customRoles = null }) {
    this.mode = mode || 'classic';
    this.topic = topic || 'all';
    this.difficulty = difficulty || 'all';

    const rawPlayers = window.appPlayerManager.getPlayers();
    const playerCount = rawPlayers.length;

    // Xác định cấu hình vai trò
    if (this.mode === 'custom' && customRoles) {
      const validation = window.appRoleManager.validateConfig(playerCount, customRoles);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      this.roleConfig = { ...customRoles };
    } else {
      this.roleConfig = window.appRoleManager.getDefaultConfig(playerCount);
      // Chế độ Undercover mặc định tắt Mr. White hoặc cho phép nếu số lượng >= 6
      if (this.mode === 'undercover' && playerCount < 6) {
        this.roleConfig.mrWhite = 0;
        this.roleConfig.civilian = playerCount - this.roleConfig.spy;
      }
    }

    // Luôn chọn cặp từ tương đồng, liên quan chặt chẽ giữa Dân thường và Gián điệp
    const pair = window.appWordBank.getRandomPair(this.topic, this.difficulty);
    this.civilianWord = pair.civilianWord;
    this.spyWord = pair.spyWord;

    // Phân vai
    const roleList = window.appRoleManager.generateShuffledRoles(this.roleConfig);
    this.players = window.appRoleManager.assignRolesToPlayers(rawPlayers, roleList, {
      mode: this.mode,
      civilianWord: this.civilianWord,
      spyWord: this.spyWord
    });

    this.roundNumber = 1;
    this.currentRevealIndex = 0;
    this.lastEliminatedPlayer = null;
    this.winner = null;
    this.gameSummary = null;

    this.state = GAME_STATES.ROLE_REVEAL;
    return this.getState();
  }

  /**
   * Lấy thông tin người chơi hiện tại đang xem vai trò
   */
  getCurrentRevealPlayer() {
    if (this.currentRevealIndex < this.players.length) {
      return this.players[this.currentRevealIndex];
    }
    return null;
  }

  /**
   * Xác nhận người chơi đã ghi nhớ vai trò, chuyển người tiếp theo
   */
  confirmPlayerRoleRevealed() {
    if (this.currentRevealIndex < this.players.length) {
      this.players[this.currentRevealIndex].hasViewedRole = true;
      this.currentRevealIndex++;
    }

    if (this.currentRevealIndex >= this.players.length) {
      // Đã xem hết, bắt đầu vòng gợi ý đầu tiên
      this.initClueRound();
      return { isAllRevealed: true };
    }

    return {
      isAllRevealed: false,
      nextPlayer: this.getCurrentRevealPlayer()
    };
  }

  /**
   * Khởi động vòng gợi ý
   */
  initClueRound() {
    this.stopTimer();
    this.state = GAME_STATES.CLUE_ROUND;

    // Lấy những người còn sống
    const alive = this.players.filter(p => p.isAlive);
    // Xáo trộn hoặc giữ thứ tự người gợi ý
    this.clueOrder = [...alive];
    // Reset cờ đã gợi ý
    this.players.forEach(p => { p.hasGivenClue = false; });
    this.currentCluePlayerIndex = 0;

    this.startClueTimer();
  }

  getCurrentCluePlayer() {
    if (this.currentCluePlayerIndex < this.clueOrder.length) {
      return this.clueOrder[this.currentCluePlayerIndex];
    }
    return null;
  }

  /**
   * Chuyển lượt gợi ý tiếp theo
   */
  nextClueTurn() {
    this.stopTimer();
    const current = this.getCurrentCluePlayer();
    if (current) {
      current.hasGivenClue = true;
    }

    this.currentCluePlayerIndex++;

    if (this.currentCluePlayerIndex >= this.clueOrder.length) {
      // Tất cả đã gợi ý xong, chuyển sang thảo luận
      this.initDiscussion();
      return { isRoundCluesDone: true };
    }

    this.startClueTimer();
    return {
      isRoundCluesDone: false,
      nextPlayer: this.getCurrentCluePlayer()
    };
  }

  /**
   * Bắt đầu giai đoạn thảo luận tự do
   */
  initDiscussion() {
    this.stopTimer();
    this.state = GAME_STATES.DISCUSSION;

    const settings = window.appStorage.getSettings();
    const duration = settings.discussionTime || 90;
    this.startCountdown(duration, () => {
      // Hết giờ thảo luận, tự động nhắc chuyển sang bỏ phiếu
      if (this.onDiscussionTimeOut) {
        this.onDiscussionTimeOut();
      }
    });
  }

  /**
   * Chuyển sang giai đoạn bỏ phiếu
   */
  initVoting(tiedCandidates = null) {
    this.stopTimer();
    this.state = tiedCandidates ? GAME_STATES.RE_VOTING : GAME_STATES.VOTING;

    const alivePlayers = this.players.filter(p => p.isAlive);
    window.appVotingManager.startVotingSession(alivePlayers, tiedCandidates);
  }

  /**
   * Xử lý kết quả bỏ phiếu sau khi mọi người đã vote xong
   */
  processVotingResults() {
    this.state = GAME_STATES.VOTING_RESULT;
    const result = window.appVotingManager.tallyResults(this.players);
    return result;
  }

  /**
   * Tiến hành loại người chơi có số phiếu cao nhất
   */
  eliminatePlayer(player) {
    if (!player) return null;
    player.isAlive = false;
    this.lastEliminatedPlayer = player;
    this.state = GAME_STATES.ELIMINATION;

    // Nếu người bị loại là Mr. White, chuyển đến trạng thái đoán từ
    if (player.role === ROLES.MR_WHITE.id) {
      this.state = GAME_STATES.MR_WHITE_GUESS;
      return { isMrWhite: true, player };
    }

    // Kiểm tra điều kiện thắng thông thường
    const winCheck = window.appScoringManager.evaluateWinCondition(this.players);
    if (winCheck.isGameOver) {
      this.finishGame(winCheck.winner);
      return { isGameOver: true, winResult: winCheck, player };
    }

    return { isGameOver: false, player };
  }

  /**
   * Xử lý kết quả đoán từ khóa của Mr. White
   */
  handleMrWhiteGuess(isCorrect) {
    if (isCorrect) {
      // Mr. White thắng ngay lập tức!
      this.finishGame('mr_white');
      return {
        isGameOver: true,
        winner: 'mr_white',
        winnerTitle: 'MR. WHITE CHIẾN THẮNG TUYỆT ĐỐI! 👤',
        reason: `${this.lastEliminatedPlayer.name} (Mr. White) đã đoán chính xác từ khóa của dân thường: "${this.civilianWord}"!`
      };
    } else {
      // Mr. White đoán sai và chính thức bị loại
      const winCheck = window.appScoringManager.evaluateWinCondition(this.players);
      if (winCheck.isGameOver) {
        this.finishGame(winCheck.winner);
        return { isGameOver: true, winResult: winCheck };
      }
      return { isGameOver: false, reason: 'Mr. White đã đoán sai từ khóa và bị loại!' };
    }
  }

  /**
   * Bắt đầu vòng chơi mới (khi chưa có phe nào thắng)
   */
  startNextRound() {
    this.roundNumber++;
    this.initClueRound();
  }

  /**
   * Kết thúc trận đấu và ghi nhận kết quả
   */
  finishGame(winner) {
    this.stopTimer();
    this.state = GAME_STATES.GAME_OVER;
    this.winner = winner;

    this.gameSummary = window.appScoringManager.generateGameSummary({
      players: this.players,
      winner,
      rounds: this.roundNumber,
      civilianWord: this.civilianWord,
      spyWord: this.spyWord,
      mode: this.mode
    });

    // Lưu thống kê vào LocalStorage
    window.appStorage.recordGameResult({
      winner,
      rolesPlayed: this.players.map(p => p.role),
      rounds: this.roundNumber,
      eliminatedCount: this.players.filter(p => !p.isAlive).length,
      wordA: this.civilianWord,
      wordB: this.spyWord,
      mode: this.mode
    });

    return this.gameSummary;
  }

  // --- Hỗ trợ Timer ---
  startClueTimer() {
    const settings = window.appStorage.getSettings();
    const duration = settings.clueTime || 45;
    this.startCountdown(duration, () => {
      // Hết giờ gợi ý, tự động qua lượt
      if (this.onClueTimeOut) {
        this.onClueTimeOut();
      }
    });
  }

  startCountdown(seconds, onEnd) {
    this.stopTimer();
    this.timerTotal = seconds;
    this.timerRemaining = seconds;
    this.onTimerEnd = onEnd;

    if (this.onTimerTick) {
      this.onTimerTick(this.timerRemaining, this.timerTotal);
    }

    this.timerInterval = setInterval(() => {
      this.timerRemaining--;
      if (this.timerRemaining <= 0) {
        this.stopTimer();
        window.appAudio.playTimerEnd();
        if (this.onTimerEnd) this.onTimerEnd();
      } else {
        const isUrgent = this.timerRemaining <= 5;
        window.appAudio.playTick(isUrgent);
      }

      if (this.onTimerTick) {
        this.onTimerTick(this.timerRemaining, this.timerTotal);
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getState() {
    return {
      state: this.state,
      mode: this.mode,
      round: this.roundNumber,
      players: this.players,
      aliveCount: this.players.filter(p => p.isAlive).length,
      winner: this.winner
    };
  }
}

// Khởi tạo instance dùng chung
window.appGameEngine = new GameEngine();

