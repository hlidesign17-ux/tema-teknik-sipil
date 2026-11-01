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
    })
    .catch((error) => console.error("Error memuat data.json:", error));

  // 2. Audio Player
  function initAudioPlayer(musicUrl) {
    if (!musicUrl) return;

    audioPlayer = new Audio(musicUrl);
    audioPlayer.loop = true;

    musicBtn = document.createElement("button");
    musicBtn.className = "music-btn";
    musicBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;
    musicBtn.title = "Matikan / Putar Musik";
    document.body.appendChild(musicBtn);

    const playPromise = audioPlayer.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          musicBtn.classList.add("playing");
        })
        .catch(() => {
          const enableAudioOnInteraction = () => {
            audioPlayer.play().then(() => {
              musicBtn.classList.add("playing");
            });
            window.removeEventListener("click", enableAudioOnInteraction);
            window.removeEventListener("touchstart", enableAudioOnInteraction);
            window.removeEventListener("scroll", enableAudioOnInteraction);
          };

          window.addEventListener("click", enableAudioOnInteraction);
          window.addEventListener("touchstart", enableAudioOnInteraction);
          window.addEventListener("scroll", enableAudioOnInteraction);
        });
    }

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

  // 3. Merender Elemen HTML dari JSON
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

          // SETIAP ELEMEN DIGUNAKAN POSISI MANDIRI SECARA ABSOLUT PUSAT
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

  // 4. Animasi Scroll Observer
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
