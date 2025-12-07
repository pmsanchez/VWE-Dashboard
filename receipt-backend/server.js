// server.js

require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js'); // 💡 NEW IMPORT

const app = express();
const PORT = process.env.PORT || 3000;

// 💡 NEW: Supabase Client Initialization using provided credentials (best practice is to use .env)
const supabaseUrl = 'https://kferklonerkpbzbdenqq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZXJrbG9uZXJrcGJ6YmRlbnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTQ5ODIsImV4cCI6MjA3OTc3MDk4Mn0.FbavGWp_SQIepM-X-zV7StZzvLQaoGcIPBrE8VAHRts';
const supabase = createClient(supabaseUrl, supabaseKey);


// Middleware
app.use(cors()); // Allow cross-origin requests from your Angular app
app.use(express.json({ limit: '50mb' })); // To handle large JSON payloads (Base64 image)

// SUPPABASE INTEGRATION
// 2. 💡 NEW: Route to Fetch Seminars
app.get('/api/seminars', async (req, res) => {
    try {
        // Fetch 'id' and 'name' from the 'seminar' table
        const { data, error } = await supabase
            .from('seminar')
            .select('id, name') 
            .order('name', { ascending: true }); 

        if (error) {
            console.error('Supabase Error:', error);
            return res.status(500).json({ message: 'Error fetching seminars from Supabase', details: error.message });
        }

        res.json(data);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// 💡 NEW: Route to Fetch Students for a specific Seminar ID
app.get('/api/students/:seminarId', async (req, res) => {
    const seminarId = req.params.seminarId;

    if (!seminarId) {
        return res.status(400).json({ message: 'Missing seminarId parameter.' });
    }
    
    // Convert seminarId to integer for safer querying
    const id = parseInt(seminarId, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid seminarId format.' });
    }

    try {
        // Fetch students where seminar_id matches the provided ID
        const { data, error } = await supabase
            .from('student') // Assuming the table is named 'student'
            .select('*') // Select all columns for now, as requested
            .eq('seminar_id', id) // 💡 KEY: Filter by the foreign key
            .order('name', { ascending: true }); 

        if (error) {
            console.error('Supabase Error fetching students:', error);
            return res.status(500).json({ message: 'Error fetching students from Supabase', details: error.message });
        }

        res.json(data);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


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