// ╔══════════════════════════════════════════════════╗
// ║  UI / DOM / DOMAIN LOGIC                         ║
// ╚══════════════════════════════════════════════════╝

function showXP(n,lbl=''){const p=document.getElementById('xpPop');p.textContent=`+${n} XP ✨${lbl?'\n'+lbl:''}`;p.classList.add('show');setTimeout(()=>p.classList.remove('show'),1500);}

function showToast(msg){const t=document.getElementById('toast');t.textContent=msg||'Tersimpan ✓';t.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),2000);}

function ensureSC(dk){if(!S.skincare[dk])S.skincare[dk]={day:{},night:{},rx:null,ing:[],status:'not_started',comment:''};}

function ensureEX(dk){if(!S.exercise[dk])S.exercise[dk]={};}

function go(tab){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nitem').forEach(n=>n.classList.remove('active'));
  document.getElementById('pg-'+tab).classList.add('active');
  const nv=document.getElementById('nv-'+tab);if(nv)nv.classList.add('active');
  document.getElementById('mainHdr').style.display=tab==='home'?'':'none';
  if(tab==='home'){updateStats();refreshHomeCards();}
  if(tab==='skincare'){renderDayTabs();renderSC(selDay);}
  if(tab==='siklus'){buildMoodGrids();renderCalendar();renderPredGrid();renderRecentEntries();renderMoodHistList();}
  if(tab==='jurnal'){renderNotes();}
  if(tab==='analitik'){renderAnalytics();}
}

function scTab(name,el){
  document.querySelectorAll('#pg-skincare .sptab').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('#pg-skincare .spane').forEach(p=>p.classList.remove('active'));
  document.getElementById('sp-'+name).classList.add('active');
  if(name==='produk')renderProducts();
  if(name==='builder'){renderBuilder();renderBuilderAdh();}
  if(name==='kondisi')renderSkinLogList();
  if(name==='grafik')renderSkinGrafik();
}

function sikTab(name,el){
  document.querySelectorAll('#pg-siklus .sptab').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('#pg-siklus .spane').forEach(p=>p.classList.remove('active'));
  document.getElementById('sp-'+name).classList.add('active');
  if(name==='kalender'){renderCalendar();renderPredGrid();}
  if(name==='catat')renderRecentEntries();
  if(name==='mood')renderMoodHistList();
  if(name==='statistik')renderCycleStats();
}

async function init(){
  await load();
  const hrs=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const mths=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const now=new Date(),h=now.getHours();
  const gr=h<12?'Selamat Pagi':h<15?'Selamat Siang':h<18?'Selamat Sore':'Selamat Malam';
  document.getElementById('greetTxt').textContent=`${gr}, Cacuy! 🌸`;
  document.getElementById('hdrDate').textContent=`${hrs[now.getDay()]}, ${now.getDate()} ${mths[now.getMonth()]} ${now.getFullYear()}`;
  // Date defaults
  const t=todayISO();
  ['cycDate','skinLogDate','moodLogDate'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=t;});
  renderDayTabs();renderSC(selDay);renderEX();renderStudy();renderWkDots();updateStats();
  buildMoodGrids();renderCalendar();renderPredGrid();renderRecentEntries();renderMoodHistList();
  renderProducts();renderBuilder();renderBuilderAdh();renderSkinLogList();
  renderNotes();refreshHomeCards();
}

function renderDayTabs(){
  const c=document.getElementById('dayTabs');if(!c)return;c.innerHTML='';
  DAYS.forEach((d,i)=>{
    const b=document.createElement('div');b.className='tbtn'+(i===selDay?' active':'');
    const sc=SC_SCHED[i];b.textContent=(sc&&sc.rest)?'😴 '+d:d;
    b.onclick=()=>{selDay=i;document.querySelectorAll('#dayTabs .tbtn').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderSC(i);};
    c.appendChild(b);
  });
}

function renderSC(dow){
  const sch=SC_SCHED[dow],c=document.getElementById('scSteps'),ttl=document.getElementById('scCardTtl');
  if(!sch||sch.rest){
    c.innerHTML=`<div class="rest-day"><div class="rest-ico">😴</div><div class="rest-ttl">Hari Istirahat</div><div class="rest-sub">Kulit kamu juga butuh istirahat 💕</div></div>`;
    ttl.textContent='😴 Jumat — Rest Day';return;
  }
  ttl.textContent=curDN==='day'?'☀️ Rutinitas Pagi':'🌙 Rutinitas Malam';
  const steps=curDN==='day'?sch.day:sch.night;
  const dk=dayKey(dow);ensureSC(dk);
  const sd=curDN==='day'?S.skincare[dk].day:S.skincare[dk].night;
  c.innerHTML=steps.map((s,i)=>{const chk=sd[i]||false;return`<div class="ci${chk?' done':''}" onclick="togSC(${dow},${i})"><div class="cbox${chk?' chk':''}"></div><span class="clbl">${s}</span></div>`;}).join('');
  document.getElementById('scStatus').value=S.skincare[dk].status||'not_started';
  document.querySelectorAll('.rbadge').forEach(b=>{b.classList.remove('active');const r=b.className.split(' ').find(c=>c.startsWith('r-'));if(r&&r.replace('r-','')===S.skincare[dk].rx)b.classList.add('active');});
  document.querySelectorAll('.ing-badge').forEach(b=>{b.classList.remove('active');});
  (S.skincare[dk].ing||[]).forEach(g=>{const el=document.querySelector(`.ing-badge[onclick*="${g}"]`);if(el)el.classList.add('active');});
  document.getElementById('scComment').value=S.skincare[dk].comment||'';
  updateScProgress();
}

