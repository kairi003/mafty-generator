const logArea = document.querySelector('#logArea');
const logHdlr = msg => {
  const text = `[${msg.type}] ${msg.message}\n`;
  logArea.appendChild(document.createTextNode(text));
  logArea.scrollTo(0, logArea.scrollHeight);
}
const progBar = document.querySelector('#progBar');
const progHdlr = p => {
  progBar.value = p.ratio;
}

const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
  corePath: 'js/core/ffmpeg-core.js',
  log: false,
  logger: logHdlr,
  progress: progHdlr
});

const getFaceImage = async () => {
  const face = document.querySelector('#face');
  const file = face.files[0];
  if (!file) return;
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  const img = await createImageBitmap(blob);
  return img;
}

const image2video = async () => {
  const message = document.getElementById('message');
  message.innerHTML = 'Loading ffmpeg-core.js';
  await ffmpeg.load();

  message.innerHTML = 'Loading data';
  const faceRect = await fetch('src/face_rect.json').then(r => r.json());
  ffmpeg.FS('writeFile', 'origin.mp4', await fetchFile('src/origin.mp4'));
  await ffmpeg.run('-i', 'origin.mp4', '-an', '-c:v', 'png', '%04d.png');

  message.innerHTML = 'Rewrite data';
  const frameNames = ffmpeg.FS('readdir', '.').filter(p => p.endsWith('.png'));
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  const faceImg = await getFaceImage();
  for (const i in frameNames) {
    const p = frameNames[i];
    const img = await createImageBitmap(new Blob([ffmpeg.FS('readFile', p)], { type: 'image/png' }));
    ctx.drawImage(img, 0, 0);
    if (faceImg && faceRect[i]) {
      const size = 250;
      const [[x1, y1], [x2, y2]] = faceRect[i];
      if (x1 < x2 && y1 < y2) {
        const [dx, dy] = [(x1 + x2 - size) / 2, (y1 + y2 - size) / 2]
        ctx.drawImage(faceImg, dx, dy, size, size);
      }
    }
    const blob = await new Promise(r => canvas.toBlob(r, { type: 'image/png' }));
    ffmpeg.FS('writeFile', p, new Uint8Array(await blob.arrayBuffer()));
    progHdlr({ ratio: (1 + +i) / frameNames.length });
  };

  message.innerHTML = 'Start transcoding';
  await ffmpeg.run('-framerate', '29.97', '-pattern_type', 'glob', '-i', '*.png', '-i', 'origin.mp4', '-c:v', 'libx264', '-c:a', 'copy', '-map', '0:v', '-map', '1:a', '-pix_fmt', 'yuv420p', 'out.mp4');
  const data = ffmpeg.FS('readFile', 'out.mp4');
  const video = document.getElementById('output-video');
  video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
  ffmpeg.FS('unlink', 'origin.mp4')
  //Promise.all(frameNames.map(async p => ffmpeg.FS('unlink', p)));
  logHdlr({ type: 'info', message: 'Finish!' })
}
const elm = document.getElementById('start-btn');
elm.addEventListener('click', image2video);
