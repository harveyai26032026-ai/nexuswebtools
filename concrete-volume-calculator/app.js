// Concrete Calculator — 100% client-side. No unit mixing.
const $ = (id) => document.getElementById(id);
const num = (id) => { const v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : 0; };

// ---- unit definitions (factor = metres per unit) ----
const UNITS = {
  metric:   [["mm",0.001],["cm",0.01],["m",1]],
  imperial: [["in",0.0254],["yd",0.9144]]
};
// for thickness/depth defaults we prefer the smaller unit
const DEFAULT_DIM = { metric:"m", imperial:"yd" };
const DEFAULT_DEPTH = { metric:"mm", imperial:"in" };

const BAGS = {
  // value = yield in m^3 per bag; label shown to user
  metric:   [["20",0.010,"20 kg (~0.010 m³)"],["30",0.015,"30 kg (~0.015 m³)"],["40",0.020,"40 kg (~0.020 m³)"]],
  imperial: [["80",0.017,"80 lb (0.60 ft³)"],["60",0.0127,"60 lb (0.45 ft³)"],["40",0.0085,"40 lb (0.30 ft³)"]]
};
const DEFAULT_BAG = { metric:"20", imperial:"80" };

// mix ratios cement:sand:aggregate (by volume) + water/cement ratio
const MIX = {
  "20": {r:[1,2.5,3.5], wc:0.60},
  "25": {r:[1,2,3],     wc:0.55},
  "32": {r:[1,1.5,3],   wc:0.50},
  "40": {r:[1,1.2,2.4], wc:0.45}
};
const DRY_FACTOR = 1.54;       // wet -> dry materials bulking
const CEMENT_DENSITY = 1440;   // kg/m^3 loose cement

const M3_TO_FT3 = 35.3146667;
const KG_PER_LB = 0.45359237;
const L_PER_GAL = 3.78541;     // US gallon

// cement bag weight options per unit system: [value, label]
// metric values are kg; imperial values are lb (converted to kg in compute)
const CEMENT_BAGS = {
  metric:   [["20","20 kg"],["25","25 kg"],["40","40 kg"]],
  imperial: [["94","94 lb (US sack)"],["50","50 lb"],["47","47 lb"]]
};
const DEFAULT_CEMENT_BAG = { metric:"20", imperial:"94" };

function fillSelect(sel, opts, def){
  sel.innerHTML = opts.map(o => `<option value="${o[0]}">${o[0]}</option>`).join("");
  sel.value = def;
}
function fillBag(){
  const sys = $("system").value;
  $("bag").innerHTML = BAGS[sys].map(b => `<option value="${b[1]}">${b[2]}</option>`).join("");
  $("bag").value = BAGS[sys][0][1];
}
function fillCementBag(){
  const sys = $("system").value;
  $("cementBag").innerHTML = CEMENT_BAGS[sys].map(b => `<option value="${b[0]}">${b[1]}</option>`).join("");
  $("cementBag").value = DEFAULT_CEMENT_BAG[sys];
}

function populateUnits(){
  const sys = $("system").value;
  const dimOpts = UNITS[sys];
  // dimension selectors (length, width, diameter, height) default to large unit
  ["lengthU","widthU","diameterU","heightU","subLU","subWU"].forEach(id => fillSelect($(id), dimOpts, DEFAULT_DIM[sys]));
  // thickness + depth selectors default to small unit
  fillSelect($("thicknessU"), dimOpts, DEFAULT_DEPTH[sys]);
  document.querySelectorAll(".depthsel").forEach(s => fillSelect(s, dimOpts, DEFAULT_DEPTH[sys]));
  fillBag();
  fillCementBag();
}

// value in metres from input id + its unit selector id
function metres(valId, unitId){
  const v = num(valId);
  const u = $(unitId).value;
  const def = UNITS[$("system").value].find(x => x[0] === u);
  return v * (def ? def[1] : 0);
}

function fmt(x, d){ return x.toLocaleString(undefined, {minimumFractionDigits:d, maximumFractionDigits:d}); }

