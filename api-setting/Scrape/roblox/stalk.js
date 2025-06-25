const axios = require('axios');
const cheerio = require('cheerio');

async function searchPlayer(playerIdOrName) {
  try {
    // Check if input is numeric ID or username
    const isNumericId = /^\d+$/.test(playerIdOrName);

    // Step 1: If username, resolve to Roblox ID first
    if (!isNumericId) {
      const nameSearchUrl = `https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(playerIdOrName)}`;
      try {
        const idResponse = await axios.get(nameSearchUrl);
        if (!idResponse.data || !idResponse.data.Id) {
          return {
            status: false,
            error: "Player not found on Roblox",
            input: playerIdOrName
          };
        }
        playerIdOrName = idResponse.data.Id;
      } catch (error) {
        return {
          status: false,
          error: "Failed to resolve username to ID",
          details: error.message
        };
      }
    }

    // Step 2: Fetch Rolimons profile
    const playerUrl = `https://www.rolimons.com/player/${playerIdOrName}`;
    let response;
    try {
      response = await axios.get(playerUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          status: false,
          error: "Player not found on Rolimons",
          playerId: playerIdOrName
        };
      }
      throw error;
    }

    // Step 3: Parse the HTML response
    const $ = cheerio.load(response.data);

    // Check if player exists
    if ($('title').text().includes('Not Found')) {
      return {
        status: false,
        error: "Player profile not found",
        playerId: playerIdOrName
      };
    }

    // Extract player data
    const playerInfo = {
      status: true,
      username: $('.player_name').text().trim() || null,
      rank: $('.rank_name').text().trim() || null,
      rap: $('.rap_value').text().trim().replace(/,/g, '') || 0,
      value: $('.value_value').text().trim().replace(/,/g, '') || 0,
      lastOnline: $('.last_online').text().replace('Last Online:', '').trim() || null,
      inventory: {
        total: parseInt($('.inventory_count').text().trim().replace(/,/g, '')) || 0,
        limiteds: parseInt($('.limiteds_count').text().trim().replace(/,/g, '')) || 0
      }
    };

    return playerInfo;

  } catch (error) {
    console.error('Scraping error:', error);
    return {
      status: false,
      error: "Internal server error",
      details: error.message,
      stack: error.stack
    };
  }
}

module.exports = searchPlayer;
