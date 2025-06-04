const axios = require("axios");
const FormData = require("form-data");
const { URL } = require("url");

// Config
const IMGBB_API_KEY = "YOUR_IMGBB_API_KEY"; // Dapatkan di https://api.imgbb.com/

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

        let imgUrl = res.data?.image || res.data?.url;
        if (!imgUrl) throw new Error("Tidak mendapatkan URL gambar dari API");
        
        // 2. Perbaiki URL jika diperlukan
        imgUrl = fixImageUrl(imgUrl);
        console.log("URL gambar setelah diperbaiki:", imgUrl);

        // 3. Verifikasi URL sebelum upload
        await verifyImageUrl(imgUrl);

        // 4. Upload ke ImgBB
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
            error: err.message.includes("Invalid URL") ? 
                   "URL gambar tidak valid atau tidak dapat diakses" : 
                   err.message,
            prompt: prompt
        };
    }
}

// Fungsi untuk memperbaiki URL gambar
function fixImageUrl(url) {
    try {
        // Hilangkan karakter tidak perlu
        url = url.trim();
        
        // Perbaiki URL tanpa protocol
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        
        // Validasi URL
        new URL(url);
        
        return url;
    } catch (e) {
        throw new Error(`URL gambar tidak valid: ${url}`);
    }
}

// Fungsi untuk verifikasi URL gambar
async function verifyImageUrl(url) {
    try {
        const response = await axios.head(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error("URL tidak mengarah ke gambar yang valid");
        }
    } catch (err) {
        throw new Error(`URL gambar tidak dapat diakses: ${err.message}`);
    }
}

// Fungsi upload ke ImgBB yang lebih robust
async function uploadToImgBB(imageUrl) {
    try {
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
            throw new Error("Respon tidak valid dari ImgBB");
        }

        return response.data.data.url;
    } catch (error) {
        console.error("Error upload ImgBB:", error.response?.data || error.message);
        
        // Handle error spesifik dari ImgBB
        if (error.response?.data?.error?.message) {
            throw new Error(`ImgBB: ${error.response.data.error.message}`);
        }
        
        throw new Error(`Gagal upload gambar: ${error.message}`);
    }
}

module.exports = animegen;
