const app = require('./config/server');
const db = require('./config/db');

db();
app.listen(process.env.PORT || 3000, ()=>{
    console.log('Server listening to port '+ (process.env.PORT || 3000))
})