const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

async function buatBotWhatsApp(fitur, options = {}) {
  const {
    stream = false,
    timeout = 150000,
    bahasa = 'html',
    eval = false,
    deployVercel = false,
    vercelToken = process.env.VERCEL_TOKEN || 'w9TkbSTaC0MoyoZLqPVVDt88',
    vercelProjectName = `bot-wa-${Date.now()}`,
    vercelTeamId = null
  } = options;

  // Validasi input
  if (!fitur || typeof fitur !== 'string') {
    throw new Error('Deskripsi fitur harus berupa teks');
  }

  const promptSistem = `Buatkan kode HTML lengkap untuk WhatsApp Bot dengan fitur: ${fitur}. Mulai langsung dengan <!DOCTYPE html>, tanpa penjelasan lain.`;
  const promptPengguna = `Buatkan kode HTML untuk WhatsApp Bot dengan fitur: ${fitur}`;

  try {
    // 1. Fetch HTML dari API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('https://text.pollinations.ai/openai', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: promptSistem },
          { role: "user", content: promptPengguna }
        ],
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gagal memproses request: ${response.statusText}`);
    }

    const result = await response.json();
    let htmlCode = result.choices[0]?.message?.content;

    // 2. Bersihkan dan validasi HTML
    if (!htmlCode.includes('<!DOCTYPE html>')) {
      const htmlMatch = htmlCode.match(/```html\n([\s\S]*?)\n```|```\n([\s\S]*?)\n```/);
      htmlCode = htmlMatch ? (htmlMatch[1] || htmlMatch[2]) : htmlCode;
    }

    // 3. Format HTML agar rapi
    const formattedHtml = htmlCode
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    // 4. Siapkan hasil utama
    const resultObj = {
      sukses: true,
      kode: formattedHtml,
      fitur: fitur.split(',').map(f => f.trim()),
      bahasa: bahasa,
      waktu: new Date().toLocaleString('id-ID'),
      deployment: null
    };

    // 5. Proses Deploy ke Vercel (jika diminta)
    if (deployVercel && vercelToken) {
      try {
        const tempDir = path.join(__dirname, 'temp-deploy');
        
        // Buat direktori temporary
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Buat file HTML
        fs.writeFileSync(path.join(tempDir, 'index.html'), formattedHtml);
        
        // Buat config Vercel
        fs.writeFileSync(
          path.join(tempDir, 'vercel.json'),
          JSON.stringify({
            version: 2,
            builds: [{ src: "index.html", use: "@vercel/static" }],
            routes: [{ src: "/.*", dest: "index.html" }]
          }, null, 2)
        );

        // Siapkan payload untuk deploy
        const deploymentPayload = {
          name: vercelProjectName,
          files: [
            {
              file: 'index.html',
              data: fs.readFileSync(path.join(tempDir, 'index.html'), 'base64'),
              encoding: 'base64'
            },
            {
              file: 'vercel.json',
              data: fs.readFileSync(path.join(tempDir, 'vercel.json'), 'base64'),
              encoding: 'base64'
            }
          ],
          projectSettings: {
            framework: null,
            buildCommand: null,
            outputDirectory: null
          },
          target: 'production'
        };

        // Tambahkan teamId jika ada
        if (vercelTeamId) {
          deploymentPayload.teamId = vercelTeamId;
        }

        // Eksekusi deploy
        const deployResponse = await fetch('https://api.vercel.com/v13/deployments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(deploymentPayload)
        });

        if (!deployResponse.ok) {
          const errorData = await deployResponse.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Gagal melakukan deploy');
        }

        const deployData = await deployResponse.json();
        const deployUrl = `https://${vercelProjectName}.vercel.app`;

        // Update hasil dengan info deploy
        resultObj.deployment = {
          sukses: true,
          url: deployUrl,
          nama: vercelProjectName,
          id: deployData.id,
          status: deployData.readyState,
          waktu: new Date().toLocaleString('id-ID')
        };

        // Bersihkan direktori temporary
        fs.rmSync(tempDir, { recursive: true, force: true });

      } catch (deployError) {
        resultObj.deployment = {
          sukses: false,
          error: deployError.message,
          waktu: new Date().toLocaleString('id-ID'),
          stack: process.env.NODE_ENV === 'development' ? deployError.stack : undefined
        };
      }
    }

    // 6. Evaluasi kode (jika diminta)
    if (eval && bahasa === 'JavaScript') {
      try {
        const context = {
          m: { reply: (text) => text, from: '6281234567890@s.whatsapp.net' },
          conn: { sendMessage: async () => console.log('Message sent') },
          usedPrefix: '.',
          command: 'test',
          text: 'contoh'
        };
        
        const evalResult = (new Function(`
          const module = { exports: {} };
          const exports = module.exports;
          ${formattedHtml.replace(/export default/g, 'module.exports =')}
          return module.exports;
        `)).call(context);
        
        resultObj.eval = typeof evalResult === 'object' ? evalResult : { result: evalResult };
      } catch (error) {
        resultObj.eval = {
          error: error.message,
          stack: error.stack
        };
      }
    }

    return resultObj;

  } catch (error) {
    return {
      sukses: false,
      error: error.name === 'AbortError' ? 'Request timeout' : error.message,
      fitur: fitur.split(',').map(f => f.trim()),
      waktu: new Date().toLocaleString('id-ID')
    };
  }
}

module.exports = buatBotWhatsApp;
