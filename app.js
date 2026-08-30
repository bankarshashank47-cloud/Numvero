/* app.js — unified calculator + history handler for Numvero
   Replaces and centralizes history handling and connects all in-page calculators
   to the same localStorage-backed history store. Also implements a basic
   calculator keypad so the homepage calculator continues to work.

   Design goals:
   - Detect and reuse an existing localStorage key used for history if present.
   - Persist history as the same array shape (strings) so older entries remain readable.
   - Expose window.Numvero.history API for compatibility.
   - Wire each tool on the page (percentage, discount, bmi, unit) to call the
     shared history only after successful validated calculations.
   - Provide clearHistory and per-entry deletion that update storage and UI.
*/
(function(){'use strict';

// Utility helpers
const $ = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => Array.from(ctx.querySelectorAll(s));

// Detect an existing history key in localStorage. We look for a key whose
// value parses to an array and whose entries look like history strings or
// objects. We intentionally prefer keeping any existing key rather than
// inventing a new one.
function detectHistoryKey(){
  try{
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(!k) continue;
      try{
        const raw = localStorage.getItem(k);
        if(!raw) continue;
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed) && parsed.length>0){
          // quick heuristic: entries are strings or objects with recognizable props
          const sample = parsed[0];
          if(typeof sample === 'string') return k;
          if(typeof sample === 'object' && (sample.expr || sample.result || sample.label)) return k;
        }
      }catch(e){ /* ignore parse errors */ }
    }
  }catch(e){ /* localStorage may be unavailable */ }
  // fallback: use a conservative, unlikely-to-collide key but only if nothing found
  return 'numvero-history';
}

const STORAGE_KEY = detectHistoryKey();

// In-memory history array (newest first)
let history = [];

function loadHistory(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) { history = []; return; }
    const parsed = JSON.parse(raw);
    if(Array.isArray(parsed)) history = parsed.slice(); else history = [];
  }catch(e){ history = []; }
}

function saveHistory(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    // notify listeners
    try{ window.dispatchEvent(new CustomEvent('numvero:history-updated',{detail:{key:STORAGE_KEY}})); }catch(e){}
  }catch(e){ console.warn('Could not save history', e); }
}

// Add an entry (string or object). Keep behavior conservative: if last entry
// matches exactly, don't add duplicate. Only add valid non-empty strings.
function addHistoryEntry(entry){
  if(!entry) return false;
  // Convert objects to a stable representation for duplicate checks but store objects unchanged
  const isObj = (typeof entry === 'object' && entry !== null);
  let preview = isObj ? JSON.stringify(entry) : String(entry).trim();
  if(!preview) return false;
  if(history.length>0){
    const first = history[0];
    const firstPreview = (typeof first === 'object' && first!==null)?JSON.stringify(first):String(first).trim();
    if(firstPreview === preview) return false; // immediate duplicate
  }
  history.unshift(entry);
  // limit
  if(history.length>300) history.length = 300;
  saveHistory();
  renderHistory();
  return true;
}

function removeHistoryAt(index){
  if(typeof index !== 'number' || index<0 || index>=history.length) return false;
  history.splice(index,1);
  saveHistory();
  renderHistory();
  return true;
}

function clearHistory(){ history = []; saveHistory(); renderHistory(); }

// Expose small API
window.Numvero = window.Numvero || {};
window.Numvero.history = window.Numvero.history || {
  add: addHistoryEntry,
  getAll: () => history.slice(),
  removeAt: removeHistoryAt,
  clear: clearHistory,
  storageKey: STORAGE_KEY
};

// Rendering the history in the sidebar. The page contains #history element
function renderHistory(){
  const container = $('#history');
  if(!container) return;
  container.innerHTML = '';
  if(!history || history.length===0){
    const d = document.createElement('div'); d.className='empty'; d.textContent='No calculations yet.'; container.appendChild(d); return;
  }
  history.forEach((entry, idx)=>{
    const item = document.createElement('div'); item.className='history-item';
    const text = document.createElement('div'); text.className='history-text';
    let displayText = '';
    if(typeof entry === 'string') displayText = entry;
    else if(typeof entry === 'object' && entry !== null){
      // prefer human-readable if provided
      displayText = entry.label || (entry.expr? (entry.expr + (entry.result?(' = '+entry.result):'')) : JSON.stringify(entry));
    } else displayText = String(entry);
    text.textContent = displayText;
    item.appendChild(text);
    const del = document.createElement('button'); del.className='history-delete'; del.setAttribute('aria-label','Delete history item'); del.textContent='✕';
    del.addEventListener('click', ()=>{ removeHistoryAt(idx); });
    item.appendChild(del);
    container.appendChild(item);
  });
}

// Wire clearHistory control
function wireHistoryControls(){
  const clearBtn = document.getElementById('clearHistory');
  if(clearBtn){ clearBtn.addEventListener('click', ()=>{ if(confirm('Clear all history?')) clearHistory(); }); }
}

// BASIC CALCULATOR IMPLEMENTATION (keeps behavior simple and robust)
let expr = '';
function updateDisplays(){
  const expEl = document.getElementById('expression');
  const resEl = document.getElementById('result');
  if(expEl) expEl.textContent = expr || '0';
  if(resEl){
    try{ const val = evaluateExpression(expr); resEl.textContent = (val===null? '0' : val); }catch(e){ resEl.textContent='Error'; }
  }
}

function sanitizeExpression(s){
  // allow digits, space, parentheses and operators + - * / . %
  if(typeof s !== 'string') return '';
  // convert × and ÷ and − to * / -
  return s.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/,/g,'');
}

