/* Nexus Web Tools — Mortgage Calculator v2
   Simplified base inputs, advanced options, red/green output coding,
   rent-vs-buy, scenario comparison. Pure vanilla JS. */
(function(){
"use strict";

var FREQ={weekly:52,fortnightly:26,monthly:12};
var CCY={USD:{s:"$",p:"$"},AUD:{s:"A$",p:"A$"},GBP:{s:"£",p:"£"},EUR:{s:"€",p:"€"},CAD:{s:"C$",p:"C$"},NZD:{s:"NZ$",p:"NZ$"},JPY:{s:"¥",p:"¥"},INR:{s:"₹",p:"₹"},SGD:{s:"S$",p:"S$"},HKD:{s:"HK$",p:"HK$"}};
var LS_KEY="nwt_mortgage_v2";

function $(s){return document.querySelector(s)}
function $$(s){return document.querySelectorAll(s)}
function val(id){var e=document.getElementById(id);if(!e)return null;if(e.type==="number")return e.value===""?null:parseFloat(e.value);return e.value}
function ccySym(){return CCY[val("mCcy")]||CCY.USD}

function fmtMoney(v,dec){
  dec=dec||0;var c=ccySym();var abs=Math.abs(v);var sign=v<0?"−":"";
  if(abs>=1e6)return c.p+sign+(abs/1e6).toFixed(1)+"M";
  if(abs>=1e4)return c.p+sign+(abs/1e3).toFixed(0)+"K";
  return c.p+sign+abs.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g,",");
}
function fmtMoneyFull(v){var c=ccySym();return c.p+Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",")}

function readInputs(){
  var price=val("mPrice")||0;
  var depMode=val("mDepositMode");
  var depVal=val("mDeposit")||0;
  var deposit=depMode==="pct"?price*(depVal/100):depVal;
  var loan=Math.max(0,price-deposit);
  return{price:price,deposit:deposit,loan:loan,rate:val("mRate")||0,term:val("mTerm")||30,freq:val("mFreq")||"monthly",repayType:val("mRepayType")||"pi",ioYears:val("mIOYears")||0,extra:val("mExtra")||0,tax:val("mTax")||0,ins:val("mIns")||0,lmi:val("mLMI")||0,hoa:val("mHOA")||0,stamp:val("mStamp")||0};
}

function simulate(opts){
  var loan=opts.loan,rate=opts.rate,term=opts.term,freq=opts.freq;
  var ioYears=opts.ioYears,extra=opts.extra;
  var ppf=FREQ[freq]||12,r=rate/100/ppf,n=term*ppf;
  var ioN=Math.min(ioYears*ppf,n);
  var bal=loan,sched=[],totalInt=0,totalPrin=0,totalExtra=0,stdRepay=0;
  if(r>0&&n>0)stdRepay=loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
  else if(n>0)stdRepay=loan/n;
  for(var i=1;i<=n&&bal>0.005;i++){
    var isIO=i<=ioN,intP=bal*r,prinP=0,repay=0;
    if(isIO){repay=intP}else{repay=stdRepay;prinP=Math.min(repay-intP+extra,bal);if(prinP>=bal){prinP=bal;repay=prinP+intP}}
    var exA=isIO?0:Math.min(extra,bal-prinP);
    bal-=(prinP+exA);if(bal<0)bal=0;
    totalInt+=intP;totalPrin+=prinP;totalExtra+=exA;
    sched.push({period:i,year:Math.ceil(i/ppf),repay:repay+exA,interest:intP,principal:prinP,extra:exA,balance:bal});
  }
  var ongYr=opts.tax+opts.ins+opts.hoa+(opts.lmi/100*loan);
  return{sched:sched,stdRepay:stdRepay,totalInt:totalInt,totalPrin:totalPrin,totalExtra:totalExtra,totalRepaid:totalPrin+totalInt+totalExtra,ongoingYr:ongYr,loan:loan,term:term,freq:freq,ppf:ppf};
}

