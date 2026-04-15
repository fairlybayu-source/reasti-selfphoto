const photoContainer = document.getElementById('photoContainer');
const captureArea = document.getElementById('captureArea');
const templateOverlay = document.getElementById('templateOverlay');

// 1. SCAN TEMPLATE & DETEKSI LUBANG
document.getElementById('magicScan').onchange = function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            photoContainer.innerHTML = ''; // Reset
            templateOverlay.src = img.src;
            templateOverlay.style.display = 'block';
            detectHoles(img);
        };
    };
    reader.readAsDataURL(file);
};

function detectHoles(imgSource) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 380; 
    canvas.height = 570;
    ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const visited = new Uint8Array(canvas.width * canvas.height);

    // Gunakan ambang batas (threshold) yang lebih ketat untuk transparansi
    const threshold = 10; 

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const alpha = data[idx + 3];

            // Jika menemukan piksel benar-benar transparan dan belum dikunjungi
            if (alpha < threshold && !visited[y * canvas.width + x]) {
                let minX = x, maxX = x, minY = y, maxY = y;
                let queue = [[x, y]];
                visited[y * canvas.width + x] = 1;

                // Algoritma Flood Fill untuk mengunci satu area kotak secara utuh
                while (queue.length > 0) {
                    let [cx, cy] = queue.shift();
                    
                    // Cek 4 arah (atas, bawah, kiri, kanan)
                    const neighbors = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
                    for (let [nx, ny] of neighbors) {
                        if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                            const nIdx = (ny * canvas.width + nx) * 4;
                            if (!visited[ny * canvas.width + nx] && data[nIdx + 3] < threshold) {
                                visited[ny * canvas.width + nx] = 1;
                                minX = Math.min(minX, nx);
                                maxX = Math.max(maxX, nx);
                                minY = Math.min(minY, ny);
                                maxY = Math.max(maxY, ny);
                                queue.push([nx, ny]);
                            }
                        }
                    }
                }

                // Validasi ukuran: abaikan jika hanya noise kecil (kurang dari 30px)
                const w = maxX - minX;
                const h = maxY - minY;
                if (w > 30 && h > 30) {
                    // Buat kotak foto dengan sedikit offset (1px) agar masuk ke bawah bingkai
                    createPhotoBox(minX - 1, minY - 1, w + 2, h + 2);
                }
            }
        }
    }
}

// 2. BUAT KOTAK FOTO & LOGIKA INTERAKSI
function createPhotoBox(x, y, w, h) {
    const box = document.createElement('div');
    box.className = 'photo-box';
    box.style.cssText = `left:${x}px; top:${y}px; width:${w}px; height:${h}px;`;

    box.onclick = (e) => {
        if (box.classList.contains('has-photo') && e.target.tagName !== 'DIV') return;
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (f) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                box.innerHTML = '';
                box.classList.add('has-photo'); // GARIS PUTUS HILANG
                
                const img = document.createElement('img');
                img.src = ev.target.result;
                
                const resizer = document.createElement('div');
                resizer.className = 'resizer';
                
                applyDragAndZoom(img, resizer);
                
                box.appendChild(img);
                box.appendChild(resizer);
            };
            reader.readAsDataURL(f.target.files[0]);
        };
        input.click();
    };
    photoContainer.appendChild(box);
}

// 3. FUNGSI DRAG & ZOOM HD
function applyDragAndZoom(img, resizer) {
    let isDragging = false, isResizing = false;
    let startX, startY, scale = 1;

    img.onmousedown = (e) => {
        isDragging = true;
        startX = e.clientX - img.offsetLeft;
        startY = e.clientY - img.offsetTop;
        e.preventDefault();
    };

    resizer.onmousedown = (e) => {
        isResizing = true;
        startX = e.clientX;
        e.preventDefault(); e.stopPropagation();
    };

    document.onmousemove = (e) => {
        if (isDragging) {
            img.style.left = (e.clientX - startX) + "px";
            img.style.top = (e.clientY - startY) + "px";
        }
        if (isResizing) {
            let delta = (e.clientX - startX) * 0.005;
            scale = Math.max(0.1, scale + delta);
            img.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    };

    document.onmouseup = () => { isDragging = false; isResizing = false; };
}

// 4. DOWNLOAD HD
document.getElementById('downloadBtn').onclick = () => {
    const resizers = document.querySelectorAll('.resizer');
    resizers.forEach(r => r.style.display = 'none'); // Sembunyikan panah saat save

    html2canvas(captureArea, { scale: 3, useCORS: true }).then(canvas => {
        resizers.forEach(r => r.style.display = 'block');
        const link = document.createElement('a');
        link.download = 'Photobox-Final.png';
        link.href = canvas.toDataURL();
        link.click();
    });
};