function togSC(dow,idx){
  const dk=dayKey(dow);ensureSC(dk);
  const sd=curDN==='day'?S.skincare[dk].day:S.skincare[dk].night;
  const prev=sd[idx]||false;sd[idx]=!prev;
  if(!prev){S.xp=(S.xp||0)+5;showXP(5);}
  save();renderSC(dow);updateStats();
}

function setDN(m){curDN=m;document.getElementById('dBtn').classList.toggle('active',m==='day');document.getElementById('nBtn').classList.toggle('active',m==='night');renderSC(selDay);}

function setRx(r){const dk=dayKey(selDay);ensureSC(dk);S.skincare[dk].rx=r;document.querySelectorAll('.rbadge').forEach(b=>{b.classList.remove('active');const c=b.className.split(' ').find(x=>x.startsWith('r-'));if(c&&c.replace('r-','')===r)b.classList.add('active');});save();}

function togIng(g){const dk=dayKey(selDay);ensureSC(dk);const l=S.skincare[dk].ing||[];const i=l.indexOf(g);if(i>=0)l.splice(i,1);else l.push(g);S.skincare[dk].ing=l;document.querySelectorAll('.ing-badge').forEach(b=>b.classList.remove('active'));l.forEach(x=>{const el=document.querySelector(`.ing-badge[onclick*="${x}"]`);if(el)el.classList.add('active');});save();}

function saveSCStatus(){const dk=dayKey(selDay);ensureSC(dk);S.skincare[dk].status=document.getElementById('scStatus').value;save();}

function saveSCNote(){const dk=dayKey(selDay);ensureSC(dk);S.skincare[dk].comment=document.getElementById('scComment').value;save();}

function updateScProgress(){
  const dk=todayKey(),sch=SC_SCHED[todayDOW];
  if(!sch||sch.rest){document.getElementById('scProg').textContent='😴 Rest';document.getElementById('scProgF').style.width='100%';return;}
  const tot=(sch.day||[]).length+(sch.night||[]).length;let done=0;const sc=S.skincare[dk];
  if(sc){done+=Object.values(sc.day||{}).filter(Boolean).length;done+=Object.values(sc.night||{}).filter(Boolean).length;}
  document.getElementById('scProg').textContent=`${done}/${tot} step`;
  document.getElementById('scProgF').style.width=(tot>0?done/tot*100:0)+'%';
}

function renderEX(){
  const c=document.getElementById('exList'),dk=todayKey();ensureEX(dk);
  c.innerHTML=EX.map(e=>{const cnt=S.exercise[dk][e.id]||0,done=cnt>=e.max;
    return`<div class="ex-item"><div class="ex-ico">${e.ico}</div><div style="flex:1;"><div class="ex-name">${e.name}</div><div class="ex-tgt">${e.tgt}</div>${done?'<div class="ex-done-lbl">✅ Selesai!</div>':''}</div><div class="ctr"><button class="cbtn" onclick="adjEX('${e.id}',-1)">−</button><div class="cval" id="ex-${e.id}">${cnt}</div><button class="cbtn" onclick="adjEX('${e.id}',1)">${e.max===1?'✓':'+'}</button></div></div>`;
  }).join('');updateEXSummary();
}

function adjEX(id,delta){const dk=todayKey();ensureEX(dk);const e=EX.find(x=>x.id===id),prev=S.exercise[dk][id]||0;S.exercise[dk][id]=Math.max(0,prev+delta);if(delta>0&&prev<e.max&&S.exercise[dk][id]>=e.max){S.xp=(S.xp||0)+10;showXP(10,'💪 Latihan selesai!');}save();renderEX();updateStats();}

function updateEXSummary(){
  const dk=todayKey(),ex=S.exercise[dk]||{};let done=0;EX.forEach(e=>{if((ex[e.id]||0)>=e.max)done++;});
  const wk=weekKeys();let wkDone=0;wk.forEach(k=>{const d=S.exercise[k]||{};let all=true;EX.forEach(e=>{if((d[e.id]||0)<e.max)all=false;});if(all&&Object.keys(d).length>0)wkDone++;});
  document.getElementById('exDoneTxt').textContent=`${done} / ${EX.length}`;
  document.getElementById('exConsTxt').textContent=`${Math.round(wkDone/7*100)}%`;
  document.getElementById('exXPTxt').textContent=`${done*10} XP`;
  document.getElementById('olProg').textContent=`${done}/${EX.length} latihan`;
  document.getElementById('olProgF').style.width=(done/EX.length*100)+'%';
  const wkEl=document.getElementById('exWkDots');
  if(wkEl){wkEl.innerHTML=DAYS_S.map((d,i)=>{const k=wk[i],ed=S.exercise[k]||{};let cnt=0;EX.forEach(e=>{if((ed[e.id]||0)>=e.max)cnt++;});const pct=cnt/EX.length,isDone=pct>=1,isPart=pct>0&&pct<1,isToday=i===todayDOW;return`<div class="wkd-wrap"><div class="wkd${isDone?' done':isPart?' partial':''}${isToday?' today':''}">${isDone?'✓':cnt>0?cnt:''}</div><div class="wkd-lbl">${d}</div></div>`;}).join('');}
}

