const usersModel = require('./users.model');
const mongoose = require('mongoose');

usersModel.statics.getAllUsers = async function(){
    const users = await this.find()
                          /*.populate('families.family_id')*/
                            .exec();
    return users;
}
usersModel.statics.getUserByCondition = async function(query){
    const user = await this.findOne(query).exec();
    return user;
}
usersModel.statics.getUserById = async function(_id){
    const user = await this.findById(_id).exec();
    return user;
}
usersModel.statics.createUser = async function( query ){
    const instUser = new this(query);
    const newUser = await instUser.save();
    return newUser;
}
usersModel.statics.editUserById = async function( _id,query,options){
    const updatedUser = await this.findByIdAndUpdate(_id,query,options).exec();
    return updatedUser;
}
usersModel.statics.editManyUser = async function( query,options){
    const updatedUser = await this.updateMany({},query,options).exec();
    return updatedUser;
}
usersModel.statics.deleteUser = async function(_id){
    const deleteUser = await this.findByIdAndDelete({_id}).exec();
    return deleteUser;
}
module.exports = mongoose.model('User', usersModel)
