const photoContainer = document.getElementById('photoContainer');
const captureArea = document.getElementById('captureArea');
const templateImg = document.getElementById('templateOverlay');

document.getElementById('magicScan').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            // 1. Reset Container
            photoContainer.innerHTML = '';
            templateImg.src = img.src;
            templateImg.style.display = 'block';

            // 2. Jalankan deteksi presisi
            runPrecisionScan(img);
        };
    };
    reader.readAsDataURL(file);
});

function runPrecisionScan(imgSource) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Gunakan ukuran tetap 4R sebagai basis koordinat (380x570)
    canvas.width = 380;
    canvas.height = 570;
    
    // Gambar template ke canvas (auto-scale ke 380x570)
    ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const visited = new Uint8Array(canvas.width * canvas.height);

    // Scan setiap 5 pixel untuk performa
    for (let y = 0; y < canvas.height; y += 5) {
        for (let x = 0; x < canvas.width; x += 5) {
            const index = (y * canvas.width + x) * 4;
            const alpha = imageData[index + 3];

            // Jika transparan (Alpha < 50) dan belum dikunjungi
            if (alpha < 50 && !visited[y * canvas.width + x]) {
                let minX = x, maxX = x, minY = y, maxY = y;
                
                // Cari batas area transparan
                let queue = [[x, y]];
                visited[y * canvas.width + x] = 1;

                while(queue.length > 0) {
                    let [cx, cy] = queue.shift();
                    minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
                    minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);

                    // Cek tetangga kanan dan bawah saja (untuk kecepatan)
                    let checkPoints = [[cx + 5, cy], [cx, cy + 5]];
                    checkPoints.forEach(([nx, ny]) => {
                        if (nx < canvas.width && ny < canvas.height && !visited[ny * canvas.width + nx]) {
                            const nIdx = (ny * canvas.width + nx) * 4;
                            if (imageData[nIdx + 3] < 50) {
                                visited[ny * canvas.width + nx] = 1;
                                queue.push([nx, ny]);
                            }
                        }
                    });
                }

                // Buat kotak jika area cukup besar
                const w = maxX - minX;
                const h = maxY - minY;
                if (w > 30 && h > 30) {
                    // Tambahkan padding 1px agar tidak ada celah putih
                    createPhotoBox(minX - 1, minY - 1, w + 2, h + 2);
                }
            }
        }
    }
}

function createPhotoBox(x, y, w, h) {
    const box = document.createElement('div');
    box.className = 'photo-box';
    box.style.left = x + 'px';
    box.style.top = y + 'px';
    box.style.width = w + 'px';
    box.style.height = h + 'px';

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
                img.style.width = "100%"; // Fit ke kotak
                box.appendChild(img);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };
    photoContainer.appendChild(box);
}

// Fitur Simpan
document.getElementById('downloadBtn').onclick = () => {
    html2canvas(captureArea, { scale: 3 }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Photobox-Precision.png';
        link.href = canvas.toDataURL();
        link.click();
    });
};
