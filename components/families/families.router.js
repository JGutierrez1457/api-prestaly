const router = require('express').Router();
const familiesController = require('./families.controller');

router.get('/',familiesController.getFamilies)


module.exports = router;