const toggle = document.querySelector('#lang-toggle');
let language = 'en';
let content;
let translations = new Map();

function addText(parent, tag, className, text) {
  const child = document.createElement(tag);
  if (className) child.className = className;
  child.textContent = text ?? '';
  parent.append(child);
  return child;
}

function safePublicUrl(value) {
  try {
    const url = new URL(value, window.location.href);
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return url.href;
  } catch {}
  return '';
}

function appendInlineMarkdown(parent, text) {
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)|\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
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
        if (/^https?:/i.test(href)) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        link.textContent = match[4];
        parent.append(link);
      } else parent.append(document.createTextNode(match[0]));
    } else if (match[7] !== undefined) {
      const strong = document.createElement('strong');
      strong.textContent = match[7];
      parent.append(strong);
    } else {
      const emphasis = document.createElement('em');
      emphasis.textContent = match[8];
      parent.append(emphasis);
    }
    cursor = index + match[0].length;
  }
  if (cursor < text.length) parent.append(document.createTextNode(text.slice(cursor)));
}

function renderRichText(element, text) {
  const parts = String(text ?? '').split(/\r?\n/);
  element.replaceChildren();
  parts.forEach((part, index) => {
    if (index) element.append(document.createElement('br'));
    appendInlineMarkdown(element, part);
  });
}

function applyTranslations() {
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-copy]').forEach((element) => {
    const text = translations.get(element.dataset.copy)?.[language];
    if (typeof text === 'string') renderRichText(element, text);
  });
  toggle.textContent = language === 'en' ? '中文' : 'EN';
  toggle.setAttribute('aria-label', language === 'en' ? 'Switch language to Chinese' : 'Switch language to English');
}

function renderSite() {
  const site = content.site;
  document.title = site.pageTitle;
  document.querySelector('meta[name="description"]').content = site.pageDescription;
  document.querySelector('meta[name="theme-color"]').content = content.style?.colorBackground || '#ffffff';
  document.querySelector('[data-site="firstName"]').textContent = site.firstName;
  document.querySelector('[data-site="lastName"]').textContent = site.lastName;
  document.querySelectorAll('.wordmark-name').forEach((element) => {
    element.textContent = `${site.firstName} ${site.lastName}`.toUpperCase();
  });
  const heroName = document.querySelector('h1');
  if (site.nameUrl) {
    let nameLink = heroName.querySelector('a');
    if (!nameLink) {
      nameLink = document.createElement('a');
      nameLink.className = 'hero-name-link';
      while (heroName.firstChild) nameLink.append(heroName.firstChild);
      heroName.append(nameLink);
    }
    nameLink.href = safePublicUrl(site.nameUrl);
  } else {
    const nameLink = heroName.querySelector('a');
    if (nameLink) {
      while (nameLink.firstChild) heroName.insertBefore(nameLink.firstChild, nameLink);
      nameLink.remove();
    }
  }
  document.querySelector('[data-site="schoolShort"]').textContent = site.schoolShort;
  document.querySelector('#profile-location').textContent =
    language === 'en' ? site.profileLocation : site.profileLocationZh;
  const profilePhoto = document.querySelector('#profile-photo');
  const profileInitials = document.querySelector('#profile-initials');
  profileInitials.textContent = (site.monogram || `${site.firstName.slice(0, 1)}${site.lastName.slice(0, 1)}`).toUpperCase();
  profilePhoto.hidden = !site.avatar;
  profileInitials.hidden = Boolean(site.avatar);
  if (site.avatar) profilePhoto.src = safePublicUrl(site.avatar);
  profilePhoto.alt = site.avatarAlt || `Portrait of ${site.firstName} ${site.lastName}`;
  const monogram = document.querySelector('.mark');
  monogram.firstChild.textContent = (site.monogram || site.firstName.slice(0, 1)).slice(0, 1);
  document.querySelectorAll('[data-site-mail]').forEach((element) => {
    if (site.email) element.href = `mailto:${site.email}`;
    else element.hidden = true;
  });
  document.querySelectorAll('[data-site="email"]').forEach((element) => {
    element.textContent = site.email;
  });
  applyTheme();
  renderProfiles();
  document.querySelectorAll('[data-site="sealEn"]').forEach((element) => {
    element.textContent = content.education.sealEn;
  });
  document.querySelectorAll('[data-site="sealZh"]').forEach((element) => {
    element.textContent = content.education.sealZh;
  });
  renderStats();
  renderProjects();
  renderEducation();
  renderSkills();
  renderHonors();
  applyModuleVisibility();
  applyTranslations();
}

