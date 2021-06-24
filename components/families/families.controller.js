const familiesController = {};
const familiesDAO = require('./families.dao');

familiesController.getFamilies = async ( req, res)=>{}
familiesController.createFamily = async ( req, res)=>{
    const { name } = req.body;
    
}

module.exports = familiesController;