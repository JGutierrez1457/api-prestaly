const balancesModel = require('./balances.model');
const mongoose = require('mongoose');

balancesModel.statics.createBalance = async function(query){
    const instBalance = new this(query);
    const newBalance = await instBalance.save();
    return newBalance;
}
balancesModel.statics.getBalancesByFamilyIdPopulate = async function(idfamily){
    const balances = await this.find({family: idfamily}).select('-_id -updatedAt -__v')
                                .populate('creator','username first_name last_name email')
                                .populate('balance._id','-email -password -families -createdAt -updatedAt -__v')
                                .exec();
    return balances;
}
balancesModel.statics.getBalancesByIdPopulate = async function(_id){
    const balances = await this.findById(_id).select('-_id -updatedAt -__v')
                                .populate('creator','username first_name last_name email')
                                .populate('balance._id','-_id -email -password -families -createdAt -updatedAt -__v')
                                .exec();
    return balances;
}
balancesModel.statics.editBalanceById = async function(_id, query, options){
    const editedBalance = await this.findByIdAndUpdate(_id, query, options).exec();
    return editedBalance;
}


module.exports = mongoose.model('Balance',balancesModel);