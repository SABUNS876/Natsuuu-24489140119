const fetch = require('node-fetch');

async function getPinterestImages(query, limit = 5) {
  try {
    // 1. Cari gambar di Pinterest
    const response = await fetch(
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

    if (!response.ok) throw new Error(`Error ${response.status}`);
    
    const linkHeader = response.headers.get("Link");
    if (!linkHeader) throw new Error("No images found");
    
    const imageUrls = [...linkHeader.matchAll(/<(.*?)>/g)].map(match => match[1]);
    
    // 2. Ambil gambar (maksimal sesuai limit)
    const images = [];
    for (let i = 0; i < Math.min(limit, imageUrls.length); i++) {
      const imgResponse = await fetch(imageUrls[i]);
      const buffer = await imgResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';
      
      images.push({
        url: imageUrls[i],
        data: `data:${mimeType};base64,${base64}`,
        size: buffer.byteLength,
        dimensions: await getImageDimensions(buffer)
      });
    }
    
    return {
      success: true,
      query,
      count: images.length,
      images
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper untuk mendapatkan dimensi gambar
async function getImageDimensions(buffer) {
  try {
    const { imageSize } = await import('image-size');
    const dimensions = imageSize(Buffer.from(buffer));
    return {
      width: dimensions.width,
      height: dimensions.height,
      type: dimensions.type
    };
  } catch {
    return { width: 0, height: 0, type: 'unknown' };
  }
}

module.exports = getPinterestImages;
