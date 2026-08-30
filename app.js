/* app.js — Numvero unified calculator + history system
   Centralized history handling and calculator initialization for all tools.
   
   Architecture:
   - Single localStorage-backed history store
   - Unique IDs for each calculator's inputs/outputs
   - Unified calculator wiring pattern using data-calculator attribute
   - Shared duplicate prevention and persistence
*/
(function(){'use strict';

// ============================================================================
// HISTORY SYSTEM
// ============================================================================

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
          const sample = parsed[0];
          if(typeof sample === 'string') return k;
          if(typeof sample === 'object' && (sample.expr || sample.result || sample.label)) return k;
        }
      }catch(e){ /* ignore */ }
    }
  }catch(e){ /* localStorage may be unavailable */ }
  return 'numvero-history';
}

const STORAGE_KEY = detectHistoryKey();
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
    try{ window.dispatchEvent(new CustomEvent('numvero:history-updated',{detail:{key:STORAGE_KEY}})); }catch(e){}
  }catch(e){ console.warn('Could not save history', e); }
}

function addHistoryEntry(entry){
  if(!entry) return false;
  const isObj = (typeof entry === 'object' && entry !== null);
  let preview = isObj ? JSON.stringify(entry) : String(entry).trim();
  if(!preview) return false;
  if(history.length>0){
    const first = history[0];
    const firstPreview = (typeof first === 'object' && first!==null)?JSON.stringify(first):String(first).trim();
    if(firstPreview === preview) return false;
  }
  history.unshift(entry);
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

// Expose API
window.Numvero = window.Numvero || {};
window.Numvero.history = window.Numvero.history || {
  add: addHistoryEntry,
  getAll: () => history.slice(),
  removeAt: removeHistoryAt,
  clear: clearHistory,
  storageKey: STORAGE_KEY
};

function renderHistory(){
  const container = document.getElementById('history');
  if(!container) return;
  container.innerHTML = '';
  if(!history || history.length===0){
    const d = document.createElement('div'); 
    d.className='empty'; 
    d.textContent='No calculations yet.'; 
    container.appendChild(d); 
    return;
  }
  history.forEach((entry, idx)=>{
    const item = document.createElement('div'); 
    item.className='history-item';
    const text = document.createElement('div'); 
    text.className='history-text';
    let displayText = '';
    if(typeof entry === 'string') displayText = entry;
    else if(typeof entry === 'object' && entry !== null){
      displayText = entry.label || (entry.expr? (entry.expr + (entry.result?(' = '+entry.result):'')) : JSON.stringify(entry));
    } else displayText = String(entry);
    text.textContent = displayText;
    item.appendChild(text);
    const del = document.createElement('button'); 
    del.className='history-delete'; 
    del.setAttribute('aria-label','Delete history item'); 
    del.textContent='✕';
    del.addEventListener('click', ()=>{ removeHistoryAt(idx); });
    item.appendChild(del);
    container.appendChild(item);
  });
}

function wireHistoryControls(){
  const clearBtn = document.getElementById('clearHistory');
  if(clearBtn){ 
    clearBtn.addEventListener('click', ()=>{ 
      if(confirm('Clear all history?')) clearHistory(); 
    }); 
  }
}

// ============================================================================
// BASIC CALCULATOR
// ============================================================================

let basicExpr = '';

function updateBasicDisplay(){
  const expEl = document.getElementById('basic-expression');
  const resEl = document.getElementById('basic-result');
  if(expEl) expEl.textContent = basicExpr || '0';
  if(resEl){
    try{ 
      const val = evaluateExpression(basicExpr); 
      resEl.textContent = (val===null? '0' : val); 
    }catch(e){ 
      resEl.textContent='Error'; 
    }
  }
}

function sanitizeExpression(s){
  if(typeof s !== 'string') return '';
  return s.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/,/g,'');
}

function evaluateExpression(s){
  const t = sanitizeExpression(s).trim();
  if(!t) return 0;
  if(!/^[0-9+\-*/().% \t]+$/.test(t)) throw new Error('Invalid expression');
  try{
    const transformed = t.replace(/([0-9]+(?:\.[0-9]+)?)%/g,'($1/100)');
    // eslint-disable-next-line no-new-func
    const v = Function(`"use strict";return (${transformed})`)();
    if(typeof v === 'number' && isFinite(v)) return Math.round((v + Number.EPSILON) * 1e12)/1e12;
    throw new Error('Invalid result');
  }catch(e){ throw e; }
}

