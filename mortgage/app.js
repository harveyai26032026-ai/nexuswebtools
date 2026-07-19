/* Nexus Web Tools — Mortgage Calculator v3
   Clear cost breakdown: interest vs principal, ownership costs vs rent,
   surplus invested. Improved comparison clarity. Pure vanilla JS. */
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
  var maintPct=val("mMaint")||0;
  var maint=price*maintPct/100;
  var inflation=(val("mInflation")||2.5)/100;
  return{price:price,deposit:deposit,loan:loan,rate:val("mRate")||0,term:val("mTerm")||30,freq:val("mFreq")||"monthly",repayType:val("mRepayType")||"pi",ioYears:val("mIOYears")||0,extra:val("mExtra")||0,tax:val("mTax")||0,ins:val("mIns")||0,lmi:val("mLMI")||0,hoa:val("mHOA")||0,loanFee:val("mLoanFee")||0,stamp:val("mStamp")||0,purchaseCosts:val("mPurchaseCosts")||0,maint:maint,maintPct:maintPct,inflation:inflation};
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
  var ongYr=opts.tax+opts.ins+opts.hoa+opts.loanFee+opts.maint;
  return{sched:sched,stdRepay:stdRepay,totalInt:totalInt,totalPrin:totalPrin,totalExtra:totalExtra,totalRepaid:totalPrin+totalInt+totalExtra,ongoingYr:ongYr,loan:loan,term:term,freq:freq,ppf:ppf};
}

function forecastValue(opts){
  var apprec=(val("mApprec")||val("rvApprec")||4)/100;
  return opts.price*Math.pow(1+apprec,opts.term);
}

/* ─── LOAN SPLIT ─── */
var splitPeople=[];
function renderSplitPeople(){
  var c=$("#splitPeople");
  if(!c)return; // guard: element may not exist
  if(!splitPeople.length){c.innerHTML='<p class="hint" style="margin:0">No split configured — click "Add person" to divide the loan.</p>';return}
  var totalPct=splitPeople.reduce(function(s,p){return s+p.pct},0);
  var valid=Math.abs(totalPct-100)<0.01;
  var html='<div class="split-grid">';
  splitPeople.forEach(function(p,i){
    html+='<div class="split-row">'+
      '<input type="text" class="split-name" data-idx="'+i+'" value="'+(p.name||'Person '+(i+1))+'" placeholder="Name">'+
      '<div class="split-pct-wrap">'+
        '<input type="number" class="split-pct" data-idx="'+i+'" value="'+p.pct+'" min="0" max="100" step="any">'+
        '<span class="split-pct-label">%</span>'+
      '</div>'+
    '</div>';
  });
  html+='</div>';
  html+='<p class="hint" style="margin-top:8px;'+(valid?'':'color:var(--cost);font-weight:600')+'">Total: '+totalPct.toFixed(1)+'%'+(valid?' ✓':' — must equal 100%')+'</p>';
  c.innerHTML=html;
  // Wire up change handlers
  c.querySelectorAll('.split-name').forEach(function(el){
    el.addEventListener('input',function(){splitPeople[+this.dataset.idx].name=this.value})});
  c.querySelectorAll('.split-pct').forEach(function(el){
    el.addEventListener('input',function(){
      splitPeople[+this.dataset.idx].pct=parseFloat(this.value)||0;
      renderSplitPeople();
    })});
}

function getSplitPeople(){
  if(!splitPeople.length)return[];
  var total=splitPeople.reduce(function(s,p){return s+p.pct},0);
  if(Math.abs(total-100)>=0.01)return[]; // invalid
  return splitPeople.map(function(p){return{name:p.name||'Person',pct:p.pct/100}});
}

function renderSplitResults(opts,sim){
  var el=$("#splitResults");
  if(!el)return;
  var people=getSplitPeople();
  if(!people.length){el.innerHTML='';return}
  var ongTotal=sim.ongoingYr*opts.term;
  var upfrontTotal=opts.lmi+opts.stamp+opts.purchaseCosts;
  var totalCost=sim.totalInt+ongTotal+upfrontTotal;
  var forecastVal=forecastValue(opts);
  var netEquity=forecastVal-totalCost;
  var html='<h3 class="cmp-h">👥 Loan split breakdown</h3><div class="split-cards">';
  people.forEach(function(p){
    var pctLabel=(p.pct*100).toFixed(1);
    html+='<div class="split-person-card">'+
      '<h4>'+p.name+' <span class="split-pct-badge">'+pctLabel+'%</span></h4>'+
      '<div class="split-row-val"><span>Share of deposit</span><span class="gain-col">'+fmtMoney(opts.deposit*p.pct)+'</span></div>'+
      '<div class="split-row-val"><span>Share of loan</span><span>'+fmtMoney(opts.loan*p.pct)+'</span></div>'+
      '<div class="split-row-val"><span>'+opts.freq+' repayment</span><span class="primary-col">'+fmtMoney((sim.stdRepay+opts.extra)*p.pct)+'</span></div>'+
      '<div class="split-row-val"><span>Share of interest paid</span><span class="cost">'+fmtMoney(sim.totalInt*p.pct)+'</span></div>'+
      '<div class="split-row-val"><span>Share of total repaid</span><span>'+fmtMoney(sim.totalRepaid*p.pct)+'</span></div>'+
      '<div class="split-row-val"><span>Share of ongoing costs</span><span class="cost">'+fmtMoney(ongTotal*p.pct)+'</span></div>'+
      '<div class="split-row-val"><span>Share of upfront costs</span><span class="cost">'+fmtMoney(upfrontTotal*p.pct)+'</span></div>'+
      '<div class="split-row-val rvb-total"><span>Share of total cost</span><span class="cost">'+fmtMoney(totalCost*p.pct)+'</span></div>'+
      '<div class="split-row-val"><span>Share of forecast value</span><span class="gain-col">'+fmtMoney(forecastVal*p.pct)+'</span></div>'+
      '<div class="split-row-val rvb-total"><span>Net equity</span><span class="gain-col">'+fmtMoney(netEquity*p.pct)+'</span></div>'+
    '</div>';
  });
  html+='</div>';
  el.innerHTML=html;
}

