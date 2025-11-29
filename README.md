# HTML Styles Cleaner

A browser-based PWA tool that strips inline CSS styles, JavaScript, and class attributes from HTML documents.

🌐 **Live Demo:** [htmlcleaner.pubino.eu](https://htmlcleaner.pubino.eu)

## Features

- **Remove inline styles** - Strips `style` attributes and legacy styling attributes (`bgcolor`, `align`, `width`, etc.)
- **Remove JavaScript** - Removes `<script>` tags and all `on*` event handlers
- **Remove CSS** - Strips `<style>` tags and stylesheet links
- **Remove classes** - Optionally remove all `class` attributes
- **Remove data-* attributes** - Optionally strip custom data attributes
- **Remove comments** - Optionally clean HTML comments
- **Auto-convert** - Instant cleaning for inputs under 5,000 characters
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

> **Note:** Convert the SVG files to PNG before deployment. The icon PNGs should be square, and og-image.png should be 1200x630 pixels.

## License

MIT

## Author

[Pubino](https://pubino.eu)
