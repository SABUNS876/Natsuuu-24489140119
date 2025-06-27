const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeWeather(city) {
  try {
    // First we need to get the location ID for the city
    const searchUrl = `https://weather.com/en-IN/search/enhanced?q=${encodeURIComponent(city)}`;
    const searchResponse = await axios.get(searchUrl);
    const $search = cheerio.load(searchResponse.data);
    
    // Get the first location result
    const locationLink = $search('a[data-testid="search-result"]').first().attr('href');
    if (!locationLink) {
      throw new Error('Location not found');
    }

    // Now scrape the actual weather page
    const weatherUrl = `https://weather.com${locationLink}`;
    const weatherResponse = await axios.get(weatherUrl);
    const $ = cheerio.load(weatherResponse.data);

    // Extract weather data
    const weatherData = {
      city: $('h1[data-testid="stationName"]').text().trim() || city,
      temperature: $('span[data-testid="TemperatureValue"]').first().text().trim(),
      conditions: $('[data-testid="wxPhrase"]').text().trim(),
      highLow: $('[data-testid="todayDetails"] [data-testid="TemperatureValue"]').text().trim(),
      humidity: $('[data-testid="HumiditySection"] span').first().text().trim(),
      wind: $('[data-testid="WindSection"] span').first().text().trim(),
      updated: $('span[data-testid="timestamp"]').text().trim()
    };

    return {
      status: true,
      creator: "Natsu - Api",
      result: weatherData
    };

  } catch (error) {
    console.error('Scraping error:', error);
    return {
      status: false,
      creator: "Natsu - Api",
      message: "Failed to get weather data",
      error: error.message
    };
  }
}

// Example usage
if (require.main === module) {
  scrapeWeather('Jakarta')
    .then(data => console.log(data))
    .catch(err => console.error(err));
}

module.exports = scrapeWeather;