function renderResults(opts,sim){
  var depPct=opts.price>0?(opts.deposit/opts.price*100):0;
  $("#results").innerHTML=
    '<div class="stat neutral" data-tip="The total purchase price of the property before any deposit or fees."><span class="big">'+fmtMoney(opts.price)+'</span><span class="lbl">Purchase price</span></div>'+
    '<div class="stat gain" data-tip="The upfront amount you pay from savings. A 20% deposit avoids PMI/LMI fees."><span class="big">'+fmtMoney(opts.deposit)+'</span><span class="lbl">Deposit ('+depPct.toFixed(0)+'%)</span></div>'+
    '<div class="stat cost" data-tip="The amount borrowed from the lender: purchase price minus deposit."><span class="big">'+fmtMoney(opts.loan)+'</span><span class="lbl">Loan amount</span></div>'+
    '<div class="stat primary" data-tip="The minimum amount you must pay the lender each period to stay on schedule."><span class="big">'+fmtMoney(sim.stdRepay+opts.extra)+'</span><span class="lbl">'+opts.freq+' repayment</span></div>'+
    '<div class="stat gain" data-tip="Estimated property value after '+opts.term+' years at the assumed capital growth rate. Set this in Advanced options."><span class="big">'+fmtMoney(forecastValue(opts))+'</span><span class="lbl">Forecast value at '+opts.term+'yr</span></div>'+
    '<div class="stat cost" data-tip="The total interest you will pay over the entire loan term at the given rate."><span class="big">'+fmtMoney(sim.totalInt)+'</span><span class="lbl">Total interest ('+fmtMoney(sim.totalInt/opts.term/12)+'/mo)</span></div>'+
    '<div class="stat cost" data-tip="Total of all repayments including principal, interest and extra payments."><span class="big">'+fmtMoney(sim.totalRepaid)+'</span><span class="lbl">Total repaid</span></div>'+
    '<div class="stat '+(sim.ongoingYr>0?'cost':'neutral')+'" data-tip="Annual property tax, insurance, HOA/strata, loan fees and maintenance combined. Add these in Advanced options."><span class="big">'+(sim.ongoingYr>0?fmtMoney(sim.ongoingYr)+'/yr':'—')+'</span><span class="lbl">Ongoing costs</span></div>'+
    '<div class="stat cost" data-tip="Total interest, ongoing costs, LMI, stamp duty and purchase costs over the loan term — the true cost of borrowing."><span class="big">'+fmtMoney(sim.totalInt+sim.ongoingYr*opts.term+opts.lmi+opts.stamp+opts.purchaseCosts)+'</span><span class="lbl">Total cost of loan</span></div>'+
    '<div class="stat gain" data-tip="Forecast property value minus total interest, ownership costs, LMI, stamp duty and purchase costs."><span class="big">'+fmtMoney(forecastValue(opts)-sim.totalInt-sim.ongoingYr*opts.term-opts.lmi-opts.stamp-opts.purchaseCosts)+'</span><span class="lbl">Net equity at '+opts.term+'yr</span></div>';

  // Collapsible summary table
  var summaryRows=[
    {label:'Purchase price',value:fmtMoneyFull(opts.price),cls:'neutral'},
    {label:'Deposit',value:fmtMoneyFull(opts.deposit)+' ('+depPct.toFixed(1)+'%)',cls:'gain-col'},
    {label:'Loan amount',value:fmtMoneyFull(opts.loan),cls:'cost'},
    {label:'Interest rate',value:opts.rate+'%'},
    {label:'Loan term',value:opts.term+' years ('+opts.freq+')'},
    {label:opts.freq.charAt(0).toUpperCase()+opts.freq.slice(1)+' repayment',value:fmtMoneyFull(sim.stdRepay+opts.extra),cls:'primary'},
    {label:'Total interest',value:fmtMoneyFull(sim.totalInt),cls:'cost'},
    {label:'Total repaid',value:fmtMoneyFull(sim.totalRepaid),cls:'cost'},
    {label:'Total principal',value:fmtMoneyFull(sim.totalPrin+sim.totalExtra),cls:'gain-col'},
    {label:'Ongoing costs /yr',value:sim.ongoingYr>0?fmtMoneyFull(sim.ongoingYr):'—',cls:sim.ongoingYr>0?'cost':''},
    {label:'LMI / PMI',value:fmtMoneyFull(opts.lmi),cls:opts.lmi>0?'cost':''},
    {label:'Stamp duty',value:fmtMoneyFull(opts.stamp),cls:opts.stamp>0?'cost':''},
    {label:'Purchase costs',value:fmtMoneyFull(opts.purchaseCosts),cls:opts.purchaseCosts>0?'cost':''},
    {label:'Total cost of loan',value:fmtMoneyFull(sim.totalInt+sim.ongoingYr*opts.term+opts.lmi+opts.stamp+opts.purchaseCosts),cls:'cost'},
    {label:'Forecast value at '+opts.term+'yr',value:fmtMoneyFull(forecastValue(opts)),cls:'gain-col'},
    {label:'Net equity at '+opts.term+'yr',value:fmtMoneyFull(forecastValue(opts)-sim.totalInt-sim.ongoingYr*opts.term-opts.lmi-opts.stamp-opts.purchaseCosts),cls:'gain-col'}
  ];
  var detailsHtml='<details class="summary-details"><summary>📊 Full loan summary</summary>'+
    '<table class="ref summary-tbl"><tbody>'+
    summaryRows.map(function(r){
      return '<tr><th>'+r.label+'</th><td'+(r.cls?' class="'+r.cls+'"':'')+'>'+r.value+'</td></tr>';
    }).join('')+
    '</tbody></table></details>';
  var existing=$("#results").parentNode.querySelector(".summary-details");
  if(existing)existing.remove();
  $("#results").insertAdjacentHTML("afterend",detailsHtml);
}

function drawChart(sim,opts){
  var svg=$("#mainChart"),W=700,H=300,PAD={t:20,r:20,b:40,l:60};
  var iW=W-PAD.l-PAD.r,iH=H-PAD.t-PAD.b,sched=sim.sched;
  if(!sched.length){svg.innerHTML="";return}
  // Build per-year cumulative data from ALL periods
  var yearData={};
  var cumPrin=0,cumInt=0;
  sched.forEach(function(s){
    cumPrin+=s.principal+s.extra;
    cumInt+=s.interest;
    yearData[s.year]={year:s.year,balance:s.balance,cumPrin:cumPrin,cumInt:cumInt};
  });
  var years=Object.values(yearData).sort(function(a,b){return a.year-b.year});
  // Property value forecast per year
  var apprec=(val("mApprec")||val("rvApprec")||4)/100;
  var finalPropVal=opts.price*Math.pow(1+apprec,opts.term);
  var maxY=Math.max(sim.loan*1.05,(years.length?years[years.length-1].cumInt:0)*1.1,sim.loan,finalPropVal*1.05);
  function xP(yr){return PAD.l+((yr)/sim.term)*iW}
  function yP(v){return PAD.t+iH-(v/maxY)*iH}
  var gH="",gV="";
  for(var v=0;v<=maxY;v+=maxY/4){gH+='<line x1="'+PAD.l+'" y1="'+yP(v)+'" x2="'+(W-PAD.r)+'" y2="'+yP(v)+'" stroke="#e2e6ef" stroke-width="1"/><text x="'+(PAD.l-6)+'" y="'+(yP(v)+4)+'" text-anchor="end" fill="#8492a6" font-size="11">'+fmtMoney(v)+'</text>'}
  // X-axis: ensure last year always shown
  var xStep=sim.term<=10?1:5;
  for(var yr=xStep;yr<=sim.term;yr+=xStep){gV+='<line x1="'+xP(yr)+'" y1="'+PAD.t+'" x2="'+xP(yr)+'" y2="'+(H-PAD.b)+'" stroke="#e2e6ef" stroke-width="1"/><text x="'+xP(yr)+'" y="'+(H-PAD.b+16)+'" text-anchor="middle" fill="#8492a6" font-size="11">Yr '+yr+'</text>'}
  if(sim.term%xStep!==0){gV+='<line x1="'+xP(sim.term)+'" y1="'+PAD.t+'" x2="'+xP(sim.term)+'" y2="'+(H-PAD.b)+'" stroke="#e2e6ef" stroke-width="1"/><text x="'+xP(sim.term)+'" y="'+(H-PAD.b+16)+'" text-anchor="middle" fill="#8492a6" font-size="11">Yr '+sim.term+'</text>'}
  var bA=[{x:PAD.l,y:yP(sim.loan)}],pA=[{x:PAD.l,y:yP(0)}],iA=[{x:PAD.l,y:yP(0)}];
  var vA=[{x:PAD.l,y:yP(opts.price)}];
  years.forEach(function(d){var x=xP(d.year);bA.push({x:x,y:yP(d.balance)});pA.push({x:x,y:yP(d.cumPrin)});iA.push({x:x,y:yP(d.cumInt)});vA.push({x:x,y:yP(opts.price*Math.pow(1+apprec,d.year))})});
  function aL(pts,cl){var l=pts.map(function(p){return p.x+','+p.y}).join(' ');if(!cl)return 'M '+l;var bx=H-PAD.b;return 'M '+pts[0].x+','+bx+' L '+l+' L '+pts[pts.length-1].x+','+bx+' Z'}
  svg.innerHTML='<rect width="'+W+'" height="'+H+'" fill="#f7f8fb" rx="10"/>'+gH+gV+
    '<path d="'+aL(vA,1)+'" fill="rgba(245,158,11,.08)" stroke="none"/><path d="'+aL(vA,0)+'" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="8,4"/>'+
    '<path d="'+aL(bA,1)+'" fill="rgba(59,91,219,.18)" stroke="none"/><path d="'+aL(bA,0)+'" fill="none" stroke="#3b5bdb" stroke-width="2.5"/>'+
    '<path d="'+aL(iA,1)+'" fill="rgba(220,38,38,.10)" stroke="none"/><path d="'+aL(iA,0)+'" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="6,3"/>'+
    '<path d="'+aL(pA,1)+'" fill="rgba(15,157,107,.12)" stroke="none"/><path d="'+aL(pA,0)+'" fill="none" stroke="#0f9d6b" stroke-width="2"/>';
  $("#mainChartKey").innerHTML='<span class="key-amber">■ Property value (forecast)</span> · <span class="key-blue">■ Balance remaining</span> · <span class="key-green">■ Total principal paid</span> · <span class="key-red">■ Total interest paid</span>';
}

