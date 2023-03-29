const FRAMES = 700;

const logArea = document.querySelector('#logArea');
const logHdlr = ({type, message}) => {
  const text = `[${type}] ${message}\n`;
  logArea.appendChild(document.createTextNode(text));
  logArea.scrollTo(0, logArea.scrollHeight);
  if (message.startsWith('frame')) {
    const match = message.match(/frame=\s*(\d+)/);
    if (match) {
      const f = parseFloat(match[1]);
      progHdlr({ratio: f / FRAMES});
    }
  } else if (message.startsWith('video:')) {
    progHdlr({ratio: 1});
  }
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
  //progress: progHdlr
});

const getFilterComplex = async () => {
  const faceCorrd = await fetch('src/face_coord.json').then(r => r.json());
  const x0 = parseInt(document.querySelector('#xNumber').value) - 976;
  const y0 = parseInt(document.querySelector('#yNumber').value) - 315;
  const size = parseInt(document.querySelector('#sizeNumber').value);
  const logoEnabled = document.querySelector('#logo').checked;
  const markEnabled = document.querySelector('#mark').checked;
  const overlayX = faceCorrd.map(([x, y], i) => `eq(n,${i + 1})*${x + x0 - size/2}`);
  const overlayY = faceCorrd.map(([x, y], i) => `eq(n,${i + 1})*${y + y0 - size/2}`);
  const filter = [
    `[1:v]scale=${size}:${size},split=3[face][face2][face3]`,
    `[0:v][face]overlay=x='${overlayX.slice(  0,251).join('+')}':y='${overlayY.slice(  0,251).join('+')}':enable='lte(n,250)'[t1]`,
    `[t1][face2]overlay=x='${overlayX.slice(249,501).join('+')}':y='${overlayY.slice(249,501).join('+')}':enable='between(n,250,500)'[t2]`,
    `[t2][face3]overlay=x='${overlayX.slice(499    ).join('+')}':y='${overlayY.slice(499    ).join('+')}':enable='gte(n,500)'[overFace]`,
    `[overFace][2:v]overlay=enable='lt(n,${FRAMES})*${+logoEnabled}'[overLogo]`,
    `[overLogo][3:v]overlay=enable='lt(n,${FRAMES})*${+markEnabled}'`
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

  await Promise.all(['origin.mp4', 'logo.png', 'mark.png', 'bgm.mp4']
    .map(async p => ffmpeg.FS('writeFile', p, await fetchFile('src/' + p))));
  const faceCanvas = document.querySelector('#over');
  const faceBuffer = await new Promise(r => faceCanvas.toBlob(r)).then(b => b.arrayBuffer());
  ffmpeg.FS('writeFile', 'face.png', new Uint8Array(faceBuffer));
  const filterComplex = await getFilterComplex();

  const bgmBuffer = await document.querySelector('#bgm').files[0]?.arrayBuffer();
  if (bgmBuffer) ffmpeg.FS('writeFile', 'bgm.mp4', new Uint8Array(bgmBuffer));
  const ss = document.querySelector('#bgmStart').value;

  message.innerHTML = 'Start transcoding';
  await ffmpeg.run(
    '-i', 'origin.mp4', '-i', 'face.png', '-i', 'logo.png', '-i', 'mark.png',
    '-ss', ss, '-t', '23.3', '-i', 'bgm.mp4', '-map', '4:a:0',
    '-c:v', 'libx264', '-c:a', 'copy',
    '-x264-params', 'keyint=15:no-deblock=1',
    '-pix_fmt', 'yuv420p',
    '-sws_flags', 'spline+accurate_rnd+full_chroma_int',
    '-filter_complex', filterComplex.join(';'),
    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-preset', 'slow',
    '-y', 'out.mp4');
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


document.getElementById('startBtn').addEventListener('click', e => {
  const adjustEditor = document.getElementById('adjustEditor');
  adjustEditor.disabled = true;
  image2video().finally(()=>adjustEditor.disabled=false);
});
