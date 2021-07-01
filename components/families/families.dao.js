const familiesModel = require('./families.model');
const mongoose = require('mongoose');

familiesModel.statics.getFamilies = async function(){
    const families = await this.find()
                                .exec();
    return families;
}
familiesModel.statics.getFamilyById = async function(_id){
    const family = await this.findById({_id}).exec();
    return family;
}
familiesModel.statics.getFamilyByIdPopulateAdminCreator = async function(_id){
    const family = await this.findById({_id})
                                .populate('admins','username first_name last_name email')
                                .populate('creator','username first_name last_name email')
                                .exec();
    return family;
}
familiesModel.statics.getFamilyByIdPopulateMembers = async function(_id){
    const family = await this.findById({_id})
                                .populate('members','username first_name last_name email')
                                .exec();
    return family;
}
familiesModel.statics.createFamily = async function(query){
    const instFamily = new this(query);
    const newFamily = await instFamily.save();
    return newFamily;
}
familiesModel.statics.updateFamilyById = async function(_id,query, options){
    const familyUpdated = await this.findByIdAndUpdate(_id,query,  options).exec();
    return familyUpdated;
}
familiesModel.statics.deleteFamilyById = async function(_id,options){
    const familyDeleted = await this.findByIdAndDelete(_id,options).exec();
    return familyDeleted;
}
module.exports = mongoose.model('Family',familiesModel);