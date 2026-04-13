document.getElementById('magicScan').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            photoContainer.innerHTML = '';
            captureArea.className = 'photo-strip auto-detect-mode';
            templateImg.src = img.src;
            templateImg.style.display = 'block';
            
            // Scan area transparan
            detectTransparentAreas(img);
        };
    };
    reader.readAsDataURL(file);
});

function detectTransparentAreas(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Sesuaikan resolusi scan dengan ukuran container 4R
    canvas.width = 380; 
    canvas.height = 570;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const visited = new Uint8Array(canvas.width * canvas.height);
    const threshold = 10; // Toleransi transparansi (0-255)

    // Gunakan step lebih kecil (5px) untuk akurasi tinggi
    for (let y = 0; y < canvas.height; y += 5) {
        for (let x = 0; x < canvas.width; x += 5) {
            const idx = (y * canvas.width + x) * 4;
            const alpha = imageData[idx + 3];

            // Jika menemukan pixel transparan dan belum pernah diproses
            if (alpha < threshold && !visited[y * canvas.width + x]) {
                let minX = x, maxX = x, minY = y, maxY = y;
                
                // Cari batas area transparan yang terhubung (Flood Fill sederhana)
                let stack = [[x, y]];
                while(stack.length > 0) {
                    let [currX, currY] = stack.pop();
                    if (currX < 0 || currX >= canvas.width || currY < 0 || currY >= canvas.height) continue;
                    if (visited[currY * canvas.width + currX]) continue;

                    const cIdx = (currY * canvas.width + currX) * 4;
                    if (imageData[cIdx + 3] < threshold) {
                        visited[currY * canvas.width + currX] = 1;
                        minX = Math.min(minX, currX);
                        maxX = Math.max(maxX, currX);
                        minY = Math.min(minY, currY);
                        maxY = Math.max(maxY, currY);

                        // Cek tetangga (step diperbesar untuk performa scan)
                        stack.push([currX + 15, currY], [currX, currY + 15]);
                    }
                }

                // Buat kotak jika ukurannya masuk akal (minimal 50px)
                const width = maxX - minX;
                const height = maxY - minY;
                if (width > 50 && height > 50) {
                    // Beri sedikit offset negatif agar foto masuk sedikit di bawah bingkai (overlap)
                    createPhotoBox(true, minX - 2, minY - 2, width + 4, height + 4);
                }
            }
        }
    }
}
