const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadMediaFireFile(url, outputDir = './downloads') {
  try {
    // 1. Validasi URL MediaFire
    if (!url.includes('mediafire.com')) {
      throw new Error('URL MediaFire tidak valid');
    }

    // 2. Dapatkan informasi file dan direct link
    const fileInfo = await getFileInfo(url);
    
    // 3. Buat folder download jika belum ada
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, fileInfo.filename);

    // 4. Download file
    await downloadFile(fileInfo.directLink, filePath);

    return {
      success: true,
      filename: fileInfo.filename,
      filesize: formatFileSize(fileInfo.size),
      type: fileInfo.type,
      downloadLink: fileInfo.directLink,
      savedPath: filePath,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function getFileInfo(mediafireUrl) {
  try {
    const response = await axios.get(mediafireUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;

    // Ekstrak informasi file
    const filenameMatch = html.match(/<div class="filename">(.*?)<\/div>/i);
    const filesizeMatch = html.match(/<div class="filesize">(.*?)<\/div>/i);
    const directLinkMatch = html.match(/href="(https?:\/\/download[^"]+)/i);

    if (!directLinkMatch) {
      throw new Error('Tidak dapat menemukan link download');
    }

    const filename = filenameMatch ? filenameMatch[1].trim() : path.basename(new URL(mediafireUrl).pathname);
    const filesize = filesizeMatch ? filesizeMatch[1].trim() : 'Unknown';
    const fileExtension = path.extname(filename).toLowerCase();
    
    // Deteksi tipe file
    const fileType = getFileType(fileExtension);

    return {
      filename,
      size: filesize,
      type: fileType,
      directLink: directLinkMatch[1]
    };
  } catch (error) {
    throw new Error(`Gagal mendapatkan info file: ${error.message}`);
  }
}

function getFileType(extension) {
  const types = {
    '.pdf': 'PDF Document',
    '.zip': 'ZIP Archive',
    '.rar': 'RAR Archive',
    '.exe': 'Windows Executable',
    '.msi': 'Windows Installer',
    '.apk': 'Android Package',
    '.dmg': 'Mac OS Disk Image',
    '.mp3': 'Audio File',
    '.mp4': 'Video File',
    '.avi': 'Video File',
    '.mov': 'Video File',
    '.jpg': 'Image',
    '.jpeg': 'Image',
    '.png': 'Image',
    '.gif': 'Image',
    '.txt': 'Text File',
    '.doc': 'Word Document',
    '.docx': 'Word Document',
    '.xls': 'Excel Spreadsheet',
    '.xlsx': 'Excel Spreadsheet',
    '.ppt': 'PowerPoint',
    '.pptx': 'PowerPoint',
    '.dll': 'Dynamic Link Library',
    '.iso': 'Disk Image'
  };

  return types[extension] || 'Unknown File Type';
}

function formatFileSize(size) {
  if (size === 'Unknown') return size;
  return size.replace('Download', '').trim();
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

// Contoh penggunaan
downloadMediaFireFile('https://www.mediafire.com/file/abc123/sample.zip', './my-downloads')
  .then(result => console.log(result))
  .catch(error => console.error(error));

module.exports = downloadMediaFireFile;
