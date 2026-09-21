(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const dots = [...document.querySelectorAll(".dot")];
  const progressBar = document.getElementById("progressBar");
  const slideLabel = document.getElementById("slideLabel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const startBtn = document.getElementById("startBtn");
  const hint = document.getElementById("hint");
  let current = 0;
  let scrolling = false;

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

  // Touch swipe (vertical)
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

  // Hide hint after first interaction
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

  // Prevent scroll chaining chaos when using buttons rapidly
  let wheelLock = false;
  window.addEventListener(
    "wheel",
    (e) => {
      if (wheelLock) {
        e.preventDefault();
        return;
      }
      if (Math.abs(e.deltaY) < 40) return;
      // Let native scroll-snap handle most cases; only nudge on large intentional scrolls
    },
    { passive: false }
  );

  // Hash deep-links
  if (location.hash) {
    const el = document.querySelector(location.hash);
    const idx = slides.indexOf(el);
    if (idx >= 0) {
      requestAnimationFrame(() => goTo(idx, { smooth: false }));
    }
  }
})();
