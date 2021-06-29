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
usersController.updateUserUsername = async(req, res)=>{

}
usersController.updateUserEmail = async(req, res)=>{

}
usersController.updateUserPassword = async(req, res)=>{

}
usersController.deleteUser = async(req, res)=>{
const { iduser } = req.params;
const { password } = req.body;
const userId = req.userId;
try {
    if(iduser!==userId)return res.status(400).send("Don't authorizate");
    const existUser = await usersDAO.getUserById(iduser);
    if(!existUser)return res.status(404).send("User don't exist");
    const comparePassword = await bcrypt.compare(password,existUser.password);
    if(!comparePassword)return res.status(400).send("Credentials Incorrects");
    const userDeleted = await usersDAO.deleteUser(iduser);
    return res.status(200).send("User "+userDeleted.username+" deleted")
} catch (error) {
    res.status(500).send(error)
}

}


module.exports = usersController;