export const getDominantColor = (imageSrc: string): Promise<string | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }

            // Draw to a small manageable grid (50x50) to ignore noise but keep detail
            const size = 50;
            canvas.width = size;
            canvas.height = size;
            ctx.drawImage(img, 0, 0, size, size);

            const imageData = ctx.getImageData(0, 0, size, size).data;
            let bestColor = { r: 0, g: 0, b: 0, score: -1 };

            // Iterate through pixels to find the most vibrant one
            for (let i = 0; i < imageData.length; i += 4) {
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                const a = imageData[i + 3];

                if (a < 128) continue; // Skip transparent

                // Calculate saturation roughly
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const delta = max - min;

                // Luminance approximation
                const l = (max + min) / 2;

                // Skip very dark or very bright pixels to avoid muddy blacks or pure whites dominating
                // We want colorful mid-tones
                if (l < 20 || l > 235) continue;

                // Score based on saturation (delta) mainly
                // We can add a bias towards brighter colors if needed, but delta is usually good for vibrancy
                if (delta > bestColor.score) {
                    bestColor = { r, g, b, score: delta };
                }
            }

            // Fallback to simple average if no good vibrant color found (e.g. grayscale image)
            if (bestColor.score === -1) {
                const canvas1x1 = document.createElement('canvas');
                canvas1x1.width = 1;
                canvas1x1.height = 1;
                const ctx1x1 = canvas1x1.getContext('2d');
                if (ctx1x1) {
                    ctx1x1.drawImage(img, 0, 0, 1, 1);
                    const [r, g, b] = ctx1x1.getImageData(0, 0, 1, 1).data;
                    bestColor = { r, g, b, score: 0 };
                }
            }

            // Darken the chosen vibrant color
            // Reduce brightness to 30% for background contrast
            const darkenFactor = 0.3;
            const dr = Math.floor(bestColor.r * darkenFactor);
            const dg = Math.floor(bestColor.g * darkenFactor);
            const db = Math.floor(bestColor.b * darkenFactor);

            resolve(`rgb(${dr}, ${dg}, ${db})`);
        };

        img.onerror = () => {
            resolve(null);
        };
    });
};
