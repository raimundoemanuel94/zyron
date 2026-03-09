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
    
    // Story aspect ratio 9:16 (1080x1920 scaled down for performance but sharp)
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.src = photoBase64;
    
    img.onload = () => {
      // 1. Draw Background Image (Cover style)
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (canvas.width - img.width * ratio) / 2;
      const centerShiftY = (canvas.height - img.height * ratio) / 2;
      
      ctx.drawImage(img, 
        0, 0, img.width, img.height,
        centerShiftX, centerShiftY, img.width * ratio, img.height * ratio
      );

      // 2. Dark Gradient Overlay (Bottom focus)
      const gradient = ctx.createLinearGradient(0, height * 0.4, 0, height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,0.8)');
      gradient.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 3. Branding & Text
      const margin = 80;
      
      // -- Day of Week (Top Left)
      ctx.font = '900 italic 80px "Inter", sans-serif';
      ctx.fillStyle = '#FDE047'; // Tailwind yellow-400
      ctx.textAlign = 'left';
      ctx.fillText(stats.dayName.toUpperCase(), margin, margin + 80);
      
      ctx.font = '700 40px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('ZYRON ALPHA PERFORMANCE', margin, margin + 140);

      // -- Center Stats (Bottom Area)
      const bottomY = height - margin - 200;
      
      // Line: Duration
      ctx.font = '900 italic 120px "Inter", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(stats.duration, margin, bottomY);
      
      ctx.font = '700 uppercase 40px "Inter", sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.fillText('DURAÇÃO DE SONHO', margin, bottomY + 50);

      // Line: Sets
      ctx.font = '900 italic 120px "Inter", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(stats.sets, margin + 500, bottomY);
      
      ctx.font = '700 uppercase 40px "Inter", sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.fillText('SÉRIES BRUTAIS', margin + 500, bottomY + 50);

      // -- Branding (Bottom Center)
      ctx.font = '900 italic 100px "Inter", sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.textAlign = 'center';
      ctx.fillText('ZYRON', width / 2, height - margin);
      
      ctx.font = '700 tracking-widest 30px "Inter", sans-serif';
      ctx.fillStyle = 'white';
      ctx.fillText('ESTILO DE VIDA INDUSTRIAL', width / 2, height - margin + 40);

      // 4. Return Blob
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
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