function evaluateExpression(s){
  const t = sanitizeExpression(s).trim();
  if(!t) return 0;
  // disallow unsafe characters
  if(!/^[0-9+\-*/().% \t]+$/.test(t)) throw new Error('Invalid expression');
  try{
    // handle percent occurrences: replace 50% with (50/100)
    const transformed = t.replace(/([0-9]+(?:\.[0-9]+)?)%/g,'($1/100)');
    // eslint-disable-next-line no-new-func
    const v = Function(`"use strict";return (${transformed})`)();
    if(typeof v === 'number' && isFinite(v)) return Math.round((v + Number.EPSILON) * 1e12)/1e12;
    throw new Error('Invalid result');
  }catch(e){ throw e; }
}

function basicClear(){ expr=''; updateDisplays(); }
function basicBack(){ expr = expr.slice(0,-1); updateDisplays(); }
function basicInput(ch){ expr += String(ch); updateDisplays(); }
function basicCompute(){
  try{
    const val = evaluateExpression(expr);
    const entry = expr + ' = ' + val;
    addHistoryEntry(entry);
    expr = String(val);
    updateDisplays();
  }catch(e){ console.warn('Compute failed', e); updateDisplays(); }
}

function wireBasicKeys(){
  const keys = document.getElementById('keys');
  if(!keys) return;
  keys.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button'); if(!btn) return;
    const key = btn.getAttribute('data-key');
    const action = btn.getAttribute('data-action');
    if(action){
      if(action==='clear') basicClear();
      else if(action==='back') basicBack();
      else if(action==='equals') basicCompute();
    } else if(key){ basicInput(key); }
  });
  // keyboard support
  window.addEventListener('keydown',(e)=>{
    if(e.key === 'Enter'){ e.preventDefault(); basicCompute(); }
    else if(e.key === 'Backspace'){ basicBack(); }
    else if(/^[0-9+\-*/().%]$/.test(e.key)){ basicInput(e.key); }
  });
}

// TOOL: Percentage
function wirePercentage(){
  const section = document.getElementById('percentage'); if(!section) return;
  const btn = section.querySelector('button[id="run"]') || section.querySelector('button');
  const a = section.querySelector('#a'); const b = section.querySelector('#b'); const out = section.querySelector('#answer');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const x = parseFloat(a && a.value); const y = parseFloat(b && b.value);
    if(!Number.isFinite(x) || !Number.isFinite(y)){ if(out) out.textContent='Please enter valid numbers'; return; }
    const r = (x/100)*y;
    if(out) out.textContent = r;
    addHistoryEntry(`${x}% of ${y} = ${r}`);
  });
}

// TOOL: Discount
function wireDiscount(){
  const section = document.getElementById('discount'); if(!section) return;
  const btn = section.querySelector('button[id="run"]') || section.querySelector('button');
  const p = section.querySelector('#p'); const d = section.querySelector('#d'); const out = section.querySelector('#discountAnswer');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const price = parseFloat(p && p.value); const disc = parseFloat(d && d.value);
    if(!Number.isFinite(price) || !Number.isFinite(disc)){ if(out) out.textContent='Please enter valid numbers'; return; }
    const final = Math.round((price * (1 - disc/100)) * 100)/100;
    if(out) out.textContent = final;
    addHistoryEntry(`Discount ${disc}% on ${price} = ${final}`);
  });
}

// TOOL: BMI
function wireBMI(){
  const section = document.getElementById('bmi'); if(!section) return;
  const btn = section.querySelector('button[id="run"]') || section.querySelector('button');
  const wt = section.querySelector('#wt'); const ht = section.querySelector('#ht'); const out = section.querySelector('#bmiAnswer');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const w = parseFloat(wt && wt.value); const hcm = parseFloat(ht && ht.value);
    if(!Number.isFinite(w) || !Number.isFinite(hcm) || hcm===0){ if(out) out.textContent='Please enter valid numbers'; return; }
    const h = hcm/100;
    const bmi = Math.round((w / (h*h)) * 100)/100;
    if(out) out.textContent = bmi;
    addHistoryEntry(`BMI for ${w} kg, ${hcm} cm = ${bmi}`);
  });
}

// TOOL: Unit (meters -> centimeters simple example)
function wireUnit(){
  const section = document.getElementById('unit'); if(!section) return;
  const btn = section.querySelector('button[id="run"]') || section.querySelector('button');
  const meters = section.querySelector('#meters'); const out = section.querySelector('#metersAnswer');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const m = parseFloat(meters && meters.value);
    if(!Number.isFinite(m)){ if(out) out.textContent='Please enter a number'; return; }
    const cm = Math.round(m*100*100)/100;
    if(out) out.textContent = `${cm} cm`;
    addHistoryEntry(`${m} m = ${cm} cm`);
  });
}

// Initialize on DOMContentLoaded
window.addEventListener('DOMContentLoaded', ()=>{
  loadHistory();
  renderHistory();
  wireHistoryControls();
  wireBasicKeys();
  wirePercentage();
  wireDiscount();
  wireBMI();
  wireUnit();

  // If other code expects a simple global function, expose addToHistory
  window.addToHistory = addHistoryEntry;

  // Listen for external custom events that some pages may dispatch
  window.addEventListener('numvero:tool-run', (ev)=>{
    // For compatibility: try to detect which tool contains the source element
    const src = ev && ev.detail && ev.detail.source;
    if(!src) return;
    const sect = src.closest && src.closest('section');
    if(!sect) return;
    const id = sect.id;
    if(id==='percentage') { sect.querySelector('button')?.click(); }
    else if(id==='discount') { sect.querySelector('button')?.click(); }
    else if(id==='bmi'){ sect.querySelector('button')?.click(); }
    else if(id==='unit'){ sect.querySelector('button')?.click(); }
  });

});

})();