function renderWkDots(){
  const c=document.getElementById('wkDots');if(!c)return;
  const wk=weekKeys();
  c.innerHTML=DAYS_S.map((d,i)=>{const k=wk[i],sch=SC_SCHED[i],sc=S.skincare[k];let st='';if(sch&&sch.rest)st='rest';else if(sc){const tot=(sch?((sch.day||[]).length+(sch.night||[]).length):0);const done=Object.values(sc.day||{}).filter(Boolean).length+Object.values(sc.night||{}).filter(Boolean).length;if(done>=tot&&tot>0)st='done';else if(done>0)st='partial';}const isToday=i===todayDOW;return`<div class="wkd-wrap"><div class="wkd${st?' '+st:''}${isToday?' today':''}">${st==='done'?'✓':st==='rest'?'💤':''}</div><div class="wkd-lbl">${d}</div></div>`;}).join('');
}

function renderStudy(){
  const c=document.getElementById('studyCats');let tot=0,done=0;
  STUDY_CATS.forEach(cat=>{tot+=cat.topics.length;cat.topics.forEach(t=>{if((S.belajar[tid(cat.id,t)]||{}).status==='done')done++;});});
  document.getElementById('blDone').textContent=done;document.getElementById('blTotal').textContent=tot;
  document.getElementById('blBar').style.width=(tot>0?done/tot*100:0)+'%';
  document.getElementById('blProg').textContent=`${done} selesai`;
  document.getElementById('blProgF').style.width=(tot>0?done/tot*100:0)+'%';
  c.innerHTML=STUDY_CATS.map(cat=>{
    let catDone=0;cat.topics.forEach(t=>{if((S.belajar[tid(cat.id,t)]||{}).status==='done')catDone++;});
    const isOpen=cat.id===localStorage.getItem('openCat');
    return`<div class="scat"><div class="scat-hdr${isOpen?' open':''}" onclick="togCat('${cat.id}',this)"><div class="scat-ico">${cat.ico}</div><div class="scat-ttl">${cat.ttl}</div><div class="scat-cnt${catDone>0?' done-c':''}">${catDone}/${cat.topics.length}</div><div class="chev">▼</div></div><div class="scat-body${isOpen?' open':''}" id="cb-${cat.id}">${cat.topics.map(t=>renderTopic(cat.id,t)).join('')}</div></div>`;
  }).join('');
}

function renderTopic(cid,topic){
  const id=tid(cid,topic),d=S.belajar[id]||{status:'not_started',deadline:'',consistency:0,comment:''};
  const statusColors={not_started:'',in_progress:'background:#FFFDE7;border-color:#FCD34D;color:#8B7000;',done:'background:#E8FFF5;border-color:#6EE7B7;color:#2D7A5A;'};
  const sc=statusColors[d.status]||'';
  return`<div class="stopic" id="tp-${id}"><div class="tp-name">${topic}</div><div class="tp-grid"><div class="cg"><div class="cg-lbl">Status</div><select class="ss" style="${sc}" onchange="updStatus('${id}',this)"><option value="not_started"${d.status==='not_started'?' selected':''}>⏳ Belum Mulai</option><option value="in_progress"${d.status==='in_progress'?' selected':''}>🔄 Sedang Belajar</option><option value="done"${d.status==='done'?' selected':''}>✅ Selesai</option></select></div><div class="cg"><div class="cg-lbl">⏰ Deadline</div><input type="date" class="dl-inp" value="${d.deadline||''}" onchange="updDeadline('${id}',this.value)"></div></div><div class="cg" style="margin-bottom:6px;"><div class="cg-lbl">Konsistensi Mingguan</div><div class="cons-row"><input type="range" class="cons-sl" min="0" max="100" value="${d.consistency||0}" oninput="updCons('${id}',this.value,this.nextElementSibling)"><div class="cons-v">${d.consistency||0}%</div></div></div><div class="cg"><div class="cg-lbl">💬 Komentar</div><textarea class="tc" placeholder="Catatan belajar..." oninput="updComment('${id}',this.value)">${d.comment||''}</textarea></div></div>`;
}

function togCat(cid,hdr){const body=document.getElementById('cb-'+cid);const open=body.classList.toggle('open');hdr.classList.toggle('open',open);localStorage.setItem('openCat',open?cid:'');}

function updStatus(id,sel){if(!S.belajar[id])S.belajar[id]={status:'not_started',deadline:'',consistency:0,comment:''};const prev=S.belajar[id].status;S.belajar[id].status=sel.value;const sc={not_started:'',in_progress:'background:#FFFDE7;border-color:#FCD34D;color:#8B7000;',done:'background:#E8FFF5;border-color:#6EE7B7;color:#2D7A5A;'};sel.style.cssText=sc[sel.value]||'';if(sel.value==='done'&&prev!=='done'){S.xp=(S.xp||0)+20;showXP(20,'📚 Topik Selesai!');}save();let totDone=0,totAll=0;STUDY_CATS.forEach(cat=>{cat.topics.forEach(t=>{totAll++;if((S.belajar[tid(cat.id,t)]||{}).status==='done')totDone++;});});document.getElementById('blDone').textContent=totDone;document.getElementById('blBar').style.width=(totAll>0?totDone/totAll*100:0)+'%';document.getElementById('blProg').textContent=`${totDone} selesai`;document.getElementById('blProgF').style.width=(totAll>0?totDone/totAll*100:0)+'%';STUDY_CATS.forEach(cat=>{let cd=0;cat.topics.forEach(t=>{if((S.belajar[tid(cat.id,t)]||{}).status==='done')cd++;});const el=document.querySelector(`#cb-${cat.id}`);if(el){const cnt=el.previousElementSibling.querySelector('.scat-cnt');if(cnt){cnt.textContent=`${cd}/${cat.topics.length}`;cnt.className='scat-cnt'+(cd>0?' done-c':'');}}});updateStats();}

