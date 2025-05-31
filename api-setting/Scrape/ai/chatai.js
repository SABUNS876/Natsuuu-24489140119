const axios = require("axios");

/**
 * - Chat With ChatAI For Answer All Question Fast
 * - @chatAI {Object} 
 */
const chatAI = {
    chat: async (query) => {
        if (!query) {
            return {
                code: 403,
                timestamp: new Date().getTime(),
                message: "Query Tidak Di Isi!"
            }
        }
        let payload = {
            messages: [{
                role: "user",
                content: query
            }]
        }
        let headers = {
            headers: {
                "Origin": "https://chatai.org",
                "Referer": "https://chatai.org/"
            }
        }
        let { data } = await axios.post("https://chatai.org/api/chat", payload, headers)
        if (data.status === 500) {
            return {
                code: 500,
                timestamp: new Date().getTime(),
                message: data.data || null
            }
        }
        return {
            code: 200,
            timestamp: new Date().getTime(),
            message: data.content
        }
    },
    chatPrompt: async (query, prompt) => {
        if (!query && !prompt) {
            return {
                code: 403,
                timestamp: new Date().getTime(),
                message: "Parameter Query Atau Prompt Tidak Terisi."
            }
        }
        let payload = {
            messages: [{
                role: "user",
                content: "Siapa Nama Kamu?"
            }, {
                role: "assistant",
                content: prompt
            }, {
                role: "user",
                content: query
            }]
        }
        let headers = {
            headers: {
                Origin: "https://chatai.org",
                Referer: "https://chatai.org/"
            }
        }
        let { data } = await axios.post("https://chatai.org/api/chat", payload, headers)
        if (data.status === 500) {
            return {
                code: 500,
                timestamp: new Date().getTime(),
                message: data.data || null,
            }
        }
        return {
            code: 200,
            timestamp: new Date().getTime(),
            content: data.content
        }
    }
}

// Example usage:
// chatAI.chatPrompt("Kamu Shiroko?", "Kamu Adalah Shiroko Sekarang.").then(console.log)

module.exports = chatAI;
