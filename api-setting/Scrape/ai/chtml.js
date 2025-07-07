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
    vercelProjectName = `bot-whatsapp-${Date.now()}`
  } = options;

  // Validasi input
  if (!fitur || typeof fitur !== 'string') {
    throw new Error('Deskripsi fitur harus berupa teks');
  }

  const promptSistem = `buatkan kode HTML lengkap tanpa penjelasan lain, hanya kirimkan kode HTML saja tanpa kata-kata lain atau nama file. Pastikan untuk langsung mengawali dengan <!DOCTYPE html>`;
  const promptPengguna = ` ${fitur}`;

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
    let htmlCode = result.choices[0].message.content;

    // Clean and validate HTML
    if (!htmlCode.includes('<!DOCTYPE html')) {
      const htmlMatch = htmlCode.match(/```html\n([\s\S]*?)\n```|```\n([\s\S]*?)\n```/);
      htmlCode = htmlMatch ? (htmlMatch[1] || htmlMatch[2]) : htmlCode;
    }

    // Format HTML untuk keterbacaan yang lebih baik
    const formattedHtml = htmlCode
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    // Prepare result object
    const resultObj = {
      sukses: true,
      kode: formattedHtml,
      fitur: fitur.split(',').map(f => f.trim()),
      bahasa: bahasa,
      waktu: new Date().toLocaleString('id-ID'),
      deployment: null
    };

    // Deploy to Vercel if requested - PERBAIKAN DEPLOY
    if (deployVercel) {
      try {
        const tempDir = path.join(__dirname, 'temp-vercel-deploy');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Create files
        fs.writeFileSync(path.join(tempDir, 'index.html'), formattedHtml);
        fs.writeFileSync(
          path.join(tempDir, 'vercel.json'),
          JSON.stringify({
            version: 2,
            builds: [{ src: "index.html", use: "@vercel/static" }],
            routes: [{ handle: "filesystem" }, { src: ".*", dest: "index.html" }]
          }, null, 2)
        );

        // Prepare files for deployment
        const files = fs.readdirSync(tempDir).map(file => ({
          file: file,
          data: fs.readFileSync(path.join(tempDir, file), 'base64'),
          encoding: 'base64'
        }));

        const deploymentResponse = await fetch('https://api.vercel.com/v13/deployments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: vercelProjectName,
            files: files,
            projectSettings: {
              framework: null,
              buildCommand: null,
              outputDirectory: null
            }
          })
        });

        if (!deploymentResponse.ok) {
          throw new Error(`Deployment gagal: ${await deploymentResponse.text()}`);
        }

        const deploymentData = await deploymentResponse.json();
        const deploymentUrl = `https://${vercelProjectName}.vercel.app`;

        // Clean up
        fs.rmSync(tempDir, { recursive: true, force: true });

        resultObj.deployment = {
          sukses: true,
          url: deploymentUrl,
          nama: vercelProjectName,
          waktu: new Date().toLocaleString('id-ID'),
          details: deploymentData
        };

      } catch (deployError) {
        resultObj.deployment = {
          sukses: false,
          error: deployError.message,
          stack: deployError.stack,
          waktu: new Date().toLocaleString('id-ID')
        };
      }
    }

    // Evaluasi kode jika diminta
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
        `))();
        resultObj.eval = evalResult;
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
      fitur: fitur.split(',').map(f => f.trim())
    };
  }
}

module.exports = buatBotWhatsApp;
