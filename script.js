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

function setCircularFavicon(source) {
  const favicon = document.querySelector('#site-favicon');
  favicon.href = source;
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return;
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    context.clip();
    context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
    try { favicon.href = canvas.toDataURL('image/png'); } catch { favicon.href = source; }
  };
  image.src = source;
}

function appendInlineMarkdown(parent, text) {
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)|\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)|\*\*([^*]+)\*\*|(?<!\w)\*([^*]+)\*(?!\w)|`([^`]+)`|~~([^~]+)~~/g;
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
  if (!String(src ?? '').trim()) return null;
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
    researchgate: '<text x="4" y="18" font-family="Georgia, serif" font-size="19" font-weight="700" fill="currentColor" stroke="none">R</text><text x="15" y="10" font-family="Arial, sans-serif" font-size="10" fill="currentColor" stroke="none">G</text>',
    x: '<path d="M17.7 3H21l-7.2 8.2L22.3 21h-6.6l-5.1-6.7L4.7 21H1.3L9 12.2 1 3h6.8l4.6 6.1L17.7 3Zm-1.2 16h1.8L6.8 4.9H4.9L16.5 19Z" fill="currentColor" stroke="none"/>',
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
      const typeClass = String(item.type ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      row.className = `education-row${typeClass ? ` education-row-${typeClass}` : ''}`;
      const icon = document.createElement('div');
      icon.className = 'school-icon';
      if (item.logoUrl || item.logo) addImage(icon, item.logoUrl || item.logo, item.schoolEn ?? '', 'school-logo');
      else icon.append(svgIcon('school'));
      const details = document.createElement('div');
      details.className = 'school-details';
      const degree = language === 'zh' ? (item.degreeZh || item.degreeEn) : item.degreeEn;
      const school = language === 'zh' ? (item.schoolZh || item.schoolEn) : item.schoolEn;
      const department = language === 'zh' ? (item.departmentZh || item.departmentEn) : item.departmentEn;
      const schoolUrl = item.url ? safePublicUrl(item.url) : '';
      const departmentUrl = item.departmentUrl ? safePublicUrl(item.departmentUrl) : '';
      const appendField = (key, labelEn, labelZh, value, renderValue) => {
        if (!value && !renderValue) return;
        const field = document.createElement('div');
        field.className = `school-field school-field-${key}`;
        const dot = document.createElement('span');
        dot.className = 'school-field-dot';
        dot.setAttribute('aria-hidden', 'true');
        const content = document.createElement('div');
        content.className = 'school-field-content';
        const label = document.createElement('strong');
        label.textContent = `${language === 'zh' ? labelZh : labelEn}:`;
        content.append(label);
        if (renderValue) renderValue(content);
        else {
          const text = document.createElement('span');
          text.textContent = value;
          content.append(' ', text);
        }
        field.append(dot, content);
        details.append(field);
      };
      appendField('degree', 'Degree', '学位', degree);
      appendField('school', 'School', '学校', school, school ? (content) => {
        const text = document.createElement(schoolUrl ? 'a' : 'span');
        if (schoolUrl) { text.href = schoolUrl; text.target = '_blank'; text.rel = 'noopener noreferrer'; }
        text.textContent = school;
        content.append(' ', text);
      } : null);
      appendField('department', 'Department', '院系', department, department ? (content) => {
        const text = document.createElement(departmentUrl ? 'a' : 'span');
        if (departmentUrl) { text.href = departmentUrl; text.target = '_blank'; text.rel = 'noopener noreferrer'; }
        text.textContent = department;
        content.append(' ', text);
      } : null);
      const supervisor = localized(item, 'supervisor');
      appendField('supervisor', 'Supervisor', '导师', supervisor, supervisor
        ? (content) => addRich(content, 'school-supervisor rich-description', supervisor)
        : null);
      appendField('dates', 'Dates', '时间', item.dates);
      const description = localized(item, 'body');
      appendField('description', 'Description', '描述', description, description
        ? (content) => addRich(content, 'school-description rich-description', description)
        : null);
      row.append(icon, details);
      list.append(row);
    });
    root.append(list);
  } else if (section.type === 'publication') {
    const list = document.createElement('div');
    list.className = 'project-list';
    (section.items ?? []).forEach((item, itemIndex) => {
      const article = document.createElement('article');
      article.className = 'project-card publication-entry';
      const numberCell = document.createElement('div');
      numberCell.className = 'project-number';
      numberCell.textContent = String(itemIndex + 1).padStart(2, '0');
      const main = document.createElement('div');
      main.className = 'project-main';
      const h = document.createElement('h3');
      const titleText = (language === 'zh' && item.titleZh) ? item.titleZh : (item.title ?? '');
      if (item.url && safePublicUrl(item.url)) {
        const a = document.createElement('a');
        a.href = safePublicUrl(item.url);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        appendInlineMarkdown(a, titleText);
        h.append(a);
      } else appendInlineMarkdown(h, titleText);
      main.append(h);
      if (item.authors) addRich(main, 'project-authors', item.authors);
      const venueName = (language === 'zh' && item.venueZh) ? item.venueZh : item.venue;
      const venueLine = [venueName, item.year].filter(Boolean).join(' · ');
      if (venueLine) addRich(main, 'project-venue', venueLine);
      addRich(main, 'rich-description', localized(item, 'body'));
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
      body.className = 'homepage-link-body';
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
    const newsHeading = `${header.titleEn ?? ''} ${header.titleZh ?? ''} ${header.sectionLabelEn ?? ''} ${header.sectionLabelZh ?? ''}`;
    const isNewsSection = /latest\s*news|最新动态/i.test(newsHeading)
      || (section.items?.length > 0 && section.items.every((item) => (item.card ?? item).type === 'news'));
    list.className = isNewsSection ? 'latest-news-list' : 'custom-card-grid';
    (section.items ?? []).forEach((item) => {
      const data = item.card ?? item;
      const card = document.createElement('article');
      card.className = isNewsSection ? 'latest-news-item' : `custom-card${data.type ? ` custom-card-${data.type}` : ''}`;
      if (!isNewsSection) addImage(card, data.image, data.imageAlt, 'project-image');
      if (isNewsSection && data.date) {
        const date = document.createElement('time');
        date.className = 'latest-news-date';
        date.textContent = data.date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(data.date)) date.dateTime = data.date;
        card.append(date);
      }
      const h = document.createElement('h3');
      h.textContent = localized(data, 'title') || data.title || '';
      if (!isNewsSection || h.textContent) card.append(h);
      if (!isNewsSection && data.date) {
        const date = document.createElement('time');
        date.className = 'custom-card-date';
        date.textContent = data.date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(data.date)) date.dateTime = data.date;
        card.append(date);
      }
      const subtitle = localized(data, 'subtitle') || data.subtitle || '';
      if (subtitle) addRich(card, isNewsSection ? 'latest-news-subtitle' : 'custom-card-subtitle', subtitle);
      addRich(card, isNewsSection ? 'latest-news-content rich-description' : 'module-body rich-description', localized(data, 'body'));
      if (isNewsSection) addImage(card, data.image, data.imageAlt, 'latest-news-image');
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

function pagePath(key) {
  return key === 'profile' ? '/' : '/' + encodeURIComponent(key) + '/';
}

function resolvePage(pathname, search, allowed, fallback = 'profile') {
  const legacy = new URLSearchParams(search).get('page');
  if (allowed.has(legacy)) return legacy;
  const segment = pathname.split('/').filter(Boolean)[0];
  const key = !segment || segment === 'index.html' ? 'profile' : segment;
  return allowed.has(key) ? key : fallback;
}

function renderNavigation() {
  const nav = document.querySelector('#module-nav');
  nav.replaceChildren();
  navigation.forEach((item) => {
    const label = language === 'zh' ? (item.labelZh || item.labelEn) : item.labelEn;
    if (!item.key || !label) return;
    const link = document.createElement('a');
    link.href = pagePath(item.key);
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
  document.querySelector('meta[name="theme-color"]').content = theme.colors?.background || theme.colorBackground || '#ffffff';
}


/* Grouped Appearance settings; missing groups keep the legacy configuration working. */

function appearanceSettings(raw) {
  if (!raw.general && !raw.mainPages) return raw;
  const common = raw.general || {};
  const pages = raw.mainPages || {};
  return { ...common,
    profile: pages.profile?.portrait || {},
    text: { ...common.text, ...pages.profile?.about },
    news: pages.profile?.news || {},
    links: pages.profile?.links || {},
    education: pages.education?.schools || {},
    publications: pages.publication?.entries || {}
  };
}

function applyAppearance() {
  const root = document.documentElement;
  const settings = [{"key":"typography","fields":[{"key":"bodyFont","label":"正文字体","value":"-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","type":"string"},{"key":"headingFont","label":"标题字体","value":"Georgia, Times New Roman, serif","type":"string"},{"key":"bodySize","label":"正文基础字号 (px)","value":18,"unit":"px","min":0,"max":600,"type":"number"},{"key":"bodyLineHeight","label":"正文行距（倍数）","value":1.75,"unit":"","min":1,"max":3,"type":"number"},{"key":"headingSize","label":"模块标题字号 (px)","value":33,"unit":"px","min":0,"max":600,"type":"number"},{"key":"headingWeight","label":"模块标题字重","value":400,"unit":"","min":100,"max":900,"type":"number"},{"key":"headingLineHeight","label":"模块标题行距","value":1.2,"unit":"","min":1,"max":3,"type":"number"},{"key":"paragraphGap","label":"段落间距 (px)","value":12,"unit":"px","min":0,"max":600,"type":"number"},{"key":"alignment","label":"正文对齐","value":"justify","type":"select","values":["left","center","right","justify"]},{"key":"linkDecoration","label":"链接装饰","value":"none","type":"select","values":["none","underline"]},{"key":"linkUnderlineOffset","label":"链接下划线偏移 (px)","value":3,"unit":"px","min":0,"max":600,"type":"number"},{"key":"bodyWeight","label":"Body font weight / 正文字重","value":400,"unit":"","min":100,"max":900,"type":"number"},{"key":"itemSize","label":"Entry title size (px) / 条目标题字号 (px)","value":24,"unit":"px","min":12,"max":80,"type":"number"},{"key":"itemWeight","label":"Entry title weight / 条目标题字重","value":400,"unit":"","min":100,"max":900,"type":"number"},{"key":"itemLineHeight","label":"Entry title line height / 条目标题行距","value":1.45,"unit":"","min":1,"max":3,"type":"number"},{"key":"metadataSize","label":"Metadata font size (px) / 作者、期刊、日期与副标题字号 (px)","value":18,"unit":"px","min":10,"max":40,"type":"number"},{"key":"metadataWeight","label":"Metadata weight / 信息文字字重","value":400,"unit":"","min":100,"max":900,"type":"number"}]},{"key":"colors","fields":[{"key":"text","label":"主文字（HEX，如 #26323d）","value":"#26323d","type":"string"},{"key":"muted","label":"次要文字（HEX，如 #26323d）","value":"#65717b","type":"string"},{"key":"accent","label":"强调色与链接（HEX，如 #26323d）","value":"#2f698a","type":"string"},{"key":"border","label":"边框与分隔线（HEX，如 #26323d）","value":"#e3e7e8","type":"string"},{"key":"background","label":"页面背景（HEX，如 #26323d）","value":"#ffffff","type":"string"},{"key":"soft","label":"浅色背景（HEX，如 #26323d）","value":"#f3f6f7","type":"string"}]},{"key":"layout","fields":[{"key":"width","label":"内容最大宽度 (px)","value":1020,"unit":"px","min":640,"max":2400,"type":"number"},{"key":"gutter","label":"页面左右留白 (px)","value":34,"unit":"px","min":0,"max":600,"type":"number"},{"key":"sectionTop","label":"模块顶部间距 (px)","value":32,"unit":"px","min":0,"max":600,"type":"number"},{"key":"sectionBottom","label":"模块底部间距 (px)","value":36,"unit":"px","min":0,"max":600,"type":"number"},{"key":"columnGap","label":"列间距 (px)","value":48,"unit":"px","min":0,"max":600,"type":"number"},{"key":"borderWidth","label":"分隔线宽度 (px)","value":1,"unit":"px","min":0,"max":10,"type":"number"},{"key":"radius","label":"通用圆角 (px)","value":4,"unit":"px","min":0,"max":600,"type":"number"},{"key":"headingGap","label":"标题与内容间距 (px)","value":22,"unit":"px","min":0,"max":600,"type":"number"}]},{"key":"navigation","fields":[{"key":"fontSize","label":"导航字号 (px)","value":15,"unit":"px","min":0,"max":600,"type":"number"},{"key":"height","label":"导航栏最小高度 (px)","value":78,"unit":"px","min":0,"max":600,"type":"number"},{"key":"gap","label":"导航项目间距 (px)","value":27,"unit":"px","min":0,"max":600,"type":"number"},{"key":"logoSize","label":"左上角头像 Logo 尺寸 (px)","value":31,"unit":"px","min":0,"max":600,"type":"number"},{"key":"activeWeight","label":"选中项目字重","value":650,"unit":"","min":100,"max":900,"type":"number"},{"key":"buttonSize","label":"语言按钮字号 (px)","value":12,"unit":"px","min":0,"max":600,"type":"number"},{"key":"buttonRadius","label":"语言按钮圆角 (px)","value":4,"unit":"px","min":0,"max":600,"type":"number"}]},{"key":"profile","fields":[{"key":"avatarSize","label":"头像尺寸 (px)","value":154,"unit":"px","min":0,"max":600,"type":"number"},{"key":"avatarRadius","label":"头像圆角 (%)","value":50,"unit":"%","min":0,"max":50,"type":"number"},{"key":"imageFit","label":"头像裁剪","value":"cover","type":"select","values":["cover","contain"]},{"key":"top","label":"头像区域顶部间距 (px)","value":54,"unit":"px","min":0,"max":600,"type":"number"},{"key":"bottom","label":"头像区域底部间距 (px)","value":46,"unit":"px","min":0,"max":600,"type":"number"},{"key":"contactSize","label":"邮箱与电话字号 (px)","value":15,"unit":"px","min":0,"max":600,"type":"number"},{"key":"iconSize","label":"联系方式图标尺寸 (px)","value":18,"unit":"px","min":0,"max":600,"type":"number"},{"key":"iconGap","label":"图标与文字间距 (px)","value":9,"unit":"px","min":0,"max":600,"type":"number"},{"key":"contactTop","label":"头像与联系方式间距 (px)","value":18,"unit":"px","min":0,"max":600,"type":"number"},{"key":"contactGap","label":"多条联系方式间距 (px)","value":9,"unit":"px","min":0,"max":600,"type":"number"}]},{"key":"text","fields":[{"key":"imageSize","label":"About Me 图片尺寸 (px)","value":154,"unit":"px","min":0,"max":600,"type":"number"},{"key":"imageRadius","label":"About Me 图片圆角 (%)","value":50,"unit":"%","min":0,"max":50,"type":"number"},{"key":"imageGap","label":"About Me 图片与文字间距 (px)","value":48,"unit":"px","min":0,"max":600,"type":"number"},{"key":"otherImageHeight","label":"其他文字模块图片最大高度 (px)","value":340,"unit":"px","min":0,"max":600,"type":"number"},{"key":"lineLimit","label":"文字行数上限（0 为全部显示）","value":0,"unit":"","min":0,"max":200,"type":"number"}]},{"key":"education","fields":[{"key":"labelWeight","label":"分类名称字重","value":650,"unit":"","min":100,"max":900,"type":"number"},{"key":"logoSize","label":"学校 Logo 区域尺寸 (px)","value":300,"unit":"px","min":0,"max":600,"type":"number"},{"key":"logoFit","label":"Logo 图片适应方式","value":"contain","type":"select","values":["contain","cover"]},{"key":"logoRadius","label":"Logo 圆角 (px)","value":0,"unit":"px","min":0,"max":600,"type":"number"},{"key":"columnGap","label":"Logo 与文字间距 (px)","value":40,"unit":"px","min":0,"max":600,"type":"number"},{"key":"textWidth","label":"文字区域最大宽度 (px)","value":580,"unit":"px","min":200,"max":1600,"type":"number"},{"key":"fieldGap","label":"每行内容间距 (px)","value":7,"unit":"px","min":0,"max":600,"type":"number"},{"key":"entryPadding","label":"每所学校上下间距 (px)","value":25,"unit":"px","min":0,"max":600,"type":"number"},{"key":"bulletSize","label":"分类圆点尺寸 (px)","value":6,"unit":"px","min":0,"max":600,"type":"number"},{"key":"bulletGap","label":"圆点与内容间距 (px)","value":12,"unit":"px","min":0,"max":600,"type":"number"}]},{"key":"publications","fields":[{"key":"titleGap","label":"标题下方间距 (px)","value":10,"unit":"px","min":0,"max":600,"type":"number"},{"key":"entryPadding","label":"每篇论文上下间距 (px)","value":24,"unit":"px","min":0,"max":600,"type":"number"},{"key":"numberSize","label":"论文序号字号 (px)","value":13,"unit":"px","min":0,"max":600,"type":"number"},{"key":"numberWidth","label":"序号区域宽度 (px)","value":42,"unit":"px","min":0,"max":600,"type":"number"},{"key":"numberGap","label":"序号与标题间距 (px)","value":22,"unit":"px","min":0,"max":600,"type":"number"},{"key":"columns","label":"论文列数","value":1,"unit":"","min":1,"max":3,"type":"number"}]},{"key":"news","fields":[{"key":"entryGap","label":"新闻条目间距 (px)","value":52,"unit":"px","min":0,"max":600,"type":"number"},{"key":"dateGap","label":"日期与内容间距 (px)","value":18,"unit":"px","min":0,"max":600,"type":"number"},{"key":"bulletSize","label":"日期前方块尺寸 (px)","value":7,"unit":"px","min":0,"max":600,"type":"number"},{"key":"imageWidth","label":"图片最大宽度 (px)","value":680,"unit":"px","min":50,"max":1800,"type":"number"},{"key":"imageHeight","label":"图片最大高度 (px)","value":420,"unit":"px","min":0,"max":600,"type":"number"},{"key":"imageRadius","label":"新闻图片圆角 (px)","value":2,"unit":"px","min":0,"max":600,"type":"number"}]},{"key":"cards","fields":[{"key":"columns","label":"卡片列数","value":2,"unit":"","min":1,"max":4,"type":"number"},{"key":"padding","label":"卡片内边距 (px)","value":20,"unit":"px","min":0,"max":600,"type":"number"},{"key":"gap","label":"卡片间距 (px)","value":48,"unit":"px","min":0,"max":600,"type":"number"},{"key":"imageHeight","label":"卡片图片最大高度 (px)","value":340,"unit":"px","min":0,"max":600,"type":"number"}]},{"key":"links","fields":[{"key":"columns","label":"链接卡片列数","value":2,"unit":"","min":1,"max":4,"type":"number"},{"key":"iconSize","label":"图标区域尺寸 (px)","value":40,"unit":"px","min":0,"max":600,"type":"number"},{"key":"iconGlyphSize","label":"图标本体尺寸 (px)","value":22,"unit":"px","min":0,"max":600,"type":"number"},{"key":"padding","label":"链接卡片内边距 (px)","value":15,"unit":"px","min":0,"max":600,"type":"number"},{"key":"gap","label":"链接卡片间距 (px)","value":12,"unit":"px","min":0,"max":600,"type":"number"}]},{"key":"footer","fields":[{"key":"fontSize","label":"页脚字号 (px)","value":10,"unit":"px","min":0,"max":600,"type":"number"},{"key":"padding","label":"页脚上下内边距 (px)","value":20,"unit":"px","min":0,"max":600,"type":"number"},{"key":"alignment","label":"页脚文字对齐","value":"left","type":"select","values":["left","center","right","justify"]}]},{"key":"mobile","fields":[{"key":"gutter","label":"页面左右留白 (px)","value":16,"unit":"px","min":0,"max":600,"type":"number"},{"key":"headingSize","label":"模块标题字号 (px)","value":28,"unit":"px","min":0,"max":600,"type":"number"},{"key":"navigationSize","label":"导航字号 (px)","value":14,"unit":"px","min":0,"max":600,"type":"number"},{"key":"avatarSize","label":"头像尺寸 (px)","value":100,"unit":"px","min":0,"max":600,"type":"number"},{"key":"aboutImageSize","label":"About Me 图片尺寸 (px)","value":76,"unit":"px","min":0,"max":600,"type":"number"},{"key":"educationLogoSize","label":"学校 Logo 尺寸 (px)","value":132,"unit":"px","min":0,"max":600,"type":"number"},{"key":"cardColumns","label":"卡片列数","value":1,"unit":"","min":1,"max":2,"type":"number"},{"key":"linkColumns","label":"主页链接列数","value":1,"unit":"","min":1,"max":2,"type":"number"},{"key":"bodySize","label":"Mobile body size (px) / 手机端正文字号 (px)","value":18,"unit":"px","min":10,"max":40,"type":"number"},{"key":"itemSize","label":"Mobile entry title size (px) / 手机端条目标题字号 (px)","value":22,"unit":"px","min":12,"max":60,"type":"number"},{"key":"metadataSize","label":"Mobile metadata size (px) / 手机端信息文字字号 (px)","value":18,"unit":"px","min":10,"max":40,"type":"number"}]}];
  for (const group of settings) {
    const values = theme[group.key];
    if (!values || typeof values !== 'object') continue;
    for (const field of group.fields) {
      const value = values[field.key];
      if (value === undefined || value === null || value === '') continue;
      const variable = '--appearance-' + group.key + '-' + field.key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
      if (field.type === 'number') {
        const number = Number(value);
        if (Number.isFinite(number)) root.style.setProperty(variable, Math.min(field.max, Math.max(field.min, number)) + field.unit);
      } else if (field.values) {
        if (field.values.includes(value)) root.style.setProperty(variable, value);
      } else if (group.key === 'colors') {
        if (/^#[0-9a-f]{6}$/i.test(value)) root.style.setProperty(variable, value);
      } else {
        const font = String(value).replace(/[^a-z0-9 ,"'_-]/gi, '');
        if (font) root.style.setProperty(variable, font);
      }
    }
  }
  // Font families are fixed; Pages CMS exposes font sizes only.
  root.style.setProperty('--sans', '"Times New Roman", Times, serif');
  root.style.setProperty('--serif', 'Georgia, serif');
  root.style.setProperty('--appearance-typography-body-font', '"Times New Roman", Times, serif');
  root.style.setProperty('--appearance-typography-heading-font', 'Georgia, serif');
  root.style.setProperty('--appearance-news-font', '"Times New Roman", Times, serif');
  if (theme.typography) {
    root.style.setProperty('--base-font-size', 'var(--appearance-typography-body-size, 18px)');
  }
  const limit = Number(theme.text?.lineLimit);
  root.classList.toggle('appearance-limit-text', Number.isFinite(limit) && limit > 0);
}

function applyPageAppearance() {
  const root = document.documentElement;
  const page = theme.pageAppearance?.[activePage]?.spacing || {};
  for (const key of ['top', 'bottom']) {
    const variable = '--appearance-page-' + key;
    root.style.removeProperty(variable);
    const value = page[key];
    if (value === null || value === undefined || value === '') continue;
    const number = Number(value);
    if (Number.isFinite(number)) root.style.setProperty(variable, Math.max(0, Math.min(600, number)) + 'px');
  }
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
    setCircularFavicon(avatarUrl);
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
  applyAppearance();
  applyPageAppearance();
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
  theme = appearanceSettings(appearance);
  theme.pageAppearance = appearance.mainPages || {};
  sections = Array.isArray(page.sections) ? page.sections : [];
  navigation = Array.isArray(nav.items) ? nav.items : [];
  const allowed = new Set(navigation.map((item) => item.key));
  activePage = resolvePage(window.location.pathname, window.location.search, allowed, navigation[0]?.key || 'profile');
  const cleanUrl = new URL(window.location.href);
  cleanUrl.pathname = pagePath(activePage);
  cleanUrl.searchParams.delete('page');
  if (cleanUrl.href !== window.location.href) history.replaceState(null, '', cleanUrl);
  render();
}).catch((error) => console.error(error));

langToggle.addEventListener('click', () => {
  language = language === 'en' ? 'zh' : 'en';
  render();
});
