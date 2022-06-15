var Mongoose = require('mongoose').Mongoose;

const DBHP3 = process.env.DATABASEHP3;
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true,
}

var ins3 = new Mongoose();
ins3.connect(DBHP3, connectionParams)
            .then( () => {
                    console.log('Connection Initialised to Cloud Database 3');
            })
            .catch( err => {
                console.log(err);
            })


module.exports = ins3;
