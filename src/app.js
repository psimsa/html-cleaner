/**
 * HTML Styles Cleaner - Application logic
 * Handles UI interactions, auto-conversion, and PWA installation
 */

(function() {
    'use strict';
    
    const AUTO_CONVERT_THRESHOLD = 5000;
    let debounceTimer = null;
    let isProcessing = false;
    let deferredInstallPrompt = null;
    
    const elements = {
        input: document.getElementById('input'),
        output: document.getElementById('output'),
        outputLabel: document.getElementById('outputLabel'),
        markdownOutput: document.getElementById('markdownOutput'),
        inputCount: document.getElementById('inputCount'),
        outputCount: document.getElementById('outputCount'),
        convertBtn: document.getElementById('convertBtn'),
        clearBtn: document.getElementById('clearBtn'),
        pasteBtn: document.getElementById('pasteBtn'),
        copyBtn: document.getElementById('copyBtn'),
        toggleOutputBtn: document.getElementById('toggleOutputBtn'),
        toggleOutputLabel: document.getElementById('toggleOutputLabel'),
        downloadBtn: document.getElementById('downloadBtn'),
        autoConvert: document.getElementById('autoConvert'),
        removeComments: document.getElementById('removeComments'),
        removeDataAttrs: document.getElementById('removeDataAttrs'),
        removeClasses: document.getElementById('removeClasses'),
        progressContainer: document.getElementById('progressContainer'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        toast: document.getElementById('toast'),
        installBtn: document.getElementById('installBtn')
    };

    let outputMode = 'html';
    let markdownConverter = null;
    
    function formatNumber(num) {
        return num.toLocaleString();
    }
    
    function updateCharCount(textarea, countElement) {
        const count = textarea.value.length;
        countElement.textContent = `${formatNumber(count)} characters`;
    }

    function updateOutputCount() {
        updateCharCount(getActiveOutput(), elements.outputCount);
    }
    
    function showToast(message, type = 'info', duration = 3000) {
        elements.toast.textContent = message;
        elements.toast.className = `toast ${type}`;
        elements.toast.hidden = false;
        
        requestAnimationFrame(() => {
            elements.toast.classList.add('show');
        });
        
        setTimeout(() => {
            elements.toast.classList.remove('show');
            setTimeout(() => {
                elements.toast.hidden = true;
            }, 300);
        }, duration);
    }
    
    function showProgress(show) {
        elements.progressContainer.hidden = !show;
        if (show) {
            elements.progressFill.style.width = '0%';
            elements.progressText.textContent = 'Starting...';
        }
    }
    
    function updateProgress(percent, processed, total) {
        elements.progressFill.style.width = `${percent}%`;
        elements.progressText.textContent = `${formatNumber(processed)} / ${formatNumber(total)} elements`;
    }
    
    function getOptions() {
        return {
            removeComments: elements.removeComments.checked,
            removeDataAttrs: elements.removeDataAttrs.checked,
            removeClasses: elements.removeClasses.checked
        };
    }

    function updateOutputMode(mode) {
        outputMode = mode;
        const isMarkdown = mode === 'markdown';
        elements.output.hidden = isMarkdown;
        elements.markdownOutput.hidden = !isMarkdown;
        elements.toggleOutputLabel.textContent = isMarkdown ? 'View HTML' : 'View Markdown';
        elements.outputLabel.textContent = isMarkdown ? 'Markdown' : 'Cleaned HTML';
        elements.toggleOutputBtn.setAttribute('aria-pressed', String(isMarkdown));
    }

    function getActiveOutput() {
        return outputMode === 'markdown' ? elements.markdownOutput : elements.output;
    }
    
    function setProcessing(processing) {
        isProcessing = processing;
        document.body.classList.toggle('processing', processing);
        elements.convertBtn.disabled = processing;
    }
    
    async function performConversion(showProgressBar = false) {
        const html = elements.input.value;
        
        if (!html.trim()) {
            elements.output.value = '';
            elements.markdownOutput.value = '';
            updateOutputCount();
            updateOutputButtons();
            return;
        }
        
        const options = getOptions();
        
        if (showProgressBar) {
            setProcessing(true);
            showProgress(true);
            
            try {
                const result = await HTMLCleaner.cleanAsync(html, options, updateProgress);
                elements.output.value = result;
                elements.markdownOutput.value = convertHtmlToMarkdown(result);
            } catch (error) {
                console.error('Cleaning error:', error);
                showToast('Error processing HTML. The input may be malformed.', 'error');
                elements.output.value = '';
                elements.markdownOutput.value = '';
            } finally {
                setProcessing(false);
                setTimeout(() => showProgress(false), 500);
            }
        } else {
            try {
                const result = HTMLCleaner.clean(html, options);
                elements.output.value = result;
                elements.markdownOutput.value = convertHtmlToMarkdown(result);
            } catch (error) {
                console.error('Cleaning error:', error);
                showToast('Error processing HTML', 'error');
                elements.output.value = '';
                elements.markdownOutput.value = '';
            }
        }

        updateOutputCount();
        updateOutputButtons();
    }
    
    function handleInputChange() {
        updateCharCount(elements.input, elements.inputCount);
        
        if (!elements.autoConvert.checked) {
            return;
        }
        
        const length = elements.input.value.length;
        
        if (length <= AUTO_CONVERT_THRESHOLD) {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            
            debounceTimer = setTimeout(() => {
                performConversion(false);
            }, 150);
        }
    }
    
    function handleConvertClick() {
        if (isProcessing) return;
        
        const length = elements.input.value.length;
        const showProgress = length > AUTO_CONVERT_THRESHOLD;
        performConversion(showProgress);
    }
    
    function handleClear() {
        elements.input.value = '';
        elements.output.value = '';
        elements.markdownOutput.value = '';
        updateCharCount(elements.input, elements.inputCount);
        updateOutputCount();
        updateOutputButtons();
        elements.input.focus();
    }
    
    async function handlePaste() {
        try {
            let pasted = false;

            // Try to get HTML content first
            if (navigator.clipboard.read) {
                try {
                    const clipboardItems = await navigator.clipboard.read();
                    for (const item of clipboardItems) {
                        if (item.types.includes('text/html')) {
                            const blob = await item.getType('text/html');
                            elements.input.value = await blob.text();
                            pasted = true;
                            break;
                        }
                    }
                } catch (err) {
                    // Ignore errors here to fall back to readText
                    console.warn('Clipboard read() failed or no HTML found:', err);
                }
            }

            if (!pasted) {
                const text = await navigator.clipboard.readText();
                elements.input.value = text;
            }

            handleInputChange();
            showToast('Pasted from clipboard', 'success');
        } catch (error) {
            console.error('Paste failed:', error);
            showToast('Unable to access clipboard', 'error');
        }
    }
    
    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(getActiveOutput().value);
            showToast('Copied to clipboard', 'success');
        } catch (error) {
            const output = getActiveOutput();
            output.select();
            document.execCommand('copy');
            showToast('Copied to clipboard', 'success');
        }
    }
    
    function handleDownload() {
        const content = getActiveOutput().value;
        if (!content) return;

        const isMarkdown = outputMode === 'markdown';
        const blob = new Blob([content], { type: isMarkdown ? 'text/markdown' : 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = isMarkdown ? 'cleaned.md' : 'cleaned.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('File downloaded', 'success');
    }
    
    function updateOutputButtons() {
        const hasOutput = getActiveOutput().value.length > 0;
        elements.copyBtn.disabled = !hasOutput;
        elements.downloadBtn.disabled = !hasOutput;
        elements.toggleOutputBtn.disabled = elements.markdownOutput.value.length === 0;
    }
    
    function handleOptionChange() {
        initMarkdownConverter();

        if (elements.autoConvert.checked && elements.input.value.length <= AUTO_CONVERT_THRESHOLD) {
            performConversion(false);
        }
    }

    function handleToggleOutput() {
        if (outputMode === 'html') {
            updateOutputMode('markdown');
        } else {
            updateOutputMode('html');
        }
        updateOutputCount();
        updateOutputButtons();
    }
    
    async function handleInstall() {
        if (!deferredInstallPrompt) return;
        
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        
        if (outcome === 'accepted') {
            showToast('App installed!', 'success');
        }
        
        deferredInstallPrompt = null;
        elements.installBtn.hidden = true;
    }
    
    function initEventListeners() {
        elements.input.addEventListener('input', handleInputChange);
        elements.convertBtn.addEventListener('click', handleConvertClick);
        elements.clearBtn.addEventListener('click', handleClear);
        elements.pasteBtn.addEventListener('click', handlePaste);
        elements.copyBtn.addEventListener('click', handleCopy);
        elements.toggleOutputBtn.addEventListener('click', handleToggleOutput);
        elements.downloadBtn.addEventListener('click', handleDownload);
        elements.installBtn.addEventListener('click', handleInstall);
        
        elements.removeComments.addEventListener('change', handleOptionChange);
        elements.removeDataAttrs.addEventListener('change', handleOptionChange);
        elements.removeClasses.addEventListener('change', handleOptionChange);
        elements.autoConvert.addEventListener('change', handleOptionChange);
        
        elements.input.addEventListener('paste', () => {
            setTimeout(handleInputChange, 0);
        });
        
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleConvertClick();
            }
        });
    }
    
    function initPWA() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            elements.installBtn.hidden = false;
        });
        
        window.addEventListener('appinstalled', () => {
            deferredInstallPrompt = null;
            elements.installBtn.hidden = true;
        });
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('SW registered:', registration.scope);
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        }
    }
    
    function init() {
        initEventListeners();
        initPWA();
        updateCharCount(elements.input, elements.inputCount);
        updateOutputCount();
        updateOutputButtons();
        updateOutputMode('html');
        initMarkdownConverter();
    }

    function initMarkdownConverter() {
        if (markdownConverter || typeof TurndownService === 'undefined') {
            return;
        }

        markdownConverter = new TurndownService({
            codeBlockStyle: 'fenced',
            headingStyle: 'atx',
            emDelimiter: '*'
        });

        if (typeof turndownPluginGfm !== 'undefined') {
            if (turndownPluginGfm.gfm) {
                markdownConverter.use(turndownPluginGfm.gfm);
            } else if (turndownPluginGfm.tables) {
                markdownConverter.use(turndownPluginGfm.tables);
            }
        }

        markdownConverter.addRule('tableFallback', {
            filter: 'table',
            replacement: (content, node) => buildMarkdownTable(node)
        });

        markdownConverter.addRule('preserveLineBreaks', {
            filter: 'br',
            replacement: () => '  \n'
        });
    }

    function buildMarkdownTable(table) {
        if (!table || !table.querySelectorAll) {
            return '';
        }

        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length === 0) {
            return '';
        }

        const tableRows = rows.map(row => Array.from(row.querySelectorAll('th, td'))
            .map(cell => escapeTableCell(cell.textContent || '')));

        const header = tableRows[0] || [];
        const columnCount = Math.max(1, header.length);
        const headerRow = `| ${padCells(header, columnCount).join(' | ')} |`;
        const separatorRow = `| ${Array.from({ length: columnCount }).map(() => '---').join(' | ')} |`;

        const bodyRows = tableRows.slice(1).map(row => `| ${padCells(row, columnCount).join(' | ')} |`);

        return [headerRow, separatorRow, ...bodyRows].join('\n');
    }

    function padCells(row, count) {
        const cells = row.slice(0, count);
        while (cells.length < count) {
            cells.push('');
        }
        return cells;
    }

    function escapeTableCell(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\|/g, '\\|')
            .trim();
    }

    function convertHtmlToMarkdown(html) {
        initMarkdownConverter();

        if (!markdownConverter) {
            showToast('Markdown converter not available', 'error');
            return '';
        }

        const normalizedHtml = normalizeTablesForMarkdown(html);
        return markdownConverter.turndown(normalizedHtml);
    }

    function normalizeTablesForMarkdown(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const cells = doc.querySelectorAll('td, th');

        for (const cell of cells) {
            const paragraphs = Array.from(cell.querySelectorAll('p'));
            for (const paragraph of paragraphs) {
                const span = doc.createElement('span');
                span.innerHTML = paragraph.innerHTML;
                paragraph.replaceWith(span);
            }

            const preBlocks = Array.from(cell.querySelectorAll('pre'));
            for (const pre of preBlocks) {
                const code = pre.querySelector('code');
                const codeText = code ? code.textContent : pre.textContent;
                const inlineCode = doc.createElement('code');
                inlineCode.textContent = codeText || '';
                pre.replaceWith(inlineCode);
            }
        }

        return doc.body ? doc.body.innerHTML : html;
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
