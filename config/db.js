const { connect, connection} = require('mongoose');
const DB_URL = process.env.DB_URL;
const DB_OPTION = JSON.parse(process.env.DB_OPTION);

const connectToDB = async ()=>{
    try {
        await connect(DB_URL,DB_OPTION);
        console.log('Connection success')
    } catch (error) {
        console.error(error.message)
    }
    connection.on('connected',()=>{
        console.log('Mongoose connected to Cluster MongoDB');
    })
    .on('error',(error)=>{
        console.log(error);
    })
    .on('disconnected',()=>{
        console.log('Mongoose Disconnected');
    })
}
module.exports = connectToDB;