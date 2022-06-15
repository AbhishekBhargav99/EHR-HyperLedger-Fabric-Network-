var Mongoose = require('mongoose').Mongoose;
const DBHP1 = process.env.DATABASEHP1;
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true
}

var ins1 = new Mongoose();
ins1.connect(DBHP1, connectionParams)
            .then( () => {
                    console.log('Connection Initialised to Cloud Database 1');
            })
            .catch( err => {
                console.log(err);
            });
module.exports = ins1;

