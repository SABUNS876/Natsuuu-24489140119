const fetch = require("node-fetch");

/**
 * GENERATOR BOT WHATSAPP
 * Membuat plugin WhatsApp dalam format CJS (CommonJS)
 * @param {string} fitur - Fitur-fitur yang diinginkan (dipisahkan koma)
 * @param {object} [options] - Konfigurasi tambahan
 * @param {boolean} [options.stream=false] - Gunakan streaming response
 * @param {number} [options.timeout=150000] - Timeout dalam milidetik
 * @param {string} [options.bahasa='JavaScript'] - Bahasa pemrograman yang diinginkan
 * @param {boolean} [options.eval=false] - Coba evaluasi kode langsung
 * @returns {Promise<object>} - Kode bot dan metadata
 */
async function buatBotWhatsApp(fitur, options = {}) {
  const {
    stream = false,
    timeout = 150000,
    bahasa = 'JavaScript',
    eval = false
  } = options;

  // Validasi input
  if (!fitur || typeof fitur !== 'string') {
    throw new Error('Deskripsi fitur harus berupa teks');
  }

  // Prompt sistem untuk format CJS
  const promptSistem = `Anda adalah ahli pembuat bot WhatsApp. Buatkan plugin WhatsApp dalam format CommonJS (CJS) dengan ketentuan:

1. STRUKTUR MODUL:
   - Gunakan sintaks require() bukan import
   - Gunakan module.exports
   - Sertakan metadata (help, tags, command, dll)

2. IMPLEMENTASI:
   - Kode harus lengkap dan langsung jalan
   - Sertakan semua dependensi yang diperlukan
   - Komentar penjelasan dalam bahasa Indonesia
   - Gunakan async/await untuk operasi async

3. CONTOH STRUKTUR:
   const axios = require('axios')
   const fs = require('fs')
   
   let handler = async (m, { conn, usedPrefix, command, text }) => {
     try {
       // Validasi input
       if (!text) return m.reply(\`Contoh: \${usedPrefix + command} [param]\`)
       
       // Proses utama
       const result = await someAsyncProcess(text)
       
       // Kirim hasil
       await conn.reply(m.chat, result, m)
     } catch (e) {
       console.error(e)
       m.reply('Error memproses')
     }
   }
   
   handler.help = ['command']
   handler.tags = ['kategori']
   handler.command = ['command', 'alias']
   handler.limit = true
   module.exports = handler

4. FITUR YANG DIMINTA:
   ${fitur.split(',').map(f => `- ${f.trim()}`).join('\n   ')}

5. ATURAN KHUSUS:
   - Untuk fitur AI: Gunakan model terbaru
   - Untuk media: Handle upload dan download
   - Error handling wajib ada
   - Sertakan metadata handler yang lengkap

6. LARANGAN:
   - Jangan gunakan import/export
   - Jangan lupa module.exports
   - Jangan gunakan sintaks ESM`;

  const promptPengguna = `Buatkan plugin WhatsApp CJS dengan fitur: ${fitur}`;

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

    // Evaluasi kode jika diminta
    let evalResult = null;
    if (eval && bahasa === 'JavaScript') {
      try {
        const context = {
          m: {
            reply: (text) => text,
            from: '6281234567890@s.whatsapp.net'
          },
          conn: {
            sendMessage: async () => console.log('Message sent'),
            loading: async () => {},
            reply: async () => {}
          },
          usedPrefix: '.',
          command: 'test',
          text: 'contoh'
        };
        
        // Tambahkan require ke context
        context.require = require;
        
        evalResult = (new Function(`
          const module = { exports: {} };
          ${kodeBot}
          return module.exports;
        `))();
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
