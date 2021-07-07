const balancesModel = require('./balances.model');
const mongoose = require('mongoose');

balancesModel.statics.createBalance = async function(query){
    const instBalance = new this(query);
    const newBalance = await instBalance.save();
    return newBalance;
}
balancesModel.statics.getBalancesByFamilyId = async function(idfamily){
    const balances = await this.find({family: idfamily}).exec();
    return balances;
}


module.exports = mongoose.model('Balance',balancesModel);