const express = require('express');
const router = express.Router();

router.put('/register', (req, res) => { 
    res.send('Registered');
});




module.exports = router;