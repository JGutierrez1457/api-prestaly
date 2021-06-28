const { Schema } = require('mongoose');
const familiesModel = new Schema({
    name:{type:String, required:true, unique:false,trim:true},
    password:{type:String, required:true, unique:false,trim:true},
    members:[
        { type: Schema.Types.ObjectId, ref : 'User'}
    ],
    admins:[
        { type: Schema.Types.ObjectId, ref : 'User'}
    ],
    creator:{type: Schema.Types.ObjectId, ref : 'User'}
},{
    timestamps: true
})

module.exports = familiesModel;