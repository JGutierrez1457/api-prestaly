const router = require('express').Router();
const usersController = require('./users.controller');

router.get('/',usersController.getUsers);
router.post('/',usersController.postUsers);

module.exports = router;