const fetch = require('node-fetch');

async function getPinterestImages(query, options = {}) {
    const {
        count = 1,          // Jumlah gambar yang diminta
        response = null,     // Objek response HTTP (jika di REST API)
        returnBuffer = true  // Return buffer atau URL
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
        
        // 2. Dapatkan semua URL gambar
        const allImageUrls = [...linkHeader.matchAll(/<(.*?)>/g)].map(match => match[1]);
        
        // 3. Ambil gambar sesuai jumlah yang diminta
        const selectedUrls = allImageUrls.slice(0, count);
        const results = [];

        for (const url of selectedUrls) {
            const imageResponse = await fetch(url);
            const imageBuffer = await imageResponse.buffer();
            const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
            
            results.push({
                buffer: imageBuffer,
                url,
                mimeType
            });
        }

        // 4. Return berdasarkan mode penggunaan
        if (response) {
            // Mode REST API (return 1 gambar buffer)
            response.set('Content-Type', results[0].mimeType);
            return response.send(results[0].buffer);
        }

        // Mode WhatsApp bot/others (return sesuai permintaan)
        if (returnBuffer) {
            return count === 1 ? results[0].buffer : results.map(img => img.buffer);
        } else {
            return {
                success: true,
                count: results.length,
                query,
                images: results.map(img => ({
                    url: img.url,
                    mimeType: img.mimeType,
                    size: img.buffer.length
                }))
            };
        }

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

module.exports = getPinterestImages;