function renderResults(opts,sim){
  var depPct=opts.price>0?(opts.deposit/opts.price*100):0;
  $("#results").innerHTML=
    '<div class="stat primary"><span class="big">'+fmtMoney(sim.stdRepay+opts.extra)+'</span><span class="lbl">'+opts.freq+' repayment</span></div>'+
    '<div class="stat neutral"><span class="big">'+fmtMoney(opts.loan)+'</span><span class="lbl">Loan amount</span></div>'+
    '<div class="stat gain"><span class="big">'+fmtMoney(opts.deposit)+'</span><span class="lbl">Deposit ('+depPct.toFixed(0)+'%)</span></div>'+
    '<div class="stat cost"><span class="big">'+fmtMoney(sim.totalInt)+'</span><span class="lbl">Total interest</span></div>'+
    '<div class="stat cost"><span class="big">'+fmtMoney(sim.totalRepaid)+'</span><span class="lbl">Total repaid</span></div>'+
    '<div class="stat '+(sim.ongoingYr>0?'cost':'neutral')+'"><span class="big">'+(sim.ongoingYr>0?fmtMoney(sim.ongoingYr)+'/yr':'—')+'</span><span class="lbl">Ongoing costs</span></div>';
}

function drawChart(sim){
  var svg=$("#mainChart"),W=700,H=300,PAD={t:20,r:20,b:40,l:60};
  var iW=W-PAD.l-PAD.r,iH=H-PAD.t-PAD.b,sched=sim.sched;
  if(!sched.length){svg.innerHTML="";return}
  var years=[],seen={};
  sched.forEach(function(s){if(!seen[s.year]){seen[s.year]=1;years.push(s)}});
  if(!seen[sched[sched.length-1].year])years.push(sched[sched.length-1]);
  var maxY=sim.loan*1.05;
  function xP(yr){return PAD.l+((yr-1)/sim.term)*iW}
  function yP(v){return PAD.t+iH-(v/maxY)*iH}
  var gH="",gV="";
  for(var v=0;v<=maxY;v+=maxY/4){gH+='<line x1="'+PAD.l+'" y1="'+yP(v)+'" x2="'+(W-PAD.r)+'" y2="'+yP(v)+'" stroke="#e2e6ef" stroke-width="1"/><text x="'+(PAD.l-6)+'" y="'+(yP(v)+4)+'" text-anchor="end" fill="#8492a6" font-size="11">'+fmtMoney(v)+'</text>'}
  for(var yr=1;yr<=sim.term;yr+=(sim.term<=10?1:5)){gV+='<line x1="'+xP(yr)+'" y1="'+PAD.t+'" x2="'+xP(yr)+'" y2="'+(H-PAD.b)+'" stroke="#e2e6ef" stroke-width="1"/><text x="'+xP(yr)+'" y="'+(H-PAD.b+16)+'" text-anchor="middle" fill="#8492a6" font-size="11">Yr '+yr+'</text>'}
  var cP=0,cI=0,bA=[{x:PAD.l,y:yP(sim.loan)}],pA=[{x:PAD.l,y:yP(0)}],iA=[{x:PAD.l,y:yP(0)}];
  years.forEach(function(s){cP+=s.principal+s.extra;cI+=s.interest;var x=xP(s.year);bA.push({x:x,y:yP(s.balance)});pA.push({x:x,y:yP(cP)});iA.push({x:x,y:yP(cI)})});
  function aL(pts,cl){var l=pts.map(function(p){return p.x+','+p.y}).join(' ');if(!cl)return 'M '+l;var bx=H-PAD.b;return 'M '+pts[0].x+','+bx+' L '+l+' L '+pts[pts.length-1].x+','+bx+' Z'}
  svg.innerHTML='<rect width="'+W+'" height="'+H+'" fill="#f7f8fb" rx="10"/>'+gH+gV+
    '<path d="'+aL(bA,1)+'" fill="rgba(59,91,219,.18)" stroke="none"/><path d="'+aL(bA,0)+'" fill="none" stroke="#3b5bdb" stroke-width="2.5"/>'+
    '<path d="'+aL(iA,1)+'" fill="rgba(220,38,38,.10)" stroke="none"/><path d="'+aL(iA,0)+'" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="6,3"/>'+
    '<path d="'+aL(pA,1)+'" fill="rgba(15,157,107,.12)" stroke="none"/><path d="'+aL(pA,0)+'" fill="none" stroke="#0f9d6b" stroke-width="2"/>';
  $("#mainChartKey").innerHTML='<span class="key-blue">■ Balance remaining</span> · <span class="key-green">■ Cumulative principal</span> · <span class="key-red">■ Cumulative interest</span>';
}

