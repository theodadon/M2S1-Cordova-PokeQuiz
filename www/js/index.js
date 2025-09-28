// util
const $ = s => document.querySelector(s);
const show = id => document.querySelectorAll('.screen').forEach(x => x.id===id ? x.classList.add('active') : x.classList.remove('active'));
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const strip = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s'’.-]/g,'');

// stockage via cordova-plugin-file, fallback localStorage
const Storage = {
  fileName: 'scores.json',
  useFile: false,
  async init() {
    if (window.cordova && window.resolveLocalFileSystemURL && window.cordova.file?.dataDirectory) {
      try {
        const base = cordova.file.dataDirectory;
        await new Promise((res, rej)=>resolveLocalFileSystemURL(base, res, rej));
        await new Promise((res, rej)=>resolveLocalFileSystemURL(base + this.fileName, fe=>{
          this.useFile = true; res();
        }, _=>{
          resolveLocalFileSystemURL(base, dir=>{
            dir.getFile(this.fileName, {create:true}, _=>{ this.useFile = true; res(); }, rej);
          }, rej);
        }));
      } catch { this.useFile = false; }
    }
  },
  async readAll() {
    if (!this.useFile) {
      const raw = localStorage.getItem('scores'); return raw ? JSON.parse(raw) : [];
    }
    return new Promise(resolve=>{
      resolveLocalFileSystemURL(cordova.file.dataDirectory + this.fileName, fe=>{
        fe.file(file=>{
          const r = new FileReader();
          r.onloadend = ()=>{ try { resolve(r.result ? JSON.parse(r.result) : []); } catch { resolve([]); } };
          r.readAsText(file);
        }, _=>resolve([]));
      }, _=>resolve([]));
    });
  },
  async writeAll(arr) {
    if (!this.useFile) { localStorage.setItem('scores', JSON.stringify(arr)); return; }
    await new Promise((resolve,reject)=>{
      resolveLocalFileSystemURL(cordova.file.dataDirectory + this.fileName, fe=>{
        fe.createWriter(w=>{
          const blob = new Blob([JSON.stringify(arr)], {type:'application/json'});
          w.onwriteend = ()=>{ w.onwriteend = ()=>resolve(); w.write(blob); };
          w.onerror = reject;
          w.truncate(0);
        }, reject);
      }, reject);
    });
  },
  async save(e) { const all = await this.readAll(); all.push(e); await this.writeAll(all); },
  async top5() {
    const a = await this.readAll();
    a.sort((x,y)=> (y.score - x.score) || (x.timeSec - y.timeSec) || (new Date(y.date)-new Date(x.date)));
    return a.slice(0,5);
  },
  async reset(){ await this.writeAll([]); }
};

// quiz
const API_BASE = 'https://tyradex.vercel.app/api/v1/pokemon';
const TOTAL = 10;
let used, qIndex, score, t0, current;

function randomId() {
  if (used.size >= 1025) used.clear();
  let id; do { id = Math.floor(Math.random()*1025)+1; } while (used.has(id));
  used.add(id); return id;
}
async function fetchPokemon(id) {
  const r = await fetch(`${API_BASE}/${id}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
function updateHUD(){
  $('#hud-q').textContent = `Q: ${qIndex}/${TOTAL}`;
  $('#hud-score').textContent = `Score: ${score}`;
  $('#hud-time').textContent = `Temps: ${Math.floor((Date.now()-t0)/1000)}s`;
}
async function nextQuestion(){
  if (qIndex >= TOTAL) return finish();
  $('#feedback').textContent = '';
  $('#btn-next').disabled = true;
  $('#answer-input').value = '';
  $('#answer-input').focus();
  const id = randomId();
  try{
    const data = await fetchPokemon(id);
    const img = data?.sprites?.regular || data?.sprites?.shiny || data?.sprites || data?.image;
    const nameFr = data?.name?.fr || data?.name || '';
    const nameEn = data?.name?.en || '';
    if (!img || (!nameFr && !nameEn)) throw new Error('bad data');
    current = { id, image: img, answerFr: nameFr, answerEn: nameEn };
    $('#poke-img').src = current.image;
    qIndex++; updateHUD();
  } catch {
    $('#feedback').textContent = 'Erreur réseau. Appuie sur Suivant.';
    $('#btn-next').disabled = false;
  }
}
function checkAnswer(v){
  const a = strip(v);
  return a && (a === strip(current.answerFr||'') || a === strip(current.answerEn||''));
}
async function startQuiz(){
  used = new Set(); qIndex = 0; score = 0; current = null; t0 = Date.now();
  show('screen-quiz'); updateHUD(); await nextQuestion();
  (function tick(){
    if ($('#screen-quiz').classList.contains('active')){
      $('#hud-time').textContent = `Temps: ${Math.floor((Date.now()-t0)/1000)}s`;
      setTimeout(tick,1000);
    }
  })();
}
async function finish(){
  const timeSec = Math.floor((Date.now()-t0)/1000);
  $('#final-stats').textContent = `Score: ${score}/${TOTAL} • Temps: ${timeSec}s`;
  show('screen-finish');
}
async function saveResult(name){
  const entry = { name, score, timeSec: Math.floor((Date.now()-t0)/1000), date: new Date().toISOString() };
  await Storage.save(entry);
}
async function renderLeaderboard(){
  const rows = await Storage.top5();
  const tb = $('#scores-table tbody'); tb.innerHTML = '';
  rows.forEach((r,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${r.name}</td><td>${r.score}</td><td>${r.timeSec}s</td><td>${new Date(r.date).toLocaleString()}</td>`;
    tb.appendChild(tr);
  });
}

// events
function bind(){
  $('#btn-play').onclick = startQuiz;
  $('#btn-leaderboard').onclick = async()=>{ await renderLeaderboard(); show('screen-leaderboard'); };
  $('#btn-quit').onclick = ()=> show('screen-home');
  $('#answer-form').addEventListener('submit', async e=>{
    e.preventDefault();
    if (!current) return;
    const val = $('#answer-input').value.trim();
    if (!val) return;
    if (checkAnswer(val)) { score++; $('#feedback').textContent = `Correct : ${current.answerFr || current.answerEn}`; }
    else { $('#feedback').textContent = `Raté : ${current.answerFr || current.answerEn}`; }
    $('#btn-next').disabled = false; updateHUD();
  });
  $('#btn-next').onclick = nextQuestion;
  $('#save-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const name = $('#player-name').value.trim(); if (!name) return;
    await saveResult(name); await renderLeaderboard(); show('screen-leaderboard');
  });
  $('#finish-home').onclick = ()=> show('screen-home');
  $('#lb-home').onclick = ()=> show('screen-home');
  $('#lb-reset').onclick = async()=>{ await Storage.reset(); await renderLeaderboard(); };
}

// bootstrap
async function onReady(){ await Storage.init(); bind(); show('screen-home'); }
document.addEventListener('deviceready', onReady, false);
if (!window.cordova) window.addEventListener('load', onReady);
