const router = require('express').Router();
const loansController = require('./loans.controller');

router.get('/',loansController.getLoans)


module.exports = router;