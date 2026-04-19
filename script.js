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
            photoContainer.innerHTML = ''; // Reset kotak lama
            templateOverlay.src = img.src;
            templateOverlay.style.display = 'block';
            detectTransparentAreas(img);
        };
    };
    reader.readAsDataURL(file);
});

// Algoritma untuk mendeteksi lubang transparan pada PNG
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
            // Jika pixel transparan (alpha < 50) dan belum dikunjungi
            if (pixelData[idx + 3] < 50 && !visited[y * 380 + x]) {
                let xMin = x, xMax = x, yMin = y, yMax = y;
                let stack = [[x, y]];
                visited[y * 380 + x] = 1;
                
                // Algoritma Flood Fill sederhana untuk mencari batas area
                while(stack.length > 0) {
                    let [cx, cy] = stack.pop();
                    xMin = Math.min(xMin, cx); xMax = Math.max(xMax, cx);
                    yMin = Math.min(yMin, cy); yMax = Math.max(yMax, cy);
                    
                    [[cx+4, cy], [cx, cy+4]].forEach(([nx, ny]) => {
                        if (nx < 380 && ny < 570 && !visited[ny * 380 + nx]) {
                            if (pixelData[(ny * 380 + nx) * 4 + 3] < 50) {
                                visited[ny * 380 + nx] = 1; stack.push([nx, ny]);
                            }
                        }
                    });
                }
                // Buat kotak jika area cukup besar
                if ((xMax - xMin) > 25) createPhotoBox(xMin, yMin, (xMax - xMin), (yMax - yMin));
            }
        }
    }
}

// 2. BOX SYSTEM & REMOVE LOGIC
function createPhotoBox(x, y, w, h) {
    const box = document.createElement('div');
    box.className = 'photo-box';
    box.style.cssText = `left:${x}px; top:${y}px; width:${w}px; height:${h}px;`;
    
    // Logika klik pada kotak
    box.onclick = (e) => {
        // Jangan lakukan apa-apa jika yang diklik adalah tombol hapus
        if (e.target.classList.contains('remove-photo-btn')) return;
        
        const img = box.querySelector('img');
        if (img) selectPhoto(img); // Jika ada foto, pilih untuk diedit
        else triggerImageUpload(box); // Jika kosong, unggah foto
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
            // Buat elemen gambar
            const img = document.createElement('img');
            img.src = ev.target.result;
            // Inisialisasi data transformasi & filter
            img.dataset.scale = 1; img.dataset.bright = 100;
            img.dataset.contrast = 100; img.dataset.sat = 100;
            img.dataset.x = 0; img.dataset.y = 0;
            
            box.innerHTML = ''; // Bersihkan kotak
            box.appendChild(img);
            
            // --- TAMBAHKAN TOMBOL HAPUS (X) DISINI ---
            const btn = document.createElement('button');
            btn.className = 'remove-photo-btn';
            btn.innerHTML = '×';
            btn.onclick = (ev) => {
                ev.stopPropagation(); // Stop klik tembus ke kotak foto
                activeImg = null;
                editPanel.style.display = 'none'; // Sembunyikan panel edit
                box.innerHTML = ''; // Hapus foto dan tombol hapus ini
                box.style.outline = 'none'; // Hapus highlight seleksi
            };
            box.appendChild(btn);
            // ----------------------------------------
            
            selectPhoto(img);
        };
        reader.readAsDataURL(e.target.files[0]);
    };
    input.click();
}

// 3. EDITOR ENGINE
function selectPhoto(img) {
    activeImg = img;
    editPanel.style.display = 'block';
    
    // Sinkronisasi Slider di Sidebar dengan data foto
    ['Scale', 'Bright', 'Contrast', 'Sat'].forEach(p => {
        const val = img.dataset[p.toLowerCase()];
        document.getElementById(`img${p}`).value = val;
        document.getElementById(`val-${p.toLowerCase()}`).innerText = p === 'Scale' ? val : val + '%';
    });
    
    // Highlight kotak yang dipilih
    document.querySelectorAll('.photo-box').forEach(b => b.style.outline = 'none');
    img.parentElement.style.outline = `2px solid var(--accent)`;
}

// Event Listener untuk semua slider edit
['imgScale', 'imgBright', 'imgContrast', 'imgSat'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
        if (!activeImg) return;
        const val = e.target.value;
        const key = id.replace('img', '').toLowerCase();
        
        activeImg.dataset[key] = val; // Simpan data baru
        document.getElementById(`val-${key}`).innerText = key === 'scale' ? val : val + '%';
        applyTransformations(); // Terapkan visual
    });
});

// Menerapkan gaya transformasi (geser, zoom) dan filter (warna)
function applyTransformations() {
    if (!activeImg) return;
    const d = activeImg.dataset;
    activeImg.style.transform = `translate(${d.x}px, ${d.y}px) scale(${d.scale})`;
    activeImg.style.filter = `brightness(${d.bright}%) contrast(${d.contrast}%) saturate(${d.sat}%)`;
}

// 4. INTERACTION (DRAG TO MOVE)
window.addEventListener('mousedown', (e) => {
    // JANGAN drag jika mengklik tombol hapus
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
    applyTransformations();
});

window.addEventListener('mouseup', () => isDragging = false);

// 5. EXPORT ENGINE
document.getElementById('downloadBtn').onclick = () => {
    const btn = document.getElementById('downloadBtn');
    btn.innerText = 'PROCESSING...';
    
    // Mengambil snapshot area preview dengan resolusi tinggi (scale: 4)
    html2canvas(document.getElementById('captureArea'), { scale: 4, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = `REASTIC_STUDIO_${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        btn.innerText = '💾 SIMPAN HASIL HD';
    });
    // ... (Bagian awal Scan Template tetap sama)

function triggerImageUpload(box) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.createElement('img');
            img.src = ev.target.result;
            img.dataset.scale = 1; img.dataset.bright = 100;
            img.dataset.contrast = 100; img.dataset.sat = 100;
            img.dataset.x = 0; img.dataset.y = 0;

            box.innerHTML = '';
            box.appendChild(img);

            // TAMBAHKAN TOMBOL HAPUS (X)
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-photo-btn';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = (event) => {
                event.stopPropagation();
                box.innerHTML = ''; // Hapus isi kotak (foto & tombol)
                activeImg = null;
                editPanel.style.display = 'none';
            };
            box.appendChild(removeBtn);

            selectPhoto(img);
        };
        reader.readAsDataURL(e.target.files[0]);
    };
    input.click();
}

// FITUR PRINT OTOMATIS
document.getElementById('printBtn').onclick = () => {
    // Pastikan area bersih dari seleksi (border biru) sebelum cetak
    document.querySelectorAll('.photo-box').forEach(b => b.style.outline = 'none');
    
    // Memberi sedikit jeda agar UI update sebelum dialog print muncul
    setTimeout(() => {
        window.print();
    }, 100);
};

// ... (Sisa fungsi Drag & Download tetap sama)
};
