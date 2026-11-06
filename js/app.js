/**
 * SPY PARTY - Main Application Controller
 * Điều phối toàn bộ sự kiện giao diện, chuyển màn hình, tương tác âm thanh & logic
 */

class AppController {
  constructor() {
    this.currentScreen = 'home';
    this.selectedAvatarPlayerId = null;
    this.selectedVoteTargetId = null;
    this.gameConfig = {
      mode: 'classic',
      topic: 'all',
      difficulty: 'all',
      customRoles: { civilian: 3, spy: 1, mrWhite: 0 }
    };

    this.init();
  }

  init() {
    this.bindNavigationEvents();
    this.bindHomeEvents();
    this.bindPlayerSetupEvents();
    this.bindGameSetupEvents();
    this.bindRevealEvents();
    this.bindClueAndDiscussionEvents();
    this.bindVotingEvents();
    this.bindEliminationAndResultEvents();
    this.bindSettingsAndHistoryEvents();

    // Đồng bộ Timer từ GameEngine
    window.appGameEngine.onTimerTick = (remaining, total) => this.handleTimerTick(remaining, total);
    window.appGameEngine.onClueTimeOut = () => {
      this.showToast('⏰ Hết giờ gợi ý! Chuyển lượt tiếp theo.', 'info');
      this.handleClueTurnDone();
    };
    window.appGameEngine.onDiscussionTimeOut = () => {
      this.showToast('⏰ Hết giờ thảo luận! Bắt đầu bỏ phiếu.', 'info');
      this.startVotingPhase();
    };

    // Khởi tạo các danh sách ban đầu
    this.renderPlayersList();
    this.updateTopicOptions();
  }

