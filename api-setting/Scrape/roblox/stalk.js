const axios = require('axios');
const cheerio = require('cheerio');

async function searchPlayer(playerName) {
    try {
        // First get the CSRF token from the homepage
        const homeResponse = await axios.get('https://www.rolimons.com/');
        const $home = cheerio.load(homeResponse.data);
        const csrfToken = $home('meta[name="csrf-token"]').attr('content');

        if (!csrfToken) {
            throw new Error('Failed to get CSRF token');
        }

        // Search for the player
        const searchResponse = await axios.post(
            'https://www.rolimons.com/playerapi/playersearch',
            {
                player_name: playerName
            },
            {
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'Content-Type': 'application/json',
                    'Referer': 'https://www.rolimons.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            }
        );

        if (!searchResponse.data || !searchResponse.data.players) {
            throw new Error('No players found');
        }

        // Get detailed player information for each result
        const players = await Promise.all(
            searchResponse.data.players.map(async (player) => {
                try {
                    const playerResponse = await axios.get(
                        `https://www.rolimons.com/player/${player[1]}`,
                        {
                            headers: {
                                'Referer': 'https://www.rolimons.com/',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                            }
                        }
                    );

                    const $player = cheerio.load(playerResponse.data);
                    
                    return {
                        id: player[1],
                        name: player[0],
                        rap: $player('.player_rap_value').text().trim(),
                        value: $player('.player_value_value').text().trim(),
                        inventoryCount: $player('.player_inventory_count').text().trim(),
                        rank: $player('.player_rank_value').text().trim(),
                        lastOnline: $player('.player_last_online_value').text().trim()
                    };
                } catch (error) {
                    console.error(`Error fetching details for player ${player[0]}:`, error.message);
                    return null;
                }
            })
        );

        // Filter out any failed player detail fetches
        return players.filter(player => player !== null);

    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

module.exports = searchPlayer;

// Example usage:
// const searchPlayer = require('./rolimonsScraper');
// searchPlayer('PlayerName').then(players => console.log(players)).catch(console.error);
