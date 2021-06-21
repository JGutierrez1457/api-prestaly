const usersController = {};

usersController.getUsers = async( req, res)=>{
    res.status(200).json({message:'Listing Users'})
}
usersController.postUsers = async(req, res)=>{
    
}

module.exports = usersController;