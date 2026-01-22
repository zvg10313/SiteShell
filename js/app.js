let currentUrl = '';
let iframeLoaded = false;
let currentScale = 100;
let customWidth = null;
let customHeight = null;
let isResizing = false;
let startY = 0;
let startHeight = 0;

const PROXY_SERVICES = {
    none: {
        name: '不使用代理',
        url: (url) => url
    },
    allorigins: {
        name: 'AllOrigins (推荐)',
        url: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    },
    corsproxy: {
        name: 'CORS Proxy',
        url: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
    },
    thingproxy: {
        name: 'ThingProxy',
        url: (url) => `https://thingproxy.freeboard.io/fetch/${url}`
    }
};

function getProxyUrl(url) {
    const proxySelector = document.getElementById('proxySelector');
    const selectedProxy = proxySelector.value;
    return PROXY_SERVICES[selectedProxy].url(url);
}

function generatePreview() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();

    if (!url) {
        alert('请输入有效的 URL');
        return;
    }

    if (!isValidUrl(url)) {
        alert('请输入有效的 URL 格式（例如：https://example.com）');
        return;
    }

    currentUrl = url;
    const browserContent = document.getElementById('browserContent');
    const urlDisplay = document.getElementById('urlDisplay');
    const generateBtn = document.getElementById('generateBtn');

    urlDisplay.textContent = url;
    iframeLoaded = false;
    generateBtn.disabled = true;
    generateBtn.textContent = '加载中...';

    browserContent.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>正在加载页面...</p>
        </div>
        <div class="resize-handle" id="resizeHandle" title="拖拽调整显示范围">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        </div>
    `;

    applyBackgroundType();

    const proxyUrl = getProxyUrl(url);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('allow', 'cross-origin-isolated');
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    
    applyScaleToIframe(iframe);
    
    iframe.onload = function() {
        setTimeout(() => {
            const loading = browserContent.querySelector('.loading');
            if (loading) {
                loading.remove();
            }
            iframe.classList.add('loaded');
            browserContent.classList.add('has-iframe');
            iframeLoaded = true;
            generateBtn.disabled = false;
            generateBtn.textContent = '生成截图';
            initializeResizeHandle();
        }, 500);
    };

    iframe.onerror = function() {
        showError('无法加载该页面。可能是因为该网站禁止了 iframe 嵌入。');
        generateBtn.disabled = false;
        generateBtn.textContent = '生成截图';
    };

    browserContent.appendChild(iframe);
    iframe.src = proxyUrl;

    setTimeout(() => {
        if (!iframeLoaded && browserContent.querySelector('.loading')) {
            const loading = browserContent.querySelector('.loading');
            if (loading) {
                loading.remove();
            }
            iframe.classList.add('loaded');
            iframeLoaded = true;
            generateBtn.disabled = false;
            generateBtn.textContent = '生成截图';
        }
    }, 5000);
}

function showError(message) {
    const browserContent = document.getElementById('browserContent');
    browserContent.innerHTML = `
        <div class="error-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>${message}</p>
        </div>
    `;
    iframeLoaded = false;
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function applyScaleToIframe(iframe) {
    if (customWidth) {
        iframe.style.width = customWidth + 'px';
    } else {
        iframe.style.width = '100%';
    }
    
    if (customHeight) {
        iframe.style.height = customHeight + 'px';
    } else {
        iframe.style.height = '600px';
    }
    
    iframe.style.transform = `scale(${currentScale / 100})`;
    iframe.style.transformOrigin = 'top left';
    
    if (currentScale !== 100) {
        const scale = currentScale / 100;
        iframe.style.width = customWidth ? (customWidth / scale) + 'px' : (100 / scale) + '%';
        iframe.style.height = customHeight ? (customHeight / scale) + 'px' : (600 / scale) + 'px';
    }
}

function applyCustomScale() {
    const widthInput = document.getElementById('customWidth');
    const heightInput = document.getElementById('customHeight');
    
    customWidth = widthInput.value ? parseInt(widthInput.value) : null;
    customHeight = heightInput.value ? parseInt(heightInput.value) : null;
    
    const iframe = document.querySelector('#browserContent iframe');
    if (iframe) {
        applyScaleToIframe(iframe);
    }
    
    alert('尺寸已应用！');
}

function resetScale() {
    currentScale = 100;
    customWidth = null;
    customHeight = null;
    
    document.getElementById('scalePercent').value = 100;
    document.getElementById('scalePercentValue').textContent = '100%';
    document.getElementById('customWidth').value = '';
    document.getElementById('customHeight').value = '';
    
    const iframe = document.querySelector('#browserContent iframe');
    if (iframe) {
        applyScaleToIframe(iframe);
    }
    
    alert('已重置为默认设置！');
}

function applyBackgroundType() {
    const browserContent = document.getElementById('browserContent');
    const backgroundType = document.getElementById('backgroundType').value;
    
    browserContent.classList.remove('background-gradient', 'background-grid', 'background-dots');
    
    if (backgroundType !== 'white') {
        browserContent.classList.add(`background-${backgroundType}`);
    }
}

function initializeResizeHandle() {
    const resizeHandle = document.getElementById('resizeHandle');
    const browserContent = document.getElementById('browserContent');
    const iframe = browserContent.querySelector('iframe');
    
    if (!resizeHandle || !iframe) return;
    
    resizeHandle.addEventListener('mousedown', function(e) {
        isResizing = true;
        startY = e.clientY;
        startHeight = iframe.offsetHeight;
        resizeHandle.classList.add('active');
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        
        const deltaY = e.clientY - startY;
        const newHeight = Math.max(200, startHeight + deltaY);
        
        iframe.style.height = newHeight + 'px';
        customHeight = newHeight;
        document.getElementById('customHeight').value = newHeight;
    });
    
    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            resizeHandle.classList.remove('active');
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        }
    });
}

async function downloadScreenshot() {
    const browserMockup = document.getElementById('browserMockup');

    if (!currentUrl) {
        alert('请先生成预览');
        return;
    }

    if (!iframeLoaded) {
        alert('页面尚未加载完成，请稍后再试');
        return;
    }

    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.disabled = true;
    downloadBtn.textContent = '生成中...';

    try {
        const formatSelector = document.getElementById('formatSelector');
        const qualitySlider = document.getElementById('qualitySlider');
        const format = formatSelector.value;
        const quality = parseFloat(qualitySlider.value);
        
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        
        const canvas = await html2canvas(browserMockup, {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            backgroundColor: '#f5f5f5',
            logging: false,
            imageTimeout: 15000,
            foreignObjectRendering: true,
            onclone: (clonedDoc) => {
                const clonedIframe = clonedDoc.querySelector('iframe');
                if (clonedIframe) {
                    clonedIframe.style.opacity = '1';
                    clonedIframe.style.visibility = 'visible';
                    clonedIframe.style.transform = 'none';
                    clonedIframe.style.width = customWidth ? customWidth + 'px' : '100%';
                    clonedIframe.style.height = customHeight ? customHeight + 'px' : '600px';
                    clonedIframe.style.position = 'relative';
                }
                
                const clonedResizeHandle = clonedDoc.querySelector('.resize-handle');
                if (clonedResizeHandle) {
                    clonedResizeHandle.style.display = 'none';
                }
            }
        });

        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `screenshot-${timestamp}.${format}`;
        link.href = canvas.toDataURL(mimeType, quality);
        link.click();

        downloadBtn.disabled = false;
        downloadBtn.textContent = '📥 下载截图';
    } catch (error) {
        console.error('截图失败:', error);
        const proxySelector = document.getElementById('proxySelector');
        const selectedProxy = proxySelector.value;
        
        let errorMessage = '截图失败。';
        if (selectedProxy === 'none') {
            errorMessage += '\n\n由于浏览器安全限制，无法捕获跨域内容。\n\n建议：\n1. 选择一个代理服务后重试\n2. 或者使用同源网站';
        } else {
            errorMessage += '\n\n可能是代理服务暂时不可用。\n\n建议：\n1. 尝试切换到其他代理服务\n2. 或者稍后再试';
        }
        
        alert(errorMessage);
        downloadBtn.disabled = false;
        downloadBtn.textContent = '📥 下载截图';
    }
}

function initializeProxySelector() {
    const proxySelector = document.getElementById('proxySelector');
    proxySelector.innerHTML = '';
    
    Object.entries(PROXY_SERVICES).forEach(([key, service]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = service.name;
        proxySelector.appendChild(option);
    });
}

function initializeEventListeners() {
    document.getElementById('showAddress').addEventListener('change', function() {
        document.getElementById('addressBar').style.display = this.checked ? 'flex' : 'none';
    });

    document.getElementById('showControls').addEventListener('change', function() {
        document.getElementById('windowControls').style.display = this.checked ? 'flex' : 'none';
    });

    document.getElementById('proxySelector').addEventListener('change', function() {
        if (currentUrl) {
            generatePreview();
        }
    });

    document.getElementById('urlInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generatePreview();
        }
    });

    document.getElementById('scalePercent').addEventListener('input', function(e) {
        currentScale = parseInt(e.target.value);
        document.getElementById('scalePercentValue').textContent = currentScale + '%';
        
        const iframe = document.querySelector('#browserContent iframe');
        if (iframe) {
            applyScaleToIframe(iframe);
        }
    });

    document.getElementById('formatSelector').addEventListener('change', function() {
        const qualityOption = document.getElementById('qualityOption');
        if (this.value === 'jpeg') {
            qualityOption.style.display = 'flex';
        } else {
            qualityOption.style.display = 'none';
        }
    });

    document.getElementById('qualitySlider').addEventListener('input', function(e) {
        document.getElementById('qualityValue').textContent = Math.round(e.target.value * 100) + '%';
    });

    document.getElementById('backgroundType').addEventListener('change', applyBackgroundType);
}

document.addEventListener('DOMContentLoaded', function() {
    initializeProxySelector();
    initializeEventListeners();
});