var currentScale="monthly";
function renderTable(sim,scale){
  var table=$("#amortTable"),sched=sim.sched,ppf=sim.ppf;
  if(!sched.length)return;
  var grouped={};
  sched.forEach(function(s){var key=scale==="weekly"?s.period:scale==="monthly"?Math.ceil(s.period/(ppf/12)):s.year;if(!grouped[key])grouped[key]={repay:0,interest:0,principal:0,extra:0,balance:s.balance,period:key};else grouped[key].balance=s.balance;grouped[key].repay+=s.repay;grouped[key].interest+=s.interest;grouped[key].principal+=s.principal;grouped[key].extra+=s.extra});
  var rows=Object.values(grouped),label=scale==="weekly"?"Week":scale==="monthly"?"Month":"Year";
  table.querySelector("thead").innerHTML='<tr><th>'+label+'</th><th>Repayment</th><th>Interest</th><th>Principal</th><th>Extra</th><th>Balance</th></tr>';
  var html="";
  rows.forEach(function(r){html+='<tr><td>'+label+' '+r.period+'</td><td>'+fmtMoneyFull(r.repay)+'</td><td class="cost">'+fmtMoneyFull(r.interest)+'</td><td class="gain-col">'+fmtMoneyFull(r.principal)+'</td><td>'+(r.extra>0?fmtMoneyFull(r.extra):"—")+'</td><td>'+fmtMoneyFull(r.balance)+'</td></tr>'});
  table.querySelector("tbody").innerHTML=html;
}

