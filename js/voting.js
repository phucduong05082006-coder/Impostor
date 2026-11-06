/**
 * SPY PARTY - Voting Engine
 * Xử lý bỏ phiếu kín luân phiên, tùy chọn không vote ai (phiếu trắng),
 * kiểm phiếu, xử lý hòa phiếu và loại người chơi.
 */

class VotingManager {
  constructor() {
    this.voters = [];         // Danh sách người chơi còn sống sẽ bỏ phiếu
    this.currentVoterIndex = 0;
    this.votes = {};          // { [voterId]: targetId } ('skip' nếu bỏ phiếu trắng)
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
   * @param {string} voterId
   * @param {string} targetId - ID người chơi hoặc 'skip' (phiếu trắng / không loại ai)
   */
  submitVote(voterId, targetId) {
    if (!voterId || !targetId) {
      return { success: false, error: 'Vui lòng chọn một mục để bỏ phiếu!' };
    }

    if (targetId !== 'skip' && voterId === targetId) {
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

    // Luôn có mục Phiếu trắng / Không loại ai
    tallyMap['skip'] = 0;

    Object.entries(this.votes).forEach(([voterId, targetId]) => {
      if (tallyMap[targetId] !== undefined) {
        tallyMap[targetId]++;
      } else {
        tallyMap[targetId] = 1;
      }

      const voter = allPlayers.find(p => p.id === voterId);
      let target = null;
      if (targetId === 'skip') {
        target = { id: 'skip', name: 'Không loại ai (Phiếu trắng)', avatar: '🕊️' };
      } else {
        target = allPlayers.find(p => p.id === targetId);
      }

      if (voter && target) {
        voteDetails.push({ voter, target });
      }
    });

    const skipVotes = tallyMap['skip'] || 0;

    // Tìm số phiếu cao nhất trong số các người chơi cụ thể (không tính skip)
    let maxCandidateVotes = -1;
    candidates.forEach(c => {
      const v = tallyMap[c.id] || 0;
      if (v > maxCandidateVotes) maxCandidateVotes = v;
    });

    // Tìm các ứng viên người chơi có số phiếu cao nhất
    const topCandidateIds = candidates
      .filter(c => (tallyMap[c.id] || 0) === maxCandidateVotes && maxCandidateVotes > 0)
      .map(c => c.id);
    const topCandidates = topCandidateIds.map(id => allPlayers.find(p => p.id === id)).filter(Boolean);

    // Trường hợp 1: Không loại ai (Skip) có số phiếu cao hơn tất cả mọi người chơi
    if (skipVotes > maxCandidateVotes) {
      return {
        maxVotes: skipVotes,
        skipVotes,
        tallyMap,
        voteDetails,
        topCandidates: [],
        isTie: false,
        noElimination: true,
        reason: 'Đa số người chơi đã bỏ phiếu KHÔNG LOẠI AI!',
        eliminatedCandidate: null
      };
    }

    // Trường hợp 2: Không loại ai hòa phiếu với ứng viên có phiếu cao nhất
    if (skipVotes > 0 && skipVotes === maxCandidateVotes) {
      return {
        maxVotes: skipVotes,
        skipVotes,
        tallyMap,
        voteDetails,
        topCandidates,
        isTie: true,
        tiedWithSkip: true,
        noElimination: false,
        reason: `Phiếu "Không loại ai" hòa với ${topCandidates.map(c => c.name).join(', ')} (${skipVotes} phiếu)!`,
        eliminatedCandidate: null
      };
    }

    // Trường hợp 3: Có hòa phiếu giữa 2 hoặc nhiều người chơi (và cao hơn skip)
    if (topCandidates.length > 1) {
      return {
        maxVotes: maxCandidateVotes,
        skipVotes,
        tallyMap,
        voteDetails,
        topCandidates,
        isTie: true,
        tiedWithSkip: false,
        noElimination: false,
        reason: `Hòa phiếu giữa ${topCandidates.map(c => c.name).join(', ')} (${maxCandidateVotes} phiếu)!`,
        eliminatedCandidate: null
      };
    }

    // Trường hợp 4: Có một người chơi duy nhất nhận số phiếu cao nhất (và cao hơn skip)
    if (topCandidates.length === 1 && maxCandidateVotes > 0) {
      return {
        maxVotes: maxCandidateVotes,
        skipVotes,
        tallyMap,
        voteDetails,
        topCandidates,
        isTie: false,
        noElimination: false,
        reason: `${topCandidates[0].name} nhận số phiếu cao nhất (${maxCandidateVotes} phiếu)!`,
        eliminatedCandidate: topCandidates[0]
      };
    }

    // Trường hợp 5: Không có phiếu nào được bỏ
    return {
      maxVotes: 0,
      skipVotes: 0,
      tallyMap,
      voteDetails,
      topCandidates: [],
      isTie: false,
      noElimination: true,
      reason: 'Không có phiếu bầu hợp lệ nào được đưa ra.',
      eliminatedCandidate: null
    };
  }
}

// Khởi tạo instance dùng chung
window.appVotingManager = new VotingManager();
