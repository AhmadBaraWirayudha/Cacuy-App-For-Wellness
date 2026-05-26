// ╔══════════════════════════════════════════════════╗
// ║  CALENDAR / SIKLUS                              ║
// ╚══════════════════════════════════════════════════╝

function todayISO(){const d=new Date();return isoDate(d);}

function isoDate(d){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}

function addDays(ds,n){const d=new Date(ds+'T12:00');d.setDate(d.getDate()+n);return isoDate(d);}

function diffDays(a,b){return Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/86400000);}

function todayKey(){const n=new Date();return`${n.getFullYear()}-${n.getMonth()+1}-${n.getDate()}`;}

function dayKey(dow){const n=new Date(),t=n.getDay(),d=new Date(n);d.setDate(n.getDate()+(dow-t));return`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}

function weekKeys(){const k=[],n=new Date(),t=n.getDay();for(let i=0;i<7;i++){const d=new Date(n);d.setDate(n.getDate()-t+i);k.push(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`);}return k;}

function getPeriodStarts(){return S.periodLogs.filter(l=>l.ev==='start').map(l=>l.date).sort();}

function getLastPeriodStart(){const s=getPeriodStarts();return s.length?s[s.length-1]:null;}

function predictNext(){const last=getLastPeriodStart();return last?addDays(last,getAvgCycLen()):null;}

function predictOv(){const n=predictNext();return n?addDays(n,-14):null;}

function predictFertile(){const o=predictOv();return o?{start:addDays(o,-5),end:addDays(o,1)}:null;}

function renderPredGrid(){
  const el=document.getElementById('predGrid');if(!el)return;
  const next=predictNext(),ov=predictOv(),fw=predictFertile(),last=getLastPeriodStart();
  const today=todayISO();
  const cycDay=last?diffDays(last,today)+1:null;
  const dtn=next?diffDays(today,next):null;
  el.innerHTML=`
    <div class="pred-card"><div class="pred-ico">🩸</div><div class="pred-lbl">Hari Siklus</div><div class="pred-val">${cycDay?`Hari ${cycDay}`:'Log dulu'}</div><div class="pred-sub">${last?`Mulai ${fmtShort(last)}`:''}</div></div>
    <div class="pred-card"><div class="pred-ico">📅</div><div class="pred-lbl">Haid Berikutnya</div><div class="pred-val">${next?fmtShort(next):'—'}</div><div class="pred-sub">${dtn!==null&&dtn>=0?`${dtn} hari lagi`:dtn!==null?'Sudah tiba!':''}</div></div>
    <div class="pred-card"><div class="pred-ico">🥚</div><div class="pred-lbl">Prediksi Ovulasi</div><div class="pred-val">${ov?fmtShort(ov):'—'}</div><div class="pred-sub">~14 hr sebelum haid</div></div>
    <div class="pred-card"><div class="pred-ico">🌱</div><div class="pred-lbl">Fertile Window</div><div class="pred-val">${fw?fmtShort(fw.start):'—'}</div><div class="pred-sub">${fw?`s/d ${fmtShort(fw.end)}`:''}</div></div>`;
}

function calNav(dir){calMonthIdx+=dir;if(calMonthIdx>11){calMonthIdx=0;calYear++;}if(calMonthIdx<0){calMonthIdx=11;calYear--;}renderCalendar();}

