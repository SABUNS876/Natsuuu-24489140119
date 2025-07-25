const axios = require('axios');
const cheerio = require('cheerio');

const jadwalsholat = {
    async function jadwalsholat(namaKota) {
        try {
            // Dapatkan list kota terlebih dahulu
            const listKota = await axios.get('https://pastebin.com/raw/D2q7v8F2');
            const kotaData = listKota.data.find(k => k.kota.toLowerCase() === namaKota.toLowerCase());
            
            if (!kotaData) {
                throw new Error(`Kota "${namaKota}" tidak ditemukan`);
            }

            // Ambil jadwal sholat
            const response = await axios.get(`https://jadwalsholat.org/jadwal-sholat/monthly.php?id=${kotaData.id}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const $ = cheerio.load(response.data);
            const periode = $('h2.h2_edit').first().text().trim();

            const headers = [];
            $('tr.table_header td').each((i, el) => {
                headers.push($(el).text().trim());
            });

            const jadwal = {};
            $('tr.table_highlight td').each((i, el) => {
                jadwal[headers[i]] = $(el).text().trim();
            });

            return {
                success: true,
                kota: kotaData.kota,
                id: kotaData.id,
                periode,
                jadwal
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },

    // Fungsi tambahan jika diperlukan
    async listKota() {
        const response = await axios.get('https://pastebin.com/raw/D2q7v8F2');
        return response.data;
    }
};

module.exports = jadwalsholat;
