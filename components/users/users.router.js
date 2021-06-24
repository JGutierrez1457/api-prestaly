const router = require('express').Router();
const usersController = require('./users.controller');

router.get('/',usersController.getUsers);

module.exports = router;