  // --- Hỗ trợ Toast thông báo ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3200);
  }

  // --- Chuyển đổi màn hình ---
  switchScreen(screenId) {
    window.appAudio.playClick();
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
      this.currentScreen = screenId;
      target.scrollTop = 0;
    }
  }

  // --- 1. Sự kiện Điều Hướng ---
  bindNavigationEvents() {
    document.querySelectorAll('.btn-nav-back').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const to = e.currentTarget.getAttribute('data-to');
        if (to) this.switchScreen(to);
      });
    });

    // Đóng Modal khi bấm vào nút close hoặc vùng ngoài
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        window.appAudio.playClick();
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
  }

  // --- 2. Sự kiện Home Screen ---
  bindHomeEvents() {
    const quickBgmBtn = document.getElementById('btn-quick-bgm');
    if (quickBgmBtn) {
      this.updateQuickBgmBtn();
      quickBgmBtn.addEventListener('click', () => {
        const nextState = !window.appAudio.bgmEnabled;
        window.appAudio.toggleBGM(nextState);
        const settings = window.appStorage.getSettings() || {};
        settings.bgmEnabled = nextState;
        window.appStorage.saveSettings(settings);
        this.updateQuickBgmBtn();
        this.showToast(nextState ? '🎵 Đã bật nhạc nền huyền bí' : '🔇 Đã tắt nhạc nền', 'info');
      });
    }

    document.getElementById('btn-home-start').addEventListener('click', () => {
      this.renderPlayersList();
      this.switchScreen('players');
    });

    document.getElementById('btn-home-rules').addEventListener('click', () => {
      window.appAudio.playClick();
      document.getElementById('modal-rules').classList.add('active');
    });

    document.getElementById('btn-home-settings').addEventListener('click', () => {
      window.appAudio.playClick();
      this.loadSettingsModal();
      document.getElementById('modal-settings').classList.add('active');
    });

    document.getElementById('btn-home-history').addEventListener('click', () => {
      window.appAudio.playClick();
      this.loadHistoryModal();
      document.getElementById('modal-history').classList.add('active');
    });
  }

  updateQuickBgmBtn() {
    const btn = document.getElementById('btn-quick-bgm');
    if (btn) {
      if (window.appAudio.bgmEnabled && !window.appAudio.isMuted) {
        btn.innerHTML = '🎵';
        btn.title = 'Nhạc nền: Đang BẬT (Chạm để tắt)';
        btn.style.borderColor = 'var(--primary)';
        btn.style.boxShadow = '0 0 10px var(--primary-glow)';
      } else {
        btn.innerHTML = '🔇';
        btn.title = 'Nhạc nền: Đang TẮT (Chạm để bật)';
        btn.style.borderColor = 'var(--border-glass)';
        btn.style.boxShadow = 'none';
      }
    }
  }

  // --- 3. Sự kiện Player Setup ---
  bindPlayerSetupEvents() {
    document.getElementById('btn-add-player').addEventListener('click', () => {
      if (!window.appPlayerManager.canAdd()) {
        this.showToast('Tối đa chỉ hỗ trợ 7 người chơi!', 'warning');
        return;
      }
      window.appAudio.playClick();
      window.appPlayerManager.addPlayer();
      this.renderPlayersList();
    });

    document.getElementById('btn-players-continue').addEventListener('click', () => {
      const validation = window.appPlayerManager.validate();
      if (!validation.isValid) {
        this.showToast(validation.error, 'error');
        window.appAudio.playAlert();
        return;
      }
      this.syncGameSetupScreen();
      this.switchScreen('game-setup');
    });
  }

  renderPlayersList() {
    const listContainer = document.getElementById('players-list-container');
    const countBadge = document.getElementById('players-count-badge');
    const players = window.appPlayerManager.getPlayers();

    if (countBadge) countBadge.textContent = players.length;
    listContainer.innerHTML = '';

    players.forEach((p, idx) => {
      const item = document.createElement('div');
      item.className = 'player-item';
      item.innerHTML = `
        <div class="avatar avatar-sm btn-avatar-select" data-id="${p.id}" title="Đổi Avatar">${p.avatar}</div>
        <input type="text" class="player-name-input" data-id="${p.id}" value="${p.name}" maxlength="15" placeholder="Tên người chơi">
        <div class="player-actions">
          <button class="btn btn-outline btn-icon btn-dice-name" data-id="${p.id}" title="Tên ngẫu nhiên">🎲</button>
          ${window.appPlayerManager.canRemove() ? `<button class="btn btn-outline btn-icon btn-remove-player" data-id="${p.id}" title="Xóa" style="color: var(--color-spy);">✕</button>` : ''}
        </div>
      `;
      listContainer.appendChild(item);
    });

    // Gắn sự kiện cho các nút trong danh sách
    listContainer.querySelectorAll('.player-name-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        window.appPlayerManager.updatePlayer(id, { name: e.target.value });
      });
    });

    listContainer.querySelectorAll('.btn-dice-name').forEach(btn => {
      btn.addEventListener('click', (e) => {
        window.appAudio.playClick();
        const id = e.currentTarget.getAttribute('data-id');
        const newName = window.appPlayerManager.generateRandomName(id);
        const input = listContainer.querySelector(`.player-name-input[data-id="${id}"]`);
        if (input) input.value = newName;
      });
    });

    listContainer.querySelectorAll('.btn-avatar-select').forEach(el => {
      el.addEventListener('click', (e) => {
        window.appAudio.playClick();
        this.selectedAvatarPlayerId = e.currentTarget.getAttribute('data-id');
        this.openAvatarPickerModal();
      });
    });

    listContainer.querySelectorAll('.btn-remove-player').forEach(btn => {
      btn.addEventListener('click', (e) => {
        window.appAudio.playClick();
        const id = e.currentTarget.getAttribute('data-id');
        window.appPlayerManager.removePlayer(id);
        this.renderPlayersList();
      });
    });
  }

  openAvatarPickerModal() {
    const grid = document.getElementById('avatar-grid-picker');
    grid.innerHTML = '';
    window.appPlayerManager.avatars.forEach(av => {
      const btn = document.createElement('div');
      btn.className = 'avatar avatar-lg';
      btn.style.cursor = 'pointer';
      btn.textContent = av;
      btn.addEventListener('click', () => {
        window.appAudio.playClick();
        if (this.selectedAvatarPlayerId) {
          window.appPlayerManager.updatePlayer(this.selectedAvatarPlayerId, { avatar: av });
          this.renderPlayersList();
        }
        document.getElementById('modal-avatar-picker').classList.remove('active');
      });
      grid.appendChild(btn);
    });
    document.getElementById('modal-avatar-picker').classList.add('active');
  }

  // --- 4. Sự kiện Game Setup ---
  bindGameSetupEvents() {
    // Chuyển tab chế độ
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        window.appAudio.playClick();
        document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        this.gameConfig.mode = target.getAttribute('data-mode');
        this.syncRoleSteppers();
        this.updateSetupSummary();
      });
    });

    // Steppers vai trò
    document.querySelectorAll('.btn-stepper-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.getAttribute('data-role');
        this.gameConfig.customRoles[role]++;
        this.syncRoleSteppers();
        this.updateSetupSummary();
      });
    });

    document.querySelectorAll('.btn-stepper-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.getAttribute('data-role');
        if (this.gameConfig.customRoles[role] > 0) {
          this.gameConfig.customRoles[role]--;
          this.syncRoleSteppers();
          this.updateSetupSummary();
        }
      });
    });

    document.getElementById('select-topic').addEventListener('change', (e) => {
      this.gameConfig.topic = e.target.value;
      this.updateSetupSummary();
    });

    document.getElementById('select-difficulty').addEventListener('change', (e) => {
      this.gameConfig.difficulty = e.target.value;
      this.updateSetupSummary();
    });

    // Bắt đầu trận đấu
    document.getElementById('btn-start-game-match').addEventListener('click', () => {
      try {
        window.appGameEngine.startNewGame({
          mode: this.gameConfig.mode,
          topic: this.gameConfig.topic,
          difficulty: this.gameConfig.difficulty,
          customRoles: this.gameConfig.customRoles
        });
        this.showToast('🚀 Trận đấu đã khởi tạo! Chuẩn bị xem vai trò.', 'success');
        this.startRoleRevealPhase();
      } catch (err) {
        this.showToast(err.message, 'error');
        window.appAudio.playAlert();
      }
    });
  }

  syncGameSetupScreen() {
    const playerCount = window.appPlayerManager.getCount();
    const defaultConfig = window.appRoleManager.getDefaultConfig(playerCount);
    this.gameConfig.customRoles = { ...defaultConfig };

    this.updateTopicOptions();
    this.syncRoleSteppers();
    this.updateSetupSummary();
  }

  updateTopicOptions() {
    const select = document.getElementById('select-topic');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="all">🌟 Tất cả chủ đề ngẫu nhiên</option>';

    const topics = window.appWordBank.getTopicsList();
    topics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.icon} ${t.name} (${t.count} từ)`;
      select.appendChild(opt);
    });
    select.value = currentVal || 'all';
  }

  syncRoleSteppers() {
    const playerCount = window.appPlayerManager.getCount();
    const isCustom = this.gameConfig.mode === 'custom';

    if (!isCustom) {
      const def = window.appRoleManager.getDefaultConfig(playerCount);
      if (this.gameConfig.mode === 'undercover' && playerCount < 6) {
        def.mrWhite = 0;
        def.civilian = playerCount - def.spy;
      }
      this.gameConfig.customRoles = { ...def };
    }

    document.getElementById('stepper-val-civilian').textContent = this.gameConfig.customRoles.civilian;
    document.getElementById('stepper-val-spy').textContent = this.gameConfig.customRoles.spy;
    document.getElementById('stepper-val-mrwhite').textContent = this.gameConfig.customRoles.mrWhite;

    // Khóa/mở nút bấm stepper tùy chế độ
    document.querySelectorAll('.stepper-btn').forEach(b => {
      b.style.display = isCustom ? 'inline-flex' : 'none';
    });

    const validation = window.appRoleManager.validateConfig(playerCount, this.gameConfig.customRoles);
    const statusEl = document.getElementById('role-setup-status');
    const startBtn = document.getElementById('btn-start-game-match');

    const totalAssigned = this.gameConfig.customRoles.civilian + this.gameConfig.customRoles.spy + this.gameConfig.customRoles.mrWhite;
    if (validation.isValid) {
      statusEl.textContent = `Hợp lệ (${totalAssigned}/${playerCount})`;
      statusEl.style.color = 'var(--accent-success)';
      startBtn.disabled = false;
    } else {
      statusEl.textContent = `Không hợp lệ (${totalAssigned}/${playerCount})`;
      statusEl.style.color = 'var(--color-spy)';
      startBtn.disabled = true;
    }
  }

  updateSetupSummary() {
    const summary = document.getElementById('setup-summary-text');
    const playerCount = window.appPlayerManager.getCount();
    const modeName = this.gameConfig.mode === 'classic' ? 'Cổ Điển' : (this.gameConfig.mode === 'undercover' ? 'Điệp Viên Undercover' : 'Tùy Chỉnh');
    summary.innerHTML = `
      <strong>Chế độ:</strong> ${modeName} • <strong>Số người chơi:</strong> ${playerCount}<br>
      <strong>Cấu hình:</strong> ${this.gameConfig.customRoles.civilian} Dân Thường, ${this.gameConfig.customRoles.spy} Gián Điệp, ${this.gameConfig.customRoles.mrWhite} Mr. White
    `;
  }

  // --- 5. Sự kiện Secret Role Reveal ---
  bindRevealEvents() {
    const cardWrapper = document.getElementById('card-3d-wrapper');
    const flipBtn = document.getElementById('btn-reveal-flip');
    const rememberedBtn = document.getElementById('btn-reveal-remembered');

    flipBtn.addEventListener('click', () => {
      const currentPlayer = window.appGameEngine.getCurrentRevealPlayer();
      if (!currentPlayer) return;

      window.appAudio.playCardFlip();
      setTimeout(() => {
        // Âm thanh mở vai trò đồng nhất 100% cho mọi người để tránh lộ thân phận
        window.appAudio.playRoleReveal();
      }, 150);

      this.populateRevealCardBack(currentPlayer);
      cardWrapper.classList.add('flipped');
    });

    rememberedBtn.addEventListener('click', () => {
      window.appAudio.playCardFlip();
      cardWrapper.classList.remove('flipped');

      setTimeout(() => {
        const result = window.appGameEngine.confirmPlayerRoleRevealed();
        if (result.isAllRevealed) {
          this.showToast('Tất cả đã ghi nhớ vai trò! Bắt đầu vòng gợi ý.', 'success');
          this.startCluePhase();
        } else {
          this.renderRevealPlayerFront(result.nextPlayer);
          this.renderRevealDots();
          // Âm thanh thông báo chuyển máy cho người tiếp theo
          window.appAudio.playTurnNotice();
        }
      }, 350);
    });
  }

  startRoleRevealPhase() {
    this.switchScreen('role-reveal');
    document.getElementById('card-3d-wrapper').classList.remove('flipped');
    const firstPlayer = window.appGameEngine.getCurrentRevealPlayer();
    this.renderRevealPlayerFront(firstPlayer);
    this.renderRevealDots();
    // Chuông thông báo người chơi đầu tiên nhận thiết bị
    window.appAudio.playTurnNotice();
  }

  renderRevealPlayerFront(player) {
    if (!player) return;
    document.getElementById('reveal-player-name').textContent = player.name;
    document.getElementById('reveal-player-avatar').textContent = player.avatar;
  }

  renderRevealDots() {
    const container = document.getElementById('reveal-dots-container');
    container.innerHTML = '';
    const players = window.appGameEngine.players;
    const currentIndex = window.appGameEngine.currentRevealIndex;

    players.forEach((p, idx) => {
      const dot = document.createElement('div');
      dot.className = 'reveal-dot';
      if (idx < currentIndex) dot.classList.add('done');
      else if (idx === currentIndex) dot.classList.add('active');
      container.appendChild(dot);
    });
  }

  populateRevealCardBack(player) {
    const backEl = document.getElementById('card-back-element');
    const badge = document.getElementById('reveal-role-badge');
    const icon = document.getElementById('reveal-role-icon');
    const title = document.getElementById('reveal-role-title');
    const wordLabel = document.getElementById('reveal-word-label');
    const wordValue = document.getElementById('reveal-word-value');
    const desc = document.getElementById('reveal-role-desc');

    backEl.style.borderColor = player.roleDetails.borderColor;
    badge.className = `badge badge-${player.role === 'civilian' ? 'civilian' : (player.role === 'spy' ? 'spy' : 'white')}`;
    badge.textContent = player.roleDetails.title;

    icon.textContent = player.roleDetails.icon;
    title.textContent = player.roleDetails.name;
    title.style.color = player.roleDetails.color;

    wordLabel.textContent = player.wordLabel;
    wordValue.textContent = player.secretWord || '???';
    wordValue.style.color = player.secretWord ? '#fff' : 'var(--color-spy)';

    desc.textContent = player.roleDetails.description;
  }

  // --- 6. Sự kiện Clue & Discussion Rounds ---
  bindClueAndDiscussionEvents() {
    document.getElementById('btn-clue-confirm-done').addEventListener('click', () => {
      window.appAudio.playClick();
      this.handleClueTurnDone();
    });

    document.getElementById('btn-start-vote-now').addEventListener('click', () => {
      window.appAudio.playClick();
      this.startVotingPhase();
    });
  }

  startCluePhase() {
    this.switchScreen('clue');
    document.getElementById('clue-round-num').textContent = window.appGameEngine.roundNumber;
    this.renderCurrentClueSpeaker();
    this.renderCluePlayersStatus();
    // Chuông thông báo đến lượt gợi ý
    window.appAudio.playTurnNotice();
  }

  renderCurrentClueSpeaker() {
    const speaker = window.appGameEngine.getCurrentCluePlayer();
    if (!speaker) return;

    document.getElementById('clue-speaker-name').textContent = speaker.name;
    document.getElementById('clue-speaker-avatar').textContent = speaker.avatar;
  }

  renderCluePlayersStatus() {
    const container = document.getElementById('clue-players-status-list');
    container.innerHTML = '';
    const clueOrder = window.appGameEngine.clueOrder;
    const currentSpeaker = window.appGameEngine.getCurrentCluePlayer();

    clueOrder.forEach(p => {
      const card = document.createElement('div');
      card.className = 'player-status-card';
      if (currentSpeaker && p.id === currentSpeaker.id) card.classList.add('current');
      if (p.hasGivenClue) card.classList.add('completed');

      card.innerHTML = `
        <span class="avatar avatar-sm">${p.avatar}</span>
        <div style="flex: 1; font-weight: 600; font-size: 0.9rem;">${p.name}</div>
        <span>${p.hasGivenClue ? '✅' : (currentSpeaker && p.id === currentSpeaker.id ? '🎙️' : '⏳')}</span>
      `;
      container.appendChild(card);
    });
  }

  handleClueTurnDone() {
    const result = window.appGameEngine.nextClueTurn();
    if (result.isRoundCluesDone) {
      this.showToast('Vòng gợi ý hoàn tất! Bắt đầu thảo luận.', 'info');
      this.startDiscussionPhase();
    } else {
      this.renderCurrentClueSpeaker();
      this.renderCluePlayersStatus();
      // Chuông thông báo chuyển lượt người tiếp theo đưa ra gợi ý
      window.appAudio.playTurnNotice();
    }
  }

  startDiscussionPhase() {
    this.switchScreen('discussion');
    const container = document.getElementById('discuss-alive-players-list');
    container.innerHTML = '';
    const alivePlayers = window.appGameEngine.players.filter(p => p.isAlive);

    alivePlayers.forEach(p => {
      const card = document.createElement('div');
      card.className = 'player-status-card';
      card.innerHTML = `
        <span class="avatar avatar-sm">${p.avatar}</span>
        <div style="flex: 1; font-weight: 600; font-size: 0.9rem;">${p.name}</div>
        <span style="font-size: 0.8rem; color: var(--accent-success);">Sống sót</span>
      `;
      container.appendChild(card);
    });
  }

  // --- 7. Sự kiện Bỏ Phiếu Kín ---
  bindVotingEvents() {
    document.getElementById('btn-unlock-ballot').addEventListener('click', () => {
      window.appAudio.playClick();
      document.getElementById('voting-curtain-box').style.display = 'none';
      const ballotBox = document.getElementById('voting-ballot-box');
      ballotBox.style.display = 'flex';
      this.renderVotingCandidates();
    });

    document.getElementById('btn-submit-vote').addEventListener('click', () => {
      if (!this.selectedVoteTargetId) return;
      const currentVoter = window.appVotingManager.getCurrentVoter();
      if (!currentVoter) return;

      window.appAudio.playVote();
      const res = window.appVotingManager.submitVote(currentVoter.id, this.selectedVoteTargetId);

      this.selectedVoteTargetId = null;
      document.getElementById('btn-submit-vote').disabled = true;

      if (res.isComplete) {
        this.showToast('Tất cả cử tri đã bỏ phiếu xong! Đang kiểm phiếu...', 'success');
        this.startVotingResultsPhase();
      } else {
        // Chuyển sang cử tri tiếp theo và che màn hình lại
        document.getElementById('voting-ballot-box').style.display = 'none';
        document.getElementById('voting-curtain-box').style.display = 'flex';
        this.renderCurrentVoterCurtain(res.nextVoter);
        // Âm thanh báo đến lượt cử tri tiếp theo cầm máy
        window.appAudio.playTurnNotice();
      }
    });
  }

  startVotingPhase(tiedCandidates = null) {
    this.switchScreen('voting');
    window.appGameEngine.initVoting(tiedCandidates);
    this.selectedVoteTargetId = null;

    document.getElementById('voting-mode-badge').textContent = tiedCandidates ? 'BỎ PHIẾU LẠI (HÒA PHIẾU)' : 'BỎ PHIẾU KÍN';
    document.getElementById('voting-ballot-box').style.display = 'none';
    document.getElementById('voting-curtain-box').style.display = 'flex';

    const firstVoter = window.appVotingManager.getCurrentVoter();
    this.renderCurrentVoterCurtain(firstVoter);
    // Âm thanh thông báo cử tri đầu tiên nhận máy
    window.appAudio.playTurnNotice();
  }

  renderCurrentVoterCurtain(voter) {
    if (!voter) return;
    const progress = window.appVotingManager.getProgress();
    document.getElementById('voting-progress-text').textContent = `Cử tri ${progress.current}/${progress.total}`;
    document.getElementById('voter-name').textContent = voter.name;
    document.getElementById('voter-avatar').textContent = voter.avatar;
  }

  renderVotingCandidates() {
    const container = document.getElementById('voting-candidates-container');
    container.innerHTML = '';
    const currentVoter = window.appVotingManager.getCurrentVoter();
    const candidates = window.appVotingManager.getCandidates(currentVoter.id);
    const submitBtn = document.getElementById('btn-submit-vote');

    // 1. Danh sách người chơi nghi phạm
    candidates.forEach(c => {
      const card = document.createElement('div');
      card.className = 'candidate-card';
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.8rem;">
          <span class="avatar avatar-sm">${c.avatar}</span>
          <span style="font-weight: 700; font-size: 1.05rem;">${c.name}</span>
        </div>
        <span class="badge" style="background: rgba(255,255,255,0.08);">Nghi phạm</span>
      `;

      card.addEventListener('click', () => {
        window.appAudio.playClick();
        container.querySelectorAll('.candidate-card').forEach(el => el.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedVoteTargetId = c.id;
        submitBtn.disabled = false;
      });

      container.appendChild(card);
    });

    // 2. Tùy chọn BỎ PHIẾU TRẮNG / KHÔNG LOẠI AI
    const skipCard = document.createElement('div');
    skipCard.className = 'candidate-card candidate-card-skip';
    skipCard.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.8rem;">
        <span class="avatar avatar-sm" style="background: rgba(255, 255, 255, 0.08);">🕊️</span>
        <div>
          <div style="font-weight: 700; font-size: 1.05rem; color: #f8fafc;">Bỏ phiếu trắng</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Không nghi ngờ hoặc không muốn loại ai</div>
        </div>
      </div>
      <span class="badge" style="background: rgba(255,255,255,0.08); color: #cbd5e1;">Bỏ qua</span>
    `;

    skipCard.addEventListener('click', () => {
      window.appAudio.playClick();
      container.querySelectorAll('.candidate-card').forEach(el => el.classList.remove('selected'));
      skipCard.classList.add('selected');
      this.selectedVoteTargetId = 'skip';
      submitBtn.disabled = false;
    });

    container.appendChild(skipCard);
  }

  startVotingResultsPhase() {
    this.switchScreen('voting-result');
    const result = window.appGameEngine.processVotingResults();

    const container = document.getElementById('voting-tallies-container');
    container.innerHTML = '';
    const actionsBox = document.getElementById('voting-result-actions');
    actionsBox.innerHTML = '';

    const heroTitle = document.getElementById('result-status-title');
    const heroDesc = document.getElementById('result-status-desc');
    const heroIcon = document.getElementById('result-status-icon');

    // Sắp xếp ứng viên theo số phiếu giảm dần
    const sortedCandidates = [...window.appVotingManager.voters].sort((a, b) => {
      const vA = result.tallyMap[a.id] || 0;
      const vB = result.tallyMap[b.id] || 0;
      return vB - vA;
    });

    // 1. Hiển thị kết quả từng ứng viên
    sortedCandidates.forEach(cand => {
      const votes = result.tallyMap[cand.id] || 0;
      const percent = result.maxVotes > 0 ? (votes / result.maxVotes) * 100 : 0;
      const isTop = result.topCandidates.some(tc => tc.id === cand.id) && votes > 0;

      const item = document.createElement('div');
      item.className = 'result-tally-item';
      if (isTop) item.style.borderColor = 'var(--color-spy)';

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="avatar avatar-sm">${cand.avatar}</span>
            <strong style="font-size: 1rem;">${cand.name}</strong>
          </div>
          <span class="badge ${isTop ? 'badge-spy' : ''}">${votes} phiếu</span>
        </div>
        <div class="tally-bar-bg">
          <div class="tally-bar-fill" style="width: ${percent}%;"></div>
        </div>
      `;
      container.appendChild(item);
    });

    // 2. Hiển thị kết quả Bỏ phiếu trắng / Không loại ai
    const skipVotes = result.skipVotes || 0;
    const skipPercent = result.maxVotes > 0 ? (skipVotes / result.maxVotes) * 100 : 0;
    const isSkipTop = result.noElimination || result.tiedWithSkip;

    const skipItem = document.createElement('div');
    skipItem.className = 'result-tally-item';
    if (isSkipTop) skipItem.style.borderColor = 'var(--color-civilian)';

    skipItem.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span class="avatar avatar-sm" style="background: rgba(255,255,255,0.08);">🕊️</span>
          <strong style="font-size: 1rem;">Không loại ai (Phiếu trắng)</strong>
        </div>
        <span class="badge ${isSkipTop ? 'badge-civilian' : ''}">${skipVotes} phiếu</span>
      </div>
      <div class="tally-bar-bg">
        <div class="tally-bar-fill" style="width: ${skipPercent}%; background: linear-gradient(90deg, #06b6d4 0%, #10b981 100%);"></div>
      </div>
    `;
    container.appendChild(skipItem);

    // 3. Xử lý các tình huống kết quả
    if (result.noElimination) {
      // ĐA SỐ CHỌN KHÔNG LOẠI AI
      heroIcon.textContent = '🕊️';
      heroTitle.textContent = 'KHÔNG AI BỊ LOẠI VÒNG NÀY!';
      heroDesc.textContent = result.reason || `Đa số cử tri (${skipVotes} phiếu) đã bỏ phiếu trắng chọn không loại ai.`;

      const contBtn = document.createElement('button');
      contBtn.className = 'btn btn-primary btn-block btn-lg';
      contBtn.innerHTML = '<span>🕊️ TIẾP TỤC VÒNG TIẾP THEO</span>';
      contBtn.addEventListener('click', () => {
        window.appAudio.playClick();
        this.showToast('Không ai bị loại! Bắt đầu vòng gợi ý tiếp theo.', 'info');
        window.appGameEngine.startNextRound();
        this.startCluePhase();
      });
      actionsBox.appendChild(contBtn);

    } else if (result.isTie) {
      // HÒA PHIẾU
      heroIcon.textContent = '⚖️';
      heroTitle.textContent = 'HÒA PHIẾU CĂNG THẲNG!';
      heroDesc.textContent = result.reason;

      // Nút bỏ phiếu lại
      const revoteBtn = document.createElement('button');
      revoteBtn.className = 'btn btn-primary btn-block btn-lg';
      revoteBtn.innerHTML = '<span>🔄 BỎ PHIẾU LẠI GIỮA NHỮNG NGƯỜI HÒA</span>';
      revoteBtn.addEventListener('click', () => {
        window.appAudio.playClick();
        this.startVotingPhase(result.topCandidates);
      });
      actionsBox.appendChild(revoteBtn);

      // Nút không loại ai
      const skipBtn = document.createElement('button');
      skipBtn.className = 'btn btn-secondary btn-block';
      skipBtn.innerHTML = '<span>🕊️ BỎ QUA VÒNG NÀY (KHÔNG LOẠI AI)</span>';
      skipBtn.addEventListener('click', () => {
        window.appAudio.playClick();
        this.showToast('Không ai bị loại! Bắt đầu vòng gợi ý tiếp theo.', 'info');
        window.appGameEngine.startNextRound();
        this.startCluePhase();
      });
      actionsBox.appendChild(skipBtn);

    } else if (result.eliminatedCandidate) {
      // CÓ NGƯỜI BỊ LOẠI
      const eliminated = result.eliminatedCandidate;
      heroIcon.textContent = '🎯';
      heroTitle.textContent = `${eliminated.name} CÓ SỐ PHIẾU CAO NHẤT!`;
      heroDesc.textContent = `Nhận ${result.maxVotes} phiếu bầu từ các người chơi.`;

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'btn btn-danger btn-block btn-lg';
      confirmBtn.innerHTML = `<span>🚨 XÁC NHẬN LOẠI ${eliminated.name}</span>`;
      confirmBtn.addEventListener('click', () => {
        this.handlePlayerElimination(eliminated);
      });
      actionsBox.appendChild(confirmBtn);

    } else {
      // Không có ai bị vote
      heroTitle.textContent = 'KHÔNG CÓ PHIẾU NÀO ĐƯỢC BẦU!';
      const contBtn = document.createElement('button');
      contBtn.className = 'btn btn-primary btn-block';
      contBtn.textContent = 'TIẾP TỤC VÒNG TIẾP THEO';
      contBtn.addEventListener('click', () => {
        window.appGameEngine.startNextRound();
        this.startCluePhase();
      });
      actionsBox.appendChild(contBtn);
    }
  }

  // --- 8. Sự kiện Loại Người & Kết Thúc Trận ---
  handlePlayerElimination(player) {
    window.appAudio.playEliminate();
    const result = window.appGameEngine.eliminatePlayer(player);

    if (result.isMrWhite) {
      // Chuyển sang màn hình Mr White đoán từ
      this.switchScreen('mrwhite-guess');
      document.getElementById('input-mrwhite-guess').value = '';
    } else {
      // Hiện màn hình công bố loại
      this.switchScreen('elimination');
      document.getElementById('eliminated-name').textContent = player.name;
      document.getElementById('eliminated-avatar').textContent = player.avatar;

      const badge = document.getElementById('eliminated-role-badge');
      badge.textContent = `${player.roleDetails.icon} ${player.roleDetails.name}`;
      badge.className = `role-reveal-badge badge-${player.role === 'civilian' ? 'civilian' : 'spy'}`;

      document.getElementById('elimination-narrative').textContent = result.isGameOver
        ? 'Lượt loại này đã quyết định kết quả của cả trận đấu!'
        : 'Trận đấu vẫn tiếp tục! Các người chơi còn lại chuẩn bị cho vòng tiếp theo.';

      const continueBtn = document.getElementById('btn-elimination-continue');
      continueBtn.onclick = () => {
        window.appAudio.playClick();
        if (result.isGameOver) {
          this.startGameOverPhase(window.appGameEngine.winner);
        } else {
          window.appGameEngine.startNextRound();
          this.startCluePhase();
        }
      };
    }
  }

  bindEliminationAndResultEvents() {
    // Mr White đoán từ qua input
    document.getElementById('btn-submit-mrwhite-guess').addEventListener('click', () => {
      const guessInput = document.getElementById('input-mrwhite-guess').value.trim();
      if (!guessInput) {
        this.showToast('Vui lòng nhập từ khóa bạn đoán!', 'warning');
        return;
      }
      const isCorrect = window.appScoringManager.checkMrWhiteGuess(guessInput, window.appGameEngine.civilianWord);
      this.resolveMrWhiteGuess(isCorrect);
    });

    // Quyền Host xác nhận trực tiếp nếu chơi nói miệng
    document.getElementById('btn-host-confirm-white-win').addEventListener('click', () => {
      this.resolveMrWhiteGuess(true);
    });
    document.getElementById('btn-host-confirm-white-lose').addEventListener('click', () => {
      this.resolveMrWhiteGuess(false);
    });

    // Kết thúc trận: Chơi lại / Về trang chủ
    document.getElementById('btn-gameover-replay').addEventListener('click', () => {
      window.appAudio.playClick();
      this.syncGameSetupScreen();
      this.switchScreen('game-setup');
    });

    document.getElementById('btn-gameover-home').addEventListener('click', () => {
      window.appAudio.playClick();
      this.switchScreen('home');
    });
  }

  resolveMrWhiteGuess(isCorrect) {
    const outcome = window.appGameEngine.handleMrWhiteGuess(isCorrect);
    if (outcome.isGameOver) {
      this.startGameOverPhase(outcome.winner || window.appGameEngine.winner);
    } else {
      this.showToast('Mr. White đã đoán sai từ khóa và chính thức bị loại!', 'error');
      window.appGameEngine.startNextRound();
      this.startCluePhase();
    }
  }

  startGameOverPhase(winner) {
    this.switchScreen('game-over');
    const summary = window.appGameEngine.gameSummary;

    if (winner === 'civilian' || winner === 'mr_white') {
      window.appAudio.playVictory();
    } else {
      window.appAudio.playDefeat();
    }

    const titleEl = document.getElementById('gameover-winner-title');
    const reasonEl = document.getElementById('gameover-reason');
    const trophyEl = document.getElementById('gameover-trophy-icon');

    if (winner === 'civilian') {
      trophyEl.textContent = '🛡️';
      titleEl.textContent = 'PHE DÂN THƯỜNG THẮNG CUỘC!';
      titleEl.style.color = 'var(--color-civilian)';
      reasonEl.textContent = 'Tất cả Gián điệp đã bị lật tẩy và đưa ra ánh sáng!';
    } else if (winner === 'spy') {
      trophyEl.textContent = '🕵️';
      titleEl.textContent = 'PHE GIÁN ĐIỆP THẮNG CUỘC!';
      titleEl.style.color = 'var(--color-spy)';
      reasonEl.textContent = 'Gián điệp đã xuất sắc ngụy trang và áp đảo số dân thường!';
    } else if (winner === 'mr_white') {
      trophyEl.textContent = '👤';
      titleEl.textContent = 'MR. WHITE THẮNG NGOẠN MỤC!';
      titleEl.style.color = 'var(--color-mrwhite)';
      reasonEl.textContent = 'Bị phát hiện nhưng Mr. White đã đoán chính xác từ khóa!';
    }

    // Hiển thị từ khóa
    document.getElementById('gameover-civilian-word').textContent = summary.civilianWord;
    const spyWordBox = document.getElementById('gameover-spy-word-box');
    if (summary.spyWord) {
      spyWordBox.style.display = 'block';
      document.getElementById('gameover-spy-word').textContent = summary.spyWord;
    } else {
      spyWordBox.style.display = 'none';
    }

    // Danh sách danh tính người chơi
    const listContainer = document.getElementById('gameover-all-roles-container');
    listContainer.innerHTML = '';
    summary.players.forEach(p => {
      const item = document.createElement('div');
      item.className = 'role-summary-item';
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span class="avatar avatar-sm">${p.avatar}</span>
          <div>
            <div style="font-weight: 700;">${p.name}</div>
            <div style="font-size: 0.75rem; color: ${p.isAlive ? 'var(--accent-success)' : 'var(--color-spy)'};">
              ${p.isAlive ? 'Còn sống' : 'Đã bị loại'}
            </div>
          </div>
        </div>
        <span class="badge" style="background: rgba(255,255,255,0.1); color: ${p.roleColor}; border-color: ${p.roleColor};">
          ${p.roleName} ${p.isWinner ? '🏆' : ''}
        </span>
      `;
      listContainer.appendChild(item);
    });
  }

  // --- 9. Cài Đặt & Thống Kê ---
  bindSettingsAndHistoryEvents() {
    document.getElementById('btn-save-settings').addEventListener('click', () => {
      const sound = document.getElementById('setting-sound-toggle').checked;
      const bgm = document.getElementById('setting-bgm-toggle').checked;
      const volume = parseFloat(document.getElementById('setting-volume-slider').value);
      const bgmVolume = parseFloat(document.getElementById('setting-bgm-slider').value);
      const vibration = document.getElementById('setting-vibration-toggle').checked;
      const clueTime = parseInt(document.getElementById('setting-clue-time').value, 10);
      const discussTime = parseInt(document.getElementById('setting-discuss-time').value, 10);

      window.appStorage.saveSettings({
        soundEnabled: sound,
        bgmEnabled: bgm,
        volume,
        bgmVolume,
        vibrationEnabled: vibration,
        effectsEnabled: true,
        clueTime,
        discussionTime: discussTime,
        allowTieNoElim: true
      });

      window.appAudio.toggleSound(sound);
      window.appAudio.toggleBGM(bgm);
      window.appAudio.setVolume(volume);
      window.appAudio.setBGMVolume(bgmVolume);
      window.appAudio.toggleVibration(vibration);

      this.updateQuickBgmBtn();

      this.showToast('Đã lưu cấu hình cài đặt!', 'success');
      document.getElementById('modal-settings').classList.remove('active');
    });

    document.getElementById('btn-add-custom-word').addEventListener('click', () => {
      const input = document.getElementById('input-custom-word');
      const val = input.value.trim();
      if (!val) return;

      const success = window.appStorage.addCustomWord(val);
      if (success) {
        input.value = '';
        this.renderCustomWordsList();
        this.updateTopicOptions();
        this.showToast(`Đã thêm từ khóa "${val}"!`, 'success');
      } else {
        this.showToast('Từ khóa này đã tồn tại!', 'warning');
      }
    });

    document.getElementById('btn-clear-history').addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử và thống kê trận đấu?')) {
        window.appStorage.clearHistory();
        this.loadHistoryModal();
        this.showToast('Đã xóa lịch sử thành công!', 'info');
      }
    });
  }

  loadSettingsModal() {
    const settings = window.appStorage.getSettings() || {};
    document.getElementById('setting-sound-toggle').checked = !window.appAudio.isMuted;
    document.getElementById('setting-bgm-toggle').checked = window.appAudio.bgmEnabled;
    document.getElementById('setting-volume-slider').value = window.appAudio.volume;
    document.getElementById('setting-bgm-slider').value = window.appAudio.bgmVolume;
    document.getElementById('setting-vibration-toggle').checked = window.appAudio.vibrationEnabled;
    document.getElementById('setting-clue-time').value = settings.clueTime || 45;
    document.getElementById('setting-discuss-time').value = settings.discussionTime || 90;

    this.renderCustomWordsList();
  }

  renderCustomWordsList() {
    const list = document.getElementById('custom-words-list');
    list.innerHTML = '';
    const words = window.appStorage.getCustomWords();

    if (words.length === 0) {
      list.innerHTML = '<span style="color: var(--text-dim);">Chưa có từ khóa tự tạo nào.</span>';
      return;
    }

    words.forEach(w => {
      const tag = document.createElement('div');
      tag.style.cssText = 'display: inline-flex; align-items: center; gap: 0.4rem; background: var(--bg-surface-elevated); padding: 0.25rem 0.6rem; border-radius: var(--radius-sm); margin: 0.2rem; border: 1px solid var(--border-glass);';
      tag.innerHTML = `
        <span>${w.word}</span>
        <span class="btn-del-word" data-id="${w.id}" style="cursor: pointer; color: var(--color-spy); font-weight: bold;">✕</span>
      `;
      list.appendChild(tag);
    });

    list.querySelectorAll('.btn-del-word').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        window.appStorage.deleteCustomWord(id);
        this.renderCustomWordsList();
        this.updateTopicOptions();
      });
    });
  }

  loadHistoryModal() {
    const stats = window.appStorage.getStats();
    const history = window.appStorage.getItem('spy_party_history', []);

    document.getElementById('stat-total-games').textContent = stats.totalGames;
    const civPct = stats.totalGames > 0 ? Math.round((stats.civilianWins / stats.totalGames) * 100) : 0;
    const spyPct = stats.totalGames > 0 ? Math.round((stats.spyWins / stats.totalGames) * 100) : 0;

    document.getElementById('stat-civ-rate').textContent = `${civPct}%`;
    document.getElementById('stat-spy-rate').textContent = `${spyPct}%`;
    document.getElementById('stat-white-wins').textContent = stats.mrWhiteWins;

    const list = document.getElementById('history-list-container');
    list.innerHTML = '';

    if (history.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 1.5rem;">Chưa có trận đấu nào được ghi lại.</div>';
      return;
    }

    history.forEach(h => {
      const item = document.createElement('div');
      let winnerClass = 'history-winner-civ';
      let winnerLabel = 'Dân Thường';
      if (h.winner === 'spy') { winnerClass = 'history-winner-spy'; winnerLabel = 'Gián Điệp'; }
      if (h.winner === 'mr_white') { winnerClass = 'history-winner-white'; winnerLabel = 'Mr. White'; }

      item.className = `history-item ${winnerClass}`;
      item.innerHTML = `
        <div>
          <div style="font-weight: 700; font-size: 0.95rem;">${winnerLabel} Thắng (${h.players} người)</div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">${h.date} • ${h.rounds} vòng</div>
        </div>
        <div style="text-align: right; font-size: 0.85rem; color: var(--text-muted);">
          ${h.wordA ? `"${h.wordA}"` : ''}
        </div>
      `;
      list.appendChild(item);
    });
  }

  handleTimerTick(remaining, total) {
    const clueText = document.getElementById('clue-timer-text');
    const cluePill = document.getElementById('clue-timer-badge');
    const discussText = document.getElementById('discuss-timer-text');
    const discussPill = document.getElementById('discuss-timer-badge');

    if (clueText) clueText.textContent = `${remaining}s`;
    if (discussText) discussText.textContent = `${remaining}s`;

    if (cluePill) {
      if (remaining <= 5) cluePill.classList.add('urgent');
      else cluePill.classList.remove('urgent');
    }
    if (discussPill) {
      if (remaining <= 10) discussPill.classList.add('urgent');
      else discussPill.classList.remove('urgent');
    }
  }
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});