function renderCalendar(){
  const MN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const lbl=document.getElementById('calNavLbl');if(lbl)lbl.textContent=`${MN[calMonthIdx]} ${calYear}`;
  const hdr=document.getElementById('calHeader');
  if(hdr&&!hdr.children.length)hdr.innerHTML=['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d=>`<div class="cal-dh">${d}</div>`).join('');
  const first=new Date(calYear,calMonthIdx,1).getDay();
  const dim=new Date(calYear,calMonthIdx+1,0).getDate();
  const today2=todayISO();
  // period dates
  const periodSet=new Set(S.periodLogs.filter(l=>l.flow||l.ev==='start'||l.ev==='ongoing').map(l=>l.date));
  const startSet=new Set(S.periodLogs.filter(l=>l.ev==='start').map(l=>l.date));
  // predictions
  const next=predictNext(),ov=predictOv(),fw=predictFertile();
  const predSet=new Set();if(next){for(let i=0;i<getAvgPeriodLen();i++)predSet.add(addDays(next,i));}
  const fertileSet=new Set();if(fw){let d=fw.start;while(d<=fw.end){fertileSet.add(d);d=addDays(d,1);}}
  const moodSet=new Set(S.moodLogs.map(m=>m.date));
  let html='';
  for(let i=0;i<first;i++)html+=`<div class="cal-cell empty"></div>`;
  for(let d=1;d<=dim;d++){
    const ds=`${calYear}-${String(calMonthIdx+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let cls='cal-cell';
    if(ds===today2)cls+=' today';
    if(startSet.has(ds)||periodSet.has(ds))cls+=' period';
    else if(ds===ov)cls+=' ovulation';
    else if(fertileSet.has(ds))cls+=' fertile';
    else if(predSet.has(ds))cls+=' predicted';
    const hasMood=moodSet.has(ds);
    html+=`<div class="${cls}" onclick="calClick('${ds}')">${d}${hasMood?'<div class="cal-mood-dot"></div>':''}</div>`;
  }
  const grid=document.getElementById('calDays');if(grid)grid.innerHTML=html;
}

function calClick(ds){
  const det=document.getElementById('calDayDetail');if(!det)return;
  const entries=S.periodLogs.filter(l=>l.date===ds);
  const moods=S.moodLogs.filter(l=>l.date===ds);
  if(!entries.length&&!moods.length){det.style.display='none';return;}
  det.style.display='block';
  let html=`<div class="card-ttl" style="margin-bottom:8px;">${fmtDate(ds)}</div>`;
  entries.forEach(e=>{const mood=MOODS.find(m=>m.id===e.mood);html+=`<div class="cy-badges" style="margin-bottom:4px;">${e.ev==='start'?'<span class="cy-badge cb-period">🩸 Mulai Haid</span>':''}${e.ev==='end'?'<span class="cy-badge cb-end">✅ Selesai</span>':''}${e.flow?`<span class="cy-badge cb-flow">${e.flow}</span>`:''}${(e.symptoms||[]).map(s=>`<span class="cy-badge cb-symp">${s}</span>`).join('')}${mood?`<span class="cy-badge cb-mood">${mood.e}</span>`:''}</div>${e.notes?`<div style="font-size:11px;color:var(--txtM);margin-bottom:4px;">${e.notes}</div>`:''}`});
  moods.forEach(m=>{const md=MOODS.find(x=>x.id===m.mood);if(md)html+=`<div class="cy-badges"><span class="cy-badge cb-mood">${md.e} ${md.l} (${m.intensity}/10)</span></div>`;});
  det.innerHTML=html;
}

function renderCycleStats(){
  const starts=getPeriodStarts();
  document.getElementById('avgCycLenV').textContent=getAvgCycLen()+'hr';
  document.getElementById('totCyclesV').textContent=Math.max(0,starts.length-1);
  document.getElementById('avgPeriodLenV').textContent=getAvgPeriodLen()+'hr';
  // Cycle length chart
  const cycD=[];for(let i=1;i<starts.length;i++)cycD.push({l:fmtShort(starts[i-1]),v:diffDays(starts[i-1],starts[i])});
  mkChart('cycLenCh','line',cycD.map(d=>d.l),cycD.map(d=>d.v),'Hari','rgba(255,143,171,0.8)',true);
  // Mood line
  const ml=S.moodLogs.slice(-21);
  mkChart('moodLineCh','line',ml.map(m=>fmtShort(m.date)),ml.map(m=>m.intensity||5),'Intensitas','rgba(197,180,227,0.8)',true);
  // Symptoms bar
  const sf={};S.periodLogs.forEach(l=>(l.symptoms||[]).forEach(s=>{sf[s]=(sf[s]||0)+1;}));
  mkChart('sympCh','bar',Object.keys(sf),Object.values(sf),'Frekuensi','rgba(255,212,184,0.85)');
}