var currentScale="monthly";
function renderTable(sim,scale){
  var table=$("#amortTable"),sched=sim.sched,ppf=sim.ppf;
  if(!sched.length)return;
  var grouped={};
  sched.forEach(function(s){var key=scale==="weekly"?s.period:scale==="monthly"?Math.ceil(s.period/(ppf/12)):s.year;if(!grouped[key])grouped[key]={repay:0,interest:0,principal:0,extra:0,balance:s.balance,period:key};else grouped[key].balance=s.balance;grouped[key].repay+=s.repay;grouped[key].interest+=s.interest;grouped[key].principal+=s.principal;grouped[key].extra+=s.extra});
  var rows=Object.values(grouped),label=scale==="weekly"?"Week":scale==="monthly"?"Month":"Year";
  table.querySelector("thead").innerHTML='<tr><th>'+label+'</th><th>Repayment</th><th>Interest</th><th>Total Interest</th><th>Principal</th><th>Total Principal</th><th>Extra</th><th>Balance</th></tr>';
  var html="",cumInt=0,cumPrin=0;
  rows.forEach(function(r){cumInt+=r.interest;cumPrin+=r.principal+r.extra;html+='<tr><td>'+label+' '+r.period+'</td><td>'+fmtMoneyFull(r.repay)+'</td><td class="cost">'+fmtMoneyFull(r.interest)+'</td><td class="cost">'+fmtMoneyFull(cumInt)+'</td><td class="gain-col">'+fmtMoneyFull(r.principal)+'</td><td class="gain-col">'+fmtMoneyFull(cumPrin)+'</td><td>'+(r.extra>0?fmtMoneyFull(r.extra):"—")+'</td><td>'+fmtMoneyFull(r.balance)+'</td></tr>'});
  table.querySelector("tbody").innerHTML=html;
}

/* ════════════════════ RENT VS BUY ════════════════════ */

// Helper: run the RvB simulation with a specific weekly rent and return final difference (equity - renter wealth)
function rvbDiff(opts,sim,weeklyRent){
  var ppf=sim.ppf,term=opts.term;
  var infl=opts.inflation;
  var rvMaintVal=val("rvMaint");
  var maintPct=rvMaintVal!==null&&rvMaintVal!==""?+rvMaintVal:opts.maintPct;
  var apprec=(val("mApprec")||val("rvApprec")||4)/100,invRate=(val("rvInvRate")||7)/100;
  var rvTax=val("rvTax"),rvIns=val("rvIns"),rvLMI=val("rvLMI"),rvHOA=val("rvHOA"),rvLoanFee=val("rvLoanFee"),rvStamp=val("rvStamp"),rvPurchaseCosts=val("rvPurchaseCosts");
  var tax=rvTax!==null&&rvTax!==''?+rvTax:opts.tax,ins=rvIns!==null&&rvIns!==''?+rvIns:opts.ins,hoa=rvHOA!==null&&rvHOA!==''?+rvHOA:opts.hoa;
  var lmi=rvLMI!==null&&rvLMI!==''?+rvLMI:opts.lmi,loanFee=rvLoanFee!==null&&rvLoanFee!==''?+rvLoanFee:opts.loanFee;
  var stamp=rvStamp!==null&&rvStamp!==''?+rvStamp:opts.stamp,purchaseCosts=rvPurchaseCosts!==null&&rvPurchaseCosts!==''?+rvPurchaseCosts:opts.purchaseCosts;
  var annualOngoing=tax+ins+hoa+loanFee;
  var yearInterest={},yearRepay={};
  sim.sched.forEach(function(s){if(!yearInterest[s.year])yearInterest[s.year]=0;if(!yearRepay[s.year])yearRepay[s.year]=0;yearInterest[s.year]+=s.interest;yearRepay[s.year]+=s.repay});
  var propVal=opts.price,investBal=Math.max(0,opts.deposit+stamp+lmi+purchaseCosts);
  var totalInvestContrib=investBal,totalWithdrawn=0,rentYr=weeklyRent*52,cumInt=0,cumOngoing=0,cumMaint=0;
  var ongoingYr=annualOngoing;
  for(var yr=1;yr<=term;yr++){
    propVal*=(1+apprec);
    var yrMaint=propVal*maintPct/100;
    ongoingYr*=(1+infl);
    var yrInt=yearInterest[yr]||0,yrMortgage=yearRepay[yr]||0;
    cumInt+=yrInt;cumOngoing+=ongoingYr;cumMaint+=yrMaint;
    var buyerSpend=yrMortgage+ongoingYr+yrMaint,surplus=buyerSpend-rentYr;
    if(surplus>=0){
      investBal+=surplus;totalInvestContrib+=surplus;
    }else{
      var shortfall=-surplus;
      var withdrawn=Math.min(shortfall,investBal);
      investBal-=withdrawn;totalWithdrawn+=withdrawn;
    }
    investBal=Math.max(0,investBal);
    investBal*=(1+invRate);rentYr*=(1+infl);
  }
  var endP=Math.min(term*ppf,sim.sched.length),endE=null;
  for(var k=sim.sched.length-1;k>=0;k--){if(sim.sched[k].period===endP){endE=sim.sched[k];break}}
  var loanBal=endE?endE.balance:0;
  return (propVal-loanBal)-investBal; // positive = buying wins, negative = renting wins
}

