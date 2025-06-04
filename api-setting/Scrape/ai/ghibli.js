const axios = require("axios");
const FormData = require("form-data");

async function animegen(prompt) {
    try {
        // 1. Generate image
        const res = await axios.post("https://ghibliart.net/api/generate-image", {
            prompt
        }, {
            headers: {
                "Content-Type": "application/json",
                "Origin": "https://ghibliart.net",
                "Referer": "https://ghibliart.net/",
                "User-Agent": "Mozilla/5.0"
            },
            timeout: 30000
        });

        const imgUrl = res.data?.image || res.data?.url;
        if (!imgUrl) throw new Error("Gagal mendapatkan URL gambar");

        // 2. Upload dengan metode yang lebih reliable
        let catboxUrl;
        try {
            // Coba metode POST FormData dulu
            catboxUrl = await uploadViaPost(imgUrl);
        } catch (postError) {
            console.log("Metode POST gagal, mencoba alternatif...");
            // Coba metode fetch langsung
            catboxUrl = await uploadViaFetch(imgUrl);
        }

        return {
            success: true,
            originalUrl: imgUrl,
            catboxUrl: catboxUrl,
            prompt: prompt
        };

    } catch (err) {
        console.error("Error:", err.message);
        return {
            success: false,
            error: err.message.includes("414") ? 
                "URL gambar terlalu panjang untuk Catbox" : 
                err.message,
            prompt: prompt
        };
    }
}

// Metode 1: POST FormData (paling direkomendasikan)
async function uploadViaPost(imgUrl) {
    const form = new FormData();
    form.append('reqtype', 'urlupload');
    form.append('url', imgUrl);

    const response = await axios.post(
        'https://catbox.moe/user/api.php',
        form,
        {
            headers: form.getHeaders(),
            timeout: 15000
        }
    );
    return response.data.trim();
}

// Metode 2: Fetch langsung (fallback)
async function uploadViaFetch(imgUrl) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`https://catbox.moe/user/api.php?reqtype=urlupload&url=${encodeURIComponent(imgUrl)}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    });

    clearTimeout(timeout);
    return await response.text();
}

module.exports = animegen;
