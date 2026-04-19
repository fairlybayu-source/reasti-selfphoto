const photoContainer = document.getElementById('photoContainer');
const templateOverlay = document.getElementById('templateOverlay');
const editPanel = document.getElementById('editPanel');

let activeImg = null;
let isDragging = false;
let startX, startY, initX, initY;

// 1. SCAN TEMPLATE ENGINE
document.getElementById('magicScan').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            photoContainer.innerHTML = ''; // Reset
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
    canvas.width = 380; canvas.height = 570;
    ctx.drawImage(imgSource, 0, 0, 380, 570);
    
    const pixelData = ctx.getImageData(0, 0, 380, 570).data;
    const visited = new Uint8Array(380 * 570);

    for (let y = 0; y < 570; y += 4) { // Scan step 4px untuk performa
        for (let x = 0; x < 380; x += 4) {
            const idx = (y * 380 + x) * 4;
            const alpha = pixelData[idx + 3];

            if (alpha < 50 && !visited[y * 380 + x]) {
                let xMin = x, xMax = x, yMin = y, yMax = y;
                let stack = [[x, y]];
                visited[y * 380 + x] = 1;

                while(stack.length > 0) {
                    let [cx, cy] = stack.pop();
                    xMin = Math.min(xMin, cx); xMax = Math.max(xMax, cx);
                    yMin = Math.min(yMin, cy); yMax = Math.max(yMax, cy);

                    [[cx+4, cy], [cx, cy+4]].forEach(([nx, ny]) => {
                        if (nx < 380 && ny < 570 && !visited[ny * 380 + nx]) {
                            if (pixelData[(ny * 380 + nx) * 4 + 3] < 50) {
                                visited[ny * 380 + nx] = 1;
                                stack.push([nx, ny]);
                            }
                        }
                    });
                }
                if ((xMax - xMin) > 25) createPhotoBox(xMin, yMin, (xMax - xMin), (yMax - yMin));
            }
        }
    }
}

// 2. BOX SYSTEM
function createPhotoBox(x, y, w, h) {
    const box = document.createElement('div');
    box.className = 'photo-box';
    box.style.cssText = `left:${x}px; top:${y}px; width:${w}px; height:${h}px;`;
    
    box.onclick = () => {
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
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.createElement('img');
            img.src = ev.target.result;
            // Initialize dataset
            img.dataset.scale = 1;
            img.dataset.bright = 100;
            img.dataset.contrast = 100;
            img.dataset.sat = 100;
            img.dataset.x = 0;
            img.dataset.y = 0;

            box.innerHTML = '';
            box.appendChild(img);
            selectPhoto(img);
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

// 3. EDITOR ENGINE
function selectPhoto(img) {
    activeImg = img;
    editPanel.style.display = 'block';
    
    // Sync Sliders & Labels
    const props = ['Scale', 'Bright', 'Contrast', 'Sat'];
    props.forEach(p => {
        const val = img.dataset[p.toLowerCase()];
        document.getElementById(`img${p}`).value = val;
        document.getElementById(`val-${p.toLowerCase()}`).innerText = p === 'Scale' ? val : val + '%';
    });

    document.querySelectorAll('.photo-box').forEach(b => b.style.outline = 'none');
    img.parentElement.style.outline = '2px solid #3b82f6';
}

['imgScale', 'imgBright', 'imgContrast', 'imgSat'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
        if (!activeImg) return;
        const val = e.target.value;
        const key = id.replace('img', '').toLowerCase();
        
        activeImg.dataset[key] = val;
        document.getElementById(`val-${key}`).innerText = key === 'scale' ? val : val + '%';
        
        applyTransformations();
    });
});

function applyTransformations() {
    if (!activeImg) return;
    const d = activeImg.dataset;
    activeImg.style.transform = `translate(${d.x}px, ${d.y}px) scale(${d.scale})`;
    activeImg.style.filter = `brightness(${d.bright}%) contrast(${d.contrast}%) saturate(${d.sat}%)`;
}

// 4. INTERACTION (DRAG)
window.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'IMG' && e.target.parentElement.classList.contains('photo-box')) {
        isDragging = true;
        activeImg = e.target;
        startX = e.clientX;
        startY = e.clientY;
        initX = parseFloat(activeImg.dataset.x);
        initY = parseFloat(activeImg.dataset.y);
        selectPhoto(activeImg);
    }
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging || !activeImg) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    activeImg.dataset.x = initX + dx;
    activeImg.dataset.y = initY + dy;
    applyTransformations();
});

window.addEventListener('mouseup', () => isDragging = false);

// 5. EXPORT ENGINE
document.getElementById('downloadBtn').onclick = () => {
    const btn = document.getElementById('downloadBtn');
    btn.innerText = '⏳ PROSES HD...';
    
    html2canvas(document.getElementById('captureArea'), {
        scale: 4, // Ultra HD Quality
        useCORS: true,
        backgroundColor: null
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Photobox_HD_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        btn.innerText = '💾 SIMPAN HASIL HD';
    });
};
