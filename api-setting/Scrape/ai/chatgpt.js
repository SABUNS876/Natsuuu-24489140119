const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");

// Versi fungsi langsung
async function gptOnlineHandler(prompt) {
  const getNonceAndAny = async () => {
    const { data } = await axios.get("https://gptonline.ai/id/chatgpt-online/");
    const $ = cheerio.load(data);
    const div = $('.wpaicg-chat-shortcode');
    return {
      nonce: div.attr('data-nonce'),
      botId: div.attr('data-bot-id'),
      postId: div.attr('data-post-id')
    };
  };

  const { nonce, botId, postId } = await getNonceAndAny();
  const form = new FormData();
  form.append("_wpnonce", nonce);
  form.append("post_id", postId);
  form.append("url", "https://gptonline.ai/id/chatgpt-online/");
  form.append("action", "wpaicg_chat_shortcode_message");
  form.append("message", prompt);
  form.append("bot_id", botId);
  form.append("chat_bot_identity", "custom_bot_1040");
  form.append("wpaicg_chat_history", "[]");
  form.append("wpaicg_chat_client_id", "LCgGOMeIOC");

  const { data } = await axios.post(
    "https://gptonline.ai/id/wp-admin/admin-ajax.php",
    form,
    { headers: form.getHeaders() }
  );

  return data;
}

module.exports = gptOnlineHandler; // Ekspor fungsi langsung