// Binary search for break-even weekly rent (where buying equity ≈ renter portfolio)
// Key insight: at LOW rent the renter invests a big surplus → renting wins (diff < 0)
//              at HIGH rent the renter's portfolio gets drained → buying wins (diff > 0)
// The break-even is the MAXIMUM rent where renting still ties or beats buying.
function findBreakEvenRent(opts,sim){
  var maxRent=opts.price; // absolute ceiling for search
  // At rent=0: renter invests entire buyer spend as surplus → renting wins
  // At very high rent: renter depletes portfolio → buying wins
  var lo=0;
  var diffAtZero=rvbDiff(opts,sim,0);
  if(diffAtZero>=0){
    // Buying wins even at $0 rent — property leverage dominates
    return 0; // no break-even exists; buying always wins
  }
  // Find a hi where buying wins (diff > 0)
  var hi=opts.price/20; // start search at 5% of property price per week
  while(rvbDiff(opts,sim,hi)<=0 && hi<maxRent) hi*=2;
  if(rvbDiff(opts,sim,hi)<=0){
    // Renting wins even at extreme rent — shouldn't normally happen
    return -1; // renting always wins
  }
  // Binary search: lo = renting wins, hi = buying wins
  for(var i=0;i<80;i++){ // ~80 iterations for sub-penny precision
    var mid=(lo+hi)/2;
    var d=rvbDiff(opts,sim,mid);
    if(Math.abs(d)<0.5) return mid;
    if(d>0) hi=mid; else lo=mid; // d>0 = buying wins → break-even is lower
  }
  return (lo+hi)/2;
}

