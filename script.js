const photoContainer = document.getElementById('photoContainer');
const templateOverlay = document.getElementById('templateOverlay');
const editPanel = document.getElementById('editPanel');

let activeImg = null;
let isDragging = false;
let startX, startY, initX, initY;

// SCAN TEMPLATE ENGINE
document.getElementById('magicScan').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            photoContainer.innerHTML = '';
            templateOverlay.src = img.src;
            templateOverlay.style.display = 'block';
            detectTransparentAreas(img);
        };
    };
    reader.readAsDataURL(file);
});

function detectTransparentAreas(imgSource) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 384; canvas.height = 576;
    ctx.drawImage(imgSource, 0, 0, 384, 576);
    const pixelData = ctx.getImageData(0, 0, 384, 576).data;
    const visited = new Uint8Array(384 * 576);

    for (let y = 0; y < 576; y += 4) {
        for (let x = 0; x < 384; x += 4) {
            const idx = (y * 384 + x) * 4;
            if (pixelData[idx + 3] < 50 && !visited[y * 384 + x]) {
                let xMin = x, xMax = x, yMin = y, yMax = y;
                let stack = [[x, y]];
                visited[y * 384 + x] = 1;
                while(stack.length > 0) {
                    let [cx, cy] = stack.pop();
                    xMin = Math.min(xMin, cx); xMax = Math.max(xMax, cx);
                    yMin = Math.min(yMin, cy); yMax = Math.max(yMax, cy);
                    [[cx+4, cy], [cx, cy+4]].forEach(([nx, ny]) => {
                        if (nx < 384 && ny < 576 && !visited[ny * 384 + nx]) {
                            if (pixelData[(ny * 384 + nx) * 4 + 3] < 50) {
                                visited[ny * 384 + nx] = 1; stack.push([nx, ny]);
                            }
                        }
                    });
                }
                if ((xMax - xMin) > 25) createPhotoBox(xMin, yMin, (xMax - xMin), (yMax - yMin));
            }
        }
    }
}

function createPhotoBox(x, y, w, h) {
    const box = document.createElement('div');
    box.className = 'photo-box';
    
    // OFFSET PRESISI: 
    // Kita kurangi x & y sebesar 1px, dan tambah w & h sebesar 2px
    // Ini memastikan foto "masuk" sedikit ke bawah area berwarna templat
    const gapFix = 2; 
    
    box.style.cssText = `
        left: ${x - gapFix}px; 
        top: ${y - gapFix}px; 
        width: ${w + (gapFix * 2)}px; 
        height: ${h + (gapFix * 2)}px;
    `;
    
    box.onclick = (e) => {
        if (e.target.classList.contains('remove-photo-btn')) return;
        const img = box.querySelector('img');
        if (img) selectPhoto(img);
        else triggerImageUpload(box);
    };
    photoContainer.appendChild(box);
}

function triggerImageUpload(box) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            box.innerHTML = '';
            const img = document.createElement('img');
            img.src = ev.target.result;

            // --- OTOMATIS PRESET CLEAN WHITE ---
            img.dataset.scale = 1; 
            img.dataset.bright = 115; 
            img.dataset.contrast = 110; 
            img.dataset.sat = 95;      
            img.dataset.x = 0; 
            img.dataset.y = 0;

            box.appendChild(img);
            
            const btn = document.createElement('button');
            btn.className = 'remove-photo-btn';
            btn.innerHTML = '×';
            btn.onclick = (ev) => {
                ev.stopPropagation();
                box.innerHTML = '';
                activeImg = null;
                editPanel.style.display = 'none';
            };
            box.appendChild(btn);
            
            selectPhoto(img);
            applyStyles(); 
        };
        reader.readAsDataURL(e.target.files[0]);
    };
    input.click();
}

function selectPhoto(img) {
    activeImg = img;
    editPanel.style.display = 'block';
    ['Scale', 'Bright', 'Contrast', 'Sat'].forEach(p => {
        const val = img.dataset[p.toLowerCase()];
        document.getElementById(`img${p}`).value = val;
        document.getElementById(`val-${p.toLowerCase()}`).innerText = p === 'Scale' ? val : val + '%';
    });
    document.querySelectorAll('.photo-box').forEach(b => b.style.outline = 'none');
    img.parentElement.style.outline = `2px solid var(--accent)`;
}

['imgScale', 'imgBright', 'imgContrast', 'imgSat'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
        if (!activeImg) return;
        const val = e.target.value;
        const key = id.replace('img', '').toLowerCase();
        activeImg.dataset[key] = val;
        document.getElementById(`val-${key}`).innerText = key === 'scale' ? val : val + '%';
        applyStyles();
    });
});

function applyStyles() {
    if (!activeImg) return;
    const d = activeImg.dataset;
    activeImg.style.transform = `translate(${d.x}px, ${d.y}px) scale(${d.scale})`;
    activeImg.style.filter = `brightness(${d.bright}%) contrast(${d.contrast}%) saturate(${d.sat}%)`;
}

// DRAG SYSTEM
window.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('remove-photo-btn')) return;
    if (e.target.tagName === 'IMG' && e.target.parentElement.classList.contains('photo-box')) {
        isDragging = true; activeImg = e.target;
        startX = e.clientX; startY = e.clientY;
        initX = parseFloat(activeImg.dataset.x); initY = parseFloat(activeImg.dataset.y);
        selectPhoto(activeImg);
    }
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging || !activeImg) return;
    activeImg.dataset.x = initX + (e.clientX - startX);
    activeImg.dataset.y = initY + (e.clientY - startY);
    applyStyles();
});

window.addEventListener('mouseup', () => isDragging = false);

// PRINT ENGINE
document.getElementById('printBtn').onclick = () => {
    document.querySelectorAll('.photo-box').forEach(b => b.style.outline = 'none');
    setTimeout(() => {
        window.print();
    }, 500);
};

// DOWNLOAD ENGINE
document.getElementById('downloadBtn').onclick = () => {
    const btn = document.getElementById('downloadBtn');
    btn.innerText = 'PROCESSING...';
    const xBtns = document.querySelectorAll('.remove-photo-btn');
    xBtns.forEach(b => b.style.display = 'none');
    document.querySelectorAll('.photo-box').forEach(b => b.style.outline = 'none');

    html2canvas(document.getElementById('captureArea'), { 
        scale: 4, 
        useCORS: true,
        logging: false
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `REASTIC_STUDIO_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        btn.innerText = '💾 SIMPAN HASIL HD';
        xBtns.forEach(b => b.style.display = 'flex');
    });
};
