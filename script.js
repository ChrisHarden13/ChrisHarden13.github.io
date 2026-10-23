const langToggle = document.querySelector('#lang-toggle');
let language = 'en';
let site = {};
let theme = {};
let sections = [];
let navigation = [];
let activePage = 'profile';

function safePublicUrl(value) {
  try {
    const url = new URL(String(value ?? ''), window.location.href);
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return url.href;
  } catch {}
  return '';
}

function appendInlineMarkdown(parent, text) {
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)|\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|~~([^~]+)~~/g;
  let cursor = 0;
  for (const match of String(text ?? '').matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parent.append(document.createTextNode(text.slice(cursor, index)));
    if (match[1] !== undefined) {
      const src = safePublicUrl(match[2]);
      if (src) {
        const image = document.createElement('img');
        image.src = src;
        image.alt = match[1];
        image.title = match[3] ?? '';
        image.loading = 'lazy';
        image.className = 'rich-inline-image';
        parent.append(image);
      } else parent.append(document.createTextNode(match[0]));
    } else if (match[4] !== undefined) {
      const href = safePublicUrl(match[5]);
      if (href) {
        const link = document.createElement('a');
        link.href = href;
        if (/^https?:/i.test(href)) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
        link.textContent = match[4];
        parent.append(link);
      } else parent.append(document.createTextNode(match[0]));
    } else if (match[7] !== undefined) {
      const strong = document.createElement('strong');
      strong.textContent = match[7];
      parent.append(strong);
    } else if (match[8] !== undefined) {
      const emphasis = document.createElement('em');
      emphasis.textContent = match[8];
      parent.append(emphasis);
    } else if (match[9] !== undefined) {
      const code = document.createElement('code');
      code.textContent = match[9];
      parent.append(code);
    } else {
      const deleted = document.createElement('del');
      deleted.textContent = match[10];
      parent.append(deleted);
    }
    cursor = index + match[0].length;
  }
  if (cursor < String(text ?? '').length) parent.append(document.createTextNode(String(text).slice(cursor)));
}

function renderRichText(element, text) {
  element.replaceChildren();
  const lines = String(text ?? '').split(/\r?\n/);
  let paragraph = [];
  let list = null;
  let listTag = '';
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const p = document.createElement('p');
    appendInlineMarkdown(p, paragraph.join(' '));
    element.append(p);
    paragraph = [];
  };
  const closeList = () => { list = null; listTag = ''; };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushParagraph(); closeList(); continue; }
    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    const bullet = /^[-*+]\s+(.+)$/.exec(line);
    const ordered = /^\d+[.)]\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph(); closeList();
      const h = document.createElement(`h${Math.min(4, heading[1].length + 1)}`);
      appendInlineMarkdown(h, heading[2]);
      element.append(h);
    } else if (bullet || ordered) {
      flushParagraph();
      const tag = bullet ? 'ul' : 'ol';
      if (!list || listTag !== tag) { closeList(); listTag = tag; list = document.createElement(tag); element.append(list); }
      const item = document.createElement('li');
      appendInlineMarkdown(item, (bullet ?? ordered)[1]);
      list.append(item);
    } else if (line.startsWith('> ')) {
      flushParagraph(); closeList();
      const quote = document.createElement('blockquote');
      appendInlineMarkdown(quote, line.slice(2));
      element.append(quote);
    } else if (/^(---+|\*\*\*+)$/.test(line)) {
      flushParagraph(); closeList(); element.append(document.createElement('hr'));
    } else {
      closeList(); paragraph.push(line);
    }
  }
  flushParagraph();
}

