const axios = require('axios');
const cheerio = require('cheerio');

const jadwalsholat = {
    listKota: async () => {
        const list = await axios.get('https://pastebin.com/raw/D2q7v8F2');
        return list.data;
    },

    kota: async (namaKota) => {
        const init = await jadwalsholat.listKota();
        const kotaObj = init.find(k => k.kota.toLowerCase() === namaKota.toLowerCase());

        if (!kotaObj) {
            throw new Error(`Kota "${namaKota}" tidak ditemukan.`);
        }

        const id = kotaObj.id;
        const response = await axios.get(`https://jadwalsholat.org/jadwal-sholat/monthly.php?id=${id}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(response.data);
        const periode = $('h2.h2_edit').first().text().trim();

        const headers = [];
        $('tr.table_header td').each((i, el) => {
            const text = $(el).text().replace(/\n/g, '').trim();
            if (text) headers.push(text);
        });
        
        const row = $('tr.table_highlight');
        const jadwal = {};

        row.find('td').each((i, el) => {
            const value = $(el).text().trim();
            const label = headers[i];
            if (label) jadwal[label] = value;
        });

        return {
            kota: kotaObj.kota,
            periode,
            jadwal
        };
    }
};

module.exports = jadwalsholat;
