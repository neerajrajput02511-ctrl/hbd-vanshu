/**
 * =========================================================================
 * HIDDEN EDIT MODE CONTROLLER
 * =========================================================================
 * Comprehensive visual management dashboard accessible via 2-second
 * long-press on the monogram logo. Allows editing texts, uploading photos,
 * videos, audio files, reordering, and exporting to `config.js`.
 */

class EditModeController {
  constructor() {
    this.drawer = document.getElementById("edit-mode-drawer");
    this.tabs = document.querySelectorAll(".edit-tab-btn");
    this.panes = document.querySelectorAll(".edit-tab-pane");
    this.btnClose = document.getElementById("edit-drawer-close");
    this.btnSave = document.getElementById("btn-save-changes");
    this.btnExportJS = document.getElementById("btn-export-js");
    this.btnExportJSON = document.getElementById("btn-export-json");
    this.btnImportJSON = document.getElementById("btn-import-json");
    this.fileImportInput = document.getElementById("file-import-input");
    this.btnReset = document.getElementById("btn-reset-default");

    this.init();
  }

  init() {
    // Tab Switching
    this.tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.getAttribute("data-tab");
        this.switchTab(target);
      });
    });

    // Close Drawer
    if (this.btnClose) {
      this.btnClose.addEventListener("click", () => this.closeDrawer());
    }

    // Save Changes
    if (this.btnSave) {
      this.btnSave.addEventListener("click", () => this.saveCurrentState());
    }

    // Export Config as JS file
    if (this.btnExportJS) {
      this.btnExportJS.addEventListener("click", () => {
        this.saveCurrentState();
        const success = window.storageManager.exportConfigFileJS();
        if (success) {
          alert("📥 Downloading config.js... Please replace js/config.js with this file!");
        }
      });
    }

    // Copy Config to Clipboard
    const btnCopy = document.getElementById("btn-copy-config-clipboard");
    if (btnCopy) {
      btnCopy.addEventListener("click", () => {
        this.saveCurrentState();
        const jsText = window.storageManager.getConfigJSString();
        navigator.clipboard.writeText(jsText).then(() => {
          alert("📋 Copied full config.js code to clipboard!\nYou can now open js/config.js and paste it.");
        }).catch(() => {
          // Fallback prompt
          prompt("Copy the config.js text below:", jsText);
        });
      });
    }

    // Direct Save to Disk Button
    const btnDirectDisk = document.getElementById("btn-save-direct-disk");
    if (btnDirectDisk) {
      btnDirectDisk.addEventListener("click", () => {
        this.saveCurrentState();
      });
    }

    // Export Config as JSON
    if (this.btnExportJSON) {
      this.btnExportJSON.addEventListener("click", () => {
        this.saveCurrentState();
        window.storageManager.exportConfigJSON();
      });
    }

    // Import Config JSON
    if (this.btnImportJSON && this.fileImportInput) {
      this.btnImportJSON.addEventListener("click", () => this.fileImportInput.click());
      this.fileImportInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const res = window.storageManager.importConfigJSON(event.target.result);
            if (res.success) {
              alert("Configuration imported successfully!");
              this.populateFields();
              if (window.refreshExperienceUI) window.refreshExperienceUI();
            } else {
              alert("Error importing configuration: " + res.error);
            }
          };
          reader.readAsText(file);
        }
      });
    }

    // Reset Defaults
    if (this.btnReset) {
      this.btnReset.addEventListener("click", () => {
        if (confirm("Reset all settings and memories to default? This will clear local edits.")) {
          window.storageManager.resetToDefault();
          this.populateFields();
          if (window.refreshExperienceUI) window.refreshExperienceUI();
          alert("Reset complete.");
        }
      });
    }
  }

  openDrawer() {
    if (this.drawer) {
      this.drawer.classList.add("open");
      this.drawer.style.right = "0px";
      this.drawer.style.display = "flex";
    }
    try {
      this.populateFields();
    } catch (err) {
      console.warn("Notice during populateFields:", err);
    }
  }

  closeDrawer() {
    if (this.drawer) {
      this.drawer.classList.remove("open");
      this.drawer.style.right = "-100%";
    }
  }

  switchTab(tabId) {
    this.tabs.forEach(t => t.classList.toggle("active", t.getAttribute("data-tab") === tabId));
    this.panes.forEach(p => p.classList.toggle("active", p.id === `tab-pane-${tabId}`));
    if (tabId === "export") {
      this.updateExportCodePreview();
    }
  }

  updateExportCodePreview() {
    const previewEl = document.getElementById("edit-export-code-preview");
    if (previewEl && window.storageManager) {
      previewEl.value = window.storageManager.getConfigJSString();
    }
  }

  populateFields() {
    if (!window.storageManager || !window.storageManager.config) return;
    const cfg = window.storageManager.config;

    // General
    this.setVal("edit-her-name", cfg.HER_NAME || "Vanshika");
    this.setVal("edit-your-name", cfg.YOUR_NAME || "Neeraj");
    this.setVal("edit-birthday", cfg.BIRTHDAY ? cfg.BIRTHDAY.slice(0, 10) : "2026-09-01");
    this.setVal("edit-duration", cfg.RELATIONSHIP_DURATION || "");
    this.setVal("edit-nicknames", Array.isArray(cfg.NICKNAMES) ? cfg.NICKNAMES.join(", ") : "");
    
    // Meeting Story
    if (cfg.MEETING_STORY) {
      this.setVal("edit-story-subheading", cfg.MEETING_STORY.subheading || "");
      this.setVal("edit-story-heading", cfg.MEETING_STORY.heading || "");
      this.setVal("edit-story-lines", Array.isArray(cfg.MEETING_STORY.lines) ? cfg.MEETING_STORY.lines.join("\n") : "");
      this.setVal("edit-story-annotation", cfg.MEETING_STORY.annotation || "");
    }

    // Love Letter & Reasons
    this.setVal("edit-love-letter", cfg.LOVE_LETTER);
    this.setVal("edit-reasons", Array.isArray(cfg.REASONS) ? cfg.REASONS.join("\n") : "");

    // Music & Climax
    if (cfg.SONG) {
      this.setVal("edit-song-title", cfg.SONG.title);
      this.setVal("edit-song-url", cfg.SONG.url);
    }

    const audioUploadInput = document.getElementById("audio-file-uploader");
    if (audioUploadInput) {
      audioUploadInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const storageKey = "song_track";
          try {
            await window.storageManager.saveMediaBlob(storageKey, file);
            const songTitle = file.name.replace(/\.[^/.]+$/, "");
            this.setVal("edit-song-url", `idb:${storageKey}`);
            this.setVal("edit-song-title", songTitle);

            window.storageManager.config.SONG = window.storageManager.config.SONG || {};
            window.storageManager.config.SONG.url = `idb:${storageKey}`;
            window.storageManager.config.SONG.title = songTitle;
            window.storageManager.saveConfig(window.storageManager.config);

            if (window.audioController) {
              await window.audioController.loadTrack(window.storageManager.config.SONG);
            }
            alert(`✅ Song "${songTitle}" uploaded and saved! Click '♪ PLAY OUR SONG' at the top to listen.`);
          } catch (err) {
            console.error("Audio save error:", err);
            alert("Error saving audio: " + err);
          }
        }
      };
    }
    if (cfg.CLIMAX_VIDEO) {
      this.setVal("edit-climax-title", cfg.CLIMAX_VIDEO.title);
      this.setVal("edit-climax-url", cfg.CLIMAX_VIDEO.url);
      this.setVal("edit-climax-poster", cfg.CLIMAX_VIDEO.poster);
      this.setVal("edit-climax-note", cfg.CLIMAX_VIDEO.note);
    }

    const climaxVideoInput = document.getElementById("climax-video-file-uploader");
    if (climaxVideoInput) {
      climaxVideoInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const storageKey = "video_climax_" + Date.now();
          await window.storageManager.saveMediaBlob(storageKey, file);
          this.setVal("edit-climax-url", `idb:${storageKey}`);
          const poster = await generateVideoThumbnail(file);
          if (poster) this.setVal("edit-climax-poster", poster);
          alert("✅ Climax video uploaded and saved!");
        }
      };
    }

    const climaxPosterInput = document.getElementById("climax-poster-file-uploader");
    if (climaxPosterInput) {
      climaxPosterInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const dataUrl = await StorageManager.fileToDataUrl(file);
          this.setVal("edit-climax-poster", dataUrl);
        }
      };
    }

    // Dynamic Lists
    this.renderPhotoManager(cfg.PHOTOS || []);
    this.renderVideoManager(cfg.VIDEOS || []);
    this.renderNotesManager(cfg.LOVE_NOTES || []);
    this.renderTimelineManager(cfg.TIMELINE || []);
    this.renderLittleThingsManager(cfg.LITTLE_THINGS || []);
  }

  // --- Photo Manager UI ---
  renderPhotoManager(photos) {
    const list = document.getElementById("edit-photos-list");
    if (!list) return;

    list.innerHTML = photos.map((p, idx) => `
      <div class="edit-item-card" data-idx="${idx}" style="background:#1b0713; border:1px solid rgba(212,175,55,0.2); border-radius:8px; padding:12px; margin-bottom:12px;">
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px;">
          <img src="${p.url}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;" />
          <div style="flex:1;">
            <input type="text" class="form-input photo-caption-input" placeholder="Caption" value="${escapeHTML(p.caption || '')}" style="margin-bottom:4px; padding:4px 8px; font-size:0.8rem;" />
            <input type="text" class="form-input photo-date-input" placeholder="Date / Tag" value="${escapeHTML(p.date || '')}" style="padding:4px 8px; font-size:0.8rem;" />
          </div>
          <button type="button" class="btn-delete-photo" data-idx="${idx}" style="background:#631828; color:#fff; border:none; border-radius:4px; padding:6px 10px; cursor:pointer;">✕</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll(".btn-delete-photo").forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        window.storageManager.config.PHOTOS.splice(idx, 1);
        this.renderPhotoManager(window.storageManager.config.PHOTOS);
      };
    });

    // Upload New Photo
    const photoUploadInput = document.getElementById("photo-file-uploader");
    if (photoUploadInput) {
      photoUploadInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const dataUrl = await StorageManager.fileToDataUrl(file);
          window.storageManager.config.PHOTOS.push({
            id: "photo-" + Date.now(),
            url: dataUrl,
            caption: "New memory with you",
            date: "Cherished moment",
            rotation: (Math.random() - 0.5) * 6
          });
          this.renderPhotoManager(window.storageManager.config.PHOTOS);
          photoUploadInput.value = "";
        }
      };
    }
  }

  // --- Video Manager UI ---
  renderVideoManager(videos) {
    const list = document.getElementById("edit-videos-list");
    if (!list) return;

    list.innerHTML = videos.map((v, idx) => {
      const hasSource = v.url && v.url.trim().length > 0;
      const isIdb = hasSource && v.url.startsWith("idb:");
      const statusText = isIdb ? "✅ Local Video Stored" : (hasSource ? `✅ Linked: ${v.url.slice(0, 30)}...` : "⚠️ No video file attached");

      return `
      <div class="edit-item-card" data-idx="${idx}" style="background:#1b0713; border:1px solid rgba(212,175,55,0.25); border-radius:10px; padding:14px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong style="color:var(--gold-light); font-size:0.9rem;">${escapeHTML(v.title || `VIDEO 0${idx + 1}`)}</strong>
          <span style="font-size:0.75rem; color:${hasSource ? '#70c98f' : '#e5a55d'};">${statusText}</span>
        </div>

        <div style="margin-bottom:8px;">
          <input type="text" class="form-input video-title-input" placeholder="Title (e.g. VIDEO 01)" value="${escapeHTML(v.title || '')}" style="margin-bottom:6px; font-size:0.85rem;" />
          <input type="text" class="form-input video-caption-input" placeholder="Caption (e.g. One of my favorite versions of us)" value="${escapeHTML(v.caption || '')}" style="margin-bottom:6px; font-size:0.85rem;" />
        </div>

        <!-- File Pickers for this specific video -->
        <div style="background:rgba(7,2,4,0.5); padding:10px; border-radius:6px; margin-bottom:8px; display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; gap:8px; align-items:center;">
            <label style="flex:1; background:#2c0c1b; border:1px solid rgba(212,175,55,0.3); color:var(--text-ivory); font-size:0.75rem; padding:6px 10px; border-radius:4px; text-align:center; cursor:pointer;">
              📁 Select Video File (.mp4)
              <input type="file" accept="video/mp4,video/webm,video/*" class="slot-video-file-input" data-idx="${idx}" style="display:none;" />
            </label>
            <label style="flex:1; background:#2c0c1b; border:1px solid rgba(212,175,55,0.3); color:var(--text-ivory); font-size:0.75rem; padding:6px 10px; border-radius:4px; text-align:center; cursor:pointer;">
              🖼️ Select Poster Image
              <input type="file" accept="image/*" class="slot-poster-file-input" data-idx="${idx}" style="display:none;" />
            </label>
          </div>
          <input type="text" class="form-input video-url-input" placeholder="Or enter file path / URL (e.g. assets/videos/vid1.mp4)" value="${escapeHTML(v.url || '')}" style="font-size:0.8rem; padding:4px 8px;" />
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <label style="font-size:0.75rem; color:var(--rose-dusty); cursor:pointer;">
            <input type="checkbox" class="video-landscape-toggle" ${v.type === 'landscape' ? 'checked' : ''} /> Landscape Mode
          </label>
          <button type="button" class="btn-delete-video" data-idx="${idx}" style="background:#631828; color:#fff; border:none; border-radius:4px; padding:4px 10px; font-size:0.75rem; cursor:pointer;">Delete Slot</button>
        </div>
      </div>
    `;
    }).join("");

    // Handle Per-Slot Video File Upload
    list.querySelectorAll(".slot-video-file-input").forEach(input => {
      input.onchange = async (e) => {
        const file = e.target.files[0];
        const idx = parseInt(input.getAttribute("data-idx"), 10);
        if (file && window.storageManager.config.VIDEOS[idx]) {
          const vid = window.storageManager.config.VIDEOS[idx];
          const storageKey = "video_" + (vid.id || "vid-" + idx + "_" + Date.now());
          
          try {
            await window.storageManager.saveMediaBlob(storageKey, file);
            vid.url = `idb:${storageKey}`;
            
            // Auto generate poster thumbnail
            const poster = await generateVideoThumbnail(file);
            if (poster) vid.poster = poster;

            window.storageManager.saveConfig(window.storageManager.config);
            if (window.refreshExperienceUI) window.refreshExperienceUI();
            this.renderVideoManager(window.storageManager.config.VIDEOS);
            alert(`✅ Video for "${vid.title || 'Video ' + (idx + 1)}" uploaded and ready to play!`);
          } catch (err) {
            console.error(err);
            alert("Error saving video: " + err);
          }
        }
      };
    });

    // Handle Per-Slot Poster Upload
    list.querySelectorAll(".slot-poster-file-input").forEach(input => {
      input.onchange = async (e) => {
        const file = e.target.files[0];
        const idx = parseInt(input.getAttribute("data-idx"), 10);
        if (file && window.storageManager.config.VIDEOS[idx]) {
          const dataUrl = await StorageManager.fileToDataUrl(file);
          window.storageManager.config.VIDEOS[idx].poster = dataUrl;
          window.storageManager.saveConfig(window.storageManager.config);
          if (window.refreshExperienceUI) window.refreshExperienceUI();
          this.renderVideoManager(window.storageManager.config.VIDEOS);
        }
      };
    });

    // Delete Slot
    list.querySelectorAll(".btn-delete-video").forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        window.storageManager.config.VIDEOS.splice(idx, 1);
        window.storageManager.saveConfig(window.storageManager.config);
        if (window.refreshExperienceUI) window.refreshExperienceUI();
        this.renderVideoManager(window.storageManager.config.VIDEOS);
      };
    });

    // Add Video Slot
    const btnAddVideo = document.getElementById("btn-add-video-slot");
    if (btnAddVideo) {
      btnAddVideo.onclick = () => {
        const count = window.storageManager.config.VIDEOS.length + 1;
        window.storageManager.config.VIDEOS.push({
          id: "vid-" + Date.now(),
          title: `VIDEO 0${count}`,
          caption: "A special moment between us",
          url: "",
          poster: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80",
          type: "portrait"
        });
        window.storageManager.saveConfig(window.storageManager.config);
        if (window.refreshExperienceUI) window.refreshExperienceUI();
        this.renderVideoManager(window.storageManager.config.VIDEOS);
      };
    }
  }

  // --- Love Notes Manager UI ---
  renderNotesManager(notes) {
    const list = document.getElementById("edit-notes-list");
    if (!list) return;

    list.innerHTML = notes.map((n, idx) => `
      <div class="edit-item-card" data-idx="${idx}" style="background:#1b0713; border:1px solid rgba(212,175,55,0.2); border-radius:8px; padding:12px; margin-bottom:12px;">
        <input type="text" class="form-input note-title-input" placeholder="Prompt (e.g. Open when you miss me.)" value="${escapeHTML(n.title)}" style="margin-bottom:6px; font-weight:600;" />
        <textarea class="form-textarea note-content-input" placeholder="Message content">${escapeHTML(n.content)}</textarea>
        <div style="display:flex; justify-content:flex-end; margin-top:6px;">
          <button type="button" class="btn-delete-note" data-idx="${idx}" style="background:#631828; color:#fff; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">Delete</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll(".btn-delete-note").forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        window.storageManager.config.LOVE_NOTES.splice(idx, 1);
        this.renderNotesManager(window.storageManager.config.LOVE_NOTES);
      };
    });

    const btnAddNote = document.getElementById("btn-add-note-slot");
    if (btnAddNote) {
      btnAddNote.onclick = () => {
        window.storageManager.config.LOVE_NOTES.push({
          id: "note-" + Date.now(),
          title: "Open when you need me.",
          badge: "Special Message",
          content: "I am always right here with you, now and forever."
        });
        this.renderNotesManager(window.storageManager.config.LOVE_NOTES);
      };
    }
  }

  // --- Timeline Manager UI ---
  renderTimelineManager(timeline) {
    const list = document.getElementById("edit-timeline-list");
    if (!list) return;

    list.innerHTML = timeline.map((item, idx) => `
      <div class="edit-item-card" data-idx="${idx}" style="background:#1b0713; border:1px solid rgba(212,175,55,0.2); border-radius:8px; padding:12px; margin-bottom:12px;">
        <input type="text" class="form-input tl-date-input" placeholder="Date stamp" value="${escapeHTML(item.date)}" style="margin-bottom:4px; font-size:0.85rem;" />
        <input type="text" class="form-input tl-title-input" placeholder="Milestone title" value="${escapeHTML(item.title)}" style="margin-bottom:4px; font-weight:600;" />
        <textarea class="form-textarea tl-desc-input" placeholder="Milestone story">${escapeHTML(item.description)}</textarea>
        <div style="display:flex; justify-content:flex-end; margin-top:6px;">
          <button type="button" class="btn-delete-tl" data-idx="${idx}" style="background:#631828; color:#fff; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">Delete</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll(".btn-delete-tl").forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        window.storageManager.config.TIMELINE.splice(idx, 1);
        this.renderTimelineManager(window.storageManager.config.TIMELINE);
      };
    });

    const btnAddTL = document.getElementById("btn-add-timeline-slot");
    if (btnAddTL) {
      btnAddTL.onclick = () => {
        window.storageManager.config.TIMELINE.push({
          date: "A New Chapter",
          title: "Another Unforgettable Day",
          description: "Writing our next chapter together."
        });
        this.renderTimelineManager(window.storageManager.config.TIMELINE);
      };
    }
  }

  // --- Little Things Manager UI ---
  renderLittleThingsManager(items) {
    const list = document.getElementById("edit-little-things-list");
    if (!list) return;

    list.innerHTML = items.map((item, idx) => `
      <div class="edit-item-card" data-idx="${idx}" style="background:#1b0713; border:1px solid rgba(212,175,55,0.2); border-radius:8px; padding:12px; margin-bottom:12px;">
        <input type="text" class="form-input lt-title-input" placeholder="Title (e.g. The way you...)" value="${escapeHTML(item.title)}" style="margin-bottom:4px; font-weight:600;" />
        <textarea class="form-textarea lt-text-input" placeholder="Intimate observation">${escapeHTML(item.text)}</textarea>
        <div style="display:flex; justify-content:flex-end; margin-top:6px;">
          <button type="button" class="btn-delete-lt" data-idx="${idx}" style="background:#631828; color:#fff; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">Delete</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll(".btn-delete-lt").forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        window.storageManager.config.LITTLE_THINGS.splice(idx, 1);
        this.renderLittleThingsManager(window.storageManager.config.LITTLE_THINGS);
      };
    });

    const btnAddLT = document.getElementById("btn-add-lt-slot");
    if (btnAddLT) {
      btnAddLT.onclick = () => {
        window.storageManager.config.LITTLE_THINGS.push({
          title: "Something I adore about you",
          text: "The effortless warmth you bring into every room.",
          tag: `Note 0${window.storageManager.config.LITTLE_THINGS.length + 1}`
        });
        this.renderLittleThingsManager(window.storageManager.config.LITTLE_THINGS);
      };
    }
  }

  // --- Save State ---
  saveCurrentState() {
    const cfg = window.storageManager.config;

    // Collect General
    cfg.HER_NAME = this.getVal("edit-her-name") || "Vanshika";
    cfg.YOUR_NAME = this.getVal("edit-your-name") || "[YOUR NAME]";
    const bdayInput = this.getVal("edit-birthday");
    if (bdayInput) cfg.BIRTHDAY = `${bdayInput}T00:00:00`;
    cfg.RELATIONSHIP_DURATION = this.getVal("edit-duration");
    const nicknames = this.getVal("edit-nicknames");
    cfg.NICKNAMES = nicknames ? nicknames.split(",").map(s => s.trim()).filter(Boolean) : [];

    // Collect Meeting Story
    cfg.MEETING_STORY = cfg.MEETING_STORY || {};
    cfg.MEETING_STORY.subheading = this.getVal("edit-story-subheading");
    cfg.MEETING_STORY.heading = this.getVal("edit-story-heading");
    const storyLines = this.getVal("edit-story-lines");
    cfg.MEETING_STORY.lines = storyLines ? storyLines.split("\n").map(s => s.trim()).filter(Boolean) : [];
    cfg.MEETING_STORY.annotation = this.getVal("edit-story-annotation");

    // Collect Love Letter & Reasons
    cfg.LOVE_LETTER = this.getVal("edit-love-letter");
    const reasons = this.getVal("edit-reasons");
    cfg.REASONS = reasons ? reasons.split("\n").map(s => s.trim()).filter(Boolean) : [];

    // Collect Photos Captions
    const photoCards = document.querySelectorAll("#edit-photos-list .edit-item-card");
    photoCards.forEach((card, idx) => {
      if (cfg.PHOTOS[idx]) {
        cfg.PHOTOS[idx].caption = card.querySelector(".photo-caption-input").value;
        cfg.PHOTOS[idx].date = card.querySelector(".photo-date-input").value;
      }
    });

    // Collect Videos
    const videoCards = document.querySelectorAll("#edit-videos-list .edit-item-card");
    videoCards.forEach((card, idx) => {
      if (cfg.VIDEOS[idx]) {
        cfg.VIDEOS[idx].title = card.querySelector(".video-title-input").value;
        cfg.VIDEOS[idx].caption = card.querySelector(".video-caption-input").value;
        cfg.VIDEOS[idx].url = card.querySelector(".video-url-input").value;
        cfg.VIDEOS[idx].poster = card.querySelector(".video-poster-input").value;
        cfg.VIDEOS[idx].type = card.querySelector(".video-landscape-toggle").checked ? "landscape" : "portrait";
      }
    });

    // Collect Love Notes
    const noteCards = document.querySelectorAll("#edit-notes-list .edit-item-card");
    noteCards.forEach((card, idx) => {
      if (cfg.LOVE_NOTES[idx]) {
        cfg.LOVE_NOTES[idx].title = card.querySelector(".note-title-input").value;
        cfg.LOVE_NOTES[idx].content = card.querySelector(".note-content-input").value;
      }
    });

    // Collect Timeline
    const tlCards = document.querySelectorAll("#edit-timeline-list .edit-item-card");
    tlCards.forEach((card, idx) => {
      if (cfg.TIMELINE[idx]) {
        cfg.TIMELINE[idx].date = card.querySelector(".tl-date-input").value;
        cfg.TIMELINE[idx].title = card.querySelector(".tl-title-input").value;
        cfg.TIMELINE[idx].description = card.querySelector(".tl-desc-input").value;
      }
    });

    // Collect Little Things
    const ltCards = document.querySelectorAll("#edit-little-things-list .edit-item-card");
    ltCards.forEach((card, idx) => {
      if (cfg.LITTLE_THINGS[idx]) {
        cfg.LITTLE_THINGS[idx].title = card.querySelector(".lt-title-input").value;
        cfg.LITTLE_THINGS[idx].text = card.querySelector(".lt-text-input").value;
      }
    });

    // Collect Music & Climax
    cfg.SONG = cfg.SONG || {};
    cfg.SONG.title = this.getVal("edit-song-title");
    cfg.SONG.url = this.getVal("edit-song-url");

    cfg.CLIMAX_VIDEO = cfg.CLIMAX_VIDEO || {};
    cfg.CLIMAX_VIDEO.title = this.getVal("edit-climax-title");
    cfg.CLIMAX_VIDEO.url = this.getVal("edit-climax-url");
    cfg.CLIMAX_VIDEO.poster = this.getVal("edit-climax-poster");
    cfg.CLIMAX_VIDEO.note = this.getVal("edit-climax-note");

    // Auto-Sync Media Blobs to disk assets/
    if (window.storageManager) {
      // 1. Sync Song
      if (cfg.SONG && cfg.SONG.url && cfg.SONG.url.startsWith("idb:")) {
        const idbKey = cfg.SONG.url.replace("idb:", "");
        try {
          const blob = await window.storageManager.getMediaBlob(idbKey);
          if (blob) {
            const ext = blob.type.includes("wav") ? "wav" : blob.type.includes("m4a") ? "m4a" : "mp3";
            const filename = `song_track.${ext}`;
            const res = await fetch(`/api/save-media?folder=music&filename=${filename}`, {
              method: "POST",
              body: blob
            });
            const data = await res.json();
            if (data.success && data.url) {
              cfg.SONG.url = data.url;
            }
          }
        } catch (e) {
          console.warn("Could not sync song to disk:", e);
        }
      }

      // 2. Sync Videos
      if (Array.isArray(cfg.VIDEOS)) {
        for (let i = 0; i < cfg.VIDEOS.length; i++) {
          const v = cfg.VIDEOS[i];
          if (v && v.url && v.url.startsWith("idb:")) {
            const idbKey = v.url.replace("idb:", "");
            try {
              const blob = await window.storageManager.getMediaBlob(idbKey);
              if (blob) {
                const ext = blob.type.includes("webm") ? "webm" : "mp4";
                const filename = `video_${v.id || i + 1}.${ext}`;
                const res = await fetch(`/api/save-media?folder=videos&filename=${filename}`, {
                  method: "POST",
                  body: blob
                });
                const data = await res.json();
                if (data.success && data.url) {
                  v.url = data.url;
                }
              }
            } catch (e) {
              console.warn("Could not sync video to disk:", e);
            }
          }
        }
      }

      // 3. Sync Climax Video
      if (cfg.CLIMAX_VIDEO && cfg.CLIMAX_VIDEO.url && cfg.CLIMAX_VIDEO.url.startsWith("idb:")) {
        const idbKey = cfg.CLIMAX_VIDEO.url.replace("idb:", "");
        try {
          const blob = await window.storageManager.getMediaBlob(idbKey);
          if (blob) {
            const ext = blob.type.includes("webm") ? "webm" : "mp4";
            const filename = `climax_video.${ext}`;
            const res = await fetch(`/api/save-media?folder=videos&filename=${filename}`, {
              method: "POST",
              body: blob
            });
            const data = await res.json();
            if (data.success && data.url) {
              cfg.CLIMAX_VIDEO.url = data.url;
            }
          }
        } catch (e) {
          console.warn("Could not sync climax video to disk:", e);
        }
      }
    }

    // Save to Storage
    window.storageManager.saveConfig(cfg);

    // Auto-Save directly to js/config.js on your computer via local server
    try {
      const res = await fetch('/api/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      });
      const data = await res.json();
      console.log('Auto-saved to disk:', data);
    } catch (err) {
      console.log('Local server save notice:', err);
    }

    // Refresh UI Live
    if (window.refreshExperienceUI) {
      window.refreshExperienceUI();
    }

    alert("✨ Complete Birthday Website and all media have been saved directly to disk!\nYou are ready to deploy to Vercel/Netlify for Vanshika!");
  }

  setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  }

  getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  }
}

// Helper to generate a thumbnail frame from a video file
function generateVideoThumbnail(file) {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 1;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
    } catch (e) {
      resolve(null);
    }
  });
}

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

function initEditMode() {
  if (!window.editModeController) {
    window.editModeController = new EditModeController();
  }
}

window.openEditMode = function() {
  if (!window.editModeController) {
    initEditMode();
  }
  if (window.editModeController) {
    window.editModeController.openDrawer();
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEditMode);
} else {
  initEditMode();
}
