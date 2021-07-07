const router = require('express').Router();
const loansController = require('./loans.controller');
const auth = require('../../middleware/auth');
const multer = require('multer');
const multerConfig = require('../../config/multer');

router.get('/',loansController.getLoans);
router.get('/:idloans/families/:idfamily',auth,loansController.getLoan);
router.get('/families/:idfamily',auth,loansController.getLoansFamily);

router.post('/families/:idfamily',auth,loansController.addLoan);
router.post('/:idloans/families/:idfamily/image',auth,multer(multerConfig).single("file"),loansController.putImages);

router.patch('/:idloans/families/:idfamily',auth, loansController.updateLoan);

router.delete('/:idloans/families/:idfamily',auth, loansController.deleteLoan);
router.delete('/:idloans/families/:idfamily/image/:key', auth, loansController.deleteImage);


module.exports = router;