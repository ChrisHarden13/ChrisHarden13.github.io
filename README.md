# Kexin Xiang — personal website

A responsive bilingual website published with GitHub Pages. Content and many visual settings can be edited through Pages CMS; uploaded images are stored in this repository.

## Edit the website

1. Sign in to [Pages CMS](https://app.pagescms.org/) with the GitHub account that has access to `ChrisHarden13/Portfolio`.
2. Open the `Portfolio` repository and choose **Website content**.
3. Edit profile information, English and Chinese text, publication and profile cards, links, and list items. List entries can be added, removed, and reordered.
4. In **Typography, colors, spacing, and layout**, adjust font families, hex colors, font size, line spacing, heading scale, page width, side padding, section spacing, card corners, columns, and visible text line limits.
5. In **Show or hide page modules**, turn page sections on or off.
6. In **Profile and site settings → Profile photo**, upload or select your picture. It appears in the circular area on the left. You can also change its description, circle size, and roundness.
7. Save your changes. Pages CMS commits them to GitHub, and GitHub Pages republishes the site.

Rich-text fields support formatted text, hyperlinks, and inline image uploads. Publication, affiliation, and profile cards also have dedicated link and image fields. Colors are entered as six-digit hex values (for example, `#2f698a`). Images uploaded through the CMS are kept under `assets/` in the repository.

## Preview locally

Serve this folder with any static file server. Opening `index.html` directly may prevent the browser from loading `data/content.json`.

## Site files

- `.pages.yml` defines the Pages CMS editor fields and image storage.
- `data/content.json` contains editable page content and design settings.
- `style.css` and `script.js` render the theme and content.

