const fetch = require('node-fetch');

const baseApi = 'https://ditss.vercel.app';
const apiKey = 'DitssGanteng';

async function brat(text) {
    if (!text) throw '❌ Text tidak boleh kosong.';
    const url = `${baseApi}/imagecreator/brat?apikey=${apiKey}&text=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw '❌ Gagal mengambil gambar dari Brat API.';
    return await res.buffer();
}
module.exports = brat;
