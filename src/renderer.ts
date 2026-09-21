import '@fortawesome/fontawesome-free/css/fontawesome.css';
import '@fortawesome/fontawesome-free/css/regular.css';
import './index.css';

type NoteFunApi = {
  home: () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  submitBaseUrl: (url: string) => void;
  onPromptBaseUrl: (cb: (current: string) => void) => void;
};

const api = (window as unknown as { notefun: NoteFunApi }).notefun;

const promptEl = document.getElementById('prompt') as HTMLDivElement;
const form = document.getElementById('prompt-form') as HTMLFormElement;
const input = document.getElementById('base-url') as HTMLInputElement;

document.getElementById('home')?.addEventListener('click', () => api.home());
document.getElementById('min')?.addEventListener('click', () => api.minimize());
document.getElementById('max')?.addEventListener('click', () => api.maximize());
document.getElementById('close')?.addEventListener('click', () => api.close());

api.onPromptBaseUrl((current) => {
  input.value = current;
  promptEl.classList.remove('hidden');
  input.focus();
  input.select();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const url = input.value.trim();
  if (!url) {
    return;
  }
  promptEl.classList.add('hidden');
  api.submitBaseUrl(url);
});
