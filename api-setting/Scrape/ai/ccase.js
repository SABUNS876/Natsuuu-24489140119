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
1. Gunakan sintaks switch-case yang benar
2. Sertakan semua fitur yang diminta
3. Beri komentar penjelasan
4. Tambahkan penanganan error
5. Format kode dengan indentasi rapi
6. Sertakan default case
7. Hanya kembalikan kode tanpa penjelasan tambahan
8. Buat implementasi nyata jangan contoh doang, buat sesuai yang aku katakan ingat harus nyata jangan contoh
9. fitur Nya hanya cjs ini salah satu contoh nya case 'halo': {\nm.reply('halo ada yang bisa saya bantu?')\n break; \n } dan kalau memakai api api nya di fetch dan buat versi lengkap, pakai bahasa indonesia penjelasan nya, jangan sampai error, buat sesuai request fitur nya trs jangan terlalu pendek kalau pake api buat fitur nya pertama tama di fetch dulu abis itu di sesuaiin ama apinya ingat harus lengkap dan harus sesuai request dan jangan terlalu pendek dan jangan ada error
10. Pastikan kode bisa dievaluasi langsung dengan eval() dan berfungsi dengan baik, sertakan semua dependensi yang diperlukan dalam kode
11. Case nya terakirim sebagai 1 argumen jangan ada tambahan case lagi soalnya ada yang ngga ngerti
12. Case nya jangan di pisah atau jangan ada 2 case tetapi hanya ada 1 case
13. Di dalam case ada cara penggunaan nya kalau cara penggunaan nya salah langsung di koreksi ama bot nya kalau mau pakai api tinggal taro web api nya dan kalau engga mau pakai api engga usah di taro web apapun yang penting prompt
14. Await nya memakai sock kaya gini await.sock
15. Pas mau pake api, Api nya langsung di campur ama case, soalnya tadi ku coba api nya di pisah ama case dan api nya harus nyatu ama case
16. Semua fitur case yang ngga ada di dalem case sekarang fitur nya harus ada di dalem case semuanya jangan sampai di suruh mandiri soalnya engga ngerti sayanya trs harus sesuai request
17. Semua kode yang termasuk fitur dari case langsung di gabungin ke case jangan di pisah
18. Break; nya hanya ada 1 karena break; untuk akhiran case kalau break; nya ada 2 trs case nya cuma 1 berarti ngga bakal kebaca jadi break; nya hanya ada 1 buat akhiran case
19. Untuk case yang melibatkan API seperti contoh createweb, pastikan:
   - Ada validasi input di awal case
   - Ada indikator proses (seperti reply "⏳ Sedang diproses...")
   - Ada error handling yang jelas
   - Format API call harus lengkap dengan URL dan headers jika diperlukan
   - Response API harus di-parse dengan benar
   - Selalu beri feedback ke pengguna tentang status proses
   - Jika melibatkan file handling, sertakan cleanup
   - Untuk deployment, sertakan semua langkah dari pembuatan hingga konfirmasi
20. Untuk case yang menghasilkan file:
   - Buat file temporary dengan nama unik
   - Kirim file sebagai dokumen WhatsApp
   - Beri caption yang informatif
   - Bersihkan file temporary setelah dikirim
21. Untuk GitHub deployment:
   - Sertakan semua langkah API (buat repo, upload file, enable pages)
   - Gunakan credential yang aman
   - Beri URL hasil deployment
   - Tangani error deployment dengan baik
22. Struktur case harus mengikuti pola:
   - Validasi input
   - Proses utama (API calls/file operations)
   - Pengiriman hasil
   - Cleanup
   - Hanya satu break di akhir
23. Untuk case yang TIDAK menggunakan API (seperti contoh test), pastikan:
   - Gunakan format reply yang lengkap dengan:
     * Text utama
     * Footer (opsional)
     * Tombol/buttons (opsional)
     * Options seperti viewOnce, mentions, dll
   - Untuk tombol:
     * Gunakan buttonId yang valid
     * ButtonText harus memiliki displayText
     * Bisa menggunakan emoji
   - Jika ada interaksi tombol, sertakan handler-nya
   - Tetap sertakan error handling meskipun sederhana