function basicClear(){ basicExpr=''; updateBasicDisplay(); }
function basicBack(){ basicExpr = basicExpr.slice(0,-1); updateBasicDisplay(); }
function basicInput(ch){ basicExpr += String(ch); updateBasicDisplay(); }
function basicCompute(){
  try{
    const val = evaluateExpression(basicExpr);
    const entry = basicExpr + ' = ' + val;
    addHistoryEntry(entry);
    basicExpr = String(val);
    updateBasicDisplay();
  }catch(e){ console.warn('Compute failed', e); updateBasicDisplay(); }
}

function wireBasicCalculator(){
  const keys = document.getElementById('basic-keys');
  if(!keys) return;
  keys.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button'); 
    if(!btn) return;
    const key = btn.getAttribute('data-key');
    const action = btn.getAttribute('data-action');
    if(action){
      if(action==='clear') basicClear();
      else if(action==='back') basicBack();
      else if(action==='equals') basicCompute();
    } else if(key){ basicInput(key); }
  });
  window.addEventListener('keydown',(e)=>{
    if(e.key === 'Enter'){ e.preventDefault(); basicCompute(); }
    else if(e.key === 'Backspace'){ basicBack(); }
    else if(/^[0-9+\-*/().%]$/.test(e.key)){ basicInput(e.key); }
  });
}

// ============================================================================
// UNIFIED CALCULATOR WIRING
// ============================================================================

function wireCalculator(type, config){
  const button = document.querySelector(`button[data-calculator="${type}"]`);
  if(!button) return;
  
  button.addEventListener('click', ()=>{
    const inputs = {};
    const values = {};
    
    for(const key in config.inputIds){
      const id = config.inputIds[key];
      const elem = document.getElementById(id);
      if(!elem) continue;
      inputs[key] = elem;
      values[key] = parseFloat(elem.value);
    }
    
    // Validate all inputs are numbers
    const allValid = Object.values(values).every(v => Number.isFinite(v));
    const outputElem = document.getElementById(config.outputId);
    
    if(!allValid){
      if(outputElem) outputElem.textContent = config.errorMsg || 'Please enter valid numbers';
      return;
    }
    
    try{
      const result = config.calculate(values);
      if(!Number.isFinite(result)){
        if(outputElem) outputElem.textContent = 'Invalid calculation';
        return;
      }
      if(outputElem) outputElem.textContent = result;
      const historyEntry = config.format(values, result);
      addHistoryEntry(historyEntry);
    }catch(e){
      console.warn(`${type} calculation failed`, e);
      if(outputElem) outputElem.textContent = 'Error';
    }
  });
}

// Percentage Calculator
function wirePercentage(){
  wireCalculator('percentage', {
    inputIds: { percent: 'percentage-percent', of: 'percentage-of' },
    outputId: 'percentage-answer',
    errorMsg: 'Please enter valid numbers',
    calculate: (values) => {
      const result = (values.percent / 100) * values.of;
      return Math.round(result * 100) / 100;
    },
    format: (values, result) => `${values.percent}% of ${values.of} = ${result}`
  });
}

// Discount Calculator
function wireDiscount(){
  wireCalculator('discount', {
    inputIds: { price: 'discount-price', percent: 'discount-percent' },
    outputId: 'discount-answer',
    errorMsg: 'Please enter valid numbers',
    calculate: (values) => {
      const final = values.price * (1 - values.percent / 100);
      return Math.round(final * 100) / 100;
    },
    format: (values, result) => `Discount ${values.percent}% on ${values.price} = ${result}`
  });
}

// BMI Calculator
function wireBMI(){
  wireCalculator('bmi', {
    inputIds: { weight: 'bmi-weight', height: 'bmi-height' },
    outputId: 'bmi-answer',
    errorMsg: 'Please enter valid numbers',
    calculate: (values) => {
      if(values.height === 0) throw new Error('Height cannot be zero');
      const heightMeters = values.height / 100;
      const bmi = values.weight / (heightMeters * heightMeters);
      return Math.round(bmi * 100) / 100;
    },
    format: (values, result) => `BMI for ${values.weight} kg, ${values.height} cm = ${result}`
  });
}

// Unit Converter
function wireUnit(){
  wireCalculator('unit', {
    inputIds: { meters: 'unit-meters' },
    outputId: 'unit-answer',
    errorMsg: 'Please enter a valid number',
    calculate: (values) => {
      const cm = values.meters * 100;
      return Math.round(cm * 100) / 100;
    },
    format: (values, result) => `${values.meters} m = ${result} cm`
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

window.addEventListener('DOMContentLoaded', ()=>{
  loadHistory();
  renderHistory();
  wireHistoryControls();
  wireBasicCalculator();
  wirePercentage();
  wireDiscount();
  wireBMI();
  wireUnit();
  
  // Expose global for compatibility
  window.addToHistory = addHistoryEntry;
});

})();