function rentVsBuy(opts,sim){
  var ppf=sim.ppf,term=opts.term,weeklyRent=val("rvRent")||0;
  var rentGrow=(val("rvRentGrow")||3)/100,maintPct=(val("rvMaint")||1)/100;
  var apprec=(val("rvApprec")||4)/100,invRate=(val("rvInvRate")||7)/100;
  var propVal=opts.price,annualRepay=sim.stdRepay*ppf+opts.extra*ppf;
  // Read RvB-specific advanced overrides (blank = inherit base)
  var rvTax=val("rvTax"),rvIns=val("rvIns"),rvLMI=val("rvLMI"),rvHOA=val("rvHOA"),rvStamp=val("rvStamp");
  var tax=rvTax!==null?rvTax:opts.tax;
  var ins=rvIns!==null?rvIns:opts.ins;
  var hoa=rvHOA!==null?rvHOA:opts.hoa;
  var lmi=rvLMI!==null?rvLMI:opts.lmi;
  var stamp=rvStamp!==null?rvStamp:opts.stamp;
  var annualOngoing=tax+ins+hoa+(lmi/100*opts.loan);
  var rows=[],investBal=Math.max(0,opts.deposit-stamp),rentYr=weeklyRent*52;
  for(var yr=1;yr<=term;yr++){
    propVal*=(1+apprec);var maint=propVal*maintPct;
    var buyerSpend=annualRepay+annualOngoing+maint;
    var surplus=buyerSpend-rentYr;if(surplus>0)investBal+=surplus;
    investBal*=(1+invRate);
    var endP=Math.min(yr*ppf,sim.sched.length),endE=null;
    for(var k=sim.sched.length-1;k>=0;k--){if(sim.sched[k].period===endP){endE=sim.sched[k];break}}
    var loanBal=endE?endE.balance:0;
    rows.push({year:yr,propVal:propVal,loanBal:loanBal,equity:propVal-loanBal,renterWealth:investBal});
    rentYr*=(1+rentGrow);
  }
  var fin=rows[rows.length-1],diff=fin.equity-fin.renterWealth;
  var vc=diff>0?"buy-wins":diff<0?"rent-wins":"tie";
  var vt=diff>0?"Buying builds more wealth by "+fmtMoney(Math.abs(diff))+" over "+term+" years":diff<0?"Renting + investing builds more wealth by "+fmtMoney(Math.abs(diff))+" over "+term+" years":"Both paths are roughly equal over "+term+" years";
  $("#rvbResults").innerHTML='<div class="rvb-cards"><div class="rvb-card buy"><h3>🏠 Buy</h3><div class="big">'+fmtMoney(fin.equity)+'</div><div class="sub">Net equity after '+term+' years</div></div><div class="rvb-card rent"><h3>🏠 Rent + Invest</h3><div class="big">'+fmtMoney(fin.renterWealth)+'</div><div class="sub">Investment portfolio after '+term+' years</div></div></div><div class="rvb-verdict '+vc+'">'+vt+'</div>';
  $("#rvbChartWrap").hidden=false;
  var svgEl=$("#rvbChart"),W=700,H=300,PAD={t:20,r:20,b:40,l:60};
  var iW=W-PAD.l-PAD.r,iH=H-PAD.t-PAD.b;
  var maxY=Math.max.apply(null,rows.map(function(r){return Math.max(r.equity,r.renterWealth)}))*1.1;
  if(maxY<1)maxY=1;
  function xP(y){return PAD.l+((y-1)/term)*iW}
  function yP(v){return PAD.t+iH-(v/maxY)*iH}
  var gH="",gV="";
  for(var v=0;v<=maxY;v+=maxY/4){gH+='<line x1="'+PAD.l+'" y1="'+yP(v)+'" x2="'+(W-PAD.r)+'" y2="'+yP(v)+'" stroke="#e2e6ef" stroke-width="1"/><text x="'+(PAD.l-6)+'" y="'+(yP(v)+4)+'" text-anchor="end" fill="#8492a6" font-size="11">'+fmtMoney(v)+'</text>'}
  for(var y2=1;y2<=term;y2+=(term<=10?1:5)){gV+='<line x1="'+xP(y2)+'" y1="'+PAD.t+'" x2="'+xP(y2)+'" y2="'+(H-PAD.b)+'" stroke="#e2e6ef" stroke-width="1"/><text x="'+xP(y2)+'" y="'+(H-PAD.b+16)+'" text-anchor="middle" fill="#8492a6" font-size="11">Yr '+y2+'</text>'}
  var bP=rows.map(function(r){return xP(r.year)+','+yP(r.equity)}).join(' ');
  var rP=rows.map(function(r){return xP(r.year)+','+yP(r.renterWealth)}).join(' ');
  svgEl.innerHTML='<rect width="'+W+'" height="'+H+'" fill="#f7f8fb" rx="10"/>'+gH+gV+'<path d="M '+bP+'" fill="none" stroke="#3b5bdb" stroke-width="2.5"/><path d="M '+rP+'" fill="none" stroke="#0f9d6b" stroke-width="2.5"/>';
  $("#rvbLegend").innerHTML='<div class="leg-item"><span class="leg-swatch" style="background:#3b5bdb"></span> <strong>Buy — equity</strong></div><div class="leg-item"><span class="leg-swatch" style="background:#0f9d6b"></span> <strong>Rent + invest</strong></div>';
  $("#rvbTableHead").hidden=false;
  $("#rvbTable").innerHTML='<thead><tr><th>Year</th><th>Property value</th><th>Loan balance</th><th>Buy equity</th><th>Rent+invest</th><th>Difference</th></tr></thead><tbody>'+rows.map(function(r){var d=r.equity-r.renterWealth;var c=d>0?'class="gain-col"':d<0?'class="cost"':'';return '<tr><td>'+r.year+'</td><td>'+fmtMoneyFull(r.propVal)+'</td><td class="cost">'+fmtMoneyFull(r.loanBal)+'</td><td>'+fmtMoneyFull(r.equity)+'</td><td>'+fmtMoneyFull(r.renterWealth)+'</td><td '+c+'>'+(d>=0?'+':'')+fmtMoneyFull(d)+'</td></tr>'}).join('')+'</tbody>';
}

var cmpCount=0,CMP_COLORS=["#8b5cf6","#ca8a04","#ec4899","#06b6d4","#f97316"];

