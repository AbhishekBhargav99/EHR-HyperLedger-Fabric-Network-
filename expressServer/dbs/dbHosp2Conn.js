var Mongoose = require('mongoose').Mongoose;
const DBHP2 = process.env.DATABASEHP2;
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true, 
}

var ins2 = new Mongoose();
ins2.connect(DBHP2, connectionParams)
            .then( () => {
                    console.log('Connection Initialised to Cloud Database 2');
            })
            .catch( err => {
                console.log(err);
            });

module.exports = ins2;

