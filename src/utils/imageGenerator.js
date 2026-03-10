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

      // ── 3. Gradiente superior sutil (escurece topo para legibilidade) ─────
      const topGrad = ctx.createLinearGradient(0, 0, 0, 500);
      topGrad.addColorStop(0, 'rgba(0,0,0,0.70)');
      topGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, 400);

      // ── 4. Gradiente inferior de contraste (Y: 900 → H) ─────────────────
      const botGrad = ctx.createLinearGradient(0, 900, 0, H);
      botGrad.addColorStop(0,    'rgba(0,0,0,0)');
      botGrad.addColorStop(0.45, 'rgba(0,0,0,0.75)');
      botGrad.addColorStop(1,    'rgba(0,0,0,0.97)');
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, 0, W, H);

      // ══════════════════════════════════════════════════════════════════════
      // TEXTOS — calculados de BAIXO para CIMA
      // ══════════════════════════════════════════════════════════════════════

      // ── [BASE] Y = H - 60  →  Tagline ────────────────────────────────────
      ctx.textAlign = 'center';
      ctx.font      = '400 28px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText('ESTILO DE VIDA INDUSTRIAL', W / 2, H - 60);

      // ── [1]   Y = H - 110 →  Marca d'água "ZYRON" ────────────────────────
      ctx.font      = 'bold italic 80px sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.fillText('ZYRON', W / 2, H - 110);

      // ── [2]   Y = H - 205 →  Linha divisória ─────────────────────────────
      ctx.strokeStyle = 'rgba(253,224,71,0.35)';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(80, H - 205);
      ctx.lineTo(W - 80, H - 205);
      ctx.stroke();

      // ── [3]   Y = H - 280 →  Stats: tempo · séries ───────────────────────
      const durText  = stats.duration || '--';
      const setsText = `${stats.sets || '--'}`;
      ctx.textAlign = 'center';
      ctx.font      = 'bold 68px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${durText}   ·   ${setsText}`, W / 2, H - 280);

      // ── [4]   Y = H - 360 → labels abaixo dos números ────────────────────
      ctx.font      = '500 30px sans-serif';
      ctx.fillStyle = 'rgba(253,224,71,0.85)';
      ctx.fillText('TEMPO DE TREINO                SÉRIES', W / 2, H - 350);

      // ── [5]   Y = H - 430 →  "GYM · ZYRON" badge ─────────────────────────
      // Fundo pill amarelo
      const badgeW = 320;
      const badgeH = 70;
      const badgeX = (W - badgeW) / 2;
      const badgeY = H - 500;
      const r = 35;
      ctx.beginPath();
      ctx.moveTo(badgeX + r, badgeY);
      ctx.lineTo(badgeX + badgeW - r, badgeY);
      ctx.quadraticCurveTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + r);
      ctx.lineTo(badgeX + badgeW, badgeY + badgeH - r);
      ctx.quadraticCurveTo(badgeX + badgeW, badgeY + badgeH, badgeX + badgeW - r, badgeY + badgeH);
      ctx.lineTo(badgeX + r, badgeY + badgeH);
      ctx.quadraticCurveTo(badgeX, badgeY + badgeH, badgeX, badgeY + badgeH - r);
      ctx.lineTo(badgeX, badgeY + r);
      ctx.quadraticCurveTo(badgeX, badgeY, badgeX + r, badgeY);
      ctx.closePath();
      ctx.fillStyle = '#FDE047';
      ctx.fill();

      ctx.font      = 'bold 34px sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText('🏋️  GYM · ZYRON', W / 2, badgeY + 46);

      // ── [6]   Y = H - 590 → Dias da Semana estilo Mtfit ──────────────────
      const dayLabels  = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      const todayIdx   = stats.dayIndex ?? new Date().getDay(); // 0=Dom
      const cellSize   = 100;
      const gap        = 28;
      const totalW     = dayLabels.length * cellSize + (dayLabels.length - 1) * gap;
      const startX     = (W - totalW) / 2;
      const baseY      = H - 630;

      dayLabels.forEach((lbl, i) => {
        const cx = startX + i * (cellSize + gap) + cellSize / 2;
        const cy = baseY;
        const isToday = i === todayIdx;

        // Círculo de fundo
        ctx.beginPath();
        ctx.arc(cx, cy, cellSize / 2, 0, Math.PI * 2);

        if (isToday) {
          ctx.fillStyle = '#FDE047';
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
        }
        ctx.fill();

        // Borda no dia ativo
        if (isToday) {
          ctx.strokeStyle = '#FDE047';
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        // Letra do dia
        ctx.font      = isToday ? 'bold 40px sans-serif' : '500 38px sans-serif';
        ctx.fillStyle = isToday ? '#000000' : 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lbl, cx, cy);

        // Ponto embaixo do dia ativo
        if (isToday) {
          ctx.beginPath();
          ctx.arc(cx, cy + cellSize / 2 + 14, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#FDE047';
          ctx.fill();
        }
      });

      // Reset textBaseline
      ctx.textBaseline = 'alphabetic';

      // ══════════════════════════════════════════════════════════════════════
      // TOPO — Título do Dia
      // ══════════════════════════════════════════════════════════════════════

      // ── [TOPO 1] Y = 175 →  Nome do Dia em amarelo grande ─────────────────
      ctx.textAlign = 'left';
      ctx.font      = 'bold italic 88px sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.fillText((stats.dayName || 'DIA DE TREINO').toUpperCase(), 80, 175);

      // ── [TOPO 2] Y = 240 →  Sublinha decorativa amarela ──────────────────
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth   = 6;
      ctx.beginPath();
      ctx.moveTo(80, 215);
      ctx.lineTo(460, 215);
      ctx.stroke();

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
