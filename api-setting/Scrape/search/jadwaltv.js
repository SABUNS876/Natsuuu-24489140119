const axios = require("axios");
const cheerio = require("cheerio");

const jadwalTv = {
    /**
     * Get the TV schedule from a specific channel
     * @param {string} channelName - The channel name (e.g., "mnctv", "antv", etc.)
     * @returns {Promise<Array<{ time: string, show: string }>>} - List of schedule items
     */
    channel: async function(channelName) {
        const { data } = await axios.get(
            `https://www.jadwaltv.net/channel/${channelName}`
        );
        const $ = cheerio.load(data);
        const result = [];

        $("table.table-bordered")
            .first()
            .find("tr")
            .each((_, el) => {
                const td = $(el).find("td");
                if (td.length >= 2) {
                    const time = td.eq(0).text().trim();
                    const show = td.eq(1).text().trim();
                    if (
                        time &&
                        show &&
                        !show.includes("Jadwal TV selengkapnya")
                    ) {
                        result.push({ time, show });
                    }
                }
            });

        return result;
    },
    payChannel: async function(channelName) {
        const urlFriendlyName = channelName.toLowerCase().replace(/\s+/g, "-");
        const { data } = await axios.get(
            `https://www.jadwaltv.net/jadwal-pay-tv/${urlFriendlyName}`
        );
        const $ = cheerio.load(data);
        const result = [];

        $("table.table-bordered")
            .first()
            .find("tr")
            .each((_, el) => {
                const td = $(el).find("td");
                if (td.length >= 2) {
                    const time = td.eq(0).text().trim();
                    const show = td.eq(1).text().trim();
                    if (
                        time &&
                        show &&
                        !show.includes("Jadwal TV selengkapnya")
                    ) {
                        result.push({ time, show });
                    }
                }
            });

        return result;
    }
};

module.exports = jadwalTv;
