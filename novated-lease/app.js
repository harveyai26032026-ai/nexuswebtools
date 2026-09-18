/* Nexus Web Tools — Novated Lease Calculator
   Compares buying outright, car loan, and novated lease in Australia.
   Uses 2025-26 FY tax rates. Pure vanilla JS. */
(function(){
"use strict";

var LS_KEY = "nwt_novated_lease_v1";
var LCT_THRESHOLD = 91387;       // Luxury Car Tax threshold for EV FBT exemption
var FBT_STATUTORY_FRACTION = 0.20; // 20% of car value per year (statutory method)
var FBT_RATE_TYPE1 = 0.47;        // FBT gross-up rate — employer claims GST credits
var FBT_RATE_TYPE2 = 0.30;        // FBT gross-up rate — employer cannot claim GST credits
var MEDICARE_THRESHOLD = 24276;   // Singles threshold (approx 2024-25)
var MEDICARE_RATE = 0.02;

/* ATO minimum residual values for novated leases */
var RESIDUAL_TABLE = {
  1: 0.6583, 2: 0.5625, 3: 0.4688, 4: 0.375, 5: 0.2813, 6: 0.2813, 7: 0.2813
};

/* ─── DOM helpers ─── */
function $(s){ return document.querySelector(s); }
function val(id){
  var e = document.getElementById(id);
  if(!e) return null;
  if(e.type === "number") return e.value === "" ? null : parseFloat(e.value);
  return e.value;
}

/* ─── Formatting ─── */
function fmt(v, dec){
  dec = dec === undefined ? 0 : dec;
  var abs = Math.abs(v);
  var sign = v < 0 ? "−" : "";
  if(abs >= 1e6) return "$" + sign + (abs / 1e6).toFixed(2) + "M";
  if(abs >= 1e4) return "$" + sign + (abs / 1e3).toFixed(1) + "K";
  return "$" + sign + abs.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function fmtFull(v){
  return "$" + Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function fmtPct(v){
  return (Math.abs(v)).toFixed(2) + "%";
}

/* ─── Tax calculations (2025-26 FY) ─── */
function calcIncomeTax(taxableIncome){
  var tax = 0;
  var t = Math.max(0, taxableIncome);
  if(t > 190000){ tax += (t - 190000) * 0.45; t = 190000; }
  if(t > 135000){ tax += (t - 135000) * 0.37; t = 135000; }
  if(t > 45000){  tax += (t - 45000) * 0.30; t = 45000; }
  if(t > 18200){  tax += (t - 18200) * 0.16; }
  return tax;
}
function calcMedicare(taxableIncome){
  if(taxableIncome <= MEDICARE_THRESHOLD) return 0;
  // Simplified: 2% of taxable income above threshold
  // Full phasing-in rules would reduce this for incomes just above threshold
  return taxableIncome * MEDICARE_RATE;
}
function totalTax(taxableIncome){
  return calcIncomeTax(taxableIncome) + calcMedicare(taxableIncome);
}
function marginalRate(income){
  if(income > 190000) return 0.45;
  if(income > 135000) return 0.37;
  if(income > 45000) return 0.30;
  if(income > 18200) return 0.16;
  return 0;
}

/* ─── Read inputs ─── */
function readInputs(){
  return {
    income:          val("income") || 0,
    carPrice:        val("carPrice") || 0,
    term:            val("term") || 5,
    loanRate:        val("loanRate") || 0,
    homeLoanRate:    val("homeLoanRate") || 0,
    homeLoanBalance: val("homeLoanBalance") || 0,
    carType:         val("carType") || "EV",
    annualKm:        val("annualKm") || 0,
    runningCosts:    val("runningCosts") || 0
  };
}

/* ─── Monthly payment (amortisation with optional residual) ─── */
function monthlyPayment(principal, annualRatePct, months, residual){
  residual = residual || 0;
  var r = annualRatePct / 100 / 12;
  if(r === 0){
    return (principal - residual) / months;
  }
  // PMT formula with balloon/residual
  var pvResidual = residual / Math.pow(1 + r, months);
  return (principal - pvResidual) * r / (1 - Math.pow(1 + r, -months));
}

/* ═══════════════════════════════════════════════
   SCENARIO 1: Buy Outright (Cash)
   ═══════════════════════════════════════════════ */
function calcCash(o){
  var term = o.term;
  var runningCostsTotal = o.runningCosts * term; // post-tax

  // Opportunity cost: money could have paid down home loan
  // Use compound interest: carPrice * ((1 + rate)^term - 1)
  var oppCost = 0;
  if(o.homeLoanRate > 0 && o.carPrice > 0){
    oppCost = o.carPrice * (Math.pow(1 + o.homeLoanRate / 100, term) - 1);
  }

  var totalCost = o.carPrice + runningCostsTotal + oppCost;
  var effectiveRate = o.carPrice > 0 ? (oppCost / o.carPrice / term * 100) : 0;

  return {
    label: "Buy Outright (Cash)",
    carPrice: o.carPrice,
    runningCosts: runningCostsTotal,
    opportunityCost: oppCost,
    interestCost: 0,
    fbtCost: 0,
    taxSavings: 0,
    totalCost: totalCost,
    monthlyEquiv: totalCost / (term * 12),
    weeklyEquiv: totalCost / (term * 52),
    effectiveRate: effectiveRate,
    netPosition: -totalCost,
    residual: 0,
    notes: "No interest. Opportunity cost = foregone home loan savings at " + o.homeLoanRate + "%/yr over " + term + " years."
  };
}

/* ═══════════════════════════════════════════════
   SCENARIO 2: Car Loan
   ═══════════════════════════════════════════════ */
function calcLoan(o){
  var term = o.term;
  var months = term * 12;
  var runningCostsTotal = o.runningCosts * term; // post-tax

  var monthly = monthlyPayment(o.carPrice, o.loanRate, months, 0);
  if(monthly < 0) monthly = 0;
  var totalRepayments = monthly * months;
  var interestCost = totalRepayments - o.carPrice;
  if(interestCost < 0) interestCost = 0;

  var totalCost = totalRepayments + runningCostsTotal;
  var effectiveRate = o.carPrice > 0 ? (interestCost / o.carPrice / term * 100) : 0;

  return {
    label: "Car Loan",
    carPrice: o.carPrice,
    principal: o.carPrice,
    monthlyRepayment: monthly,
    totalRepayments: totalRepayments,
    interestCost: interestCost,
    runningCosts: runningCostsTotal,
    fbtCost: 0,
    taxSavings: 0,
    totalCost: totalCost,
    monthlyEquiv: totalCost / (term * 12),
    weeklyEquiv: totalCost / (term * 52),
    effectiveRate: effectiveRate,
    netPosition: -totalCost,
    residual: 0,
    notes: "Financed at " + o.loanRate + "% over " + term + " years. No tax benefits."
  };
}

/* ═══════════════════════════════════════════════
   SCENARIO 3: Novated Lease
   ═══════════════════════════════════════════════ */
function calcLease(o){
  var term = o.term;
  var months = term * 12;
  var mRate = marginalRate(o.income);
  var runningCostsTotal = o.runningCosts * term;

  // ATO minimum residual
  var residualPct = RESIDUAL_TABLE[term] !== undefined ? RESIDUAL_TABLE[term] : 0.2813;
  var residual = o.carPrice * residualPct;

  // Monthly finance payment (lease uses same rate as car loan for finance cost)
  var monthlyFinance = monthlyPayment(o.carPrice, o.loanRate, months, residual);
  if(monthlyFinance < 0) monthlyFinance = 0;
  var totalFinancePayments = monthlyFinance * months;
  var financeInterest = totalFinancePayments - (o.carPrice - residual);
  if(financeInterest < 0) financeInterest = 0;

  // FBT treatment
  var isEV = (o.carType === "EV" && o.carPrice <= LCT_THRESHOLD);
  var fbtAnnual = 0;
  var fbtTotal = 0;
  var employeeContribution = 0;

  var fbtTaxableAnnual = 0;
  if(!isEV){
    // Statutory formula method: taxable value = base value x 20%
    fbtTaxableAnnual = o.carPrice * FBT_STATUTORY_FRACTION;
    // FBT payable by employer (Type 2 — most lessors cannot claim GST credits on running costs)
    fbtAnnual = fbtTaxableAnnual * FBT_RATE_TYPE2;
    fbtTotal = fbtAnnual * term;
    // FBT is recovered through pre-tax salary packaging (no ECM assumed — cheaper
    // than post-tax ECM for every marginal bracket). If the user selects ECM,
    // a post-tax contribution of the taxable value zeroes the FBT instead.
    employeeContribution = 0;
  }

  // Pre-tax salary sacrifice: finance payments + running costs (bundled)
  var preTaxDeductions = totalFinancePayments + runningCostsTotal + fbtTotal;

  // Tax savings: actual tax difference (handles bracket crossings)
  var taxBefore = totalTax(o.income);
  var taxableAfter = Math.max(0, o.income - preTaxDeductions);
  var taxAfter = totalTax(taxableAfter);
  var taxSavings = taxBefore - taxAfter;
  if(taxSavings < 0) taxSavings = 0;

  // Net cost = salary sacrifice (after tax benefit) + post-tax ECM contribution + residual
  var netSalarySacrifice = preTaxDeductions - taxSavings; // actual reduction in take-home pay
  var totalNetCost = netSalarySacrifice + employeeContribution + residual;

  // Effective rate: net financing cost as % of car price per year
  // (total cost - car price - running costs net of tax) / carPrice / term
  var runningCostsNetTax = runningCostsTotal * (1 - mRate); // approximate after-tax running cost in lease
  var effectiveRate = o.carPrice > 0
    ? ((totalNetCost - o.carPrice - runningCostsNetTax) / o.carPrice / term * 100)
    : 0;

  var fbtNote;
  if(isEV){
    fbtNote = "EV FBT exemption applies (car value ≤ $" + LCT_THRESHOLD.toLocaleString() + " LCT threshold). No FBT payable.";
  } else {
    fbtNote = "Statutory formula: taxable value $" + fmtFull(fbtTaxableAnnual) + "/yr (20% of car value). FBT payable (Type 2, 30% gross-up) $" + fmtFull(fbtAnnual) + "/yr = $" + fmtFull(fbtTotal) + " over the term, salary-packaged pre-tax.";
  }

  return {
    label: "Novated Lease",
    carPrice: o.carPrice,
    fbtCost: fbtTotal,
    monthlyFinance: monthlyFinance,
    totalFinancePayments: totalFinancePayments,
    financeInterest: financeInterest,
    residual: residual,
    residualPct: residualPct,
    runningCosts: runningCostsTotal,
    runningCostsBundledPreTax: true,
    fbtAnnual: fbtAnnual,
    fbtTotal: fbtTotal,
    employeeContribution: employeeContribution,
    preTaxDeductions: preTaxDeductions,
    taxBefore: taxBefore,
    taxAfter: taxAfter,
    taxSavings: taxSavings,
    netSalarySacrifice: netSalarySacrifice,
    totalCost: totalNetCost,
    monthlyEquiv: totalNetCost / (term * 12),
    weeklyEquiv: totalNetCost / (term * 52),
    effectiveRate: effectiveRate,
    netPosition: -totalNetCost,
    isEV: isEV,
    carType: o.carType,
    marginalRate: mRate,
    notes: fbtNote
  };
}

/* ═══════════════════════════════════════════════
   RENDERING
   ═══════════════════════════════════════════════ */
function render(cash, loan, lease, o){
  // Find cheapest
  var results = [
    {key:"cash",  r:cash,  name:"Buy Outright",  cls:"cash"},
    {key:"loan",  r:loan,  name:"Car Loan",       cls:"loan"},
    {key:"lease", r:lease, name:"Novated Lease",  cls:"lease"}
  ];
  var cheapest = results[0];
  for(var i = 1; i < results.length; i++){
    if(results[i].r.totalCost < cheapest.r.totalCost) cheapest = results[i];
  }

  /* ── Stat cards ── */
  var html = '<div class="stat-cards">';
  results.forEach(function(item){
    var isWinner = item.key === cheapest.key;
    html += '<div class="stat-card ' + item.cls + (isWinner ? ' winner' : '') + '">' +
      '<div class="stat-label">' + item.name + '</div>' +
      '<div class="stat-big">' + fmt(item.r.totalCost) + '</div>' +
      '<div class="stat-sub">' + fmt(item.r.monthlyEquiv, 0) + '/mo · ' + fmt(item.r.weeklyEquiv, 0) + '/wk</div>' +
      (isWinner ? '<div class="stat-badge">★ Best value</div>' : '') +
    '</div>';
  });
  html += '</div>';

  /* ── Key stats row ── */
  html += '<div class="stat-cards" style="margin-top:10px">';
  html += '<div class="stat-card"><div class="stat-label">Your marginal rate</div><div class="stat-big">' + fmtPct(marginalRate(o.income) * 100) + '</div><div class="stat-sub">Income tax bracket</div></div>';
  html += '<div class="stat-card"><div class="stat-label">Lease tax savings</div><div class="stat-big gain">' + fmt(lease.taxSavings) + '</div><div class="stat-sub">Over ' + o.term + ' years</div></div>';
  html += '<div class="stat-card"><div class="stat-label">Car type</div><div class="stat-big" style="font-size:1rem">' + (lease.isEV ? "🔋 EV (FBT exempt)" : o.carType === "Hybrid" ? "⚡ Hybrid" : "⛽ ICE") + '</div><div class="stat-sub">' + (lease.isEV ? "No FBT" : "FBT applies") + '</div></div>';
  html += '<div class="stat-card"><div class="stat-label">Lease residual</div><div class="stat-big">' + fmt(lease.residual) + '</div><div class="stat-sub">' + (lease.residualPct * 100).toFixed(2) + '% of price</div></div>';
  html += '</div>';

  /* ── Recommendation ── */
  var savings = 0, secondName = "";
  var sorted = results.slice().sort(function(a,b){ return a.r.totalCost - b.r.totalCost; });
  if(sorted.length >= 2){
    savings = sorted[1].r.totalCost - sorted[0].r.totalCost;
    secondName = sorted[1].name;
  }
  html += '<div class="recommendation">';
  html += '💡 <strong>' + cheapest.name + '</strong> is the cheapest option, costing <strong>' + fmt(cheapest.r.totalCost) + '</strong> over ' + o.term + ' years';
  if(savings > 0){
    html += ' — saving <strong>' + fmt(savings) + '</strong> compared to ' + secondName;
  }
  html += '.';
  html += '</div>';

  $("#results").innerHTML = html;

  /* ── Bar chart ── */
  renderBarChart(cash, loan, lease);

  /* ── Comparison table ── */
  renderTable(cash, loan, lease, o, cheapest.key);

  /* ── Breakdown ── */
  renderBreakdown(cash, loan, lease, o);

  // Show hidden sections
  $("#barChartWrap").hidden = false;
  $("#tableWrap").hidden = false;
  $("#breakdownWrap").hidden = false;
}

function renderBarChart(cash, loan, lease){
  var maxCost = Math.max(cash.totalCost, loan.totalCost, lease.totalCost, 1);
  var bars = [
    {name:"Buy Outright",  val:cash.totalCost,  cls:"cash"},
    {name:"Car Loan",      val:loan.totalCost,  cls:"loan"},
    {name:"Novated Lease", val:lease.totalCost, cls:"lease"}
  ];
  var html = "";
  bars.forEach(function(b){
    var pct = (b.val / maxCost * 100).toFixed(1);
    html += '<div class="bar-row">' +
      '<div class="bar-label">' + b.name + '</div>' +
      '<div class="bar-wrap"><div class="bar-fill ' + b.cls + '" style="width:' + pct + '%">' + (pct > 25 ? fmt(b.val) : '') + '</div></div>' +
      '<div class="bar-value">' + fmt(b.val) + '</div>' +
    '</div>';
  });
  $("#barChart").innerHTML = html;
}

function renderTable(cash, loan, lease, o, winnerKey){
  var rows = [
    {label:"Total cost over " + o.term + " years",   cash:cash.totalCost,       loan:loan.totalCost,       lease:lease.totalCost,       fmt:'money'},
    {label:"Monthly equivalent",                      cash:cash.monthlyEquiv,    loan:loan.monthlyEquiv,    lease:lease.monthlyEquiv,    fmt:'money'},
    {label:"Weekly equivalent",                       cash:cash.weeklyEquiv,     loan:loan.weeklyEquiv,     lease:lease.weeklyEquiv,     fmt:'money'},
    {label:"Car purchase price",                      cash:cash.carPrice,        loan:loan.carPrice,        lease:lease.carPrice,        fmt:'money'},
    {label:"Interest / finance cost",                 cash:0,                    loan:loan.interestCost,    lease:lease.financeInterest, fmt:'money'},
    {label:"Opportunity cost",                       cash:cash.opportunityCost, loan:0,                    lease:0,                     fmt:'money'},
    {label:"FBT payable (pre-tax packaged)",          cash:0,                    loan:0,                    lease:lease.fbtCost, fmt:'money'},
    {label:"Running costs (over term)",               cash:cash.runningCosts,    loan:loan.runningCosts,    lease:lease.runningCosts,    fmt:'money'},
    {label:"Residual payment (end of lease)",         cash:0,                    loan:0,                    lease:lease.residual,        fmt:'money'},
    {label:"Tax savings",                             cash:0,                    loan:0,                    lease:lease.taxSavings,      fmt:'money', isGain:true},
    {label:"Effective financing rate",                cash:cash.effectiveRate,   loan:loan.effectiveRate,   lease:lease.effectiveRate,   fmt:'pct'},
    {label:"Net position at end of term",              cash:cash.netPosition,     loan:loan.netPosition,     lease:lease.netPosition,     fmt:'money'}
  ];

  var html = '<thead><tr><th></th><th class="col-cash">Buy Outright</th><th class="col-loan">Car Loan</th><th class="col-lease">Novated Lease</th></tr></thead>';
  html += '<tbody>';
  rows.forEach(function(row){
    var vals = [row.cash, row.loan, row.lease];
    var minVal = Math.min.apply(null, vals);
    var isTotalRow = row.label.indexOf("Total cost") === 0;
    html += '<tr><th>' + row.label + '</th>';
    for(var c = 0; c < 3; c++){
      var cellVal = vals[c];
      var winnerCls = (isTotalRow && cellVal === minVal) ? ' winner-cell' : '';
      var colCls = c === 0 ? ' col-cash' : c === 1 ? ' col-loan' : ' col-lease';
      if(winnerCls) winnerCls += colCls;
      html += '<td' + (winnerCls ? ' class="' + winnerCls + '"' : '') + '>' + fmtVal(cellVal, row.fmt, row.isGain) + '</td>';
    }
    html += '</tr>';
  });
  html += '</tbody>';
  $("#cmpTable").innerHTML = html;
}

function fmtVal(v, type, isGain){
  if(type === 'pct'){
    return v === 0 ? '—' : fmtPct(v);
  }
  if(v === 0) return '—';
  var cls = isGain ? ' class="gain"' : '';
  return '<span' + cls + '>' + fmtFull(v) + '</span>';
}

function renderBreakdown(cash, loan, lease, o){
  var grid = $("#breakdownGrid");

  /* Cash breakdown */
  var cashHtml = '<div class="breakdown-card cash">' +
    '<h3>💰 Buy Outright (Cash)</h3>' +
    bdRow("Car purchase price", cash.carPrice) +
    bdRow("Running costs (" + o.term + "yr, post-tax)", cash.runningCosts) +
    bdRow("Opportunity cost (foregone " + o.homeLoanRate + "% return)", cash.opportunityCost) +
    bdRow("Total cost", cash.totalCost, true) +
    '<p style="font-size:.8rem;color:var(--muted);margin-top:8px;line-height:1.4">' + cash.notes + '</p>' +
  '</div>';

  /* Loan breakdown */
  var loanHtml = '<div class="breakdown-card loan">' +
    '<h3>🏦 Car Loan</h3>' +
    bdRow("Car purchase price", loan.carPrice) +
    bdRow("Monthly repayment", loan.monthlyRepayment) +
    bdRow("Total repayments (" + o.term + "yr)", loan.totalRepayments) +
    bdRow("Total interest paid", loan.interestCost, false, true) +
    bdRow("Running costs (" + o.term + "yr, post-tax)", loan.runningCosts) +
    bdRow("Total cost", loan.totalCost, true) +
    '<p style="font-size:.8rem;color:var(--muted);margin-top:8px;line-height:1.4">' + loan.notes + '</p>' +
  '</div>';

  /* Lease breakdown */
  var leaseHtml = '<div class="breakdown-card lease">' +
    '<h3>📋 Novated Lease</h3>' +
    bdRow("Car purchase price", lease.carPrice) +
    bdRow("Lease finance payments", lease.totalFinancePayments) +
    bdRow("Finance interest", lease.financeInterest, false, true) +
    bdRow("Running costs (bundled, pre-tax)", lease.runningCosts) +
    bdRow("Pre-tax salary sacrifice", lease.preTaxDeductions) +
    bdRow("Tax saved", lease.taxSavings, true, false, true) +
    bdRow("Net salary sacrifice (after tax)", lease.netSalarySacrifice) +
    (lease.fbtCost > 0 ? bdRow("FBT payable (Type 2, pre-tax packaged)", lease.fbtCost, false, true) : '') +
    bdRow("Residual (pay to keep car)", lease.residual) +
    bdRow("Total net cost", lease.totalCost, true) +
    '<p style="font-size:.8rem;color:var(--muted);margin-top:8px;line-height:1.4">' + lease.notes + '</p>' +
  '</div>';

  grid.innerHTML = cashHtml + loanHtml + leaseHtml;
}

function bdRow(label, value, isTotal, isCost, isGain){
  var cls = isTotal ? 'bd-total' : '';
  var valCls = isCost ? ' style="color:#dc2626"' : isGain ? ' style="color:#0f9d6b"' : '';
  return '<div class="bd-row ' + cls + '"><span>' + label + '</span><span' + valCls + '>' + fmtFull(value) + '</span></div>';
}

/* ═══════════════════════════════════════════════
   SAVE / RESTORE
   ═══════════════════════════════════════════════ */
var FIELD_IDS = ["income","carPrice","term","loanRate","homeLoanRate","homeLoanBalance","carType","annualKm","runningCosts"];

function saveInputs(){
  try{
    var data = {};
    FIELD_IDS.forEach(function(id){
      var el = document.getElementById(id);
      if(el) data[id] = el.value;
    });
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }catch(e){}
}

function restoreInputs(){
  try{
    var raw = localStorage.getItem(LS_KEY);
    if(!raw) return;
    var data = JSON.parse(raw);
    FIELD_IDS.forEach(function(id){
      var el = document.getElementById(id);
      if(el && data[id] !== undefined) el.value = data[id];
    });
  }catch(e){}
}

function resetDefaults(){
  var defaults = {
    income: "120000", carPrice: "55000", term: "5",
    loanRate: "7.5", homeLoanRate: "6", homeLoanBalance: "400000",
    carType: "EV", annualKm: "15000", runningCosts: "5000"
  };
  FIELD_IDS.forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.value = defaults[id];
  });
  saveInputs();
  calculate();
}

/* ═══════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════ */
function calculate(){
  var o = readInputs();

  // Validation
  if(o.carPrice <= 0){
    $("#results").innerHTML = '<p style="color:#dc2626;text-align:center;padding:20px 0">Please enter a car purchase price greater than zero.</p>';
    $("#barChartWrap").hidden = true;
    $("#tableWrap").hidden = true;
    $("#breakdownWrap").hidden = true;
    return;
  }
  if(o.term < 1){
    $("#results").innerHTML = '<p style="color:#dc2626;text-align:center;padding:20px 0">Please enter a loan/lease term of at least 1 year.</p>';
    $("#barChartWrap").hidden = true;
    $("#tableWrap").hidden = true;
    $("#breakdownWrap").hidden = true;
    return;
  }

  var cash  = calcCash(o);
  var loan = calcLoan(o);
  var lease = calcLease(o);

  render(cash, loan, lease, o);
  saveInputs();
}

/* ─── Event wiring ─── */
function init(){
  restoreInputs();

  $("#calcBtn").addEventListener("click", calculate);
  $("#resetBtn").addEventListener("click", resetDefaults);

  // Auto-recalculate on input change (debounced)
  var debounceTimer = null;
  FIELD_IDS.forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    el.addEventListener("input", function(){
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(calculate, 400);
    });
  });

  // Initial calculation
  calculate();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

})();
