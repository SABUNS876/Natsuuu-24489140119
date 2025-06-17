const axios = require('axios');

const typecard = ["visa", "americanexpress", "mastercard", "jcb"];

async function generateCreditCards(type, count = "5") {
  // Validasi tipe kartu
  if (!typecard.includes(type)) {
    throw {
      status: false,
      message: "Type is invalid!",
      available_types: typecard
    };
  }

  // Mapping tipe kartu
  const typeMapping = {
    'visa': "Visa",
    'mastercard': "Mastercard",
    'americanexpress': "American%20Express",
    'jcb': "JCB"
  };
  
  const typeds = typeMapping[type];
  if (!typeds) {
    throw {
      status: false,
      message: "Invalid card type"
    };
  }

  try {
    const response = await axios.get('https://backend.lambdatest.com/api/dev-tools/credit-card-generator', {
      params: { 
        type: typeds, 
        'no-of-cards': count 
      },
      timeout: 10000
    });

    return {
      status: true,
      creator: 'natsu',
      count: count,
      data: response.data
    };

  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({
      status: false,
      message: "Memakai Huruf Kecil Contoh visa ada 4 pilihan visa, mastercard, americanexpress dan cjb. semuanya memakai huruf kecil",
      error: err.message
    };
  }
}

module.exports = generateCreditCards;
