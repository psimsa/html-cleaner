# HTML to Markdown Converter

A browser-based PWA tool that converts HTML to clean Markdown with optional HTML sanitization (strip inline CSS, JavaScript, and unwanted attributes).

🌐 **Live Demo:** [htmlcleaner.pubino.eu](https://htmlcleaner.pubino.eu)

## Features

- **Live HTML-to-Markdown conversion** - Instant real-time conversion as you type with 500ms debounce
- **Markdown as default output** - Output starts in Markdown mode; toggle to HTML view if needed
- **Fine-grained HTML sanitization** - Optionally strip inline styles, scripts, comments, classes, and data attributes
- **Remove inline styles** - Strips `style` attributes and legacy styling attributes (`bgcolor`, `align`, `width`, etc.)
- **Remove JavaScript** - Removes `<script>` tags and all `on*` event handlers
- **Remove CSS** - Strips `<style>` tags and stylesheet links
- **Remove classes** - Optionally remove all `class` attributes
- **Remove data-* attributes** - Optionally strip custom data attributes
- **Remove comments** - Optionally clean HTML comments
- **Progress indicator** - Visual feedback for large documents
- **Works offline** - Full PWA support with service worker caching
- **No server required** - All processing happens in your browser
- **Handles fragments** - Works with both full HTML documents and snippets

## Tech Stack

- Vanilla JavaScript (no dependencies)
- Native DOMParser API for robust HTML parsing
- CSS with dark mode support
- Service Worker for offline functionality

## Local Development

```bash
# Serve the src folder with any static server
npx serve src -p 3000

# Or use Python
cd src && python -m http.server 3000
```

Then open http://localhost:3000

## Deployment

The `src` folder contains all files needed for deployment. Simply deploy the contents to any static hosting:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Any web server

### Required files for deployment

```
src/
├── index.html
├── styles.css
├── cleaner.js
├── app.js
├── sw.js
├── manifest.json
├── robots.txt
├── sitemap.xml
├── icon-192.png      # Convert from icon-192.svg
├── icon-512.png      # Convert from icon-512.svg
└── og-image.png      # Convert from og-image.svg (1200x630)
```

## License

[MIT](LICENSE)
