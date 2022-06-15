var Mongoose = require('mongoose').Mongoose;

const DBSHARED = process.env.DATABASE_SHARED;
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true,
}

var ins4 = new Mongoose();
ins4.connect(DBSHARED, connectionParams)
            .then( () => {
                    console.log('Connection Initialised to Cloud Shared DB');
            })
            .catch( err => {
                console.log(err);
            })


module.exports = ins4;