function compute(){
  const sys = $("system").value;
  const metric = sys === "metric";
  const shape = $("shape").value;
  const qty = Math.max(1, Math.floor(num("qty")) || 1);
  const waste = 1 + (parseFloat($("waste").value)/100);
  const bagYield = parseFloat($("bag").value); // m^3 per bag

  let volM3 = 0;        // single-item wet volume in m^3
  let planAreaM2 = 0;   // plan area (slab) for graded + saw
  let thickM = 0;

  if (shape === "slab"){
    const L = metres("length","lengthU");
    const W = metres("width","widthU");
    planAreaM2 = L * W;
    if ($("useGrade").checked){
      // average corner depth method
      const depths = ["ca","cb","cc","cd"].map((id,i)=>metres(id, id+"U"));
      const avg = depths.reduce((a,b)=>a+b,0)/4;
      thickM = avg;
      volM3 = planAreaM2 * avg;
      $("gradeNote").textContent =
        `Average depth = ${metric ? fmt(avg,3)+" m" : fmt(avg/0.3048,3)+" ft"} ` +
        `(corners ${depths.map(d=>metric?fmt(d,3):fmt(d/0.3048,3)).join(", ")} ${metric?"m":"ft"}).`;
    } else {
      thickM = metres("thickness","thicknessU");
      volM3 = planAreaM2 * thickM;
    }
  } else {
    const D = metres("diameter","diameterU");
    const H = metres("height","heightU");
    const r = D/2;
    volM3 = Math.PI * r * r * H;
    thickM = H;
  }

  const grossM3 = volM3 * qty * waste;
  const subM3 = computeSubtract();   // volume to remove (already in m³, qty applied)
  const totalM3 = Math.max(0, grossM3 - subM3);
  const ft3 = totalM3 * M3_TO_FT3;
  const bags = bagYield > 0 ? Math.ceil(totalM3 / bagYield) : 0;

  // ---- primary results (single volume unit per system) ----
  if (totalM3 > 0){
    const volCard = metric
      ? `<div class="stat"><span class="big">${fmt(totalM3,3)}</span><span class="lbl">cubic metres (m³)</span></div>`
      : `<div class="stat"><span class="big">${fmt(ft3,2)}</span><span class="lbl">cubic feet (ft³)</span></div>`;
    let cards = volCard +
      `<div class="stat"><span class="big">${bags}</span><span class="lbl">bags needed</span></div>` +
      `<div class="stat"><span class="big">${qty}</span><span class="lbl">× quantity</span></div>`;
    if (subM3 > 0){
      const subDisp = metric ? `−${fmt(subM3,3)} m³` : `−${fmt(subM3*M3_TO_FT3,2)} ft³`;
      cards += `<div class="stat"><span class="big">${subDisp}</span><span class="lbl">subtracted</span></div>`;
    }
    $("results").innerHTML = cards;
  } else {
    $("results").innerHTML = `<div class="stat" style="grid-column:1/-1"><span class="lbl">Enter dimensions to see your estimate.</span></div>`;
  }

  computeMix(totalM3, metric);
  computeSaw(thickM, metric);
}

function computeMix(totalM3, metric){
  if (!$("useMix").checked || totalM3 <= 0){ $("mixResults").innerHTML=""; $("mixWc").textContent=""; return; }
  const m = MIX[$("strength").value];
  const sum = m.r[0]+m.r[1]+m.r[2];
  const dry = totalM3 * DRY_FACTOR;
  const cementM3 = dry * (m.r[0]/sum);
  const sandM3   = dry * (m.r[1]/sum);
  const aggM3    = dry * (m.r[2]/sum);
  const cementKg = cementM3 * CEMENT_DENSITY;
  const bagInput = parseFloat($("cementBag").value);            // kg (metric) or lb (imperial)
  const bagKg = metric ? bagInput : bagInput * KG_PER_LB;       // bag weight in kg
  const cementBags = bagKg > 0 ? Math.ceil(cementKg / bagKg) : 0;
  const waterL = cementKg * m.wc;

  const sand = metric ? `${fmt(sandM3,3)} m³` : `${fmt(sandM3*M3_TO_FT3,2)} ft³`;
  const agg  = metric ? `${fmt(aggM3,3)} m³`  : `${fmt(aggM3*M3_TO_FT3,2)} ft³`;
  const bagLbl   = metric ? `${fmt(bagInput,0)} kg` : `${fmt(bagInput,0)} lb`;
  const water    = metric ? `${fmt(waterL,0)} L`    : `${fmt(waterL/L_PER_GAL,1)} gal`;
  const cementWt = metric ? `${fmt(cementKg,0)} kg` : `${fmt(cementKg/KG_PER_LB,0)} lb`;

  $("mixResults").innerHTML =
    `<div class="stat"><span class="big">${cementBags}</span><span class="lbl">cement bags (${bagLbl})</span></div>` +
    `<div class="stat"><span class="big">${sand}</span><span class="lbl">sand (bulk)</span></div>` +
    `<div class="stat"><span class="big">${agg}</span><span class="lbl">aggregate (bulk)</span></div>` +
    `<div class="stat"><span class="big">${water}</span><span class="lbl">water (approx)</span></div>`;
  $("mixWc").textContent =
    `Ratio ${m.r.join(":")} (cement:sand:aggregate), water-cement ratio ${m.wc}. ` +
    `≈${cementWt} cement. Dry-material bulking factor ${DRY_FACTOR} applied.`;
}

