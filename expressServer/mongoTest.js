const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const bcrypt = require('bcrypt');
const fs = require('fs');

const doctorModels = require('./models/allModels').doctorModels;
const adminModel = require('./models/allModels').adminModel;
const patientModel = require('./models/allModels').patientModel;


const doctors = ('../testBackend/sampleDocs.json');
const patients = ('../patient-asset-transfer/chaincode/lib/initLedger.json');

let hospCred = {
    '1': {
        'adminId' : 'hosp1admin',
        'password': 'hosp1ehrNet'
    },
    '2': {
        'adminId' : 'hosp2admin',
        'password': 'hosp2ehrNet'
    },
    '3': {
        'adminId' : 'hosp3admin',
        'password': 'hosp3ehrNet'
    },
}


let hospitalIds = ['1', '2', '3'];

async function clearDoctorData() {
    try {
        for (ids of hospitalIds) {
            // console.log(ids);
            const data = await doctorModels[ids].deleteMany({});
            console.log(data);
        }


    } catch (err) {
        console.log(err.message);
    }
}

async function clearAdminData() {
    try {
        for (ids of hospitalIds) {
            const data = await adminModel[ids].deleteMany({});
            console.log(data);
        }

    } catch (err) {
        console.log(err.message);
    }
}

async function clearPatientData() {
    try {
        for (ids of hospitalIds) {
            const data = await patientModel.deleteMany({});
            console.log(data);
        }

    } catch (err) {
        console.log(err.message);
    }
}

async function addDoctors(){
    const buffer = fs.readFileSync(doctors);
    const docData = JSON.parse(buffer);
    for(let i = 0; i < docData.length; i++){
        let doctor = docData[i];
        const password = await bcrypt.hash(('pass'+ doctor.id), 12);
        // const password = 'pass'+doctor.id;
        let attr = {
            doctorId: doctor.id,
            email: doctor.email,
            password: password
        }
        let hospId = doctor.hospitalId
        let docRes = new doctorModels[hospId](attr);
        await docRes.save();
    }


}

async function addPatients(){
    const buffer = fs.readFileSync(patients);
    const patientData = JSON.parse(buffer);
    try{
        for(let i = 0; i < patientData.length; i++){
            let patient = patientData[i];
            const attr = {
                patientId: patient.patientId,
                email: patient.email, 
                phoneNumber: patient.phoneNumber,
                address: patient.address,
                weight: patient.weight
            }
            const patientRes = new patientModel(attr);
            const res = await patientRes.save();
        }
    } catch(err){
        console.log(err.message);
    }
    
}

async function addAdmin(){
    try{
        for(let ids in hospCred){
            // console.log(hospCred[ids].password);
            const password =  await bcrypt.hash(hospCred[ids].password, 12);
            let attrs = {
                adminId: hospCred[ids].adminId,
                password: password
            }
            const admin = new adminModel[ids](attrs);
            const res = await admin.save();
            console.log(res); 
        }
        
    }catch(err){
        console.log(err.message);
    }
}



async function main(){
    await clearDoctorData();
    await clearAdminData();
    await clearPatientData();
    await addDoctors();
    await addPatients()
    await addAdmin();
}

main();