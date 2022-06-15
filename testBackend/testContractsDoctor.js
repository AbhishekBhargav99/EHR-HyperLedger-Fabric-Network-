const network = require('../patient-assets/application-javascript/app.js');

let doctorExistsinWallet = async function(doctorId){
    try{
        // checks whether it is present in the wallet
        const networkObj = await network.connectToNetwork(doctorId);
        // console.log(networkObj);
        if(networkObj.error)
            return false
        await networkObj.gateway.disconnect();
        return true;
        
    } catch(err){
        return false;
    }
}

let readPatient = async function(doctorId, patientId){
    let res = await doctorExistsinWallet(doctorId);
    console.log("doctor Exists --- > ", res);
    if(!res)
        return;

    const networkObj = await network.connectToNetwork(doctorId);
    // console.log(networkObj.error);
    const response = await network.invoke(networkObj, true, 'DoctorContract:readPatient', patientId);
    if(response.error){
        console.log(`Doctor access denied`);
        return;
    }
    console.log(JSON.parse(response.toString()));
    // after giving access
    // {
    //     patientId: 'PID0',
    //     firstName: 'Rahul',
    //     lastName: 'Mehra',
    //     age: '50',
    //     bloodGroup: 'O+',
    //     allergies: 'No',
    //     symptoms: 'Cholesterol, Total 250 mg/dl',
    //     diagnosis: 'Diabetes',
    //     treatment: 'Insulin 10 mg everyday',
    //     followUp: '6 Months'
    //   }
      
}

const updatePatientMedicalDetails = async function(doctorId){

    let patientId = "PID3"
    let res = await doctorExistsinWallet(patientId);
    console.log("patient --- > ", res);
    if(!res)
        return;
    let args = {
        patientId: patientId,
        symptoms: "Hish fever",
        diagnosis: "Malaria",
        treatment: "chloroquin",
        followUp: "2 weeks",
        changedBy: doctorId
    } 
    let data = [JSON.stringify(args)];

    const networkObj = await network.connectToNetwork(doctorId);
    const response = await network.invoke(networkObj, false, 'DoctorContract:updatePatientMedicalDetails', data);
    if(response.error){
        console.log(`Could not update ${patientId} medical details`);
        return;
    }

    // after updation
    // {
    //     patientId: 'PID0',
    //     firstName: 'Rahul',
    //     lastName: 'Mehra',
    //     age: '50',
    //     bloodGroup: 'O+',
    //     allergies: 'No',
    //     symptoms: 'Hish fever',
    //     diagnosis: 'Malaria',
    //     treatment: 'chloroquin',
    //     followUp: '2 weeks'
    //   }
      
    

}

const readAllPatients = async function(doctorId){
    let res = await doctorExistsinWallet(doctorId);
    console.log("doctor Exists --- > ", res);
    if(!res)
        return;

    const networkObj = await network.connectToNetwork(doctorId, 2);
    // console.log(networkObj.error);
    const response = await network.invoke(networkObj, true, 'DoctorContract:queryAllPatients', doctorId);
    if(response.error){
        console.log(`Could not access doctor`);
        return;
    }
    console.log(JSON.parse(response.toString()));

    // after giving acvcess from both patients
    // [
    //     {
    //       patientId: 'PID0',
    //       firstName: 'Rahul',
    //       lastName: 'Mehra',
    //       age: '50',
    //       bloodGroup: 'O+',
    //       allergies: 'No',
    //       symptoms: 'Cholesterol, Total 250 mg/dl',
    //       diagnosis: 'Diabetes',
    //       treatment: 'Insulin 10 mg everyday',
    //       followUp: '6 Months'
    //     },
    //     {
    //       patientId: 'PID1',
    //       firstName: 'Abhay',
    //       lastName: 'Chauhan',
    //       age: '60',
    //       bloodGroup: 'B+',
    //       allergies: 'No',
    //       symptoms: 'Heart Burn, shortness of breath, Acidity',
    //       diagnosis: 'Indigestion',
    //       treatment: 'Digestive enzyme 10 ml for 10 days',
    //       followUp: '2 Weeks'
    //     }
    //   ]
}

const readHistoryofPatient = async function(doctorId, patientId){
    let res = await doctorExistsinWallet(patientId);
    console.log("patient --- > ", res);
    if(!res)
        return;

    res = await doctorExistsinWallet(doctorId);
    console.log("doctor --- > ", res);
    if(!res)
        return;

    const networkObj = await network.connectToNetwork(doctorId, 3);
    // console.log(networkObj.error);
    const response = await network.invoke(networkObj, true, 'DoctorContract:getPatientHistory', patientId);
    if(response.error){
        console.log(`Doctor access denied`);
        return;
    }
    console.log(JSON.parse(response.toString()));

    // [
    //     {
    //       firstName: 'Rahul',
    //       lastName: 'Mehra',
    //       age: '50',
    //       bloodGroup: 'O+',
    //       allergies: 'No',
    //       symptoms: 'Hish fever',
    //       diagnosis: 'Malaria',
    //       treatment: 'chloroquin',
    //       followUp: '2 weeks',
    //       changedBy: 'HOSP1-DOC0',
    //       Timestamp: { seconds: [Object], nanos: 646000000 }
    //     },
    //     {
    //       firstName: 'Rahul',
    //       lastName: 'Mehra',
    //       age: '50',
    //       bloodGroup: 'O+',
    //       allergies: 'No',
    //       symptoms: 'Cholesterol, Total 250 mg/dl',
    //       diagnosis: 'Diabetes',
    //       treatment: 'Insulin 10 mg everyday',
    //       followUp: '6 Months',
    //       changedBy: 'PID0',
    //       Timestamp: { seconds: [Object], nanos: 180000000 }
    //     },
    //     {
    //       firstName: 'Rahul',
    //       lastName: 'Mehra',
    //       age: '50',
    //       bloodGroup: 'O+',
    //       allergies: 'No',
    //       symptoms: 'Cholesterol, Total 250 mg/dl',
    //       diagnosis: 'Diabetes',
    //       treatment: 'Insulin 10 mg everyday',
    //       followUp: '6 Months',
    //       changedBy: 'initLedger',
    //       Timestamp: { seconds: [Object], nanos: 737412589 }
    //     }
    //  ]
}

async function main(){
    // let res = await doctorExistsinWallet("HOSP1-DOC0");
    // console.log(res);
    // await readPatient("Doc-5", "PID3");
    // await readAllPatients("Doc-5")
    // await updatePatientMedicalDetails("Doc-5");
    // await readHistoryofPatient("Doc-5", "PID3");
}

main();