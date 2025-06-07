const axios = require("axios");
const cheerio = require("cheerio");

async function getChannelSchedule(channelName) {
    const { data } = await axios.get(`https://www.jadwaltv.net/channel/${channelName}`);
    const $ = cheerio.load(data);
    const result = [];

    $("table.table-bordered").first().find("tr").each((_, el) => {
        const td = $(el).find("td");
        if (td.length >= 2) {
            const time = td.eq(0).text().trim();
            const show = td.eq(1).text().trim();
            if (time && show && !show.includes("Jadwal TV selengkapnya")) {
                result.push({ time, show });
            }
        }
    });

    return result;
}

async function getPayChannelSchedule(channelName) {
    const urlFriendlyName = channelName.toLowerCase().replace(/\s+/g, "-");
    const { data } = await axios.get(`https://www.jadwaltv.net/jadwal-pay-tv/${urlFriendlyName}`);
    const $ = cheerio.load(data);
    const result = [];

    $("table.table-bordered").first().find("tr").each((_, el) => {
        const td = $(el).find("td");
        if (td.length >= 2) {
            const time = td.eq(0).text().trim();
            const show = td.eq(1).text().trim();
            if (time && show && !show.includes("Jadwal TV selengkapnya")) {
                result.push({ time, show });
            }
        }
    });

    return result;
}

// Ekspor sebagai object dengan method yang jelas
module.exports = {
    channel: getChannelSchedule,
    payChannel: getPayChannelSchedule
};
