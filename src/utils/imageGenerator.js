/**
 * Utility to generate a ZYRON branded shareable card for social media (Stories)
 * @param {string} photoBase64 - User's captured photo
 * @param {Object} stats - Workout stats { duration, sets, dayName }
 * @returns {Promise<Blob>} - Generated image blob
 */
export async function generateShareableImage(photoBase64, stats) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // ── 1. Canvas fixo 1080×1920 (proporção Stories 9:16) ──────────────────
    const W = 1080;
    const H = 1920;
    canvas.width  = W;
    canvas.height = H;

    const img = new Image();
    img.src = photoBase64;

    img.onload = () => {
      // ── 2. Cover: escala mantendo proporção, centraliza e corta as sobras ─
      const scale     = Math.max(W / img.width, H / img.height);
      const drawW     = img.width  * scale;
      const drawH     = img.height * scale;
      const offsetX   = (W - drawW) / 2;
      const offsetY   = (H - drawH) / 2;

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      // ── 3. Gradiente inferior de contraste (Y: 1000 → 1920) ───────────────
      const grad = ctx.createLinearGradient(0, 1000, 0, H);
      grad.addColorStop(0,   'rgba(0,0,0,0)');
      grad.addColorStop(0.6, 'rgba(0,0,0,0.75)');
      grad.addColorStop(1,   'rgba(0,0,0,0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // ── 4. Textos — posições calculadas de BAIXO para CIMA ────────────────
      //
      //  Y = H - 50  → 1870  Tagline
      //  Y = H - 100 → 1820  Marca d'água  "ZYRON INDUSTRIAL"
      //  Y = H - 180 → 1740  Linha de estatísticas
      //  Y = H - 310 → 1610  Label DURAÇÃO / SÉRIES
      //  Y = H - 370 → 1550  Números grandes (duration / sets)
      //  Y = 150          → Título do Dia (topo)

      // ── CAMADA 1 (mais baixa): Tagline ────────────────────────────────────
      ctx.textAlign = 'center';
      ctx.font      = '500 32px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillText('ESTILO DE VIDA INDUSTRIAL', W / 2, H - 50); // Y = 1870

      // ── CAMADA 2: Marca d'água ─────────────────────────────────────────────
      ctx.font      = 'bold italic 90px sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.fillText('ZYRON INDUSTRIAL', W / 2, H - 100); // Y = 1820

      // ── CAMADA 3: Estatísticas numa linha só ──────────────────────────────
      ctx.font      = '700 55px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(
        `DURAÇÃO: ${stats.duration || '--'}   |   SÉRIES: ${stats.sets || '--'}`,
        W / 2,
        H - 180 // Y = 1740
      );

      // ── CAMADA 4: Números grandes + labels (left-aligned) ─────────────────
      const col1X = 80;
      const col2X = W / 2 + 40;

      // Números grandes
      ctx.textAlign = 'left';
      ctx.font      = 'bold italic 120px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(stats.duration || '--', col1X, H - 370); // Y = 1550
      ctx.fillText(stats.sets     || '--', col2X, H - 370);

      // Labels amarelas
      ctx.font      = 'bold 38px sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.fillText('DURAÇÃO', col1X, H - 310); // Y = 1610
      ctx.fillText('SÉRIES',  col2X, H - 310);

      // ── CAMADA 5 (topo): Título do Dia ────────────────────────────────────
      ctx.textAlign = 'left';
      ctx.font      = 'bold italic 80px sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.fillText((stats.dayName || 'DIA DE TREINO').toUpperCase(), 80, 150); // Y = 150

      ctx.font      = '500 40px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('ZYRON ALPHA PERFORMANCE', 80, 220);

      // ── 5. Retorna Blob JPEG ───────────────────────────────────────────────
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    };

    img.onerror = reject;
  });
}

/**
 * Get current day name in PT-BR with an adjective
 */
export function getLocalizedDayName() {
  const days = [
    'Domingo Implacável',
    'Segunda Brutal',
    'Terça Intensa',
    'Quarta Destruidora',
    'Quinta Dominante',
    'Sexta Alpha',
    'Sábado de Ferro'
  ];
  return days[new Date().getDay()];
}
