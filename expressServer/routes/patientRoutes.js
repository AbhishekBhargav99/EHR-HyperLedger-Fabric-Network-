const express = require('express');
const router = express.Router();
const client = require('../../testBackend/redisUtils/client');
const jwt = require('jsonwebtoken');
const network = require('../../patient-assets/application-javascript/app.js');
const patientModel  = require('../models/allModels').patientModel;
const encrytLib = require('../middleware/encryptionlib');
const encrypt = encrytLib.encrypt;
const decrypt = encrytLib.decrypt;


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

function isEncrypted(patientId){
    if(patientId == 'PID1000xyz' || patientId == 'PID1001xyz')
        return false;
    return true;
}


router.get('/allDoctors', authenticateToken, async (req, res) => {
    const {hospitalid} = req.headers;
    const hospId = parseInt(hospitalid);

    if(req.userrole !== 'patient'){
        return res.sendStatus(400);
    }

    // console.log("Hospital Id : ", hospId);
    let userId = hospId === 1 ? 'hosp1admin' : hospId === 2 ? 'hosp2admin' : 'hosp3admin';
    const networkObj = await network.connectToNetwork(userId, hospId);
    const response = await network.getAllDoctorsByHospitalId(networkObj, hospId);
    // console.log(response);
    console.log(response);
    res.status(200).send(response);
})



router.get('/details', authenticateToken, async(req, res) => {


    if(req.userrole !== 'patient'){
        return res.sendStatus(400);
    }

    const {hospitalid, patientid} = req.headers;
    const hospId = parseInt(hospitalid);
    console.log(hospitalid, patientid);
    const args = patientid;
    const networkObj = await network.connectToNetwork(patientid, hospId);
    const response = await network.invoke(networkObj, true, 'PatientContract:getPatientPersonelDetails', args);
    const parsedRes = JSON.parse(response.toString())

    if(isEncrypted(parsedRes['patientId'])){
        for(let key in parsedRes){
            if(key != 'patientId' && key != 'permissionGranted'){
                parsedRes[key] = decrypt(parsedRes[key]);
            }
        }
    }
    
    try{
        
        let resp = await patientModel.findOne({patientId: patientid});
        parsedRes.email = resp.email;
        parsedRes.phoneNumber = resp.phoneNumber;
        parsedRes.weight = resp.weight;
        parsedRes.address = resp.address;
        res.status(200).send(parsedRes);
    }catch(err){
        console.log('err', err.message);
        return res.status(401).send({
                    status: false,
    })
    }
       
    
})

router.patch('/:hospitalId/:patientId/grant/:doctorId', authenticateToken, async (req, res) => {
    const { hospitalId, patientId, doctorId} = req.params;
    const hospId = parseInt(hospitalId);

    if(req.userrole !== 'patient'){
        return res.sendStatus(400);
    }

    let args = {
        patientId: patientId.trim(), 
        doctorId: doctorId.trim()
    };
    args = [JSON.stringify(args)];

    const networkObj = await network.connectToNetwork(patientId, hospId);
    const response = await network.invoke(networkObj, false, 'PatientContract:grantAccessToDoctor', args);
    console.log(response);
    
    if(response.error){
        return res.status(401).json({
            message: "Could not grant Request",
        })
    }
    let parsedResponse = response.toString()
    return res.status(200).send(parsedResponse)
})


router.patch('/:hospitalId/:patientId/revoke/:doctorId', authenticateToken, async (req, res) => {
    const { hospitalId, patientId, doctorId} = req.params;
    const hospId = parseInt(hospitalId);

    if(req.userrole !== 'patient'){
        return res.sendStatus(400);
    }
    // console.log(req.params);
    console.log(hospitalId, patientId, doctorId);

    let args = {
        patientId: patientId.trim(), 
        doctorId: doctorId.trim()
    };
    args = [JSON.stringify(args)];

    const networkObj = await network.connectToNetwork(patientId, hospId);
    const response = await network.invoke(networkObj, false, 'PatientContract:revokeAccessFromDoctor', args);
    
    if(response.error){
        res.status(401).json({
            message: "Could not grant Request",
        })
    }
    let parsedResponse = response.toString()
    res.status(200).send(parsedResponse)
})

router.get('/getHistory', authenticateToken, async(req, res) => {
    const {hospitalid, patientid} = req.headers;
    const hospId = parseInt(hospitalid);
    if(req.userrole !== 'patient'){
        return res.sendStatus(400);
    }
    console.log(hospId, patientid);
    const args = patientid;
    const networkObj = await network.connectToNetwork(patientid, hospId);
    const response = await network.invoke(networkObj, true, 'PatientContract:getPatientMedicalHistory', args);
    let parsedResponse = JSON.parse(response.toString());
    // console.log('rs : ', parsedResponse);
    for(let record of parsedResponse){
        if(parsedResponse[parsedResponse.length - 1]['changedBy'] !== 'initLedger'){
            for(let key in record){
                if(key == 'changedBy'){
                    record[key] = decrypt(record[key]);
                }
                if(key == 'medicalRecord'){
                    for(let k in record[key]){
                        record[key][k] = decrypt(record[key][k]);
                    }
                }
                if(key == 'imageUrls'){
                    let decryptedUrls = [];
                    for(let url of record[key]){
                        decryptedUrls.push(decrypt(url));
                    }
                    record[key] = decryptedUrls;
                }
            }
        }
    }
    console.log('parsed Res : ', parsedResponse);
    res.status(200).send(parsedResponse)
    // res.status(200).send({"msg" : "Hi there"});

})


router.patch('/updatePatient/:hospitalId/:patientId', authenticateToken,async( req, res) => {

    const {hospitalid, patientid} = req.headers;
    const hospId = parseInt(hospitalid);

    if(req.userrole !== 'patient'){
        return res.sendStatus(400);
    }

    console.log(patientid, hospitalid);
    try{
        
        let resp = await patientModel.findOne({patientId: patientid});
        console.log("resp :: ", resp);
        await patientModel.updateOne(
            {patientId: patientid}, 
            {   
                $set:{ 
                    email: req.body.email.trim(),
                    phoneNumber: req.body.phoneNumber.trim(),
                    address: req.body.address.trim(),
                    weight: req.body.weight.trim(),
                }
            }
        );
        return res.status(200).json({message: 'Patient Data Updated'});
    }catch(err){
        console.log('err', err.message);
        return res.status(401).send({
                    status: false,
                })
    }

    //######
    // console.log(hospId, patientid);
    // let args = {
    //     patientId : req.body.patientId,
    //     email: req.body.email,
    //     phoneNumber: req.body.phoneNumber,
    //     address: req.body.address,
    //     weight: req.body.weight,
    //     changedBy : patientid
    // };
    // args = [JSON.stringify(args)];
    // const networkObj = await network.connectToNetwork(patientid, hospId);
    // const response = await network.invoke(networkObj, false, 'PatientContract:updatePatientPersonalDetails', args);

    // if(response.error){
    //     return res.status(401).send({
    //         status: false,
    //     })
    // }

    // res.status(200).send({
    //     status: true,
    //     message: "SuccessFull"
    // })



})

module.exports = router

