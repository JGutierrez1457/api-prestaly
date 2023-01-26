const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');


const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
const whiteList = ["https://prestaly.netlify.app"];
const corsOptions = {
    origin: function (origin, callback) {
        if (whiteList.indexOf(origin) !== -1) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      }
}
app.use(cors(corsOptions));
if(process.env.NODE_ENV !== 'production'){
    dotenv.config();
    app.use(morgan('dev'));
}

app.use('/api/auth/',require('../components/users/auth/auth.user.router'));
app.use('/api/users/',require('../components/users/users.router'));
app.use('/api/families/',require('../components/families/families.router'));
app.use('/api/loans/',require('../components/loans/loans.router'));
app.use('/api/balances/',require('../components/balances/balances.router'));

module.exports = app;
