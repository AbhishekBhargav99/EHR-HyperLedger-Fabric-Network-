const connHosp1 = require('../dbs/dbHosp1Conn');
const connHosp2 = require('../dbs/dbHosp2Conn');
const connHosp3 = require('../dbs/dbHosp3Conn');
const connShared = require('../dbs/dbSharedConn');
const doctorSchema = require('./doctorSchema');
const patientSchema = require('./patientSchema');
const adminSchema = require('./adminSchema');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userSchema = require('../User');

const dotenv = require('dotenv');
const tokenSchema = require('./tokenSchema');
dotenv.config({path: './config.env'});

var doctorModels = [];
var adminModel = [];

// doctorSchema.pre('save', async function(next) {
//     if(!this.isModified('password')) return next();
    
//     try {
//         // let SALT_WORK_FACTOR = 12
//         // const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
//         this.password = await bcrypt.hash(this.password, 12);
//         return next();
//     } catch (err) {
//         return next(err);
//     }
// })


// we are generating token
// userSchema.method.generateAuthToken = async function (){
//     try{
//         let token = jwt.sign({_id: this._id}, process.env.SECRET);
//     } catch(err){
//         console.log(err.message);
//     }
// }

doctorModels['1'] = connHosp1.model('doctors', doctorSchema);
doctorModels['2'] = connHosp2.model('doctors', doctorSchema);
doctorModels['3'] = connHosp3.model('doctors', doctorSchema);

adminModel['1'] = connHosp1.model('admins', adminSchema);
adminModel['2'] = connHosp2.model('admins', adminSchema);
adminModel['3'] = connHosp3.model('admins', adminSchema);



var patientModel = connShared.model('patients', patientSchema); 
var tokenModel = connShared.model('Token', tokenSchema);
 

module.exports = { doctorModels, patientModel, adminModel, tokenModel};