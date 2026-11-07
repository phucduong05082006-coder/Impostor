/**
 * SPY PARTY - Audio & Haptics Engine
 * Bộ sinh âm thanh & nhạc nền game huyền bí chuyên nghiệp (100% Offline, không phụ thuộc file mp3)
 */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;

    this.isMuted = false;
    this.bgmEnabled = true;
    this.volume = 0.7;
    this.bgmVolume = 0.35;
    this.vibrationEnabled = true;

    // Quản lý BGM Sequencer
    this.isBGMPlaying = false;
    this.bgmSchedulerTimer = null;
    this.bgmCurrentStep = 0;
    this.bgmNextStepTime = 0;
    this.tempo = 116; // Nhịp độ 116 BPM chuẩn các tựa game trinh thám/party
    this.stepDuration = (60 / this.tempo) / 4; // Độ dài 1 nốt móc kép (16th note)

    // Tải cấu hình từ Storage nếu có
    if (window.appStorage) {
      const settings = window.appStorage.getSettings();
      if (settings) {
        this.isMuted = !settings.soundEnabled;
        this.bgmEnabled = settings.bgmEnabled !== false;
        this.volume = settings.volume !== undefined ? settings.volume : 0.7;
        this.bgmVolume = settings.bgmVolume !== undefined ? settings.bgmVolume : 0.35;
        this.vibrationEnabled = settings.vibrationEnabled !== false;
      }
    }

    // Lắng nghe tương tác đầu tiên của người dùng để mở AudioContext & khởi động BGM
    this.initAudioContextOnUserGesture();
  }

  initAudioContextOnUserGesture() {
    const unlock = () => {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          if (this.bgmEnabled && !this.isMuted && !this.isBGMPlaying) {
            this.startBGM();
          }
        });
      } else if (this.bgmEnabled && !this.isMuted && !this.isBGMPlaying) {
        this.startBGM();
      }
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
    document.addEventListener('keydown', unlock);
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // SFX Gain
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // BGM Gain
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(this.bgmEnabled ? this.bgmVolume : 0, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  setBGMVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmEnabled ? this.bgmVolume : 0, this.ctx.currentTime);
    }
  }

  toggleSound(enabled) {
    this.isMuted = !enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    if (!this.isMuted && this.bgmEnabled && !this.isBGMPlaying) {
      this.startBGM();
    } else if (this.isMuted && this.isBGMPlaying) {
      this.stopBGM();
    }
  }

  toggleBGM(enabled) {
    this.bgmEnabled = enabled;
    if (this.bgmGain && this.ctx) {
      const targetGain = (this.bgmEnabled && !this.isMuted) ? this.bgmVolume : 0;
      this.bgmGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.3);
    }
    if (this.bgmEnabled && !this.isMuted) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
  }

  toggleVibration(enabled) {
    this.vibrationEnabled = enabled;
  }

  vibrate(pattern = 50) {
    if (this.vibrationEnabled && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  // ==========================================
  // NHẠC NỀN GAME HUYỀN BÍ (PARTY SPY GAME SOUNDTRACK)
  // Gồm 4 tầng âm thanh: Bassline điệp viên, Hi-hat/Snare nhịp nhàng, Hợp âm Synth Noir & Giai điệu bí ẩn
  // ==========================================
  startBGM() {
    if (this.isBGMPlaying || !this.bgmEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.isBGMPlaying = true;
    this.bgmCurrentStep = 0;
    this.bgmNextStepTime = this.ctx.currentTime + 0.1;

    // Scheduler vòng lặp chính xác theo thời gian AudioContext
    const scheduleAhead = () => {
      if (!this.isBGMPlaying || !this.ctx || this.isMuted) return;

      while (this.bgmNextStepTime < this.ctx.currentTime + 0.25) {
        this.scheduleGameMusicStep(this.bgmCurrentStep, this.bgmNextStepTime);
        this.bgmNextStepTime += this.stepDuration;
        this.bgmCurrentStep = (this.bgmCurrentStep + 1) % 64; // 4 ô nhịp = 64 bước nốt móc kép
      }

      this.bgmSchedulerTimer = setTimeout(scheduleAhead, 40);
    };

    scheduleAhead();
  }

  stopBGM() {
    this.isBGMPlaying = false;
    if (this.bgmSchedulerTimer) {
      clearTimeout(this.bgmSchedulerTimer);
      this.bgmSchedulerTimer = null;
    }
  }

  /**
   * Phát các nốt của 4 nhạc cụ ở mỗi bước nhịp (Step 0 - 63)
   */
  scheduleGameMusicStep(step, time) {
    if (!this.ctx || !this.bgmGain) return;

    // --- 1. NHẠC CỤ PERCUSSION (Hi-hats, Snare, Kick) ---
    // Hi-hat tick mỗi 2 bước (nốt móc đơn)
    if (step % 2 === 0) {
      const isAccent = step % 4 === 0;
      this.playSynthHiHat(time, isAccent ? 0.04 : 0.02);
    }
    // Snare / Rimshot click ở phách 2 và 4 (bước 4, 12, 20, 28, 36, 44, 52, 60)
    if (step % 8 === 4) {
      this.playSynthSnare(time, 0.07);
    }
    // Kick nhịp trầm nhẹ nhàng ở đầu mỗi ô nhịp
    if (step % 16 === 0 || step % 16 === 10) {
      this.playSynthKick(time, 0.12);
    }

    // --- 2. BASSLINE ĐIỆP VIÊN (FUNKY SPY BASS) ---
    // Tiến trình hòa âm C Minor:
    // Ô 1 (0-15): C2 (65.4Hz) & C3 (130.8Hz)
    // Ô 2 (16-31): Ab1 (51.9Hz) & Ab2 (103.8Hz)
    // Ô 3 (32-47): F1 (43.65Hz) & F2 (87.3Hz)
    // Ô 4 (48-63): G1 (49.0Hz) & G2 (98.0Hz)
    const bar = Math.floor(step / 16);
    const subStep = step % 16;
    const baseFreqs = [65.41, 51.91, 43.65, 49.00];
    const root = baseFreqs[bar];

    // Rhythmic Bass pattern: phách 0, 3, 6, 8, 11, 14
    if ([0, 3, 6, 8, 11, 14].includes(subStep)) {
      const isOctave = (subStep === 6 || subStep === 14);
      const freq = isOctave ? root * 2 : root;
      const dur = this.stepDuration * 1.5;
      this.playSynthBass(freq, time, dur, isOctave ? 0.18 : 0.24);
    }

    // --- 3. SYNTH CHORD STABS (HỢP ÂM NOIR BÍ MẬT) ---
    // Đánh hợp âm off-beat tạo phong cách trinh thám
    if (subStep === 4 || subStep === 10) {
      // Hợp âm 3 nốt:
      // Bar 0: Cm (Eb4, G4, C5)
      // Bar 1: Ab (Eb4, Ab4, C5)
      // Bar 2: Fm (F4, Ab4, C5)
      // Bar 3: G7 (D4, F4, B4)
      const chordMap = [
        [311.13, 392.00, 523.25], // Cm
        [311.13, 415.30, 523.25], // Ab
        [349.23, 415.30, 523.25], // Fm
        [293.66, 349.23, 493.88]  // G7
      ];
      this.playSynthChord(chordMap[bar], time, this.stepDuration * 2.5, 0.06);
    }

    // --- 4. GIAI ĐIỆU BÍ ẨN (DETECTIVE HOOK ARPEGGIO) ---
    // Nốt hook ở nửa cuối mỗi chu kỳ (Bar 2 & Bar 3)
    if (bar >= 2 && [0, 4, 8, 12].includes(subStep)) {
      const leadNotes = [523.25, 622.25, 698.46, 783.99, 932.33];
      const leadFreq = leadNotes[(step % 5)];
      this.playSynthLead(leadFreq, time, this.stepDuration * 1.8, 0.05);
    }
  }

  // --- Các hàm sinh âm nhạc cụ cho BGM ---
  playSynthKick(time, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  playSynthHiHat(time, vol) {
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    noise.start(time);
  }

  playSynthSnare(time, vol) {
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.075);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    noise.start(time);
  }

  playSynthBass(freq, time, dur, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + dur);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  playSynthChord(freqs, time, dur, vol) {
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, time);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(f * 1.2, time);
      filter.Q.value = 2;

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + dur + 0.03);
    });
  }

  playSynthLead(freq, time, dur, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  // ==========================================
  // HIỆU ỨNG ÂM THANH (SFX)
  // ==========================================

  // --- 1. Âm thanh click / chạm nút ---
  playClick() {
    this.vibrate(25);
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.05);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // --- 2. Âm thanh lật thẻ (Whoosh gió bí ẩn) ---
  playCardFlip() {
    this.vibrate([30, 20, 30]);
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(1600, t + 0.08);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.15);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    noise.start(t);
  }

  // --- 3. ÂM THANH HIỆN VAI TRÒ BÍ MẬT (ĐỒNG NHẤT 100% CHO TẤT CẢ MỌI NGƯỜI) ---
  // Bảo mật tuyệt đối: Dân thường, Gián điệp và Mr. White đều nghe cùng một âm thanh
  playRoleReveal(role = null) {
    this.vibrate([60, 40, 90]);
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Hợp âm kịch tính lấp lánh (Mystery Espionage Shimmer Chord) đồng nhất
    const chordNotes = [
      { f: 220.00, type: 'sine', gain: 0.18, dur: 0.9 },   // A3
      { f: 329.63, type: 'triangle', gain: 0.16, dur: 0.8 }, // E4
      { f: 440.00, type: 'sine', gain: 0.14, dur: 0.75 },  // A4
      { f: 554.37, type: 'sine', gain: 0.12, dur: 0.7 },   // C#5
      { f: 880.00, type: 'sine', gain: 0.08, dur: 0.6 }    // A5
    ];

    chordNotes.forEach((n, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = n.type;
      osc.frequency.setValueAtTime(n.f * 0.98, t + i * 0.02);
      osc.frequency.exponentialRampToValueAtTime(n.f, t + 0.15);

      gain.gain.setValueAtTime(0.001, t + i * 0.02);
      gain.gain.linearRampToValueAtTime(n.gain, t + 0.08 + i * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);

      osc.start(t + i * 0.02);
      osc.stop(t + n.dur + 0.05);
    });
  }

  // --- 4. ÂM THANH THÔNG BÁO CHUYỂN LƯỢT (TURN NOTICE CHIME) ---
  // Chuông ding-dong ngân vang nhắc nhở chuyển giao thiết bị
  playTurnNotice() {
    this.vibrate([50, 40, 70]);
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const tones = [
      { freq: 523.25, time: 0.0,  duration: 0.22, vol: 0.22 }, // C5
      { freq: 783.99, time: 0.12, duration: 0.45, vol: 0.26 }  // G5
    ];

    tones.forEach(tone => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.freq, t + tone.time);

      gain.gain.setValueAtTime(0.001, t + tone.time);
      gain.gain.linearRampToValueAtTime(tone.vol, t + tone.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + tone.time + tone.duration);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);

      osc.start(t + tone.time);
      osc.stop(t + tone.time + tone.duration + 0.05);
    });
  }

  // --- 5. Âm thanh đếm nhịp giây ---
  playTick(isUrgent = false) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = isUrgent ? 880 : 440;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.03);

    gain.gain.setValueAtTime(isUrgent ? 0.2 : 0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.035);

    if (isUrgent) this.vibrate(30);
  }

  // --- 6. Âm thanh hết giờ ---
  playTimerEnd() {
    this.vibrate([100, 50, 100, 50, 150]);
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [520, 480, 440].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + i * 0.12);

      gain.gain.setValueAtTime(0.15, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.16);
    });
  }

  // --- 7. Âm thanh bỏ phiếu xác nhận ---
  playVote() {
    this.vibrate(40);
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  // --- 8. Âm thanh loại người chơi (Boom âm bass mạnh mẽ) ---
  playEliminate() {
    this.vibrate([150, 80, 200]);
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.6);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  // --- 9. Âm thanh chiến thắng vang dội ---
  playVictory() {
    this.vibrate([100, 50, 100, 50, 300]);
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 261.63, d: 0.15, offset: 0.0 },  // C4
      { f: 329.63, d: 0.15, offset: 0.15 }, // E4
      { f: 392.00, d: 0.15, offset: 0.3 },  // G4
      { f: 523.25, d: 0.5,  offset: 0.45 }, // C5
      { f: 659.25, d: 0.6,  offset: 0.7 }   // E5
    ];

    notes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t + note.offset);

      gain.gain.setValueAtTime(0.25, t + note.offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.offset + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);
      osc.start(t + note.offset);
      osc.stop(t + note.offset + note.d + 0.05);
    });
  }

  // --- 10. Âm thanh thất bại / Gián điệp thắng ---
  playDefeat() {
    this.vibrate([200, 100, 300]);
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 329.63, offset: 0.0 },  // E4
      { f: 311.13, offset: 0.25 }, // Eb4
      { f: 293.66, offset: 0.5 },  // D4
      { f: 277.18, offset: 0.75 }  // C#4
    ];

    notes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, t + note.offset);

      gain.gain.setValueAtTime(0.15, t + note.offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.offset + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);
      osc.start(t + note.offset);
      osc.stop(t + note.offset + 0.4);
    });
  }

  // --- 11. Âm thanh cảnh báo / Chuyển màn hình ---
  playAlert() {
    this.vibrate([50, 50, 50]);
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.setValueAtTime(880, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.26);
  }
}

// Khởi tạo instance dùng chung
window.appAudio = new AudioManager();
