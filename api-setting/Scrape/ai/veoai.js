const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeVeo3AndGenerateVideo(prompt) {
  try {
    // Langkah 1: Scraping halaman Veo3.ai
    const response = await axios.get('https://veo3.ai');
    const html = response.data;
    const $ = cheerio.load(html);

    // Ambil semua elemen video dari halaman
    const videoElements = $('video');
    const videos = [];

    videoElements.each((index, element) => {
      const videoSrc = $(element).attr('src');
      const videoPoster = $(element).attr('poster');
      if (videoSrc) {
        videos.push({
          src: videoSrc,
          poster: videoPoster || null
        });
      }
    });

    // Jika tidak ada video ditemukan, cari iframe video (YouTube/Vimeo dll)
    if (videos.length === 0) {
      const iframeElements = $('iframe[src*="youtube"], iframe[src*="vimeo"]');
      iframeElements.each((index, element) => {
        const iframeSrc = $(element).attr('src');
        videos.push({
          src: iframeSrc,
          type: 'embed'
        });
      });
    }

    // Data untuk AI video generation
    const aiData = {
      scrapedVideos: videos,
      prompt: prompt
    };

    console.log('Data untuk AI:', aiData);

    // Simulasi response dari AI
    const aiResponse = {
      videoUrl: videos.length > 0 ? videos[0].src : 'https://example.com/sample-video.mp4',
      thumbnail: videos.length > 0 && videos[0].poster ? videos[0].poster : 'https://via.placeholder.com/500x300',
      duration: '00:30',
      resolution: '1080p'
    };

    return aiResponse;

  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Contoh penggunaan jika file dijalankan langsung
if (require.main === module) {
  (async () => {
    const userPrompt = 'Video pemandangan matahari terbenam yang indah';
    const videoData = await scrapeVeo3AndGenerateVideo(userPrompt);

    if (videoData) {
      console.log('Data Video yang dihasilkan:');
      console.log('URL Video:', videoData.videoUrl);
      console.log('Thumbnail:', videoData.thumbnail);
      console.log('Durasi:', videoData.duration);
      console.log('Resolusi:', videoData.resolution);
    } else {
      console.log('Gagal menghasilkan video.');
    }
  })();
}

// Ekspor tunggal di bagian paling bawah
module.exports = scrapeVeo3AndGenerateVideo;
