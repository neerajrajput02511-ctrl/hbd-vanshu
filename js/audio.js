/**
 * =========================================================================
 * AUDIO PLAYER & WAVEFORM VISUALIZER (With IndexedDB Persistent Audio)
 * =========================================================================
 * Manages background music, user-triggered playback, live canvas waveform
 * visualization, IndexedDB audio storage, and acoustic fallback.
 */

class AudioController {
  constructor() {
    this.audioElement = new Audio();
    this.audioElement.loop = true;
    this.audioElement.preload = "auto";
    this.isPlaying = false;
    this.audioCtx = null;
    this.isSynthesizing = false;
    this.synthInterval = null;
    this.activeSongBlobUrl = null;

    this.toggleBtn = document.getElementById('music-toggle-btn');
    this.songTitleEl = document.getElementById('music-song-title');
    this.waveformCanvas = document.getElementById('music-waveform-canvas');
    this.ctx = this.waveformCanvas ? this.waveformCanvas.getContext('2d') : null;
    
    this.init();
  }

  init() {
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.togglePlay());
    }

    this.audioElement.addEventListener('ended', () => {
      if (this.isPlaying) this.audioElement.play().catch(e => console.log(e));
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn("Audio element playback error, falling back to cinematic acoustic synth:", e);
      if (this.isPlaying) this.startCinematicSynthesizer();
    });

    this.renderWaveform();
  }

  async loadTrack(songConfig) {
    const config = songConfig || (window.storageManager ? window.storageManager.config.SONG : null);
    if (!config) return;

    if (this.songTitleEl) {
      this.songTitleEl.textContent = config.title ? `♪ ${config.title}` : "♪ PLAY OUR SONG";
    }

    let url = config.url ? config.url.trim() : "";

    // If stored in IndexedDB (idb:song_track or similar)
    if (url.startsWith("idb:")) {
      const key = url.replace("idb:", "");
      if (window.storageManager) {
        const blob = await window.storageManager.getMediaBlob(key);
        if (blob) {
          if (this.activeSongBlobUrl) URL.revokeObjectURL(this.activeSongBlobUrl);
          this.activeSongBlobUrl = URL.createObjectURL(blob);
          url = this.activeSongBlobUrl;
        }
      }
    }

    if (url && url.length > 0) {
      this.stopSynthesizer();
      this.audioElement.src = url;
      this.audioElement.load();
      this.isSynthesizing = false;
    } else {
      this.audioElement.src = "";
      this.isSynthesizing = true;
    }
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  async togglePlay() {
    this.ensureAudioContext();
    const config = window.storageManager ? window.storageManager.config.SONG : null;
    
    if (this.isPlaying) {
      this.pause();
    } else {
      await this.play(config);
    }
  }

  async play(config) {
    const song = config || (window.storageManager ? window.storageManager.config.SONG : null);
    this.ensureAudioContext();

    await this.loadTrack(song);

    if (this.audioElement.src && this.audioElement.src.length > 0 && !this.audioElement.src.endsWith(window.location.href)) {
      this.stopSynthesizer();
      this.audioElement.play().then(() => {
        this.isPlaying = true;
        this.updateUI(true);
      }).catch(err => {
        console.warn("Audio file play prevented, trying ambient synth:", err);
        this.startCinematicSynthesizer();
      });
    } else {
      this.startCinematicSynthesizer();
    }
  }

  pause() {
    this.isPlaying = false;
    this.audioElement.pause();
    this.stopSynthesizer();
    this.updateUI(false);
  }

  updateUI(playing) {
    if (this.toggleBtn) {
      if (playing) {
        this.toggleBtn.classList.add('is-playing');
        this.toggleBtn.setAttribute('aria-label', 'Pause our song');
      } else {
        this.toggleBtn.classList.remove('is-playing');
        this.toggleBtn.setAttribute('aria-label', 'Play our song');
      }
    }
  }

  // Romantic acoustic chord synthesis fallback
  startCinematicSynthesizer() {
    this.ensureAudioContext();
    this.isSynthesizing = true;
    this.isPlaying = true;
    this.updateUI(true);

    const chords = [
      [349.23, 440.00, 523.25, 698.46], // F maj
      [440.00, 523.25, 659.25, 880.00], // A min
      [466.16, 587.33, 698.46, 932.33], // Bb maj
      [523.25, 659.25, 783.99, 1046.50]  // C maj
    ];

    let chordIndex = 0;
    const playNextChord = () => {
      if (!this.isPlaying || !this.isSynthesizing || !this.audioCtx) return;
      const currentChord = chords[chordIndex % chords.length];
      chordIndex++;

      currentChord.forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        const now = this.audioCtx.currentTime;
        const duration = 4.2;

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.04 / (i + 1), now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });
    };

    playNextChord();
    this.synthInterval = setInterval(playNextChord, 4000);
  }

  stopSynthesizer() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  renderWaveform() {
    if (!this.waveformCanvas || !this.ctx) return;

    const width = this.waveformCanvas.width = 44;
    const height = this.waveformCanvas.height = 20;

    const draw = () => {
      requestAnimationFrame(draw);
      this.ctx.clearRect(0, 0, width, height);

      const numBars = 5;
      const barWidth = 3;
      const gap = 3;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;
        if (this.isPlaying) {
          const time = Date.now() * 0.006;
          barHeight = Math.sin(time + i * 1.3) * 7 + 9;
        }

        const x = i * (barWidth + gap) + 4;
        const y = (height - barHeight) / 2;

        this.ctx.fillStyle = this.isPlaying ? 'rgba(212, 175, 55, 0.9)' : 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, barWidth, barHeight, 2);
        this.ctx.fill();
      }
    };

    draw();
  }
}

window.AudioController = AudioController;
