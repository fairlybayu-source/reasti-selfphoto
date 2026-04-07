const photoContainer = document.getElementById('photoContainer');
const captureArea = document.getElementById('captureArea');

// 1. Ganti Layout
function changeLayout(type) {
    captureArea.classList.remove('layout-strip', 'layout-grid', 'layout-double');
    captureArea.classList.add(type);
}

// 2. Upload Foto & Buat Elemen Interaktif
document.getElementById('imageInput').addEventListener('change', function() {
    Array.from(this.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const box = document.createElement('div');
            box.className = 'photo-box';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            
            const resizer = document.createElement('div');
            resizer.className = 'resizer';

            // Fitur Drag Foto dalam Kotak
            let isDragging = false;
            let startX, startY, currentX = -50, currentY = -50;

            img.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX - (img.offsetLeft);
                startY = e.clientY - (img.offsetTop);
                e.preventDefault();
            });

            // Fitur Zoom (Resize)
            let isResizing = false;
            let scale = 1;
            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                e.preventDefault(); e.stopPropagation();
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    let dx = e.clientX - startX;
                    let dy = e.clientY - startY;
                    img.style.left = dx + "px";
                    img.style.top = dy + "px";
                }
                if (isResizing) {
                    let delta = (e.clientX - startX) * 0.005;
                    scale = Math.max(0.5, scale + delta);
                    img.style.transform = `translate(-50%, -50%) scale(${scale})`;
                }
            });

            document.addEventListener('mouseup', () => { isDragging = false; isResizing = false; });

            box.appendChild(img);
            box.appendChild(resizer);
            photoContainer.appendChild(box);
        };
        reader.readAsDataURL(file);
    });
});

// 3. Tambah Stiker
function addSticker(emoji) {
    const s = document.createElement('div');
    s.className = 'sticker';
    s.innerText = emoji;
    s.style.left = '50px'; s.style.top = '50px';
    
    let size = 40;
    s.onclick = () => { size += 15; if(size > 120) size = 30; s.style.fontSize = size + 'px'; };

    let active = false;
    s.onmousedown = (e) => { active = true; s.iX = e.clientX - s.offsetLeft; s.iY = e.clientY - s.offsetTop; };
    document.onmousemove = (e) => { if(active) { s.style.left = (e.clientX - s.iX) + 'px'; s.style.top = (e.clientY - s.iY) + 'px'; }};
    document.onmouseup = () => active = false;
    captureArea.appendChild(s);
}

// 4. Branding & Background
document.getElementById('logoInput').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
        const logo = document.getElementById('userLogo');
        logo.src = ev.target.result; logo.style.display = 'block';
        document.getElementById('defaultBrand').style.display = 'none';
    };
    reader.readAsDataURL(e.target.files[0]);
};

function changeBg(val) { captureArea.className = `photo-strip ${val} ${captureArea.classList[2]}`; }
function applyFilter() {
    const val = document.getElementById('filterSelect').value;
    photoContainer.querySelectorAll('img').forEach(img => img.style.filter = val);
}

// 5. DOWNLOAD HD (4R) - Solusi Gambar Tidak Berubah
document.getElementById('downloadBtn').onclick = () => {
    // Sembunyikan alat bantu edit
    document.querySelectorAll('.resizer').forEach(r => r.style.display = 'none');
    
    html2canvas(captureArea, {
        scale: 4, // 4x lipat lebih tajam dari layar
        useCORS: true,
        backgroundColor: null
    }).then(canvas => {
        document.querySelectorAll('.resizer').forEach(r => r.style.display = 'block');
        const link = document.createElement('a');
        link.download = 'photobox-4R-perfect.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    });
};
