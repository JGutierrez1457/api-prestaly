const mongoose = require('mongoose');
const loansModel = require('./loans.model');

loansModel.statics.getAllLoans = async function(){
    const allLoans = await this.find().exec();
    return allLoans;
}
loansModel.statics.createLoan = async function( query ){
    const instLoan = new this(query);
    const newLoan = await instLoan.save();
    return newLoan;
}

module.exports = mongoose.model('Loan', loansModel);