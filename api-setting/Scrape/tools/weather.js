const axios = require("axios");

const weather = {
  api: {
    base: 'https://weatherApi.intl.xiaomi.com',
    endpoints: {
      geoCity: function(lat, lon) {
        return `/wtr-v3/location/city/geo?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`;
      },
      searchCity: function(name) {
        return `/wtr-v3/location/city/search?name=${encodeURIComponent(name)}`;
      },
      hotCities: function(locale) {
        return `/wtr-v3/location/city/hots?locale=${encodeURIComponent(locale)}`;
      },
      translate: function(cityData, targetLocale) {
        const {
          latitude,
          longitude,
          name,
          belongings = '',
          extra = '',
          locale = 'en_US',
        } = cityData;
        return `/wtr-v3/location/city/translate?isGlobal=true` +
          `&latitude=${encodeURIComponent(latitude)}` +
          `&longitude=${encodeURIComponent(longitude)}` +
          `&name=${encodeURIComponent(name)}` +
          `&aff=${encodeURIComponent(belongings)}` +
          `&key=${encodeURIComponent(extra)}` +
          `&srcLocale=${encodeURIComponent(locale)}` +
          `&tarLocale=${encodeURIComponent(targetLocale)}`;
      },
      bgWeather: function(lat, lon, isLocated, locationKey) {
        return `/wtr-v3/weather/apart?latitude=${encodeURIComponent(lat)}` +
          `&longitude=${encodeURIComponent(lon)}` +
          `&isLocated=${encodeURIComponent(isLocated)}` +
          `&locationKey=${encodeURIComponent(locationKey)}`;
      },
      allWeather: function(lat, lon, isLocated, locationKey) {
        return `/wtr-v3/weather/all?latitude=${encodeURIComponent(lat)}` +
          `&longitude=${encodeURIComponent(lon)}` +
          `&isLocated=${encodeURIComponent(isLocated)}` +
          `&locationKey=${encodeURIComponent(locationKey)}` +
          `&days=15`;
      }
    }
  },

  headers: {
    'user-agent': 'Postify/1.0.0',
    'accept': 'application/json',
  },

  appKey: 'weather20151024',
  sign: 'zUFJoAR2ZVrDy1vF3D07',

  _contextParams: function() {
    const romVersion = 'unknown';
    const appVersion = 'unknown';
    const alpha = 'false';
    const isGlobal = 'false';
    const device = 'browser';
    const modDevice = '';
    const locale = 'en_US';

    return `&appKey=${this.appKey}&sign=${this.sign}` +
      `&romVersion=${encodeURIComponent(romVersion)}` +
      `&appVersion=${encodeURIComponent(appVersion)}` +
      `&alpha=${encodeURIComponent(alpha)}` +
      `&isGlobal=${encodeURIComponent(isGlobal)}` +
      `&device=${encodeURIComponent(device)}` +
      `&modDevice=${encodeURIComponent(modDevice)}` +
      `&locale=${encodeURIComponent(locale)}`;
  },

  getGeoCity: async function(lat, lon) {
    const module = 'GEO_CITY';
    const input = { latitude: lat, longitude: lon };
    if (!lat || !lon) {
      return {
        success: false,
        code: 400,
        result: { module, input, error: 'Latitude ama longitude kudu diisi yak bree... ' },
      };
    }

    const url = `${this.api.base}${this.api.endpoints.geoCity(lat, lon)}&appKey=${this.appKey}${this._contextParams()}`;

    try {
      const { data } = await axios.get(url, { headers: this.headers });
      return { success: true, code: 200, result: { module, input, ...data } };
    } catch (error) {
      return {
        success: false,
        code: error.response?.status || 500,
        result: {
          module,
          input,
          error: error.response?.data?.message || error.message || 'Error bree... ',
        },
      };
    }
  },

  searchCity: async function(name) {
    const module = 'SEARCH_CITY';
    const input = { name };
    if (!name || name.trim() === '') {
      return {
        success: false,
        code: 400,
        result: { module, input, error: 'Nama kota kudu diisi yak bree 🗿' },
      };
    }

    const url = `${this.api.base}${this.api.endpoints.searchCity(name)}&appKey=${this.appKey}${this._contextParams()}`;

    try {
      const { data } = await axios.get(url, { headers: this.headers });
      return { success: true, code: 200, result: { module, input, ...data } };
    } catch (error) {
      return {
        success: false,
        code: error.response?.status || 500,
        result: {
          module,
          input,
          error: error.response?.data?.message || error.message || 'Kagak bisa nyari kotanya bree....',
        },
      };
    }
  },

  getHotCities: async function(locale = 'en_US') {
    const module = 'HOT_CITIES';
    const input = { locale };

    if (!locale || locale.trim() === '') {
      return {
        success: false,
        code: 400,
        result: { module, input, error: 'Parameter locale kudu diisi yak bree, kagak boleh kosong 🗿' },
      };
    }

    const url = `${this.api.base}${this.api.endpoints.hotCities(locale)}&appKey=${this.appKey}&sign=${this.sign}${this._contextParams()}`;

    try {
      const { data } = await axios.get(url, { headers: this.headers });
      return { success: true, code: 200, result: { module, input, ...data } };
    } catch (error) {
      return {
        success: false,
        code: error.response?.status || 500,
        result: {
          module,
          input,
          error: error.response?.data?.message || error.message || 'Data Hot Citiesnya kagak bisa diambil bree...',
        },
      };
    }
  },

  getTranslate: async function(cityData, targetLocale) {
    const module = 'TRANSLATE';
    const input = { cityData, targetLocale };

    if (!cityData || !cityData.latitude || !cityData.longitude || !cityData.name || !targetLocale) {
      return {
        success: false,
        code: 400,
        result: { module, input, error: 'cityDatanya kudu lengkap yak bree +  targetLocale kudu diisi juga 🗿 kagak boleh kosong ..' },
      };
    }

    const url = `${this.api.base}${this.api.endpoints.translate(cityData, targetLocale)}&appKey=${this.appKey}&sign=${this.sign}${this._contextParams()}`;

    try {
      const { data } = await axios.get(url, { headers: this.headers });
      return { success: true, code: 200, result: { module, input, ...data } };
    } catch (error) {
      return {
        success: false,
        code: error.response?.status || 500,
        result: {
          module,
          input,
          error: error.response?.data?.message || error.message || 'Kagak bisa translate bree 🗿',
        },
      };
    }
  },

  getBgWeather: async function(lat, lon, isLocated = 'true', locationKey) {
    const module = 'BACKGROUND_WEATHER';
    const input = { latitude: lat, longitude: lon, isLocated, locationKey };

    if (!lat || !lon || !locationKey) {
      return {
        success: false,
        code: 400,
        result: { module, input, error: 'Latitude, longitude, ama locationKey wajib diisi yak bree...' },
      };
    }

    const url = `${this.api.base}${this.api.endpoints.bgWeather(lat, lon, isLocated, locationKey)}&appKey=${this.appKey}&sign=${this.sign}${this._contextParams()}`;

    try {
      const { data } = await axios.get(url, { headers: this.headers });
      return { success: true, code: 200, result: { module, input, ...data } };
    } catch (error) {
      return {
        success: false,
        code: error.response?.status || 500,
        result: {
          module,
          input,
          error: error.response?.data?.message || error.message || 'Error bree..',
        },
      };
    }
  },

  getAllWeather: async function(lat, lon, isLocated = 'true', locationKey) {
    const module = 'ALL_WEATHER';
    const input = { latitude: lat, longitude: lon, isLocated, locationKey };

    if (!lat || !lon || !locationKey) {
      return {
        success: false,
        code: 400,
        result: { module, input, error: 'Latitude, longitude, ama locationKey kudu diisi yak bree... ' },
      };
    }

    const url = `${this.api.base}${this.api.endpoints.allWeather(lat, lon, isLocated, locationKey)}&appKey=${this.appKey}&sign=${this.sign}${this._contextParams()}`;

    try {
      const { data } = await axios.get(url, { headers: this.headers });
      return { success: true, code: 200, result: { module, input, ...data } };
    } catch (error) {
      return {
        success: false,
        code: error.response?.status || 500,
        result: {
          module,
          input,
          error: error.response?.data?.message || error.message || 'Error bree...',
        },
      };
    }
  }
};

module.exports = weather;
