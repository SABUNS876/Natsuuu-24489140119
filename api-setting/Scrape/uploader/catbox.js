const axios = require('axios');
const FormData = require('form-data');

async function uploadUrlToCatbox(url) {
  // Validasi input
  if (!url) {
    throw new Error('Parameter url wajib diisi');
  }

  // Validasi format URL
  try {
    new URL(url);
  } catch (e) {
    throw new Error('Format URL tidak valid');
  }

  // Membuat form data
  const form = new FormData();
  form.append('reqtype', 'urlupload');
  form.append('url', url);

  try {
    // Mengirim request ke Catbox
    const response = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
      timeout: 10000 // Timeout 10 detik
    });
    
    // Mengembalikan URL hasil upload
    return response.data;
  } catch (error) {
    // Error handling
    if (error.response) {
      throw new Error(`Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('Tidak mendapat response dari server');
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
}

module.exports = uploadUrlToCatbox;
