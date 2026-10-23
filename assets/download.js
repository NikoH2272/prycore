const PYROCOREDownload = (() => {
  const W = 1080;
  const C = { bg: "#030601", panel: "#081403", line: "rgba(57,255,20,.18)", teal: "#39ff14", muted: "#7aaa60", text: "#e8ffe0", red: "#ff8b96" };

  const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const fileBase = (t) => `pyrocore-league-s1_${slug(t.phase)}_${slug(t.title)}`;

  const loadImg = (src) => new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });

  const fit = (ctx, text, maxW, size, family, weight = "") => {
    let s = size;
    do { ctx.font = `${weight} ${s}px ${family}`.trim(); s -= 1; } while (ctx.measureText(text).width > maxW && s > 10);
    return text;
  };

  async function drawPng(t) {
    await Promise.all([
      document.fonts.load('400 40px "Bebas Neue"'),
      document.fonts.load('700 20px "Rajdhani"'),
    ]).catch(() => {});
    const logo = await loadImg("assets/logo.webp");

    const ROW = 64, HEAD = 300, TH = 56, FOOT = 150;
    const H = HEAD + TH + t.rows.length * ROW + FOOT;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const DISPLAY = '"Bebas Neue", Impact, sans-serif', BODY = '"Rajdhani", "Segoe UI", sans-serif';

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, -80, 40, W / 2, -80, 760);
    glow.addColorStop(0, "rgba(57,255,20,.28)"); glow.addColorStop(1, "rgba(57,255,20,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(57,255,20,.05)"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }

    ctx.fillStyle = C.text; ctx.font = `700 20px ${BODY}`; ctx.textBaseline = "alphabetic";
    ctx.fillText("FREE FIRE", 60, 58);
    ctx.textAlign = "right"; ctx.fillText("PYROCORE  |  S1", W - 60, 58); ctx.textAlign = "left";
    if (logo) { const lh = 120, lw = logo.width * (lh / logo.height); ctx.drawImage(logo, 60, 86, lw, lh); }
    const tx = logo ? 60 + 120 * (logo.width / logo.height) + 30 : 60;
    const silver = ctx.createLinearGradient(0, 96, 0, 170);
    silver.addColorStop(0, "#ffffff"); silver.addColorStop(.5, "#e0f0d8"); silver.addColorStop(1, "#8fa080");
    ctx.fillStyle = silver; ctx.font = `400 84px ${DISPLAY}`;
    ctx.fillText("PYROCORE LEAGUE S1", tx, 166);
    ctx.fillStyle = C.teal; fit(ctx, `${t.phase} · ${t.title}`.toUpperCase(), W - tx - 60, 44, DISPLAY, "400");
    ctx.fillText(`${t.phase} · ${t.title}`.toUpperCase(), tx, 214);
    ctx.fillStyle = C.muted; ctx.font = `700 19px ${BODY}`;
    const sub = ["TABLA DE RESULTADOS", t.qualify ? `CLASIFICAN ${t.qualify}` : "", t.updated ? `ACTUALIZADO ${t.updated.toUpperCase()}` : ""].filter(Boolean).join("   ·   ");
    ctx.fillText(sub, 60, 262);

    const cols = t.general
      ? [["#", 60, "c", 50], ["EQUIPO", 130, "l", 0], ["GRUPO", 560, "l", 0], ["KILLS", 720, "c", 70], ["P.P", 810, "c", 70], ["SANC.", 900, "c", 70], ["TOTAL", 990, "c", 90]]
      : [["#", 60, "c", 50], ["EQUIPO", 130, "l", 0], ["KILLS", 640, "c", 90], ["P.P", 750, "c", 90], ["SANC.", 860, "c", 90], ["TOTAL", 975, "c", 110]];
    const teamMax = (t.general ? 560 : 640) - 140 - 20;
    const cx = (c) => (c[2] === "c" ? c[1] + c[3] / 2 : c[1]);
    let y = HEAD;
    ctx.fillStyle = "rgba(57,255,20,.10)"; ctx.fillRect(40, y, W - 80, TH);
    ctx.fillStyle = C.muted; ctx.font = `700 18px ${BODY}`; ctx.textBaseline = "middle";
    cols.forEach((c) => { ctx.textAlign = c[2] === "c" ? "center" : "left"; ctx.fillText(c[0], cx(c), y + TH / 2); });
    y += TH;

    t.rows.forEach((r, k) => {
      const q = k < t.qualify;
      ctx.fillStyle = k % 2 ? "rgba(255,255,255,.015)" : "rgba(57,255,20,.035)";
      ctx.fillRect(40, y, W - 80, ROW);
      if (q) { ctx.fillStyle = C.teal; ctx.fillRect(40, y, 5, ROW); }
      const medal = ["#39ff14", "#cce8c0", "#1a8e05"][k];
      ctx.fillStyle = medal || "rgba(57,255,20,.10)";
      ctx.beginPath(); ctx.roundRect(cx(cols[0]) - 20, y + ROW / 2 - 20, 40, 40, 9); ctx.fill();
      ctx.fillStyle = medal && k < 2 ? C.bg : C.text; ctx.font = `400 26px ${DISPLAY}`; ctx.textAlign = "center";
      ctx.fillText(String(k + 1), cx(cols[0]), y + ROW / 2 + 2);
      ctx.textAlign = "left"; ctx.fillStyle = C.text;
      fit(ctx, r.team.toUpperCase(), teamMax - (q ? 110 : 0), 24, BODY, "700");
      ctx.fillText(r.team.toUpperCase(), cols[1][1], y + ROW / 2);
      if (q) {
        const w = ctx.measureText(r.team.toUpperCase()).width;
        ctx.font = `700 14px ${BODY}`; const tw = ctx.measureText("CLASIFICA").width + 20;
        ctx.fillStyle = "rgba(57,255,20,.16)"; ctx.beginPath(); ctx.roundRect(cols[1][1] + w + 12, y + ROW / 2 - 13, tw, 26, 13); ctx.fill();
        ctx.fillStyle = C.teal; ctx.fillText("CLASIFICA", cols[1][1] + w + 22, y + ROW / 2 + 1);
      }
      let i = 2;
      if (t.general) { ctx.fillStyle = C.muted; ctx.font = `700 20px ${BODY}`; ctx.fillText(r.group.toUpperCase(), cols[2][1], y + ROW / 2); i = 3; }
      ctx.textAlign = "center"; ctx.font = `700 24px ${BODY}`;
      ctx.fillStyle = C.text; ctx.fillText(String(r.kills), cx(cols[i]), y + ROW / 2);
      ctx.fillText(String(r.placement), cx(cols[i + 1]), y + ROW / 2);
      ctx.fillStyle = r.penalty ? C.red : C.muted; ctx.fillText(r.penalty ? `-${r.penalty}` : "0", cx(cols[i + 2]), y + ROW / 2);
      ctx.fillStyle = C.teal; ctx.font = `400 36px ${DISPLAY}`; ctx.fillText(String(r.total), cx(cols[i + 3]), y + ROW / 2 + 2);
      ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(40, y + ROW - .5); ctx.lineTo(W - 40, y + ROW - .5); ctx.stroke();
      if (k === t.qualify - 1) {
        ctx.setLineDash([10, 8]); ctx.strokeStyle = C.teal; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(40, y + ROW - 1); ctx.lineTo(W - 40, y + ROW - 1); ctx.stroke();
        ctx.setLineDash([]); ctx.lineWidth = 1;
      }
      y += ROW;
    });

    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C.muted; ctx.font = `700 18px ${BODY}`;
    ctx.fillText("TOTAL = KILLS + P.P − SANCIONES", 60, y + 52);
    ctx.fillStyle = C.text; ctx.font = `400 34px ${DISPLAY}`;
    ctx.fillText("@PYROCORE_LEAGUE", 60, y + 110);
    ctx.textAlign = "right";
    ctx.fillText("#GOPYRO   #SOMOSPYROCORE", W - 60, y + 110);
    ctx.fillStyle = C.teal; ctx.font = `700 18px ${BODY}`;
    ctx.fillText(location.hostname.replace(/^www\./, "") || "pyrocore.gg", W - 60, y + 52);
    return new Promise((res) => cv.toBlob(res, "image/png"));
  }

  async function drawGeneral(t) {
    await Promise.all([
      document.fonts.load('400 40px "Bebas Neue"'),
      document.fonts.load('700 20px "Rajdhani"'),
    ]).catch(() => {});
    const logo = await loadImg("assets/logo.webp");
    const DISPLAY = '"Bebas Neue", Impact, sans-serif', BODY = '"Rajdhani", "Segoe UI", sans-serif';

    const n = t.rows.length;
    const cols = n <= 15 ? 1 : n <= 50 ? 2 : n <= 100 ? 3 : 4;
    const perCol = Math.ceil(n / cols);
    const ROW = [58, 46, 38, 34][cols - 1];
    const HEAD = 300, FOOT = 140, PAD = 40, GAP = 14;
    const H = HEAD + perCol * ROW + FOOT;
    const SCALE = 2;
    const cv = document.createElement("canvas");
    cv.width = W * SCALE; cv.height = H * SCALE;
    const ctx = cv.getContext("2d");
    ctx.scale(SCALE, SCALE);

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, -80, 40, W / 2, -80, 760);
    glow.addColorStop(0, "rgba(57,255,20,.28)"); glow.addColorStop(1, "rgba(57,255,20,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(57,255,20,.05)"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }

    ctx.fillStyle = C.text; ctx.font = `700 20px ${BODY}`; ctx.textBaseline = "alphabetic";
    ctx.fillText("FREE FIRE", 60, 58);
    ctx.textAlign = "right"; ctx.fillText("PYROCORE  |  S1", W - 60, 58); ctx.textAlign = "left";
    if (logo) { const lh = 120, lw = logo.width * (lh / logo.height); ctx.drawImage(logo, 60, 86, lw, lh); }
    const tx = logo ? 60 + 120 * (logo.width / logo.height) + 30 : 60;
    const silver = ctx.createLinearGradient(0, 96, 0, 170);
    silver.addColorStop(0, "#ffffff"); silver.addColorStop(.5, "#e0f0d8"); silver.addColorStop(1, "#8fa080");
    ctx.fillStyle = silver; ctx.font = `400 84px ${DISPLAY}`;
    ctx.fillText("PYROCORE LEAGUE S1", tx, 166);
    ctx.fillStyle = C.teal; fit(ctx, `TABLA GENERAL · ${t.phase}`.toUpperCase(), W - tx - 60, 44, DISPLAY, "400");
    ctx.fillText(`TABLA GENERAL · ${t.phase}`.toUpperCase(), tx, 214);
    ctx.fillStyle = C.muted; ctx.font = `700 19px ${BODY}`;
    ctx.fillText([`${n} EQUIPOS`, "PUNTOS TOTALES", t.qualify ? `CLASIFICAN ${t.qualify}` : ""].filter(Boolean).join("   ·   "), 60, 262);

    const colW = (W - PAD * 2 - GAP * (cols - 1)) / cols;
    ctx.textBaseline = "middle";
    t.rows.forEach((r, k) => {
      const c = Math.floor(k / perCol), i = k % perCol;
      const x = PAD + c * (colW + GAP), y = HEAD + i * ROW;
      const q = k < t.qualify;
      ctx.fillStyle = q ? "rgba(57,255,20,.09)" : i % 2 ? "rgba(255,255,255,.015)" : "rgba(57,255,20,.03)";
      ctx.beginPath(); ctx.roundRect(x, y + 2, colW, ROW - 4, 8); ctx.fill();
      if (q) { ctx.fillStyle = C.teal; ctx.fillRect(x, y + 2, 4, ROW - 4); }
      const medal = ["#39ff14", "#cce8c0", "#1a8e05"][k];
      const bs = ROW - 14;
      if (medal) { ctx.fillStyle = medal; ctx.beginPath(); ctx.roundRect(x + 10, y + 7, bs, bs, 6); ctx.fill(); }
      ctx.fillStyle = medal && k < 2 ? C.bg : medal ? "#fff" : C.teal;
      ctx.font = `400 ${[28, 24, 21, 19][cols - 1]}px ${DISPLAY}`; ctx.textAlign = "center";
      ctx.fillText(String(k + 1), x + 10 + bs / 2, y + ROW / 2 + 1);
      ctx.textAlign = "right"; ctx.fillStyle = C.teal;
      ctx.font = `400 ${[34, 28, 24, 22][cols - 1]}px ${DISPLAY}`;
      ctx.fillText(String(r.total), x + colW - 12, y + ROW / 2 + 1);
      const totalW = ctx.measureText("000").width + (cols === 4 ? 8 : 16);
      ctx.textAlign = "left"; ctx.fillStyle = C.text;
      const nameX = x + 10 + bs + 10;
      fit(ctx, r.team.toUpperCase(), colW - (nameX - x) - totalW - 4, [24, 19, 16, 15][cols - 1], BODY, "700");
      ctx.fillText(r.team.toUpperCase(), nameX, y + ROW / 2 + 1);
      if (k === t.qualify - 1) {
        ctx.setLineDash([8, 6]); ctx.strokeStyle = C.teal; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y + ROW - 1); ctx.lineTo(x + colW, y + ROW - 1); ctx.stroke();
        ctx.setLineDash([]); ctx.lineWidth = 1;
      }
    });

    const fy = HEAD + perCol * ROW;
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C.muted; ctx.font = `700 18px ${BODY}`;
    ctx.fillText("PUNTOS = KILLS + P.P − SANCIONES", 60, fy + 48);
    ctx.fillStyle = C.text; ctx.font = `400 34px ${DISPLAY}`;
    ctx.fillText("@PYROCORE_LEAGUE", 60, fy + 104);
    ctx.textAlign = "right";
    ctx.fillText("#GOPYRO   #SOMOSPYROCORE", W - 60, fy + 104);
    ctx.fillStyle = C.teal; ctx.font = `700 18px ${BODY}`;
    ctx.fillText(location.hostname.replace(/^www\./, "") || "pyrocore.gg", W - 60, fy + 48);
    return new Promise((res) => cv.toBlob(res, "image/png"));
  }

  const save = (blob, name) => {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  async function png(t) {
    save(await (t.general ? drawGeneral(t) : drawPng(t)), `${fileBase(t)}.png`);
  }

  return { png };
})();