24. Contoh struktur case tanpa API:
   case 'test': {
       try {
           await m.reply({
               text: 'Ini adalah teks di bagian judul.',
               footer: 'Ini adalah teks di bagian footer.',
               buttons: [
                   { buttonId: '.me', buttonText: { displayText: "🙂" } },
                   { buttonId: '.me', buttonText: { displayText: "😐" } },
                   { buttonId: '.me', buttonText: { displayText: "☹️" } }
               ],
               viewOnce: true
           });
       } catch (e) {
           console.error(e);
           m.reply('Gagal mengirim pesan test');
       }
       break;
   }
25. Untuk case interaktif kompleks (seperti contoh play/dplay):
   - Gunakan indikator typing (react message)
   - Buat struktur pencarian yang jelas
   - Sertakan thumbnail/media
   - Buat section yang terorganisir
   - Sediakan multiple pilihan download
   - Format pesan interaktif dengan:
     * Header dengan gambar
     * Body dengan caption informatif
     * Footer penjelasan
     * Tombol pilihan
   - Gunakan protobuf untuk message interaktif
   - Sertakan error handling khusus
26. Untuk case pencarian media (audio/video):
   - Berikan minimal 5 hasil pencarian
   - Sertakan metadata lengkap (judul, durasi, artis)
   - Buat opsi download berbeda kualitas
   - Gunakan template list message yang interaktif
   - Sertakan thumbnail kualitas tinggi
27. Untuk case dengan react message:
   - Gunakan sock.sendMessage dengan react
   - Pilih emoji yang sesuai konteks
   - React sebelum memulai proses berat
28. Untuk case dengan protobuf:
   - Gunakan generateWAMessageFromContent
   - Buat struktur message yang lengkap
   - Sertakan quoted message jika perlu
29. Untuk case dengan relayMessage:
   - Gunakan sock.relayMessage untuk mengirim
   - Sertakan messageId yang unik
30. Untuk case pengolahan gambar (seperti hd):
   - Validasi tipe media (hanya image)
   - Implementasikan sistem limit/premium
   - Gunakan queue system untuk antrian proses
   - Sediakan multiple enhancement methods
   - Buat tombol interaktif untuk pilihan scale
   - Upload hasil ke image hosting
   - Sertakan react indicator (🕒, ✅, ❌)
   - Bersihkan temporary files
31. Struktur case pengolahan gambar:
   case 'hd': {
       // 1. Validasi
       if (!isPremium && limit < 1) return reply('Limit habis');
       if (user in queue) return reply('Masih diproses');
       
       // 2. Setup
       queue[user] = true;
       try {
           // 3. Get media
           let media = await getMedia();
           if (!media) return reply('Kirim gambar');
           
           // 4. Processing
           await m.react('🕒');
           let result = await processImage(media);
           
           // 5. Send result
           await sendEnhancedImage(result);
           await m.react('✅');
           
       } catch (error) {
           console.error(error);
           reply('Gagal memproses');
           await m.react('❌');
       } finally {
           // 6. Cleanup
           delete queue[user];
           if (!isPremium) limit -= 1;
           cleanTempFiles();
       }
       break;
   }
32. Untuk image enhancement:
   - Gunakan multiple methods (upscale + remini)
   - Sediakan opsi scale (2x, 4x, 6x)
   - Buat interactive buttons dengan:
     * Tombol utama pilihan scale
     * Template buttons untuk menu
     * Native flow info
   - Sertakan externalAdReply dengan:
     * Thumbnail hasil
     * Nama bot
     * Media type 1
33. Untuk premium system:
   - Cek status premium
   - Kelola limit penggunaan
   - Sediakan opsi upgrade
34. Untuk queue system:
   - Track user yang sedang proses
   - Beri pesan "masih diproses"
   - Bersihkan queue setelah selesai
35. Untuk temporary files:
   - Buat di folder temp
   - Nama file unik
   - Auto cleanup
36. Tetap pertahankan:
   - 1 break di akhir case
   - Struktur try-catch-finally
   - Komentar penjelasan
   - Error handling
   - Feedback ke user`;

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
