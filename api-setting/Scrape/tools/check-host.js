🛠️ *Generated Code:*

const axios = require('axios');

 const dns = require('dns').promises;

 const { URL } = require('url');

 

 /**

 * Validasi URL yang diberikan

 * @param {string} urlStr

 * @returns {boolean}

 */

 function isValidUrl(urlStr) {

 try {

 const urlObj = new URL(urlStr);

 return !!urlObj.protocol && !!urlObj.hostname;

 } catch {

 return false;

 }

 }

 

 /**

 * Delay function untuk rate limiting

 * @param {number} ms

 * @returns {Promise}

 */

 function delay(ms) {

 return new Promise(resolve => setTimeout(resolve, ms));

 }

 

 /**

 * Fungsi utama untuk cek host dan status

 * @param {string} targetUrl - URL yang akan dicek

 * @returns {Object} - hasil pengecekan

 */

 async function checkHostStatus(targetUrl) {

 try {

 // [1] Validasi input

 if (typeof targetUrl !== 'string') {

 throw new Error('Input harus berupa string URL');

 }

 if (!isValidUrl(targetUrl)) {

 throw new Error('URL tidak valid');

 }

 

 // [2] Parsing URL

 const urlObj = new URL(targetUrl);

 const hostname = urlObj.hostname;

 const protocol = urlObj.protocol;

 

 // [3] Cek DNS (resolve IP)

 let ipAddresses;

 try {

 ipAddresses = await dns.lookup(hostname, { all: true });

 } catch (dnsError) {

 throw new Error(`DNS resolution gagal: ${dnsError.message}`);

 }

 

 const ipList = ipAddresses.map(addr => addr.address);

 

 // [4] Cek status HTTP dengan axios

 let response;

 try {

 response = await axios.get(targetUrl, {

 headers: {

 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',

 'Referer': 'https://check-host.net/'

 },

 timeout: 15000,

 validateStatus: () => true // Izinkan semua status code

 });

 } catch (httpError) {

 throw new Error(`HTTP request gagal: ${httpError.message}`);

 }

 

 // [5] Validasi response status

 const statusCode = response.status;

 const isStatus200 = statusCode === 200;

 

 // [6] Cek response content (optional, bisa dicek apakah ada kata tertentu)

 // Karena tidak pakai cheerio dan berdasarkan instruksi, fokus ke DNS dan URL saja

 

 // [7] Cleanup dan delay

 await delay(2000 + Math.random() * 3000); // Delay 2-5 detik

 

 // [8] Return hasil

 return {

 url: targetUrl,

 hostname,

 ipAddresses: ipList,

 statusCode,

 statusText: response.statusText,

 status200: isStatus200,

 headers: response.headers,

 responseTimeMs: response.headers['x-response-time'] || null,

 dataSample: response.data ? (typeof response.data === 'string' ? response.data.substring(0, 200) : JSON.stringify(response.data).substring(0, 200)) : null

 };

 } catch (error) {

 // [9] Error handling spesifik

 throw new Error(`Gagal cek host: ${error.message}`);

 }

 }

 

 module.exports = checkHostStatus;

 

 /*

 Penjelasan:

 - Fungsi ini menerima URL, memvalidasi, lalu melakukan dns.lookup untuk IP.

 - Melakukan request HTTP GET untuk cek status 200.

 - Menggunakan delay 2-5 detik untuk rate limiting.

 - Tidak menggunakan cheerio karena instruksi.

 - Mengembalikan objek berisi hostname, IP, status HTTP, dan info lain.

 - Error ditangani secara spesifik sesuai instruksi.

 */
