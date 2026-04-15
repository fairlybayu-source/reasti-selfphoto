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
    canvas.width = 380; canvas.height = 570;
    ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height);
    
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const visited = new Uint8Array(canvas.width * canvas.height);

    for (let y = 0; y < canvas.height; y += 10) {
        for (let x = 0; x < canvas.width; x += 10) {
            const idx = (y * canvas.width + x) * 4;
            if (data[idx + 3] < 50 && !visited[y * canvas.width + x]) {
                let x1=x, x2=x, y1=y, y2=y;
                for(let ty=y; ty<y+300 && ty<canvas.height; ty+=10) {
                    for(let tx=x; tx<x+300 && tx<canvas.width; tx+=10) {
                        if(data[(ty*canvas.width+tx)*4+3] < 50) {
                            x1=Math.min(x1,tx); x2=Math.max(x2,tx);
                            y1=Math.min(y1,ty); y2=Math.max(y2,ty);
                            visited[ty*canvas.width+tx] = 1;
                        }
                    }
                }
                if((x2-x1) > 30) createPhotoBox(x1-2, y1-2, (x2-x1)+4, (y2-y1)+4);
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
