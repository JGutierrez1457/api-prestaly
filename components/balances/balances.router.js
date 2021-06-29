const router = require('express').Router();
const balancesController = require('./balances.controller');
const auth = require('../../middleware/auth');

router.get('/families/:idfamily',auth,balancesController.getBalances);

router.post('/families/:idfamily',auth,balancesController.generateBalance);

module.exports = router;