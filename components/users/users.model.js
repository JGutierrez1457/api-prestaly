const { Schema } = require('mongoose');
const userModel = new Schema({
    name: { type: String, required: true, unique: false, trim: true },
    email: { type: String, required: false, unique: false, trim: true},
    phone: { type: String, required: false, unique: false, trim: true},
    password : { type: String, required: true, unique: false, trim: true}
},{timestamps: true})
module.exports = usersModel;