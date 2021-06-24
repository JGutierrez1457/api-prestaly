const usersController = {};
const bcrypt = require('bcryptjs');
const usersDAO = require('./users.dao');

usersController.getUsers = async( req, res)=>{
    try {
        const users = await usersDAO.getAllUsers();
        res.status(200).json(users)
    } catch (error) {
        res.status(500).send(error)
    }
}

module.exports = usersController;