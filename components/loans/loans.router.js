const router = require('express').Router();
const loansController = require('./loans.controller');
const auth = require('../../middleware/auth')

router.get('/',loansController.getLoans);

router.post('/families/:idfamily',auth,loansController.addLoan);

router.put('/:idloans/families/:idfamily',auth, loansController.updateLoan);

router.delete('/:idloans/families/:idfamily',auth, loansController.deleteLoan);


module.exports = router;