(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const dots = [...document.querySelectorAll(".dot")];
  const progressBar = document.getElementById("progressBar");
  const slideLabel = document.getElementById("slideLabel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const startBtn = document.getElementById("startBtn");
  const hint = document.getElementById("hint");
  const pdfBtn = document.getElementById("pdfBtn");
  let current = 0;

  const dict = () => window.APC_I18N || {};
  const STORAGE_KEY = "apc-bulletin-lang";
  let activeLang = "en";

  const lookup = (lang, path) => {
    const parts = path.split(".");
    let node = dict()[lang];
    for (const part of parts) {
      if (node == null) return null;
      node = node[part];
    }
    return node;
  };

  const applyLanguage = (lang) => {
    const packs = dict();
    const pack = packs[lang] || packs.en;
    if (!pack) return;
    activeLang = lang;
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const value = lookup(lang, el.dataset.i18n);
      if (typeof value === "string") el.textContent = value;
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const value = lookup(lang, el.dataset.i18nHtml);
      if (typeof value === "string") el.innerHTML = value;
    });

    document.querySelectorAll("[data-i18n-content]").forEach((el) => {
      const value = lookup(lang, el.dataset.i18nContent);
      if (typeof value === "string") el.setAttribute("content", value);
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      const value = lookup(lang, el.dataset.i18nAlt);
      if (typeof value === "string") el.setAttribute("alt", value);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const value = lookup(lang, el.dataset.i18nAria);
      if (typeof value === "string") el.setAttribute("aria-label", value);
    });

    document.querySelectorAll("[data-i18n-aria-dot]").forEach((el) => {
      const idx = Number(el.dataset.i18nAriaDot);
      const label = pack.dots?.[idx];
      if (typeof label === "string") el.setAttribute("aria-label", label);
    });

    const titleEl = document.querySelector("title[data-i18n]");
    if (titleEl && pack.meta?.title) titleEl.textContent = pack.meta.title;

    document.querySelectorAll(".lang__btn").forEach((btn) => {
      const active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  };

  const preferredLang = () => {
    const packs = dict();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && packs[saved]) return saved;
    } catch {
      /* ignore */
    }
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("es")) return "es";
    return "en";
  };

  applyLanguage(preferredLang());

  document.querySelector(".chrome__nav")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang__btn");
    if (!btn) return;
    const lang = btn.getAttribute("data-lang");
    if (lang && dict()[lang]) applyLanguage(lang);
  });

  const downloadPdf = () => {
    if (!pdfBtn || pdfBtn.disabled) return;
    const pack = dict()[activeLang] || dict().en || {};
    const filename = pack.meta?.pdfFilename || "Costambar-Bulletin";
    const previousTitle = document.title;
    slides.forEach((slide) => slide.classList.add("is-visible"));
    document.title = filename;
    pdfBtn.disabled = true;

    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      document.title = previousTitle;
      pdfBtn.disabled = false;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
    setTimeout(restore, 1500);
  };

  pdfBtn?.addEventListener("click", downloadPdf);

  const goTo = (index, { smooth = true } = {}) => {
    const i = Math.max(0, Math.min(slides.length - 1, index));
    current = i;
    const top = slides[i].offsetTop;
    window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
    updateUI();
    history.replaceState(null, "", `#slide-${i}`);
  };

  const updateUI = () => {
    const total = slides.length;
    progressBar.style.width = `${((current + 1) / total) * 100}%`;
    slideLabel.textContent = `${String(current + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    dots.forEach((dot, i) => {
      const active = i === current;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      let best = null;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
        if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) {
          best = entry;
        }
      });
      if (best && best.intersectionRatio >= 0.45) {
        const idx = slides.indexOf(best.target);
        if (idx !== -1) {
          current = idx;
          updateUI();
          history.replaceState(null, "", `#slide-${idx}`);
        }
      }
    },
    { threshold: [0.45, 0.6, 0.75] }
  );

  slides.forEach((s) => observer.observe(s));
  slides[0]?.classList.add("is-visible");
  updateUI();

  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => goTo(current + 1));
  startBtn?.addEventListener("click", () => goTo(1));
  dots.forEach((dot) => {
    dot.addEventListener("click", () => goTo(Number(dot.dataset.slide)));
  });

  window.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " " || e.key === "ArrowRight") {
      e.preventDefault();
      goTo(current + 1);
    } else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(current - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(slides.length - 1);
    }
  });

  let touchY = null;
  window.addEventListener(
    "touchstart",
    (e) => {
      touchY = e.changedTouches[0].screenY;
    },
    { passive: true }
  );
  window.addEventListener(
    "touchend",
    (e) => {
      if (touchY == null) return;
      const dy = touchY - e.changedTouches[0].screenY;
      if (Math.abs(dy) > 60) {
        goTo(current + (dy > 0 ? 1 : -1));
      }
      touchY = null;
    },
    { passive: true }
  );

  const hideHint = () => {
    hint?.classList.add("is-hidden");
    window.removeEventListener("wheel", hideHint);
    window.removeEventListener("keydown", hideHint);
    window.removeEventListener("touchstart", hideHint);
  };
  window.addEventListener("wheel", hideHint, { once: true, passive: true });
  window.addEventListener("keydown", hideHint, { once: true });
  window.addEventListener("touchstart", hideHint, { once: true, passive: true });
  setTimeout(() => hint?.classList.add("is-hidden"), 6000);

  let wheelLock = false;
  window.addEventListener(
    "wheel",
    (e) => {
      if (wheelLock) {
        e.preventDefault();
        return;
      }
      if (Math.abs(e.deltaY) < 40) return;
    },
    { passive: false }
  );

  if (location.hash) {
    const el = document.querySelector(location.hash);
    const idx = slides.indexOf(el);
    if (idx >= 0) {
      requestAnimationFrame(() => goTo(idx, { smooth: false }));
    }
  }
})();
