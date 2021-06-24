const router = require('express').Router();
const authUserController = require('./auth.user.controller');

router.post('/signin',authUserController.signIn);
router.post('/signup',authUserController.signUp);

module.exports = router;