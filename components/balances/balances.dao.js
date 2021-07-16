const balancesModel = require('./balances.model');
const mongoose = require('mongoose');

balancesModel.statics.createBalance = async function(query){
    const instBalance = new this(query);
    const newBalance = await instBalance.save();
    return newBalance;
}
balancesModel.statics.getBalancesByFamilyIdPopulate = async function(idfamily){
    const balances = await this.find({family: idfamily}).select('-_id -createdAt -updatedAt -__v')
                                .populate('balance._id','-_id -email -password -families -createdAt -updatedAt -__v')
                                .exec();
    return balances;
}
balancesModel.statics.getBalancesByIdPopulate = async function(_id){
    const balances = await this.find(_id).select('-_id -createdAt -updatedAt -__v')
                                .populate('balance._id','-_id -email -password -families -createdAt -updatedAt -__v')
                                .exec();
    return balances;
}


module.exports = mongoose.model('Balance',balancesModel);