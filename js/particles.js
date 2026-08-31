/**
 * =========================================================================
 * CINEMATIC PARTICLES & AMBIENT CANVAS
 * =========================================================================
 * Renders soft, drifting champagne/gold light specks and warm dust embers
 * with gentle floating physics, creating depth without tacky distractions.
 */

class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 35;
    this.animationFrameId = null;
    this.isRunning = false;

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);

    window.addEventListener('resize', this.resize);
    this.resize();
    this.initParticles();
    this.start();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle(isNew = false) {
    const isGold = Math.random() > 0.4;
    return {
      x: Math.random() * (this.canvas.width || window.innerWidth),
      y: isNew ? (this.canvas.height || window.innerHeight) + 10 : Math.random() * (this.canvas.height || window.innerHeight),
      radius: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.4 + 0.15),
      alpha: Math.random() * 0.6 + 0.1,
      targetAlpha: Math.random() * 0.7 + 0.2,
      pulseSpeed: Math.random() * 0.015 + 0.005,
      color: isGold ? '212, 175, 55' : '230, 200, 180' // Champagne Gold or Soft Ivory Rose
    };
  }

  animate() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Subtle pulsating alpha
      p.alpha += p.pulseSpeed;
      if (p.alpha > p.targetAlpha || p.alpha < 0.1) {
        p.pulseSpeed = -p.pulseSpeed;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Draw particle with soft glow
      this.ctx.save();
      this.ctx.beginPath();
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
      gradient.addColorStop(0, `rgba(${p.color}, ${Math.max(0, p.alpha)})`);
      gradient.addColorStop(1, `rgba(${p.color}, 0)`);
      this.ctx.fillStyle = gradient;
      this.ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      // Reset when particle drifts off screen
      if (p.y < -20 || p.x < -20 || p.x > this.canvas.width + 20) {
        this.particles[i] = this.createParticle(true);
      }
    }

    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  burst(x, y, count = 25) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x || window.innerWidth / 2,
        y: y || window.innerHeight / 2,
        radius: Math.random() * 2.5 + 1,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        alpha: 1,
        targetAlpha: 0,
        pulseSpeed: -0.015,
        color: '212, 175, 55'
      });
    }
  }
}

window.ParticleEngine = ParticleEngine;
