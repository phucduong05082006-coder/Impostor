/**
 * SPY PARTY - Voting Engine
 * Xử lý bỏ phiếu kín luân phiên, kiểm phiếu, xử lý hòa phiếu và loại người chơi
 */

class VotingManager {
  constructor() {
    this.voters = [];         // Danh sách người chơi còn sống sẽ bỏ phiếu
    this.currentVoterIndex = 0;
    this.votes = {};          // { [voterId]: targetId }
    this.isReVote = false;    // Có phải vòng bỏ phiếu lại khi hòa hay không
    this.tiedCandidates = []; // Danh sách ứng viên bị hòa phiếu
  }

  /**
   * Bắt đầu một phiên bỏ phiếu mới
   * @param {Array} alivePlayers - Danh sách người chơi còn sống
   * @param {Array|null} tiedCandidates - Nếu là bỏ phiếu lại, chỉ được vote cho những người này
   */
  startVotingSession(alivePlayers, tiedCandidates = null) {
    this.voters = [...alivePlayers];
    this.currentVoterIndex = 0;
    this.votes = {};
    this.tiedCandidates = tiedCandidates || [];
    this.isReVote = Array.isArray(tiedCandidates) && tiedCandidates.length > 0;
  }

  getCurrentVoter() {
    if (this.currentVoterIndex < this.voters.length) {
      return this.voters[this.currentVoterIndex];
    }
    return null;
  }

  getProgress() {
    return {
      current: this.currentVoterIndex + 1,
      total: this.voters.length,
      isFinished: this.currentVoterIndex >= this.voters.length
    };
  }

  /**
   * Lấy danh sách những người có thể bị vote
   * @param {string} voterId - ID của người đang bỏ phiếu
   */
  getCandidates(voterId) {
    let pool = this.voters;
    if (this.isReVote && this.tiedCandidates.length > 0) {
      pool = this.tiedCandidates;
    }
    // Không được tự bỏ phiếu cho chính mình
    return pool.filter(p => p.id !== voterId);
  }

  /**
   * Đăng ký phiếu bầu của cử tri hiện tại
   */
  submitVote(voterId, targetId) {
    if (!voterId || !targetId || voterId === targetId) {
      return { success: false, error: 'Không thể tự bỏ phiếu cho chính mình!' };
    }

    this.votes[voterId] = targetId;
    this.currentVoterIndex++;

    const isComplete = this.currentVoterIndex >= this.voters.length;
    return {
      success: true,
      isComplete,
      nextVoter: isComplete ? null : this.getCurrentVoter()
    };
  }

  /**
   * Tổng hợp và phân tích kết quả bỏ phiếu
   */
  tallyResults(allPlayers) {
    const tallyMap = {}; // targetId -> count
    const voteDetails = []; // [{ voter, target }]

    // Khởi tạo điểm cho các ứng viên
    const candidates = this.isReVote ? this.tiedCandidates : this.voters;
    candidates.forEach(c => {
      tallyMap[c.id] = 0;
    });

    Object.entries(this.votes).forEach(([voterId, targetId]) => {
      if (tallyMap[targetId] !== undefined) {
        tallyMap[targetId]++;
      } else {
        tallyMap[targetId] = 1;
      }

      const voter = allPlayers.find(p => p.id === voterId);
      const target = allPlayers.find(p => p.id === targetId);
      if (voter && target) {
        voteDetails.push({ voter, target });
      }
    });

    // Tìm số phiếu cao nhất
    let maxVotes = -1;
    Object.values(tallyMap).forEach(v => {
      if (v > maxVotes) maxVotes = v;
    });

    // Tìm những người có số phiếu cao nhất
    const topIds = Object.keys(tallyMap).filter(id => tallyMap[id] === maxVotes && maxVotes > 0);
    const topCandidates = topIds.map(id => allPlayers.find(p => p.id === id)).filter(Boolean);

    const isTie = topCandidates.length > 1;

    return {
      maxVotes,
      tallyMap,
      voteDetails,
      topCandidates,
      isTie,
      eliminatedCandidate: (!isTie && topCandidates.length === 1) ? topCandidates[0] : null
    };
  }
}

// Khởi tạo instance dùng chung
window.appVotingManager = new VotingManager();

