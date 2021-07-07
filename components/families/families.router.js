const router = require('express').Router();
const familiesController = require('./families.controller');
const auth = require('../../middleware/auth');

router.get('/',familiesController.getFamilies);
router.get('/:idfamily',auth,familiesController.getFamily);
router.get('/:idfamily/members',auth,familiesController.getMembersFamily);


router.post('/',auth,familiesController.createFamily);

router.patch('/:idfamily/members/:username/add',auth,familiesController.addMemberFamily);
router.patch('/:idfamily/members/:username/delete',auth,familiesController.deleteMemberFamily);
router.patch('/:idfamily/admins/:username/add',auth,familiesController.addAdminFamily);
router.patch('/:idfamily/admins/:username/delete',auth,familiesController.deleteAdminFamily);

router.delete('/:idfamily',auth,familiesController.deleteFamily)


module.exports = router;