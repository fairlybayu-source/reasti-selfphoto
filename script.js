const photoContainer = document.getElementById('photoContainer');
const captureArea = document.getElementById('captureArea');
const templateImg = document.getElementById('templateOverlay');

// 1. Ganti Layout Standar
function changeLayout(type) {
    captureArea.className = `photo-strip white ${type}`;
    templateImg.style.display = 'none';
    photoContainer.innerHTML = '';
    // Generate empty slots for standard layouts
    let count = type === 'layout-grid' ? 6 : (type === 'layout-grand-opening' ? 4 : 3);
    for(let i=0; i<count; i++) createPhotoBox(false);
}

// 2. Fungsi Membuat Box Foto (Manual/Auto)
function createPhotoBox(isAuto = false, x, y, w, h) {
    const box = document.createElement('div');
    box.className = 'photo-box';
    if(isAuto) {
        box.style.left = x + 'px'; box.style.top = y + 'px';
        box.style.width = w + 'px'; box.style.height = h + 'px';
    }

    box.innerHTML = `<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:10px;color:#999;">Klik Upload</span>`;
    
    box.onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                box.innerHTML = '';
                const img = document.createElement('img');
                img.src = ev.target.result;
                addInteractivity(img, box);
                box.appendChild(img);
                const resizer = document.createElement('div');
                resizer.className = 'resizer';
                addResizeLogic(img, resizer);
                box.appendChild(resizer);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };
    photoContainer.appendChild(box);
}

// 3. Magic Auto-Detect Area Transparan
document.getElementById('magicScan').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            photoContainer.innerHTML = '';
            captureArea.className = 'photo-strip auto-detect-mode';
            templateImg.src = img.src;
            templateImg.style.display = 'block';
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 380; canvas.height = 570;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

            // Scan area transparan (Alpha < 10)
            for (let y = 0; y < canvas.height; y += 40) {
                for (let x = 0; x < canvas.width; x += 40) {
                    const idx = (y * canvas.width + x) * 4;
                    if (data[idx + 3] < 10) {
                        // Logika sederhana penempatan box (bisa dikembangkan lebih detail)
                        createPhotoBox(true, x, y, 120, 150); 
                    }
                }
            }
        };
    };
    reader.readAsDataURL(file);
});

// 4. Interaktivitas (Drag & Zoom)
function addInteractivity(img, box) {
    let isDragging = false;
    let startX, startY;
    img.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - img.offsetLeft;
        startY = e.clientY - img.offsetTop;
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            img.style.left = (e.clientX - startX) + "px";
            img.style.top = (e.clientY - startY) + "px";
        }
    });
    document.addEventListener('mouseup', () => isDragging = false);
}

function addResizeLogic(img, resizer) {
    let isResizing = false;
    let startX, scale = 1;
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true; startX = e.clientX;
        e.stopPropagation(); e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (isResizing) {
            let delta = (e.clientX - startX) * 0.003;
            scale = Math.max(0.1, scale + delta);
            img.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    });
    document.addEventListener('mouseup', () => isResizing = false);
}

// 5. Download HD
document.getElementById('downloadBtn').onclick = () => {
    document.querySelectorAll('.resizer').forEach(r => r.style.display = 'none');
    html2canvas(captureArea, { scale: 4, useCORS: true }).then(canvas => {
        document.querySelectorAll('.resizer').forEach(r => r.style.display = 'block');
        const link = document.createElement('a');
        link.download = 'Photobox-Reastic-HD.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    });
};

function changeBg(v) { captureArea.classList.remove('white','black','polka-pink'); captureArea.classList.add(v); }
