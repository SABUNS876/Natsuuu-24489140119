const axios = require('axios');
const cheerio = require('cheerio');

const jadwalsholat = {
    async listKota() {
        const { data } = await axios.get('https://pastebin.com/raw/D2q7v8F2');
        return data;
    },

    async getJadwal(namaKota) {
        const kotaList = await this.listKota();
        const kota = kotaList.find(k => k.kota.toLowerCase() === namaKota.toLowerCase());
        
        if (!kota) throw new Error(`Kota "${namaKota}" tidak ditemukan!`);

        const { data } = await axios.get(`https://jadwalsholat.org/jadwal-sholat/monthly.php?id=${kota.id}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(data);
        const periode = $('h2.h2_edit').text().trim();
        
        const headers = [];
        $('tr.table_header td').each((i, el) => {
            headers.push($(el).text().trim());
        });

        const jadwal = {};
        $('tr.table_highlight td').each((i, el) => {
            jadwal[headers[i]] = $(el).text().trim();
        });

        return {
            kota: kota.kota,
            id: kota.id,
            periode,
            jadwal
        };
    }
};

module.exports = jadwalsholat; // Ekspor langsung object-nya
