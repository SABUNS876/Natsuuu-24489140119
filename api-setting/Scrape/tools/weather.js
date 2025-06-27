const axios = require("axios");



const weather = {

  api: {

    base: 'https://weatherApi.intl.xiaomi.com',

    endpoints: {

      geoCity: (lat, lon) =>

        `/wtr-v3/location/city/geo?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`,

      searchCity: (name) =>

        `/wtr-v3/location/city/search?name=${encodeURIComponent(name)}`,

      hotCities: (locale) =>

        `/wtr-v3/location/city/hots?locale=${encodeURIComponent(locale)}`,

      translate: (cityData, targetLocale) => {

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

      bgWeather: (lat, lon, isLocated, locationKey) =>

        `/wtr-v3/weather/apart?latitude=${encodeURIComponent(lat)}` +

        `&longitude=${encodeURIComponent(lon)}` +

        `&isLocated=${encodeURIComponent(isLocated)}` +

        `&locationKey=${encodeURIComponent(locationKey)}`,

      allWeather: (lat, lon, isLocated, locationKey) =>

        `/wtr-v3/weather/all?latitude=${encodeURIComponent(lat)}` +

        `&longitude=${encodeURIComponent(lon)}` +

        `&isLocated=${encodeURIComponent(isLocated)}` +

        `&locationKey=${encodeURIComponent(locationKey)}` +

        `&days=15`,

    },

  },



  headers: {

    'user-agent': 'Postify/1.0.0',

    accept: 'application/json',

  },



  appKey: 'weather20151024',

  sign: 'zUFJoAR2ZVrDy1vF3D07',



  _contextParams: () => {

    const romVersion = 'unknown';

    const appVersion = 'unknown';

    const alpha = 'false';

    const isGlobal = 'false';

    const device = 'browser';

    const modDevice = '';

    const locale = 'en_US';



    return `&appKey=${weather.appKey}&sign=${weather.sign}` +

      `&romVersion=${encodeURIComponent(romVersion)}` +

      `&appVersion=${encodeURIComponent(appVersion)}` +

      `&alpha=${encodeURIComponent(alpha)}` +

      `&isGlobal=${encodeURIComponent(isGlobal)}` +

      `&device=${encodeURIComponent(device)}` +

      `&modDevice=${encodeURIComponent(modDevice)}` +

      `&locale=${encodeURIComponent(locale)}`;

  },



  getGeoCity: async (lat, lon) => {

    const module = 'GEO_CITY';

    const input = { latitude: lat, longitude: lon };

    if (!lat || !lon) {

      return {

        success: false,

        code: 400,

        result: { module, input, error: 'Latitude ama longitude kudu diisi yak bree... ' },

      };

    }



    const url = `${weather.api.base}${weather.api.endpoints.geoCity(lat, lon)}&appKey=${weather.appKey}${weather._contextParams()}`;



    try {

      const { data } = await axios.get(url, { headers: weather.headers });

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



  searchCity: async (name) => {

    const module = 'SEARCH_CITY';

    const input = { name };

    if (!name || name.trim() === '') {

      return {

        success: false,

        code: 400,

        result: { module, input, error: 'Nama kota kudu diisi yak bree 🗿' },

      };

    }



    const url = `${weather.api.base}${weather.api.endpoints.searchCity(name)}&appKey=${weather.appKey}${weather._contextParams()}`;



    try {

      const { data } = await axios.get(url, { headers: weather.headers });

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



  getHotCities: async (locale = 'en_US') => {

    const module = 'HOT_CITIES';

    const input = { locale };



    if (!locale || locale.trim() === '') {

      return {

        success: false,

        code: 400,

        result: { module, input, error: 'Parameter locale kudu diisi yak bree, kagak boleh kosong 🗿' },

      };

    }



    const url = `${weather.api.base}${weather.api.endpoints.hotCities(locale)}&appKey=${weather.appKey}&sign=${weather.sign}${weather._contextParams()}`;



    try {

      const { data } = await axios.get(url, { headers: weather.headers });

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



  getTranslate: async (cityData, targetLocale) => {

    const module = 'TRANSLATE';

    const input = { cityData, targetLocale };



    if (!cityData || !cityData.latitude || !cityData.longitude || !cityData.name || !targetLocale) {

      return {

        success: false,

        code: 400,

        result: { module, input, error: 'cityDatanya kudu lengkap yak bree +  targetLocale kudu diisi juga 🗿 kagak boleh kosong ..' },

      };

    }



    const url = `${weather.api.base}${weather.api.endpoints.translate(cityData, targetLocale)}&appKey=${weather.appKey}&sign=${weather.sign}${weather._contextParams()}`;



    try {

      const { data } = await axios.get(url, { headers: weather.headers });

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



  getBgWeather: async (lat, lon, isLocated = 'true', locationKey) => {

    const module = 'BACKGROUND_WEATHER';

    const input = { latitude: lat, longitude: lon, isLocated, locationKey };



    if (!lat || !lon || !locationKey) {

      return {

        success: false,

        code: 400,

        result: { module, input, error: 'Latitude, longitude, ama locationKey wajib diisi yak bree...' },

      };

    }



    const url = `${weather.api.base}${weather.api.endpoints.bgWeather(lat, lon, isLocated, locationKey)}&appKey=${weather.appKey}&sign=${weather.sign}${weather._contextParams()}`;



    try {

      const { data } = await axios.get(url, { headers: weather.headers });

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



  getAllWeather: async (lat, lon, isLocated = 'true', locationKey) => {

    const module = 'ALL_WEATHER';

    const input = { latitude: lat, longitude: lon, isLocated, locationKey };



    if (!lat || !lon || !locationKey) {

      return {

        success: false,

        code: 400,

        result: { module, input, error: 'Latitude, longitude, ama locationKey kudu diisi yak bree... ' },

      };

    }



    const url = `${weather.api.base}${weather.api.endpoints.allWeather(lat, lon, isLocated, locationKey)}&appKey=${weather.appKey}&sign=${weather.sign}${weather._contextParams()}`;



    try {

      const { data } = await axios.get(url, { headers: weather.headers });

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

  },

};



module.exports = weather;
