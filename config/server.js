const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');


const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
if(process.env.NODE_ENV !== 'production'){
    dotenv.config();
    app.use(morgan('dev'));
}

app.use('/api/users/',require('../components/users/users.router'));
app.use('/api/families/',require('../components/families/families.router'));
app.use('/api/users/',require('../components/users/users.router'));

module.exports = app;
