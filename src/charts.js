// ╔══════════════════════════════════════════════════╗
// ║  CHARTS                                          ║
// ╚══════════════════════════════════════════════════╝

function renderSkinGrafik(){
  document.getElementById('scTotProd').textContent=S.products.length;
  const scores=S.skinLogs.map(l=>l.score||0);
  document.getElementById('scAvgScore').textContent=scores.length?(Math.round(scores.reduce((a,v)=>a+v,0)/scores.length*10)/10)+'/10':'—';
  // Adherence
  const labs=[],adhs=[];
  for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=isoDate(d),chks=(S.routineChecks[k]||{});const tot=(S.customRoutine.morning||[]).length+(S.customRoutine.evening||[]).length;const done=[...(chks.morning||[]),...(chks.evening||[])].filter(Boolean).length;labs.push(i===0?'Hari ini':fmtShort(k));adhs.push(tot>0?Math.round(done/tot*100):0);}
  const nonZ=adhs.filter(v=>v>0);document.getElementById('scAvgAdh').textContent=nonZ.length?(Math.round(nonZ.reduce((a,v)=>a+v,0)/nonZ.length))+'%':'—';
  mkChart('scAdhCh','bar',labs,adhs,'Adherence %','rgba(168,222,200,0.85)');
  const sl=S.skinLogs.slice(-14);
  mkChart('skinScoreCh','line',sl.map(l=>fmtShort(l.date)),sl.map(l=>l.score),'Skin Score','rgba(255,181,200,0.7)',true);
}

function renderAnalytics(){
  const cutoff=addDays(todayISO(),-anRange);
  const pLogs=S.periodLogs.filter(l=>l.date>=cutoff);
  const mLogs=S.moodLogs.filter(l=>l.date>=cutoff).sort((a,b)=>a.date<b.date?-1:1);
  document.getElementById('anTotCyc').textContent=pLogs.length;
  document.getElementById('anTotMood').textContent=mLogs.length;
  document.getElementById('anTotNote').textContent=S.notes.filter(n=>(n.updated||n.created)>=cutoff).length;

  // Mood line
  destroyChart('anMoodLine');
  const ctx1=document.getElementById('anMoodLine')?.getContext('2d');
  if(ctx1)chartInstances.anMoodLine=new Chart(ctx1,{type:'line',data:{labels:mLogs.map(m=>fmtShort(m.date)),datasets:[{label:'Score',data:mLogs.map(m=>MOOD_SCORE[m.mood]||5),borderColor:'#FF8FAB',backgroundColor:'rgba(255,143,171,0.12)',fill:true,tension:0.4,pointRadius:3,pointBackgroundColor:'#FF8FAB'},{label:'Intensitas',data:mLogs.map(m=>m.intensity||5),borderColor:'#C5B4E3',borderDash:[4,4],fill:false,tension:0.3,pointRadius:3,pointBackgroundColor:'#C5B4E3'}]},options:chartOpts()});

  // Mood pie
  destroyChart('anMoodPie');
  const mCount={};mLogs.forEach(m=>{const md=MOODS.find(x=>x.id===m.mood);if(md)mCount[md.e+' '+md.l]=(mCount[md.e+' '+md.l]||0)+1;});
  const ctx2=document.getElementById('anMoodPie')?.getContext('2d');
  const pColors=['#FFB5C8','#C5B4E3','#A8DEC8','#FFD4B8','#FFF0A0','#FF8FAB','#EDE8FF','#DAFFF1','#FFECD2','#E8F4FD'];
  if(ctx2&&Object.keys(mCount).length){chartInstances.anMoodPie=new Chart(ctx2,{type:'doughnut',data:{labels:Object.keys(mCount),datasets:[{data:Object.values(mCount),backgroundColor:pColors,borderWidth:2,borderColor:'#fff',hoverOffset:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:'#7A5C7E',font:{size:10},boxWidth:12}}}}});}
  else if(ctx2)ctx2.canvas.parentElement.innerHTML='<div style="text-align:center;padding:30px;color:var(--txtM);font-size:12px;">Belum ada data mood</div>';

  // Symptom bar
  destroyChart('anSympBar');
  const sf={};pLogs.forEach(l=>(l.symptoms||[]).forEach(s=>{sf[s]=(sf[s]||0)+1;}));
  const ctx3=document.getElementById('anSympBar')?.getContext('2d');
  if(ctx3&&Object.keys(sf).length)chartInstances.anSympBar=new Chart(ctx3,{type:'bar',data:{labels:Object.keys(sf),datasets:[{data:Object.values(sf),backgroundColor:'rgba(255,143,171,0.85)',borderRadius:7,borderSkipped:false}]},options:chartOpts()});
  else if(ctx3)ctx3.canvas.parentElement.innerHTML='<div style="text-align:center;padding:20px;color:var(--txtM);font-size:12px;">Belum ada data gejala</div>';

  // Skincare adherence bar
  const labs=[],adhs=[];
  for(let i=anRange-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=isoDate(d);if(k<cutoff)continue;const chks=(S.routineChecks[k]||{});const tot=(S.customRoutine.morning||[]).length+(S.customRoutine.evening||[]).length;const done=[...(chks.morning||[]),...(chks.evening||[])].filter(Boolean).length;labs.push(i%Math.ceil(anRange/10)===0?fmtShort(k):'');adhs.push(tot>0?Math.round(done/tot*100):0);}
  destroyChart('anSCAdhBar');
  const ctx4=document.getElementById('anSCAdhBar')?.getContext('2d');
  if(ctx4)chartInstances.anSCAdhBar=new Chart(ctx4,{type:'bar',data:{labels:labs,datasets:[{label:'%',data:adhs,backgroundColor:'rgba(168,222,200,0.85)',borderRadius:5,borderSkipped:false}]},options:chartOpts()});

  // Skin score
  const sl=S.skinLogs.filter(l=>l.date>=cutoff);
  destroyChart('anSkinScore');
  const ctx5=document.getElementById('anSkinScore')?.getContext('2d');
  if(ctx5&&sl.length)chartInstances.anSkinScore=new Chart(ctx5,{type:'line',data:{labels:sl.map(l=>fmtShort(l.date)),datasets:[{label:'Score',data:sl.map(l=>l.score),borderColor:'#A8DEC8',backgroundColor:'rgba(168,222,200,0.15)',fill:true,tension:0.4,pointRadius:4,pointBackgroundColor:'#4DBF9A'}]},options:chartOpts()});
  else if(ctx5&&!sl.length)ctx5.canvas.parentElement.innerHTML='<div style="text-align:center;padding:20px;color:var(--txtM);font-size:12px;">Belum ada log kondisi kulit</div>';
}