function applyModuleVisibility() {
  const modules = content.modules ?? {};
  const visibility = {
    header: document.querySelector('.topbar'),
    hero: document.querySelector('.hero'),
    heroProfileCard: document.querySelector('.profile-card'),
    about: document.querySelector('#about'),
    stats: document.querySelector('#stats-list'),
    research: document.querySelector('#research'),
    education: document.querySelector('#education'),
    skills: document.querySelector('.toolkit'),
    honors: document.querySelector('#honors'),
    contact: document.querySelector('.contact'),
    profiles: document.querySelector('#profile-links'),
    footer: document.querySelector('footer')
  };
  Object.entries(visibility).forEach(([key, element]) => {
    if (!element || !(key in modules)) return;
    element.hidden = !modules[key];
  });
}

function applyTheme() {
  const theme = content.style ?? {};
  const root = document.documentElement;
  const colors = {
    '--ink': theme.colorText,
    '--muted': theme.colorMuted,
    '--accent': theme.colorAccent,
    '--line': theme.colorBorder,
    '--paper': theme.colorBackground,
    '--soft': theme.colorSoft
  };
  Object.entries(colors).forEach(([key, value]) => {
    if (/^#[0-9a-f]{6}$/i.test(value ?? '')) root.style.setProperty(key, value);
  });
  document.querySelector('meta[name="theme-color"]').content = colors['--paper'] ?? '#ffffff';
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
    const number = Number(value);
    if (Number.isFinite(number)) root.style.setProperty(key, `${Math.min(max, Math.max(min, number))}${unit}`);
  });
  const headingScale = Math.min(1.6, Math.max(0.7, Number(theme.headingScale) || 1));
  const scaled = {
    '--h1-min': [48 * headingScale, 'px'],
    '--h1-fluid': [6.2 * headingScale, 'vw'],
    '--h1-max': [68 * headingScale, 'px'],
    '--title-min': [29 * headingScale, 'px'],
    '--title-fluid': [3.8 * headingScale, 'vw'],
    '--title-max': [39 * headingScale, 'px'],
    '--section-title-size': [35 * headingScale, 'px'],
    '--item-title-size': [22 * headingScale, 'px'],
    '--card-title-size': [27 * headingScale, 'px'],
    '--contact-title-size': [34 * headingScale, 'px'],
    '--mobile-h1-size': [55 * headingScale, 'px'],
    '--mobile-title-size': [30 * headingScale, 'px'],
    '--mobile-section-title-size': [31 * headingScale, 'px'],
    '--mobile-item-title-size': [20 * headingScale, 'px'],
    '--mobile-card-title-size': [25 * headingScale, 'px'],
    '--mobile-contact-title-size': [30 * headingScale, 'px']
  };
  Object.entries(scaled).forEach(([key, [value, unit]]) => root.style.setProperty(key, `${value}${unit}`));
}

function renderProfiles() {
  const container = document.querySelector('#profile-links');
  container.replaceChildren();
  content.profiles.forEach((profile) => {
    const link = document.createElement('a');
    link.href = profile.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = profile.label;
    container.append(link);
  });
}

function renderStats() {
  const container = document.querySelector('#stats-list');
  container.replaceChildren();
  content.stats.forEach((stat) => {
    const item = document.createElement('div');
    const value = addText(item, 'strong', '', stat.value);
    if (stat.suffix) addText(value, 'span', '', stat.suffix);
    const label = addText(item, 'small', '', '');
    renderRichText(label, language === 'en' ? stat.labelEn : stat.labelZh);
    container.append(item);
  });
}

function renderGlyph(glyph) {
  const item = document.createElement('div');
  item.className = `project-glyph glyph-${glyph}`;
  const count = glyph === 'crystal' ? 9 : glyph === 'device' ? 4 : 3;
  for (let index = 0; index < count; index += 1) item.append(document.createElement('i'));
  if (glyph === 'device') addText(item, 'b', '', '+');
  return item;
}

