const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Cache untuk menyimpan history gambar yan
async function getRandomPinterestImage(query, options = {}) {
    const {
        returnBuffer = true,
        response = null
    } = options;

    try {
        // 1. Buat folder cache jika belum ada
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        // 2. Cari gambar di Pinterest
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
        
        // 3. Dapatkan semua gambar
        const allImageUrls = [...linkHeader.matchAll(/<(.*?)>/g)].map(match => match[1]);
        
        // 4. Filter gambar yang belum pernah ditampilkan
        const cachedImages = imageCache.get(query) || new Set();
        const newImages = allImageUrls.filter(url => !cachedImages.has(url));
        
        // Jika semua gambar sudah pernah ditampilkan, reset cache untuk query ini
        const availableImages = newImages.length > 0 ? newImages : allImageUrls;
        if (newImages.length === 0) {
            imageCache.set(query, new Set());
        }
        
        // 5. Pilih gambar random
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        const selectedImageUrl = availableImages[randomIndex];
        
        // 6. Simpan ke cache
        cachedImages.add(selectedImageUrl);
        imageCache.set(query, cachedImages);
        
        // 7. Download gambar
        const imageResponse = await fetch(selectedImageUrl);
        const imageBuffer = await imageResponse.buffer();
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        // 8. Simpan ke cache lokal (opsional)
        const filename = `${Date.now()}-${query.replace(/[^a-z0-9]/gi, '_')}.${mimeType.split('/')[1] || 'jpg'}`;
        fs.writeFileSync(path.join(cacheDir, filename), imageBuffer);
        
        // 9. Return hasil
        if (response) {
            response.set('Content-Type', mimeType);
            return response.send(imageBuffer);
        }
        
        return returnBuffer ? imageBuffer : {
            success: true,
            image: imageBuffer,
            mimeType,
            query,
            imageUrl: selectedImageUrl,
            isNew: newImages.length > 0,
            cacheInfo: {
                totalCached: cachedImages.size,
                totalAvailable: allImageUrls.length
            }
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

module.exports = getRandomPinterestImage;
