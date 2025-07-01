const fetch = require("node-fetch");

/**
 * GENERATOR BOT WHATSAPP
 * Membuat struktur switch-case untuk bot WhatsApp
 * @param {string} fitur - Fitur-fitur yang diinginkan (dipisahkan koma)
 * @param {object} [options] - Konfigurasi tambahan
 * @param {boolean} [options.stream=false] - Gunakan streaming response
 * @param {number} [options.timeout=15000] - Timeout dalam milidetik
 * @param {string} [options.bahasa='JavaScript'] - Bahasa pemrograman yang diinginkan
 * @returns {Promise<object>} - Kode bot dan metadata
 */
async function buatBotWhatsApp(fitur, options = {}) {
  const {
    stream = false,
    timeout = 15000,
    bahasa = 'JavaScript'
  } = options;

  // Validasi input
  if (!fitur || typeof fitur !== 'string') {
    throw new Error('Deskripsi fitur harus berupa teks');
  }

  // Prompt sistem dalam Bahasa Indonesia
  const promptSistem = `Anda adalah ahli pembuat bot WhatsApp. Buatkan kode switch-case dalam ${bahasa} untuk bot WhatsApp dengan ketentuan:
  1. Gunakan sintaks switch-case yang benar
  2. Sertakan semua fitur yang diminta
  3. Beri komentar penjelasan
  4. Tambahkan penanganan error
  5. Format kode dengan indentasi rapi
  6. Sertakan default case
  7. Hanya kembalikan kode tanpa penjelasan tambahan
  8. Buat implementasi nyata jangan contoh doang, buat sesuai yang aku katakan ingat harus nyata jangan contoh
  9. fitur Nya hanya cjs ini salah satu contoh nya case 'halo': {\nm.reply('halo ada yang bisa saya bantu?')\n break; \n } dan kalau memakai api api nya di fetch`;

  const promptPengguna = `Buatkan kode bot WhatsApp dengan fitur: ${fitur}`;

  const url = 'https://text.pollinations.ai/openai';
  const data = {
    messages: [
      {
        role: "system",
        content: promptSistem
      },
      {
        role: "user",
        content: promptPengguna
      }
    ],
    stream: stream
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': stream ? 'text/event-stream' : 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; NX769J Build/UKQ1.230917.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.107 Mobile Safari/537.36'
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gagal memproses request dengan status ${response.status}`);
    }

    const result = await response.json();
    const kodeBot = result.choices[0].message.content;

    return {
      sukses: true,
      kode: kodeBot,
      fitur: fitur.split(',').map(f => f.trim()),
      bahasa: bahasa,
      waktu: new Date().toLocaleString('id-ID')
    };

  } catch (error) {
    return {
      sukses: false,
      error: error.name === 'AbortError' ? 'Request timeout' : error.message,
      fitur: fitur.split(',').map(f => f.trim())
    };
  }
}

// Contoh penggunaan:
// buatBotWhatsApp('download YouTube, cek cuaca, chat AI', {
//   bahasa: 'JavaScript',
//   timeout: 20000
// })
// .then(response => {
//   if (response.sukses) {
//     console.log('Kode Bot:\n', response.kode);
//   } else {
//     console.error('Gagal:', response.error);
//   }
// });

module.exports = buatBotWhatsApp;
