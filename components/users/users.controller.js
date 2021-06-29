const usersController = {};
const bcrypt = require('bcryptjs');
const usersDAO = require('./users.dao');
const jwt = require('jsonwebtoken');

usersController.getUsers = async( req, res)=>{
    try {
        const users = await usersDAO.getAllUsers();
        res.status(200).json(users)
    } catch (error) {
        res.status(500).send(error)
    }
}
usersController.updateUserUsername = async(req, res)=>{
    const { iduser } = req.params;
    const userId = req.userId;
    const { username } =req.body;
try {
    if(iduser!==userId)return res.status(400).send("Don't authorizate");
    const existUser = await usersDAO.getUserById(iduser);
    if(!existUser)return res.status(404).send("User don't exist");
    if(username.trim()==="")return res.status(400).send("Username invalid");
    const availableUsername = await usersDAO.getUserByUsername(username);
    if(availableUsername) return res.status(400).json({message:{serverity:"warning",text:"Username in use"}});
    const updatedUser = await usersDAO.editUser(userId,{username},{ new: true});
    const token = jwt.sign({username:updatedUser.username,id:updatedUser._id },'test',{expiresIn:'1h'});
    return res.status(200).json({result:{username: updatedUser.username,full_name:updatedUser.first_name+(updatedUser.last_name?(' '+updatedUser.last_name):('')), email: updatedUser?.email, families: updatedUser.families},token,message:{text:"User updated",serverity:"success"}})
} catch (error) {
    return res.status(500).send(error.message)
}

}
usersController.updateUserEmail = async(req, res)=>{
    const { iduser } = req.params;
    const userId = req.userId;
    const { email } = req.body;
    try {
        if(iduser!==userId)return res.status(400).send("Don't authorizate");
        const existUser = await usersDAO.getUserById(iduser);
        if(!existUser)return res.status(404).send("User don't exist");
        const updatedUser = await usersDAO.editUser(userId,{email},{ new: true});
        const token = jwt.sign({username:updatedUser.username,id:updatedUser._id },'test',{expiresIn:'1h'});
        return res.status(200).json({result:{username: updatedUser.username,full_name:updatedUser.first_name+(updatedUser.last_name?(' '+updatedUser.last_name):('')), email: updatedUser?.email, families: updatedUser.families},token,message:{text:"User updated",serverity:"success"}})
    } catch (error) {
        return res.status(500).send(error)
    
    }
}
usersController.updateUserPassword = async(req, res)=>{
    const { iduser } = req.params;
    const userId = req.userId;
    const { oldPassword, password, confirmPassword } = req.body;
    try {
        if(iduser!==userId)return res.status(400).send("Don't authorizate");
        const existUser = await usersDAO.getUserById(iduser);
        if(!existUser)return res.status(404).send("User don't exist");
        const isPassword = await bcrypt.compare(oldPassword,existUser.password);
        if(!isPassword)return res.status(400).json({message:{severity:'warning',text:'Incorrect Old Password.'}});
        if(password!==confirmPassword)return res.status(400).json({message:{severity:'warning',text:"Password don't match."}})

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatedUser = await usersDAO.editUser(userId,{password:hashedPassword},{ new: true});
        const token = jwt.sign({username:updatedUser.username,id:updatedUser._id },'test',{expiresIn:'1h'});
        return res.status(200).json({result:{username: updatedUser.username,full_name:updatedUser.first_name+(updatedUser.last_name?(' '+updatedUser.last_name):('')), email: updatedUser?.email, families: updatedUser.families},token,message:{text:"User updated",serverity:"success"}})
    } catch (error) {
        res.status(500).send(error)
    
    }
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