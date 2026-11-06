/**
 * SPY PARTY - Audio & Haptics Engine
 * Bộ sinh âm thanh & nhạc nền huyền bí thuần bằng Web Audio API (100% Offline, không phụ thuộc file mp3)
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

    // Quản lý BGM
    this.isBGMPlaying = false;
    this.bgmOscs = [];
    this.bgmTimer = null;

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
      this.bgmGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.5);
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
      } catch (e) {
        // Trình duyệt không hỗ trợ hoặc bị chặn
      }
    }
  }

  // ==========================================
  // NHẠC NỀN HUYỀN BÍ (MYSTERIOUS AMBIENT BGM)
  // Tạo không gian âm thanh điện ảnh, bí ẩn, noir detective bằng Web Audio API
  // ==========================================
  startBGM() {
    if (this.isBGMPlaying || !this.bgmEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.isBGMPlaying = true;
    const t = this.ctx.currentTime;

    // 1. Bass drone ngầm huyền bí (C2 = 65.41Hz, G2 = 98Hz)
    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(180, t);
    droneFilter.Q.value = 2;
    droneFilter.connect(this.bgmGain);

    // LFO điều chế tần số cắt tạo cảm giác "thở" bí ẩn chậm rãi
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, t); // 12 giây 1 chu kỳ thở
    lfoGain.gain.setValueAtTime(60, t);
    lfo.connect(lfoGain);
    lfoGain.connect(droneFilter.frequency);
    lfo.start(t);
    this.bgmOscs.push(lfo);

    // 2 Oscillator tạo âm drone dày
    const droneFreqs = [65.41, 65.9, 98.0, 130.81];
    droneFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(idx === 0 ? 0.35 : 0.15, t + 2.0);

      osc.connect(gain);
      gain.connect(droneFilter);
      osc.start(t);
      this.bgmOscs.push(osc);
    });

    // 2. Vòng lặp các nốt ngân huyền ảo (Ambient Mystery Melody Chimes)
    // Thang âm C minor ngũ cung huyền bí: C4 (261.6), Eb4 (311.1), F4 (349.2), G4 (392.0), Bb4 (466.1), C5 (523.2)
    const mysteryScale = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 622.25];
    const playAmbientNote = () => {
      if (!this.isBGMPlaying || !this.ctx || this.isMuted) return;

      const now = this.ctx.currentTime;
      const noteFreq = mysteryScale[Math.floor(Math.random() * mysteryScale.length)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(noteFreq, now);
      filter.Q.value = 4;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(now);
      osc.stop(now + 3.5);

      // Nhịp tiếp theo xuất hiện ngẫu nhiên sau 2.8s đến 5.5s
      const nextDelay = 2800 + Math.random() * 2700;
      this.bgmTimer = setTimeout(playAmbientNote, nextDelay);
    };

    // Khởi động chuỗi nốt sau 1 giây
    this.bgmTimer = setTimeout(playAmbientNote, 1000);
  }

  stopBGM() {
    this.isBGMPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }

    if (this.bgmOscs.length > 0 && this.ctx) {
      const now = this.ctx.currentTime;
      if (this.bgmGain) {
        this.bgmGain.gain.linearRampToValueAtTime(0.001, now + 0.6);
      }
      setTimeout(() => {
        this.bgmOscs.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {}
        });
        this.bgmOscs = [];
      }, 700);
    }
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
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

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
  // Yêu cầu quan trọng: Âm thanh phải hoàn toàn giống nhau giữa Dân thường, Gián điệp và Mr. White
  // để người ngồi cạnh không thể đoán được vai trò qua tai nghe/loa ngoài!
  playRoleReveal(role = null) {
    this.vibrate([60, 40, 90]);
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Âm sắc bí ẩn gián điệp tinh tế: Hợp âm căng thẳng lấp lánh (Mystery Espionage Shimmer Chord)
    // Đồng nhất cho mọi người chơi!
    const chordNotes = [
      { f: 220.00, type: 'sine', gain: 0.18, dur: 0.9 },   // A3 (sub tone bí ẩn)
      { f: 329.63, type: 'triangle', gain: 0.16, dur: 0.8 }, // E4
      { f: 440.00, type: 'sine', gain: 0.14, dur: 0.75 },  // A4
      { f: 554.37, type: 'sine', gain: 0.12, dur: 0.7 },   // C#5 (tiếng ngân bí ẩn)
      { f: 880.00, type: 'sine', gain: 0.08, dur: 0.6 }    // A5 (lấp lánh trên cao)
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
  // Âm thanh hai nốt sang trọng, rõ ràng nhắc nhở đưa máy cho người tiếp theo
  playTurnNotice() {
    this.vibrate([50, 40, 70]);
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Chuông ding-dong ngân vang (523.25Hz -> 783.99Hz : C5 -> G5)
    const tones = [
      { freq: 523.25, time: 0.0,  duration: 0.22, vol: 0.22 },
      { freq: 783.99, time: 0.12, duration: 0.45, vol: 0.26 }
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
