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

            // Darken the color significantly for better background contrast
            // Reduce brightness to 30% (was 60%) to be very subtle
            const darkenFactor = 0.3;
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
