const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");

const gptOnline = {
  getNonceAndAny: async () => {
    const { data } = await axios.get("https://gptonline.ai/id/chatgpt-online/");
    const $ = cheerio.load(data);

    const div = $('.wpaicg-chat-shortcode');

    const nonce = div.attr('data-nonce');
    const botId = div.attr('data-bot-id');
    const postId = div.attr('data-post-id');

    return { nonce, botId, postId };
  },
  chat: async (prompt) => {
    let { nonce, botId, postId } = await gptOnline.getNonceAndAny()
    let $ = new FormData()
    $.append("_wpnonce", nonce)
    $.append("post_id", postId)
    $.append("url", "https://gptonline.ai/id/chatgpt-online/")
    $.append("action", "wpaicg_chat_shortcode_message")
    $.append("message", prompt)
    $.append("bot_id", botId)
    $.append("chat_bot_identity", "custom_bot_1040")
    $.append("wpaicg_chat_history", "[]")
    $.append("wpaicg_chat_client_id", "LCgGOMeIOC")
    const headersList = {
      headers: {
        ...$.getHeaders()
      }
    }
    let { data } = await axios.post("https://gptonline.ai/id/wp-admin/admin-ajax.php", $, headersList)
    return data
  }
};

module.exports = gptOnline;
