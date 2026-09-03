export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') return new Response(null, {headers: cors});
    if (request.method !== 'POST') return json({error: 'Method not allowed'}, 405, cors);

    try {
      const body = await request.json();
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (!message) return json({error: 'Message is required.'}, 400, cors);
      if (message.length > 4000) return json({error: 'Message is too long.'}, 400, cors);
      if (!env.OPENAI_API_KEY) return json({error: 'OpenAI API key is not configured on the worker.'}, 500, cors);

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-5-mini',
          instructions: 'You are Numvero AI, a concise and helpful assistant. Prioritize correct maths and clear step-by-step explanations. Do not claim to be a human.',
          input: message,
          max_output_tokens: 1200
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return json({error: data?.error?.message || 'OpenAI request failed.'}, response.status, cors);
      }

      const reply = data.output_text || extractOutputText(data);
      return json({reply: reply || 'No response was generated.'}, 200, cors);
    } catch (error) {
      return json({error: error?.message || 'Server error.'}, 500, cors);
    }
  }
};

function extractOutputText(data) {
  const parts = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

function json(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json', ...extraHeaders}
  });
}
