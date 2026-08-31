/**
 * =========================================================================
 * "FOR VANSHIKA" — MAIN CINEMATIC EXPERIENCE ENGINE
 * =========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Managers
  const storage = window.storageManager;
  const config = storage ? storage.config : window.DEFAULT_CONFIG;

  // Initialize Particle Canvas
  const particles = new window.ParticleEngine("particles-canvas");

  // Initialize Audio Controller
  const audio = new window.AudioController();
  window.audioController = audio;
  audio.loadTrack(config.SONG);

  // Experience State
  let currentReasonIndex = 0;

  // Cache DOM Elements
  const openingScreen = document.getElementById("opening-screen");
  const btnEnter = document.getElementById("btn-enter-experience");
  const openingSteps = document.querySelectorAll(".opening-step");

  // Run Opening Sequence Transitions
  function runOpeningSequence() {
    let delay = 600;
    openingSteps.forEach((step, idx) => {
      setTimeout(() => {
        step.classList.add("active");
      }, delay);
      delay += 1400;
    });
  }

  runOpeningSequence();

  // Enter Experience Button
  if (btnEnter) {
    btnEnter.addEventListener("click", () => {
      openingScreen.classList.add("hidden");
      audio.play(config.SONG);
      if (particles) {
        particles.burst(window.innerWidth / 2, window.innerHeight / 2, 40);
      }
      setTimeout(() => {
        const heroSection = document.getElementById("hero");
        if (heroSection) heroSection.scrollIntoView({ behavior: "smooth" });
      }, 500);
    });
  }

  // Render All Dynamic Sections
  function renderAll() {
    const currentConfig = storage ? storage.config : window.DEFAULT_CONFIG;

    renderHero(currentConfig);
    renderMeetingStory(currentConfig);
    renderVideos(currentConfig);
    renderLittleThings(currentConfig);
    renderPhotos(currentConfig);
    renderLoveNotes(currentConfig);
    renderTimeline(currentConfig);
    renderLoveLetter(currentConfig);
    renderReasons(currentConfig);
    renderVideoClimax(currentConfig);
    renderFinalScreen(currentConfig);
  }

  // 1. Hero Section
  function renderHero(cfg) {
    const heroName = document.getElementById("hero-target-name");
    const openName = document.getElementById("opening-name-display");
    if (heroName) heroName.textContent = cfg.HER_NAME || "Vanshika";
    if (openName) openName.textContent = cfg.HER_NAME || "Vanshika";
  }

  // 2. Countdown Timer
  function initCountdown(targetDateStr) {
    const daysEl = document.getElementById("count-days");
    const hoursEl = document.getElementById("count-hours");
    const minsEl = document.getElementById("count-mins");
    const secsEl = document.getElementById("count-secs");
    const celebrationEl = document.getElementById("countdown-celebration");
    const gridEl = document.getElementById("countdown-grid");
    const titleEl = document.getElementById("countdown-title-text");

    const targetTime = new Date(targetDateStr || "2026-09-01T00:00:00").getTime();

    function update() {
      const now = new Date().getTime();
      const distance = targetTime - now;

      if (distance <= 0) {
        if (gridEl) gridEl.style.display = "none";
        if (titleEl) titleEl.style.display = "none";
        if (celebrationEl) celebrationEl.classList.add("active");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
      if (minsEl) minsEl.textContent = String(minutes).padStart(2, "0");
      if (secsEl) secsEl.textContent = String(seconds).padStart(2, "0");
    }

    update();
    setInterval(update, 1000);
  }

  initCountdown(config.BIRTHDAY);

  // 3. Meeting Story
  function renderMeetingStory(cfg) {
    const story = cfg.MEETING_STORY;
    if (!story) return;

    const subhead = document.getElementById("story-subheading");
    const heading = document.getElementById("story-heading");
    const linesContainer = document.getElementById("story-lines-flow");
    const annotation = document.getElementById("story-annotation");

    if (subhead) subhead.textContent = story.subheading || "Before there was an us...";
    if (heading) heading.textContent = story.heading || "There was a beginning.";
    if (annotation) annotation.textContent = story.annotation || "And somehow, this became us.";

    if (linesContainer && Array.isArray(story.lines)) {
      linesContainer.innerHTML = story.lines
        .map(line => `<p class="story-line reveal">${escapeHTML(line)}</p>`)
        .join("");
    }
  }

  // 4. Video Gallery
  function renderVideos(cfg) {
    const container = document.getElementById("video-gallery-grid");
    if (!container || !cfg.VIDEOS) return;

    container.innerHTML = cfg.VIDEOS.map((vid, idx) => `
      <div class="video-card ${vid.type === 'landscape' ? 'landscape' : ''} reveal delay-${(idx % 3) + 1}">
        <div class="video-media-wrapper" data-video-url="${escapeHTML(vid.url || '')}" data-video-title="${escapeHTML(vid.title || '')}" data-video-caption="${escapeHTML(vid.caption || '')}">
          <img class="video-poster-img" src="${vid.poster || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80'}" alt="${escapeHTML(vid.title)}" loading="lazy" />
          <div class="video-play-overlay">
            <div class="play-circle-btn">
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
          </div>
        </div>
        <div class="video-info-box">
          <span class="video-label-tag">${escapeHTML(vid.title || `VIDEO 0${idx + 1}`)}</span>
          <p class="video-caption-text">"${escapeHTML(vid.caption || '')}"</p>
        </div>
      </div>
    `).join("");

    // Attach click triggers to open video modal
    container.querySelectorAll(".video-media-wrapper").forEach((wrapper, idx) => {
      wrapper.addEventListener("click", () => {
        const url = wrapper.getAttribute("data-video-url");
        const title = wrapper.getAttribute("data-video-title");
        const caption = wrapper.getAttribute("data-video-caption");
        openVideoModal(url, title, caption, idx);
      });
    });
  }

  // 5. "The Little Things" (Diary Notes)
  function renderLittleThings(cfg) {
    const container = document.getElementById("little-things-grid");
    if (!container || !cfg.LITTLE_THINGS) return;

    container.innerHTML = cfg.LITTLE_THINGS.map((item, idx) => `
      <div class="diary-card reveal delay-${(idx % 3) + 1}">
        <span class="diary-tag">${escapeHTML(item.tag || `Observation 0${idx + 1}`)}</span>
        <h4 class="diary-title">${escapeHTML(item.title)}</h4>
        <p class="diary-text">${escapeHTML(item.text)}</p>
      </div>
    `).join("");
  }

  // 6. Photo Memories (Polaroid Scatter)
  function renderPhotos(cfg) {
    const container = document.getElementById("photo-scatter-table");
    if (!container || !cfg.PHOTOS) return;

    container.innerHTML = cfg.PHOTOS.map((p, idx) => {
      const rot = p.rotation !== undefined ? p.rotation : ((idx % 2 === 0 ? 1 : -1) * (2 + (idx % 3)));
      return `
        <div class="polaroid-card reveal delay-${(idx % 4) + 1}" style="transform: rotate(${rot}deg);" data-photo-url="${escapeHTML(p.url)}" data-photo-caption="${escapeHTML(p.caption || '')}">
          <div class="polaroid-img-box">
            <img class="polaroid-img" src="${p.url}" alt="${escapeHTML(p.caption || 'Memory')}" loading="lazy" />
          </div>
          <p class="polaroid-caption">${escapeHTML(p.caption || '')}</p>
          <span class="polaroid-date">${escapeHTML(p.date || '')}</span>
        </div>
      `;
    }).join("");

    // Click to view photo in lightbox
    container.querySelectorAll(".polaroid-card").forEach(card => {
      card.addEventListener("click", () => {
        const url = card.getAttribute("data-photo-url");
        const caption = card.getAttribute("data-photo-caption");
        openImageModal(url, caption);
      });
    });
  }

  // 7. Love Notes ("Open When...")
  function renderLoveNotes(cfg) {
    const container = document.getElementById("love-notes-grid");
    if (!container || !cfg.LOVE_NOTES) return;

    container.innerHTML = cfg.LOVE_NOTES.map((note, idx) => `
      <div class="envelope-item reveal delay-${(idx % 3) + 1}" data-note-index="${idx}">
        <div>
          <span class="envelope-badge">${escapeHTML(note.badge || 'Love Note')}</span>
          <h3 class="envelope-trigger-title">${escapeHTML(note.title)}</h3>
        </div>
        <div class="envelope-action-cue">
          <span>Tap to unfold note</span> →
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".envelope-item").forEach(item => {
      item.addEventListener("click", () => {
        const idx = parseInt(item.getAttribute("data-note-index"), 10);
        const note = cfg.LOVE_NOTES[idx];
        if (note) openNoteModal(note.title, note.content);
      });
    });
  }

  // 8. Our Timeline
  function renderTimeline(cfg) {
    const container = document.getElementById("timeline-spine");
    if (!container || !cfg.TIMELINE) return;

    container.innerHTML = cfg.TIMELINE.map((item, idx) => `
      <div class="timeline-item reveal delay-${(idx % 3) + 1}">
        <div class="timeline-dot"></div>
        <span class="timeline-date-stamp">${escapeHTML(item.date)}</span>
        <h3 class="timeline-item-title">${escapeHTML(item.title)}</h3>
        <p class="timeline-item-desc">${escapeHTML(item.description)}</p>
      </div>
    `).join("");
  }

  // 9. Climax Love Letter
  function renderLoveLetter(cfg) {
    const letterHeading = document.getElementById("modal-letter-heading");
    const letterContent = document.getElementById("modal-letter-content");

    if (letterHeading) letterHeading.textContent = `For ${cfg.HER_NAME || 'Vanshika'}.`;
    if (letterContent) letterContent.textContent = cfg.LOVE_LETTER || "";
  }

  // 10. Reasons I Love You Counter
  function renderReasons(cfg) {
    const reasons = cfg.REASONS || [];
    const indexBadge = document.getElementById("reason-index-badge");
    const textDisplay = document.getElementById("reason-text-display");
    const btnNext = document.getElementById("btn-next-reason");

    if (!reasons.length) return;

    function updateReason(index) {
      if (index < reasons.length) {
        if (indexBadge) indexBadge.textContent = String(index + 1).padStart(2, "0");
        if (textDisplay) {
          textDisplay.style.opacity = "0";
          textDisplay.style.transform = "translateY(10px)";
          setTimeout(() => {
            textDisplay.textContent = reasons[index];
            textDisplay.style.opacity = "1";
            textDisplay.style.transform = "translateY(0)";
          }, 200);
        }
        if (btnNext) btnNext.textContent = "Another one.";
      } else {
        // Infinity state reached
        if (indexBadge) indexBadge.textContent = "∞";
        if (textDisplay) {
          textDisplay.style.opacity = "0";
          setTimeout(() => {
            textDisplay.textContent = "I stopped counting. My reasons to love you are endless.";
            textDisplay.style.opacity = "1";
          }, 200);
        }
        if (btnNext) btnNext.textContent = "Start Over ↺";
      }
    }

    updateReason(currentReasonIndex);

    if (btnNext) {
      btnNext.onclick = () => {
        if (currentReasonIndex >= reasons.length) {
          currentReasonIndex = 0;
        } else {
          currentReasonIndex++;
        }
        updateReason(currentReasonIndex);
      };
    }
  }

  // 11. Video Climax
  function renderVideoClimax(cfg) {
    const climax = cfg.CLIMAX_VIDEO;
    if (!climax) return;

    const title = document.getElementById("climax-video-title");
    const note = document.getElementById("climax-note-text");
    const frame = document.getElementById("climax-player-frame");
    const poster = document.getElementById("climax-poster-img");

    if (title) title.textContent = climax.title || "This one's just for you.";
    if (note) note.textContent = `"${climax.note || ''}"`;
    if (poster && climax.poster) poster.src = climax.poster;

    if (frame) {
      frame.onclick = () => {
        openVideoModal(climax.url, climax.title, climax.note, "climax");
      };
    }
  }

  // 12. Final Screen
  function renderFinalScreen(cfg) {
    const final = cfg.FINAL_SCREEN || {};
    const line1 = document.getElementById("final-whisper-text");
    const wish = document.getElementById("final-birthday-wish-text");
    const yourName = document.getElementById("final-your-name-text");
    const nickname = document.getElementById("final-nickname-text");
    const ps = document.getElementById("final-ps-text");

    if (line1) line1.textContent = final.line1 || "If you remember only one thing from this...";
    if (wish) wish.textContent = final.birthdayWish || `Happy Birthday, ${cfg.HER_NAME || 'Vanshika'}.`;
    if (yourName) yourName.textContent = cfg.YOUR_NAME || "[YOUR NAME]";
    if (nickname) nickname.textContent = final.privateNote || (cfg.NICKNAMES ? cfg.NICKNAMES[0] : "My forever girl");
    if (ps) ps.textContent = final.ps || "P.S. You can come back here whenever you miss me.";
  }

  // =========================================================================
  // Modals & Interactive Overlays
  // =========================================================================

  // Note Modal
  const noteModal = document.getElementById("note-modal-overlay");
  const noteModalTitle = document.getElementById("modal-note-title");
  const noteModalBody = document.getElementById("modal-note-body");
  const noteModalClose = document.getElementById("modal-note-close");

  function openNoteModal(title, content) {
    if (noteModalTitle) noteModalTitle.textContent = title;
    if (noteModalBody) noteModalBody.textContent = content;
    if (noteModal) noteModal.classList.add("active");
  }

  if (noteModalClose) {
    noteModalClose.addEventListener("click", () => noteModal.classList.remove("active"));
  }
  if (noteModal) {
    noteModal.addEventListener("click", (e) => {
      if (e.target === noteModal) noteModal.classList.remove("active");
    });
  }

  // Main 3D Envelope & Love Letter Modal
  const envelopeEl = document.getElementById("realistic-envelope-card");
  const loveLetterModal = document.getElementById("love-letter-reading-overlay");
  const btnCloseLetter = document.getElementById("btn-close-letter");

  if (envelopeEl) {
    envelopeEl.addEventListener("click", () => {
      envelopeEl.classList.add("envelope-open");
      if (particles) {
        particles.burst(window.innerWidth / 2, window.innerHeight / 2, 35);
      }
      setTimeout(() => {
        if (loveLetterModal) loveLetterModal.classList.add("active");
      }, 700);
    });
  }

  if (btnCloseLetter) {
    btnCloseLetter.addEventListener("click", () => {
      if (loveLetterModal) loveLetterModal.classList.remove("active");
      setTimeout(() => {
        if (envelopeEl) envelopeEl.classList.remove("envelope-open");
      }, 600);
    });
  }

  // Media Viewer Modals (Video / Lightbox)
  const mediaModal = document.getElementById("media-viewer-modal");
  const mediaVideo = document.getElementById("media-modal-video");
  const mediaImg = document.getElementById("media-modal-img");
  const mediaCaption = document.getElementById("media-modal-caption");
  const mediaClose = document.getElementById("media-modal-close");
  const mediaUploadPrompt = document.getElementById("media-modal-upload-prompt");
  const directVideoUploader = document.getElementById("modal-direct-video-uploader");

  let wasAudioPlayingBeforeVideo = false;
  let activeVideoBlobUrl = null;
  let currentActiveVideoSlotIndex = -1;

  async function openVideoModal(url, title, caption, slotIndex) {
    if (!mediaModal) return;
    mediaImg.style.display = "none";
    currentActiveVideoSlotIndex = slotIndex !== undefined ? slotIndex : -1;

    // Pause background song while watching video
    if (audio && audio.isPlaying) {
      wasAudioPlayingBeforeVideo = true;
      audio.pause();
    } else {
      wasAudioPlayingBeforeVideo = false;
    }

    // Clean up previous blob URL if any
    if (activeVideoBlobUrl) {
      URL.revokeObjectURL(activeVideoBlobUrl);
      activeVideoBlobUrl = null;
    }

    let finalSrc = url ? url.trim() : "";

    // If stored in IndexedDB (idb:video_xxx)
    if (finalSrc.startsWith("idb:")) {
      const key = finalSrc.replace("idb:", "");
      if (storage) {
        const blob = await storage.getMediaBlob(key);
        if (blob) {
          activeVideoBlobUrl = URL.createObjectURL(blob);
          finalSrc = activeVideoBlobUrl;
        }
      }
    }

    if (finalSrc && finalSrc.length > 0) {
      if (mediaUploadPrompt) mediaUploadPrompt.style.display = "none";
      mediaVideo.style.display = "block";
      mediaVideo.src = finalSrc;
      mediaVideo.load();
      
      const playPromise = mediaVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Video auto-play prevented or requires user click:", error);
        });
      }

      if (mediaCaption) {
        mediaCaption.textContent = caption || title || "";
      }
    } else {
      // If no video file is attached yet, show friendly prompt & direct picker
      mediaVideo.src = "";
      mediaVideo.style.display = "none";
      if (mediaUploadPrompt) mediaUploadPrompt.style.display = "block";
      if (mediaCaption) {
        mediaCaption.innerHTML = `<em>"${caption || title || "Video Memory"}"</em><br><span style="font-size:0.85rem; color:var(--rose-dusty); display:block; margin-top:8px;">No video attached yet for this card. Tap below to select your MP4 video:</span>`;
      }
    }

    mediaModal.classList.add("active");
  }

  // Handle direct video upload right from modal
  if (directVideoUploader) {
    directVideoUploader.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file || !storage) return;

      if (currentActiveVideoSlotIndex === "climax") {
        const storageKey = "video_climax_" + Date.now();
        await storage.saveMediaBlob(storageKey, file);
        storage.config.CLIMAX_VIDEO = storage.config.CLIMAX_VIDEO || {};
        storage.config.CLIMAX_VIDEO.url = `idb:${storageKey}`;
        storage.saveConfig(storage.config);
        
        if (window.refreshExperienceUI) window.refreshExperienceUI();
        openVideoModal(storage.config.CLIMAX_VIDEO.url, storage.config.CLIMAX_VIDEO.title, storage.config.CLIMAX_VIDEO.note, "climax");
      } else if (typeof currentActiveVideoSlotIndex === "number" && currentActiveVideoSlotIndex >= 0) {
        const vid = storage.config.VIDEOS[currentActiveVideoSlotIndex];
        if (vid) {
          const storageKey = "video_" + (vid.id || "vid_" + currentActiveVideoSlotIndex);
          await storage.saveMediaBlob(storageKey, file);
          vid.url = `idb:${storageKey}`;
          storage.saveConfig(storage.config);
          
          if (window.refreshExperienceUI) window.refreshExperienceUI();
          openVideoModal(vid.url, vid.title, vid.caption, currentActiveVideoSlotIndex);
        }
      }
    };
  }

  function openImageModal(url, caption) {
    if (!mediaModal) return;
    if (mediaVideo) {
      mediaVideo.pause();
      mediaVideo.src = "";
    }
    mediaVideo.style.display = "none";
    mediaImg.style.display = "block";
    mediaImg.src = url;
    if (mediaCaption) mediaCaption.textContent = caption || "";
    mediaModal.classList.add("active");
  }

  function closeMediaModal() {
    if (mediaModal) mediaModal.classList.remove("active");
    if (mediaVideo) {
      mediaVideo.pause();
      mediaVideo.src = "";
    }
    if (activeVideoBlobUrl) {
      URL.revokeObjectURL(activeVideoBlobUrl);
      activeVideoBlobUrl = null;
    }
    // Resume background music if it was playing before
    if (wasAudioPlayingBeforeVideo && audio) {
      audio.play(config.SONG);
    }
  }

  if (mediaClose) mediaClose.addEventListener("click", closeMediaModal);
  if (mediaModal) {
    mediaModal.addEventListener("click", (e) => {
      if (e.target === mediaModal) closeMediaModal();
    });
  }

  // =========================================================================
  // Scroll Reveal Intersection Observer
  // =========================================================================
  function initScrollObserver() {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    });

    elements.forEach(el => observer.observe(el));
  }

  // =========================================================================
  // Hidden Edit Mode Long-Press Handler
  // =========================================================================
  const logoMonogram = document.getElementById("brand-monogram-trigger");
  let pressTimer = null;

  if (logoMonogram) {
    const startPress = () => {
      pressTimer = setTimeout(() => {
        if (window.editModeController) {
          window.editModeController.openDrawer();
        }
      }, 1500); // 1.5s long-press for rapid responsiveness
    };

    const cancelPress = () => {
      if (pressTimer) clearTimeout(pressTimer);
    };

    logoMonogram.addEventListener("mousedown", startPress);
    logoMonogram.addEventListener("touchstart", startPress, { passive: true });
    logoMonogram.addEventListener("mouseup", cancelPress);
    logoMonogram.addEventListener("mouseleave", cancelPress);
    logoMonogram.addEventListener("touchend", cancelPress);
    // Also support direct click, double-click, and long press
    logoMonogram.addEventListener("click", () => {
      if (window.editModeController) window.editModeController.openDrawer();
    });
    logoMonogram.addEventListener("dblclick", () => {
      if (window.editModeController) window.editModeController.openDrawer();
    });
  }

  // Floating Edit Button
  const floatingBtn = document.getElementById("floating-edit-btn");
  if (floatingBtn) {
    floatingBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (window.editModeController) window.editModeController.openDrawer();
    });
  }

  // Keyboard shortcut 'e' or 'E' or 'F2' to toggle edit mode
  window.addEventListener("keydown", (e) => {
    if ((e.key === "e" || e.key === "E" || e.key === "F2") && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      if (window.editModeController) {
        if (window.editModeController.drawer && window.editModeController.drawer.classList.contains("open")) {
          window.editModeController.closeDrawer();
        } else {
          window.editModeController.openDrawer();
        }
      }
    }
  });

  // Expose render trigger for Edit Mode live updates
  window.refreshExperienceUI = renderAll;

  // Initial Render & Setup
  renderAll();
  initScrollObserver();
});

// Helper: Escape HTML
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
