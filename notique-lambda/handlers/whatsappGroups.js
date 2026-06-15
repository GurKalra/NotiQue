const axios = require('axios');
const EC2_BRIDGE_URL = process.env.EC2_BRIDGE_URL;

module.exports = async (event) => {
  try {
    const res = await axios.get(`${EC2_BRIDGE_URL}/groups`);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(res.data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};