const axios = require('axios');
const EC2_BRIDGE_URL = process.env.EC2_BRIDGE_URL;

module.exports = async (event) => {
  const { phoneNumber } = JSON.parse(event.body);
  if (!phoneNumber)
    return { statusCode: 400, body: JSON.stringify({ error: 'phoneNumber required' }) };
  try {
    const res = await axios.post(`${EC2_BRIDGE_URL}/bridge/reset-session`, { phoneNumber });
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(res.data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};