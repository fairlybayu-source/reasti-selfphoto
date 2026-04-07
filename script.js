const imageInput = document.getElementById('imageInput');
const logoInput = document.getElementById('logoInput');
const photoContainer = document.getElementById('photoContainer');
const captureArea = document.getElementById('captureArea');

// 1. Handling Upload Foto Utama
imageInput.addEventListener('change', function() {
    Array.from(this.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.draggable = true;
            
            // Drag and Drop Urutan Foto
            img.addEventListener('dragstart', () => img.classList.add('dragging'));
            img.addEventListener('dragend', () => img.classList.remove('dragging'));
            
            photoContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

// 2. Sorting Urutan Foto
photoContainer.addEventListener('dragover', e => {
    e.preventDefault();
    const draggingItem = document.querySelector('.dragging');
    const siblings = [...photoContainer.querySelectorAll('img:not(.dragging)')];
    let nextSibling = siblings.find(sibling => e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2);
    photoContainer.insertBefore(draggingItem, nextSibling);
});

// 3. Handling Logo Custom
logoInput.addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const logoImg = document.getElementById('userLogo');
        logoImg.src = event.target.result;
        logoImg.style.display = 'inline-block';
        document.getElementById('defaultBrand').style.display = 'none';
    };
    reader.readAsDataURL(e.target.files[0]);
});

// 4. Background & Filter
function changeBgType(val) {
    captureArea.className = 'photo-strip ' + val;
}

function applyFilter() {
    const val = document.getElementById('filterSelect').value;
    const imgs = photoContainer.querySelectorAll('img');
    imgs.forEach(i => i.style.filter = val);
}

// 5. Sistem Stiker (Move & Resize)
function addSticker(emoji) {
    const sticker = document.createElement('div');
    sticker.className = 'sticker';
    sticker.innerText = emoji;
    sticker.style.fontSize = '40px';
    sticker.style.left = '20px';
    sticker.style.top = '20px';
    
    // Klik untuk Resize
    let size = 40;
    sticker.addEventListener('click', (e) => {
        e.stopPropagation();
        size += 15;
        if (size > 120) size = 30;
        sticker.style.fontSize = size + 'px';
    });

    // Drag Stiker
    let active = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    sticker.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - sticker.offsetLeft;
        initialY = e.clientY - sticker.offsetTop;
        if (e.target === sticker) active = true;
    }

    function drag(e) {
        if (active) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            sticker.style.left = currentX + 'px';
            sticker.style.top = currentY + 'px';
        }
    }

    function dragEnd() { active = false; }

    captureArea.appendChild(sticker);
}

// 6. Download Hasil (High Resolution)
document.getElementById('downloadBtn').onclick = () => {
    html2canvas(captureArea, {
        scale: 3, // Hasil HD
        useCORS: true,
        logging: false,
        backgroundColor: null
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'my-photostrip-pro.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
};