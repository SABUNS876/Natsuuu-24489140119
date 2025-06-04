const axios = require("axios");
const fs = require("fs");
const path = require("path");

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
            console.error("Gak dapet gambar dari API");
            return;
        }

        if (img.startsWith("data:image/") || img.startsWith("iVBORw")) {
            const B64 = img.replace(/^data:image\/\w+;base64,/, "");
            const buffr = Buffer.from(B64, "base64");

            const tmp = path.join(__dirname, "tmp");
            if (!fs.existsSync(tmp)) {
                fs.mkdirSync(tmp);
            }

            const namafile = `${prompt.replace(/\s+/g, "_")}-${Date.now()}.jpg`;
            const pathfile = path.join(tmp, namafile);

            fs.writeFile(pathfile, buffr, (err) => {
                if (err) {
                    console.error("Gagal simpen gambar:", err.message);
                } else {
                    console.log(`Gambar tersimpan di: ${pathfile}`);
                }
            });
        } else {
            const imgurl = img;
            const imgres = await axios.get(imgurl, {
                responseType: "stream"
            });

            const tmp = path.join(__dirname, "tmp");
            if (!fs.existsSync(tmp)) {
                fs.mkdirSync(tmp);
            }

            const namafile = `${prompt.replace(/\s+/g, "_")}-${Date.now()}.jpg`;
            const pathfile = path.join(tmp, namafile);
            const writtr = fs.createWriteStream(pathfile);

            imgres.data.pipe(writtr);

            writtr.on("finish", () => {
                console.log(`Gambar tersimpen di: ${pathfile}`);
            });

            writtr.on("error", (err) => {
                console.error("Gagal simpen gambar:", err.message);
            });
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}

module.exports = animegen;
