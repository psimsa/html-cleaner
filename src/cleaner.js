/**
 * HTML Cleaner - Core cleaning logic
 * Strips inline CSS styles, style tags, script tags, and event handlers from HTML
 * Uses DOMParser for robust, standards-compliant parsing
 */

const HTMLCleaner = (() => {
    const STYLE_ATTRIBUTES = ['style', 'bgcolor', 'color', 'face', 'size', 'align', 'valign', 'width', 'height', 'border', 'cellpadding', 'cellspacing'];
    const EVENT_ATTRIBUTES_PATTERN = /^on[a-z]+$/i;
    const CHUNK_SIZE = 100;
    const YIELD_INTERVAL = 50;
    const CLASS_ATTRIBUTE = 'class';

    function isEventAttribute(attrName) {
        return EVENT_ATTRIBUTES_PATTERN.test(attrName);
    }

    function cleanElement(element, options) {
        const attrsToRemove = [];
        
        for (const attr of element.attributes) {
            const name = attr.name.toLowerCase();
            
            if (STYLE_ATTRIBUTES.includes(name)) {
                attrsToRemove.push(attr.name);
                continue;
            }
            
            if (isEventAttribute(name)) {
                attrsToRemove.push(attr.name);
                continue;
            }
            
            if (options.removeDataAttrs && name.startsWith('data-')) {
                attrsToRemove.push(attr.name);
                continue;
            }
            
            if (name === CLASS_ATTRIBUTE) {
                if (options.removeClasses || attr.value.trim() === '') {
                    attrsToRemove.push(attr.name);
                }
                continue;
            }
        }
        
        for (const attrName of attrsToRemove) {
            element.removeAttribute(attrName);
        }
    }

    function removeUnwantedElements(doc, options) {
        const selectorsToRemove = ['style', 'script', 'link[rel="stylesheet"]'];
        
        for (const selector of selectorsToRemove) {
            const elements = doc.querySelectorAll(selector);
            for (const el of elements) {
                el.remove();
            }
        }
        
        if (options.removeComments) {
            removeComments(doc);
        }
    }

    function removeComments(node) {
        const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_COMMENT,
            null,
            false
        );
        
        const comments = [];
        while (walker.nextNode()) {
            comments.push(walker.currentNode);
        }
        
        for (const comment of comments) {
            comment.remove();
        }
    }

    function isFragment(html) {
        const trimmed = html.trim().toLowerCase();
        return !trimmed.startsWith('<!doctype') && !trimmed.startsWith('<html');
    }

    function serializeDocument(doc, wasFragment) {
        if (wasFragment) {
            return doc.body ? doc.body.innerHTML : '';
        }
        
        let result = '';
        
        if (doc.doctype) {
            result = `<!DOCTYPE ${doc.doctype.name}>\n`;
        }
        
        if (doc.documentElement) {
            result += doc.documentElement.outerHTML;
        }
        
        return result;
    }


    async function cleanAsync(html, options = {}, onProgress = null) {
        const opts = {
            removeComments: options.removeComments ?? false,
            removeDataAttrs: options.removeDataAttrs ?? false,
            removeClasses: options.removeClasses ?? false
        };
        
        if (!html || typeof html !== 'string') {
            return '';
        }
        
        const trimmedHtml = html.trim();
        if (!trimmedHtml) {
            return '';
        }
        
        const wasFragment = isFragment(trimmedHtml);
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(trimmedHtml, 'text/html');
        
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            console.warn('HTML parsing had issues, attempting to clean anyway');
        }
        
        removeUnwantedElements(doc, opts);
        
        const allElements = doc.querySelectorAll('*');
        const totalElements = allElements.length;
        
        if (totalElements === 0) {
            return serializeDocument(doc, wasFragment);
        }
        
        let processed = 0;
        
        for (let i = 0; i < totalElements; i++) {
            cleanElement(allElements[i], opts);
            processed++;
            
            if (onProgress && i % CHUNK_SIZE === 0) {
                const progress = Math.round((processed / totalElements) * 100);
                onProgress(progress, processed, totalElements);
                
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        if (onProgress) {
            onProgress(100, totalElements, totalElements);
        }
        
        return serializeDocument(doc, wasFragment);
    }

    function cleanSync(html, options = {}) {
        const opts = {
            removeComments: options.removeComments ?? false,
            removeDataAttrs: options.removeDataAttrs ?? false,
            removeClasses: options.removeClasses ?? false
        };
        
        if (!html || typeof html !== 'string') {
            return '';
        }
        
        const trimmedHtml = html.trim();
        if (!trimmedHtml) {
            return '';
        }
        
        const wasFragment = isFragment(trimmedHtml);
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(trimmedHtml, 'text/html');
        
        removeUnwantedElements(doc, opts);
        
        const allElements = doc.querySelectorAll('*');
        for (const element of allElements) {
            cleanElement(element, opts);
        }
        
        return serializeDocument(doc, wasFragment);
    }

    return {
        clean: cleanSync,
        cleanAsync,
        isFragment
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HTMLCleaner;
}
