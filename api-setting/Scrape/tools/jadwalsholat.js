const axios = require('axios');
const cheerio = require('cheerio');

const jadwalsholat = {
    listKota: async () => {
        try {
            const response = await axios.get('https://pastebin.com/raw/D2q7v8F2');
            return response.data;
        } catch (error) {
            throw new Error('Gagal mengambil data kota: ' + error.message);
        }
    },

    getKota: async (namaKota) => {
        try {
            const daftarKota = await jadwalsholat.listKota();
            const kota = daftarKota.find(k => k.kota.toLowerCase() === namaKota.toLowerCase());
            
            if (!kota) {
                throw new Error(`Kota "${namaKota}" tidak ditemukan`);
            }
            
            return kota;
        } catch (error) {
            throw new Error('Gagal mencari kota: ' + error.message);
        }
    },

    jadwalKota: async (namaKota) => {
        try {
            const kota = await jadwalsholat.getKota(namaKota);
            const response = await axios.get(`https://jadwalsholat.org/jadwal-sholat/monthly.php?id=${kota.id}`, {
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
                kota: kota.kota,
                id: kota.id,
                periode,
                jadwal
            };
        } catch (error) {
            throw new Error('Gagal mengambil jadwal: ' + error.message);
        }
    }
};

module.exports = jadwalsholat;
