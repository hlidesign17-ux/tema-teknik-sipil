document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("wedding-app");
  let audioPlayer = null;
  let musicBtn = null;

  // 1. Memuat file data.json
  fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
      renderSections(data.sections);
      initAudioPlayer(data.musicUrl);
      initIntersectionObserver();
      initFullscreenHint(); // Memanggil Petunjuk Fullscreen
    })
    .catch((error) => console.error("Error memuat data.json:", error));

  // 2. Overlay Notifikasi Petunjuk Fullscreen untuk Perangkat Mobile & Touch
  function initFullscreenHint() {
    // Deteksi apakah dibuka di layar kecil ATAU perangkat layar sentuh (Mobile/Tablet)
    const isMobileDevice =
      window.innerWidth <= 768 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;

    if (isMobileDevice) {
      const hintOverlay = document.createElement("div");
      hintOverlay.id = "fullscreen-hint";
      hintOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100dvh;
        background: rgba(0, 0, 0, 0.82);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #ffffff;
        text-align: center;
        padding: 20px;
        cursor: pointer;
        transition: opacity 0.4s ease, visibility 0.4s ease;
      `;

      hintOverlay.innerHTML = `
        <div style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.25); padding: 28px 20px; border-radius: 24px; max-width: 310px; box-shadow: 0 15px 35px rgba(0,0,0,0.6); text-align: center;">
          <div style="font-size: 42px; margin-bottom: 14px; animation: bounceHint 1.4s infinite ease-in-out;">👆</div>
          <h3 style="margin: 0 0 8px 0; font-size: 17px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">Undangan Pernikahan</h3>
          <p style="margin: 0 0 18px 0; font-size: 13px; color: #e4e4e7; line-height: 1.5;">Ketuk layar untuk membuka dalam tampilan Layar Penuh & memutar musik.</p>
          <div style="display: inline-block; background: #d32f2f; color: #fff; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600;">Buka Undangan</div>
        </div>
      `;

      document.body.appendChild(hintOverlay);

      const handleUserTouch = (e) => {
        e.preventDefault();

        // Mengaktifkan Mode Fullscreen Browser
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        }

        // Animasi Menghilangkan Overlay
        hintOverlay.style.opacity = "0";
        hintOverlay.style.visibility = "hidden";
        setTimeout(() => hintOverlay.remove(), 400);

        // Memutar Musik Otomatis Setelah Sentuhan Tamu
        if (audioPlayer && audioPlayer.paused) {
          audioPlayer
            .play()
            .then(() => {
              if (musicBtn) musicBtn.classList.add("playing");
            })
            .catch(() => {});
        }
      };

      hintOverlay.addEventListener("click", handleUserTouch, { once: true });
      hintOverlay.addEventListener("touchstart", handleUserTouch, {
        once: true,
      });
    }
  }

  // 3. Audio Player
  function initAudioPlayer(musicUrl) {
    if (!musicUrl) return;

    audioPlayer = new Audio(musicUrl);
    audioPlayer.loop = true;

    musicBtn = document.createElement("button");
    musicBtn.className = "music-btn";
    musicBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;
    musicBtn.title = "Matikan / Putar Musik";
    document.body.appendChild(musicBtn);

    musicBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (audioPlayer.paused) {
        audioPlayer.play();
        musicBtn.classList.add("playing");
      } else {
        audioPlayer.pause();
        musicBtn.classList.remove("playing");
      }
    });
  }

  // 4. Merender Elemen HTML dari JSON
  function renderSections(sections) {
    container.innerHTML = "";

    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get("to") || urlParams.get("nama");

    sections.forEach((sec) => {
      const sectionEl = document.createElement("section");
      sectionEl.id = sec.id;
      sectionEl.className = "wedding-section";

      const bgEffect = sec.bgEffect || (sec.bgBreathe ? "breathe" : "none");
      sectionEl.dataset.bgEffect = bgEffect;
      sectionEl.dataset.breatheDuration = sec.breatheDuration || 12;

      // Logika Render Glass Box
      let glassBoxHtml = "";
      if (sec.glassBox && sec.glassBox.enabled) {
        const g = sec.glassBox;
        const w = g.width || 320;
        const h = g.height || 200;
        const x = g.transformX || 0;
        const y = g.transformY || 0;
        const r = g.borderRadius !== undefined ? g.borderRadius : 12;
        const op = g.opacity !== undefined ? g.opacity / 100 : 0.82;

        const glassStyle = `width: ${w}px; height: ${h}px; margin-left: -${w / 2}px; margin-top: -${h / 2}px; border-radius: ${r}px; background: rgba(247, 244, 238, ${op}); transform: translate3d(${x}px, ${y}px, 0);`;
        glassBoxHtml = `<div class="glass-box" style="${glassStyle}"></div>`;
      }

      let elementsHtml = "";

      if (sec.content) {
        sec.content.forEach((item) => {
          const animAttr = `data-anim="${item.animation?.type || "fade-up"}" data-delay="${item.animation?.delay || 0}" data-duration="${item.animation?.duration || 800}"`;

          const fontSizeStyle = item.style?.fontSize
            ? `font-size: ${item.style.fontSize};`
            : "";
          const fontFamilyStyle = item.style?.fontFamily
            ? `font-family: ${item.style.fontFamily};`
            : "";
          const colorStyle = item.style?.color
            ? `color: ${item.style.color};`
            : "";

          const transformStyle = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) translate3d(${item.transformX || 0}px, ${item.transformY || 0}px, 0) rotate(${item.rotate || 0}deg); ${fontSizeStyle} ${fontFamilyStyle} ${colorStyle} width: max-content; max-width: 90%; text-align: center; z-index: 2; margin: 0;`;

          let contentText = item.text;
          if (item.id === "s1-footer") {
            if (guestName) {
              contentText = `Kepada Yth. Bapak/Ibu/Saudara/i<br><strong style="font-size: 1.2em; display: inline-block; margin-top: 4px;">${decodeURIComponent(guestName)}</strong>`;
            } else {
              contentText = item.text;
            }
          }

          if (item.type === "button") {
            const btnClass = item.id.includes("map") ? "map-btn" : "social-btn";
            const targetUrl =
              item.url ||
              (item.id.includes("map") ? "#map" : "https://instagram.com");
            elementsHtml += `<a href="${targetUrl}" target="_blank" class="animated-element ${btnClass}" style="${transformStyle}" ${animAttr}>${contentText}</a>`;
          } else if (item.type === "info_item") {
            elementsHtml += `
              <div class="animated-element info-item" style="${transformStyle}" ${animAttr}>
                <span class="info-icon">${item.icon}</span>
                <span>${contentText}</span>
              </div>`;
          } else {
            const cssClass = getItemClass(item.id);
            elementsHtml += `<div class="animated-element ${cssClass}" style="${transformStyle}" ${animAttr}>${contentText}</div>`;
          }
        });
      }

      if (sec.icons) {
        sec.icons.forEach((ic) => {
          const transformStyle = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) translate3d(${ic.transformX || 0}px, ${ic.transformY || 0}px, 0) rotate(${ic.rotate || 0}deg); color: ${ic.color || ic.style?.color || "#D32F2F"}; z-index: 3; margin: 0;`;

          elementsHtml += `<span class="animated-element icon-heart" style="${transformStyle}" data-anim="${ic.animation.type}" data-delay="${ic.animation.delay}">${ic.symbol}</span>`;
        });
      }

      sectionEl.innerHTML = `
        ${glassBoxHtml}
        ${elementsHtml}
      `;

      container.appendChild(sectionEl);
    });
  }

  function getItemClass(id) {
    if (id.includes("sub") || id.includes("header")) return "sub-header";
    if (id.includes("main")) return "main-title";
    if (id.includes("title")) return "section-title";
    if (id.includes("name")) return "name-title";
    if (id.includes("tag") || id.includes("badge")) return "accent-text";
    if (id.includes("body")) return "body-text";
    if (id.includes("quote")) return "quote-text";
    if (id.includes("parent")) return "parent-text";
    if (id.includes("footer")) return "footer-text";
    if (id.includes("amp")) return "ampersand";
    return "";
  }

  // 5. Animasi Scroll Observer
  function initIntersectionObserver() {
    const observerOptions = {
      root: container,
      rootMargin: "0px",
      threshold: 0.2,
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const section = entry.target;
        const animatedElements = section.querySelectorAll(".animated-element");
        const bgEffect = section.dataset.bgEffect || "none";

        if (entry.isIntersecting) {
          section.classList.add("bg-in-view");

          if (bgEffect !== "none") {
            section.style.setProperty(
              "--breathe-duration",
              `${section.dataset.breatheDuration || 12}s`,
            );
            section.classList.add(`bg-effect-${bgEffect}`);
          }

          animatedElements.forEach((el, index) => {
            const baseDelay = parseInt(el.getAttribute("data-delay")) || 0;
            const finalDelay = baseDelay + index * 80;
            const duration = el.getAttribute("data-duration") || 950;

            el.style.transitionDuration = `${duration}ms`;
            el.style.transitionDelay = `${finalDelay}ms`;

            requestAnimationFrame(() => el.classList.add("in-view"));
          });
        } else {
          section.classList.remove("bg-in-view");
          section.classList.remove(
            "bg-effect-breathe",
            "bg-effect-zoom-in",
            "bg-effect-pan-left",
            "bg-effect-pan-up",
            "bg-breathe-active",
          );

          animatedElements.forEach((el) => {
            el.style.transitionDelay = "0ms";
            el.style.transitionDuration = "400ms";
            el.classList.remove("in-view");
          });
        }
      });
    }, observerOptions);

    document
      .querySelectorAll(".wedding-section")
      .forEach((sec) => sectionObserver.observe(sec));
  }
});
