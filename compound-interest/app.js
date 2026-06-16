/* Nexus Web Tools — Compound Interest Calculator
   Core engine + UI wiring + scenario comparison. Pure vanilla JS, no deps. */

(function () {
  "use strict";

  const FREQ = { daily: 365, weekly: 52, fortnightly: 26, monthly: 12, quarterly: 4, halfyearly: 2, yearly: 1 };
  const CONTRIB_FREQ = { weekly: 52, fortnightly: 26, monthly: 12, quarterly: 4, yearly: 1 };

  const $ = (id) => document.getElementById(id);
  const fmt = (n, cur) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 2 }).format(
      isFinite(n) ? n : 0
    );
  const fmtN = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(isFinite(n) ? n : 0);

  /**
   * Core simulation. Returns yearly schedule + totals.
   * Money is stepped per-compounding-period; contributions are converted to a
   * per-period amount and applied at period start ("begin") or end ("end").
   */
  function simulate(opts) {
    const {
      principal, annualRatePct, years, compFreq, contribAmount, contribFreq,
      contribTiming, contribStopYear, annualContribIncreasePct
    } = opts;

    const m = FREQ[compFreq];            // compounding periods per year
    const periodicRate = annualRatePct / 100 / m;
    const totalPeriods = Math.round(years * m);

    // contributions per year (in money), converted to a per-compounding-period amount
    const contribPerYear = contribAmount * (CONTRIB_FREQ[contribFreq] || 0);

    let balance = principal;
    let totalContributions = principal;
    let totalInterest = 0;
    const yearly = [];
    let yearInterest = 0, yearContrib = 0;

    for (let p = 1; p <= totalPeriods; p++) {
      const currentYearIndex = Math.floor((p - 1) / m); // 0-based
      const inContribWindow = contribStopYear === 0 || currentYearIndex < contribStopYear;

      // scale contribution with annual increase (applied per completed year)
      const growthFactor = Math.pow(1 + annualContribIncreasePct / 100, currentYearIndex);
      const perPeriodContrib = inContribWindow ? (contribPerYear * growthFactor) / m : 0;

      if (contribTiming === "begin" && perPeriodContrib) {
        balance += perPeriodContrib;
        totalContributions += perPeriodContrib;
        yearContrib += perPeriodContrib;
      }

      const interest = balance * periodicRate;
      balance += interest;
      totalInterest += interest;
      yearInterest += interest;

      if (contribTiming === "end" && perPeriodContrib) {
        balance += perPeriodContrib;
        totalContributions += perPeriodContrib;
        yearContrib += perPeriodContrib;
      }

      if (p % m === 0 || p === totalPeriods) {
        yearly.push({
          year: currentYearIndex + 1,
          contributions: yearContrib,
          interest: yearInterest,
          balance: balance,
        });
        yearInterest = 0; yearContrib = 0;
      }
    }

    const effectiveAnnualRate = (Math.pow(1 + periodicRate, m) - 1) * 100;
    const roi = totalContributions > 0 ? ((balance - totalContributions) / totalContributions) * 100 : 0;

    return {
      finalBalance: balance,
      totalContributions,
      totalInterest,
      effectiveAnnualRate,
      roi,
      yearly,
    };
  }

  function readInputs(prefix) {
    const g = (k) => $(prefix + k);
    return {
      principal: parseFloat(g("Principal").value) || 0,
      annualRatePct: parseFloat(g("Rate").value) || 0,
      years: parseFloat(g("Years").value) || 0,
      compFreq: g("Comp").value,
      contribAmount: parseFloat(g("Contrib").value) || 0,
      contribFreq: g("ContribFreq").value,
      contribTiming: g("Timing").value,
      contribStopYear: parseFloat(g("StopYear").value) || 0,
      annualContribIncreasePct: parseFloat(g("Increase").value) || 0,
    };
  }

  function currency() { return $("ccyCurrency").value; }

  // keep last computed state for export
  let lastMain = null;     // { opts, r }
  let lastCompare = null;  // [{label, opts, r}, ...]

  // ---- Excel export (SpreadsheetML 2003 — opens natively in Excel/LibreOffice/Sheets) ----
  function xmlEsc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function cellNum(v) { return `<Cell><Data ss:Type="Number">${isFinite(v) ? v : 0}</Data></Cell>`; }
  function cellStr(v) { return `<Cell><Data ss:Type="String">${xmlEsc(v)}</Data></Cell>`; }
  function row(cells) { return `<Row>${cells.join("")}</Row>`; }
  function sheet(name, rows) {
    return `<Worksheet ss:Name="${xmlEsc(name).slice(0, 31)}"><Table>${rows.join("")}</Table></Worksheet>`;
  }

  function buildWorkbook() {
    const cur = currency();
    const sheets = [];

    // --- Sheet 1: Inputs & summary ---
    if (lastMain) {
      const o = lastMain.opts, r = lastMain.r;
      const rows = [
        row([cellStr("Nexus Web Tools — Compound Interest Model")]),
        row([cellStr("Generated"), cellStr(new Date().toLocaleString())]),
        row([cellStr("Currency"), cellStr(cur)]),
        row([]),
        row([cellStr("INPUTS")]),
        row([cellStr("Starting capital"), cellNum(o.principal)]),
        row([cellStr("Annual interest rate (%)"), cellNum(o.annualRatePct)]),
        row([cellStr("Duration (years)"), cellNum(o.years)]),
        row([cellStr("Compounding frequency"), cellStr(o.compFreq)]),
        row([cellStr("Regular contribution"), cellNum(o.contribAmount)]),
        row([cellStr("Contribution frequency"), cellStr(o.contribFreq)]),
        row([cellStr("Contribution timing"), cellStr(o.contribTiming)]),
        row([cellStr("Stop contributing after year (0 = never)"), cellNum(o.contribStopYear)]),
        row([cellStr("Annual contribution increase (%)"), cellNum(o.annualContribIncreasePct)]),
        row([]),
        row([cellStr("RESULTS")]),
        row([cellStr("Future value"), cellNum(r.finalBalance)]),
        row([cellStr("Total invested"), cellNum(r.totalContributions)]),
        row([cellStr("Total interest"), cellNum(r.totalInterest)]),
        row([cellStr("Return on investment (%)"), cellNum(r.roi)]),
        row([cellStr("Effective annual rate (%)"), cellNum(r.effectiveAnnualRate)]),
      ];
      sheets.push(sheet("Inputs & Summary", rows));

      // --- Sheet 2: Yearly breakdown ---
      const yr = [row([cellStr("Year"), cellStr("Contributions"), cellStr("Total contributions"), cellStr("Interest"), cellStr("End balance")])];
      let cumIn2 = r.totalContributions - r.yearly.reduce((s, y) => s + y.contributions, 0);
      r.yearly.forEach((y) => { cumIn2 += y.contributions; yr.push(row([cellNum(y.year), cellNum(y.contributions), cellNum(cumIn2), cellNum(y.interest), cellNum(y.balance)])); });
      sheets.push(sheet("Yearly Breakdown", yr));
    }

    // --- Sheet 3: Scenario comparison (if run) ---
    if (lastCompare && lastCompare.length) {
      const head = row([
        cellStr("Scenario"), cellStr("Starting capital"), cellStr("Rate (%)"), cellStr("Years"),
        cellStr("Contrib stop year"), cellStr("Invested"), cellStr("Interest"), cellStr("Future value"),
      ]);
      const body = lastCompare.map((x) =>
        row([
          cellStr(x.label), cellNum(x.opts.principal), cellNum(x.opts.annualRatePct), cellNum(x.opts.years),
          cellNum(x.opts.contribStopYear), cellNum(x.r.totalContributions), cellNum(x.r.totalInterest), cellNum(x.r.finalBalance),
        ])
      );
      sheets.push(sheet("Scenario Comparison", [head, ...body]));
    }

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheets.join("\n")}
</Workbook>`;
  }

  function exportExcel() {
    if (!lastMain) runMain();
    const xml = buildWorkbook();
    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `compound-interest-model-${stamp}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }


  // ---- Main calculator ----
  function runMain() {
    const cur = currency();
    const opts = readInputs("m");
    const r = simulate(opts);
    lastMain = { opts, r };

    $("results").innerHTML = `
      <div class="stat"><span class="big">${fmt(r.finalBalance, cur)}</span><span class="lbl">Future value</span></div>
      <div class="stat"><span class="big">${fmt(r.totalContributions, cur)}</span><span class="lbl">Total invested</span></div>
      <div class="stat"><span class="big">${fmt(r.totalInterest, cur)}</span><span class="lbl">Total interest</span></div>
      <div class="stat"><span class="big">${fmtN(r.roi)}%</span><span class="lbl">Return on investment</span></div>
      <div class="stat"><span class="big">${fmtN(r.effectiveAnnualRate)}%</span><span class="lbl">Effective annual rate</span></div>`;

    // yearly breakdown table (with running total of all money put in, incl. starting capital)
    let cumIn = r.totalContributions - r.yearly.reduce((s, y) => s + y.contributions, 0); // = starting principal
    let rows = r.yearly
      .map((y) => {
        cumIn += y.contributions;
        return `<tr><td>${y.year}</td><td>${fmt(y.contributions, cur)}</td><td>${fmt(cumIn, cur)}</td><td>${fmt(
          y.interest,
          cur
        )}</td><td>${fmt(y.balance, cur)}</td></tr>`;
      })
      .join("");
    $("breakdownBody").innerHTML = rows;

    drawBars("mainChart", r.yearly, cur);
  }

  // ---- Round-number axis scaling (1/2/2.5/5 * 10^n steps) ----
  function niceNum(x, round) {
    const exp = Math.floor(Math.log10(x));
    const f = x / Math.pow(10, exp);
    let nf;
    if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
    else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nf * Math.pow(10, exp);
  }
  // Returns {max, step, ticks:[...]} giving a readable axis from 0..>=dataMax
  function niceScale(dataMax, targetTicks) {
    targetTicks = targetTicks || 5;
    if (!isFinite(dataMax) || dataMax <= 0) return { max: 1, step: 1, ticks: [0, 1] };
    const range = niceNum(dataMax, false);
    const step = niceNum(range / (targetTicks - 1), true);
    const max = Math.ceil(dataMax / step) * step;
    const ticks = [];
    for (let v = 0; v <= max + step * 0.5; v += step) ticks.push(v);
    return { max, step, ticks };
  }

  // ---- Inline SVG bar chart (balance growth) with scaled y-axis ----
  function drawBars(svgId, yearly, cur) {
    const svg = $(svgId);
    if (!svg || !yearly.length) return;
    const W = 640, H = 230, padL = 56, padR = 14, padT = 14, padB = 26;
    const dataMax = Math.max(...yearly.map((y) => y.balance), 1);
    const sc = niceScale(dataMax, 5);
    const max = sc.max;
    const plotH = H - padT - padB;
    const plotW = W - padL - padR;
    const yAt = (v) => (H - padB) - (v / max) * plotH;
    const bw = plotW / yearly.length;

    // y gridlines + round labels
    let grid = "";
    sc.ticks.forEach((v) => {
      const y = yAt(v);
      grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="#eef1f7"/>`;
      grid += `<text x="${padL - 6}" y="${(y + 3).toFixed(1)}" font-size="9" text-anchor="end" fill="#9aa3b8">${shortCur(v, cur)}</text>`;
    });

    let bars = "";
    yearly.forEach((y, i) => {
      const h = (y.balance / max) * plotH;
      const x = padL + i * bw;
      const contribH = (cumContrib(yearly, y.year) / max) * plotH;
      bars += `<rect x="${(x + bw * 0.12).toFixed(1)}" y="${(H - padB - h).toFixed(1)}" width="${(bw * 0.76).toFixed(1)}" height="${h.toFixed(1)}" fill="#3b5bdb" rx="2"><title>Year ${y.year}: ${fmt(y.balance, cur)}</title></rect>`;
      bars += `<rect x="${(x + bw * 0.12).toFixed(1)}" y="${(H - padB - contribH).toFixed(1)}" width="${(bw * 0.76).toFixed(1)}" height="${contribH.toFixed(1)}" fill="#0f9d6b" rx="2" opacity="0.85"><title>Year ${y.year} invested: ${fmt(cumContrib(yearly, y.year), cur)}</title></rect>`;
      if (i === 0 || i === yearly.length - 1 || yearly.length <= 12) {
        bars += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - padB + 14}" font-size="10" text-anchor="middle" fill="#5b647a">${y.year}</text>`;
      }
    });
    svg.innerHTML = `${grid}<line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="#cfd6e4"/>${bars}`;
  }
  function cumContrib(yearly, uptoYear) {
    return yearly.filter((y) => y.year <= uptoYear).reduce((s, y) => s + y.contributions, 0);
  }

  // ---- Multi-line SVG chart: base + every comparison scenario ----
  const CMP_COLORS = ["#3b5bdb", "#0f9d6b", "#d9531e", "#8b5cf6", "#e11d8f", "#0891b2", "#ca8a04", "#475569"];
  function drawCompareLines(svgId, results, cur) {
    const svg = $(svgId);
    if (!svg || !results.length) return;
    const W = 640, H = 240, padL = 56, padR = 14, padT = 14, padB = 28;
    const maxYears = Math.max(...results.map((s) => s.r.yearly.length), 1);
    const dataMax = Math.max(...results.map((s) => Math.max(...s.r.yearly.map((y) => y.balance), 0)), 1);
    const sc = niceScale(dataMax, 5);
    const maxBal = sc.max;
    const xAt = (yr) => padL + ((yr) / maxYears) * (W - padL - padR);
    const yAt = (v) => (H - padB) - (v / maxBal) * (H - padT - padB);

    // y-axis gridlines + round-number labels
    let grid = "";
    sc.ticks.forEach((v) => {
      const y = yAt(v);
      grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="#eef1f7"/>`;
      grid += `<text x="${padL - 6}" y="${(y + 3).toFixed(1)}" font-size="9" text-anchor="end" fill="#9aa3b8">${shortCur(v, cur)}</text>`;
    });
    // x-axis labels (start + end year)
    grid += `<text x="${xAt(0)}" y="${H - 8}" font-size="9" text-anchor="middle" fill="#9aa3b8">Yr 0</text>`;
    grid += `<text x="${xAt(maxYears)}" y="${H - 8}" font-size="9" text-anchor="end" fill="#9aa3b8">Yr ${maxYears}</text>`;

    // one polyline per scenario, anchored at year 0 = starting principal
    let lines = "";
    results.forEach((s, i) => {
      const color = CMP_COLORS[i % CMP_COLORS.length];
      const pts = [[xAt(0), yAt(s.opts.principal)]].concat(
        s.r.yearly.map((y) => [xAt(y.year), yAt(y.balance)])
      );
      const d = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
      lines += `<polyline points="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
      const last = pts[pts.length - 1];
      lines += `<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3" fill="${color}"><title>${esc(s.label)}: ${fmt(s.r.finalBalance, cur)}</title></circle>`;
    });

    svg.innerHTML = `${grid}<line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="#d7dce8"/><line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" stroke="#d7dce8"/>${lines}`;

    // legend
    $("compareLegend").innerHTML = results
      .map((s, i) => {
        const color = CMP_COLORS[i % CMP_COLORS.length];
        return `<span class="leg-item"><span class="leg-swatch" style="background:${color}"></span>${esc(s.label)} — <strong>${fmt(s.r.finalBalance, cur)}</strong></span>`;
      })
      .join("");
  }
  // compact currency for axis labels (e.g. $1.2k, $3.4M)
  function shortCur(v, cur) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency", currency: cur, notation: "compact", maximumFractionDigits: 1,
      }).format(isFinite(v) ? v : 0);
    } catch (e) {
      return Math.round(v).toLocaleString();
    }
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---- Scenario comparison (advanced) ----
  function runCompare() {
    const cur = currency();
    const base = readInputs("m");
    const scenarios = [{ label: "Base (main inputs)", opts: base }];

    document.querySelectorAll(".scenario").forEach((el, idx) => {
      const o = Object.assign({}, base);
      const get = (cls) => el.querySelector("." + cls);
      const ov = (cls, key) => {
        const node = get(cls);
        if (node && node.value !== "") o[key] = parseFloat(node.value) || 0;
      };
      const ovStr = (cls, key) => {
        const node = get(cls);
        if (node && node.value !== "") o[key] = node.value;
      };
      ov("sPrincipal", "principal");
      ov("sRate", "annualRatePct");
      ov("sYears", "years");
      ovStr("sComp", "compFreq");
      ov("sContrib", "contribAmount");
      ovStr("sContribFreq", "contribFreq");
      ovStr("sTiming", "contribTiming");
      ov("sIncrease", "annualContribIncreasePct");
      ov("sStop", "contribStopYear");
      const lbl = get("sLabel").value || `Scenario ${idx + 1}`;
      scenarios.push({ label: lbl, opts: o });
    });

    const results = scenarios.map((s) => ({ label: s.label, opts: s.opts, r: simulate(s.opts) }));
    lastCompare = results;

    // comparison table
    let head = `<tr><th>Scenario</th><th>Start</th><th>Rate</th><th>Years</th><th>Contrib stop (yr)</th><th>Invested</th><th>Interest</th><th>Future value</th></tr>`;
    let body = results
      .map(
        (x) =>
          `<tr><td>${x.label}</td><td>${fmt(x.opts.principal, cur)}</td><td>${fmtN(x.opts.annualRatePct)}%</td><td>${fmtN(
            x.opts.years
          )}</td><td>${x.opts.contribStopYear === 0 ? "never" : x.opts.contribStopYear}</td><td>${fmt(
            x.r.totalContributions,
            cur
          )}</td><td>${fmt(x.r.totalInterest, cur)}</td><td><strong>${fmt(x.r.finalBalance, cur)}</strong></td></tr>`
      )
      .join("");
    $("compareTable").innerHTML = head + body;
    $("compareTableHead").hidden = false;

    // multi-line growth chart: base + all scenarios
    drawCompareLines("compareChart", results, cur);
    $("compareChartWrap").hidden = false;

    // year-by-year comparison table (end-of-year balance per scenario)
    const maxYears = Math.max(...results.map((s) => s.r.yearly.length), 0);
    if (maxYears > 0) {
      let yHead = `<tr><th>Year</th>${results.map((x) => `<th>${esc(x.label)}</th>`).join("")}</tr>`;
      let yBody = "";
      for (let yr = 1; yr <= maxYears; yr++) {
        const cells = results
          .map((x) => {
            const row = x.r.yearly.find((y) => y.year === yr);
            return `<td>${row ? fmt(row.balance, cur) : "—"}</td>`;
          })
          .join("");
        yBody += `<tr><td>${yr}</td>${cells}</tr>`;
      }
      $("compareYearly").innerHTML = yHead + yBody;
      $("compareYearlyHead").hidden = false;
      $("compareYearlyNote").hidden = false;
    }

    // best/worst callout
    const sorted = [...results].sort((a, b) => b.r.finalBalance - a.r.finalBalance);
    const best = sorted[0], worst = sorted[sorted.length - 1];
    const diff = best.r.finalBalance - worst.r.finalBalance;
    $("compareSummary").innerHTML =
      results.length > 1
        ? `<p class="hint"><strong>${best.label}</strong> wins with ${fmt(best.r.finalBalance, cur)} — that's ${fmt(
            diff,
            cur
          )} more than <strong>${worst.label}</strong>. Small changes in rate, duration or how long you keep contributing compound into large differences over time.</p>`
        : "";
  }

  function addScenario(values) {
    const wrap = $("scenarioList");
    const idx = wrap.children.length + 1;
    const div = document.createElement("div");
    div.className = "scenario adv-block";
    div.innerHTML = `
      <div class="grid">
        <div class="field"><label>Label</label><input class="sLabel" type="text" placeholder="Scenario ${idx}" value="${(values && values.label) || ""}"></div>
        <div class="field"><label>Starting capital</label><input class="sPrincipal" type="number" step="any" placeholder="leave blank = same"></div>
        <div class="field"><label>Interest rate %</label><input class="sRate" type="number" step="any" placeholder="leave blank = same"></div>
        <div class="field"><label>Duration (yrs)</label><input class="sYears" type="number" step="any" placeholder="leave blank = same"></div>
        <div class="field"><label>Compounding</label>
          <select class="sComp"><option value="">— same —</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="fortnightly">Fortnightly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="halfyearly">Half-yearly</option><option value="yearly">Yearly</option></select>
        </div>
        <div class="field"><label>Contribution / period</label><input class="sContrib" type="number" step="any" placeholder="leave blank = same"></div>
        <div class="field"><label>Contribution frequency</label>
          <select class="sContribFreq"><option value="">— same —</option><option value="weekly">Weekly</option><option value="fortnightly">Fortnightly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select>
        </div>
        <div class="field"><label>Contribution timing</label>
          <select class="sTiming"><option value="">— same —</option><option value="end">End of period</option><option value="begin">Start of period</option></select>
        </div>
        <div class="field"><label>Annual contribution increase %</label><input class="sIncrease" type="number" step="any" placeholder="leave blank = same"></div>
        <div class="field"><label>Stop contributing after yr</label><input class="sStop" type="number" step="1" placeholder="0 = never"></div>
      </div>
      <button type="button" class="rmScenario adv-toggle" style="margin-top:8px">Remove scenario</button>`;
    wrap.appendChild(div);
    div.querySelector(".rmScenario").addEventListener("click", () => { div.remove(); });
  }

  // ---- persistence (localStorage) ----
  const STORE_KEY = "nwt-compound-interest-v2";
  const MAIN_IDS = ["ccyCurrency", "mPrincipal", "mRate", "mYears", "mComp",
    "mContrib", "mContribFreq", "mTiming", "mStopYear", "mIncrease"];
  let DEFAULTS = {}; // captured from initial HTML values before any restore
  let restoring = false;

  function captureDefaults() {
    MAIN_IDS.forEach((id) => { const el = $(id); if (el) DEFAULTS[id] = el.value; });
  }
  function readScenarios() {
    const list = [];
    document.querySelectorAll(".scenario").forEach((el) => {
      const get = (c) => el.querySelector("." + c);
      list.push({
        label: (get("sLabel") || {}).value || "",
        principal: (get("sPrincipal") || {}).value || "",
        rate: (get("sRate") || {}).value || "",
        years: (get("sYears") || {}).value || "",
        comp: (get("sComp") || {}).value || "",
        contrib: (get("sContrib") || {}).value || "",
        contribFreq: (get("sContribFreq") || {}).value || "",
        timing: (get("sTiming") || {}).value || "",
        increase: (get("sIncrease") || {}).value || "",
        stop: (get("sStop") || {}).value || "",
      });
    });
    return list;
  }
  function saveState() {
    if (restoring) return;
    try {
      const main = {};
      MAIN_IDS.forEach((id) => { const el = $(id); if (el) main[id] = el.value; });
      localStorage.setItem(STORE_KEY, JSON.stringify({ main, scenarios: readScenarios() }));
    } catch (e) { /* storage disabled/full — fail silently */ }
  }
  function restoreState() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) { data = null; }
    if (!data || !data.main) return false;
    restoring = true;
    MAIN_IDS.forEach((id) => {
      const el = $(id);
      if (el && data.main[id] !== undefined && data.main[id] !== null) el.value = data.main[id];
    });
    // rebuild scenarios exactly as saved
    $("scenarioList").innerHTML = "";
    (data.scenarios || []).forEach((sc) => {
      addScenario({ label: sc.label });
      const row = $("scenarioList").lastElementChild;
      if (!row) return;
      const set = (c, v) => { const n = row.querySelector("." + c); if (n && v !== "") n.value = v; };
      set("sPrincipal", sc.principal); set("sRate", sc.rate);
      set("sYears", sc.years); set("sComp", sc.comp);
      set("sContrib", sc.contrib); set("sContribFreq", sc.contribFreq);
      set("sTiming", sc.timing); set("sIncrease", sc.increase);
      set("sStop", sc.stop);
    });
    restoring = false;
    return true;
  }
  function resetDefaults() {
    if (!confirm("Reset all inputs and scenarios back to the defaults? Your saved model will be cleared.")) return;
    restoring = true;
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    MAIN_IDS.forEach((id) => { const el = $(id); if (el && DEFAULTS[id] !== undefined) el.value = DEFAULTS[id]; });
    // reset scenarios to the single seeded example
    $("scenarioList").innerHTML = "";
    addScenario({ label: "Higher rate (+2%)" });
    const firstRate = document.querySelector(".sRate");
    if (firstRate) firstRate.value = ((parseFloat($("mRate").value) || 5) + 2).toString();
    // clear any rendered comparison output
    $("compareTable").innerHTML = "";
    if ($("compareTableHead")) $("compareTableHead").hidden = true;
    if ($("compareChartWrap")) $("compareChartWrap").hidden = true;
    if ($("compareYearly")) $("compareYearly").innerHTML = "";
    if ($("compareYearlyHead")) $("compareYearlyHead").hidden = true;
    if ($("compareYearlyNote")) $("compareYearlyNote").hidden = true;
    if ($("compareSummary")) $("compareSummary").innerHTML = "";
    restoring = false;
    runMain();
    saveState();
  }

  // ---- wire up ----
  document.addEventListener("DOMContentLoaded", function () {
    captureDefaults();
    // purge any pre-feature saved model (older schema) so new fields/tables appear
    try { localStorage.removeItem("nwt-compound-interest-v1"); } catch (e) {}
    // recalc + persist on any main input change
    document.querySelectorAll("[id^='m']").forEach((el) => {
      el.addEventListener("input", () => { runMain(); saveState(); });
      el.addEventListener("change", () => { runMain(); saveState(); });
    });
    $("ccyCurrency").addEventListener("change", () => { runMain(); if ($("compareTable").innerHTML) runCompare(); saveState(); });

    // advanced toggle
    const advBtn = $("advToggle");
    advBtn.addEventListener("click", () => {
      const adv = $("advanced");
      const open = adv.hasAttribute("hidden");
      if (open) { adv.removeAttribute("hidden"); advBtn.setAttribute("aria-expanded", "true"); advBtn.innerHTML = "⚙️ Compare scenarios ▴"; }
      else { adv.setAttribute("hidden", ""); advBtn.setAttribute("aria-expanded", "false"); advBtn.innerHTML = "⚙️ Compare scenarios ▾"; }
    });

    $("addScenario").addEventListener("click", () => { addScenario(); saveState(); });
    $("runCompare").addEventListener("click", runCompare);
    $("exportXls").addEventListener("click", exportExcel);
    $("resetDefaults").addEventListener("click", resetDefaults);

    // persist scenario edits + additions/removals via delegation
    $("scenarioList").addEventListener("input", saveState);
    $("scenarioList").addEventListener("change", saveState);
    $("scenarioList").addEventListener("click", (e) => {
      if (e.target && e.target.classList.contains("rmScenario")) setTimeout(saveState, 0);
    });

    // breakdown toggle
    $("bkToggle").addEventListener("click", () => {
      const b = $("breakdownWrap");
      if (b.hasAttribute("hidden")) { b.removeAttribute("hidden"); $("bkToggle").textContent = "Hide yearly breakdown ▴"; }
      else { b.setAttribute("hidden", ""); $("bkToggle").textContent = "Show yearly breakdown ▾"; }
    });

    // restore saved model if present; otherwise seed one example scenario
    const restored = restoreState();
    if (!restored) {
      addScenario({ label: "Higher rate (+2%)" });
      const firstRate = document.querySelector(".sRate");
      if (firstRate) firstRate.value = ((parseFloat($("mRate").value) || 5) + 2).toString();
    }

    runMain();
  });
})();
