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
usersModel.statics.createUser = async function( query ){
    const instUser = new this(query);
    const newUser = await instUser.save();
    return newUser;
}
module.exports = mongoose.model('User', usersModel)