function computeSaw(thickM, metric){
  if (!$("useSaw").checked || thickM <= 0){ $("sawResults").innerHTML=""; return; }
  const cutDepthM = thickM/4;
  const spaceMin = thickM*24, spaceMax = thickM*36;
  const dep = metric ? `${fmt(cutDepthM*1000,0)} mm` : `${fmt(cutDepthM/0.0254,2)} in`;
  const smin = metric ? `${fmt(spaceMin,2)} m` : `${fmt(spaceMin/0.3048,1)} ft`;
  const smax = metric ? `${fmt(spaceMax,2)} m` : `${fmt(spaceMax/0.3048,1)} ft`;
  $("sawResults").innerHTML =
    `<div class="stat"><span class="big">${dep}</span><span class="lbl">cut depth (≈¼ slab)</span></div>` +
    `<div class="stat"><span class="big">${smin}–${smax}</span><span class="lbl">joint spacing</span></div>`;
}

function computeSubtract(){
  if (!$("useSub").checked) { $("subNote").textContent=""; return 0; }
  const metric = $("system").value === "metric";
  const q = Math.max(1, Math.floor(num("subQty")) || 1);
  let one = 0;
  if ($("subShape").value === "box"){
    one = metres("subL","subLU") * metres("subW","subWU") * metres("subD","subDU");
  } else {
    const r = metres("subDia","subDiaU")/2;
    one = Math.PI * r * r * metres("subDep","subDepU");
  }
  const tot = one * q;
  if (tot > 0){
    const disp = metric ? `${fmt(tot,3)} m³` : `${fmt(tot*M3_TO_FT3,2)} ft³`;
    $("subNote").textContent = `Subtracting ${q} × cut-out = ${disp} removed from the total.`;
  } else { $("subNote").textContent = ""; }
  return tot;
}

// ---- wiring ----
function syncShape(){
  const slab = $("shape").value === "slab";
  $("slabInputs").hidden = !slab;
  $("columnInputs").hidden = slab;
  // graded land only applies to slabs
  $("useGrade").disabled = !slab;
  if (!slab){ $("useGrade").checked = false; $("gradeBody").hidden = true; }
  $("thicknessField").style.opacity = ($("useGrade").checked ? .45 : 1);
  compute();
}
function syncSystem(){ populateUnits(); compute(); }

$("system").addEventListener("change", syncSystem);
$("shape").addEventListener("change", syncShape);
$("advToggle").addEventListener("click", () => {
  const a = $("advanced"); const open = a.hidden;
  a.hidden = !open; $("advToggle").setAttribute("aria-expanded", String(open));
  $("advToggle").textContent = open ? "⚙️ Advanced options ▴" : "⚙️ Advanced options ▾";
});
$("useGrade").addEventListener("change", () => { $("gradeBody").hidden = !$("useGrade").checked; $("thicknessField").style.opacity = ($("useGrade").checked?.45:1); compute(); });
$("useMix").addEventListener("change", () => { $("mixBody").hidden = !$("useMix").checked; compute(); });
$("useSaw").addEventListener("change", () => { $("sawBody").hidden = !$("useSaw").checked; compute(); });
$("useSub").addEventListener("change", () => { $("subBody").hidden = !$("useSub").checked; compute(); });
$("subShape").addEventListener("change", () => {
  const box = $("subShape").value === "box";
  $("subBox").hidden = !box; $("subRound").hidden = box; compute();
});

["length","width","thickness","diameter","height","qty","ca","cb","cc","cd","subL","subW","subD","subDia","subDep","subQty"].forEach(id => $(id).addEventListener("input", compute));
["lengthU","widthU","thicknessU","diameterU","heightU","waste","bag","strength","cementBag","caU","cbU","ccU","cdU","subLU","subWU","subDU","subDiaU","subDepU"].forEach(id => $(id).addEventListener("change", compute));

// init
populateUnits();
syncShape();