function rentVsBuy(opts,sim){
  var ppf=sim.ppf,term=opts.term,weeklyRent=val("rvRent")||0;
  var infl=opts.inflation;
  var rvMaintVal=val("rvMaint");
  var maintPct=rvMaintVal!==null&&rvMaintVal!==""?+rvMaintVal:opts.maintPct;
  var apprec=(val("mApprec")||val("rvApprec")||4)/100,invRate=(val("rvInvRate")||7)/100;
  var propVal=opts.price;
  // Advanced overrides
  var rvTax=val("rvTax"),rvIns=val("rvIns"),rvLMI=val("rvLMI"),rvHOA=val("rvHOA"),rvLoanFee=val("rvLoanFee"),rvStamp=val("rvStamp"),rvPurchaseCosts=val("rvPurchaseCosts");
  var tax=rvTax!==null&&rvTax!==''?+rvTax:opts.tax;
  var ins=rvIns!==null&&rvIns!==''?+rvIns:opts.ins;
  var hoa=rvHOA!==null&&rvHOA!==''?+rvHOA:opts.hoa;
  var lmi=rvLMI!==null&&rvLMI!==''?+rvLMI:opts.lmi;
  var loanFee=rvLoanFee!==null&&rvLoanFee!==''?+rvLoanFee:opts.loanFee;
  var stamp=rvStamp!==null&&rvStamp!==''?+rvStamp:opts.stamp;
  var purchaseCosts=rvPurchaseCosts!==null&&rvPurchaseCosts!==''?+rvPurchaseCosts:opts.purchaseCosts;
  var annualOngoing=tax+ins+hoa+loanFee;

  // Build yearly interest from amortisation schedule
  var yearInterest={},yearPrincipal={},yearRepay={};
  sim.sched.forEach(function(s){
    if(!yearInterest[s.year])yearInterest[s.year]=0;
    if(!yearPrincipal[s.year])yearPrincipal[s.year]=0;
    if(!yearRepay[s.year])yearRepay[s.year]=0;
    yearInterest[s.year]+=s.interest;
    yearPrincipal[s.year]+=s.principal+s.extra;
    yearRepay[s.year]+=s.repay;
  });

  var rows=[];
  // Renter starts with the full deposit amount (buyer's deposit goes to the bank;
  // renter invests it instead) plus all upfront costs the buyer pays that renter doesn't
  var upfrontCosts=stamp+lmi+purchaseCosts;
  var investBal=Math.max(0,opts.deposit+upfrontCosts);
  var initialSeed=investBal;
  var rentYr=weeklyRent*52;
  var cumInt=0,cumOngoing=0,cumMaint=0,cumRent=0;
  var totalInvestContrib=investBal; // seed = deposit + all upfront costs
  var totalWithdrawn=0;
  var cumPrin=0;
  var ongoingYr=annualOngoing;

  for(var yr=1;yr<=term;yr++){
    propVal*=(1+apprec);
    var yrMaint=propVal*maintPct/100;
    ongoingYr*=(1+infl);
    var yrInt=yearInterest[yr]||0;
    var yrPrin=yearPrincipal[yr]||0;
    var yrMortgage=yearRepay[yr]||0;

    cumInt+=yrInt;
    cumPrin+=yrPrin;
    cumOngoing+=ongoingYr;
    cumMaint+=yrMaint;
    cumRent+=rentYr;

    // ──── Equal outlay model ────
    // Both buyer and renter spend the same total amount per year.
    // Buyer: mortgage + ongoing costs + maintenance
    // Renter: rent + investment contribution (or withdrawal if rent > buyer spend)
    var buyerSpend=yrMortgage+ongoingYr+yrMaint;
    var surplus=buyerSpend-rentYr; // positive = renter invests surplus; negative = renter withdraws
    var prevBal=investBal;
    if(surplus>=0){
      investBal+=surplus;
      totalInvestContrib+=surplus;
    }else{
      // Rent costs more than owning — renter draws from portfolio to maintain equal outlay
      var shortfall=-surplus;
      var withdrawn=Math.min(shortfall,investBal);
      investBal-=withdrawn;
      totalWithdrawn+=withdrawn;
    }
    investBal=Math.max(0,investBal);
    investBal*=(1+invRate);

    var endP=Math.min(yr*ppf,sim.sched.length),endE=null;
    for(var k=sim.sched.length-1;k>=0;k--){if(sim.sched[k].period===endP){endE=sim.sched[k];break}}
    var loanBal=endE?endE.balance:0;
    var equity=propVal-loanBal;

    rows.push({
      year:yr,propVal:propVal,loanBal:loanBal,equity:equity,
      yrInt:yrInt,cumInt:cumInt,yrPrin:yrPrin,cumPrin:cumPrin,
      yrOngoing:annualOngoing,yrMaint:yrMaint,cumMaint:cumMaint,
      cumOngoingCosts:cumOngoing+cumMaint+(yr===1?stamp+lmi:0),
      rentYr:rentYr,cumRent:cumRent,
      renterWealth:investBal,
      investContrib:totalInvestContrib,
      totalWithdrawn:totalWithdrawn,
      netContribs:totalInvestContrib-totalWithdrawn,
      investGrowthYr:investBal-(prevBal+(surplus>=0?surplus:surplus)),
      investGrowthTotal:investBal-(totalInvestContrib-totalWithdrawn),
      buyerSpend:buyerSpend
    });
    rentYr*=(1+infl);
  }

  var fin=rows[rows.length-1];
  var totalBuySunk=fin.cumInt+cumOngoing+cumMaint+stamp+lmi+purchaseCosts;
  var netContribs=totalInvestContrib-totalWithdrawn;
  var investGrowth=fin.renterWealth-netContribs;
  var surplusContribs=totalInvestContrib-initialSeed;
  var diff=fin.equity-fin.renterWealth;
  var vc=diff>0?"buy-wins":diff<0?"rent-wins":"tie";
  var vt=diff>0?"Buying builds "+fmtMoney(Math.abs(diff))+" more wealth over "+term+" years":
           diff<0?"Renting + investing builds "+fmtMoney(Math.abs(diff))+" more wealth over "+term+" years":
           "Both paths are roughly equal over "+term+" years";

  // ─── Break-even rent guidance ───
  var breakEven=findBreakEvenRent(opts,sim);
  var beNote='';
  var maxRent=opts.price;
  var buyingAlwaysWins=(breakEven===0);
  var rentingAlwaysWins=(breakEven===-1);
  if(buyingAlwaysWins){
    beNote='<div class="rvb-note rvb-be">'+
      '<div style="font-size:1.1rem;font-weight:800;margin-bottom:6px">💡 Break-even rent: not reachable</div>'+
      '<div style="margin-bottom:4px">Under these assumptions, buying builds more wealth than renting + investing at <strong>any</strong> rent level. Property growth and leverage outweigh any investment returns the renter could earn.</div>'+
      '<div style="font-weight:700;margin-top:8px;padding:8px 12px;border-radius:8px;background:#fef2f2;color:#991b1b">🏠 Buying is the clear financial choice under these assumptions.</div>'+
      '</div>';
  }else if(rentingAlwaysWins){
    beNote='<div class="rvb-note rvb-be">'+
      '<div style="font-size:1.1rem;font-weight:800;margin-bottom:6px">💡 Break-even rent: not reachable</div>'+
      '<div style="margin-bottom:4px">Under these assumptions, renting + investing builds more wealth than buying at <strong>any</strong> rent level. Investment returns significantly outpace property growth.</div>'+
      '<div style="font-weight:700;margin-top:8px;padding:8px 12px;border-radius:8px;background:#e8f8f0;color:#065f46">📈 Renting + investing is the clear financial choice under these assumptions.</div>'+
      '</div>';
  }else{
    var beWeekly=breakEven;
    var beMonthly=breakEven*52/12;
    var curRent=weeklyRent;
    var rentSaving=beWeekly-curRent;
    beNote='<div class="rvb-note rvb-be">'+
      '<div style="font-size:1.1rem;font-weight:800;margin-bottom:6px">💡 Break-even rent: '+fmtMoneyFull(beWeekly)+'/wk ('+fmtMoneyFull(beMonthly)+'/mo)</div>'+
      '<div style="margin-bottom:4px">This is the <strong>maximum</strong> weekly rent at which renting + investing and buying produce the same outcome over '+term+' years. Below this rent, renting + investing builds more wealth; above it, buying does.</div>'+
      '<div style="font-weight:700;margin-top:8px;padding:8px 12px;border-radius:8px;background:'+(curRent<beWeekly?'#e8f8f0;color:#065f46':'#fef2f2;color:#991b1b')+'">'+
        (curRent<beWeekly?
          '✅ Your rent ('+fmtMoneyFull(curRent)+'/wk) is <strong>'+fmtMoneyFull(rentSaving)+'/wk below</strong> break-even — renting + investing is likely to build more wealth.':
          curRent>beWeekly?
          '⚠️ Your rent ('+fmtMoneyFull(curRent)+'/wk) is <strong>'+fmtMoneyFull(-rentSaving)+'/wk above</strong> break-even — buying is likely to build more wealth.':
          '⚖️ Your rent is at the break-even point — both paths produce roughly equal outcomes.')+
      '</div>'+
      '<div style="margin-top:8px;font-size:.84rem;color:var(--muted)">If you can rent comparable housing for less than '+fmtMoneyFull(beWeekly)+'/wk, renting + investing is generally more cost-effective. If not, buying is likely the better financial choice.</div>'+
      '</div>';
  }

  // ─── Results ───
  $("#rvbResults").innerHTML=
    '<div class="rvb-note">⚖️ Equal outlay: both sides spend the same per period — buyer on mortgage + costs, renter on rent + investing</div>'+
    beNote+
    '<div class="rvb-cards">'+
      '<div class="rvb-card buy">'+
        '<h3>🏠 Buy</h3>'+
        '<div class="big">'+fmtMoney(fin.equity)+'</div>'+
        '<div class="sub">Net equity after '+term+' years</div>'+
        '<div class="rvb-detail">Property '+fmtMoney(fin.propVal)+' − loan '+fmtMoney(fin.loanBal)+'</div>'+
      '</div>'+
      '<div class="rvb-card rent">'+
        '<h3>📈 Rent + Invest</h3>'+
        '<div class="big">'+fmtMoney(fin.renterWealth)+'</div>'+
        '<div class="sub">Portfolio after '+term+' years</div>'+
        '<div class="rvb-detail">Net invested '+fmtMoney(netContribs)+' → grew by '+fmtMoney(investGrowth)+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="rvb-verdict '+vc+'">'+vt+'</div>'+
    '<div class="rvb-cost-cols">'+
      /* ── BUYER ── */
      '<div class="rvb-cost-card buy">'+
        '<h4>🏠 Buyer</h4>'+
        '<h5>💰 Upfront</h5>'+
        '<div class="rvb-cost-row"><span>Deposit (initial equity)</span><span class="gain-col">'+fmtMoney(opts.deposit)+'</span></div>'+
        '<div class="rvb-cost-row"><span>Stamp duty / transfer tax</span><span class="cost">'+fmtMoney(stamp)+'</span></div>'+
        '<div class="rvb-cost-row"><span>LMI / PMI</span><span class="cost">'+fmtMoney(lmi)+'</span></div>'+
        '<div class="rvb-cost-row"><span>Purchase costs</span><span class="cost">'+fmtMoney(purchaseCosts)+'</span></div>'+
        '<div class="rvb-cost-row rvb-total"><span>Total upfront</span><span class="cost">'+fmtMoney(opts.deposit+stamp+lmi+purchaseCosts)+'</span></div>'+
        '<h5>📈 Growth</h5>'+
        '<div class="rvb-cost-row"><span>Principal repaid</span><span class="gain-col">'+fmtMoney(fin.cumPrin)+'</span></div>'+
        '<div class="rvb-cost-row"><span>Capital growth ('+(apprec*100).toFixed(1)+'%/yr)</span><span class="gain-col">'+fmtMoney(fin.propVal-opts.price)+'</span></div>'+
        '<div class="rvb-cost-row rvb-total"><span>Property value at '+term+'yr</span><span class="gain-col">'+fmtMoney(fin.propVal)+'</span></div>'+
        '<h5>💸 Costs sunk</h5>'+
        '<div class="rvb-cost-row"><span>Interest paid</span><span class="cost">'+fmtMoney(fin.cumInt)+'</span></div>'+
        '<div class="rvb-cost-row"><span>Property tax, insurance, HOA</span><span class="cost">'+fmtMoney(cumOngoing)+'</span></div>'+
        '<div class="rvb-cost-row"><span>Maintenance</span><span class="cost">'+fmtMoney(cumMaint)+'</span></div>'+
        '<div class="rvb-cost-row rvb-total"><span>Total costs sunk</span><span class="cost">'+fmtMoney(fin.cumInt+cumOngoing+cumMaint)+'</span></div>'+
        '<h5>🏆 Wealth at '+term+'yr</h5>'+
        '<div class="rvb-cost-row rvb-total rvb-final"><span>Property value</span><span class="gain-col">'+fmtMoney(fin.propVal)+'</span></div>'+
        '<div class="rvb-cost-row rvb-total"><span>Less: loan outstanding</span><span class="cost">−'+fmtMoney(fin.loanBal)+'</span></div>'+
        '<div class="rvb-cost-row rvb-total"><span>Net equity</span><span class="gain-col">'+fmtMoney(fin.equity)+'</span></div>'+
        '<div class="rvb-cost-row rvb-total rvb-final"><span>Net profit (value − all payments)</span><span class="'+(fin.propVal-totalBuySunk>=0?'gain-col':'cost')+'">'+fmtMoney(fin.propVal-totalBuySunk)+'</span></div>'+
      '</div>'+
      /* ── RENTER ── */
      '<div class="rvb-cost-card rent">'+
        '<h4>📈 Rent + Invest</h4>'+
        '<h5>💰 Upfront</h5>'+
        '<div class="rvb-cost-row"><span>Deposit (invested instead)</span><span class="gain-col">'+fmtMoney(opts.deposit)+'</span></div>'+
        '<div class="rvb-cost-row"><span>—</span><span>—</span></div>'+
        '<div class="rvb-cost-row"><span>—</span><span>—</span></div>'+
        '<div class="rvb-cost-row"><span>—</span><span>—</span></div>'+
        '<div class="rvb-cost-row rvb-total"><span>Total seed invested</span><span class="gain-col">'+fmtMoney(initialSeed)+'</span></div>'+
        '<h5>📈 Growth</h5>'+
        '<div class="rvb-cost-row"><span>Surplus contributed (mortgage − rent)</span><span class="gain-col">'+fmtMoney(surplusContribs)+'</span></div>'+
        (totalWithdrawn>0?'<div class="rvb-cost-row"><span>Withdrawals (rent &gt; mortgage)</span><span class="cost">−'+fmtMoney(totalWithdrawn)+'</span></div>':'<div class="rvb-cost-row"><span>—</span><span>—</span></div>')+
        '<div class="rvb-cost-row rvb-total"><span>Net invested</span><span class="gain-col">'+fmtMoney(netContribs)+'</span></div>'+
        '<h5>💸 Costs sunk</h5>'+
        '<div class="rvb-cost-row"><span>Total rent paid</span><span class="cost">'+fmtMoney(cumRent)+'</span></div>'+
        '<div class="rvb-cost-row"><span>—</span><span>—</span></div>'+
        '<div class="rvb-cost-row"><span>—</span><span>—</span></div>'+
        '<div class="rvb-cost-row rvb-total"><span>Total costs sunk</span><span class="cost">'+fmtMoney(cumRent)+'</span></div>'+
        '<h5>🏆 Wealth at '+term+'yr</h5>'+
        '<div class="rvb-cost-row rvb-total rvb-final"><span>Investment portfolio</span><span class="gain-col">'+fmtMoney(fin.renterWealth)+'</span></div>'+
        '<div class="rvb-cost-row rvb-total rvb-final"><span>Net profit (portfolio − costs − contributions − rent)</span><span class="'+(fin.renterWealth-netContribs-cumRent>=0?'gain-col':'cost')+'">'+fmtMoney(fin.renterWealth-netContribs-cumRent)+'</span></div>'+
      '</div>'+
    '</div>'+
    '<div class="rvb-cost-row rvb-total rvb-diff-row"><span>Wealth difference</span><span class="'+(diff>0?'gain-col':'cost')+'">'+(diff>0?'Buyer ahead by '+fmtMoney(diff):diff<0?'Renter ahead by '+fmtMoney(-diff):'Even')+'</span></div>';

  // ─── Chart ───
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
  $("#rvbLegend").innerHTML='<div class="leg-item"><span class="leg-swatch" style="background:#3b5bdb"></span> <strong>Buy — net equity</strong></div><div class="leg-item"><span class="leg-swatch" style="background:#0f9d6b"></span> <strong>Rent + invest — portfolio</strong></div>';

  // ─── Table ───
  $("#rvbTableHead").hidden=false;
  $("#rvbTable").innerHTML=
    '<thead>'+
      '<tr class="rvb-th-group">'+
        '<th rowspan="2">Year</th>'+
        '<th colspan="5" class="rvb-buy-head">🏠 Buy</th>'+
        '<th colspan="7" class="rvb-rent-head">📈 Rent + Invest</th>'+
        '<th rowspan="2" class="rvb-diff-head">Difference</th>'+
      '</tr>'+
      '<tr>'+
        '<th class="rvb-buy-sub">Interest</th>'+
        '<th class="rvb-buy-sub">Principal</th>'+
        '<th class="rvb-buy-sub">Costs</th>'+
        '<th class="rvb-buy-sub">Maint.</th>'+
        '<th class="rvb-buy-sub">Equity</th>'+
        '<th class="rvb-rent-sub">Rent</th>'+
        '<th class="rvb-rent-sub">Surplus</th>'+
        '<th class="rvb-rent-sub">Contrib.</th>'+
        '<th class="rvb-rent-sub">Invest. return (yr)</th>'+
        '<th class="rvb-rent-sub">Invest. return total</th>'+
        '<th class="rvb-rent-sub">Portfolio</th>'+
        '<th class="rvb-rent-sub">Net profit</th>'+
      '</tr>'+
    '</thead><tbody>'+
    rows.map(function(r){
      var d=r.equity-r.renterWealth;
      var c=d>0?'class="gain-col"':d<0?'class="cost"':'';
      var surplus=r.buyerSpend-r.rentYr;
      var renterProfit=r.renterWealth-r.netContribs-r.cumRent;
      return '<tr>'+
        '<td>'+r.year+'</td>'+
        '<td class="rvb-buy cost">'+fmtMoneyFull(r.yrInt)+'</td>'+
        '<td class="rvb-buy gain-col">'+fmtMoneyFull(r.yrPrin)+'</td>'+
        '<td class="rvb-buy cost">'+fmtMoneyFull(r.yrOngoing)+'</td>'+
        '<td class="rvb-buy cost">'+fmtMoneyFull(r.yrMaint)+'</td>'+
        '<td class="rvb-buy gain-col">'+fmtMoneyFull(r.equity)+'</td>'+
        '<td class="rvb-rent cost">'+fmtMoneyFull(r.rentYr)+'</td>'+
        '<td class="rvb-rent gain-col">'+(surplus>=0?fmtMoneyFull(surplus):'−'+fmtMoneyFull(-surplus))+'</td>'+
        '<td class="rvb-rent gain-col">'+fmtMoneyFull(surplus>=0?surplus:-surplus)+'</td>'+
        '<td class="rvb-rent gain-col">'+fmtMoneyFull(r.investGrowthYr)+'</td>'+
        '<td class="rvb-rent gain-col">'+fmtMoneyFull(r.investGrowthTotal)+'</td>'+
        '<td class="rvb-rent">'+fmtMoneyFull(r.renterWealth)+'</td>'+
        '<td class="rvb-rent '+(renterProfit>=0?'gain-col':'cost')+'">'+fmtMoneyFull(renterProfit)+'</td>'+
        '<td class="rvb-diff" '+c+'>'+(d>=0?'+':'')+fmtMoneyFull(d)+'</td>'+
      '</tr>';
    }).join('')+'</tbody>'+
    '<tfoot><tr class="rvb-totals">'+
      '<td><strong>Total</strong></td>'+
      '<td class="rvb-buy cost">'+fmtMoneyFull(fin.cumInt)+'</td>'+
      '<td class="rvb-buy gain-col">'+fmtMoneyFull(fin.cumPrin)+'</td>'+
      '<td class="rvb-buy cost">'+fmtMoneyFull(cumOngoing)+'</td>'+
      '<td class="rvb-buy cost">'+fmtMoneyFull(cumMaint)+'</td>'+
      '<td class="rvb-buy gain-col">'+fmtMoneyFull(fin.equity)+'</td>'+
      '<td class="rvb-rent cost">'+fmtMoneyFull(cumRent)+'</td>'+
      '<td class="rvb-rent">—</td>'+
      '<td class="rvb-rent gain-col">'+fmtMoneyFull(netContribs)+'</td>'+
      '<td class="rvb-rent">—</td>'+
      '<td class="rvb-rent gain-col">'+fmtMoneyFull(investGrowth)+'</td>'+
      '<td class="rvb-rent">'+fmtMoneyFull(fin.renterWealth)+'</td>'+
      '<td class="rvb-rent '+(fin.renterWealth-netContribs-cumRent>=0?'gain-col':'cost')+'">'+fmtMoneyFull(fin.renterWealth-netContribs-cumRent)+'</td>'+
      '<td class="rvb-diff '+(diff>0?'gain-col':'cost')+'">'+(diff>0?'+':'')+fmtMoneyFull(diff)+'</td>'+
    '</tr></tfoot>';
}

