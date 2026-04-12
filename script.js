const photoContainer = document.getElementById('photoContainer');
const captureArea = document.getElementById('captureArea');

function changeLayout(type) {
    captureArea.className = `photo-strip white ${type}`;
}

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

            let isDragging = false;
            let startX, startY;
            img.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX - img.offsetLeft;
                startY = e.clientY - img.offsetTop;
                e.preventDefault();
            });

            let isResizing = false;
            let scale = 1;
            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                e.preventDefault(); e.stopPropagation();
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    img.style.left = (e.clientX - startX) + "px";
                    img.style.top = (e.clientY - startY) + "px";
                }
                if (isResizing) {
                    let delta = (e.clientX - startX) * 0.003; 
                    scale = Math.max(0.1, scale + delta); // Bisa dikecilkan sampai sangat kecil
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

function addSticker(emoji) {
    const s = document.createElement('div');
    s.className = 'sticker';
    s.innerText = emoji;
    s.style.left = '100px'; s.style.top = '100px';
    let active = false;
    s.onmousedown = (e) => { active = true; s.iX = e.clientX - s.offsetLeft; s.iY = e.clientY - s.offsetTop; };
    document.onmousemove = (e) => { if(active) { s.style.left = (e.clientX - s.iX) + 'px'; s.style.top = (e.clientY - s.iY) + 'px'; }};
    document.onmouseup = () => active = false;
    captureArea.appendChild(s);
}

function changeBg(val) { captureArea.classList.remove('white','black','polka-pink','grad-sunset'); captureArea.classList.add(val); }

document.getElementById('logoInput').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
        const logo = document.getElementById('userLogo');
        logo.src = ev.target.result; logo.style.display = 'block';
        document.querySelector('.branding-text').style.display = 'none';
    };
    reader.readAsDataURL(e.target.files[0]);
};

document.getElementById('downloadBtn').onclick = () => {
    document.querySelectorAll('.resizer').forEach(r => r.style.display = 'none');
    html2canvas(captureArea, { scale: 4, useCORS: true }).then(canvas => {
        document.querySelectorAll('.resizer').forEach(r => r.style.display = 'block');
        const link = document.createElement('a');
        link.download = 'photobox-HD.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    });
};