function chartOpts(extra={}){
  return{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:extra.legend!==false,labels:{color:'#7A5C7E',font:{size:10},boxWidth:10}},tooltip:{backgroundColor:'rgba(255,245,248,.97)',titleColor:'#4A2D4E',bodyColor:'#7A5C7E',borderColor:'#F0D5E5',borderWidth:1,cornerRadius:10,padding:10}},scales:{x:{grid:{color:'rgba(240,213,229,.4)'},ticks:{color:'#B09AB4',font:{size:9},maxRotation:0},border:{display:false}},y:{grid:{color:'rgba(240,213,229,.3)'},ticks:{color:'#B09AB4',font:{size:9}},border:{display:false}}}};
}

function mkChart(id,type,labels,data,label,color,fill=false){
  destroyChart(id);const ctx=document.getElementById(id)?.getContext('2d');if(!ctx)return;
  chartInstances[id]=new Chart(ctx,{type,data:{labels,datasets:[{label,data,backgroundColor:color,borderColor:type==='line'?color.replace('0.8','1').replace('0.85','1'):'transparent',fill,tension:0.4,pointRadius:type==='line'?4:0,pointBackgroundColor:color,borderRadius:type==='bar'?7:0,borderSkipped:false}]},options:chartOpts({legend:false})});
}

function destroyChart(id){if(chartInstances[id]){chartInstances[id].destroy();delete chartInstances[id];}}

function expChart(canvasId,filename){const c=document.getElementById(canvasId);if(!c)return;const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download=`cacuy_${filename}.png`;a.click();showToast('📥 Chart tersimpan!');}