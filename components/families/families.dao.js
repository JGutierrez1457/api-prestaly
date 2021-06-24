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
familiesModel.statics.createFamily = async function(query){
    const instFamily = new this(query);
    const newFamily = await instFamily.save();
    return newFamily;
}
familiesModel.statics.updateFamilyById = async function(_id,query){
    const familyUpdated = await this.findByIdAndUpdate(_id,query, { new: true}).exec();
    return familyUpdated;
}
module.exports = mongoose.model('Family',familiesModel);