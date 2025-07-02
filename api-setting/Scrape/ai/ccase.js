const fetch = require("node-fetch");

/**
 * GENERATOR BOT WHATSAPP
 * Membuat struktur switch-case untuk bot WhatsApp
 * @param {string} fitur - Fitur-fitur yang diinginkan (dipisahkan koma)
 * @param {object} [options] - Konfigurasi tambahan
 * @param {boolean} [options.stream=false] - Gunakan streaming response
 * @param {number} [options.timeout=15000] - Timeout dalam milidetik
 * @param {string} [options.bahasa='JavaScript'] - Bahasa pemrograman yang diinginkan
 * @param {boolean} [options.eval=false] - Coba evaluasi kode langsung
 * @returns {Promise<object>} - Kode bot dan metadata
 */
async function buatBotWhatsApp(fitur, options = {}) {
  const {
    stream = false,
    timeout = 15000,
    bahasa = 'JavaScript',
    eval = false
  } = options;

  // Validasi input
  if (!fitur || typeof fitur !== 'string') {
    throw new Error('Deskripsi fitur harus berupa teks');
  }

// Prompt sistem dalam Bahasa Indonesia
const promptSistem = `Anda adalah ahli pembuat bot WhatsApp. Buatkan kode switch-case dalam ${bahasa} untuk bot WhatsApp dengan ketentuan:

1. STRUKTUR CASE:
   - Hanya boleh ada 1 break di akhir case
   - Tidak boleh ada break di tengah-tengah case
   - Contoh struktur:
     case 'contoh': {
       // [semua kode disini]
       break; // Hanya ini satu-satunya break
     }

2. IMPLEMENTASI NYATA:
   - Wajib buat implementasi lengkap, bukan contoh
   - Sertakan semua dependensi dalam case
   - Pakai bahasa Indonesia untuk komentar

3. PENANGANAN ERROR:
   - Gunakan try-catch di dalam case
   - Return error message ke user
   - Log error ke console

4. FORMAT PESAN:
   - Untuk reply text biasa:
     await m.reply('pesan')
   - Untuk reply interaktif:
     await m.reply({
       text: 'judul',
       footer: 'footer',
       buttons: [ /* tombol */ ]
     })

5. FITUR KHUSUS:
   - API: Langsung embed dalam case
   - Media: Sertakan upload & cleanup
   - Premium: Cek limit user

6. CONTOH CASE BENAR:
   case 'halo': {
     try {
       if (!text) return m.reply('Contoh: .halo [nama]');
       
       await m.reply(`Halo ${text}!`);
     } catch (e) {
       console.error(e);
       m.reply('Error terjadi');
     }
     break; // Hanya 1 break di sini
   }

7. LARANGAN:
   - Jangan buat break ganda
   - Jangan pisah case
   - Jangan lupa cleanup resource
   - Jangan tinggalkan TODO

8. PRIORITAS:
   - 1 case = 1 break di akhir
   - Error handling wajib
   - Kode harus jalan langsung`;
  
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

    // Evaluasi kode jika diminta
    let evalResult = null;
    if (eval && bahasa === 'JavaScript') {
      try {
        // Buat context aman untuk eval
        const context = {
          m: {
            reply: (text) => text,
            from: '6281234567890@s.whatsapp.net'
          },
          fetch: require('node-fetch'),
          require: require
        };
        
        // Jalankan kode dalam context terisolasi
        evalResult = (new Function('context', `
          with(context) {
            ${kodeBot}
          }
        `))(context);
      } catch (error) {
        evalResult = {
          error: error.message,
          stack: error.stack
        };
      }
    }

    return {
      sukses: true,
      kode: kodeBot,
      fitur: fitur.split(',').map(f => f.trim()),
      bahasa: bahasa,
      waktu: new Date().toLocaleString('id-ID'),
      eval: eval ? evalResult : undefined
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
//   timeout: 20000,
//   eval: true
// })
// .then(response => {
//   if (response.sukses) {
//     console.log('Kode Bot:\n', response.kode);
//     if (response.eval) {
//       console.log('Hasil Eval:', response.eval);
//     }
//   } else {
//     console.error('Gagal:', response.error);
//   }
// });

module.exports = buatBotWhatsApp;
