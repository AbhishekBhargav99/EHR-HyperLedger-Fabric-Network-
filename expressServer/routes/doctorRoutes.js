const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const network = require('../../patient-assets/application-javascript/app.js')
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
    if(patientId === 'PID1000xyz' || patientId === 'PID1001xyz')
        return false;
    return true;
}

router.get('/allPermissionedPatients', authenticateToken, async(req, res) => {
    const {hospitalid, doctorid} = req.headers;
    console.log(hospitalid, doctorid);

    if(req.userrole !== 'doctor'){
        return res.sendStatus(400);
    }

    const hospId = parseInt(hospitalid);
    const networkObj = await network.connectToNetwork(doctorid, hospId);
    if(networkObj.error){
        return res.status(404).send({"message":"Doctor not present in hospital"})
    }
    const response = await network.invoke(networkObj, true, 'DoctorContract:queryAllPatients', doctorid);
    if(response.error){
        console.log(`Could not access doctor`);
        return res.status(404).send({"message":"Could Not Access the Patients"})
    }
    const parsedResponse = await JSON.parse(response)
    for(patient of parsedResponse ){
        console.log('id : ', patient['patientId']);
        if(isEncrypted( patient['patientId'])){
            for(key in patient){
                if(key != 'patientId'){
                    patient[key] = decrypt(patient[key]);
                }
            }
        }
        
    }
    res.status(200).send(parsedResponse);
})

router.patch('/:hospitalId/:doctorId/addRecords/:patientId', authenticateToken, async (req, res) => {
    const { hospitalId, doctorId, patientId } = req.params;
    let hospId = parseInt(hospitalId);

    if(req.userrole !== 'doctor'){
        return res.sendStatus(400);
    }

    let args = {
        patientId: patientId,
        reasonsForVisit: req.body.reasonsForVisit,
        allergies: req.body.allergies,
        symptoms: req.body.symptoms,
        diagnosis: req.body.diagnosis,
        treatment: req.body.treatment,
        followUp: req.body.followUp,
        notes: req.body.notes,
        medication: req.body.medication,
        changedBy : doctorId,
    }
    args= [JSON.stringify(args)];
    const networkObj = await network.connectToNetwork(doctorId, hospId);
    const response = await network.invoke(networkObj, false, 'DoctorContract:updatePatientMedicalDetails', args)
    if(response.error){
        return res.status(401).send("Could not add Patient Data");
    }
    res.status(200).send({
        status: true,
        messgae: "Success"
    });
})


router.patch('/:hospitalId/:doctorId/addRecs/:patientId', authenticateToken, async (req, res) => {
    const { hospitalId, doctorId, patientId } = req.params;
    let hospId = parseInt(hospitalId);

    if(req.userrole !== 'doctor'){
        return res.sendStatus(400);
    }
    


    let medRecs = req.body.medRecord;
    let imageUrls = req.body.imageUrls;
    let encryptedUrls = [];
    if(isEncrypted(patientId)){
        for(let url of imageUrls )
            encryptedUrls.push(encrypt(url));
    }
    else
        encryptedUrls = imageUrls;


    // console.log('medRecord : ', medRecs);
    // return res.status(200).send('HI');

    medRecords = {};
    for(let record of medRecs){
        let key = record.key.trim();
        let value = "";
        if(isEncrypted(patientId)){
            value = encrypt(record.value.trim());
        }
        else 
            value = (record.value.trim());
        
        medRecords[key] = value;
    }
    let args = {};
    args.medRecords = medRecords;
    args.patientId = patientId;
    if(isEncrypted(patientId)){
        args.changedBy = encrypt(doctorId);
    }
    else
        args.changedBy = doctorId;
    args.imageUrls = encryptedUrls;
    args= [JSON.stringify(args)];
    
    
    const networkObj = await network.connectToNetwork(doctorId, hospId);
    const response = await network.invoke(networkObj, false, 'DoctorContract:updatePatientMedicalDetails', args)
    if(response.error){
        return res.status(401).send("Could not add Patient Data");
    }
    res.status(200).send({
        status: true,
        messgae: "Success"
    });
})


router.get('/getMedicalHistory', authenticateToken, async(req, res) => {
    // return res.status(200).json({"hi" : "there"});

    if(req.userrole !== 'doctor'){
        return res.sendStatus(400);
    }

    const {hospitalid, doctorid, patientid} = req.headers;
    let hospId = parseInt(hospitalid);


    const networkObj = await network.connectToNetwork(doctorid, hospId);
    const response = await network.invoke(networkObj, true, 'DoctorContract:getPatientHistory', patientid);
    if(response.error){
        console.log(`Could not access patient Records`);
        return res.status(404).send({"message":"Could Not Access the Patient's Records"})
    }
    const parsedResponse = await JSON.parse(response)
    console.log('pa : ', parsedResponse)
    for(let record of parsedResponse){
        if(parsedResponse[parsedResponse.length - 1]['changedBy'] !== 'initLedger' ){
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
    
    res.status(200).json(parsedResponse);
})





module.exports = router;