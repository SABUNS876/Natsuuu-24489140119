const fetch = require('node-fetch');

async function brat(text) {
    if (!text) throw new Error('❌ Text tidak boleh kosong');
    
    const url = `https://bratgenerator.net/id?text=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    
    if (!res.ok) throw new Error('❌ Gagal mengambil gambar dari Brat Generator');
    
    return await res.buffer();
}

module.exports = brat;
