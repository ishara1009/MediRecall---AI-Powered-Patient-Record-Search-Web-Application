const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();
router.get('/doctors', publicController.getDoctors);
router.get('/doctors/:doctorId', publicController.getDoctor);

module.exports = router;