function updDeadline(id,val){if(!S.belajar[id])S.belajar[id]={};S.belajar[id].deadline=val;save();}

function updCons(id,val,disp){if(!S.belajar[id])S.belajar[id]={};S.belajar[id].consistency=+val;if(disp)disp.textContent=val+'%';save();}

function updComment(id,val){if(!S.belajar[id])S.belajar[id]={};S.belajar[id].comment=val;save();}

function calcStats(){
  const wk=weekKeys();let scTot=0,scMax=0;
  wk.forEach((k,i)=>{const sch=SC_SCHED[i];if(!sch||sch.rest)return;const poss=(sch.day||[]).length+(sch.night||[]).length;scMax+=poss;const sc=S.skincare[k];if(sc){scTot+=Object.values(sc.day||{}).filter(Boolean).length+Object.values(sc.night||{}).filter(Boolean).length;}});
  const glow=scMax>0?Math.min(100,Math.round(scTot/scMax*100)):0;
  const dk=todayKey(),ex=S.exercise[dk]||{};let exD=0;EX.forEach(e=>{if((ex[e.id]||0)>=e.max)exD++;});
  const fit=Math.round(exD/EX.length*100);
  let blT=0,blD=0;STUDY_CATS.forEach(cat=>{cat.topics.forEach(t=>{blT++;if((S.belajar[tid(cat.id,t)]||{}).status==='done')blD++;});});
  const smart=blT>0?Math.round(blD/blT*100):0;
  return{glow,fit,smart};
}

function updateStats(){
  const{glow,fit,smart}=calcStats();
  document.getElementById('glowF').style.width=glow+'%';document.getElementById('glowV').textContent=glow+'%';
  document.getElementById('fitF').style.width=fit+'%';document.getElementById('fitV').textContent=fit+'%';
  document.getElementById('smartF').style.width=smart+'%';document.getElementById('smartV').textContent=smart+'%';
  const xp=S.xp||0,lv=Math.floor(xp/100)+1,xpIn=xp%100,ttl=LV_TITLES[Math.min(lv-1,LV_TITLES.length-1)];
  document.getElementById('lvTxt').textContent=`⭐ Level ${lv} — ${ttl}`;
  document.getElementById('xpTxt').textContent=`${xpIn} / 100`;
  document.getElementById('xpFill').style.width=xpIn+'%';
  updateScProgress();updateEXSummary();renderWkDots();
  let streak=0;
  for(let i=0;i<30;i++){const d=new Date();d.setDate(d.getDate()-i);const dw=d.getDay(),sch=SC_SCHED[dw];if(sch&&sch.rest){streak++;continue;}const k=`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`,sc=S.skincare[k];if(!sc)break;const tot=(sch?((sch.day||[]).length+(sch.night||[]).length):0);const done=Object.values(sc.day||{}).filter(Boolean).length+Object.values(sc.night||{}).filter(Boolean).length;if(done>=tot*0.5)streak++;else break;}
  document.getElementById('strkCnt').textContent=`${streak} hari`;
  document.getElementById('strkF').style.width=Math.min(streak/30*100,100)+'%';
}

function refreshHomeCards(){
  // Siklus card
  const last=getLastPeriodStart();
  if(last){const day=diffDays(last,todayISO())+1;document.getElementById('cycleQS').textContent=`Hari ke-${day}`;document.getElementById('cycleQF').style.width=Math.min(day/28*100,100)+'%';}
  else{document.getElementById('cycleQS').textContent='Log siklus';}
  // Journal card
  const n=S.notes.length;document.getElementById('noteQS').textContent=n?`${n} catatan`:'Tulis catatan';document.getElementById('noteQF').style.width=Math.min(n*8,100)+'%';
}

function openProdSheet(id){
  editingProdId=id||null;photoData='';
  const p=id?S.products.find(x=>x.id===id):null;
  document.getElementById('prodSheetLbl').textContent=p?'Edit Produk':'Tambah Produk';
  document.getElementById('prodNameInp').value=p?p.name:'';
  document.getElementById('prodBrandInp').value=p?(p.brand||''):'';
  document.getElementById('prodCatInp').value=p?(p.cat||'cleanser'):'cleanser';
  document.getElementById('prodFreqInp').value=p?(p.freq||'daily-am'):'daily-am';
  document.getElementById('prodNotesInp').value=p?(p.notes||''):'';
  document.getElementById('editProdId').value=id||'';
  photoData=p?p.photo||'':'';
  const pb=document.getElementById('prodPhotoBtn');
  if(photoData){pb.innerHTML=`<img src="${photoData}" style="width:60px;height:60px;object-fit:cover;">`;}
  else{pb.innerHTML='<span id="prodPhotoIco" style="font-size:22px;">📷</span><span>Upload</span>';}
  document.getElementById('delProdBtn').style.display=p?'block':'none';
  document.getElementById('prodOverlay').classList.add('open');
}

