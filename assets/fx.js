(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce) return;
  document.documentElement.classList.add("fx");

  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const STAGGER = [".timeline", ".roster", ".gen-grid", ".standings tbody", ".stats", "#prizes", ".chips", ".sp-track", "#result-tabs", "#sched-phases", "#phase-tabs"];
  const applyStagger = () => {
    document.querySelectorAll(STAGGER.join(",")).forEach((p) => {
      p.classList.add("stagger");
      [...p.children].forEach((c, i) => c.style.setProperty("--i", i));
    });
  };
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; applyStagger(); });
  }).observe(document.querySelector("main"), { childList: true, subtree: true });
  applyStagger();

  const seen = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("seen"); seen.unobserve(en.target); }
  }), { threshold: 0.08 });
  document.querySelectorAll("section.block").forEach((s) => seen.observe(s));

  const countUp = (el) => {
    const target = Number(el.textContent.trim());
    if (!Number.isFinite(target) || target <= 0) return;
    const start = performance.now(), dur = 1200;
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = "0";
    requestAnimationFrame(step);
  };
  const statsObs = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.querySelectorAll(".stat b").forEach(countUp);
    statsObs.unobserve(en.target);
  }), { threshold: 0.4 });
  const waitStats = setInterval(() => {
    const stats = document.querySelector("#stats");
    if (stats && stats.children.length) { clearInterval(waitStats); statsObs.observe(stats); }
  }, 100);
  setTimeout(() => clearInterval(waitStats), 10000);

  if (!finePointer) return;

  document.addEventListener("pointermove", (e) => {
    const p = e.target.closest(".panel, .stat, .roster li");
    if (!p) return;
    const r = p.getBoundingClientRect();
    p.style.setProperty("--mx", `${e.clientX - r.left}px`);
    p.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });

  const art = document.querySelector(".hero-art");
  if (art) {
    const hero = document.querySelector(".hero");
    hero.addEventListener("pointermove", (e) => {
      const r = art.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / r.width;
      const y = (e.clientY - (r.top + r.height / 2)) / r.height;
      art.style.setProperty("--ry", `${Math.max(-1, Math.min(1, x)) * 8}deg`);
      art.style.setProperty("--rx", `${Math.max(-1, Math.min(1, y)) * -6}deg`);
    });
    hero.addEventListener("pointerleave", () => {
      art.style.setProperty("--ry", "0deg");
      art.style.setProperty("--rx", "0deg");
    });
  }
})();
