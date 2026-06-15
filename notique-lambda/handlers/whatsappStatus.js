const axios = require('axios');
const EC2_BRIDGE_URL = process.env.EC2_BRIDGE_URL;

module.exports = async (event) => {
  try {
    const res = await axios.post(`${EC2_BRIDGE_URL}/status`, {});
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(res.data)
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ connected: false })
    };
  }
};