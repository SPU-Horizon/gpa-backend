import express from 'express';

export const router = express.Router();

router.put('/register', (req, res) => { 
    res.send('Registered');
});