function addComparison(){
  cmpCount++;var base=readInputs();
  var div=document.createElement("div");div.className="scenario adv-block";div.id="cmp"+cmpCount;
  div.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong style="color:var(--accent)">Scenario '+cmpCount+'</strong><button type="button" class="rm-cmp" data-id="cmp'+cmpCount+'" style="border:none;background:none;color:#dc2626;font-weight:700;cursor:pointer;font-size:1.1rem">✕</button></div><div class="grid"><div class="field"><label>Rate %</label><input type="number" step="any" class="cmp-rate" placeholder="'+base.rate+'"></div><div class="field"><label>Term (yr)</label><input type="number" step="1" class="cmp-term" placeholder="'+base.term+'"></div><div class="field"><label>Deposit</label><input type="number" step="any" class="cmp-dep" placeholder="'+Math.round(base.deposit)+'"></div><div class="field"><label>Extra / period</label><input type="number" step="any" class="cmp-extra" placeholder="0"></div></div><details class="cmp-adv-details"><summary>⚙️ Advanced options</summary><div class="grid" style="margin-top:8px"><div class="field"><label>Repayment type</label><select class="cmp-repaytype"><option value="">Inherit</option><option value="pi">P&amp;I</option><option value="io">Interest Only</option></select></div><div class="field"><label>IO period (yr)</label><input type="number" step="1" min="0" class="cmp-io" placeholder="'+base.ioYears+'"></div><div class="field"><label>Property tax /yr</label><input type="number" step="any" min="0" class="cmp-tax" placeholder="'+base.tax+'"></div><div class="field"><label>Insurance /yr</label><input type="number" step="any" min="0" class="cmp-ins" placeholder="'+base.ins+'"></div><div class="field"><label>PMI/LMI %/yr</label><input type="number" step="any" min="0" class="cmp-lmi" placeholder="'+base.lmi+'"></div><div class="field"><label>HOA / strata /yr</label><input type="number" step="any" min="0" class="cmp-hoa" placeholder="'+base.hoa+'"></div><div class="field"><label>Stamp duty (one-off)</label><input type="number" step="any" min="0" class="cmp-stamp" placeholder="'+base.stamp+'"></div></div></details>';
  $("#cmpList").appendChild(div);
  div.querySelector(".rm-cmp").addEventListener("click",function(){div.remove()});
}

