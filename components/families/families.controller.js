const familiesController = {};
const familiesDAO = require('./families.dao');
const userDAO = require('../users/users.dao');
const bcrypt = require('bcryptjs');

familiesController.getFamilies = async ( req, res)=>{
    try {
        const families = await familiesDAO.getFamilies();
        return res.status(200).json(families)

    } catch (error) {
        return res.status(500).send(error.message)
    }
}
familiesController.getFamily = async (req, res)=>{
    const { idfamily } = req.params;
    const userId = req.userId;
    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateAdminCreator(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});

        const userIsMember = existFamily.members.some(memberId => memberId.toString() === userId);
        if(!userIsMember) return res.status(400).json({message:"User is not member"});

        return res.status(200).json({name: existFamily.name, admins: existFamily.admins, creator: existFamily.creator});

    } catch (error) {
        return res.status(500).send(error.message)
    }
}
familiesController.getMembersFamily = async (req, res)=>{
    const { idfamily } = req.params;
    const userId = req.userId;
    try {
        const existFamily = await familiesDAO.getFamilyByIdPopulateMembers(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});

        const userIsMember = existFamily.members.some(memberId => memberId._id.toString() === userId);
        if(!userIsMember) return res.status(400).json({message:"User is not member"});

        return res.status(200).json(existFamily.members);

    } catch (error) {
        return res.status(500).send(error.message)
    }
}
familiesController.createFamily = async ( req, res)=>{
    const { name, password, confirmPassword } = req.body;
    const userId = req.userId;
    if(password!==confirmPassword)return res.status(400).json({message:{severity:'warning',text:"Password don't match."}});
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const familyQuery = { name,password:hashedPassword, members:[userId],admins:[userId],creator:userId};
    try {
        const newFamily = await familiesDAO.createFamily(familyQuery);
        await userDAO.editUserById(userId,{$addToSet:{ families: {_id:newFamily._id, name: newFamily.name}}},{ new: true});
        return res.status(200).json(newFamily)
    } catch (error) {
        return res.status(500).send(error.message)
    }
    
}
familiesController.addMemberFamily = async (req, res)=>{
    const { idfamily, username } = req.params;
    const userId = req.userId;

    try {

        const existFamily = await familiesDAO.getFamilyById(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});
        const isAdmin = existFamily.admins.some(memberId =>memberId.toString() === userId);
        if(!isAdmin) return res.status(400).json({message:"You aren't admin"});
        const existUsername = await userDAO.getUserByCondition({username});
        if(!existUsername) return res.status(404).json({message:`User ${username} don´t exist`});

        const familyUpdate = await familiesDAO.updateFamilyById(idfamily,{$addToSet:{members: existUsername._id}}, { new: true});
        await userDAO.editUserById(existUsername._id,{$addToSet:{ families: {_id:familyUpdate._id, name: familyUpdate.name}}},{ new: true});
        return res.status(200).json(familyUpdate);
    } catch (error) {
        return res.status(500).send(error.message)
    }
}
familiesController.deleteMemberFamily = async (req, res)=>{
    const { idfamily, username } = req.params;
    const userId = req.userId;
    try {
        const existFamily = await familiesDAO.getFamilyById(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});
        const agentIsAdmin = existFamily.admins.some(memberId =>memberId.toString() === userId);
        const existUsername = await userDAO.getUserByCondition({username});
        if(!existUsername) return res.status(404).json({message:`User ${username} don't exist`});
        const userIsMember = existFamily.members.some(memberId => memberId.toString() === existUsername._id.toString());
        if(!userIsMember) return res.status(400).json({message:"Username is not member"});
        const isHe = existUsername._id.toString() === userId;
        const userIsCreator = existFamily.creator.toString() === existUsername._id.toString();
        const userIsAdmin = existFamily.admins.some(memberId =>memberId.toString() === existUsername._id.toString());
        if( !agentIsAdmin && !isHe )return res.status(400).json({message:"No authorizate"});
        if( userIsCreator && !isHe )return res.status(400).json({message:"Cannot delete the creator"});
        var updatedFamily = await familiesDAO
                                .updateFamilyById(idfamily, { $pull: { members : existUsername._id }}, {new :true});
        const updatedUser = await userDAO.editUserById(existUsername._id,{ $pull: { families : { _id : idfamily }}}, {new : true} );
        if(userIsAdmin){
            updatedFamily = await familiesDAO
                                .updateFamilyById(idfamily, { $pull: { admins : existUsername._id }}, {new :true});
        };
        if(updatedFamily.members.length === 0){
            const deletedFamily = await familiesDAO.deleteFamilyById(idfamily,null);
            return res.status(200).json({message: `Family ${deletedFamily.name} deleted because has no members`})
        }
        if(userIsCreator){
            if(updatedFamily.admins.length > 0){
                const newCreator = await userDAO.getUserById(updatedFamily.admins[0]);
                updatedFamily = await familiesDAO
                                .updateFamilyById(idfamily, { creator: updatedFamily.admins[0] }, {new :true});
                return res.status(200).json({message: `User ${updatedUser.username} deleted from ${updatedFamily.name} and now ${newCreator.username} is creator`})
            }else{
                const newCreator = await userDAO.getUserById(updatedFamily.members[0]);
                updatedFamily = await familiesDAO
                                .updateFamilyById(idfamily, { creator: updatedFamily.members[0], $addToSet:{admins: updatedFamily.members[0] } }, {new :true});
                return res.status(200).json({message: `User ${updatedUser.username} deleted from ${updatedFamily.name} and now ${newCreator.username} is creator`})
            }
        }
        return res.status(200).json({message: `User ${updatedUser.username} deleted from ${updatedFamily.name}`})
    } catch (error) {
        return res.status(500).send(error.message)
    }
}
familiesController.addAdminFamily = async (req, res)=>{
    const { idfamily, username } = req.params;
    const userId = req.userId;

    try {

        const existFamily = await familiesDAO.getFamilyById(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});
        const isAdmin = existFamily.admins.some(memberId =>memberId.toString() === userId);
        if(!isAdmin) return res.status(400).json({message:"You aren't admin"});
        const existUsername = await userDAO.getUserByCondition({username});
        if(!existUsername) return res.status(404).json({message:`User ${username} don't exist`});

        const isMember = existFamily.members.some(memberId => memberId.toString() === existUsername._id.toString());
        if(!isMember) return res.status(400).json({message:"Username is not member"});

        const usernameIsAdmin = existFamily.admins.some(memberId => memberId.toString() === existUsername._id.toString());
        if(usernameIsAdmin) return res.status(400).json({message:"Username is admin"});

        const familyUpdate = await familiesDAO.updateFamilyById(idfamily,{$addToSet:{admins: existUsername._id}}, { new: true});
        return res.status(200).json(familyUpdate);
    } catch (error) {
        return res.status(500).send(error.message)
    }
}
familiesController.deleteAdminFamily = async (req, res)=>{
    const { idfamily, username } = req.params;
    const userId = req.userId;
    try {
        const existFamily = await familiesDAO.getFamilyById(idfamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});
        const agentIsAdmin = existFamily.admins.some(memberId =>memberId.toString() === userId);
        const existUsername = await userDAO.getUserByCondition({username});
        if(!existUsername) return res.status(404).json({message:`User ${username} don't exist`});
        const userIsMember = existFamily.members.some(memberId => memberId.toString() === existUsername._id.toString());
        if(!userIsMember) return res.status(400).json({message:"Username is not member"});
        const isHe = existUsername._id.toString() === userId;
        const userIsCreator = existFamily.creator.toString() === existUsername._id.toString();
        const userIsAdmin = existFamily.admins.some(memberId =>memberId.toString() === existUsername._id.toString());
        if( !agentIsAdmin && !isHe )return res.status(400).json({message:"No authorizate"});
        if( userIsCreator && !isHe )return res.status(400).json({message:"Cannot remove admin from creator"});
        if( !userIsAdmin)return res.status(400).json({message:`${username} don't have admin`});
        if(existFamily.members.length === 1){
            return res.status(200).json({message: `You are the unique member and admin, maybe you need delete the family `})
        }
        var updatedFamily = await familiesDAO
                                .updateFamilyById(idfamily, { $pull: { admins : existUsername._id }}, {new :true});
       if(userIsCreator){
            if(updatedFamily.admins.length > 0){
                const newCreator = await userDAO.getUserById(updatedFamily.admins[0]);
                updatedFamily = await familiesDAO
                                .updateFamilyById(idfamily, { creator: updatedFamily.admins[0] }, {new :true});
                return res.status(200).json({message: `User ${username} removed admin from ${updatedFamily.name} and now ${newCreator.username} is creator`})
            }else{
                const newAdmin = updatedFamily.members.find( member => member.toString() !== existUsername._id.toString() )
                console.log(newAdmin)
                const newCreator = await userDAO.getUserById(newAdmin);
                updatedFamily = await familiesDAO
                                .updateFamilyById(idfamily, { creator: newAdmin, $addToSet:{admins: newAdmin } }, {new :true});
                return res.status(200).json({message: `User ${username} removed admin from ${updatedFamily.name} and now ${newCreator.username} is creator`})
            }
        }
        return res.status(200).json({message: `User ${username} removed admin from ${updatedFamily.name}`})
    }catch(error){
        return res.status(500).send(error.message)
    }
}
familiesController.deleteFamily = async (req, res)=>{
    const idFamily = req.params.idfamily;
    const userId = req.userId;
    const { password } = req.body;
    try {
        const existFamily = await familiesDAO.getFamilyById(idFamily);
        if(!existFamily)return res.status(404).send("Family don't exist");
        if(userId!==existFamily.creator.toString())return res.status(400).send("No authorizate");
        const comparePassword = await bcrypt.compare(password, existFamily.password);
        if(!comparePassword)return res.status(400).send("Credential Incorrect");
        const familyDeleted = await familiesDAO.deleteFamilyById(idFamily,null);
        await userDAO.editManyUser({ $pull: { families : { _id : familyDeleted._id }}},{ multi: true});
        return res.status(200).json({message:{severity:'success',text:`Family ${familyDeleted.name} deleted`}});
        
    } catch (error) {
        return res.status(500).send(error.message)
    }
}

module.exports = familiesController;