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

  // ---- Main calculator ----
  function runMain() {
    const cur = currency();
    const opts = readInputs("m");
    const r = simulate(opts);

    $("results").innerHTML = `
      <div class="stat"><span class="big">${fmt(r.finalBalance, cur)}</span><span class="lbl">Future value</span></div>
      <div class="stat"><span class="big">${fmt(r.totalContributions, cur)}</span><span class="lbl">Total invested</span></div>
      <div class="stat"><span class="big">${fmt(r.totalInterest, cur)}</span><span class="lbl">Total interest</span></div>
      <div class="stat"><span class="big">${fmtN(r.roi)}%</span><span class="lbl">Return on investment</span></div>
      <div class="stat"><span class="big">${fmtN(r.effectiveAnnualRate)}%</span><span class="lbl">Effective annual rate</span></div>`;

    // yearly breakdown table
    let rows = r.yearly
      .map(
        (y) =>
          `<tr><td>${y.year}</td><td>${fmt(y.contributions, cur)}</td><td>${fmt(y.interest, cur)}</td><td>${fmt(
            y.balance,
            cur
          )}</td></tr>`
      )
      .join("");
    $("breakdownBody").innerHTML = rows;

    drawBars("mainChart", r.yearly, cur);
  }

  // ---- Simple inline SVG bar chart (balance growth) ----
  function drawBars(svgId, yearly, cur) {
    const svg = $(svgId);
    if (!svg || !yearly.length) return;
    const W = 640, H = 220, pad = 34;
    const max = Math.max(...yearly.map((y) => y.balance), 1);
    const bw = (W - pad * 2) / yearly.length;
    let bars = "";
    yearly.forEach((y, i) => {
      const h = ((y.balance / max) * (H - pad * 2));
      const x = pad + i * bw;
      const yTop = H - pad - h;
      const contribH = (y => ((cumContrib(yearly, y.year) / max) * (H - pad * 2)))(y);
      bars += `<rect x="${x + bw * 0.12}" y="${H - pad - h}" width="${bw * 0.76}" height="${h}" fill="#3b5bdb" rx="2"><title>Year ${y.year}: ${fmt(y.balance, cur)}</title></rect>`;
      bars += `<rect x="${x + bw * 0.12}" y="${H - pad - contribH}" width="${bw * 0.76}" height="${contribH}" fill="#0f9d6b" rx="2" opacity="0.85"><title>Year ${y.year} invested: ${fmt(cumContrib(yearly, y.year), cur)}</title></rect>`;
      if (i === 0 || i === yearly.length - 1 || yearly.length <= 12) {
        bars += `<text x="${x + bw / 2}" y="${H - pad + 14}" font-size="10" text-anchor="middle" fill="#5b647a">${y.year}</text>`;
      }
    });
    svg.innerHTML = `<line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#e3e7f0"/>${bars}`;
  }
  function cumContrib(yearly, uptoYear) {
    return yearly.filter((y) => y.year <= uptoYear).reduce((s, y) => s + y.contributions, 0);
  }

  // ---- Scenario comparison (advanced) ----
  function runCompare() {
    const cur = currency();
    const base = readInputs("m");
    const scenarios = [{ label: "Base (main inputs)", opts: base }];

    document.querySelectorAll(".scenario").forEach((el, idx) => {
      const o = Object.assign({}, base);
      const get = (cls) => el.querySelector("." + cls);
      const ov = (cls, key, isPct) => {
        const node = get(cls);
        if (node && node.value !== "") o[key] = parseFloat(node.value) || 0;
      };
      ov("sPrincipal", "principal");
      ov("sRate", "annualRatePct");
      ov("sYears", "years");
      ov("sContrib", "contribAmount");
      ov("sStop", "contribStopYear");
      const lbl = get("sLabel").value || `Scenario ${idx + 1}`;
      scenarios.push({ label: lbl, opts: o });
    });

    const results = scenarios.map((s) => ({ label: s.label, opts: s.opts, r: simulate(s.opts) }));

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
        <div class="field"><label>Contribution / period</label><input class="sContrib" type="number" step="any" placeholder="leave blank = same"></div>
        <div class="field"><label>Stop contributing after yr</label><input class="sStop" type="number" step="1" placeholder="0 = never"></div>
      </div>
      <button type="button" class="rmScenario adv-toggle" style="margin-top:8px">Remove scenario</button>`;
    wrap.appendChild(div);
    div.querySelector(".rmScenario").addEventListener("click", () => { div.remove(); });
  }

  // ---- wire up ----
  document.addEventListener("DOMContentLoaded", function () {
    // recalc on any main input change
    document.querySelectorAll("[id^='m']").forEach((el) => {
      el.addEventListener("input", runMain);
      el.addEventListener("change", runMain);
    });
    $("ccyCurrency").addEventListener("change", () => { runMain(); if ($("compareTable").innerHTML) runCompare(); });

    // advanced toggle
    const advBtn = $("advToggle");
    advBtn.addEventListener("click", () => {
      const adv = $("advanced");
      const open = adv.hasAttribute("hidden");
      if (open) { adv.removeAttribute("hidden"); advBtn.setAttribute("aria-expanded", "true"); advBtn.innerHTML = "⚙️ Compare scenarios ▴"; }
      else { adv.setAttribute("hidden", ""); advBtn.setAttribute("aria-expanded", "false"); advBtn.innerHTML = "⚙️ Compare scenarios ▾"; }
    });

    $("addScenario").addEventListener("click", () => addScenario());
    $("runCompare").addEventListener("click", runCompare);

    // breakdown toggle
    $("bkToggle").addEventListener("click", () => {
      const b = $("breakdownWrap");
      if (b.hasAttribute("hidden")) { b.removeAttribute("hidden"); $("bkToggle").textContent = "Hide yearly breakdown ▴"; }
      else { b.setAttribute("hidden", ""); $("bkToggle").textContent = "Show yearly breakdown ▾"; }
    });

    // seed one example scenario so the feature is discoverable
    addScenario({ label: "Higher rate (+2%)" });
    const firstRate = document.querySelector(".sRate");
    if (firstRate) firstRate.value = ((parseFloat($("mRate").value) || 5) + 2).toString();

    runMain();
  });
})();
