/* Nexus Web Tools — Mortgage Calculator
   Core engine + UI wiring + rent-vs-buy + comparison. Pure vanilla JS, no deps. */
(function () {
  "use strict";

  const FREQ_PER_YEAR = { weekly: 52, fortnightly: 26, monthly: 12 };
  const $ = (id) => document.getElementById(id);
  const fmt = (n, cur) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0);
  const fmtD = (n, cur) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 2 }).format(isFinite(n) ? n : 0);
  const fmtN = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(isFinite(n) ? n : 0);
  const fmtP = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(isFinite(n) ? n : 0) + "%";
  const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  // ════════════════════ MORTGAGE SIMULATION ════════════════════
  function simulate(opts) {
    const { price, deposit, depositMode, rate, term, freq, repayType,
            extra, ioYears, annualTax, annualIns, annualLMI, annualHOA } = opts;
    const freqPerYear = FREQ_PER_YEAR[freq] || 12;
    const depositAmt = depositMode === "pct" ? price * deposit / 100 : deposit;
    const loan = Math.max(price - depositAmt, 0);
    const periodicRate = rate / 100 / freqPerYear;
    const totalPeriods = term * freqPerYear;
    const ioPeriods = (ioYears || 0) * freqPerYear;
    const lmiAmt = deposit < 20 && depositMode === "pct" && annualLMI > 0
      ? (annualLMI > 0 ? annualLMI : 0) : (annualLMI > 0 ? annualLMI : 0);

    // Minimum periodic repayment (P&I or IO)
    let minRepay;
    if (repayType === "io" || ioPeriods > 0) {
      // IO repayment during IO period
      minRepay = loan * periodicRate;
    }
    // P&I repayment for rest of term
    let piRepay = 0;
    if (repayType === "pi" || ioPeriods < totalPeriods) {
      const piPeriods = totalPeriods - ioPeriods;
      if (periodicRate > 0 && piPeriods > 0) {
        piRepay = loan * periodicRate * Math.pow(1 + periodicRate, piPeriods)
                  / (Math.pow(1 + periodicRate, piPeriods) - 1);
      } else if (periodicRate === 0) {
        piRepay = loan / piPeriods;
      }
    }

    // Simulate each period
    let balance = loan;
    let totalInterest = 0;
    let totalPrincipal = 0;
    let totalExtra = 0;
    const schedule = [];
    let yearInterest = 0, yearPrincipal = 0, yearExtra = 0, yearBalance = loan;

    for (let p = 1; p <= totalPeriods; p++) {
      const yearIdx = Math.floor((p - 1) / freqPerYear);
      const inIO = p <= ioPeriods || repayType === "io";
      const interest = balance * periodicRate;
      const baseRepay = inIO ? Math.max(loan * periodicRate, 0) : piRepay;
      const availableForPrincipal = baseRepay - interest + extra;

      let principalPaid, actualExtra = 0;
      if (availableForPrincipal > 0) {
        principalPaid = Math.min(availableForPrincipal, balance);
        if (availableForPrincipal > principalPaid) {
          actualExtra = 0; // already counted
        }
        actualExtra = Math.max(extra, 0) > 0 && principalPaid > (baseRepay - interest)
          ? Math.min(extra, balance - Math.max(baseRepay - interest, 0))
          : 0;
        // Simplify: principal from base + extra
        const fromBase = Math.max(baseRepay - interest, 0);
        const fromExtra = Math.min(Math.max(extra, 0), balance - fromBase);
        principalPaid = fromBase + fromExtra;
        actualExtra = fromExtra;
      } else {
        principalPaid = 0;
        actualExtra = 0;
      }

      balance -= principalPaid;
      if (balance < 0) balance = 0;

      totalInterest += interest;
      totalPrincipal += (principalPaid - actualExtra);
      totalExtra += actualExtra;
      yearInterest += interest;
      yearPrincipal += (principalPaid - actualExtra);
      yearExtra += actualExtra;

      schedule.push({
        period: p,
        repayment: baseRepay + Math.max(extra, 0),
        interest,
        principal: principalPaid - actualExtra,
        extra: actualExtra,
        balance
      });

      // Yearly snapshot
      if (p % freqPerYear === 0 || p === totalPeriods) {
        const year = yearIdx + 1;
        schedule[schedule.length - 1]._yearly = {
          year, yearInterest, yearPrincipal, yearExtra,
          yearBalance: balance
        };
        yearInterest = 0; yearPrincipal = 0; yearExtra = 0;
      }

      if (balance <= 0) break;
    }

    const totalRepaid = totalInterest + totalPrincipal + totalExtra;
    const annualCosts = annualTax + annualIns + lmiAmt + annualHOA;

    return {
      loan, depositAmt, minRepay: repayType === "io" ? loan * periodicRate : piRepay,
      totalInterest, totalPrincipal, totalExtra, totalRepaid,
      annualCosts, totalCost: totalRepaid + annualCosts * term,
      schedule, term, freqPerYear
    };
  }

  // ════════════════════ RENT VS BUY ════════════════════
  function rentVsBuy(mortOpts, rvOpts) {
    const r = simulate(mortOpts);
    const cur = currency();
    const freq = mortOpts.freq || "monthly";
    const fpy = FREQ_PER_YEAR[freq] || 12;
    const years = mortOpts.term;
    const loan = r.loan;

    // Buy path
    const buyPath = [];
    let propValue = mortOpts.price;
    let buyEquity = mortOpts.price - loan; // deposit = instant equity
    let buyNetWorth = -mortOpts.depositAmt; // start: deposit spent
    let cumBuyCosts = mortOpts.depositAmt + rvOpts.stampDuty; // upfront costs

    for (let yr = 1; yr <= years; yr++) {
      // Property appreciation
      propValue *= (1 + rvOpts.apprec / 100);
      // Mortgage costs this year (from schedule)
      const yrData = r.schedule.filter(s => s._yearly && s._yearly.year === yr);
      const yrMort = yrData.length > 0 ? yrData[0]._yearly : null;
      const yrMortInterest = yrMort ? yrMort.yearInterest : 0;
      const yrMortPrincipal = yrMort ? yrMort.yearPrincipal + yrMort.yearExtra : 0;
      const yrMortRepay = yrMortInterest + yrMortPrincipal;
      // Ongoing costs
      const maint = propValue * (rvOpts.maint / 100) / (1 + rvOpts.apprec / 100); // based on start-of-year value
      const yrOngoing = r.annualCosts + (mortOpts.price * rvOpts.maint / 100); // maintenance on original price for simplicity
      cumBuyCosts += yrMortRepay + yrOngoing;
      // Equity = property value - remaining loan balance
      const endBalance = yrMort ? yrMort.yearBalance : 0;
      buyEquity = propValue - endBalance;
      buyPath.push({
        year: yr, propValue, loanBalance: endBalance, equity: buyEquity,
        mortRepay: yrMortRepay, mortInterest: yrMortInterest,
        mortPrincipal: yrMortPrincipal, ongoing: yrOngoing,
        cumCosts: cumBuyCosts, netWorth: buyEquity - cumBuyCosts + mortOpts.depositAmt
      });
    }

    // Rent path
    const rentPath = [];
    let weeklyRent = rvOpts.weeklyRent;
    let investPool = mortOpts.depositAmt + rvOpts.stampDuty; // same upfront cash invested
    let cumRentPaid = 0;

    // After-tax investment return
    const afterTaxReturn = rvOpts.invRate * (1 - rvOpts.taxRate / 100);

    for (let yr = 1; yr <= years; yr++) {
      // Annual rent
      const annualRent = weeklyRent * 52;
      cumRentPaid += annualRent;
      // Mortgage holder's total annual cost
      const yrBuy = buyPath[yr - 1];
      const buyAnnualTotal = yrBuy.mortRepay + yrBuy.ongoing;
      // Renter invests the difference (if buying costs more)
      const investDiff = Math.max(buyAnnualTotal - annualRent, 0);
      // Renter also invests the annual cost difference
      investPool += investDiff;
      // Apply investment return
      investPool *= (1 + afterTaxReturn / 100);
      // Rent increase
      weeklyRent *= (1 + rvOpts.rentGrow / 100);

      rentPath.push({
        year: yr, annualRent, cumRentPaid, investPool,
        investedThisYear: investDiff
      });
    }

    // Crossover point
    let crossoverYear = null;
    for (let yr = 1; yr <= years; yr++) {
      const buyNet = buyPath[yr - 1].equity;
      const rentNet = rentPath[yr - 1].investPool;
      if (buyNet > rentNet && !crossoverYear) crossoverYear = yr;
      if (buyNet < rentNet && crossoverYear) crossoverYear = null; // rent overtakes again
    }

    return { buyPath, rentPath, crossoverYear };
  }

  // ════════════════════ CHART HELPERS ════════════════════
  function niceNum(x, round) {
    const exp = Math.floor(Math.log10(Math.max(x, 1e-10)));
    const f = x / Math.pow(10, exp);
    let nf;
    if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
    else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nf * Math.pow(10, exp);
  }
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
  function shortCur(v, cur) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency", currency: cur, notation: "compact", maximumFractionDigits: 1
      }).format(isFinite(v) ? v : 0);
    } catch (e) { return Math.round(v).toLocaleString(); }
  }

  // ════════════════════ MAIN CHART: Amortisation Area ════════════════════
  function drawMainChart(r, cur) {
    const svg = $("mainChart");
    if (!svg || !r.schedule.length) return;
    const W = 700, H = 300, padL = 58, padR = 14, padT = 14, padB = 30;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const dataMax = Math.max(r.loan, 1);
    const sc = niceScale(dataMax, 5);
    const max = sc.max;
    const yAt = (v) => (H - padB) - (v / max) * plotH;

    // Yearly aggregates for chart
    const yearly = [];
    let cumInterest = 0, cumPrincipal = 0;
    r.schedule.forEach(s => {
      cumInterest += s.interest;
      cumPrincipal += s.principal + s.extra;
      if (s._yearly) {
        yearly.push({
          year: s._yearly.year,
          balance: s.balance,
          cumInterest,
          cumPrincipal
        });
      }
    });
    if (!yearly.length) return;

    const n = yearly.length;
    const xStep = plotW / n;

    // Grid
    let grid = "";
    sc.ticks.forEach(v => {
      const y = yAt(v);
      grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W-padR}" y2="${y.toFixed(1)}" stroke="#eef1f7"/>`;
      grid += `<text x="${padL-6}" y="${(y+3).toFixed(1)}" font-size="9" text-anchor="end" fill="#9aa3b8">${shortCur(v,cur)}</text>`;
    });

    // Area: remaining balance (blue)
    let balPts = `M${padL},${yAt(r.loan).toFixed(1)}`;
    yearly.forEach((y, i) => {
      balPts += ` L${(padL + i * xStep).toFixed(1)},${yAt(y.balance).toFixed(1)}`;
    });
    balPts += ` L${(padL + (n-1)*xStep).toFixed(1)},${(H-padB)} L${padL},${H-padB} Z`;

    // Area: cumulative interest (orange)
    let intPts = `M${padL},${(H-padB)}`;
    yearly.forEach((y, i) => {
      intPts += ` L${(padL + i * xStep).toFixed(1)},${yAt(y.cumInterest).toFixed(1)}`;
    });
    intPts += ` L${(padL + (n-1)*xStep).toFixed(1)},${(H-padB)} Z`;

    // Area: cumulative principal (green)
    let prinPts = `M${padL},${(H-padB)}`;
    yearly.forEach((y, i) => {
      prinPts += ` L${(padL + i * xStep).toFixed(1)},${yAt(y.cumPrincipal).toFixed(1)}`;
    });
    prinPts += ` L${(padL + (n-1)*xStep).toFixed(1)},${(H-padB)} Z`;

    // X-axis labels
    let xLabels = "";
    yearly.forEach((y, i) => {
      if (i === 0 || i === n - 1 || n <= 15 || y.year % 5 === 0) {
        xLabels += `<text x="${(padL + i * xStep).toFixed(1)}" y="${H - 10}" font-size="9" text-anchor="middle" fill="#5b647a">Yr ${y.year}</text>`;
      }
    });

    svg.innerHTML = `${grid}
      <line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" stroke="#cfd6e4"/>
      <path d="${intPts}" fill="#f59e0b" opacity="0.3"/>
      <path d="${prinPts}" fill="#0f9d6b" opacity="0.35"/>
      <path d="${balPts}" fill="#3b5bdb" opacity="0.18"/>
      <polyline points="${yearly.map((y,i) => `${(padL+i*xStep).toFixed(1)},${yAt(y.balance).toFixed(1)}`).join(' ')}" fill="none" stroke="#3b5bdb" stroke-width="2.2" stroke-linejoin="round"/>
      <polyline points="${yearly.map((y,i) => `${(padL+i*xStep).toFixed(1)},${yAt(y.cumInterest).toFixed(1)}`).join(' ')}" fill="none" stroke="#ca8a04" stroke-width="1.8" stroke-linejoin="round" stroke-dasharray="4,3"/>
      ${xLabels}`;

    $("mainChartKey").innerHTML = `
      <span class="key-blue">■</span> Balance remaining &nbsp;
      <span class="key-green">■</span> Cumulative principal &nbsp;
      <span style="color:#ca8a04">■</span> Cumulative interest`;
  }

  // ════════════════════ RENT VS BUY CHART ════════════════════
  function drawRvbChart(rvb, cur) {
    const svg = $("rvbChart");
    if (!svg) return;
    const W = 700, H = 300, padL = 58, padR = 14, padT = 14, padB = 30;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const n = rvb.buyPath.length;
    if (!n) return;

    const allVals = [
      ...rvb.buyPath.map(b => b.equity),
      ...rvb.buyPath.map(b => b.propValue),
      ...rvb.rentPath.map(r => r.investPool)
    ];
    const dataMax = Math.max(...allVals, 1);
    const sc = niceScale(dataMax, 5);
    const max = sc.max;
    const yAt = (v) => (H - padB) - (v / max) * plotH;
    const xAt = (i) => padL + (i / (n - 1 || 1)) * plotW;

    // Grid
    let grid = "";
    sc.ticks.forEach(v => {
      const y = yAt(v);
      grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W-padR}" y2="${y.toFixed(1)}" stroke="#eef1f7"/>`;
      grid += `<text x="${padL-6}" y="${(y+3).toFixed(1)}" font-size="9" text-anchor="end" fill="#9aa3b8">${shortCur(v,cur)}</text>`;
    });
    grid += `<text x="${xAt(0)}" y="${H-8}" font-size="9" text-anchor="middle" fill="#9aa3b8">Yr 1</text>`;
    grid += `<text x="${xAt(n-1)}" y="${H-8}" font-size="9" text-anchor="end" fill="#9aa3b8">Yr ${n}</text>`;

    // Lines: Property value, Home equity, Investment pool
    let propLine = "", equityLine = "", investLine = "";
    rvb.buyPath.forEach((b, i) => {
      const x = xAt(i).toFixed(1);
      propLine += `${i === 0 ? "M" : "L"}${x},${yAt(b.propValue).toFixed(1)} `;
      equityLine += `${i === 0 ? "M" : "L"}${x},${yAt(b.equity).toFixed(1)} `;
    });
    rvb.rentPath.forEach((r, i) => {
      investLine += `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(r.investPool).toFixed(1)} `;
    });

    // Areas under equity and invest pool
    let equityArea = equityLine + `L${xAt(n-1).toFixed(1)},${(H-padB)} L${xAt(0).toFixed(1)},${(H-padB)} Z`;
    let investArea = investLine + `L${xAt(n-1).toFixed(1)},${(H-padB)} L${xAt(0).toFixed(1)},${(H-padB)} Z`;

    svg.innerHTML = `${grid}
      <line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" stroke="#cfd6e4"/>
      <path d="${investArea}" fill="#0f9d6b" opacity="0.12"/>
      <path d="${equityArea}" fill="#3b5bdb" opacity="0.12"/>
      <path d="${propLine}" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-dasharray="6,4" stroke-linejoin="round"/>
      <path d="${equityLine}" fill="none" stroke="#3b5bdb" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="${investLine}" fill="none" stroke="#0f9d6b" stroke-width="2.4" stroke-linejoin="round"/>`;

    // Dots at final year
    const lastBuy = rvb.buyPath[n-1];
    const lastRent = rvb.rentPath[n-1];
    svg.innerHTML += `
      <circle cx="${xAt(n-1).toFixed(1)}" cy="${yAt(lastBuy.equity).toFixed(1)}" r="4" fill="#3b5bdb"><title>Home equity Yr ${n}: ${fmt(lastBuy.equity,cur)}</title></circle>
      <circle cx="${xAt(n-1).toFixed(1)}" cy="${yAt(lastRent.investPool).toFixed(1)}" r="4" fill="#0f9d6b"><title>Investment pool Yr ${n}: ${fmt(lastRent.investPool,cur)}</title></circle>
      <circle cx="${xAt(n-1).toFixed(1)}" cy="${yAt(lastBuy.propValue).toFixed(1)}" r="3" fill="#8b5cf6"><title>Property value Yr ${n}: ${fmt(lastBuy.propValue,cur)}</title></circle>`;

    $("rvbLegend").innerHTML = `
      <span class="leg-item"><span class="leg-swatch" style="background:#3b5bdb"></span><strong>Home equity</strong></span>
      <span class="leg-item"><span class="leg-swatch" style="background:#0f9d6b"></span><strong>Renter's investment pool</strong></span>
      <span class="leg-item"><span class="leg-swatch" style="background:#8b5cf6;border-style:dashed"></span><strong>Property value</strong></span>`;
  }

  // ════════════════════ COMPARISON CHART ════════════════════
  const CMP_COLORS = ["#3b5bdb","#0f9d6b","#d9531e","#8b5cf6","#e11d8f","#0891b2","#ca8a04","#475569"];
  function drawCmpChart(results, cur) {
    const svg = $("cmpChart");
    if (!svg || !results.length) return;
    const W = 700, H = 300, padL = 58, padR = 14, padT = 14, padB = 30;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const n = results[0].r.schedule.filter(s => s._yearly).length;
    if (!n) return;

    const dataMax = Math.max(...results.map(s => s.r.loan), 1);
    const sc = niceScale(dataMax, 5);
    const max = sc.max;
    const yAt = (v) => (H - padB) - (v / max) * plotH;
    const xAt = (i) => padL + (i / (n - 1 || 1)) * plotW;

    let grid = "";
    sc.ticks.forEach(v => {
      const y = yAt(v);
      grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W-padR}" y2="${y.toFixed(1)}" stroke="#eef1f7"/>`;
      grid += `<text x="${padL-6}" y="${(y+3).toFixed(1)}" font-size="9" text-anchor="end" fill="#9aa3b8">${shortCur(v,cur)}</text>`;
    });

    let lines = "";
    results.forEach((s, idx) => {
      const color = CMP_COLORS[idx % CMP_COLORS.length];
      const yearly = s.r.schedule.filter(x => x._yearly);
      let pts = yearly.map((y, i) => `${xAt(i).toFixed(1)},${yAt(y._yearly.yearBalance).toFixed(1)}`).join(" ");
      lines += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/>`;
      const last = yearly[yearly.length - 1];
      if (last) {
        const lx = xAt(yearly.length - 1).toFixed(1);
        lines += `<circle cx="${lx}" cy="${yAt(last._yearly.yearBalance).toFixed(1)}" r="3.5" fill="${color}"><title>${esc(s.label)}: ${fmt(last._yearly.yearBalance,cur)}</title></circle>`;
      }
    });

    svg.innerHTML = `${grid}
      <line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" stroke="#cfd6e4"/>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}" stroke="#d7dce8"/>
      ${lines}
      <text x="${xAt(0)}" y="${H-8}" font-size="9" text-anchor="middle" fill="#9aa3b8">Yr 1</text>
      <text x="${xAt(n-1)}" y="${H-8}" font-size="9" text-anchor="end" fill="#9aa3b8">Yr ${n}</text>`;

    $("cmpLegend").innerHTML = results.map((s, i) => {
      const c = CMP_COLORS[i % CMP_COLORS.length];
      return `<span class="leg-item"><span class="leg-swatch" style="background:${c}"></span><strong>${esc(s.label)}</strong> — ${fmt(s.r.totalInterest,cur)} interest</span>`;
    }).join("");
  }

  // ════════════════════ READ INPUTS ════════════════════
  function readMain() {
    const depMode = $("mDepositMode").value;
    return {
      price: parseFloat($("mPrice").value) || 0,
      deposit: parseFloat($("mDeposit").value) || 0,
      depositMode: depMode,
      rate: parseFloat($("mRate").value) || 0,
      term: parseInt($("mTerm").value) || 30,
      freq: $("mFreq").value,
      repayType: $("mRepayType").value,
      extra: parseFloat($("mExtra").value) || 0,
      ioYears: parseInt($("mIOYears").value) || 0,
      annualTax: parseFloat($("mTax").value) || 0,
      annualIns: parseFloat($("mIns").value) || 0,
      annualLMI: parseFloat($("mLMI").value) || 0,
      annualHOA: parseFloat($("mHOA").value) || 0
    };
  }
  function currency() { return $("mCcy").value; }

  let lastResult = null;
  let currentScale = "monthly";

  // ════════════════════ RUN MAIN CALCULATOR ════════════════════
  function runMain() {
    const cur = currency();
    const opts = readMain();
    const r = simulate(opts);
    lastResult = { opts, r };

    const depositAmt = r.depositAmt;
    const lmiApplies = opts.depositMode === "pct" && opts.deposit < 20;
    const lmiLabel = lmiApplies ? `<div class="stat"><span class="big">${fmtD(opts.annualLMI * r.loan / 100, cur)}/yr</span><span class="lbl">LMI</span></div>` : "";

    $("results").innerHTML = `
      <div class="stat highlight"><span class="big">${fmtD(r.minRepay, cur)}</span><span class="lbl">${opts.freq} repayment</span></div>
      <div class="stat"><span class="big">${fmt(r.loan, cur)}</span><span class="lbl">Loan amount</span></div>
      <div class="stat"><span class="big">${fmt(depositAmt, cur)}</span><span class="lbl">Deposit${opts.depositMode === "pct" ? " (" + opts.deposit + "%)" : ""}</span></div>
      <div class="stat"><span class="big">${fmt(r.totalInterest, cur)}</span><span class="lbl">Total interest</span></div>
      <div class="stat"><span class="big">${fmt(r.totalRepaid, cur)}</span><span class="lbl">Total repaid</span></div>
      <div class="stat"><span class="big">${fmt(r.annualCosts, cur)}/yr</span><span class="lbl">Ongoing costs</span></div>
      ${lmiLabel}`;

    drawMainChart(r, cur);
    buildTable(r, cur);
  }

  // ════════════════════ AMORTISATION TABLE ════════════════════
  function buildTable(r, cur) {
    const scale = currentScale;
    let html = "";
    let thead = "", tbody = "";

    if (scale === "yearly") {
      thead = `<tr><th>Year</th><th>Repayment</th><th>Interest</th><th>Principal</th><th>Extra</th><th>Balance</th></tr>`;
      r.schedule.filter(s => s._yearly).forEach(s => {
        const y = s._yearly;
        tbody += `<tr><td>Year ${y.year}</td><td>${fmt(y.yearInterest + y.yearPrincipal + y.yearExtra, cur)}</td><td>${fmt(y.yearInterest, cur)}</td><td>${fmt(y.yearPrincipal, cur)}</td><td>${fmt(y.yearExtra, cur)}</td><td>${fmt(y.yearBalance, cur)}</td></tr>`;
      });
    } else if (scale === "monthly") {
      thead = `<tr><th>Month</th><th>Repayment</th><th>Interest</th><th>Principal</th><th>Extra</th><th>Balance</th></tr>`;
      // Convert period numbers to months
      const periodsPerMonth = r.freqPerYear / 12;
      let lastMonth = 0;
      r.schedule.forEach(s => {
        const month = Math.ceil(s.period / periodsPerMonth);
        if (month !== lastMonth) {
          tbody += `<tr><td>Month ${month}</td><td>${fmtD(s.repayment, cur)}</td><td>${fmtD(s.interest, cur)}</td><td>${fmtD(s.principal, cur)}</td><td>${fmtD(s.extra, cur)}</td><td>${fmtD(s.balance, cur)}</td></tr>`;
          lastMonth = month;
        }
      });
    } else { // weekly
      thead = `<tr><th>Week</th><th>Repayment</th><th>Interest</th><th>Principal</th><th>Extra</th><th>Balance</th></tr>`;
      // Show every 4th week for readability (≈monthly)
      r.schedule.forEach((s, i) => {
        if (i % 4 === 0 || i === r.schedule.length - 1) {
          const week = Math.round(s.period * (52 / r.freqPerYear));
          tbody += `<tr><td>Week ${week}</td><td>${fmtD(s.repayment, cur)}</td><td>${fmtD(s.interest, cur)}</td><td>${fmtD(s.principal, cur)}</td><td>${fmtD(s.extra, cur)}</td><td>${fmtD(s.balance, cur)}</td></tr>`;
        }
      });
    }

    $("amortTable").innerHTML = thead + tbody;
  }

  // ════════════════════ RENT VS BUY ════════════════════
  function runRvb() {
    const cur = currency();
    const mortOpts = readMain();
    const rvOpts = {
      weeklyRent: parseFloat($("rvRent").value) || 0,
      rentGrow: parseFloat($("rvRentGrow").value) || 0,
      maint: parseFloat($("rvMaint").value) || 0,
      apprec: parseFloat($("rvApprec").value) || 0,
      invRate: parseFloat($("rvInvRate").value) || 0,
      taxRate: parseFloat($("rvTaxRate").value) || 0,
      stampDuty: parseFloat($("rvStamp").value) || 0
    };

    const rvb = rentVsBuy(mortOpts, rvOpts);
    const n = rvb.buyPath.length;
    const lastBuy = rvb.buyPath[n - 1];
    const lastRent = rvb.rentPath[n - 1];

    const diff = lastBuy.equity - lastRent.investPool;
    const winner = diff > 0 ? "buy" : diff < 0 ? "rent" : "tie";

    $("rvbResults").innerHTML = `
      <div class="rvb-cards">
        <div class="rvb-card buy">
          <h3>🏠 Buy</h3>
          <div class="big">${fmt(lastBuy.equity, cur)}</div>
          <div class="sub">Home equity after ${n} years</div>
          <div class="sub">Property value: ${fmt(lastBuy.propValue, cur)} · Loan: ${fmt(lastBuy.loanBalance, cur)}</div>
          <div class="sub">Cumulative costs: ${fmt(lastBuy.cumCosts, cur)}</div>
        </div>
        <div class="rvb-card rent">
          <h3>🏡 Rent + Invest</h3>
          <div class="big">${fmt(lastRent.investPool, cur)}</div>
          <div class="sub">Investment pool after ${n} years</div>
          <div class="sub">Cumulative rent paid: ${fmt(lastRent.cumRentPaid, cur)}</div>
        </div>
      </div>
      <div class="rvb-verdict ${winner === "buy" ? "buy-wins" : winner === "rent" ? "rent-wins" : "tie"}">
        ${winner === "buy" ? `🏠 Buying wins by ${fmt(Math.abs(diff), cur)} — home equity exceeds the renter's investment pool after ${n} years.`
          : winner === "rent" ? `🏡 Renting + investing wins by ${fmt(Math.abs(diff), cur)} — the investment pool exceeds home equity after ${n} years.`
          : `🤝 Roughly even after ${n} years — both paths produce similar net wealth.`}
        ${rvb.crossoverYear ? ` Buying overtakes at year ${rvb.crossoverYear}.` : ""}
      </div>`;

    drawRvbChart(rvb, cur);
    $("rvbChartWrap").hidden = false;

    // Table
    let thead = `<tr><th>Year</th><th>Property value</th><th>Home equity</th><th>Mortgage repay</th><th>Interest</th><th>Ongoing</th><th>Rent paid</th><th>Invest pool</th></tr>`;
    let tbody = "";
    for (let i = 0; i < n; i++) {
      const b = rvb.buyPath[i], r = rvb.rentPath[i];
      tbody += `<tr>
        <td>${b.year}</td>
        <td>${fmt(b.propValue,cur)}</td>
        <td>${fmt(b.equity,cur)}</td>
        <td>${fmt(b.mortRepay,cur)}</td>
        <td>${fmt(b.mortInterest,cur)}</td>
        <td>${fmt(b.ongoing,cur)}</td>
        <td>${fmt(r.annualRent,cur)}</td>
        <td>${fmt(r.investPool,cur)}</td>
      </tr>`;
    }
    $("rvbTable").innerHTML = thead + tbody;
    $("rvbTableHead").hidden = false;
  }

  // ════════════════════ MORTGAGE COMPARISON ════════════════════
  function addCmp() {
    const list = $("cmpList");
    const idx = list.children.length + 1;
    const div = document.createElement("div");
    div.className = "scenario adv-block";
    div.innerHTML = `
      <div class="grid">
        <div class="field"><label>Label</label><input class="cLabel" type="text" placeholder="Scenario ${idx}" value="Scenario ${idx}"></div>
        <div class="field"><label>Interest rate %</label><input class="cRate" type="number" step="any" placeholder="same"></div>
        <div class="field"><label>Loan term (yrs)</label><input class="cTerm" type="number" step="1" placeholder="same"></div>
        <div class="field"><label>Extra / period</label><input class="cExtra" type="number" step="any" placeholder="same"></div>
        <div class="field"><label>Deposit %</label><input class="cDeposit" type="number" step="any" placeholder="same"></div>
      </div>
      <button type="button" class="rmCmp adv-toggle reset-btn" style="margin-top:8px">Remove</button>`;
    list.appendChild(div);
    div.querySelector(".rmCmp").addEventListener("click", () => div.remove());
  }

  function runCmp() {
    const cur = currency();
    const base = readMain();
    const results = [{ label: "Base", opts: { ...base }, r: simulate(base) }];

    document.querySelectorAll("#cmpList .scenario").forEach(el => {
      const o = { ...base };
      const g = (cls) => el.querySelector("." + cls);
      const ov = (cls, key) => { const n = g(cls); if (n && n.value !== "") o[key] = parseFloat(n.value) || 0; };
      ov("cRate", "rate");
      ov("cTerm", "term");
      ov("cExtra", "extra");
      const depEl = g("cDeposit");
      if (depEl && depEl.value !== "") { o.deposit = parseFloat(depEl.value) || 0; o.depositMode = "pct"; }
      const label = g("cLabel").value || `Scenario ${results.length}`;
      results.push({ label, opts: o, r: simulate(o) });
    });

    drawCmpChart(results, cur);
    $("cmpChartWrap").hidden = false;

    // Summary table
    let thead = `<tr><th>Scenario</th><th>Rate</th><th>Term</th><th>Deposit</th><th>Loan</th><th>${base.freq} repayment</th><th>Total interest</th><th>Total repaid</th></tr>`;
    let tbody = results.map(s => {
      const o = s.opts, r = s.r;
      return `<tr><td>${esc(s.label)}</td><td>${fmtN(o.rate)}%</td><td>${o.term} yrs</td><td>${o.depositMode === "pct" ? fmtP(o.deposit) : fmt(o.depositAmt,cur)}</td><td>${fmt(r.loan,cur)}</td><td>${fmtD(r.minRepay,cur)}</td><td>${fmt(r.totalInterest,cur)}</td><td>${fmt(r.totalRepaid,cur)}</td></tr>`;
    }).join("");
    $("cmpTable").innerHTML = thead + tbody;
    $("cmpTableHead").hidden = false;

    // Best/worst callout
    const sorted = [...results].sort((a, b) => a.r.totalInterest - b.r.totalInterest);
    const best = sorted[0], worst = sorted[sorted.length - 1];
    const diff = worst.r.totalInterest - best.r.totalInterest;
    $("cmpSummary").innerHTML = results.length > 1
      ? `<p class="hint" style="background:var(--soft);border:1px solid var(--ring);border-radius:9px;padding:10px 12px"><strong>${esc(best.label)}</strong> saves ${fmt(diff,cur)} in interest vs <strong>${esc(worst.label)}</strong>. Compare repayment amounts and total cost above.</p>`
      : "";
  }

  // ════════════════════ EXCEL EXPORT ════════════════════
  function xmlEsc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function cellN(v) { return `<Cell><Data ss:Type="Number">${isFinite(v)?v:0}</Data></Cell>`; }
  function cellS(v) { return `<Cell><Data ss:Type="String">${xmlEsc(v)}</Data></Cell>`; }
  function row(c) { return `<Row>${c.join("")}</Row>`; }
  function sheet(name,rows) { return `<Worksheet ss:Name="${xmlEsc(name).slice(0,31)}"><Table>${rows.join("")}</Table></Worksheet>`; }

  function buildXls() {
    if (!lastResult) runMain();
    const cur = currency();
    const o = lastResult.opts, r = lastResult.r;
    const sheets = [];

    // Inputs
    const s1 = [
      row([cellS("Nexus Web Tools — Mortgage Model")]),
      row([cellS("Generated"), cellS(new Date().toLocaleString())]),
      row([cellS("Currency"), cellS(cur)]),
      row([]),
      row([cellS("INPUTS")]),
      row([cellS("Property price"), cellN(o.price)]),
      row([cellS("Deposit"), cellN(o.deposit)]),
      row([cellS("Deposit mode"), cellS(o.depositMode)]),
      row([cellS("Interest rate %"), cellN(o.rate)]),
      row([cellS("Loan term (years)"), cellN(o.term)]),
      row([cellS("Repayment frequency"), cellS(o.freq)]),
      row([cellS("Repayment type"), cellS(o.repayType)]),
      row([cellS("Extra / period"), cellN(o.extra)]),
      row([cellS("Interest-only years"), cellN(o.ioYears)]),
      row([cellS("Annual property tax"), cellN(o.annualTax)]),
      row([cellS("Annual insurance"), cellN(o.annualIns)]),
      row([cellS("Annual LMI %"), cellN(o.annualLMI)]),
      row([cellS("Annual HOA/strata"), cellN(o.annualHOA)]),
      row([]),
      row([cellS("RESULTS")]),
      row([cellS("Loan amount"), cellN(r.loan)]),
      row([cellS("Repayment / period"), cellN(r.minRepay)]),
      row([cellS("Total interest"), cellN(r.totalInterest)]),
      row([cellS("Total repaid"), cellN(r.totalRepaid)]),
      row([cellS("Annual ongoing costs"), cellN(r.annualCosts)])
    ];
    sheets.push(sheet("Inputs & Summary", s1));

    // Amortisation schedule
    const s2 = [row([cellS("Period"), cellS("Repayment"), cellS("Interest"), cellS("Principal"), cellS("Extra"), cellS("Balance")])];
    r.schedule.forEach(s => {
      s2.push(row([cellN(s.period), cellN(s.repayment), cellN(s.interest), cellN(s.principal), cellN(s.extra), cellN(s.balance)]));
    });
    sheets.push(sheet("Amortisation", s2));

    return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${sheets.join("\n")}</Workbook>`;
  }

  function exportExcel() {
    if (!lastResult) runMain();
    const xml = buildXls();
    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mortgage-model-${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  // ════════════════════ PERSISTENCE ════════════════════
  const STORE_KEY = "nwt-mortgage-v1";
  const MAIN_IDS = ["mCcy","mPrice","mDeposit","mDepositMode","mRate","mTerm","mFreq","mRepayType","mExtra","mIOYears","mTax","mIns","mLMI","mHOA"];
  const RVB_IDS = ["rvRent","rvRentGrow","rvMaint","rvApprec","rvInvRate","rvTaxRate","rvStamp"];
  let restoring = false;

  function saveState() {
    if (restoring) return;
    try {
      const main = {};
      MAIN_IDS.forEach(id => { const el = $(id); if (el) main[id] = el.value; });
      const rvb = {};
      RVB_IDS.forEach(id => { const el = $(id); if (el) rvb[id] = el.value; });
      localStorage.setItem(STORE_KEY, JSON.stringify({ main, rvb }));
    } catch (e) {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      restoring = true;
      if (data.main) Object.keys(data.main).forEach(id => { const el = $(id); if (el) el.value = data.main[id]; });
      if (data.rvb) Object.keys(data.rvb).forEach(id => { const el = $(id); if (el) el.value = data.rvb[id]; });
      restoring = false;
    } catch (e) { restoring = false; }
  }

  // ════════════════════ EVENT WIRING ════════════════════
  document.addEventListener("DOMContentLoaded", () => {
    loadState();
    runMain();

    // Auto-calculate on input change
    const debounced = (() => { let t; return () => { clearTimeout(t); t = setTimeout(runMain, 300); }; })();
    MAIN_IDS.forEach(id => {
      const el = $(id);
      if (el) el.addEventListener("input", debounced);
    });
    $("calcBtn").addEventListener("click", runMain);

    // Reset
    $("resetBtn").addEventListener("click", () => {
      $("mPrice").value = 750000; $("mDeposit").value = 20; $("mDepositMode").value = "pct";
      $("mRate").value = 6.2; $("mTerm").value = 30; $("mFreq").value = "monthly";
      $("mRepayType").value = "pi"; $("mExtra").value = 0; $("mIOYears").value = 0;
      $("mTax").value = 2800; $("mIns").value = 1800; $("mLMI").value = 0; $("mHOA").value = 0;
      localStorage.removeItem(STORE_KEY);
      runMain();
    });

    // Save on change
    [...MAIN_IDS, ...RVB_IDS].forEach(id => {
      const el = $(id);
      if (el) el.addEventListener("change", saveState);
    });

    // View toggle: Chart / Table
    $("viewGraph").addEventListener("click", () => {
      $("viewGraph").classList.add("active"); $("viewGraph").setAttribute("aria-pressed","true");
      $("viewTable").classList.remove("active"); $("viewTable").setAttribute("aria-pressed","false");
      $("mainChart").hidden = false; $("mainChartKey").hidden = false;
      $("amortWrap").hidden = true;
    });
    $("viewTable").addEventListener("click", () => {
      $("viewTable").classList.add("active"); $("viewTable").setAttribute("aria-pressed","true");
      $("viewGraph").classList.remove("active"); $("viewGraph").setAttribute("aria-pressed","false");
      $("mainChart").hidden = true; $("mainChartKey").hidden = true;
      $("amortWrap").hidden = false;
    });

    // Scale toggle: weekly / monthly / yearly
    document.querySelectorAll(".stog").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".stog").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentScale = btn.dataset.scale;
        if (lastResult) buildTable(lastResult.r, currency());
      });
    });

    // Export
    $("exportXls").addEventListener("click", exportExcel);

    // Rent vs Buy
    $("rvbToggle").addEventListener("click", () => {
      const sec = $("rvbSection");
      const open = sec.hidden;
      sec.hidden = !open;
      $("rvbToggle").setAttribute("aria-expanded", open);
      $("rvbToggle").textContent = open ? "🏠 Rent vs Buy + Invest ▴" : "🏠 Rent vs Buy + Invest ▾";
    });
    $("rvbCalc").addEventListener("click", runRvb);

    // Mortgage Comparison
    $("cmpToggle").addEventListener("click", () => {
      const sec = $("cmpSection");
      const open = sec.hidden;
      sec.hidden = !open;
      $("cmpToggle").setAttribute("aria-expanded", open);
      $("cmpToggle").textContent = open ? "⚖️ Mortgage Comparison ▴" : "⚖️ Mortgage Comparison ▾";
    });
    $("addCmp").addEventListener("click", addCmp);
    $("runCmp").addEventListener("click", runCmp);
  });
})();
