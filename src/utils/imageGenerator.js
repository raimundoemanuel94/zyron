/**
 * Generates a ZYRON branded share card for stories.
 * @param {string} photoBase64
 * @param {Object} stats
 * @returns {Promise<Blob>}
 */
export async function generateShareableImage(photoBase64, stats) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    const img = new Image();
    img.src = photoBase64;

    img.onload = () => {
      const scale = Math.max(W / img.width, H / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = (W - drawW) / 2;
      const offsetY = (H - drawH) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      const topGrad = ctx.createLinearGradient(0, 0, 0, 360);
      topGrad.addColorStop(0, 'rgba(0,0,0,0.68)');
      topGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, 360);

      const bottomGrad = ctx.createLinearGradient(0, H - 720, 0, H);
      bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bottomGrad.addColorStop(0.48, 'rgba(0,0,0,0.66)');
      bottomGrad.addColorStop(1, 'rgba(0,0,0,0.95)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, H - 720, W, 720);

      roundRect(ctx, 64, H - 640, W - 128, 520, 44);
      ctx.fillStyle = 'rgba(5,7,6,0.62)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(205,255,90,0.22)';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '700 26px sans-serif';
      ctx.fillStyle = 'rgba(205,255,90,0.88)';
      ctx.fillText('TREINO CONCLUIDO', 96, H - 552);

      ctx.font = '900 60px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(stats.dayName || getLocalizedDayName(), 96, H - 484);

      ctx.font = '700 28px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.64)';
      ctx.fillText(`${stats.duration}  /  ${stats.sets}`, 96, H - 432);

      drawWeekStrip(ctx, {
        x: 96,
        y: H - 320,
        todayIdx: stats.dayIndex ?? new Date().getDay(),
        trainedDays: stats.trainedDays || [new Date().getDay()],
      });

      ctx.textAlign = 'center';
      ctx.font = '900 58px sans-serif';
      ctx.fillStyle = '#CDFF5A';
      ctx.fillText('ZYRON', W / 2, H - 192);

      ctx.font = '600 22px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.54)';
      ctx.fillText('A FORCA DA SUA EVOLUCAO', W / 2, H - 154);

      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    };

    img.onerror = reject;
  });
}

function drawWeekStrip(ctx, { x, y, todayIdx, trainedDays }) {
  const labels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const cell = 76;
  const gap = 22;

  labels.forEach((label, i) => {
    const cx = x + i * (cell + gap) + cell / 2;
    const isToday = i === todayIdx;
    const isTrained = trainedDays.includes(i);

    ctx.beginPath();
    ctx.arc(cx, y, cell / 2, 0, Math.PI * 2);
    ctx.fillStyle = isTrained ? '#CDFF5A' : 'rgba(255,255,255,0.08)';
    ctx.fill();

    if (isToday) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = isTrained ? '800 28px sans-serif' : '700 30px sans-serif';
    ctx.fillStyle = isTrained ? '#050704' : 'rgba(255,255,255,0.42)';
    ctx.fillText(isTrained ? 'OK' : label, cx, y + 2);

    if (isTrained) {
      ctx.beginPath();
      ctx.arc(cx, y + cell / 2 + 16, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#CDFF5A';
      ctx.fill();
    }
  });

  ctx.textBaseline = 'alphabetic';
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Get current day name in PT-BR with an adjective.
 */
export function getLocalizedDayName() {
  const days = [
    'Domingo Forte',
    'Segunda Forte',
    'Terca Intensa',
    'Quarta Forte',
    'Quinta Forte',
    'Sexta Forte',
    'Sabado Forte',
  ];
  return days[new Date().getDay()];
}
