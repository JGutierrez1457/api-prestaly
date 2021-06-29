const usersModel = require('./users.model');
const mongoose = require('mongoose');

usersModel.statics.getAllUsers = async function(){
    const users = await this.find().exec();
    return users;
}
usersModel.statics.getUserByUsername = async function(username){
    const user = await this.findOne({username}).exec();
    return user;
}
usersModel.statics.getUserById = async function(_id){
    const user = await this.findById({_id}).exec();
    return user;
}
usersModel.statics.createUser = async function( query ){
    const instUser = new this(query);
    const newUser = await instUser.save();
    return newUser;
}
usersModel.statics.deleteUser = async function(_id){
    const deleteUser = await this.findByIdAndDelete({_id});
    return deleteUser;
}
module.exports = mongoose.model('User', usersModel)
