{
  /** @type {HTMLButtonElement} */
  const button = document.querySelector('#auditionButton');
  /** @type {HTMLAudioElement} */
  const player = document.querySelector('#auditionPlayer');
  /** @type {HTMLInputElement} */
  const input = document.querySelector('#bgm');

  const revoke = () => {
    player.pause();
    button.textContent = 'Audition';
    try {
      URL.revokeObjectURL(player.src);
    } catch {}
    player.src = '';
  }
  
  player.addEventListener('ended', revoke);
  input.addEventListener('change', revoke);
  player.addEventListener('timeupdate', () => {
    const ss = document.querySelector('#bgmStart').valueAsNumber / 1000;
    const t = player.currentTime;
    if (ss + 23.3 < t) revoke();
  });

  button.addEventListener('click', () => {
    if (player.paused) {
      const ss = document.querySelector('#bgmStart').valueAsNumber / 1000;
      const file = input.files[0];
      player.src = URL.createObjectURL(file);
      player.currentTime = ss;
      button.textContent = 'Stop';
      console.log(player.src);
      player.play();
    } else {
      revoke();
    }
  });
}
