const usersModel = require('./users.model');
const mongoose = require('mongoose');

usersModel.statics.getUsers = async function(){

}
usersModel.statics.createUsers = async function( query ){
    const instUser = new this(query);
    const newUser = await instUser.save();
    return newUser;
}
module.exports = mongoose.model('User', usersModel)
