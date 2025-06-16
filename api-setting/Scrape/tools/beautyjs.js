const { format } = require('prettier');

function beautyjs(code) {
  if (typeof code !== 'string' || code.trim() === '') {
    return '';
  }

  // Daftar kata kunci bukan JS dan padanan JS-nya
  const keywordReplacements = {
    'cetak': 'console.log',
    'ulangi': 'while',
    'selama': 'while',
    'jika': 'if',
    'lain': 'else',
    'fungsi': 'function',
    'kelas': 'class',
    'konstan': 'const',
    'variabel': 'let',
    'kembalikan': 'return',
    'benar': 'true',
    'salah': 'false',
    'kosong': 'null',
    'tidakterdefinisi': 'undefined',
    'coba': 'try',
    'tangkap': 'catch',
    'akhirnya': 'finally',
    'untuk': 'for',
    'dalam': 'in',
    'dari': 'from',
    'impor': 'import',
    'ekspor': 'export'
  };

  try {
    // 1. Ganti kata kunci bukan JS dengan padanan JS
    let jsCode = code;
    for (const [nonJS, js] of Object.entries(keywordReplacements)) {
      const regex = new RegExp(`\\b${nonJS}\\b`, 'gi');
      jsCode = jsCode.replace(regex, js);
    }

    // 2. Format kode dengan Prettier
    const formatted = format(jsCode, {
      parser: 'babel',
      semi: true,
      singleQuote: true,
      trailingComma: 'none',
      printWidth: 80,
      tabWidth: 2,
      bracketSpacing: true,
      arrowParens: 'avoid'
    });

    // 3. Post-processing untuk penyempurnaan
    return formatted
      .replace(/([{}])\n?/g, '$1\n')      // Newline setelah kurung kurawal
      .replace(/([;])\n/g, '$1\n\n')      // Baris kosong setelah titik koma
      .replace(/\n{3,}/g, '\n\n')         // Hapus newline berlebihan
      .replace(/\b(function|if|else|for|while|return)\b/g, '$1 '); // Spasi setelah keyword

  } catch (error) {
    console.error('Formatting error:', error.message);
    return code; // Kembalikan kode asli jika error
  }
}

module.exports = beautyjs;
