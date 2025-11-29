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
        inputCount: document.getElementById('inputCount'),
        outputCount: document.getElementById('outputCount'),
        convertBtn: document.getElementById('convertBtn'),
        clearBtn: document.getElementById('clearBtn'),
        pasteBtn: document.getElementById('pasteBtn'),
        copyBtn: document.getElementById('copyBtn'),
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
    
    function formatNumber(num) {
        return num.toLocaleString();
    }
    
    function updateCharCount(textarea, countElement) {
        const count = textarea.value.length;
        countElement.textContent = `${formatNumber(count)} characters`;
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
    
    function setProcessing(processing) {
        isProcessing = processing;
        document.body.classList.toggle('processing', processing);
        elements.convertBtn.disabled = processing;
    }
    
    async function performConversion(showProgressBar = false) {
        const html = elements.input.value;
        
        if (!html.trim()) {
            elements.output.value = '';
            updateCharCount(elements.output, elements.outputCount);
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
            } catch (error) {
                console.error('Cleaning error:', error);
                showToast('Error processing HTML. The input may be malformed.', 'error');
                elements.output.value = '';
            } finally {
                setProcessing(false);
                setTimeout(() => showProgress(false), 500);
            }
        } else {
            try {
                const result = HTMLCleaner.clean(html, options);
                elements.output.value = result;
            } catch (error) {
                console.error('Cleaning error:', error);
                showToast('Error processing HTML', 'error');
                elements.output.value = '';
            }
        }
        
        updateCharCount(elements.output, elements.outputCount);
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
        updateCharCount(elements.input, elements.inputCount);
        updateCharCount(elements.output, elements.outputCount);
        updateOutputButtons();
        elements.input.focus();
    }
    
    async function handlePaste() {
        try {
            const text = await navigator.clipboard.readText();
            elements.input.value = text;
            handleInputChange();
            showToast('Pasted from clipboard', 'success');
        } catch (error) {
            showToast('Unable to access clipboard', 'error');
        }
    }
    
    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(elements.output.value);
            showToast('Copied to clipboard', 'success');
        } catch (error) {
            elements.output.select();
            document.execCommand('copy');
            showToast('Copied to clipboard', 'success');
        }
    }
    
    function handleDownload() {
        const content = elements.output.value;
        if (!content) return;
        
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cleaned.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('File downloaded', 'success');
    }
    
    function updateOutputButtons() {
        const hasOutput = elements.output.value.length > 0;
        elements.copyBtn.disabled = !hasOutput;
        elements.downloadBtn.disabled = !hasOutput;
    }
    
    function handleOptionChange() {
        if (elements.autoConvert.checked && elements.input.value.length <= AUTO_CONVERT_THRESHOLD) {
            performConversion(false);
        }
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
        updateCharCount(elements.output, elements.outputCount);
        updateOutputButtons();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
