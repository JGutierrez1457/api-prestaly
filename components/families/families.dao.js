const familiesModel = require('./families.model');

familiesModel.statics.getFamilies = async function(){
    const families = await this.find();
    return families;
}
familiesModel.statics.createFamily = async function(query){
    const instFamily = new this(query);
    const newFamily = await instFamily.save();
    return newFamily;
}