function runComparison(opts,sim){
  var scenarios=$$(".scenario"),base=opts,results=[];
  scenarios.forEach(function(el,idx){
    var rate=el.querySelector(".cmp-rate").value;rate=rate!==""?parseFloat(rate):base.rate;
    var term=el.querySelector(".cmp-term").value;term=term!==""?parseFloat(term):base.term;
    var dep=el.querySelector(".cmp-dep").value;dep=dep!==""?parseFloat(dep):base.deposit;
    var extra=el.querySelector(".cmp-extra").value;extra=extra!==""?parseFloat(extra):0;
    var rtEl=el.querySelector(".cmp-repaytype");var repayType=rtEl&&rtEl.value!==""?rtEl.value:base.repayType;
    var ioEl=el.querySelector(".cmp-io");var ioYears=ioEl&&ioEl.value!==""?parseFloat(ioEl.value):base.ioYears;
    var taxEl=el.querySelector(".cmp-tax");var tax=taxEl&&taxEl.value!==""?parseFloat(taxEl.value):base.tax;
    var insEl=el.querySelector(".cmp-ins");var ins=insEl&&insEl.value!==""?parseFloat(insEl.value):base.ins;
    var lmiEl=el.querySelector(".cmp-lmi");var lmi=lmiEl&&lmiEl.value!==""?parseFloat(lmiEl.value):base.lmi;
    var hoaEl=el.querySelector(".cmp-hoa");var hoa=hoaEl&&hoaEl.value!==""?parseFloat(hoaEl.value):base.hoa;
    var stampEl=el.querySelector(".cmp-stamp");var stamp=stampEl&&stampEl.value!==""?parseFloat(stampEl.value):base.stamp;
    var loan=Math.max(0,base.price-dep);
    var altOpts={price:base.price,deposit:dep,loan:loan,rate:rate,term:term,freq:base.freq,repayType:repayType,ioYears:ioYears,extra:extra,tax:tax,ins:ins,lmi:lmi,hoa:hoa,stamp:stamp};
    results.push({label:"Scenario "+(idx+1),opts:altOpts,sim:simulate(altOpts),color:CMP_COLORS[idx%CMP_COLORS.length]});
  });
  if(!results.length)return;
  var html='<div class="rvb-cards"><div class="rvb-card buy"><h3>Base</h3><div class="big">'+fmtMoney(sim.stdRepay+opts.extra)+'</div><div class="sub">'+opts.freq+' repayment</div><div class="sub" style="margin-top:6px">Total interest: <span class="cost">'+fmtMoney(sim.totalInt)+'</span></div></div>';
  results.forEach(function(r){html+='<div class="rvb-card rent" style="border-color:'+r.color+'"><h3 style="color:'+r.color+'">'+r.label+'</h3><div class="big" style="color:'+r.color+'">'+fmtMoney(r.sim.stdRepay+r.opts.extra)+'</div><div class="sub">'+r.opts.freq+' repayment</div><div class="sub" style="margin-top:6px">Total interest: <span class="cost">'+fmtMoney(r.sim.totalInt)+'</span></div></div>'});
  html+='</div>';$("#cmpSummary").innerHTML=html;
  $("#cmpChartWrap").hidden=false;
  var svgEl=$("#cmpChart"),W=700,H=300,PAD={t:20,r:20,b:40,l:60};
  var iW=W-PAD.l-PAD.r,iH=H-PAD.t-PAD.b,maxY=opts.loan*1.05;
  function xP(yr,mt){return PAD.l+((yr-1)/mt)*iW}
  function yP(v){return PAD.t+iH-(v/maxY)*iH}
  var maxTerm=Math.max.apply(null,[opts.term].concat(results.map(function(r){return r.opts.term})));
  var gH="",gV="";
  for(var v=0;v<=maxY;v+=maxY/4){gH+='<line x1="'+PAD.l+'" y1="'+yP(v)+'" x2="'+(W-PAD.r)+'" y2="'+yP(v)+'" stroke="#e2e6ef" stroke-width="1"/><text x="'+(PAD.l-6)+'" y="'+(yP(v)+4)+'" text-anchor="end" fill="#8492a6" font-size="11">'+fmtMoney(v)+'</text>'}
  for(var yr=1;yr<=maxTerm;yr+=(maxTerm<=10?1:5)){gV+='<line x1="'+xP(yr,maxTerm)+'" y1="'+PAD.t+'" x2="'+xP(yr,maxTerm)+'" y2="'+(H-PAD.b)+'" stroke="#e2e6ef" stroke-width="1"/><text x="'+xP(yr,maxTerm)+'" y="'+(H-PAD.b+16)+'" text-anchor="middle" fill="#8492a6" font-size="11">Yr '+yr+'</text>'}
  function sampleYr(sched){var pts=[],seen={};sched.forEach(function(s){if(!seen[s.year]){seen[s.year]=1;pts.push(s)}});return pts}
  var basePts=sampleYr(sim.sched).map(function(s){return xP(s.year,maxTerm)+','+yP(s.balance)}).join(' ');
  var lines='<path d="M '+basePts+'" fill="none" stroke="#3b5bdb" stroke-width="2.5"/>';
  results.forEach(function(r){var pts=sampleYr(r.sim.sched).map(function(s){return xP(s.year,maxTerm)+','+yP(s.balance)}).join(' ');lines+='<path d="M '+pts+'" fill="none" stroke="'+r.color+'" stroke-width="2" stroke-dasharray="6,3"/>'});
  svgEl.innerHTML='<rect width="'+W+'" height="'+H+'" fill="#f7f8fb" rx="10"/>'+gH+gV+lines;
  var legHtml='<div class="leg-item"><span class="leg-swatch" style="background:#3b5bdb"></span> <strong>Base</strong></div>';
  results.forEach(function(r){legHtml+='<div class="leg-item"><span class="leg-swatch" style="background:'+r.color+'"></span> <strong>'+r.label+'</strong></div>'});
  $("#cmpLegend").innerHTML=legHtml;
  $("#cmpTableHead").hidden=false;
  var allR=[{label:"Base",opts:opts,sim:sim,color:"#3b5bdb"}].concat(results);
  $("#cmpTable").innerHTML='<thead><tr><th>Scenario</th><th>Rate</th><th>Term</th><th>Repayment</th><th>Total interest</th><th>Total repaid</th></tr></thead><tbody>'+allR.map(function(r){return '<tr><td style="color:'+r.color+';font-weight:700">'+r.label+'</td><td>'+r.opts.rate+'%</td><td>'+r.opts.term+' yr</td><td>'+fmtMoneyFull(r.sim.stdRepay+r.opts.extra)+'</td><td class="cost">'+fmtMoneyFull(r.sim.totalInt)+'</td><td>'+fmtMoneyFull(r.sim.totalRepaid)+'</td></tr>'}).join('')+'</tbody>';
}

