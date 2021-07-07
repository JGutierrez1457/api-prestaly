const usersController = {};
const bcrypt = require('bcryptjs');
const usersDAO = require('./users.dao');
const familiesDAO = require('../families/families.dao');
const loansDAO = require('../loans/loans.dao');
const jwt = require('jsonwebtoken');
const aws = require('aws-sdk');
const s3 = new aws.S3();

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
    const availableUsername = await usersDAO.getUserByCondition({username});
    if(availableUsername) return res.status(400).json({message:{serverity:"warning",text:"Username in use"}});
    const updatedUser = await usersDAO.editUserById(userId,{username},{ new: true});
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
        const updatedUser = await usersDAO.editUserById(userId,{email},{ new: true});
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

        const updatedUser = await usersDAO.editUserById(userId,{password:hashedPassword},{ new: true});
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
        const families = userDeleted.families;
        var deletedFamilies = [];
        for( let family of families){
            let updatedFamily = await familiesDAO.updateFamilyById(family._id,{$pull : { members : existUser._id  }}  ,{new: true});
            if(updatedFamily.members.length === 0){
                const deletedFamily = await familiesDAO.deleteFamilyById(family._id,null);
                const loansDeleted = await loansDAO.getLoansByFamilyId(idFamily);
                await loansDAO.deleteLoanByIdFamily(idFamily,null);
                for( let loan of loansDeleted){
                    const images = loan.images;
                    for( let image of images){
                        await s3.deleteObject({
                                Bucket: process.env.S3_BUCKET,
                                Key: image.key
                        }).promise()
                    }
                }
                deletedFamilies = [ ...deletedFamilies, deletedFamily.name];
                continue;
            }
            const isAdmin = updatedFamily.admins.some( admin => admin.toString() === existUser._id.toString());
            if(isAdmin){
                updatedFamily = await familiesDAO.updateFamilyById(family._id,{$pull : { admins : existUser._id  }}  ,{new: true});
            }
            const isCreator = updatedFamily.creator.toString() === existUser._id.toString();
            if(isCreator){
                if(updatedFamily.admins.length > 0){
                    updatedFamily = await familiesDAO
                                    .updateFamilyById(family._id, { creator: updatedFamily.admins[0] }, {new :true});
                }else{
                    updatedFamily = await familiesDAO
                                    .updateFamilyById(family._id, { creator: updatedFamily.members[0], $addToSet:{admins: updatedFamily.members[0] } }, {new :true});
                }
            }
        }
        return res.status(200).send(`User ${userDeleted.username} deleted${(deletedFamilies.length > 0)?` and families ${deletedFamilies.toString()} were deleted`:''}`)
    } catch (error) {
        res.status(500).send(error.message)
    }

}


module.exports = usersController;