
// ╔══════════════════════════════════════════════════╗
// ║  ORIGINAL DATA & CONSTANTS (unchanged)           ║
// ╚══════════════════════════════════════════════════╝
const DAYS = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const DAYS_S = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

const SC_SCHED = {
  1:{day:['Face Wash','Toner','Serum','Moisturizer','Sunscreen'],night:['Double Cleanse','Face Wash','Exfoliator','Toner','Serum Vit C','Moisturizer']},
  2:{day:['Face Wash','Toner','Serum','Moisturizer','Sunscreen'],night:['Double Cleanse','Face Wash','Serum Retinol','Moisturizer']},
  3:{day:['Face Wash','Toner','Serum','Moisturizer','Sunscreen'],night:['Double Cleanse','Face Wash','Exfoliator','Toner','Serum','Moisturizer']},
  4:{day:['Face Wash','Toner','Serum Vit C','Moisturizer','Sunscreen'],night:['Double Cleanse','Face Wash','Serum Retinol','Moisturizer']},
  5:{rest:true},
  6:{day:['Face Wash','Toner','Serum','Moisturizer','Sunscreen','Day Cream'],night:['Double Cleanse','Face Wash','Mask','Toner','Serum','Moisturizer']},
  0:{day:['Face Wash','Toner','Serum','Moisturizer','Sunscreen','Day Cream'],night:['Double Cleanse','Face Wash','Mask','Toner','Serum','Moisturizer']}
};

const EX = [
  {id:'leg_raise',name:'Leg Raise',tgt:'5 reps',ico:'🦵',max:5},
  {id:'squat',name:'Squat',tgt:'5 reps',ico:'🏋️‍♀️',max:5},
  {id:'calf_raise',name:'Standing Calf Raise',tgt:'5 reps',ico:'👟',max:5},
  {id:'bicycle',name:'Bicycle Kick',tgt:'5 reps',ico:'🚴‍♀️',max:5},
  {id:'side_leg',name:'Side-lying Leg Raises',tgt:'5 reps',ico:'🤸‍♀️',max:5},
  {id:'wall_sit',name:'Wall Sit',tgt:'15 detik',ico:'🧱',max:1}
];

const STUDY_CATS = [
  {id:'keprib',ico:'🧩',ttl:'Tes Kepribadian & Psikologi Kerja',topics:['16PF (Sixteen Personality Factors)','Big Five Personality (BFI)','DISC','EPPS (Edward Personal Preference Schedule)','Tes Kepribadian Kerja','Tes Motivasi Kerja','Tes Kecerdasan Emosional (EQ)','Tes Kreativitas','Tes Pengambilan Keputusan','Tes Minat & Arah Karier','Holland Code (RIASEC)']},
  {id:'intlg',ico:'🧠',ttl:'Tes Intelegensi & Kognitif Umum',topics:['Tes Intelegensia Umum (IQ)','CFIT (Culture Fair Intelligence Test)','SPM (Standard Progressive Matrices / Raven)','Tes Kognitif']},
  {id:'akad',ico:'📐',ttl:'Tes Akademik & Kemampuan Dasar (TPA/TIU)',topics:['TIU (Tes Intelegensi Umum)','Tes Numerik Dasar','Tes Verbal Dasar','Tes Logika Dasar']},
  {id:'verbal',ico:'💬',ttl:'Tes Verbal / Bahasa',topics:['Tes Sinonim','Tes Antonim','Tes Analogi Kata']},
  {id:'numerik',ico:'🔢',ttl:'Tes Numerik / Aritmatika',topics:['Tes Deret Angka','Tes Deret Huruf','Tes Logika Aritmatika','Tes Hitungan Cepat','Tes Cerita Angka','Tes Matematika Dasar']},
  {id:'logika',ico:'🔍',ttl:'Tes Logika & Penalaran',topics:['Tes Penalaran Logis','Tes Penalaran Analitis','Tes Penalaran Silogisme','Tes Logika Gambar','Tes Logika Abstrak']},
  {id:'figural',ico:'🔷',ttl:'Tes Figural / Spasial',topics:['Tes Kemampuan Spasial','Tes Jaring-Jaring Bangun Ruang','Tes Melipat Kubus','Tes Figural Reasoning']},
  {id:'kecepatan',ico:'⚡',ttl:'Tes Kecepatan, Ketelitian & Daya Tahan',topics:['Pauli Test','Kraepelin Test','WPT (Work Performance Test)','Tes Kecepatan dan Ketelitian']},
  {id:'manajerial',ico:'📊',ttl:'Tes Manajerial & Teknis',topics:['Tes Kemampuan Manajerial','Tes Kemampuan Teknis']}
];

