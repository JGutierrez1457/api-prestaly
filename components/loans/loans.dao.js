const mongoose = require('mongoose');
const loansModel = require('./loans.model');

loansModel.statics.getAllLoans = async function(){
    const allLoans = await this.find().exec();
    return allLoans;
}
loansModel.statics.getLoanById = async function(_id){
    const loan = await this.findById(_id).exec();
    return loan;
}
loansModel.statics.getLoanByIdPopulate = async function(_id){
    const loan = await this.findById(_id)
                                .populate('family','-_id name')
                                .populate('creator','-_id username')
                                .populate('spenders._id','-_id username')
                                .populate('beneficiaries','-_id username')
                                .populate('own_products._id','-_id username')
                                .populate('exclude_products._id','-_id username')
                                .populate('sub_balance._id','-_id username')
                                .exec();
    return loan;
}
loansModel.statics.createLoan = async function( query ){
    const instLoan = new this(query);
    const newLoan = await instLoan.save();
    return newLoan;
}
loansModel.statics.updateLoanById = async function(_id, query, options){
    const updatedLoan = await this.findByIdAndUpdate(_id, query, options).exec();
    return updatedLoan;
}
loansModel.statics.deleteLoanById = async function(_id){
    const deletedLoan = await this.findByIdAndDelete(_id).exec();
    return deletedLoan;
}

module.exports = mongoose.model('Loan', loansModel);