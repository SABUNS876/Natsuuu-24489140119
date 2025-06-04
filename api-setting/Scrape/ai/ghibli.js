const axios = require("axios");
const FormData = require("form-data");

async function animegen(prompt) {
    try {
        // 1. Generate image with Ghibli AI (using same headers as original)
        const res = await axios.post(
            "https://ghibliart.net/api/generate-image", 
            { prompt },
            {
                headers: {
                    "accept": "*/*",
                    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                    "content-type": "application/json",
                    "origin": "https://ghibliart.net",
                    "referer": "https://ghibliart.net/",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
                    "cookie": "_ga_DC0LTNHRKH=GS2.1.s1748942966$o1$g0$t1748942966$j60$l0$h0; _ga=GA1.1.1854864196.1748942966",
                    "sec-ch-ua": '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"Windows"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "priority": "u=1, i"
                },
                timeout: 30000
            }
        );

        const imgUrl = res.data?.image || res.data?.url;
        if (!imgUrl) {
            throw new Error("Gak dapet gambar dari API");
        }

        // 2. Upload to Catbox
        const form = new FormData();
        form.append('reqtype', 'urlupload');
        form.append('url', imgUrl);

        const catboxRes = await axios.post(
            'https://catbox.moe/user/api.php',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    "accept": "*/*",
                    "user-agent": "Mozilla/5.0"
                },
                timeout: 20000
            }
        );

        if (!catboxRes.data) {
            throw new Error("Gagal upload ke Catbox");
        }

        // Return the Catbox URL
        return {
            success: true,
            originalUrl: imgUrl,
            catboxUrl: catboxRes.data,
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

module.exports = animegen;
