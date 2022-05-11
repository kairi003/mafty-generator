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
  log: true,
  logger: logHdlr,
  progress: progHdlr
});

const getFilterComplex = async () => {
  const faceRect = await fetch('src/face_rect.json').then(r => r.json());
  const x0 = parseInt(document.querySelector('#xNumber').value) - 976;
  const y0 = parseInt(document.querySelector('#yNumber').value) - 315;
  const size = parseInt(document.querySelector('#sizeNumber').value);
  const logoEnabled = document.querySelector('#logo').checked;
  const markEnabled = document.querySelector('#mark').checked;
  const overlayX = faceRect.map(([[x1, y1], [x2, y2]], i) => `eq(n,${i + 1})*${(x1 < x2) ? (x1 + x2 - size) / 2 + x0 : 'W'}`).join('+');
  const overlayY = faceRect.map(([[x1, y1], [x2, y2]], i) => `eq(n,${i + 1})*${(y1 < y2) ? (y1 + y2 - size) / 2 + y0 : 'H'}`).join('+');
  const filter = [
    `[1:v]scale=${size}:${size}[face]`,
    `[0:v][face]overlay=x='${overlayX}':y='${overlayY}':enable='lt(n,${faceRect.length})'[overFace]`,
    `[overFace][2:v]overlay=enable='lt(n,${faceRect.length})*${+logoEnabled}'[overLogo]`,
    `[overLogo][3:v]overlay=enable='lt(n,${faceRect.length})*${+markEnabled}'`
  ];
  return filter;
}

const image2video = async () => {
  const message = document.getElementById('message');
  message.innerHTML = 'Loading ffmpeg-core.js';
  if (!ffmpeg.isLoaded()) {
    try {
      await ffmpeg.load();
    } catch (e) {
      alert(e);
      throw e;
    }
  }
  message.innerHTML = 'Loading data';

  await Promise.all(['origin.mp4', 'logo.png', 'mark.png']
    .map(async p => ffmpeg.FS('writeFile', p, await fetchFile('src/' + p))));
  const faceCanvas = document.querySelector('#over');
  const faceBuffer = await new Promise(r => faceCanvas.toBlob(r)).then(b => b.arrayBuffer());
  ffmpeg.FS('writeFile', 'face.png', new Uint8Array(faceBuffer));
  const filterComplex = await getFilterComplex();

  message.innerHTML = 'Start transcoding';
  await ffmpeg.run(
    '-i', 'origin.mp4', '-i', 'face.png', '-i', 'logo.png', '-i', 'mark.png',
    '-c:v', 'libx264', '-c:a', 'copy',
    '-x264-params', 'keyint=15:no-deblock=1',
    '-pix_fmt', 'yuv420p',
    '-sws_flags', 'spline+accurate_rnd+full_chroma_int',
    '-filter_complex', filterComplex.join(';'),
    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-preset', 'slow',
    'out.mp4');
  const data = ffmpeg.FS('readFile', 'out.mp4');
  const video = document.getElementById('output-video');
  video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
  document.getElementById('video-download').href = video.src;

  message.innerHTML = 'Cleaning FS';
  ffmpeg.FS('readdir', '.')
    .filter(p=>p.endsWith('.mp4')||p.endsWith('.png'))
    .forEach(p=>ffmpeg.FS('unlink', p));

  message.innerHTML = 'Finish!!';
  logHdlr({ type: 'info', message: 'Finish!!' });
}
const elm = document.getElementById('start-btn');
elm.addEventListener('click', image2video);
