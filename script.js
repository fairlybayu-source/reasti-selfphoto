const imageInput = document.getElementById('imageInput');
const logoInput = document.getElementById('logoInput');
const photoContainer = document.getElementById('photoContainer');
const captureArea = document.getElementById('captureArea');

// Ganti Layout
function changeLayout(type) {
    captureArea.classList.remove('layout-strip', 'layout-grid', 'layout-double');
    captureArea.classList.add(type);
}

// Upload Foto
imageInput.addEventListener('change', function() {
    Array.from(this.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.draggable = true;
            img.addEventListener('dragstart', () => img.classList.add('dragging'));
            img.addEventListener('dragend', () => img.classList.remove('dragging'));
            photoContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

// Drag & Drop Urutan Foto
photoContainer.addEventListener('dragover', e => {
    e.preventDefault();
    const draggingItem = document.querySelector('.dragging');
    const siblings = [...photoContainer.querySelectorAll('img:not(.dragging)')];
    let nextSibling = siblings.find(sib => e.clientY <= sib.offsetTop + sib.offsetHeight / 2);
    photoContainer.insertBefore(draggingItem, nextSibling);
});

// Upload Logo
logoInput.addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        const logo = document.getElementById('userLogo');
        logo.src = ev.target.result;
        logo.style.display = 'block';
        document.getElementById('defaultBrand').style.display = 'none';
    };
    reader.readAsDataURL(e.target.files[0]);
});

// Background & Filter
function changeBgType(val) { captureArea.className = `photo-strip ${val} ${captureArea.classList[2]}`; }
function applyFilter() {
    const val = document.getElementById('filterSelect').value;
    photoContainer.querySelectorAll('img').forEach(img => img.style.filter = val);
}

// Stiker System
function addSticker(emoji) {
    const s = document.createElement('div');
    s.className = 'sticker';
    s.innerText = emoji;
    s.style.fontSize = '40px';
    s.style.left = '50px'; s.style.top = '50px';
    
    let size = 40;
    s.onclick = (e) => { e.stopPropagation(); size += 15; if(size > 120) size = 30; s.style.fontSize = size + 'px'; };

    let active = false;
    s.onmousedown = (e) => { active = true; s.initialX = e.clientX - s.offsetLeft; s.initialY = e.clientY - s.offsetTop; };
    document.onmousemove = (e) => {
        if (!active) return;
        s.style.left = (e.clientX - s.initialX) + 'px';
        s.style.top = (e.clientY - s.initialY) + 'px';
    };
    document.onmouseup = () => active = false;
    captureArea.appendChild(s);
}

// Download HD 4R (1200x1800)
document.getElementById('downloadBtn').onclick = () => {
    const originalW = captureArea.style.width;
    const originalH = captureArea.style.height;

    captureArea.style.width = '1200px';
    captureArea.style.height = '1800px';

    html2canvas(captureArea, { scale: 1, useCORS: true }).then(canvas => {
        captureArea.style.width = originalW;
        captureArea.style.height = originalH;
        const link = document.createElement('a');
        link.download = 'photobox-4R.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
};
