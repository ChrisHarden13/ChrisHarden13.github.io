# Kexin Xiang — personal website

The bilingual static site is published with GitHub Pages. Its information is organized around the public profile links and the biography attached to the 2026 publication; CV content is not used.

## Visual editing with Pages CMS

1. Sign in to [Pages CMS](https://app.pagescms.org/) with the GitHub account that can edit `ChrisHarden13/Portfolio`.
2. Open **Website editor**. The left menu separates **Profile and homepage**, **Global appearance**, and **Page modules**.
3. In **Page modules**, add, remove, and drag modules to reorder them. Select a module category: text/biography/research, publications, public links, or custom cards/experience/news.
4. Each module has editable English and Chinese names/headings. Toggle page visibility and whether it appears in navigation. Rich-text fields support formatting, links, and inline images.
5. Add, remove, or reorder publication, link, and card entries inside their modules. Edit their titles, descriptions, URLs, and images.
6. Upload your portrait under **Profile and homepage → Left circular photo**. It replaces the initials in the circular area on the left.
7. Change fonts, six-digit hex colors, text size, line spacing, page width, section spacing, columns, text line limits, and portrait shape under **Global appearance**.
8. Save. Pages CMS commits your changes to GitHub, then GitHub Pages republishes the site.

## Site data and design

- `data/site.json`: name, photo, optional contact email, homepage labels, and footer text.
- `data/style.json`: global typography, colors, spacing, and layout settings.
- `data/modules.json`: ordered, editable page modules and their entries.
- `.pages.yml`: visual editor categories, module types, and image upload paths.
- `index.html`, `style.css`, and `script.js`: page structure, styling, and rendering.

The public profile links are Google Scholar, ORCID, LinkedIn, and GitHub. The biography and publication information come from the [public Advanced Materials article associated with the supplied ORCID](https://advanced.onlinelibrary.wiley.com/doi/10.1002/adma.202515532). Third-party profile pages may restrict automated access, so the site does not infer unpublished details from them.

