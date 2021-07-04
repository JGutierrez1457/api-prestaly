const { Schema} = require('mongoose');
const balancesModel = new Schema({
    family:{type: Schema.Types.ObjectId, ref : 'Family'},
    creator:{type: Schema.Types.ObjectId, ref : 'User'},
    balance:[
        {
            _id:{type: Schema.Types.ObjectId, ref : 'User'},
            amount:{type:Number, required:false, unique:false, trim:true}
        }
    ]
})
module.exports = balancesModel;