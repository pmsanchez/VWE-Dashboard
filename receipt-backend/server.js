// server.js

require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests from your Angular app
app.use(express.json({ limit: '50mb' })); // To handle large JSON payloads (Base64 image)

// Secure route to proxy the request to Veryfi
app.post('/api/process-receipt', async (req, res) => {
  const veryfiUrl = process.env.VERYFI_URL;

  // The payload (image data) comes from the Angular client
  const payload = req.body; 

  // The secure credentials are added here on the server
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Angular-Receipt-App-Backend',
    'Client-Id': process.env.VERYFI_CLIENT_ID,
    'Authorization': process.env.VERYFI_AUTHORIZATION
  };

  try {
    const veryfiResponse = await axios.post(veryfiUrl, payload, { headers });

    // Send the Veryfi response back to the Angular client
    res.json(veryfiResponse.data);

  } catch (error) {
    console.error('Error contacting Veryfi API:', error.message);
    const statusCode = error.response ? error.response.status : 500;
    const errorMessage = error.response ? error.response.data : 'Internal Server Error';

    // Forward the error response back to the client
    res.status(statusCode).json(errorMessage);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});