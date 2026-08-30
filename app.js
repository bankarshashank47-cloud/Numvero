/* Numvero — shared calculator + history system */
(function(){
  'use strict';

  const STORAGE_KEY = 'numvero-history';
  const MAX_HISTORY = 300;
  let history = [];

  function loadHistory(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        history = Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
        return;
      }
      // One-time migration from an older Numvero history key, if one exists.
      for(let i=0;i<localStorage.length;i++){
        const key = localStorage.key(i);
        if(!key || key === STORAGE_KEY) continue;
        try{
          const parsed = JSON.parse(localStorage.getItem(key));
          if(Array.isArray(parsed) && parsed.length && parsed.some(v => typeof v === 'string' || (v && typeof v === 'object'))){
            history = parsed.slice(0, MAX_HISTORY);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            break;
          }
        }catch(e){ /* ignore unrelated localStorage entries */ }
      }
    }catch(e){ history = []; }
  }

  function saveHistory(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      window.dispatchEvent(new CustomEvent('numvero:history-updated'));
    }catch(e){ console.warn('Numvero: unable to save history.', e); }
  }

  function entryText(entry){
    if(typeof entry === 'string') return entry;
    if(entry && typeof entry === 'object'){
      return entry.label || (entry.expr ? entry.expr + (entry.result !== undefined ? ' = ' + entry.result : '') : JSON.stringify(entry));
    }
    return String(entry ?? '');
  }

  function addHistoryEntry(entry){
    if(entry === null || entry === undefined) return false;
    const preview = entryText(entry).trim();
    if(!preview) return false;
    if(history.length && entryText(history[0]).trim() === preview) return false;
    history.unshift(entry);
    if(history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    saveHistory();
    renderHistory();
    return true;
  }

  function removeHistoryAt(index){
    if(!Number.isInteger(index) || index < 0 || index >= history.length) return false;
    history.splice(index, 1);
    saveHistory();
    renderHistory();
    return true;
  }

  function clearHistory(){
    history = [];
    saveHistory();
    renderHistory();
  }

  function renderHistory(){
    const container = document.getElementById('history');
    if(!container) return;
    container.replaceChildren();
    if(!history.length){
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'No calculations yet.';
      container.appendChild(empty);
      return;
    }
    history.forEach((entry, index)=>{
      const item = document.createElement('div');
      item.className = 'history-item';

      const text = document.createElement('div');
      text.className = 'history-text';
      text.title = entryText(entry);
      text.textContent = entryText(entry);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'history-delete';
      del.setAttribute('aria-label', 'Delete history item');
      del.title = 'Delete this calculation';
      del.textContent = '✕';
      del.addEventListener('click', ()=>removeHistoryAt(index));

      item.append(text, del);
      container.appendChild(item);
    });
  }

  function wireHistoryControls(){
    const clearBtn = document.getElementById('clearHistory');
    if(clearBtn && !clearBtn.dataset.historyWired){
      clearBtn.dataset.historyWired = 'true';
      clearBtn.addEventListener('click', ()=>{
        if(history.length && window.confirm('Clear all calculation history?')) clearHistory();
      });
    }
  }

  window.Numvero = window.Numvero || {};
  window.Numvero.history = {
    add: addHistoryEntry,
    getAll: ()=>history.slice(),
    removeAt: removeHistoryAt,
    clear: clearHistory,
    storageKey: STORAGE_KEY
  };

  // BASIC CALCULATOR
  let basicExpr = '';

  function sanitizeExpression(value){
    return String(value || '').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/,/g,'');
  }

  function evaluateExpression(value){
    const expression = sanitizeExpression(value).trim();
    if(!expression) return 0;
    if(!/^[0-9+\-*/().% \t]+$/.test(expression)) throw new Error('Invalid expression');
    const transformed = expression.replace(/([0-9]+(?:\.[0-9]+)?)%/g,'($1/100)');
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + transformed + ')')();
    if(typeof result !== 'number' || !Number.isFinite(result)) throw new Error('Invalid result');
    return Math.round((result + Number.EPSILON) * 1e12) / 1e12;
  }

  function updateBasicDisplay(){
    const expression = document.getElementById('basic-expression');
    const result = document.getElementById('basic-result');
    if(expression) expression.textContent = basicExpr || '0';
    if(result){
      try{ result.textContent = basicExpr ? String(evaluateExpression(basicExpr)) : '0'; }
      catch(e){ result.textContent = 'Error'; }
    }
  }

  function basicClear(){ basicExpr=''; updateBasicDisplay(); }
  function basicBack(){ basicExpr=basicExpr.slice(0,-1); updateBasicDisplay(); }
  function basicInput(key){ basicExpr += String(key); updateBasicDisplay(); }
  function basicCompute(){
    if(!basicExpr.trim()) return;
    try{
      const result = evaluateExpression(basicExpr);
      addHistoryEntry(basicExpr + ' = ' + result);
      basicExpr = String(result);
      updateBasicDisplay();
    }catch(e){ updateBasicDisplay(); }
  }

  function wireBasicCalculator(){
    const keys = document.getElementById('basic-keys');
    if(!keys || keys.dataset.wired) return;
    keys.dataset.wired = 'true';
    keys.addEventListener('click', event=>{
      const button = event.target.closest('button');
      if(!button) return;
      const key = button.dataset.key;
      const action = button.dataset.action;
      if(action === 'clear') basicClear();
      else if(action === 'back') basicBack();
      else if(action === 'equals') basicCompute();
      else if(key) basicInput(key);
    });

    window.addEventListener('keydown', event=>{
      if(event.target.matches('input,textarea,select')) return;
      if(event.key === 'Enter'){ event.preventDefault(); basicCompute(); }
      else if(event.key === 'Backspace'){ event.preventDefault(); basicBack(); }
      else if(/^[0-9+\-*/().%]$/.test(event.key)){ basicInput(event.key); }
    });
    updateBasicDisplay();
  }

  // SHARED INPUT CALCULATORS
  function wireCalculator(type, config){
    const button = document.querySelector('button[data-calculator="' + type + '"]');
    if(!button || button.dataset.wired) return;
    button.dataset.wired = 'true';

    const calculate = ()=>{
      const values = {};
      for(const key of Object.keys(config.inputIds)){
        const element = document.getElementById(config.inputIds[key]);
        values[key] = element ? Number(element.value) : NaN;
      }
      const output = document.getElementById(config.outputId);

      if(!Object.values(values).every(Number.isFinite)){
        if(output) output.textContent = config.errorMsg || 'Please enter valid numbers.';
        return;
      }
      if(config.validate){
        const error = config.validate(values);
        if(error){ if(output) output.textContent = error; return; }
      }

      try{
        const result = config.calculate(values);
        if(!Number.isFinite(result)) throw new Error('Invalid result');
        if(output) output.textContent = result;
        addHistoryEntry(config.format(values, result));
      }catch(e){
        if(output) output.textContent = e.message === 'Height cannot be zero' ? e.message : 'Unable to calculate. Please check your inputs.';
      }
    };

    button.addEventListener('click', calculate);
    Object.values(config.inputIds).forEach(id=>{
      const input = document.getElementById(id);
      if(input) input.addEventListener('keydown', event=>{
        if(event.key === 'Enter'){ event.preventDefault(); calculate(); }
      });
    });
  }

  function wirePercentage(){
    wireCalculator('percentage',{
      inputIds:{percent:'percentage-percent',of:'percentage-of'},
      outputId:'percentage-answer',
      errorMsg:'Please enter valid numbers.',
      validate:v => v.of < 0 || v.percent < 0 ? 'Please enter non-negative values.' : '',
      calculate:v => Math.round(((v.percent/100)*v.of + Number.EPSILON)*100)/100,
      format:(v,r)=>v.percent + '% of ' + v.of + ' = ' + r
    });
  }

  function wireDiscount(){
    wireCalculator('discount',{
      inputIds:{price:'discount-price',percent:'discount-percent'},
      outputId:'discount-answer',
      errorMsg:'Please enter valid numbers.',
      validate:v => v.price < 0 ? 'Price cannot be negative.' : (v.percent < 0 || v.percent > 100 ? 'Discount must be between 0% and 100%.' : ''),
      calculate:v => Math.round((v.price*(1-v.percent/100)+Number.EPSILON)*100)/100,
      format:(v,r)=>'Discount ' + v.percent + '% on ' + v.price + ' = ' + r
    });
  }

  function wireBMI(){
    wireCalculator('bmi',{
      inputIds:{weight:'bmi-weight',height:'bmi-height'},
      outputId:'bmi-answer',
      errorMsg:'Please enter valid numbers.',
      validate:v => v.weight <= 0 ? 'Weight must be greater than 0.' : (v.height <= 0 ? 'Height must be greater than 0.' : ''),
      calculate:v => Math.round((v.weight/Math.pow(v.height/100,2)+Number.EPSILON)*100)/100,
      format:(v,r)=>'BMI for ' + v.weight + ' kg, ' + v.height + ' cm = ' + r
    });
  }

  function wireUnit(){
    wireCalculator('unit',{
      inputIds:{meters:'unit-meters'},
      outputId:'unit-answer',
      errorMsg:'Please enter a valid number.',
      validate:v => v.meters < 0 ? 'Meters cannot be negative.' : '',
      calculate:v => Math.round((v.meters*100+Number.EPSILON)*100)/100,
      format:(v,r)=>v.meters + ' m = ' + r + ' cm'
    });
  }

  window.addToHistory = addHistoryEntry;

  window.addEventListener('storage', event=>{
    if(event.key !== STORAGE_KEY) return;
    loadHistory();
    renderHistory();
  });

  window.addEventListener('DOMContentLoaded',()=>{
    loadHistory();
    renderHistory();
    wireHistoryControls();
    wireBasicCalculator();
    wirePercentage();
    wireDiscount();
    wireBMI();
    wireUnit();
  });
})();
