// ╔══════════════════════════════════════════════════╗
// ║  STORAGE                                         ║
// ╚══════════════════════════════════════════════════╝
const DB_NAME = 'CacuyDB';
const DB_STORE = 'state';

function getDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(DB_STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function save() {
  try {
    const db = await getDB();
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(JSON.stringify(S), 'cacuy_v3');
    
    const t = document.getElementById('toast');
    t.textContent = 'Tersimpan ✓'; t.classList.add('show');
    clearTimeout(save._t); save._t = setTimeout(() => t.classList.remove('show'), 1800);
  } catch(e) { console.error("Save error:", e); }
}

async function load() {
  try {
    const db = await getDB();
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get('cacuy_v3');
    const raw = await new Promise(res => {
      req.onsuccess = () => res(req.result);
      req.onerror = () => res(null);
    });
    
    // Load from IndexedDB, or fallback to LocalStorage if migrating for the first time
    const dataStr = raw || localStorage.getItem('cacuy_v3') || localStorage.getItem('cacuy_v2');
    if (dataStr) {
      try { const d = JSON.parse(dataStr); S = { ...S, ...d }; } catch(e) {}
    }
  } catch(e) { console.error("Load error:", e); }

  // Migrate: ensure arrays/objects
  ['periodLogs','moodLogs','products','skinLogs','notes'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[];});
  if(!S.customRoutine||!Array.isArray(S.customRoutine.morning))S.customRoutine={morning:[],evening:[]};
  if(typeof S.routineChecks!=='object')S.routineChecks={};
}

function expCSV(type){
  let rows,filename;
  if(type==='cycle'||type==='all'){rows=[['Tanggal','Event','Flow','Gejala','Mood','Intensitas','Catatan']];S.periodLogs.forEach(l=>rows.push([l.date,l.ev||'',l.flow||'',(l.symptoms||[]).join(';'),l.mood||'',l.moodInt||'',l.notes||'']));dlCSV(rows,'cacuy_siklus.csv');}
  if(type==='mood'||type==='all'){rows=[['Tanggal','Mood','Intensitas','Catatan']];S.moodLogs.forEach(m=>rows.push([m.date,m.mood||'',m.intensity||'',m.notes||'']));dlCSV(rows,'cacuy_mood.csv');}
  if(type==='skin'){rows=[['Tanggal','Kondisi','Score','Catatan']];S.skinLogs.forEach(l=>rows.push([l.date,(l.conditions||[]).join(';'),l.score||'',l.notes||'']));dlCSV(rows,'cacuy_kulit.csv');}
  showToast('📥 CSV tersimpan!');
}

function dlCSV(rows,filename){const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);a.download=filename;a.click();}

function expAllJSON(){const data=JSON.stringify(S,null,2);const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(data);a.download='cacuy_backup.json';a.click();showToast('📦 Backup tersimpan!');}

function importAll(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=async e=>{try{const d=JSON.parse(e.target.result);S={...S,...d};await save();showToast('✅ Data berhasil diimpor!');location.reload();}catch{showToast('❌ File tidak valid!');}};r.readAsText(f);}

function expNotesTxt(){const txt=S.notes.map(n=>`# ${n.title}\n${fmtDate(n.updated||n.created)}\nTags: ${(n.tags||[]).join(', ')}\n\n${stripHtml(n.content)}\n\n---`).join('\n');const a=document.createElement('a');a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(txt);a.download='cacuy_jurnal.txt';a.click();showToast('📄 Catatan tersimpan!');}

function expNotesJSON(){expAllJSON();}

function importNotes(inp){importAll(inp);}