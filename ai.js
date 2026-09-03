'use strict';

// Set this to your deployed Cloudflare Worker URL after deployment.
const AI_API_URL = 'YOUR_CLOUDFLARE_WORKER_URL';

const form = document.getElementById('chatForm');
const input = document.getElementById('prompt');
const messages = document.getElementById('messages');
const sendBtn = document.getElementById('sendBtn');

function addMessage(role, text){
  const el = document.createElement('div');
  el.className = `ai-message ${role}`;
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
  return el;
}

async function sendMessage(text){
  const prompt = text.trim();
  if(!prompt || sendBtn.disabled) return;

  addMessage('user', prompt);
  input.value = '';
  sendBtn.disabled = true;
  sendBtn.textContent = 'Thinking…';
  const loading = addMessage('assistant', 'Thinking…');

  try{
    if(AI_API_URL === 'YOUR_CLOUDFLARE_WORKER_URL'){
      throw new Error('AI backend is not configured yet. Deploy worker.js and set its URL in ai.js.');
    }

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({message: prompt})
    });

    const data = await response.json().catch(() => ({}));
    if(!response.ok) throw new Error(data.error || 'The AI service returned an error.');

    loading.textContent = data.reply || 'I could not generate a response.';
  }catch(error){
    loading.textContent = error.message || 'Unable to reach Numvero AI.';
  }finally{
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send';
    input.focus();
    messages.scrollTop = messages.scrollHeight;
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  sendMessage(input.value);
});

document.querySelectorAll('.ai-example').forEach(button => {
  button.addEventListener('click', () => {
    input.value = button.dataset.prompt || '';
    input.focus();
    input.dispatchEvent(new Event('input'));
  });
});

input.addEventListener('keydown', event => {
  if(event.key === 'Enter' && !event.shiftKey){
    event.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 140) + 'px';
});
