const axios = require('axios');
const cheerio = require('cheerio');

async function searchPlayer(playerIdOrName) {
  try {
    // First check if we're dealing with an ID or username
    const isNumericId = /^\d+$/.test(playerIdOrName);
    
    // If it's a username, first get the player ID
    if (!isNumericId) {
      const nameSearchUrl = `https://www.rolimons.com/playerapi/playerbyname/${encodeURIComponent(playerIdOrName)}`;
      const idResponse = await axios.get(nameSearchUrl);
      
      // Handle cases where player isn't found
      if (!idResponse.data || !idResponse.data.id) {
        return {
          status: false,
          message: 'Player not found',
          input: playerIdOrName
        };
      }
      playerIdOrName = idResponse.data.id;
    }

    // Now fetch the player page
    const playerUrl = `https://www.rolimons.com/player/${playerIdOrName}`;
    const response = await axios.get(playerUrl);
    
    // Check if the page contains player data
    if (response.data.includes('Player Not Found')) {
      return {
        status: false,
        message: 'Player not found',
        playerId: playerIdOrName
      };
    }

    const $ = cheerio.load(response.data);

    // Extract player information
    const playerInfo = {
      status: true,
      username: $('.player_name').text().trim(),
      rank: $('.rank_name').text().trim(),
      rap: $('.rap_value').text().trim(),
      value: $('.value_value').text().trim(),
      lastOnline: $('.last_online').text().replace('Last Online:', '').trim(),
      inventory: {
        total: $('.inventory_count').text().trim(),
        limiteds: $('.limiteds_count').text().trim()
      }
    };

    return playerInfo;

  } catch (error) {
    console.error('Scraping error:', error);
    return {
      status: false,
      error: error.message,
      stack: error.stack
    };
  }
}

module.exports = searchPlayer;
