const photoContainer = document.getElementById('photoContainer');
const templateImg = document.getElementById('templateOverlay');
const captureArea = document.getElementById('captureArea');
const editPanel = document.getElementById('editPanel');

let selectedImg = null;
let isDragging = false;
let startX, startY, initialLeft, initialTop;

// 1. SCAN TEMPLATE
document.getElementById('magicScan').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            photoContainer.innerHTML = '';
            templateImg.src = img.src;
            templateImg.style.display = 'block';
            runPrecisionScan(img);
        };
    };
    reader.readAsDataURL(file);
});

function runPrecisionScan(imgSource) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 380; canvas.height = 570;
    ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const visited = new Uint8Array(canvas.width * canvas.height);

    for (let y = 0; y < canvas.height; y += 5) {
        for (let x = 0; x < canvas.width; x += 5) {
            const idx = (y * canvas.width + x) * 4;
            if (imageData[idx + 3] < 50 && !visited[y * canvas.width + x]) {
                let minX = x, maxX = x, minY = y, maxY = y;
                let queue = [[x, y]];
                visited[y * canvas.width + x] = 1;

                while(queue.length > 0) {
                    let [cx, cy] = queue.shift();
                    minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
                    minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);

                    [[cx+5, cy], [cx, cy+5]].forEach(([nx, ny]) => {
                        if (nx < canvas.width && ny < canvas.height && !visited[ny * canvas.width + nx]) {
                            if (imageData[(ny * canvas.width + nx) * 4 + 3] < 50) {
                                visited[ny * canvas.width + nx] = 1;
                                queue.push([nx, ny]);
                            }
                        }
                    });
                }
                if ((maxX - minX) > 30) createPhotoBox(minX - 1, minY - 1, (maxX - minX) + 2, (maxY - minY) + 2);
            }
        }
    }
}

// 2. CREATE BOX & UPLOAD FOTO
function createPhotoBox(x, y, w, h) {
    const box = document.createElement('div');
    box.className = 'photo-box';
    box.style.cssText = `left:${x}px; top:${y}px; width:${w}px; height:${h}px;`;

    box.onclick = () => {
        const currentImg = box.querySelector('img');
        if (currentImg) {
            selectImage(currentImg);
        } else {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = (e) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = document.createElement('img');
                    img.src = ev.target.result;
                    // Default Data
                    img.dataset.scale = 1; img.dataset.bright = 100;
                    img.dataset.contrast = 100; img.dataset.sat = 100;
                    box.innerHTML = '';
                    box.appendChild(img);
                    selectImage(img);
                    setupDrag(img);
                };
                reader.readAsDataURL(e.target.files[0]);
            };
            input.click();
        }
    };
    photoContainer.appendChild(box);
}

// 3. EDITING & FILTERS
function selectImage(img) {
    selectedImg = img;
    editPanel.style.display = 'block';
    
    // Sync UI Sliders
    document.getElementById('imgScale').value = img.dataset.scale;
    document.getElementById('imgBright').value = img.dataset.bright;
    document.getElementById('imgContrast').value = img.dataset.contrast;
    document.getElementById('imgSat').value = img.dataset.sat;

    document.querySelectorAll('.photo-box').forEach(b => b.style.outline = 'none');
    img.parentElement.style.outline = '2px solid #00d4ff';
}

['imgScale', 'imgBright', 'imgContrast', 'imgSat'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (!selectedImg) return;
        const scale = document.getElementById('imgScale').value;
        const b = document.getElementById('imgBright').value;
        const c = document.getElementById('imgContrast').value;
        const s = document.getElementById('imgSat').value;

        selectedImg.dataset.scale = scale;
        selectedImg.dataset.bright = b;
        selectedImg.dataset.contrast = c;
        selectedImg.dataset.sat = s;

        selectedImg.style.transform = `translate(-50%, -50%) scale(${scale})`;
        selectedImg.style.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
    });
});

// 4. DRAG LOGIC
function setupDrag(img) {
    img.addEventListener('mousedown', (e) => {
        isDragging = true;
        selectedImg = img;
        startX = e.clientX; startY = e.clientY;
        initialLeft = img.offsetLeft; initialTop = img.offsetTop;
        e.preventDefault();
    });
}

window.addEventListener('mousemove', (e) => {
    if (!isDragging || !selectedImg) return;
    selectedImg.style.left = (initialLeft + (e.clientX - startX)) + 'px';
    selectedImg.style.top = (initialTop + (e.clientY - startY)) + 'px';
});

window.addEventListener('mouseup', () => isDragging = false);

// 5. DOWNLOAD
document.getElementById('downloadBtn').onclick = () => {
    html2canvas(captureArea, { scale: 3, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Photobox-HD.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
};