/* ════════════════════ EXCEL EXPORT ════════════════════ */
function exportXls(opts,sim){
  var c=ccySym();
  var hdr='<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="hd"><Font ss:Bold="1" ss:Size="11"/></Style><Style ss:ID="cost"><Font ss:Color="#DC2626" ss:Bold="1"/></Style><Style ss:ID="gain"><Font ss:Color="#0F9D6B" ss:Bold="1"/></Style></Styles><Worksheet ss:Name="Amortisation"><Table><Column ss:Width="80"/><Column ss:Width="110"/><Column ss:Width="110"/><Column ss:Width="110"/><Column ss:Width="100"/><Column ss:Width="110"/>';
  hdr+='<Row><Cell ss:StyleID="hd"><Data ss:Type="String">Period</Data></Cell><Cell ss:StyleID="hd"><Data ss:Type="String">Repayment ('+c.s+')</Data></Cell><Cell ss:StyleID="hd"><Data ss:Type="String">Interest ('+c.s+')</Data></Cell><Cell ss:StyleID="hd"><Data ss:Type="String">Principal ('+c.s+')</Data></Cell><Cell ss:StyleID="hd"><Data ss:Type="String">Extra ('+c.s+')</Data></Cell><Cell ss:StyleID="hd"><Data ss:Type="String">Balance ('+c.s+')</Data></Cell></Row>';
  var body="";
  sim.sched.forEach(function(s){
    body+='<Row><Cell><Data ss:Type="String">'+opts.freq.charAt(0).toUpperCase()+opts.freq.slice(1)+' '+s.period+'</Data></Cell>';
    body+='<Cell><Data ss:Type="Number">'+s.repay.toFixed(2)+'</Data></Cell>';
    body+='<Cell ss:StyleID="cost"><Data ss:Type="Number">'+s.interest.toFixed(2)+'</Data></Cell>';
    body+='<Cell ss:StyleID="gain"><Data ss:Type="Number">'+s.principal.toFixed(2)+'</Data></Cell>';
    body+='<Cell><Data ss:Type="Number">'+s.extra.toFixed(2)+'</Data></Cell>';
    body+='<Cell><Data ss:Type="Number">'+s.balance.toFixed(2)+'</Data></Cell></Row>';
  });
  var xml=hdr+body+'</Table></Worksheet></Workbook>';
  var blob=new Blob([xml],{type:"application/vnd.ms-excel"});
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);
  a.download="mortgage-amortisation.xls";a.click();URL.revokeObjectURL(a.href);
}

/* ════════════════════ LOCAL STORAGE ════════════════════ */
function save(){
  var d={};
  ["mCcy","mPrice","mDeposit","mDepositMode","mRate","mTerm","mFreq","mRepayType","mIOYears","mExtra","mTax","mIns","mLMI","mHOA","mStamp"].forEach(function(id){
    var e=document.getElementById(id);if(e)d[id]=e.value});
  try{localStorage.setItem(LS_KEY,JSON.stringify(d))}catch(x){}
}
function load(){
  try{var d=JSON.parse(localStorage.getItem(LS_KEY));if(!d)return;
  Object.keys(d).forEach(function(id){var e=document.getElementById(id);if(e)e.value=d[id]})}catch(x){}
}

/* ════════════════════ MAIN ════════════════════ */
var lastSim=null,lastOpts=null;

function run(){
  var opts=readInputs();
  lastOpts=opts;lastSim=simulate(opts);
  renderResults(opts,lastSim);
  drawChart(lastSim);
  renderTable(lastSim,currentScale);
  save();
}

