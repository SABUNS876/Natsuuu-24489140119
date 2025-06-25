const axios = require('axios');
const cheerio = require('cheerio');

async function searchPlayer(playerIdOrName) {
  try {
    // Cek apakah input berupa ID numerik atau username
    const isNumericId = /^\d+$/.test(playerIdOrName);
    const searchUrl = isNumericId 
      ? `https://www.rolimons.com/player/${playerIdOrName}`
      : `https://www.rolimons.com/playerapi/playerbyname/${encodeURIComponent(playerIdOrName)}`;

    if (!isNumericId) {
      // Jika input username, ambil dulu ID-nya
      const idResponse = await axios.get(searchUrl);
      if (!idResponse.data || !idResponse.data.id) {
        console.log('Player not found');
        return null;
      }
      playerIdOrName = idResponse.data.id;
    }

    // Scrape halaman player
    const playerUrl = `https://www.rolimons.com/player/${playerIdOrName}`;
    const response = await axios.get(playerUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    // Ekstrak informasi player
    const playerInfo = {
      username: $('.player-name').text().trim(),
      rank: $('.rank-name').text().trim(),
      status: $('.player-status').text().trim(),
      joinDate: $('.join-date').text().replace('Joined:', '').trim(),
      lastOnline: $('.last-online').text().replace('Last Online:', '').trim(),
      rap: $('.rap-value').text().trim(),
      value: $('.value-value').text().trim(),
      inventory: {
        totalItems: $('.inventory-count').text().trim(),
        limiteds: $('.limiteds-count').text().trim(),
        rares: $('.rares-count').text().trim()
      },
      badges: []
    };

    // Ambil badges
    $('.badge-item').each((index, element) => {
      playerInfo.badges.push({
        name: $(element).find('.badge-name').text().trim(),
        description: $(element).find('.badge-description').text().trim()
      });
    });

    // Ambil aktivitas terbaru
    playerInfo.recentActivity = [];
    $('.activity-item').each((index, element) => {
      playerInfo.recentActivity.push($(element).text().trim());
    });

    console.log('Player Info:', playerInfo);
    return playerInfo;

  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
    return null;
  }
}

// Ekspor langsung fungsi searchPlayer
module.exports = searchPlayer;
