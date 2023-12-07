/**
 *     Title: GPA- Graduation Planning App Project
 *     Purpose: The Graduation Planning App (GPA) is designed to assist students in 
 *              planning and tracking their academic progress towards graduation. It 
 *              aims to simplify course selection, monitor academic milestones, and 
 *              provide personalized recommendations for a smooth academic journey.
 *     Class: Software Engineering I, II, and Senior Capstone
 *     Academic Year: 2023 - 2024
 *     Author: Horizon Team
 */

const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(express.json());

// Define the route to initiate a scrape
app.get('/start-scrape/:taskId', async (req, res) => {
    const taskId = req.params.taskId;
    const scrapeStormAPI = `http://our-scrapestorm-ip:80/rest/v1/task/${taskId}/start`; // Replace with actually ip address for the scrapestorm

    try {
        const response = await axios.get(scrapeStormAPI);
        res.json(response.data);
    } catch (error) {
        console.error('Error starting ScrapeStorm task:', error);
        res.status(500).json({ message: 'Failed to initiate scrape' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
