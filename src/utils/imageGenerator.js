/**
 * Utility to generate a ZYRON branded shareable card for social media (Stories)
 * @param {string} photoBase64 - User's captured photo
 * @param {Object} stats - Workout stats { duration, sets, dayName, dayIndex? }
 * @returns {Promise<Blob>} - Generated image blob
 *
 * LAYOUT (de baixo para cima, sem sobreposição):
 *   H - 60   → "ESTILO DE VIDA INDUSTRIAL" (tagline)
 *   H - 120  → "ZYRON" (marca d'água amarela)
 *   H - 210  → divider line
 *   H - 290  → stats row: "Xm Ys  ·  N séries"
 *   H - 370  → label: "GYM · ZYRON"
 *   H - 480  → dias da semana (7 blocos estilo Mtfit)
 *   ------
 *   Y: 100   → Título do dia (topo)
 *   Y: 195   → bar decorativa
 */
export async function generateShareableImage(photoBase64, stats) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');

    // ── 1. Canvas 1080×1920 (Stories 9:16) ─────────────────────────────────
    const W = 1080;
    const H = 1920;
    canvas.width  = W;
    canvas.height = H;

    const img = new Image();
    img.src = photoBase64;

    img.onload = () => {
      // ── 2. Cover Image ───────────────────────────────────────────────────
      const scale   = Math.max(W / img.width, H / img.height);
      const drawW   = img.width  * scale;
      const drawH   = img.height * scale;
      const offsetX = (W - drawW) / 2;
      const offsetY = (H - drawH) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      // ── 3. Gradiente inferior de contraste (Y: H - 500 → H) ─────────────────
      // Menos gradiente, apenas o suficiente para os textos na parte de baixo
      const botGrad = ctx.createLinearGradient(0, H - 500, 0, H);
      botGrad.addColorStop(0,    'rgba(0,0,0,0)');
      botGrad.addColorStop(0.6,  'rgba(0,0,0,0.6)');
      botGrad.addColorStop(1,    'rgba(0,0,0,0.9)');
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, H - 500, W, 500);

      // ══════════════════════════════════════════════════════════════════════
      // CORPO REFORMULADO (CLEAN)
      // ══════════════════════════════════════════════════════════════════════

      // ── Dias da Semana estilo Mtfit (Agressive Streak) ──────────────────
      const dayLabels  = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      const todayIdx   = stats.dayIndex ?? new Date().getDay(); // 0=Dom
      const trainedDays = stats.trainedDays || [todayIdx]; // Fallback to at least today

      const cellSize   = 100;
      const gap        = 28;
      const totalW     = dayLabels.length * cellSize + (dayLabels.length - 1) * gap;
      const startX     = (W - totalW) / 2;
      const baseY      = H - 250;

      dayLabels.forEach((lbl, i) => {
        const cx = startX + i * (cellSize + gap) + cellSize / 2;
        const cy = baseY;
        const isToday = i === todayIdx;
        const isTrained = trainedDays.includes(i);

        // Círculo de fundo
        ctx.beginPath();
        ctx.arc(cx, cy, cellSize / 2, 0, Math.PI * 2);

        if (isTrained) {
          ctx.fillStyle = '#FDE047'; // Aggressive Yellow fill for trained days
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.08)'; // Dim background for untrained
        }
        ctx.fill();

        // Borda agressiva no dia atual
        if (isToday) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 6;
          ctx.stroke();
        }

        // Letra do dia ou Ícone de Check
        ctx.font      = isTrained ? 'bold 44px sans-serif' : '500 38px sans-serif';
        ctx.fillStyle = isTrained ? '#000000' : 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Em vez da letra, se treinou, podemos colocar um 'X' ou usar a letra forte
        ctx.fillText(isTrained ? 'X' : lbl, cx, cy + 4); 

        // Ponto embaixo contínuo para dias de série (streak)
        if (isTrained) {
          ctx.beginPath();
          ctx.arc(cx, cy + cellSize / 2 + 18, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#FDE047';
          ctx.fill();
        }
      });

      // Reset textBaseline
      ctx.textBaseline = 'alphabetic';

      // ── Logo "ZYRON" ────────────────────────
      ctx.textAlign = 'center';
      ctx.font      = 'bold italic 72px sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.fillText('ZYRON', W / 2, H - 110);

      // ── Tagline ────────────────────────────────────
      ctx.font      = '400 24px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.letterSpacing = '4px';
      ctx.fillText('A FORÇA DA SUA EVOLUÇÃO.', W / 2, H - 60);

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