function moduleHeader(section) { return section.header ?? section; }
function localized(section, stem) { return section[`${stem}${language === 'en' ? 'En' : 'Zh'}`] ?? ''; }
function slug(value, index) {
  const result = String(value ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `module-${index + 1}${result ? `-${result}` : ''}`;
}
function addRich(parent, className, value) {
  const node = document.createElement('div');
  if (className) node.className = className;
  renderRichText(node, value);
  parent.append(node);
  return node;
}
function addHeading(section, container) {
  const h = document.createElement('h2');
  h.textContent = localized(section, 'title');
  container.append(h);
  return h;
}
function addImage(parent, src, alt, className) {
  const url = safePublicUrl(src);
  if (!url) return null;
  const image = document.createElement('img');
  image.src = url;
  image.alt = alt ?? '';
  image.loading = 'lazy';
  image.className = className;
  parent.append(image);
  return image;
}
function svgIcon(kind) {
  const paths = {
    scholar: '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>',
    orcid: '<circle cx="12" cy="12" r="9"/><text x="12" y="15.5" text-anchor="middle" font-size="8" font-family="Arial" font-weight="700" fill="currentColor" stroke="none">iD</text>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10v7M7 7v.1M11 17v-7m0 3a3 3 0 0 1 6 0v4"/>',
    github: '<path d="M9 19c-4 1.3-4-2-5-2m10 4v-3.1c0-.9.1-1.5-.5-2 3.2-.4 6.5-1.6 6.5-7A5.5 5.5 0 0 0 18.5 5 5.1 5.1 0 0 0 18.4 1S17.2.6 14 2.8a13.5 13.5 0 0 0-7 0C3.8.6 2.6 1 2.6 1A5.1 5.1 0 0 0 2.5 5 5.5 5.5 0 0 0 1 8.9c0 5.4 3.3 6.6 6.5 7-.6.5-.6 1.2-.5 2V21"/>',
    website: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
    school: '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>'
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = paths[kind] ?? paths.website;
  return svg;
}
function makeSection(section, index) {
  const header = moduleHeader(section);
  if (header.visible === false) return null;
  const root = document.createElement('section');
  root.className = `section dynamic-section dynamic-${section.type}`;
  root.id = slug(header.sectionLabelEn || header.sectionLabelZh, index);
  if (section.type === 'text') {
    const sectionTitle = `${header.titleEn ?? ''} ${header.titleZh ?? ''} ${header.sectionLabelEn ?? ''} ${header.sectionLabelZh ?? ''}`.toLowerCase();
    const isAboutMe = (section.page || 'profile') === 'profile'
      && (section.layout === 'full' || /about\s*me|关于我/.test(sectionTitle));
    if (isAboutMe) root.classList.add('dynamic-about-me');
    const layout = document.createElement('div');
    layout.className = 'module-text-layout';
    const main = document.createElement('div');
    main.className = 'module-text-main';
    addHeading(header, main);
    addRich(main, 'module-body rich-description', localized(section, 'body'));
    const imageSource = isAboutMe ? (section.image || site.avatar) : section.image;
    const image = addImage(layout, imageSource, section.imageAlt || (isAboutMe ? site.avatarAlt : ''), 'module-image');
    if (isAboutMe && image) {
      layout.prepend(image);
      layout.append(main);
    } else layout.prepend(main);
    if (section.layout === 'full' || !image) layout.classList.add('module-text-layout-full');
    root.append(layout);
    return root;
  }

  const title = document.createElement('div');
  title.className = 'section-heading dynamic-heading';
  addHeading(header, title);
  const intro = localized(section.intro ?? {}, 'intro');
  if (intro) addRich(title, 'module-intro', intro);
  root.append(title);

  if (section.type === 'education') {
    const list = document.createElement('div');
    list.className = 'education-list';
    (section.items ?? []).forEach((item) => {
      const row = document.createElement('article');
      row.className = `education-row${item.type ? ` education-row-${item.type}` : ''}`;
      const icon = document.createElement('div');
      icon.className = 'school-icon';
      if (item.logoUrl || item.logo) addImage(icon, item.logoUrl || item.logo, item.schoolEn ?? '', 'school-logo');
      else icon.append(svgIcon('school'));
      const details = document.createElement('div');
      details.className = 'school-details';
      const school = language === 'zh' ? (item.schoolZh || item.schoolEn) : item.schoolEn;
      const schoolHeading = document.createElement('h3');
      const schoolUrl = safePublicUrl(item.url);
      if (schoolUrl) {
        const link = document.createElement('a');
        link.href = schoolUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = school || '';
        schoolHeading.append(link);
      } else schoolHeading.textContent = school || '';
      details.append(schoolHeading);
      const degree = language === 'zh' ? (item.degreeZh || item.degreeEn) : item.degreeEn;
      const department = language === 'zh' ? (item.departmentZh || item.departmentEn) : item.departmentEn;
      const meta = [degree, department, item.dates].filter(Boolean).join(' · ');
      if (meta) { const line = document.createElement('p'); line.className = 'school-meta'; line.textContent = meta; details.append(line); }
      addRich(details, 'school-description', localized(item, 'body'));
      row.append(icon, details);
      list.append(row);
    });
    root.append(list);
  } else if (section.type === 'publication') {
    const list = document.createElement('div');
    list.className = 'project-list';
    (section.items ?? []).forEach((item, itemIndex) => {
      const article = document.createElement('article');
      article.className = 'project-card';
      const numberCell = document.createElement('div');
      numberCell.className = 'project-number';
      numberCell.textContent = String(itemIndex + 1).padStart(2, '0');
      const main = document.createElement('div');
      main.className = 'project-main';
      const h = document.createElement('h3');
      if (item.url && safePublicUrl(item.url)) {
        const a = document.createElement('a');
        a.href = safePublicUrl(item.url);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = (language === 'zh' && item.titleZh) ? item.titleZh : (item.title ?? '');
        h.append(a);
      } else h.textContent = (language === 'zh' && item.titleZh) ? item.titleZh : (item.title ?? '');
      main.append(h);
      if (item.authors) addRich(main, 'project-authors', item.authors);
      const venueName = (language === 'zh' && item.venueZh) ? item.venueZh : item.venue;
      const venueLine = [venueName, item.year].filter(Boolean).join(' · ');
      if (venueLine) addRich(main, 'project-venue', venueLine);
      addRich(main, 'rich-description', localized(item, 'body'));
      addImage(main, item.image, item.imageAlt, 'project-image');
      article.append(numberCell, main);
      list.append(article);
    });
    root.append(list);
  } else if (section.type === 'links') {
    const list = document.createElement('div');
    list.className = 'homepage-links';
    (section.items ?? []).forEach((item) => {
      const href = safePublicUrl(item.url);
      const card = document.createElement(href ? 'a' : 'article');
      card.className = 'homepage-link';
      if (href) { card.href = href; card.target = '_blank'; card.rel = 'noopener noreferrer'; }
      const icon = document.createElement('span');
      icon.className = `homepage-icon homepage-icon-${item.icon || 'website'}`;
      icon.append(svgIcon(item.icon || 'website'));
      const body = document.createElement('div');
      const h = document.createElement('h3');
      h.textContent = localized(item, 'label') || item.label || '';
      body.append(h);
      addRich(body, 'module-link-description', localized(item, 'body'));
      addImage(body, item.image, item.imageAlt, 'honor-image');
      const arrow = document.createElement('span');
      arrow.className = 'honor-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      card.append(icon, body, arrow);
      list.append(card);
    });
    root.append(list);
  } else if (section.type === 'cards') {
    const list = document.createElement('div');
    list.className = 'custom-card-grid';
    (section.items ?? []).forEach((item) => {
      const data = item.card ?? item;
      const card = document.createElement('article');
      card.className = `custom-card${data.type ? ` custom-card-${data.type}` : ''}`;
      addImage(card, data.image, data.imageAlt, 'project-image');
      const h = document.createElement('h3');
      h.textContent = localized(data, 'title') || data.title || '';
      card.append(h);
      if (data.date) {
        const date = document.createElement('time');
        date.className = 'custom-card-date';
        date.textContent = data.date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(data.date)) date.dateTime = data.date;
        card.append(date);
      }
      const subtitle = localized(data, 'subtitle') || data.subtitle || '';
      if (subtitle) addRich(card, 'custom-card-subtitle', subtitle);
      addRich(card, 'module-body rich-description', localized(data, 'body'));
      if (data.url && safePublicUrl(data.url)) {
        const link = document.createElement('a');
        link.href = safePublicUrl(data.url);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = localized(data, 'linkLabel') || (language === 'en' ? 'Read more ↗' : '查看详情 ↗');
        card.append(link);
      }
      list.append(card);
    });
    root.append(list);
  }
  return root;
}

function renderNavigation() {
  const nav = document.querySelector('#module-nav');
  nav.replaceChildren();
  navigation.forEach((item) => {
    const label = language === 'zh' ? (item.labelZh || item.labelEn) : item.labelEn;
    if (!item.key || !label) return;
    const link = document.createElement('a');
    link.href = `?page=${encodeURIComponent(item.key)}`;
    if (item.key === activePage) link.setAttribute('aria-current', 'page');
    link.textContent = label;
    nav.append(link);
  });
  nav.hidden = nav.childElementCount === 0;
}

function applyTheme() {
  const root = document.documentElement;
  const colors = {
    '--ink': theme.colorText, '--muted': theme.colorMuted, '--accent': theme.colorAccent,
    '--line': theme.colorBorder, '--paper': theme.colorBackground, '--soft': theme.colorSoft
  };
  Object.entries(colors).forEach(([key, value]) => {
    if (/^#[0-9a-f]{6}$/i.test(value ?? '')) root.style.setProperty(key, value);
  });
  const bodyFont = String(theme.fontBody ?? '').replace(/[^a-z0-9 ,"'_-]/gi, '');
  const headingFont = String(theme.fontHeading ?? '').replace(/[^a-z0-9 ,"'_-]/gi, '');
  if (bodyFont) root.style.setProperty('--sans', bodyFont);
  if (headingFont) root.style.setProperty('--serif', headingFont);
  const numeric = {
    '--base-font-size': [theme.bodyFontSize, 12, 28, 'px'],
    '--body-line-height': [theme.bodyLineHeight, 1, 3, ''],
    '--content-width': [theme.contentWidth, 640, 2400, 'px'],
    '--page-gutter': [theme.pageGutter, 8, 120, 'px'],
    '--section-space': [theme.sectionSpacing, 16, 180, 'px'],
    '--card-radius': [theme.cardRadius, 0, 48, 'px'],
    '--column-gap': [theme.columnGap, 8, 120, 'px'],
    '--avatar-size': [theme.avatarSize, 48, 400, 'px'],
    '--avatar-radius': [theme.avatarRadius, 0, 50, '%'],
    '--project-columns': [theme.projectColumns, 1, 3, ''],
    '--profile-columns': [theme.profileColumns, 1, 4, ''],
    '--text-line-limit': [theme.textLineLimit, 1, 30, '']
  };
  Object.entries(numeric).forEach(([key, [value, min, max, unit]]) => {
    const n = Number(value);
    if (Number.isFinite(n)) root.style.setProperty(key, `${Math.min(max, Math.max(min, n))}${unit}`);
  });
  const scale = Math.min(1.6, Math.max(.7, Number(theme.headingScale) || 1));
  root.style.setProperty('--heading-scale', scale);
  const scaledSizes = {
    '--h1-min': `${48 * scale}px`, '--h1-fluid': `${6.2 * scale}vw`, '--h1-max': `${68 * scale}px`,
    '--title-min': `${29 * scale}px`, '--title-fluid': `${3.8 * scale}vw`, '--title-max': `${39 * scale}px`,
    '--section-title-size': `${35 * scale}px`, '--item-title-size': `${22 * scale}px`,
    '--mobile-h1-size': `${55 * scale}px`, '--mobile-title-size': `${30 * scale}px`,
    '--mobile-section-title-size': `${31 * scale}px`, '--mobile-item-title-size': `${20 * scale}px`
  };
  Object.entries(scaledSizes).forEach(([key, value]) => root.style.setProperty(key, value));
  document.querySelector('meta[name="theme-color"]').content = theme.colorBackground || '#ffffff';
}

function render() {
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  document.title = site.pageTitle || `${site.firstName ?? ''} ${site.lastName ?? ''}`.trim();
  document.querySelector('meta[name="description"]').content = site.pageDescription ?? '';
  document.querySelector('#first-name').textContent = site.firstName ?? '';
  document.querySelector('#last-name').textContent = site.lastName ?? '';
  const siteMark = document.querySelector('#site-mark');
  const siteLogo = document.querySelector('#site-logo');
  const favicon = document.querySelector('#site-favicon');
  const avatarUrl = site.avatar ? safePublicUrl(site.avatar) : '';
  siteMark.textContent = (site.monogram || site.firstName || 'K').slice(0, 1).toUpperCase();
  siteMark.hidden = Boolean(avatarUrl);
  siteLogo.hidden = !avatarUrl;
  if (avatarUrl) {
    siteLogo.src = avatarUrl;
    favicon.href = avatarUrl;
  } else {
    siteLogo.removeAttribute('src');
    favicon.href = 'data:,';
  }
  document.querySelector('.topbar').hidden = site.showHeader === false;
  document.querySelector('.hero').hidden = site.showHero === false || activePage !== 'profile';
  document.querySelector('footer').hidden = site.showFooter === false;
  document.querySelector('#hero-kicker').textContent = language === 'en' ? (site.heroKickerEn ?? '') : (site.heroKickerZh ?? '');
  document.querySelector('#back-top').textContent = language === 'en' ? (site.backTopEn ?? '') : (site.backTopZh ?? '');
  const initials = document.querySelector('#profile-initials');
  const photo = document.querySelector('#profile-photo');
  initials.textContent = (site.monogram || `${site.firstName?.[0] ?? ''}${site.lastName?.[0] ?? ''}`).toUpperCase();
  photo.hidden = !site.avatar;
  initials.hidden = Boolean(site.avatar);
  if (site.avatar) photo.src = safePublicUrl(site.avatar);
  photo.alt = site.avatarAlt ?? '';
  const email = document.querySelector('#profile-email');
  email.hidden = !site.email;
  if (site.email) { email.href = `mailto:${site.email}`; email.querySelector('span').textContent = site.email; }
  const phone = document.querySelector('#profile-phone');
  phone.hidden = !site.phone;
  if (site.phone) {
    const dialable = String(site.phone).replace(/[^\d+*#]/g, '');
    phone.href = `tel:${dialable}`;
    phone.querySelector('span').textContent = site.phone;
  }
  renderRichText(document.querySelector('#footer-copy'), language === 'en' ? site.footerTextEn : site.footerTextZh);
  applyTheme();
  renderNavigation();
  const container = document.querySelector('#page-modules');
  container.replaceChildren();
  sections.filter((section) => (section.page || 'profile') === activePage).forEach((section, index) => {
    const node = makeSection(section, index);
    if (node) container.append(node);
  });
  langToggle.textContent = language === 'en' ? (site.languageSwitchEn ?? '中文') : (site.languageSwitchZh ?? 'EN');
  langToggle.setAttribute('aria-label', language === 'en' ? 'Switch language to Chinese' : 'Switch language to English');
}

Promise.all([
  fetch('data/site.json', {cache: 'no-cache'}).then((response) => { if (!response.ok) throw new Error('Could not load profile'); return response.json(); }),
  fetch('data/style.json', {cache: 'no-cache'}).then((response) => { if (!response.ok) throw new Error('Could not load appearance settings'); return response.json(); }),
  fetch('data/modules.json', {cache: 'no-cache'}).then((response) => { if (!response.ok) throw new Error('Could not load modules'); return response.json(); }),
  fetch('data/navigation.json', {cache: 'no-cache'}).then((response) => { if (!response.ok) throw new Error('Could not load navigation'); return response.json(); })
]).then(([profile, appearance, page, nav]) => {
  site = profile;
  theme = appearance;
  sections = Array.isArray(page.sections) ? page.sections : [];
  navigation = Array.isArray(nav.items) ? nav.items : [];
  const requested = new URLSearchParams(window.location.search).get('page');
  const allowed = new Set(navigation.map((item) => item.key));
  activePage = allowed.has(requested) ? requested : (navigation[0]?.key || 'profile');
  render();
}).catch((error) => console.error(error));

langToggle.addEventListener('click', () => {
  language = language === 'en' ? 'zh' : 'en';
  render();
});
