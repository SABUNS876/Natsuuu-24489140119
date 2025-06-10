const fetch = require('node-fetch');

async function getRandomPinterestImage(query, options = {}) {
    const {
        returnBuffer = true,
        response = null
    } = options;

    try {
        // 1. Cari gambar di Pinterest
        const searchResponse = await fetch(
            `https://www.pinterest.com/resource/BaseSearchResource/get/?data=${
                encodeURIComponent(`{"options":{"query":"${query}"}}`)
            }`, {
                headers: {
                    "screen-dpr": "4",
                    "x-pinterest-pws-handler": "www/search/[scope].js"
                },
                method: "HEAD"
            }
        );

        if (!searchResponse.ok) throw new Error('Gagal mencari di Pinterest');
        
        const linkHeader = searchResponse.headers.get("Link");
        if (!linkHeader) throw new Error('Tidak ada gambar ditemukan');
        
        // 2. Dapatkan semua gambar
        const allImageUrls = [...linkHeader.matchAll(/<(.*?)>/g)].map(match => match[1]);
        
        // 3. Pilih gambar random
        const randomIndex = Math.floor(Math.random() * allImageUrls.length);
        const selectedImageUrl = allImageUrls[randomIndex];
        
        // 4. Download gambar
        const imageResponse = await fetch(selectedImageUrl);
        const imageBuffer = await imageResponse.buffer();
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        // 5. Return hasil
        if (response) {
            response.set('Content-Type', mimeType);
            return response.send(imageBuffer);
        }
        
        return returnBuffer ? imageBuffer : {
            success: true,
            image: imageBuffer,
            mimeType,
            query,
            imageUrl: selectedImageUrl
        };

    } catch (error) {
        console.error('Error:', error);
        
        if (response) {
            return response.status(500).json({ 
                error: 'Gagal mengambil gambar',
                details: error.message 
            });
        }
        
        throw error;
    }
}

module.exports = getRandomPinterestImage;
