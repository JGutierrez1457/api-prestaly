const { Schema } = require('mongoose');
const usersModel = new Schema({
    username: { type: String, required: true, unique: true, trim: true },
    first_name: { type: String, required: true, unique: false, trim: true },
    last_name: { type: String, required: false, unique: false, trim: true },
    email: { type: String, required: false, unique: false, trim: true},
    password : { type: String, required: true, unique: false, trim: true},
    families : [ 
        { 
            _id: {type: Schema.Types.ObjectId ,ref: 'Family', required: false, unique: false},
            name:{ type:String, required:false, unique:false}
        }
    ]
},{timestamps: true})
module.exports = usersModel;