function renderProjects() {
  const container = document.querySelector('#project-list');
  container.replaceChildren();
  content.projects.forEach((project) => {
    const card = document.createElement('article');
    card.className = `project-card${project.glyph === 'lens' ? ' project-coursework' : ''}`;
    const number = addText(card, 'div', 'project-number', project.number);
    addText(number, 'span', '', '—');
    number.append(document.createTextNode(` ${language === 'en' ? project.categoryEn : project.categoryZh}`));
    const main = document.createElement('div');
    main.className = 'project-main';
    const title = addText(main, 'h3', '', language === 'en' ? project.titleEn : project.titleZh);
    if (project.url) {
      const link = document.createElement('a');
      link.href = safePublicUrl(project.url);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = title.textContent;
      title.replaceChildren(link);
    }
    const supervisor = language === 'en' ? project.supervisorEn : project.supervisorZh;
    if (supervisor) addText(main, 'p', 'supervisor', supervisor);
    const description = addText(main, 'p', 'rich-description', '');
    renderRichText(description, language === 'en' ? project.descriptionEn : project.descriptionZh);
    if (project.image) {
      const image = document.createElement('img');
      image.className = 'project-image';
      image.src = safePublicUrl(project.image);
      image.alt = project.imageAlt ?? '';
      image.loading = 'lazy';
      main.insertBefore(image, main.firstChild);
    }
    const tags = document.createElement('div');
    tags.className = 'tags';
    project.tags.forEach((tag) => addText(tags, 'span', '', tag));
    main.append(tags);
    card.append(main, renderGlyph(project.glyph));
    container.append(card);
  });
}

function renderEducation() {
  const education = content.education;
  const title = document.querySelector('[data-site="institution"]');
  title.replaceChildren();
  renderRichText(title, education.institution);
  if (education.institutionUrl) {
    const link = document.createElement('a');
    link.href = safePublicUrl(education.institutionUrl);
    while (title.firstChild) link.append(title.firstChild);
    title.append(link);
  }
  title.parentElement.querySelector('.institution-image')?.remove();
  if (education.image) {
    const image = document.createElement('img');
    image.className = 'institution-image';
    image.src = safePublicUrl(education.image);
    image.alt = education.imageAlt ?? '';
    image.loading = 'lazy';
    title.before(image);
  }
  renderRichText(document.querySelector('[data-site-lang="location"]'), language === 'en' ? education.locationEn : education.locationZh);
  renderRichText(document.querySelector('[data-site-lang="department"]'), language === 'en' ? education.departmentEn : education.departmentZh);
  renderRichText(document.querySelector('[data-site-lang="program"]'), language === 'en' ? education.programEn : education.programZh);
}

function renderSkills() {
  const container = document.querySelector('#skill-list');
  container.replaceChildren();
  content.skills.forEach((group) => {
    const section = document.createElement('div');
    section.className = 'skill-group';
    addText(section, 'span', '', language === 'en' ? group.titleEn : group.titleZh);
    const paragraph = document.createElement('p');
    const lines = group.lines ?? (language === 'en' ? group.linesEn : group.linesZh);
    lines.forEach((line, index) => {
      if (index) paragraph.append(document.createElement('br'));
      appendInlineMarkdown(paragraph, line);
    });
    section.append(paragraph);
    container.append(section);
  });
}

function renderHonors() {
  const container = document.querySelector('#honor-grid');
  container.replaceChildren();
  content.honors.forEach((honor) => {
    const article = document.createElement('article');
    if (honor.wide) article.classList.add('honor-wide');
    addText(article, 'span', 'honor-year', honor.year);
    const description = document.createElement('div');
    const title = addText(description, 'h3', '', language === 'en' ? honor.titleEn : honor.titleZh);
    if (honor.url) {
      const link = document.createElement('a');
      link.href = safePublicUrl(honor.url);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      while (title.firstChild) link.append(title.firstChild);
      title.replaceChildren(link);
    }
    if (honor.image) {
      const image = document.createElement('img');
      image.className = 'honor-image';
      image.src = safePublicUrl(honor.image);
      image.alt = honor.imageAlt ?? '';
      image.loading = 'lazy';
      description.prepend(image);
    }
    const detail = addText(description, 'p', 'rich-description', '');
    renderRichText(detail, language === 'en' ? honor.detailEn : honor.detailZh);
    article.append(description);
    addText(article, 'span', 'honor-arrow', '↗');
    container.append(article);
  });
}

function renderLanguage() {
  if (!content) return;
  renderStats();
  renderProjects();
  renderEducation();
  renderSkills();
  renderHonors();
  document.querySelector('#profile-location').textContent =
    language === 'en' ? content.site.profileLocation : content.site.profileLocationZh;
  applyModuleVisibility();
  applyTranslations();
}

fetch('data/content.json')
  .then((response) => {
    if (!response.ok) throw new Error('Could not load editable site content.');
    return response.json();
  })
  .then((loaded) => {
    content = loaded;
    translations = new Map(content.translations.map((item) => [item.key, item]));
    renderSite();
  })
  .catch((error) => console.error(error));

toggle.addEventListener('click', () => {
  language = language === 'en' ? 'zh' : 'en';
  renderLanguage();
});

