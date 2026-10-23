# Kexin Xiang — personal website

A responsive, bilingual (English / Chinese) static portfolio built from the supplied CV. No build step or framework is required. Website text lives in `data/content.json`, separate from the page design.

## Preview

Serve this folder with any static file server. Because the page loads `data/content.json`, opening `index.html` directly as a local file may block the content request in some browsers.

## Publish publicly with GitHub Pages

1. Create a GitHub repository for this site and upload the **contents** of this folder to its root (including `.pages.yml` and `data/content.json`).
2. In the repository, open **Settings → Pages** and choose **Deploy from a branch**, then select the `main` branch and `/ (root)`.
3. GitHub will show the public website address in the Pages settings after publishing.

GitHub Pages publishes static HTML, CSS, and JavaScript from a repository. See the [GitHub Pages setup guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). The site uses Google Fonts when a network connection is available and falls back to local system fonts otherwise.

## Edit the website without editing code

1. Sign in to [Pages CMS](https://app.pagescms.org/) with the GitHub account that owns the repository.
2. Install its GitHub App for this repository, then open the repository in Pages CMS.
3. Choose **Website copy** to edit English and Chinese text. Save the changes; they are committed to GitHub and GitHub Pages republishes the site.

The editor configuration is in `.pages.yml`. Each text entry has an internal key connecting it to the page; leave that key unchanged. Follow the [Pages CMS quick start](https://pagescms.org/docs/quick-start/) to connect the repository.

## Before publishing

- Confirm the GPA, major ranking, IELTS score, award dates, and contact email are still appropriate to share.
- The education line is explicitly marked as recorded in the supplied CV; update it if your current status has changed.
- The phone number and street address from the CV were left off the public page.

