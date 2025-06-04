const axios = require("axios");
const FormData = require("form-data");

// Config
const IMGBB_API_KEY = "99bfc1394de509d87a1dd1bff024cb28"; // Dapatkan di https://api.imgbb.com/

async function animegen(prompt) {
    try {
        // 1. Generate image dengan Ghibli AI
        console.log("Membuat gambar dengan prompt:", prompt);
        const res = await axios.post(
            "https://ghibliart.net/api/generate-image", 
            { prompt },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Origin": "https://ghibliart.net",
                    "Referer": "https://ghibliart.net/",
                    "User-Agent": "Mozilla/5.0"
                },
                timeout: 30000
            }
        );

        const imgUrl = res.data?.image || res.data?.url;
        if (!imgUrl) throw new Error("Tidak mendapatkan URL gambar dari API");
        console.log("URL gambar didapatkan:", imgUrl);

        // 2. Upload ke ImgBB
        console.log("Mengupload ke ImgBB...");
        const imgbbUrl = await uploadToImgBB(imgUrl);
        
        return {
            success: true,
            originalUrl: imgUrl,
            uploadedUrl: imgbbUrl,
            prompt: prompt
        };

    } catch (err) {
        console.error("Error:", err.message);
        return {
            success: false,
            error: err.message,
            prompt: prompt
        };
    }
}

async function uploadToImgBB(imageUrl) {
    try {
        // Validasi URL
        new URL(imageUrl);

        const form = new FormData();
        form.append('image', imageUrl);

        const response = await axios.post(
            `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    "Accept": "application/json"
                },
                timeout: 20000
            }
        );

        if (!response.data?.data?.url) {
            throw new Error("Gagal upload ke ImgBB: URL tidak ditemukan");
        }

        return response.data.data.url;
    } catch (error) {
        console.error("Error upload ImgBB:", error.message);
        throw new Error(`Gagal upload gambar: ${error.message}`);
    }
}

module.exports = animegen;
