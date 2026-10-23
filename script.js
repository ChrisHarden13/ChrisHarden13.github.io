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

function setRichText(element, text) {
  const parts = String(text ?? '').split(/<br\s*\/?\s*>/i);
  element.replaceChildren();
  parts.forEach((part, index) => {
    if (index) element.append(document.createElement('br'));
    element.append(document.createTextNode(part));
  });
}

function applyTranslations() {
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-copy]').forEach((element) => {
    const text = translations.get(element.dataset.copy)?.[language];
    if (typeof text === 'string') setRichText(element, text);
  });
  toggle.textContent = language === 'en' ? '中文' : 'EN';
  toggle.setAttribute('aria-label', language === 'en' ? 'Switch language to Chinese' : 'Switch language to English');
}

function renderSite() {
  const site = content.site;
  document.title = site.pageTitle;
  document.querySelector('meta[name="description"]').content = site.pageDescription;
  document.querySelector('[data-site="firstName"]').textContent = site.firstName;
  document.querySelector('[data-site="lastName"]').textContent = site.lastName;
  document.querySelectorAll('.wordmark-name').forEach((element) => {
    element.textContent = `${site.firstName} ${site.lastName}`.toUpperCase();
  });
  document.querySelector('[data-site="schoolShort"]').textContent = site.schoolShort;
  document.querySelector('#profile-monogram').textContent = `${site.firstName.slice(0, 1)}${site.lastName.slice(0, 1)}`.toUpperCase();
  document.querySelectorAll('[data-site-mail]').forEach((element) => {
    if (site.email) element.href = `mailto:${site.email}`;
    else element.hidden = true;
  });
  document.querySelector('[data-site="email"]').textContent = site.email;
  renderProfiles();
  document.querySelector('[data-site="institution"]').textContent = content.education.institution;
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
  applyTranslations();
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
    addText(item, 'small', '', language === 'en' ? stat.labelEn : stat.labelZh);
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
      link.href = project.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = title.textContent;
      title.replaceChildren(link);
    }
    const supervisor = language === 'en' ? project.supervisorEn : project.supervisorZh;
    if (supervisor) addText(main, 'p', 'supervisor', supervisor);
    addText(main, 'p', '', language === 'en' ? project.descriptionEn : project.descriptionZh);
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
  document.querySelector('[data-site-lang="location"]').textContent = language === 'en' ? education.locationEn : education.locationZh;
  document.querySelector('[data-site-lang="department"]').textContent = language === 'en' ? education.departmentEn : education.departmentZh;
  document.querySelector('[data-site-lang="program"]').textContent = language === 'en' ? education.programEn : education.programZh;
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
      paragraph.append(document.createTextNode(line));
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
      link.href = honor.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = title.textContent;
      title.replaceChildren(link);
    }
    addText(description, 'p', '', language === 'en' ? honor.detailEn : honor.detailZh);
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

