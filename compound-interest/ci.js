/* Compound Interest Calculator — Nexus Web Tools */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  function fmt(cur, n) {
    if (!isFinite(n)) n = 0;
    return cur + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* Core engine: month-by-month simulation so contributions, withdrawals,
     stop points and annual contribution growth all behave realistically.
     Interest is applied using the per-period nominal rate scaled to monthly. */
  function simulate(p) {
    var totalMonths = Math.round(p.years * 12 + p.months);
    if (totalMonths < 0) totalMonths = 0;

    var n = p.n;                       // compounds per year
    var rAnnual = p.rate / 100;
    // effective monthly growth factor derived from the chosen compounding frequency
    var monthlyFactor = Math.pow(1 + rAnnual / n, n / 12);

    var balance = p.principal;
    var totalDeposits = 0;
    var totalWithdrawn = 0;
    var totalInterest = 0;

    var contrib = p.contrib;
    var contribStep = p.contribFreq === 12 ? 1 : 12;   // deposit every X months
    var withdrawStep = p.withdrawFreq === 12 ? 1 : 12;

    var stopMonth = p.stopYear > 0 ? Math.round(p.stopYear * 12) : Infinity;
    var withdrawStartMonth = Math.round(p.withdrawStart * 12);

    var rows = [];        // year-end snapshots
    var yrDeposits = 0, yrInterest = 0;

    for (var m = 1; m <= totalMonths; m++) {
      // start-of-period deposit
      if (p.contribWhen === "start" && contrib > 0 && m <= stopMonth && (m - 1) % contribStep === 0) {
        balance += contrib; totalDeposits += contrib; yrDeposits += contrib;
      }

      // apply interest for the month
      var interest = balance * (monthlyFactor - 1);
      balance += interest; totalInterest += interest; yrInterest += interest;

      // end-of-period deposit
      if (p.contribWhen === "end" && contrib > 0 && m <= stopMonth && (m % contribStep === 0)) {
        balance += contrib; totalDeposits += contrib; yrDeposits += contrib;
      }

      // withdrawals
      if (p.withdraw > 0 && m > withdrawStartMonth && (m - withdrawStartMonth) % withdrawStep === 0) {
        var w = Math.min(p.withdraw, balance);
        balance -= w; totalWithdrawn += w;
      }

      // annual contribution increase + year snapshot
      if (m % 12 === 0) {
        rows.push({ year: m / 12, deposits: yrDeposits, interest: yrInterest, balance: balance });
        yrDeposits = 0; yrInterest = 0;
        if (p.contribGrowth > 0) contrib *= (1 + p.contribGrowth / 100);
      }
    }
    if (totalMonths % 12 !== 0) {
      rows.push({ year: +(totalMonths / 12).toFixed(2), deposits: yrDeposits, interest: yrInterest, balance: balance });
    }

    return {
      future: balance,
      principal: p.principal,
      deposits: totalDeposits,
      withdrawn: totalWithdrawn,
      interest: totalInterest,
      ear: (Math.pow(1 + rAnnual / n, n) - 1) * 100,
      rows: rows
    };
  }

  function readMain() {
    var useExtra = $("useExtra").checked;
    return {
      principal: +$("principal").value || 0,
      rate: +$("rate").value || 0,
      years: +$("years").value || 0,
      months: +$("months").value || 0,
      n: +$("compound").value || 12,
      contrib: +$("contrib").value || 0,
      contribFreq: +$("contribFreq").value || 12,
      contribWhen: $("contribWhen").value,
      stopYear: useExtra ? (+$("stopYear").value || 0) : 0,
      contribGrowth: useExtra ? (+$("contribGrowth").value || 0) : 0,
      withdraw: useExtra ? (+$("withdraw").value || 0) : 0,
      withdrawFreq: useExtra ? (+$("withdrawFreq").value || 12) : 12,
      withdrawStart: useExtra ? (+$("withdrawStart").value || 0) : 0
    };
  }

  function render() {
    var cur = $("currency").value;
    var p = readMain();
    var r = simulate(p);

    $("results").innerHTML =
      stat(fmt(cur, r.future), "Future balance") +
      stat(fmt(cur, r.principal + r.deposits), "Total invested") +
      stat(fmt(cur, r.interest), "Total interest") +
      (r.withdrawn > 0 ? stat(fmt(cur, r.withdrawn), "Total withdrawn") : "") +
      stat(r.ear.toFixed(2) + "%", "Effective annual rate");

    var tb = $("schedule").querySelector("tbody");
    tb.innerHTML = r.rows.map(function (row) {
      return "<tr><td>" + row.year + "</td><td>" + fmt(cur, row.deposits) +
        "</td><td>" + fmt(cur, row.interest) + "</td><td>" + fmt(cur, row.balance) + "</td></tr>";
    }).join("");

    if ($("useCompare").checked) renderCompare(cur, r);
  }

  function stat(big, lbl) {
    return '<div class="stat"><span class="big">' + big + '</span><span class="lbl">' + lbl + "</span></div>";
  }

  /* ---- Scenario comparison ---- */
  var scenarioCount = 0;

  function scenarioMarkup(idx, base) {
    return '<div class="scenario" data-idx="' + idx + '">' +
      '<div class="scenario-head">Scenario ' + String.fromCharCode(66 + idx) +
      ' <button type="button" class="rm" title="Remove">✕</button></div>' +
      '<div class="grid">' +
      field("Start", "s_principal_" + idx, base.principal) +
      field("Rate %", "s_rate_" + idx, base.rate) +
      field("Years", "s_years_" + idx, base.years) +
      '</div><div class="grid">' +
      field("Contribution", "s_contrib_" + idx, base.contrib) +
      field("Stop after yrs", "s_stop_" + idx, 0) +
      '</div></div>';
  }
  function field(label, id, val) {
    return '<div class="field"><label for="' + id + '">' + label + '</label>' +
      '<input id="' + id + '" type="number" step="any" value="' + val + '"></div>';
  }

  function addScenario() {
    if (scenarioCount >= 2) return;          // A + 2 extras = 3 total
    var base = readMain();
    var idx = scenarioCount++;
    var wrap = document.createElement("div");
    wrap.innerHTML = scenarioMarkup(idx, base);
    var node = wrap.firstChild;
    node.querySelector(".rm").addEventListener("click", function () {
      node.remove(); scenarioCount--; render();
      $("addScenario").disabled = scenarioCount >= 2;
    });
    node.addEventListener("input", render);
    $("scenarios").appendChild(node);
    $("addScenario").disabled = scenarioCount >= 2;
    render();
  }

  function renderCompare(cur, baseResult) {
    var cards = [{ name: "A (current)", r: baseResult }];
    document.querySelectorAll(".scenario").forEach(function (node) {
      var i = node.getAttribute("data-idx");
      var base = readMain();
      base.principal = +$("s_principal_" + i).value || 0;
      base.rate = +$("s_rate_" + i).value || 0;
      base.years = +$("s_years_" + i).value || 0;
      base.months = 0;
      base.contrib = +$("s_contrib_" + i).value || 0;
      base.stopYear = +$("s_stop_" + i).value || 0;
      cards.push({ name: String.fromCharCode(66 + (+i)), r: simulate(base) });
    });

    var best = Math.max.apply(null, cards.map(function (c) { return c.r.future; }));
    $("compareResults").innerHTML = cards.map(function (c) {
      var win = c.r.future === best && cards.length > 1;
      return '<div class="cmp-card' + (win ? " cmp-win" : "") + '">' +
        '<div class="cmp-name">Scenario ' + c.name + (win ? ' 🏆' : '') + '</div>' +
        '<div class="cmp-big">' + fmt(cur, c.r.future) + '</div>' +
        '<div class="cmp-row">Invested: ' + fmt(cur, c.r.principal + c.r.deposits) + '</div>' +
        '<div class="cmp-row">Interest: ' + fmt(cur, c.r.interest) + '</div>' +
        '</div>';
    }).join("");
  }

  /* ---- toggles ---- */
  function bindToggle(btnId, panelId) {
    $(btnId).addEventListener("click", function () {
      var panel = $(panelId);
      var open = panel.hasAttribute("hidden");
      if (open) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", "");
      this.setAttribute("aria-expanded", String(open));
    });
  }
  function bindCheck(cbId, panelId) {
    $(cbId).addEventListener("change", function () {
      if (this.checked) $(panelId).removeAttribute("hidden");
      else $(panelId).setAttribute("hidden", "");
      render();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindToggle("advToggle", "advanced");
    bindCheck("useExtra", "extraBody");
    bindCheck("useCompare", "compareBody");
    $("addScenario").addEventListener("click", addScenario);

    // live recompute on any input
    document.querySelectorAll("input, select").forEach(function (el) {
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });
    render();
  });
})();