document.addEventListener("DOMContentLoaded",function(){
  load();

  // Calculate button
  $("#calcBtn").addEventListener("click",run);

  // Reset
  $("#resetBtn").addEventListener("click",function(){
    ["mPrice","mDeposit","mRate","mTerm","mIOYears","mExtra","mTax","mIns","mLMI","mHOA","mStamp"].forEach(function(id){
      var e=document.getElementById(id);if(e)e.value=""});
    $("#mCcy").value="USD";$("#mDepositMode").value="pct";
    $("#mFreq").value="monthly";$("#mRepayType").value="pi";
    localStorage.removeItem(LS_KEY);
    $("#results").innerHTML="";$("#mainChart").innerHTML="";$("#mainChartKey").innerHTML="";
    $("#amortWrap").hidden=true;
  });

  // Advanced toggle
  $("#advToggle").addEventListener("click",function(){
    var sec=$("#advSection");var hidden=sec.hidden;sec.hidden=!hidden;
    this.setAttribute("aria-expanded",!hidden);
    this.textContent=hidden?"⚙️ Advanced options ▴":"⚙️ Advanced options ▾";
  });

  // View toggle: Chart / Table
  $("#viewGraph").addEventListener("click",function(){
    $("#amortWrap").hidden=true;$("#mainChart").style.display="";
    this.classList.add("active");$("#viewTable").classList.remove("active");
  });
  $("#viewTable").addEventListener("click",function(){
    $("#amortWrap").hidden=false;$("#mainChart").style.display="none";
    this.classList.add("active");$("#viewGraph").classList.remove("active");
    if(lastSim)renderTable(lastSim,currentScale);
  });

  // Scale toggle
  $$(".stog").forEach(function(btn){
    btn.addEventListener("click",function(){
      $$(".stog").forEach(function(b){b.classList.remove("active")});
      this.classList.add("active");currentScale=this.dataset.scale;
      if(lastSim)renderTable(lastSim,currentScale);
    });
  });

  // Rent vs Buy toggle
  $("#rvbToggle").addEventListener("click",function(){
    var sec=$("#rvbSection");var hidden=sec.hidden;sec.hidden=!hidden;
    this.setAttribute("aria-expanded",!hidden);
  });
  // Rent vs Buy advanced costs toggle
  $("#rvbAdvToggle").addEventListener("click",function(){
    var sec=$("#rvbAdvSection");var hidden=sec.hidden;sec.hidden=!hidden;
    this.setAttribute("aria-expanded",!hidden);
    this.textContent=hidden?"⚙️ Advanced costs ▴":"⚙️ Advanced costs ▾";
  });
  $("#rvbCalc").addEventListener("click",function(){
    if(!lastSim)run();
    rentVsBuy(lastOpts,lastSim);
  });

  // Comparison toggle — auto-add first scenario on open
  var cmpOpened=false;
  $("#cmpToggle").addEventListener("click",function(){
    var sec=$("#cmpSection");var wasHidden=sec.hidden;sec.hidden=!wasHidden;
    this.setAttribute("aria-expanded",!wasHidden);
    if(wasHidden&&!cmpOpened){addComparison();cmpOpened=true;}
  });
  $("#addCmp").addEventListener("click",addComparison);
  $("#runCmp").addEventListener("click",function(){
    if(!lastSim)run();
    if(!$$("#cmpList .scenario").length)addComparison();
    runComparison(lastOpts,lastSim);
  });

  // Export
  $("#exportXls").addEventListener("click",function(){
    if(!lastSim)run();
    exportXls(lastOpts,lastSim);
  });

  // Auto-calculate on input change
  ["mPrice","mDeposit","mRate","mTerm","mIOYears","mExtra","mTax","mIns","mLMI","mHOA","mStamp"].forEach(function(id){
    var e=document.getElementById(id);if(e)e.addEventListener("input",run)});
  ["mCcy","mDepositMode","mFreq","mRepayType"].forEach(function(id){
    var e=document.getElementById(id);if(e)e.addEventListener("change",run)});

  // Initial calculation
  run();

  // Mobile tap toggle for help tooltips
  document.addEventListener('click', e => {
    const h = e.target.closest('.help');
    if (!h) { document.querySelectorAll('.help.tapped').forEach(t => t.classList.remove('tapped')); return; }
    h.classList.toggle('tapped');
  });
});

})();
