const router = require('express').Router();
const familiesController = require('./families.controller');
const auth = require('../../middleware/auth');

router.get('/',auth,familiesController.getFamilies)
router.post('/',auth,familiesController.createFamily)
router.patch('/:idfamily',auth,familiesController.addMemberToFamily)


module.exports = router;