import './index.css';

type NoteFunApi = {
  home: () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  submitBaseUrl: (url: string) => void;
};

const api = (window as unknown as { notefun: NoteFunApi }).notefun;

document.getElementById('home')?.addEventListener('click', () => api.home());
document.getElementById('min')?.addEventListener('click', () => api.minimize());
document.getElementById('max')?.addEventListener('click', () => api.maximize());
document.getElementById('close')?.addEventListener('click', () => api.close());
