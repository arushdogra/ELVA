const byId = id => document.getElementById(id);
const list = byId('messages');
const prompt = byId('prompt');
const status = byId('status');
const storageKey = 'elva-workspace-v1';
let items;
try {
  items = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
  if (!Array.isArray(items)) items = [];
} catch {
  items = [];
}
let history = [];

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function persist(next) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
    items = next;
    renderItems();
    return true;
  } catch {
    status.textContent = 'This browser could not save your workspace.';
    return false;
  }
}

function renderItems() {
  const panel = byId('items');
  panel.replaceChildren();
  if (!items.length) panel.append(element('p', 'Your saved items will appear here.'));
  for (const item of items) {
    const card = element('article', '', 'item');
    card.append(element('small', item.kind), element('strong', item.title), element('p', item.body));
    for (const source of item.sources ?? []) {
      const link = element('a', source.title);
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      card.append(link);
    }
    if (item.kind === 'Task') {
      const button = element('button', item.done ? 'Mark incomplete' : 'Mark complete', 'secondary');
      button.onclick = () => persist(items.map(entry => entry.id === item.id ? { ...entry, done: !entry.done } : entry));
      card.append(button);
    }
    panel.append(card);
  }
}

function showMessage(role, content, sources = []) {
  byId('welcome').hidden = true;
  const card = element('article', '', 'message ' + role);
  card.append(element('strong', role === 'user' ? 'You' : 'ELVA'), element('p', content));
  for (const source of sources) {
    const link = element('a', source.title + (source.date ? ' · ' + source.date : ''));
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    card.append(link);
  }
  if (role === 'assistant' && 'speechSynthesis' in window) {
    const speak = element('button', 'Read aloud', 'secondary');
    speak.onclick = () => {
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(content));
    };
    card.append(speak);
  }
  list.append(card);
  list.scrollTop = list.scrollHeight;
}

function showActivity(entries) {
  byId('activity').replaceChildren(...(entries.length ? entries : ['Tool activity appears here.']).map(entry => element('li', entry)));
}

byId('composer').onsubmit = async event => {
  event.preventDefault();
  const text = prompt.value.trim();
  if (!text || byId('send').disabled) return;
  showMessage('user', text);
  prompt.value = '';
  byId('send').disabled = byId('reset').disabled = true;
  status.textContent = 'ELVA is working…';
  showActivity([]);
  try {
    const response = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...history.slice(-10), { role: 'user', text }], items: items.slice(0, 25) })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed.');
    status.textContent = '';
    const saved = result.actions.length > 0 && persist([...result.actions.map(item => ({ ...item, sources: result.sources })), ...items]);
    const confirmation = saved ? '\n\nSaved to your workspace: ' + result.actions.map(item => item.title).join(', ') + '.' : '';
    history.push({ role: 'user', text }, { role: 'assistant', text: result.reply + confirmation });
    showMessage('assistant', result.reply + confirmation, result.sources);
    showActivity([...result.activity, ...(saved ? result.actions.map(item => 'Saved ' + item.kind.toLowerCase() + ' · ' + item.title) : [])]);
  } catch (error) {
    status.textContent = error.message || 'ELVA could not connect.';
    prompt.value ||= text;
  } finally {
    byId('send').disabled = byId('reset').disabled = false;
    prompt.focus();
  }
};

for (const button of document.querySelectorAll('[data-prompt]')) {
  button.onclick = () => { prompt.value = button.dataset.prompt; prompt.focus(); };
}
byId('reset').onclick = () => {
  history = [];
  list.querySelectorAll('.message').forEach(node => node.remove());
  byId('welcome').hidden = false;
  status.textContent = '';
  prompt.value = '';
  showActivity([]);
  prompt.focus();
};

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition) {
  const mic = byId('mic');
  const recognition = new Recognition();
  recognition.lang = 'en-IN';
  mic.hidden = false;
  mic.onclick = () => {
    try {
      recognition.start();
      mic.disabled = true;
    } catch {
      status.textContent = 'Microphone unavailable.';
    }
  };
  recognition.onresult = event => {
    prompt.value = event.results[0][0].transcript;
    prompt.focus();
  };
  recognition.onerror = () => { status.textContent = 'Could not capture audio. You can type your message.'; };
  recognition.onend = () => { mic.disabled = false; };
}
renderItems();
