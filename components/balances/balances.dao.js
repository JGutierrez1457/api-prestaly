const balancesModel = require('./balances.model');
const mongoose = require('mongoose');


module.exports = mongoose.model('Balance',balancesModel);