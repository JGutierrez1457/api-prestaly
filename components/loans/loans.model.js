const { Schema } = require('mongoose');
const loansModel = new Schema({
    family:{type: Schema.Types.ObjectId, ref : 'Family'},
    creator:{type: Schema.Types.ObjectId, ref : 'User'},
    quantity:{type: Number, required:true, unique:false, trim: true},
    spenders:[
        {
          _id:{type: Schema.Types.ObjectId, ref : 'User'} ,
          expense:{type: Number, required:true, unique:false, trim: true}
    }],
    beneficiaries:[
        {type: Schema.Types.ObjectId, ref : 'User'}
    ],
    own_products:[
        {
        _id:{type: Schema.Types.ObjectId, ref : 'User'},
        products:[
            {
                _id: false,
                name:{type:String, required:false, unique:false, trim:true},
                price:{type:Number, required:false, unique:false, trim:true},
                discount:{type:Number, required:false, unique:false, trim:true}
            }
        ]
    }
    ],
    exclude_products:[
        {
            _id:{type: Schema.Types.ObjectId, ref : 'User'},
            products:[
                {
                    _id: false,
                    name:{type:String, required:false, unique:false, trim:true},
                    price:{type:Number, required:false, unique:false, trim:true},
                    discount:{type:Number, required:false, unique:false, trim:true}
                }
            ]
        }
    ],
    image:[{type:String, required:false, unique:false, trim:true}],
    sub_balance:[
        {
            _id:{type: Schema.Types.ObjectId, ref : 'User'},
            amount:{type: Number, required:false, unique:false, trim:true}
        }
    ],
    balance:{type: Schema.Types.ObjectId, ref : 'Balance'},
},{timestamps: true})
module.exports = loansModel;