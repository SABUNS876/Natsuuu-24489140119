const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'https://veo.ai',
  timeouts: {
    short: 10000,  // 10 seconds for quick requests
    normal: 30000, // 30 seconds for API calls
    long: 120000   // 2 minutes for downloads
  },
  maxAttempts: {
    connection: 3,
    renderStatus: 20
  },
  delays: {
    retry: 5000,
    statusCheck: 3000
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json'
  }
};

async function generateVeoAI(prompt, options = {}) {
  // Set default options
  const { 
    quality = '720p',
    duration = '30s',
    style = 'realistic',
    outputDir = './veo-output',
    verbose = false
  } = options;

  // Validate inputs
  const validQualities = ['360p', '480p', '720p', '1080p'];
  const validDurations = ['15s', '30s', '60s'];
  const validStyles = ['realistic', 'anime', 'cartoon', '3d'];

  if (!prompt) throw new Error('Prompt is required');
  if (!validQualities.includes(quality)) throw new Error(`Invalid quality. Choose one of: ${validQualities.join(', ')}`);
  if (!validDurations.includes(duration)) throw new Error(`Invalid duration. Choose one of: ${validDurations.join(', ')}`);
  if (!validStyles.includes(style)) throw new Error(`Invalid style. Choose one of: ${validStyles.join(', ')}`);

  try {
    // 1. Prepare output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 2. Get CSRF token
    if (verbose) console.log('Fetching CSRF token...');
    const homeResponse = await axios.get(CONFIG.baseUrl, {
      timeout: CONFIG.timeouts.short,
      headers: CONFIG.headers
    });
    
    const $ = cheerio.load(homeResponse.data);
    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    if (!csrfToken) throw new Error('Failed to get CSRF token');

    // 3. Generate video
    if (verbose) console.log('Starting video generation...');
    const generateResponse = await axios.post(`${CONFIG.baseUrl}/api/v1/videos/generate`, {
      prompt,
      quality,
      duration,
      style
    }, {
      timeout: CONFIG.timeouts.normal,
      headers: {
        ...CONFIG.headers,
        'X-CSRF-TOKEN': csrfToken,
        'Content-Type': 'application/json'
      }
    });

    const videoId = generateResponse.data.video_id;
    if (!videoId) throw new Error('Failed to start video generation');

    // 4. Check render status
    if (verbose) console.log('Checking render status...');
    let videoUrl;
    let attempts = 0;
    
    while (attempts < CONFIG.maxAttempts.renderStatus) {
      attempts++;
      if (verbose) console.log(`Status check attempt ${attempts}`);
      
      try {
        const statusResponse = await axios.get(`${CONFIG.baseUrl}/api/v1/videos/status/${videoId}`, {
          timeout: CONFIG.timeouts.short,
          headers: CONFIG.headers
        });

        if (statusResponse.data.status === 'completed') {
          videoUrl = statusResponse.data.video_url;
          break;
        } else if (statusResponse.data.status === 'failed') {
          throw new Error('Video rendering failed');
        }
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          if (verbose) console.log('Status check timeout, retrying...');
          continue;
        }
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, CONFIG.delays.statusCheck));
    }

    if (!videoUrl) throw new Error('Video rendering timed out');

    // 5. Download video
    if (verbose) console.log('Downloading video...');
    const videoResponse = await axios.get(videoUrl, {
      responseType: 'stream',
      timeout: CONFIG.timeouts.long
    });

    // 6. Save to file
    const safePrompt = prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `veo_${safePrompt.substring(0, 50)}_${Date.now()}.mp4`;
    const filepath = path.join(outputDir, filename);
    
    const writer = fs.createWriteStream(filepath);
    videoResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    return {
      success: true,
      filepath,
      videoUrl,
      metadata: { prompt, quality, duration, style, videoId }
    };

  } catch (error) {
    if (verbose) console.error('Error details:', error);
    
    let errorMessage = error.message;
    if (error.response) {
      errorMessage = `Server responded with ${error.response.status}: ${error.response.statusText}`;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Server timeout - please try again later';
    }

    return {
      success: false,
      error: errorMessage,
      metadata: { prompt, quality, duration, style }
    };
  }
}

// Example usage when run directly
if (require.main === module) {
  (async () => {
    console.log('Testing Veo.ai video generation...');
    const result = await generateVeoAI('a beautiful sunset at the beach', {
      quality: '720p',
      duration: '30s',
      verbose: true
    });

    if (result.success) {
      console.log('Success! Video saved to:', result.filepath);
    } else {
      console.error('Failed:', result.error);
    }
  })();
}

// Single export as requested
module.exports = generateVeoAI;