const LV_TITLES = ['Pemula','Pemula+','Berkembang','Berkembang+','Mahir','Mahir+','Ahli','Ahli+','Master','Legend ✨'];

const MOODS = [
  {id:'happy',e:'😊',l:'Happy'},{id:'loved',e:'🥰',l:'Loved'},
  {id:'calm',e:'😌',l:'Calm'},{id:'excited',e:'😄',l:'Excited'},
  {id:'anxious',e:'😟',l:'Cemas'},{id:'sad',e:'😢',l:'Sedih'},
  {id:'angry',e:'😤',l:'Marah'},{id:'tired',e:'😴',l:'Lelah'},
  {id:'sensitive',e:'🥺',l:'Sensitif'},{id:'meh',e:'😐',l:'Biasa'},
];
const MOOD_SCORE = {happy:9,loved:10,calm:8,excited:9,anxious:4,sad:3,angry:2,tired:4,sensitive:5,meh:5};

const CAT_ICO = {cleanser:'🫧',toner:'💧',serum:'✨',moisturizer:'🧴',sunscreen:'☀️',treatment:'💊',mask:'🎭',other:'📦'};
const FREQ_LBL = {'daily-am':'Pagi','daily-pm':'Malam','daily-both':'AM&PM','weekly':'Mingguan','as-needed':'Fleksibel'};

// ╔══════════════════════════════════════════════════╗
// ║  STATE                                           ║
// ╚══════════════════════════════════════════════════╝
let S = {
  xp:0, skincare:{}, exercise:{}, belajar:{},
  // NEW
  periodLogs:[],   // {id,date,ev,flow,symptoms[],mood,moodInt,notes}
  moodLogs:[],     // {id,date,mood,intensity,notes}
  products:[],     // {id,name,brand,cat,freq,notes,photo}
  customRoutine:{morning:[],evening:[]}, // [{id,name,productId,wait}]
  routineChecks:{},// {dateKey:{morning:[bool],evening:[bool]}}
  skinLogs:[],     // {id,date,conditions[],score,notes}
  notes:[]         // {id,title,content,tags[],linkCycle,linkSkin,linkMood,created,updated}
};

let curDN = 'day';
let selDay = new Date().getDay();
const todayDOW = new Date().getDay();

// Transient UI state
let selFlowVal = '';
let selSymptoms = [];
let selCycleMood = '';
let selStandaloneMood = '';
let selConditions = [];
let curProdCat = 'all';
let noteTagFilter = 'all';
let anRange = 7;
let photoData = '';
let editingProdId = null;
let editingNoteId = null;
let calYear = new Date().getFullYear();
let calMonthIdx = new Date().getMonth();
let cycleEventType = '';
let sortableMorn = null, sortableEve = null;
let chartInstances = {};

// ╔══════════════════════════════════════════════════╗
// ║  STORAGE (IndexedDB Fix for 5MB Limit)           ║
// ╚══════════════════════════════════════════════════╝
const DB_NAME = 'CacuyDB';
const DB_STORE = 'state';

// Shared helpers moved from the legacy blob
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}

function fmtDate(ds){if(!ds)return'—';const d=new Date(ds+'T12:00');return d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});}

function fmtShort(ds){if(!ds)return'—';const d=new Date(ds+'T12:00');return d.toLocaleDateString('id-ID',{day:'numeric',month:'short'});}

function stripHtml(h){return(h||'').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').trim();}

function tid(cid,t){return cid+'_'+t.replace(/[^a-zA-Z0-9]/g,'_');}

function fmt(cmd,val){document.getElementById('noteBodyEl').focus();document.execCommand(cmd,false,val||null);}