const toggle = document.querySelector('#lang-toggle');
let language = 'en';
let translations = new Map();

function renderLanguage() {
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-copy]').forEach((element) => {
    const value = translations.get(element.dataset.copy)?.[language];
    if (typeof value !== 'string') return;
    // Keep line breaks editable as plain text instead of interpreting CMS content as HTML.
    const parts = value.split(/<br\s*\/?\s*>/i);
    element.replaceChildren();
    parts.forEach((part, index) => {
      if (index) element.append(document.createElement('br'));
      element.append(document.createTextNode(part));
    });
  });
  toggle.textContent = language === 'en' ? '中文' : 'EN';
  toggle.setAttribute('aria-label', language === 'en' ? 'Switch language to Chinese' : 'Switch language to English');
}

fetch('data/content.json')
  .then((response) => {
    if (!response.ok) throw new Error('Could not load editable site content.');
    return response.json();
  })
  .then((content) => {
    translations = new Map(content.translations.map((item) => [item.key, item]));
    renderLanguage();
  })
  .catch((error) => console.error(error));

toggle.addEventListener('click', () => {
  language = language === 'en' ? 'zh' : 'en';
  renderLanguage();
});

