const fs = require('fs');
const {registerUser} = require('../patient-assets/application-javascript/app')
const {enrollRegisterUser} = require('./regUsers');
const client = require('./redisUtils/client');



async function enrollPatients() {
    try {
        // returns buffer
        const buffer = fs.readFileSync('../patient-asset-transfer/chaincode/lib/initLedger.json');
        const patientData = JSON.parse(buffer);
        let hospId = '2';
        for(let i = 0; i < patientData.length; i++){
            let patient = patientData[i];
            const attr = {
                firstName: patient.firstName,
                lastName: patient.lastName, 
                role: 'patient',
                email: patient.email,
            }
            // console.log(attr);
            await enrollRegisterUser(hospId, patient.patientId, JSON.stringify(attr));
        }
        
    } catch (err) {
        console.log(err);
    }
};

async function enrollDocs(){
    try{
        const buffer = fs.readFileSync('./sampleDocs.json');
        const docData = JSON.parse(buffer);

        for(let i = 0; i < docData.length; i++){
            let doctor = docData[i];
            // console.log(doctor); 
            let hospId = (doctor.hospitalId)
            const attr = {
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                role: 'doctor',
                speciality: doctor.speciality,
                email: doctor.email,
            }

            let data = {
                email: doctor.email,
                password: ("pass" + doctor.id),
                hospitalId: hospId
            }
            await client.setRedisClientData(parseInt(hospId), doctor.id, JSON.stringify(data));
            await enrollRegisterUser(doctor.hospitalId, doctor.id , JSON.stringify(attr));

        }
    } catch(err){
        console.log(err);
    }
};

async function main(){
    await enrollPatients();
    await enrollDocs();
}

main();

