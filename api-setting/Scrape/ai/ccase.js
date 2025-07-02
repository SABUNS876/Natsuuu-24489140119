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

1. STRUKTUR UTAMA:
   - Gunakan pattern: case 'fitur': { [kode] break; }
   - Hanya 1 break di akhir case
   - Tidak boleh ada early break

2. IMPLEMENTASI:
   - Kode harus lengkap dan langsung jalan
   - Sertakan semua dependensi dalam case
   - Komentar bahasa Indonesia

3. FITUR WAJIB:
   ${fitur.split(',').map(f => `- ${f.trim()}`).join('\n   ')}

4. CONTOH STRUCTURE:
   case 'contoh': {
     try {
       // Validasi
       if (!text) return m.reply('Cara pakai: .contoh [param]');
       
       // Proses utama
       const res = await fetch('https://api.example.com');
       const data = await res.json();
       
       // Kirim hasil
       await m.reply(JSON.stringify(data));
     } catch (e) {
       console.error(e);
       m.reply('Error memproses');
     }
     break; // SATU-SATUNYA BREAK
   }

5. ATURAN KHUSUS:
   - API: Langsung embed dalam case
   - Media: Upload & cleanup
   - Premium: Cek limit user
   - Queue: Antrian proses
   - Error handling wajib

6. LARANGAN:
   - Jangan buat break ganda
   - Jangan pisah case
   - Jangan lupa cleanup`;

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
    let kodeBot = result.choices[0].message.content;

    // Validasi kode
    if (!kodeBot.includes('break;') || (kodeBot.match(/break;/g) || []).length > 1) {
      kodeBot = kodeBot.replace(/break;.*break;/gs, 'break;');
    }

    // Evaluasi kode jika diminta
    let evalResult = null;
    if (eval && bahasa === 'JavaScript') {
      try {
        const context = {
          m: {
            reply: (text) => text,
            from: '6281234567890@s.whatsapp.net',
            react: async (emoji) => console.log('React:', emoji)
          },
          sock: {
            sendMessage: async () => console.log('Message sent'),
            waUploadToServer: async () => 'mock-url'
          },
          fetch: require('node-fetch'),
          require: require,
          fs: require('fs'),
          path: require('path'),
          FormData: require('form-data'),
          axios: require('axios')
        };
        
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

module.exports = buatBotWhatsApp;
