const familiesController = {};
const familiesDAO = require('./families.dao');
const userDAO = require('../users/users.dao');

familiesController.getFamilies = async ( req, res)=>{
    try {
        const families = await familiesDAO.getFamilies();
        return res.status(200).json(families)

    } catch (error) {
        return res.status(500).send(error.message)
    }
}
familiesController.getFamily = async (req, res)=>{

}
familiesController.getMemberFamily = async (req, res)=>{
    
}
familiesController.createFamily = async ( req, res)=>{
    const { name } = req.body;
    const userId = req.userId;
    const familyQuery = { name, members:[userId],admins:[userId]};
    try {
        const newFamily = await familiesDAO.createFamily(familyQuery);
        return res.status(200).json(newFamily)
    } catch (error) {
        return res.status(500).send(error.message)
    }
    
}
familiesController.addMemberFamily = async (req, res)=>{
    const { members } = req.body;
    const idFamily = req.params.idfamily;
    const userId = req.userId;

    try {
        const existFamily = await familiesDAO.getFamilyById(idFamily);
        if(!existFamily)return res.status(404).json({message:"Family don't exist"});
        const isAdmin = existFamily.admins.some(memberId =>memberId.toString() === userId);
        if(!isAdmin) return res.status(400).json({message:"You aren't admin"});
        var membersIdArray=[];
        for await (let member of members){
            const existUserMember = await userDAO.getUserByUsername(member);
            if(!existUserMember) return res.status(404).json({message:`User ${member} don´t exist`})
            membersIdArray=[...membersIdArray,existUserMember._id.toString()];
        }
        const memberArray = [...new Set([...existFamily.members.map(e => e.toString()), ...membersIdArray])];
        const familyUpdate = await familiesDAO.updateFamilyById(idFamily,{members:[...memberArray]})
        return res.status(200).json(familyUpdate);
    } catch (error) {
        return res.status(500).send(error.message)
    }
}
familiesController.deleteMemberFamily = async (req, res)=>{

}
familiesController.addAdminFamily = async (req, res)=>{

}
familiesController.deleteAdminFamily = async (req, res)=>{

}
familiesController.deleteFamily = async (req, res)=>{

}

module.exports = familiesController;