function closeProdSheet(e){if(e&&e.target!==document.getElementById('prodOverlay'))return;document.getElementById('prodOverlay').classList.remove('open');}

function handlePhoto(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{photoData=ev.target.result;const pb=document.getElementById('prodPhotoBtn');pb.innerHTML=`<img src="${photoData}" style="width:60px;height:60px;object-fit:cover;">`};r.readAsDataURL(f);}

function saveProd(){
  const name=document.getElementById('prodNameInp').value.trim();if(!name){showToast('Nama produk wajib diisi!');return;}
  const prod={id:editingProdId||uid(),name,brand:document.getElementById('prodBrandInp').value.trim(),cat:document.getElementById('prodCatInp').value,freq:document.getElementById('prodFreqInp').value,notes:document.getElementById('prodNotesInp').value.trim(),photo:photoData};
  if(editingProdId){const i=S.products.findIndex(p=>p.id===editingProdId);if(i>=0)S.products[i]=prod;}else S.products.push(prod);
  save();document.getElementById('prodOverlay').classList.remove('open');renderProducts();populateStepProdSel();
}

function deleteProd(){
  if(!editingProdId||!confirm('Hapus produk ini?'))return;
  S.products=S.products.filter(p=>p.id!==editingProdId);
  save();document.getElementById('prodOverlay').classList.remove('open');renderProducts();populateStepProdSel();
}

function filterCat(el,cat){
  curProdCat=cat;document.querySelectorAll('.cf-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');renderProducts();
}

function renderProducts(){
  const el=document.getElementById('prodList');if(!el)return;
  const prods=S.products.filter(p=>curProdCat==='all'||p.cat===curProdCat);
  if(!prods.length){el.innerHTML=`<div style="text-align:center;padding:32px 0;color:var(--txtM);"><div style="font-size:40px;margin-bottom:8px;">${CAT_ICO[curProdCat]||'💄'}</div><div style="font-size:13px;font-weight:700;">Belum ada produk</div><div style="font-size:11px;">Tap "+ Tambah" untuk mulai!</div></div>`;return;}
  el.innerHTML=prods.map(p=>`
    <div class="prod-card" onclick="openProdSheet('${p.id}')">
      <div class="prod-photo">${p.photo?`<img src="${p.photo}" alt="${p.name}">`:(CAT_ICO[p.cat]||'📦')}</div>
      <div class="prod-info">
        <div class="prod-name">${p.name}</div>
        <div class="prod-brand">${p.brand||'No brand'}</div>
        <div class="prod-tags"><span class="ptag ptag-cat">${p.cat}</span><span class="ptag ptag-freq">${FREQ_LBL[p.freq]||p.freq}</span></div>
      </div>
    </div>`).join('');
}

function openStepSheet(sess){
  document.getElementById('stepNameInp').value='';document.getElementById('stepWaitSel').value='';document.getElementById('stepSessHidden').value=sess;
  populateStepProdSel();document.getElementById('stepOverlay').classList.add('open');
}

function closeStepSheet(e){if(e&&e.target!==document.getElementById('stepOverlay'))return;document.getElementById('stepOverlay').classList.remove('open');}

