const fetch = require('node-fetch');

async function getSinglePinterestImage(query) {
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

    if (!searchResponse.ok) throw new Error('Gagal mencari gambar');
    
    const linkHeader = searchResponse.headers.get("Link");
    if (!linkHeader) throw new Error('Tidak ada hasil ditemukan');
    
    // Ambil URL gambar pertama
    const imageUrl = [...linkHeader.matchAll(/<(.*?)>/g)][0][1];
    
    // 2. Download gambar
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // 3. Return gambar tunggal dalam base64
    return {
      success: true,
      query,
      image: `data:${mimeType};base64,${base64Image}`,
      imageType: mimeType,
      imageSize: buffer.byteLength
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = getSinglePinterestImage;
