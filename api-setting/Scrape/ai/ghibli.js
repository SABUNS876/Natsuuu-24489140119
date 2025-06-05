const axios = require("axios");

async function animegen(prompt) {
    try {
        const res = await axios.post(
            "https://ghibliart.net/api/generate-image", {
                prompt
            }, {
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
                }
            }
        );

        const img = res.data?.image || res.data?.url;

        if (!img) {
            throw new Error("Gagal mendapatkan gambar dari API");
        }

        let imageBuffer;
        let contentType = 'image/jpeg'; // Default content type

        if (img.startsWith("data:image/")) {
            // Handle base64 image
            const matches = img.match(/^data:(image\/\w+);base64,/);
            if (matches) contentType = matches[1];
            const base64Data = img.replace(/^data:image\/\w+;base64,/, "");
            imageBuffer = Buffer.from(base64Data, "base64");
        } else if (img.startsWith("iVBORw")) {
            // Handle raw base64 without prefix
            imageBuffer = Buffer.from(img, "base64");
        } else {
            // Handle image URL
            const imgResponse = await axios.get(img, {
                responseType: 'arraybuffer'
            });
            imageBuffer = Buffer.from(imgResponse.data, 'binary');
            contentType = imgResponse.headers['content-type'] || contentType;
        }

        return {
            imageBuffer,
            contentType,
            prompt,
            note: 'Gambar langsung dikirim sebagai buffer'
        };

    } catch (err) {
        console.error("Error:", err.message);
        throw new Error(`Gagal memproses gambar: ${err.message}`);
    }
}

module.exports = animegen;