function populateStepProdSel(){const sel=document.getElementById('stepProdSel');if(!sel)return;sel.innerHTML='<option value="">— Pilih produk —</option>'+S.products.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');}

function saveStep(){
  let name=document.getElementById('stepNameInp').value.trim();
  const pid=document.getElementById('stepProdSel').value;
  if(!name&&pid){const p=S.products.find(x=>x.id===pid);name=p?p.name:'Step';}
  if(!name){showToast('Isi nama step!');return;}
  const sess=document.getElementById('stepSessHidden').value;
  S.customRoutine[sess].push({id:uid(),name,productId:pid,wait:document.getElementById('stepWaitSel').value});
  save();document.getElementById('stepOverlay').classList.remove('open');renderBuilder();
}

function deleteStep(sess,id){S.customRoutine[sess]=S.customRoutine[sess].filter(x=>x.id!==id);save();renderBuilder();}

function renderBuilder(){
  ['morning','evening'].forEach(sess=>{
    const listId=sess==='morning'?'morningList':'eveningList';
    const el=document.getElementById(listId);if(!el)return;
    const items=S.customRoutine[sess]||[];
    const tKey=todayISO();
    const checks=(S.routineChecks[tKey]||{})[sess]||[];
    if(!items.length){el.innerHTML=`<div style="text-align:center;padding:16px;color:var(--txtM);font-size:12px;">Belum ada step. Tap "+ Step" untuk mulai!</div>`;return;}
    el.innerHTML=items.map((item,i)=>{
      const done=checks[i]||false;
      return`<div class="ri" data-id="${item.id}" data-sess="${sess}" data-idx="${i}">
        <span class="ri-drag">⠿</span>
        <div class="ri-check${done?' done':''}" onclick="togBuilderCheck('${sess}',${i},this)"></div>
        <div style="flex:1;">
          <div class="ri-name" style="${done?'text-decoration:line-through;color:var(--txtM);':''}">${item.name}</div>
          ${item.wait?`<div class="ri-sub">⏱ ${item.wait}</div>`:''}
        </div>
        <button class="ri-del" onclick="deleteStep('${sess}','${item.id}')">✕</button>
      </div>`;
    }).join('');
    // Init sortable
    const sl = sess==='morning'?sortableMorn:sortableEve;
    if(sl)sl.destroy();
    const newSl=Sortable.create(el,{animation:150,handle:'.ri-drag',ghostClass:'sortable-ghost',onEnd:()=>saveBuilderOrder(sess,el)});
    if(sess==='morning')sortableMorn=newSl;else sortableEve=newSl;
  });
}

function saveBuilderOrder(sess,el){
  const ids=[...el.querySelectorAll('.ri')].map(el=>el.dataset.id);
  S.customRoutine[sess]=ids.map(id=>S.customRoutine[sess].find(x=>x.id===id)).filter(Boolean);
  save();
}

function togBuilderCheck(sess,idx,el){
  const k=todayISO();
  if(!S.routineChecks[k])S.routineChecks[k]={morning:[],evening:[]};
  const arr=S.routineChecks[k][sess]||[];
  arr[idx]=!arr[idx];S.routineChecks[k][sess]=arr;
  save();el.classList.toggle('done',arr[idx]);
  const row=el.closest('.ri');if(row){const nm=row.querySelector('.ri-name');if(nm){nm.style.textDecoration=arr[idx]?'line-through':'';nm.style.color=arr[idx]?'var(--txtM)':''}}
  renderBuilderAdh();
}

function renderBuilderAdh(){
  const el=document.getElementById('builderAdh');if(!el)return;
  let html='<div style="display:flex;justify-content:space-between;margin-bottom:6px;">';
  for(let i=6;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    const k=isoDate(d),chks=(S.routineChecks[k]||{});
    const tot=(S.customRoutine.morning||[]).length+(S.customRoutine.evening||[]).length;
    const done=[...(chks.morning||[]),...(chks.evening||[])].filter(Boolean).length;
    const pct=tot>0?done/tot:0;const isDone=pct>=1&&tot>0,isPart=pct>0&&!isDone,isToday=i===0;
    html+=`<div class="wkd-wrap"><div class="wkd${isDone?' done':isPart?' partial':''}${isToday?' today':''}">${isDone?'✓':done>0?done:''}</div><div class="wkd-lbl">${DAYS_S[d.getDay()]}</div></div>`;
  }
  el.innerHTML=html+'</div>';
}

function togCond(el,c){
  if(selConditions.includes(c)){selConditions=selConditions.filter(x=>x!==c);el.classList.remove('on');}
  else{selConditions.push(c);el.classList.add('on');}
}

function saveSkinLog(){
  const date=document.getElementById('skinLogDate').value;if(!date){showToast('Pilih tanggal!');return;}
  const entry={id:uid(),date,conditions:[...selConditions],score:parseInt(document.getElementById('skinScoreSlider').value)||7,notes:document.getElementById('skinLogNote').value};
  const idx=S.skinLogs.findIndex(l=>l.date===date);
  if(idx>=0)S.skinLogs[idx]={...S.skinLogs[idx],...entry};else S.skinLogs.push(entry);
  S.skinLogs.sort((a,b)=>a.date<b.date?-1:1);
  save();selConditions=[];document.querySelectorAll('#condGrid .cond-btn').forEach(b=>b.classList.remove('on'));document.getElementById('skinLogNote').value='';renderSkinLogList();showToast('✨ Log kulit tersimpan!');
}

function renderSkinLogList(){
  const el=document.getElementById('skinLogList');if(!el)return;
  const logs=S.skinLogs.slice().reverse().slice(0,20);
  if(!logs.length){el.innerHTML='<div style="text-align:center;padding:16px;color:var(--txtM);font-size:12px;">Belum ada log kondisi kulit</div>';return;}
  el.innerHTML=logs.map(l=>`<div class="skin-log-item"><div class="sli-date">${fmtShort(l.date)}</div><div class="sli-conds">${(l.conditions||[]).map(c=>`<span class="ptag" style="background:var(--mintL);color:#2D7A5A;">${c}</span>`).join('')}</div><div class="sli-score">${l.score}/10</div></div>`).join('');
}

function buildMoodGrids(){
  ['cycleMoodGrid','standaloneMoodGrid'].forEach(gid=>{
    const el=document.getElementById(gid);if(!el)return;
    el.innerHTML=MOODS.map(m=>`<div class="mbtn" data-mood="${m.id}" onclick="selectMood('${gid}','${m.id}')"><span class="mico">${m.e}</span><span class="mlbl">${m.l}</span></div>`).join('');
  });
}

function selectMood(gid,mid){
  document.querySelectorAll(`#${gid} .mbtn`).forEach(b=>b.classList.remove('on'));
  document.querySelector(`#${gid} [data-mood="${mid}"]`)?.classList.add('on');
  if(gid==='cycleMoodGrid')selCycleMood=mid;
  else selStandaloneMood=mid;
}

function selFlow(el,f){
  selFlowVal=f;document.querySelectorAll('#flowBtns .flow-btn').forEach(b=>{b.classList.remove('sel-light','sel-medium','sel-heavy');});
  el.classList.add('sel-'+f);
}

function togSymp(el,s){if(selSymptoms.includes(s)){selSymptoms=selSymptoms.filter(x=>x!==s);el.classList.remove('on');}else{selSymptoms.push(s);el.classList.add('on');}}

function selEv(type){cycleEventType=cycleEventType===type?'':type;['Start','End','Ongoing'].forEach(t=>{const b=document.getElementById('ev'+t);if(b){b.classList.remove('sel-light','sel-medium','sel-heavy');}});if(cycleEventType){const map={start:'sel-light',end:'sel-heavy',ongoing:'sel-medium'};const b=document.getElementById('ev'+cycleEventType.charAt(0).toUpperCase()+cycleEventType.slice(1));if(b)b.classList.add(map[cycleEventType]);}}

function saveCycEntry(){
  const date=document.getElementById('cycDate').value;if(!date){showToast('Pilih tanggal!');return;}
  const entry={id:uid(),date,ev:cycleEventType,flow:selFlowVal,symptoms:[...selSymptoms],mood:selCycleMood,moodInt:parseInt(document.getElementById('moodIntSl').value)||5,notes:document.getElementById('cycNotes').value};
  const idx=S.periodLogs.findIndex(l=>l.date===date);
  if(idx>=0)S.periodLogs[idx]={...S.periodLogs[idx],...entry,id:S.periodLogs[idx].id};else S.periodLogs.push(entry);
  S.periodLogs.sort((a,b)=>a.date<b.date?-1:1);
  S.xp=(S.xp||0)+5;showXP(5,'🩸 Entry tersimpan!');save();
  // Reset
  selFlowVal='';selSymptoms=[];selCycleMood='';cycleEventType='';
  document.querySelectorAll('#flowBtns .flow-btn').forEach(b=>b.classList.remove('sel-light','sel-medium','sel-heavy'));
  document.querySelectorAll('#sympChips .symp-chip').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('#cycleMoodGrid .mbtn').forEach(b=>b.classList.remove('on'));
  document.getElementById('cycNotes').value='';
  ['evStart','evEnd','evOngoing'].forEach(id=>{const b=document.getElementById(id);if(b)b.classList.remove('sel-light','sel-medium','sel-heavy');});
  renderRecentEntries();renderCalendar();renderPredGrid();refreshHomeCards();
}

function renderRecentEntries(){
  const el=document.getElementById('recentCycEntries');if(!el)return;
  const logs=S.periodLogs.slice().reverse().slice(0,12);
  if(!logs.length){el.innerHTML='<div style="text-align:center;padding:16px;color:var(--txtM);font-size:12px;">Belum ada entry. Catat hari pertama haidmu!</div>';return;}
  el.innerHTML=logs.map(l=>{
    const mood=MOODS.find(m=>m.id===l.mood);
    return`<div class="cy-entry">
      <div class="cy-date">${fmtShort(l.date)}</div>
      <div>
        <div class="cy-badges">
          ${l.ev==='start'?'<span class="cy-badge cb-period">🩸 Mulai</span>':''}
          ${l.ev==='end'?'<span class="cy-badge cb-end">✅ Selesai</span>':''}
          ${l.ev==='ongoing'?'<span class="cy-badge cb-period">📌 Lanjut</span>':''}
          ${l.flow?`<span class="cy-badge cb-flow">${l.flow}</span>`:''}
          ${(l.symptoms||[]).map(s=>`<span class="cy-badge cb-symp">${s}</span>`).join('')}
          ${mood?`<span class="cy-badge cb-mood">${mood.e} ${mood.l}</span>`:''}
        </div>
        ${l.notes?`<div class="cy-note">${l.notes}</div>`:''}
      </div>
    </div>`;
  }).join('');
}

function saveMoodLog(){
  const date=document.getElementById('moodLogDate').value;if(!date){showToast('Pilih tanggal!');return;}
  const entry={id:uid(),date,mood:selStandaloneMood,intensity:parseInt(document.getElementById('moodLogSl').value)||5,notes:document.getElementById('moodLogNote').value};
  const idx=S.moodLogs.findIndex(m=>m.date===date);
  if(idx>=0)S.moodLogs[idx]={...entry,id:S.moodLogs[idx].id};else S.moodLogs.push(entry);
  S.moodLogs.sort((a,b)=>a.date<b.date?-1:1);
  save();selStandaloneMood='';document.querySelectorAll('#standaloneMoodGrid .mbtn').forEach(b=>b.classList.remove('on'));document.getElementById('moodLogNote').value='';renderMoodHistList();showToast('😊 Mood tersimpan!');
}

function renderMoodHistList(){
  const el=document.getElementById('moodHistList');if(!el)return;
  const logs=S.moodLogs.slice().reverse().slice(0,15);
  if(!logs.length){el.innerHTML='<div style="text-align:center;padding:16px;color:var(--txtM);font-size:12px;">Belum ada log mood</div>';return;}
  el.innerHTML=logs.map(l=>{const mood=MOODS.find(m=>m.id===l.mood);return`<div class="cy-entry"><div class="cy-date">${fmtShort(l.date)}</div><div class="cy-badges">${mood?`<span class="cy-badge cb-mood">${mood.e} ${mood.l}</span>`:'<span class="cy-badge">—</span>'}<span class="cy-badge cb-symp">${l.intensity}/10</span></div>${l.notes?`<div class="cy-note">${l.notes}</div>`:''}</div>`;}).join('');
}

function getAvgCycLen(){const s=getPeriodStarts();if(s.length<2)return 28;const lens=[];for(let i=1;i<s.length;i++)lens.push(diffDays(s[i-1],s[i]));const rec=lens.slice(-6);return Math.round(rec.reduce((a,v)=>a+v,0)/rec.length);}

function getAvgPeriodLen(){const s=getPeriodStarts();const e=S.periodLogs.filter(l=>l.ev==='end').map(l=>l.date).sort();if(!s.length||!e.length)return 5;const lens=[];s.forEach(st=>{const en=e.find(ed=>ed>st&&diffDays(st,ed)<=10);if(en)lens.push(diffDays(st,en)+1);});return lens.length?Math.round(lens.reduce((a,v)=>a+v,0)/lens.length):5;}

function renderNotes(){
  const q=(document.getElementById('noteSearch')?.value||'').toLowerCase();
  const notes=S.notes.filter(n=>{
    const tagOk=noteTagFilter==='all'||(n.tags||[]).includes(noteTagFilter);
    const srchOk=!q||n.title.toLowerCase().includes(q)||stripHtml(n.content).toLowerCase().includes(q);
    return tagOk&&srchOk;
  }).sort((a,b)=>b.updated<a.updated?-1:1);
  // Tag filter bar
  const allTags=[...new Set(S.notes.flatMap(n=>n.tags||[]))];
  const tfb=document.getElementById('tagFilterBar');
  if(tfb)tfb.innerHTML=`<div class="tf-btn${noteTagFilter==='all'?' active':''}" onclick="setNoteTagF(this,'all')">Semua</div>`+allTags.map(t=>`<div class="tf-btn${noteTagFilter===t?' active':''}" onclick="setNoteTagF(this,'${t}')">${t}</div>`).join('');
  const el=document.getElementById('noteList');if(!el)return;
  if(!notes.length){el.innerHTML=`<div style="text-align:center;padding:32px 0;color:var(--txtM);"><div style="font-size:40px;margin-bottom:8px;">📓</div><div style="font-size:13px;font-weight:700;">${q?'Tidak ditemukan':'Belum ada catatan'}</div></div>`;return;}
  el.innerHTML=notes.map(n=>`
    <div class="note-card" onclick="openNoteEditor('${n.id}')">
      <div class="nc-ttl">${n.title||'Tanpa Judul'}</div>
      <div class="nc-preview">${stripHtml(n.content)||'Tidak ada isi'}</div>
      <div class="nc-tags">
        ${(n.tags||[]).map(t=>`<span class="ntag">${t}</span>`).join('')}
        ${n.linkCycle?'<span class="ntag ntag-cycle">🩸 Siklus</span>':''}
        ${n.linkSkin?'<span class="ntag ntag-skin">✨ Skincare</span>':''}
        ${n.linkMood?'<span class="ntag">😊 Mood</span>':''}
      </div>
      <div class="nc-meta">📅 ${fmtDate(n.updated||n.created)}</div>
    </div>`).join('');
}

function setNoteTagF(el,tag){noteTagFilter=tag;renderNotes();}

function openNoteEditor(id){
  editingNoteId=id;
  const n=id?S.notes.find(x=>x.id===id):null;
  document.getElementById('noteTitleInp').value=n?n.title:'';
  document.getElementById('noteBodyEl').innerHTML=n?n.content:'';
  document.getElementById('noteTagsInp').value=n?(n.tags||[]).join(', '):'';
  document.getElementById('lnkCycle').checked=n?n.linkCycle||false:false;
  document.getElementById('lnkSkin').checked=n?n.linkSkin||false:false;
  document.getElementById('lnkMood').checked=n?n.linkMood||false:false;
  document.getElementById('editNoteId').value=id||'';
  document.getElementById('delNoteBtn').style.display=id?'inline-block':'none';
  document.getElementById('noteListView').style.display='none';
  document.getElementById('noteEditorView').style.display='block';
  setTimeout(()=>document.getElementById('noteBodyEl').focus(),100);
}

function closeNoteEditor(){document.getElementById('noteListView').style.display='block';document.getElementById('noteEditorView').style.display='none';renderNotes();}

function saveNote(){
  const title=document.getElementById('noteTitleInp').value.trim()||'Tanpa Judul';
  const content=document.getElementById('noteBodyEl').innerHTML;
  const tags=document.getElementById('noteTagsInp').value.split(',').map(t=>t.trim()).filter(Boolean);
  const now=todayISO();
  if(editingNoteId){const i=S.notes.findIndex(n=>n.id===editingNoteId);if(i>=0){S.notes[i]={...S.notes[i],title,content,tags,linkCycle:document.getElementById('lnkCycle').checked,linkSkin:document.getElementById('lnkSkin').checked,linkMood:document.getElementById('lnkMood').checked,updated:now};}}
  else{S.notes.push({id:uid(),title,content,tags,linkCycle:document.getElementById('lnkCycle').checked,linkSkin:document.getElementById('lnkSkin').checked,linkMood:document.getElementById('lnkMood').checked,created:now,updated:now});}
  S.xp=(S.xp||0)+3;save();closeNoteEditor();refreshHomeCards();showToast('📓 Catatan tersimpan!');
}

function deleteNote(){if(!editingNoteId||!confirm('Hapus catatan ini?'))return;S.notes=S.notes.filter(n=>n.id!==editingNoteId);save();closeNoteEditor();refreshHomeCards();}

function setRange(el,days){anRange=days;document.querySelectorAll('.rng-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');renderAnalytics();}