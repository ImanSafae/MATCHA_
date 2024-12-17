const db = require("./../database/database");
const { httpResponse } = require('../utils');
const { StatusCodes } = require('http-status-codes');

async function nominatimSearch(req, res) {
  const functionName = "[NOMINATIM SEARCH]";
  try {
    const query = req.query.q;
    // console.log(query);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    // console.error(`${functionName} Fetching address failed:`, error);
    return null;
  }
}

async function nominatimGetAddress(lat, lon) {
  const functionName = "[NOMINATIM GET ADDRESS]";
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error(`${functionName} Error: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data.address;
    } catch (error) {
      // console.error(`${functionName} Fetching address failed:`, error);
      return null;
    }
}

module.exports = { 
  nominatimSearch,
  nominatimGetAddress
}; 
