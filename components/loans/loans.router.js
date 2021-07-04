const router = require('express').Router();
const loansController = require('./loans.controller');
const auth = require('../../middleware/auth')

router.get('/',loansController.getLoans);
router.get('/:idloans/families/:idfamily',auth,loansController.getLoan);

router.post('/families/:idfamily',auth,loansController.addLoan);

router.patch('/:idloans/families/:idfamily',auth, loansController.updateLoan);

router.delete('/:idloans/families/:idfamily',auth, loansController.deleteLoan);


module.exports = router;