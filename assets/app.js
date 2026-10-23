(async () => {
  const { esc, safeUrl, safeImg, ICONS, total, sortRows, hasTeam, generalRows, PHASES, STATES, localTimes } = PYROCORE;
  const $ = (s) => document.querySelector(s);

  const toggle = $(".nav-toggle"), nav = $(".nav");
  const setNav = (open) => { nav.classList.toggle("open", open); toggle.setAttribute("aria-expanded", open); };
  toggle.addEventListener("click", () => setNav(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("click", (e) => { if (nav.classList.contains("open") && !e.target.closest(".nav, .nav-toggle")) setNav(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) { setNav(false); toggle.focus(); } });

  let data;
  try {
    data = await PYROCORE.loadData();
  } catch (err) {
    document.querySelector("main").insertAdjacentHTML("afterbegin",
      `<div class="container"><p class="empty">No se pudo cargar la información del torneo. Intenta recargar la página.</p></div>`);
    return;
  }
  const t = data.tournament || {}, L = data.links || {};
  const state = STATES[t.state] ? t.state : "abierto";

  document.querySelectorAll("[data-k]").forEach((el) => {
    const v = t[el.dataset.k];
    if (v) el.textContent = v;
  });
  if (t.name) document.title = `${t.name} · ${t.game || "Free Fire"}`;
  if (safeImg(t.heroImage)) $("#hero-img").src = t.heroImage;
  $("#intro").textContent = t.intro || "";
  const badge = $("#state-badge");
  badge.textContent = STATES[state];
  badge.className = `kicker state-${state}`;

  const cta = [];
  if (state === "abierto" && safeUrl(L.registration)) cta.push(`<a class="btn" href="${esc(L.registration)}" target="_blank" rel="noopener">${ICONS.form} Inscribir equipo</a>`);
  if (safeUrl(L.infoGroup)) cta.push(`<a class="btn ${cta.length ? "ghost" : ""}" href="${esc(L.infoGroup)}" target="_blank" rel="noopener">${ICONS.whatsapp} Grupo de información</a>`);
  cta.push(`<a class="btn ghost" href="#${state === "en_juego" || state === "finalizado" ? "resultados" : "calendario"}">${state === "en_juego" || state === "finalizado" ? "Ver resultados" : "Ver cronograma"}</a>`);
  $("#hero-cta").innerHTML = cta.join("");

  $("#stats").innerHTML = [
    [t.teams || "—", "Equipos"],
    [t.groups || "—", "Grupos"],
    [t.server || "LATAM", "Servidor"],
    [t.prizePool || "TBD", "Prize pool"],
  ].map(([v, l]) => `<div class="stat"><b>${esc(v)}</b><span>${l}</span></div>`).join("");

  $("#chips").innerHTML = [
    [ICONS.globe, `Servidor ${t.server || "LATAM"}`],
    [ICONS.phone, t.platform || "Solo móvil"],
    [ICONS.users, `${t.teams || "—"} equipos · ${t.groups || "—"} grupos`],
    [ICONS.trophy, t.game || "Free Fire"],
  ].map(([i, l]) => `<span class="chip">${i}${esc(l)}</span>`).join("");

  $("#prizes").innerHTML = (data.prizes || []).length
    ? data.prizes.map((p) => `<div class="prize-row"><span>${esc(p.place)}</span><b>${esc(p.amount)}</b></div>`).join("")
    : `<p class="empty">Distribución por anunciar</p>`;

  const statusLabel = { proximo: "Próximo", envivo: "En vivo", finalizado: "Finalizado" };
  const fmt = (d, opt) => {
    const date = new Date(`${d}T12:00:00`);
    return isNaN(date) ? "" : date.toLocaleDateString("es", opt);
  };
  const results = data.results || [];
  const rosterOf = (phase, group) => {
    const g = results.find((r) => r.phase === phase && r.kind !== "general" && r.title.trim().toLowerCase() === (group || "").trim().toLowerCase());
    return g ? g.rows.filter(hasTeam).map((r) => r.team.trim()) : [];
  };
  const norm = (x) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const rosterList = (teams, query) => teams.length
    ? `<ol class="roster">${teams.map((n) => `<li class="${query && norm(n).includes(query) ? "hit" : ""}"><span>${esc(n)}</span></li>`).join("")}</ol>`
    : `<p class="roster empty-roster">Equipos por confirmar.</p>`;

  const sched = (data.schedule || []).filter((m) => m.visible);
  const schedPhases = [...PHASES, ...new Set(sched.map((m) => m.phase))]
    .filter((p, i, a) => a.indexOf(p) === i && sched.some((m) => m.phase === p));
  let curSchedPhase = null;

  const matchCard = (m, { query = "", open = false, showPhase = false } = {}) => {
    const teams = rosterOf(m.phase, m.group);
    return `
      <article class="panel match ${m.status === "finalizado" ? "done" : ""} ${open ? "open" : ""}">
        <div class="date"><b>${esc(fmt(m.date, { day: "2-digit" }))}</b><span>${esc(fmt(m.date, { month: "short" }).replace(".", ""))}</span></div>
        <div>
          ${showPhase ? `<span class="phase-tag">${esc(m.phase)} · ${m.rooms} ${m.rooms == 1 ? "sala" : "salas"}</span>` : ""}
          <h4>${esc(m.group)} <small>· ${esc(fmt(m.date, { weekday: "long" }))}</small></h4>
          <div class="times">${localTimes(m.time).map((x) => `
            <span title="${x.name}"><img src="https://flagcdn.com/w20/${x.code}.png" alt="${x.name}" width="20" height="15" loading="lazy">${x.label}</span>`).join("")}
          </div>
          ${m.note ? `<p>${esc(m.note)}</p>` : ""}
          <div class="match-actions">
            ${teams.length ? `<button class="roster-btn" type="button" aria-expanded="${open}">Ver equipos (${teams.length})</button>` : ""}
            <button class="rules-btn" type="button" data-open-rules>Reglamento</button>
          </div>
        </div>
        <span class="status ${esc(m.status)}">${statusLabel[m.status] || "Próximo"}</span>
        <div class="roster-wrap">${rosterList(teams, query)}</div>
      </article>`;
  };

  const renderSchedule = (phase) => {
    curSchedPhase = phase;
    document.querySelectorAll("#sched-phases .tab").forEach((b) => b.classList.toggle("active", b.dataset.phase === phase));
    const items = sched.filter((m) => m.phase === phase);
    const rooms = items[0]?.rooms;
    const anyTeams = items.some((m) => rosterOf(m.phase, m.group).length);
    $("#schedule").innerHTML = `
      <div class="phase-head"><h3>${esc(phase)}</h3>${rooms ? `<span>${rooms} ${rooms == 1 ? "sala" : "salas"}</span>` : ""}
        ${anyTeams ? `<button class="btn ghost sm" type="button" id="toggle-all" style="margin-left:auto">Ver todos los equipos</button>` : ""}</div>
      <div class="timeline">${items.map((m) => matchCard(m)).join("")}</div>`;
  };

  const searchTeams = (raw) => {
    const query = norm(raw.trim());
    if (!query) return renderSchedule(curSchedPhase);
    document.querySelectorAll("#sched-phases .tab").forEach((b) => b.classList.remove("active"));
    const hits = sched.filter((m) => rosterOf(m.phase, m.group).some((n) => norm(n).includes(query)));
    $("#schedule").innerHTML = `
      <div class="phase-head"><h3>Buscar: "${esc(raw.trim())}"</h3><span>${hits.length} ${hits.length === 1 ? "fecha" : "fechas"}</span></div>
      ${hits.length
        ? `<div class="timeline">${hits.map((m) => matchCard(m, { query, open: true, showPhase: true })).join("")}</div>`
        : `<div class="panel empty">No encontramos ese equipo en el cronograma publicado.</div>`}`;
  };

  if (schedPhases.length) {
    $("#sched-phases").innerHTML = schedPhases.map((p) => `<button class="tab" data-phase="${esc(p)}">${esc(p)}</button>`).join("");
    $("#sched-phases").addEventListener("click", (e) => {
      const b = e.target.closest(".tab");
      if (!b) return;
      $("#team-search").value = "";
      renderSchedule(b.dataset.phase);
    });
    $("#schedule").addEventListener("click", (e) => {
      const btn = e.target.closest(".roster-btn");
      if (btn) {
        const card = btn.closest(".match");
        btn.setAttribute("aria-expanded", card.classList.toggle("open"));
      } else if (e.target.id === "toggle-all") {
        const cards = [...document.querySelectorAll("#schedule .match")];
        const open = !cards.every((c) => c.classList.contains("open"));
        cards.forEach((c) => c.classList.toggle("open", open));
        e.target.textContent = open ? "Ocultar equipos" : "Ver todos los equipos";
      }
    });
    let deb;
    $("#team-search").addEventListener("input", (e) => { clearTimeout(deb); deb = setTimeout(() => searchTeams(e.target.value), 150); });
    if (!results.some((g) => g.rows.some(hasTeam))) $(".team-search").hidden = true;
    const next = sched.find((m) => m.status !== "finalizado") || sched[0];
    renderSchedule(next.phase);
  } else {
    $(".team-search").hidden = true;
    $("#schedule").innerHTML = `<div class="panel empty">El cronograma se publicará pronto.</div>`;
  }
  if (t.notice) { $("#notice").hidden = false; $("#notice").textContent = t.notice; }

  const R = PYROCORE.getRules(t);
  const okIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg>`;
  const noIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 6l12 12M18 6 6 18"/></svg>`;
  $("#rules-body").innerHTML = `
    <section class="rules-block">
      <h3>Reglas oficiales</h3>
      <ol class="rules-list">${R.rules.map((r) => `<li>${r.title ? `<b>${esc(r.title)}</b>` : ""}<p>${esc(r.text)}</p></li>`).join("")}</ol>
    </section>
    <div class="rules-cols">
      <section class="rules-block">
        <h3>Aclaraciones</h3>
        <ul class="rules-checks ok">${R.clarifications.map((x) => `<li>${okIcon}<span>${esc(x)}</span></li>`).join("")}</ul>
      </section>
      <section class="rules-block">
        <h3>Prohibido</h3>
        <ul class="rules-checks no">${R.prohibited.map((x) => `<li>${noIcon}<span>${esc(x)}</span></li>`).join("")}</ul>
      </section>
    </div>
    ${R.note ? `<p class="notice rules-note">${esc(R.note)}</p>` : ""}`;

  const dlg = $("#rules-dialog");
  const openRules = () => {
    if (dlg.open) return;
    dlg.showModal();
    document.body.classList.add("modal-open");
    dlg.querySelector(".rules-body").scrollTop = 0;
    if (location.hash !== "#reglamento") history.replaceState(null, "", "#reglamento");
  };
  const closeRules = () => dlg.open && dlg.close();
  dlg.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    if (location.hash === "#reglamento") history.replaceState(null, "", location.pathname + location.search);
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-rules]")) { e.preventDefault(); nav.classList.remove("open"); openRules(); }
    else if (e.target.closest("[data-close-rules]") || e.target === dlg) closeRules();
  });
  if (location.hash === "#reglamento") openRules();

  const tableHasData = (g) => (g.kind === "general" ? generalRows(results, g.phase).length : g.rows.some(hasTeam));
  const resPhases = [...PHASES, ...new Set(results.map((g) => g.phase))]
    .filter((p, i, a) => a.indexOf(p) === i && results.some((g) => g.phase === p && tableHasData(g)));

  const scored = (r) => (Number(r.kills) || 0) + (Number(r.placement) || 0) + (Number(r.penalty) || 0) > 0;
  let currentTable = null;
  $("#results").addEventListener("click", async (e) => {
    const btn = e.target.closest("#dl-png");
    if (!btn || !currentTable) return;
    btn.disabled = true;
    const label = btn.lastChild.textContent;
    btn.lastChild.textContent = "Generando…";
    try { await PYROCOREDownload.png(currentTable); }
    finally { btn.disabled = false; btn.lastChild.textContent = label; }
  });
  const renderTable = (g) => {
    const general = g.kind === "general";
    if (!general && !g.rows.some(scored)) {
      const teams = g.rows.filter(hasTeam).map((r) => r.team.trim());
      $("#results").innerHTML = `
        <div class="pending-head"><b>${esc(g.title)} · Equipos confirmados</b><span>Resultados pendientes</span>
          <button class="rules-btn" type="button" data-open-rules>Reglamento</button></div>
        ${rosterList(teams, "")}`;
      return;
    }
    if (general && !generalRows(results, g.phase).some(scored)) {
      $("#results").innerHTML = `<p class="empty">La tabla general se mostrará cuando haya resultados en ${esc(g.phase)}.</p>`;
      return;
    }
    const rows = general ? generalRows(results, g.phase) : sortRows(g.rows.filter(hasTeam));
    const q = Number(g.qualify) || 0;
    currentTable = {
      phase: g.phase, title: general ? "Tabla general" : g.title, general, qualify: q, updated: general ? "" : g.updated,
      rows: rows.map((r) => ({ team: r.team.trim(), group: r.group || "", kills: Number(r.kills) || 0, placement: Number(r.placement) || 0, penalty: Number(r.penalty) || 0, total: total(r) })),
    };
    if (general) {
      $("#results").innerHTML = `
        <div class="gen-head"><b>Tabla general · ${esc(g.phase)}</b><span>${rows.length} equipos · puntos totales${q ? ` · clasifican ${q}` : ""}</span></div>
        <ol class="gen-grid">${rows.map((row, k) => `
          <li class="${k < q ? "qualified" : ""} ${k === q - 1 ? "cutline" : ""} ${k < 3 ? `top top${k + 1}` : ""}">
            <span class="gen-pos">${k + 1}</span>
            <span class="gen-team"><b>${esc(row.team)}</b><small>${esc(row.group)}</small></span>
            <span class="gen-pts">${total(row)}</span>
          </li>`).join("")}
        </ol>
        <div class="results-meta"><span>Puntos = Kills + P.P − Sanciones</span><span></span>
          <button class="btn sm dl-btn" type="button" id="dl-png"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>Descargar</button></div>`;
      return;
    }
    $("#results").innerHTML = rows.length ? `
      <div class="table-wrap"><table class="standings">
        <thead><tr><th>#</th><th>Equipo</th><th class="num">Kills</th><th class="num">P.P</th><th class="num">Sanc.</th><th class="num">Total</th></tr></thead>
        <tbody>${rows.map((row, k) => `
          <tr class="${k < q ? "qualified" : ""} ${k === q - 1 ? "cutline" : ""}">
            <td><span class="pos-badge">${k + 1}</span></td>
            <td>${esc(row.team)}${k < q ? ` <span class="q-tag">Clasifica</span>` : ""}</td>
            <td class="num">${Number(row.kills) || 0}</td>
            <td class="num">${Number(row.placement) || 0}</td>
            <td class="num ${row.penalty ? "pen" : ""}">${row.penalty ? "-" + Number(row.penalty) : 0}</td>
            <td class="num total">${total(row)}</td>
          </tr>`).join("")}
        </tbody></table></div>
      <div class="results-meta"><span>${esc(g.phase)}${q ? ` · Clasifican ${q}` : ""}</span><span>${g.updated ? `Actualizado: ${esc(g.updated)}` : ""}</span>
        <button class="btn sm dl-btn" type="button" id="dl-png"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>Descargar</button></div>`
      : `<p class="empty">Aún no hay resultados para ${esc(g.title)}.</p>`;
  };

  const renderPhase = (phase) => {
    document.querySelectorAll("#phase-tabs .tab").forEach((b) => b.classList.toggle("active", b.dataset.phase === phase));
    const tables = results.filter((g) => g.phase === phase && tableHasData(g))
      .sort((a, b) => (a.kind === "general" ? -1 : 0) - (b.kind === "general" ? -1 : 0));
    $("#result-tabs").innerHTML = tables.map((g, i) => `<button class="tab" role="tab" data-i="${i}">${esc(g.kind === "general" ? "Tabla general" : g.title)}</button>`).join("");
    $("#result-tabs").onclick = (e) => {
      const b = e.target.closest(".tab");
      if (!b) return;
      document.querySelectorAll("#result-tabs .tab").forEach((x) => x.classList.toggle("active", x === b));
      renderTable(tables[+b.dataset.i]);
    };
    $("#result-tabs .tab").classList.add("active");
    renderTable(tables[0]);
  };

  if (resPhases.length) {
    $("#phase-tabs").innerHTML = resPhases.map((p) => `<button class="tab" data-phase="${esc(p)}">${esc(p)}</button>`).join("");
    $("#phase-tabs").addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (b) renderPhase(b.dataset.phase); });
    renderPhase(resPhases[resPhases.length - 1]);
  } else {
    $("#results").innerHTML = `<p class="empty">Los resultados se publicarán al iniciar la competencia.</p>`;
  }

  const social = [
    { href: L.instagram, icon: ICONS.instagram, title: "Instagram", sub: L.instagramHandle || "Síguenos" },
    { href: L.infoGroup, icon: ICONS.whatsapp, title: L.infoGroupLabel || "Grupo de información", sub: L.infoGroup ? "Únete para recibir avisos" : "Disponible pronto" },
  ];
  if (safeUrl(L.discord)) social.push({ href: L.discord, icon: ICONS.discord, title: "Discord", sub: "Comunidad PYROCORE" });
  if (state === "abierto" && safeUrl(L.registration)) social.push({ href: L.registration, icon: ICONS.form, title: "Inscripciones", sub: "Registra a tu equipo" });
  $("#community").innerHTML = social.map((s) => {
    const url = safeUrl(s.href);
    return `<a class="panel social-card ${url ? "" : "disabled"} reveal" ${url ? `href="${esc(url)}" target="_blank" rel="noopener"` : ""}>
      <span class="ico">${s.icon}</span><span><b>${esc(s.title)}</b><span>${esc(s.sub)}</span></span></a>`;
  }).join("");
  if (safeUrl(L.instagram)) $("#footer-ig").innerHTML = `<a href="${esc(L.instagram)}" target="_blank" rel="noopener">${esc(L.instagramHandle || "Instagram")}</a>`;

  const sponsors = (data.sponsors || []).filter((s) => s.name || s.logo);
  const item = (s, dup) => {
    const img = safeImg(s.logo), url = safeUrl(s.url);
    const inner = img ? `<img src="${esc(img)}" alt="${esc(s.name)}" loading="lazy" draggable="false">` : `<span>${esc(s.name)}</span>`;
    const attrs = `class="sp-item${dup ? " dup" : ""}" title="${esc(s.name)}"${dup ? ' aria-hidden="true" tabindex="-1"' : ""}`;
    return url ? `<a ${attrs} href="${esc(url)}" target="_blank" rel="noopener">${inner}</a>` : `<div ${attrs}>${inner}</div>`;
  };
  const track = $("#sp-track");
  if (sponsors.length) {
    track.innerHTML = sponsors.map((s) => item(s, false)).join("") + sponsors.map((s) => item(s, true)).join("");
    track.style.setProperty("--sp-duration", `${Math.max(20, sponsors.length * 3.2)}s`);
    if (sponsors.length < 2) track.classList.add("static");
  } else {
    document.getElementById("sponsors")?.closest("section")?.remove();
  }

  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();
