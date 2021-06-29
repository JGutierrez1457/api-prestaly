const router = require('express').Router();
const usersController = require('./users.controller');
const auth = require('../../middleware/auth')

router.get('/',usersController.getUsers);

router.patch('/:iduser/edit/username',auth,usersController.updateUserUsername);
router.patch('/:iduser/edit/email',auth,usersController.updateUserEmail);
router.patch('/:iduser/edit/password',auth,usersController.updateUserPassword);

router.delete('/:iduser',auth,usersController.deleteUser);

module.exports = router;