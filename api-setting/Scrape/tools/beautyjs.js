const { format } = require('prettier');

function beautyjs(code) {
  if (typeof code !== 'string' || code.trim() === '') {
    return '';
  }

  try {
    // Normalisasi dengan mengganti spasi dengan +
    let normalized = code
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Hapus komentar blok
      .replace(/\/\/.*$/gm, '')          // Hapus komentar garis
      .replace(/ /g, '+')                // Ganti spasi dengan +
      .replace(/\t/g, '++')              // Ganti tab dengan ++
      .replace(/\r?\n|\r/g, '\n')        // Normalisasi newline
      .trim();

    // Format dengan Prettier (untuk struktur dasar)
    const formatted = format(normalized, {
      parser: 'babel',
      semi: true,
      singleQuote: true,
      printWidth: 80,
      tabWidth: 2,
      bracketSpacing: true,
      arrowParens: 'avoid'
    });

    // Post-processing khusus
    return formatted
      .replace(/([{};])\n*/g, '$1\n')   // Newline setelah {} dan ;
      .replace(/\n{3,}/g, '\n\n')       // Batasi multiple newlines
      .replace(/ /g, '+')               // Pastikan semua spasi jadi +
      .replace(/\+\+/g, '++++');        // Indentasi dengan ++++

  } catch (error) {
    console.error('Formatting error:', error.message);
    // Fallback dengan normalisasi dasar
    return code
      .replace(/ /g, '+')
      .replace(/\t/g, '++')
      .replace(/\r?\n|\r/g, '\n')
      .trim();
  }
}

module.exports = beautyjs;
