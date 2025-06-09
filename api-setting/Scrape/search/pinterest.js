const fetch = require('node-fetch');

async function getPinterestImageBuffer(query, options = {}) {
    // Default options
    const {
        returnBuffer = true,  // Set false untuk mendapatkan objek response
        response = null       // Objek response HTTP (jika digunakan di route handler)
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

        if (!searchResponse.ok) throw new Error('Failed to search Pinterest');
        
        const linkHeader = searchResponse.headers.get("Link");
        if (!linkHeader) throw new Error('No images found for this query');
        
        // 2. Ambil gambar pertama
        const imageUrl = [...linkHeader.matchAll(/<(.*?)>/g)][0][1];
        const imageResponse = await fetch(imageUrl);
        
        if (!imageResponse.ok) throw new Error('Failed to download image');
        
        const imageBuffer = await imageResponse.buffer();
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

        // 3. Handle response berdasarkan mode
        if (response) {
            // Mode HTTP handler
            response.set('Content-Type', mimeType);
            return response.send(imageBuffer);
        }
        
        // Mode langsung
        return returnBuffer ? imageBuffer : {
            success: true,
            image: imageBuffer,
            mimeType,
            query,
            imageUrl
        };

    } catch (error) {
        console.error('Pinterest scraper error:', error);
        
        if (response) {
            return response.status(500).json({ 
                error: 'Failed to fetch Pinterest image',
                details: error.message 
            });
        }
        
        throw error;
    }
}

module.exports = getPinterestImageBuffer;
