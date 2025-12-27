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

            canvas.width = 1;
            canvas.height = 1;

            // Draw image resized to 1x1 to get average color
            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

            // Darken the color slightly for better background contrast (as requested)
            // Reduce brightness by 40%
            const darkenFactor = 0.6;
            const dr = Math.floor(r * darkenFactor);
            const dg = Math.floor(g * darkenFactor);
            const db = Math.floor(b * darkenFactor);

            resolve(`rgb(${dr}, ${dg}, ${db})`);
        };

        img.onerror = () => {
            resolve(null);
        };
    });
};
