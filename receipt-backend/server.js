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
// receipt-backend/server.js (MODIFIED /api/seminars route)

// receipt-backend/server.js (CLEANED UP /api/seminars route)

app.get('/api/seminars', async (req, res) => {
    try {
        // The select string MUST only contain valid column names and nested relationships.
        const { data, error } = await supabase
            .from('seminar')
            .select(`
                id, 
                sem_id, 
                name, 
                description, 
                start_date, 
                end_date, 
                location_id,
                location (
                    location_name,
                    country_code
                )
            `)
            .order('start_date', { ascending: true }); 

        if (error) throw error;

        // Map the Data to flatten the nested object structure.
        const mappedSeminars = data.map(seminar => ({
            ...seminar,
            location_name: seminar.location ? seminar.location.location_name : 'Unknown Location',
            location_country_code: seminar.location ? seminar.location.country_code : 'N/A'
        }));

        res.json(mappedSeminars);

    } catch (error) {
        console.error('Supabase Error in /api/seminars:', error);
        res.status(500).json({ message: 'Error fetching seminars' });
    }
});


// Route to Fetch Students for a specific Seminar ID (using junction table)
app.get('/api/students/:seminarId', async (req, res) => {
    const seminarPkId = req.params.seminarId; // The numeric ID from Angular

    // 1. Convert to integer and validate
    const id = parseInt(seminarPkId, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid seminarId format.' });
    }

    try {
        // --- STEP 1: Get the 'sem_id' (Text Key) from the 'seminar' table ---
        const { data: seminarData, error: seminarError } = await supabase
            .from('seminar')
            .select('sem_id') // We need the text key 'sem_id'
            .eq('id', id)      // Filter by the numeric Primary Key 'id'
            .single();

        if (seminarError || !seminarData) {
            console.error('Supabase Error: Could not find sem_id:', seminarError || 'No seminar found');
            // If seminar is not found, return an empty array instead of 500
            return res.status(200).json([]); 
        }

        const semIdText = seminarData.sem_id;

        // --- STEP 2: Use the text key (sem_id) to join through seminar_registration ---
        // We select the student details by joining seminar_registration and student.
        // Supabase allows us to navigate the relationship back to 'student'.
        // Since the foreign key in seminar_registration is stud_id (text), 
        // we join to the student table where student.stud_id = seminar_registration.stud_id
        
const { data: studentsData, error: studentsError } = await supabase
    .from('seminar_registration') 
    .select(`
        student (
            id, stud_id, name, street_city, city, province, country_code,
            email, phone, tshirt_size, hoodie_size, food_allergies, 
            allergy_details, comments, observations, seminar_attendances, 
            position, diet_type, status
        )
    `)
    .eq('sem_id', semIdText)
    .order('name', { foreignTable: 'student', ascending: true });

        if (studentsError) {
            console.error('Supabase Error fetching students:', studentsError);
            return res.status(500).json({ message: 'Error fetching students from Supabase', details: studentsError.message });
        }
        
        // The result structure will be { student: { ...data... } }
        // We need to map it to an array of just the student objects.
        const students = studentsData.map(reg => reg.student);

        res.json(students);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Route to Update a Student's details
// Endpoint: PUT /api/students/:studentId
app.put('/api/students/:studentId', async (req, res) => {
    // 1. Get the unique student identifier (stud_id) from the URL
    const studentId = req.params.studentId; 
    
    // 2. Get the updated data from the request body
    const updatedStudentData = req.body;

    // IMPORTANT: Remove any fields that Supabase expects to manage (e.g., primary key 'id' 
    // if it's auto-managed, or any joined/calculated fields).
    // We remove 'id' (the numeric PK) to prevent accidental update errors.
    // Also remove the calculated 'seminar_attendances' as it should not be written back.
    delete updatedStudentData.id;
    delete updatedStudentData.seminar_attendances;
    
    // The stud_id (text key) is used for the filter, not the payload.
    // Ensure we are only sending columns that exist directly on the 'student' table.

    try {
        // Use the Supabase .update() method.
        // The first argument is the payload (the data to update).
        // The .eq() method ensures only the student with the matching stud_id is updated.
        const { data, error } = await supabase
            .from('student') // Target the main student table
            .update(updatedStudentData)
            .eq('stud_id', studentId) // Filter using the text key from the URL
            .select(`
                id, stud_id, name, street_city, city, province, country_code,
                email, phone, tshirt_size, hoodie_size, food_allergies, 
                allergy_details, comments, observations, seminar_attendances, 
                position, diet_type, status
            `)
            .single(); // Expect a single updated record

        if (error) {
            console.error('Supabase Error updating student:', error);
            // Check for specific database errors (e.g., constraint violations)
            return res.status(400).json({ 
                message: 'Failed to update student details in database.', 
                details: error.message 
            });
        }
        
        if (!data) {
             // This happens if the stud_id was valid but no row was matched/updated
            return res.status(404).json({ message: 'Student not found or no changes made.' });
        }

        // Return the successfully updated (and possibly enriched by the DB) student data
        res.json(data);

    } catch (error) {
        console.error('Server Error updating student:', error);
        res.status(500).json({ message: 'Internal Server Error during student update.' });
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

// server.js (New Route Handler - Add this block)

app.patch('/api/students/bulk-update', async (req, res) => {
    // Expected body: { ids: ['VWE000038', 'VWE000040'], updates: { status: 'Paid' } }
    const { ids, updates } = req.body;

    // 1. Validation Check
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'Invalid bulk update request: Missing IDs or update payload.' });
    }

    // 2. Security/Sanitization (Optional but HIGHLY RECOMMENDED)
    // You should ensure 'updates' only contains keys that are safe to update.
    // E.g., const allowedFields = ['status', 'position', 'diet_type', 'tshirt_size', 'hoodie_size', 'food_allergies'];
    // const safeUpdates = Object.keys(updates)
    //     .filter(key => allowedFields.includes(key))
    //     .reduce((obj, key) => {
    //         obj[key] = updates[key];
    //         return obj;
    //     }, {});

    try {
        // 3. Perform Bulk Update using Supabase
        // The .update() method sets the new values defined in 'updates'.
        // The .in() method filters the update to ONLY students whose 'stud_id' is within the 'ids' array.
        const { error } = await supabase
            .from('student') // Change 'student' to your actual table name if different
            .update(updates) 
            .in('stud_id', ids); 

        if (error) {
            console.error('Supabase Error during bulk update:', error);
            // Check for specific database errors (e.g., integrity constraints)
            return res.status(500).json({ 
                message: 'Database failed to execute bulk update.', 
                details: error.message 
            });
        }
        
        // 4. Success Response
        // Supabase returns null data on successful update, so we return a confirmation.
        res.json({ 
            message: `Successfully updated ${ids.length} students.`, 
            count: ids.length, 
            updatedFields: updates 
        });

    } catch (error) {
        console.error('Server Error during bulk update:', error);
        res.status(500).json({ message: 'Internal server error during bulk update process.' });
    }
});

// DELETE route for bulk student deletion
app.delete('/api/students/bulk-delete', async (req, res) => {
    // The IDs are passed in the request body from the Angular service
    const { ids } = req.body; 

    // 1. Validation Check
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Invalid bulk delete request: Missing IDs.' });
    }

    try {
        // 2. Perform Bulk Delete using Supabase
        // Deletes rows from the 'student' table where 'stud_id' is in the array of 'ids'.
        const { error } = await supabase
            .from('student') // 💡 Ensure 'student' matches your actual Supabase table name
            .delete() 
            .in('stud_id', ids); // The .in() filter targets all rows matching the array of IDs

        if (error) {
            console.error('Supabase Error during bulk delete:', error);
            return res.status(500).json({ 
                message: 'Database failed to execute bulk delete.', 
                details: error.message 
            });
        }
        
        // 3. Success Response
        res.json({ 
            message: `Successfully deleted ${ids.length} students.`, 
            count: ids.length
        });

    } catch (error) {
        console.error('Server Error during bulk delete:', error);
        res.status(500).json({ message: 'Internal server error during bulk delete process.' });
    }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});