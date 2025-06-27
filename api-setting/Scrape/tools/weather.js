const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://weather.com/';

async function scrapeWeather(city) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const weatherData = {
      city: city || 'Rochor, Central Singapore',
      temperature: $('span[data-testid="TemperatureValue"]').first().text().trim(),
      conditions: $('[data-testid="wxPhrase"]').first().text().trim(),
      highLow: $('div[data-testid="SegmentHighTemp"]').first().text().trim(),
      humidity: $('div[data-testid="HumiditySection"] span').first().text().trim(),
      wind: $('div[data-testid="WindSection"] span').first().text().trim()
    };

    return weatherData;
  } catch (error) {
    console.error('Error during scraping:', error);
    throw new Error('Failed to scrape weather data');
  }
}

// Example usage when run directly
if (require.main === module) {
  scrapeWeather('Rochor')
    .then(data => {
      console.log('Weather Data:', data);
    })
    .catch(error => {
      console.error('Scraping failed:', error.message);
    });
}

// Export the function directly
module.exports = scrapeWeather;
