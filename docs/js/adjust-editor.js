const adjustEditor = document.querySelector('#adjustEditor');

const rgb2hsv = (r, g, b) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const _h = (r == g && g == b) ? 0 :
             (r >= g && r >= b) ? (g - b) / (max - min) :
             (g >= b && g >= r) ? (b - r) / (max - min) + 2 :
             (b >= r && b >= g) ? (r - g) / (max - min) + 4 : 0;
  const h = (60 * _h + 360) % 360;
  const s = (max > 0) ? (max - min) / max * 100 : 0;
  const v = max * 100 / 255;
  return [h, s, v];
}

const readImage = async e => {
  const face = document.querySelector('#face');
  const file = face.files[0];
  if (!file) return;
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  const img = await createImageBitmap(blob);  
  const canvas = document.querySelector('#over');
  const s = over.width = over.height = Math.max(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, (s - img.width)/2, (s - img.height)/2);

  if (document.querySelector('#transCheck').checked){
    const transColor = document.querySelector('#transColor').value;
    const tc = [...Array(3).keys()].map(i=>parseInt(transColor.slice(1+2*i,3+2*i), 16));
    const [th, ts, tv] = rgb2hsv(...tc);
    const hr = +document.querySelector('#hRangeNumber').value;
    const sr = +document.querySelector('#sRangeNumber').value;
    const vr = +document.querySelector('#vRangeNumber').value;
    const imageData = ctx.getImageData(0, 0, s, s);
    const pixel = imageData.data;
    for (let i=0; i<pixel.length; i+=4) {
      const [h, s, v] = rgb2hsv(...pixel.slice(i,i+3));
      const dh = Math.abs(h - th);
      const ds = Math.abs(s - ts);
      const dv = Math.abs(v - tv);
      if ((Math.min(dh, 360 - dh) <= hr) && (ds <= sr) && (dv <= vr)) pixel[i+3] = 0;
    }
    ctx.clearRect(0, 0, s, s);
    ctx.putImageData(imageData, 0, 0);
  }
  draw();
}

const draw = async () => {
  const img = document.querySelector('#over');

  const x = parseInt(document.querySelector('#xNumber').value);
  const y = parseInt(document.querySelector('#yNumber').value);
  const size = parseInt(document.querySelector('#sizeNumber').value);

  const canvas = document.querySelector('#preview');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, x - size/2, y - size/2, size, size);

  const logo = document.querySelector('#logo');
  const logoImg = document.querySelector('#logoImg');
  if (logo.checked) ctx.drawImage(logoImg, 0, 0, 1920, 1080);
  const mark = document.querySelector('#mark');
  const markImg = document.querySelector('#markImg');
  if (mark.checked) ctx.drawImage(markImg, 0, 0, 1920, 1080);
}

document.querySelectorAll('#face, #transContainer').forEach(e=>e.addEventListener('change', readImage));

adjustEditor.addEventListener('reset', readImage);
adjustEditor.addEventListener('input', e => {
  const t = e.target;
  adjustEditor.querySelectorAll(`input[name="${t.name}"]`).forEach(el => {
    el.value = +t.value;
  });
  draw();
});

document.querySelector('#pick').addEventListener('click', e=>e.target.disabled=true);
document.querySelector('#preview').addEventListener('click', e=>{
  const pick = document.querySelector('#pick');
  if (pick.disabled) {
    const canvas = document.querySelector('#preview');
    const ctx = canvas.getContext('2d');
    const x = parseInt(e.offsetX / canvas.offsetWidth * canvas.width);
    const y = parseInt(e.offsetY / canvas.offsetHeight * canvas.height);
    const rgb = ctx.getImageData(x, y, 1, 1).data.slice(0,3);
    const transColor = document.querySelector('#transColor');
    transColor.value = '#' + rgb.reduce((a,b)=>a<<8 | b).toString(16).padStart(6, '0');
    document.querySelector('#transCheck').checked = true;
    pick.disabled = false;
    readImage();
  }
});