/* ════════════════════ MORTGAGE COMPARISON ════════════════════ */
var cmpCount=0,CMP_COLORS=["#8b5cf6","#ca8a04","#ec4899","#06b6d4","#f97316"];

function addComparison(){
  cmpCount++;var base=readInputs();
  var div=document.createElement("div");div.className="scenario adv-block";div.id="cmp"+cmpCount;
  div.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong style="color:var(--accent)">Scenario '+cmpCount+'</strong><button type="button" class="rm-cmp" data-id="cmp'+cmpCount+'" style="border:none;background:none;color:#dc2626;font-weight:700;cursor:pointer;font-size:1.1rem">✕</button></div>'+
    '<div class="grid">'+
      '<div class="field"><label>Rate %</label><input type="number" step="any" class="cmp-rate" placeholder="'+base.rate+'"></div>'+
      '<div class="field"><label>Term (yr)</label><input type="number" step="1" class="cmp-term" placeholder="'+base.term+'"></div>'+
      '<div class="field"><label>Deposit</label><input type="number" step="any" class="cmp-dep" placeholder="'+Math.round(base.deposit)+'"></div>'+
      '<div class="field"><label>Extra / period</label><input type="number" step="any" class="cmp-extra" placeholder="0"></div>'+
    '</div>'+
    '<details class="cmp-adv-details"><summary>⚙️ Advanced options</summary><div class="grid" style="margin-top:8px">'+
      '<div class="field"><label>Repayment type</label><select class="cmp-repaytype"><option value="">Inherit</option><option value="pi">P&amp;I</option><option value="io">Interest Only</option></select></div>'+
      '<div class="field"><label>IO period (yr)</label><input type="number" step="1" min="0" class="cmp-io" placeholder="'+base.ioYears+'"></div>'+
      '<div class="field"><label>Property tax /yr</label><input type="number" step="any" min="0" class="cmp-tax" placeholder="'+base.tax+'"></div>'+
      '<div class="field"><label>Insurance /yr</label><input type="number" step="any" min="0" class="cmp-ins" placeholder="'+base.ins+'"></div>'+
      '<div class="field"><label>PMI/LMI (one‑off)</label><input type="number" step="any" min="0" class="cmp-lmi" placeholder="'+base.lmi+'"></div>'+
      '<div class="field"><label>Loan fee $/yr</label><input type="number" step="any" min="0" class="cmp-loanfee" placeholder="'+base.loanFee+'"></div>'+
      '<div class="field"><label>HOA / strata /yr</label><input type="number" step="any" min="0" class="cmp-hoa" placeholder="'+base.hoa+'"></div>'+
      '<div class="field"><label>Stamp duty (one-off)</label><input type="number" step="any" min="0" class="cmp-stamp" placeholder="'+base.stamp+'"></div>'+
      '<div class="field"><label>Purchase costs (one-off)</label><input type="number" step="any" min="0" class="cmp-purchasecosts" placeholder="'+base.purchaseCosts+'"></div>'+
    '</div></details>';
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
    var loanFeeEl=el.querySelector(".cmp-loanfee");var loanFee=loanFeeEl&&loanFeeEl.value!==""?parseFloat(loanFeeEl.value):base.loanFee;
    var purchaseCostsEl=el.querySelector(".cmp-purchasecosts");var purchaseCosts=purchaseCostsEl&&purchaseCostsEl.value!==""?parseFloat(purchaseCostsEl.value):base.purchaseCosts;
    var loan=Math.max(0,base.price-dep);
    var altOpts={price:base.price,deposit:dep,loan:loan,rate:rate,term:term,freq:base.freq,repayType:repayType,ioYears:ioYears,extra:extra,tax:tax,ins:ins,lmi:lmi,hoa:hoa,loanFee:loanFee,stamp:stamp,purchaseCosts:purchaseCosts};
    results.push({label:"Scenario "+(idx+1),opts:altOpts,sim:simulate(altOpts),color:CMP_COLORS[idx%CMP_COLORS.length]});
  });
  if(!results.length)return;

  // ─── Summary cards ───
  var baseCost=sim.totalInt+opts.tax*opts.term+opts.ins*opts.term+opts.hoa*opts.term+opts.loanFee*opts.term+opts.maint*opts.term+opts.stamp+opts.lmi+opts.purchaseCosts;
  var html='<div class="cmp-summary-card"><div class="cmp-label" style="color:#3b5bdb">Base</div>'+
    '<div class="cmp-big">'+fmtMoney(sim.stdRepay+opts.extra)+'</div>'+
    '<div class="cmp-sub">'+opts.freq+' repayment</div>'+
    '<div class="cmp-detail">Loan: '+fmtMoney(opts.loan)+' · '+opts.rate+'% · '+opts.term+'yr</div>'+
    '<div class="cmp-detail"><span class="cost">Interest: '+fmtMoney(sim.totalInt)+'</span></div>'+
    '<div class="cmp-detail">Total repaid: '+fmtMoney(sim.totalRepaid)+'</div>'+
    '<div class="cmp-detail" style="margin-top:4px;font-weight:600">Cost of loan: '+fmtMoney(sim.totalInt+(opts.tax+opts.ins+opts.hoa+opts.loanFee+opts.maint)*opts.term+opts.stamp+opts.lmi+opts.purchaseCosts)+'</div></div>';

  results.forEach(function(r){
    var intSaved=sim.totalInt-r.sim.totalInt;
    var intDiff=intSaved>0?'<span class="gain-col">Saves '+fmtMoney(intSaved)+' interest</span>':
                intSaved<0?'<span class="cost">Costs '+fmtMoney(Math.abs(intSaved))+' more interest</span>':'';
    var scenarioCost=r.sim.totalInt+(r.opts.tax+r.opts.ins+r.opts.hoa+r.opts.loanFee+r.opts.maint)*r.opts.term+r.opts.stamp+r.opts.lmi+r.opts.purchaseCosts;
    html+='<div class="cmp-summary-card" style="border-color:'+r.color+'">'+
      '<div class="cmp-label" style="color:'+r.color+'">'+r.label+'</div>'+
      '<div class="cmp-big" style="color:'+r.color+'">'+fmtMoney(r.sim.stdRepay+r.opts.extra)+'</div>'+
      '<div class="cmp-sub">'+r.opts.freq+' repayment</div>'+
      '<div class="cmp-detail">Loan: '+fmtMoney(r.opts.loan)+' · '+r.opts.rate+'% · '+r.opts.term+'yr</div>'+
      '<div class="cmp-detail"><span class="cost">Interest: '+fmtMoney(r.sim.totalInt)+'</span></div>'+
      '<div class="cmp-detail">'+intDiff+'</div>'+
      '<div class="cmp-detail">Total repaid: '+fmtMoney(r.sim.totalRepaid)+'</div>'+
      '<div class="cmp-detail" style="margin-top:4px;font-weight:600">Cost of loan: '+fmtMoney(scenarioCost)+'</div></div>';
  });
  $("#cmpSummary").innerHTML='<div class="cmp-cards">'+html+'</div>';

  // ─── Chart ───
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

  // ─── Table ───
  $("#cmpTableHead").hidden=false;
  var allR=[{label:"Base",opts:opts,sim:sim,color:"#3b5bdb"}].concat(results);
  $("#cmpTable").innerHTML='<thead><tr><th></th><th>Rate</th><th>Term</th><th>Repayment</th><th>Total interest</th><th>Interest vs base</th><th>Cost of loan</th><th>Total repaid</th></tr></thead><tbody>'+
    allR.map(function(r,i){
      var intVsBase=i===0?'—':(sim.totalInt-r.sim.totalInt);
      var intCls=i===0?'':intVsBase>0?'class="gain-col"':intVsBase<0?'class="cost"':'';
      var intTxt=i===0?'—':(intVsBase>0?'−'+fmtMoney(Math.abs(intVsBase)):(intVsBase<0?'+':'')+fmtMoney(Math.abs(intVsBase)));
      var colCost=r.sim.totalInt+(r.opts.tax+r.opts.ins+r.opts.hoa+r.opts.loanFee+r.opts.maint)*r.opts.term+r.opts.stamp+r.opts.lmi+r.opts.purchaseCosts;
      return '<tr><td style="color:'+r.color+';font-weight:700">'+r.label+'</td><td>'+r.opts.rate+'%</td><td>'+r.opts.term+' yr</td><td>'+fmtMoneyFull(r.sim.stdRepay+r.opts.extra)+'</td><td class="cost">'+fmtMoneyFull(r.sim.totalInt)+'</td><td '+intCls+'>'+intTxt+'</td><td class="cost">'+fmtMoneyFull(colCost)+'</td><td>'+fmtMoneyFull(r.sim.totalRepaid)+'</td></tr>';
    }).join('')+'</tbody>';
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
  ["mCcy","mPrice","mDeposit","mDepositMode","mRate","mTerm","mFreq","mRepayType","mIOYears","mExtra","mTax","mIns","mLMI","mHOA","mLoanFee","mStamp","mPurchaseCosts","mMaint"].forEach(function(id){
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
  renderSplitResults(opts,lastSim);
  drawChart(lastSim,lastOpts);
  renderTable(lastSim,currentScale);
  save();
}

document.addEventListener("DOMContentLoaded",function(){
  load();

  // Calculate button
  $("#calcBtn").addEventListener("click",run);

  // Reset
  $("#resetBtn").addEventListener("click",function(){
    ["mPrice","mDeposit","mRate","mTerm","mIOYears","mExtra","mTax","mIns","mLMI","mHOA","mLoanFee","mStamp"].forEach(function(id){
      var e=document.getElementById(id);if(e)e.value=""});
    var pc=$("#mPurchaseCosts"); if(pc) pc.value=0;
    var mm=$("#mMaint"); if(mm) mm.value=1;
    var ma=$("#mApprec"); if(ma) ma.value="";
    var mi=$("#mInflation"); if(mi) mi.value="";
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

  // Loan Split toggle (guard if element doesn't exist)
  var stEl = $("#splitToggle");
  if(stEl) stEl.addEventListener("click",function(){
    var sec=$("#splitSection");var hidden=sec.hidden;sec.hidden=!hidden;
    this.setAttribute("aria-expanded",!hidden);
    this.textContent=hidden?"👥 Loan Split ▴":"👥 Loan Split ▾";
  });

  // Add / Remove person (guard if elements don't exist)
  function updateSplitBtns(){
    var rp=$("#removePerson"); if(rp) rp.disabled=splitPeople.length<1;
  }
  var apEl=$("#addPerson");
  if(apEl) apEl.addEventListener("click",function(){
    var n=splitPeople.length;
    // Default: equal split
    splitPeople.push({name:"Person "+(n+1),pct:Math.round(100/(n+1)*10)/10});
    // Redistribute equally
    var each=Math.round(100/(n+1)*10)/10;
    splitPeople.forEach(function(p){p.pct=each});
    // Fix rounding on last person
    var diff=100-splitPeople.reduce(function(s,p){return s+p.pct},0);
    splitPeople[splitPeople.length-1].pct=Math.round((splitPeople[splitPeople.length-1].pct+diff)*10)/10;
    renderSplitPeople();updateSplitBtns();
  });
  var rpEl2=$("#removePerson");
  if(rpEl2) rpEl2.addEventListener("click",function(){
    if(splitPeople.length<1)return;
    splitPeople.pop();
    if(splitPeople.length>0){
      var each=Math.round(100/splitPeople.length*10)/10;
      splitPeople.forEach(function(p){p.pct=each});
      var diff=100-splitPeople.reduce(function(s,p){return s+p.pct},0);
      splitPeople[splitPeople.length-1].pct=Math.round((splitPeople[splitPeople.length-1].pct+diff)*10)/10;
    }
    renderSplitPeople();updateSplitBtns();
  });
  renderSplitPeople();

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
  ["mPrice","mDeposit","mRate","mTerm","mIOYears","mExtra","mTax","mIns","mLMI","mHOA","mLoanFee","mStamp","mPurchaseCosts"].forEach(function(id){
    var e=document.getElementById(id);if(e)e.addEventListener("input",run)});
  ["mCcy","mDepositMode","mFreq","mRepayType"].forEach(function(id){
    var e=document.getElementById(id);if(e)e.addEventListener("change",run)});

  // Initial calculation
  run();

  // Mobile tap toggle for help tooltips
  document.addEventListener('click', e => {
    const h = e.target.closest('.help');
    if (!h) { document.querySelectorAll('.help.tapped').forEach(t => t.classList.remove('tapped')); }
    else { h.classList.toggle('tapped'); return; }
    const s = e.target.closest('.stat[data-tip]');
    if (!s) { document.querySelectorAll('.stat.tapped').forEach(t => t.classList.remove('tapped')); return; }
    s.classList.toggle('tapped');
  });
});

})();
