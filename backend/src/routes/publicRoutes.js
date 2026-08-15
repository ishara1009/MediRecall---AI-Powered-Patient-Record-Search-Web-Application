const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();
const organizationController = require('../controllers/organizationController');
router.get('/doctors', publicController.getDoctors);
router.get('/doctors/:doctorId', publicController.getDoctor);
router.get('/departments', organizationController.listDepartments);

module.exports = router;
