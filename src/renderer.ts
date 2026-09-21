import './index.css';

type NoteFunApi = {
  home: () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  submitBaseUrl: (url: string) => void;
  onPromptBaseUrl: (cb: (current: string) => void) => void;
  onOpenUrl: (cb: (url: string) => void) => void;
  shellReady: () => void;
};

const api = (window as unknown as { notefun: NoteFunApi }).notefun;

const promptEl = document.getElementById('prompt') as HTMLDivElement;
const form = document.getElementById('prompt-form') as HTMLFormElement;
const input = document.getElementById('base-url') as HTMLInputElement;
const guest = document.getElementById('guest') as Electron.WebviewTag;

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

api.onOpenUrl((url) => {
  promptEl.classList.add('hidden');
  void guest.loadURL(url);
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

api.shellReady();
