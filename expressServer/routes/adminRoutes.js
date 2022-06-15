const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});
const encrytLib = require('../middleware/encryptionlib');
const encrypt = encrytLib.encrypt;
const decrypt = encrytLib.decrypt;

const patientModel = require('../models/allModels').patientModel;
const doctorModels = require('../models/allModels').doctorModels;

const network = require('../../patient-assets/application-javascript/app.js');

async function authenticateToken(req, res, next){
    const token = req.headers['accesstoken'];
    if(!token){
      return res.sendStatus(400);
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if(err){
        //   console.log(err);
        return res.sendStatus(400);
      }

      req.userrole = user.role;
      next();
    })
    
  }




router.get('/allPatients',authenticateToken, async (req, res) => {
   
    const {hospitalid, adminid} = req.headers;
    const hospId = parseInt(hospitalid);

    if(req.userrole !== 'admin'){
        return res.sendStatus(400);
    }

    const networkObj = await network. connectToNetwork(adminid, hospId);
    const response = await network.invoke(networkObj, true, 'AdminContract:queryAllPatients');

    const parsedResponse = await JSON.parse(response);
    // console.log("type : ", typeof(parsedResponse));
    let i = 0;
    for(let patient of parsedResponse){
        i++;
        if(i > 2 ){
            for(let key in patient){
                if(key != 'patientId'){
                    patient[key] = decrypt(patient[key])
                    // console.log('Key : ', key, ' Value : ', patient[key]);
                }
            }
        }
        try{
            const patientRes = await patientModel.findOne({patientId: patient.patientId});
            if(!patientRes) continue
            patient.phoneNumber = patientRes.phoneNumber;
            patient.email = patientRes.email;
            patient.address = patientRes.address;

        } catch(err){
            console.log(err.message);
            return res.status(500).json({error: 'Could not fetch Patient Data'});
           
        }
        
    }
    // console.log(parsedResponse);
    res.status(200).send(parsedResponse);
})

router.get('/allDoctors', authenticateToken, async (req, res) => {

    const {hospitalid, adminid} = req.headers;
    const hospId = parseInt(hospitalid);
    if(req.userrole !== 'admin'){
        return res.sendStatus(400);
    }
    // console.log(hospitalid, adminid);
    
    const networkObj = await network.connectToNetwork(adminid,hospId);
    const response = await network.getAllDoctorsByHospitalId(networkObj, hospId);
   
    res.status(200).send(response);
})

router.post('/newPatient', authenticateToken, async(req, res) => {

    const {hospitalid, adminid} = req.headers;
    const hospId = parseInt(hospitalid);
    if(req.userrole !== 'admin'){
        return res.sendStatus(400);
    }
    
    let networkObj = await network.connectToNetwork(adminid, hospId );
    let lastId = await network.invoke(networkObj, true, 'AdminContract:getLatestPatientId');
    lastId = lastId.toString().slice(3, 7)
    let patientId = 'PID' + ( parseInt(lastId) + 1) + (Math.random() + 1).toString(36).substring(8);
    let password = 'password';
    let data = {
        patientId: patientId,
        firstName: encrypt(req.body.firstName.trim()),
        lastName: encrypt(req.body.lastName.trim()),
        password: password.trim(),
        age: encrypt(req.body.age),
        gender: encrypt(req.body.gender.trim()),
        bloodGroup: encrypt(req.body.bloodGroup),
        changedBy: encrypt(adminid),
        permanentToken: 'token'
    }


    data = JSON.stringify(data);
    let argsData = [data];
    networkObj = await network.connectToNetwork(adminid, hospId);
    const createPatientRes = await network.invoke(networkObj, false, 'AdminContract:createPatient', argsData);

    if(createPatientRes.error){
        return res.status(401).json({error : 'Could Not add New Patient to Ledger'});
    }

    const userData = JSON.stringify({ 
        hospitalId: hospitalid,
        userId: patientId, 
        role: 'patient', 
        firstName: req.body.firstName.trim(),
        lastName: req.body.lastName.trim(),
    });
    const registerUserRes = await network.registerUser(userData);

    if(registerUserRes.error){
        return  res.status(402).json({error : 'Could Not add New Patient to Wallet'});
    }

    try{
        let dbData = {
            patientId: patientId,
            email: req.body.email.trim(),
            phoneNumber: req.body.phoneNumber.trim(),
            address: req.body.address.trim(),
            weight: req.body.weight.trim()
        }
        const patient = new patientModel(dbData);
        const registeredPatient = await patient.save();
        return res.status(201).json({
            status: true,
            patientId : registeredPatient.patientId,
            password: password,
            permanentToken: 'token'
        })

    } catch(err){
        console.log(err.message);
        return res.status(500).json({error: 'Failed to register'});
    }

   
})

router.post('/newDoctor', authenticateToken, async (req, res) => {

    const {hospitalid, adminid} = req.headers;
    const hospId = parseInt(hospitalid);

    if(req.userrole !== 'admin'){
        return res.sendStatus(400);
    }
    
    req.body.role = 'doctor';
    req.body.hospitalId = hospitalid;
    req.body.userId = req.body.userId.trim();
    req.body.email = req.body.email.trim();
    const docData = JSON.stringify(req.body);
    console.log(docData);
    let doctorId = req.body.userId.trim();

    try{
        const userExists = await network.doesUserExists(doctorId);
        if(userExists)
            return  res.status(409).json({message: 'User already Exists'});
    }
    catch(err){
        return res.status(500).json({error: 'Failed to register'});
    }
    


    const registerUserRes = await network.registerUser(docData);
    if(registerUserRes.error){
        console.log(registerUserRes);
        console.log("Doctor registration failed");
        return res.status(500).json({error: 'Failed to register'});
    }

    // await client.setRedisClientData(parseInt(hospId), req.body.id, JSON.stringify(data));
    try{
        const userExist = await doctorModels[hospitalid].findOne({doctorId: doctorId});
        
        if(userExist ){
            return res.status(422).json({error: 'User Already Present'});
        }
        let hashedPassword = await bcrypt.hash(("pass" + doctorId), 12);
        let docData = {
            doctorId: doctorId,
            email: req.body.email.trim(),
            password : hashedPassword
        }

        const doctor = new doctorModels[hospitalid](docData);
        const  registeredDoc = await doctor.save();
        
        return res.status(201).json({
            status: true,
            doctorId : registeredDoc.doctorId,
            password: ("pass" + doctorId),
        })

    } catch(err){
        console.log(err.message);
        return res.status(500).json({error: 'Failed to register'});
    }
    
    // console.log(registerUserRes);

    

})

module.exports = router;