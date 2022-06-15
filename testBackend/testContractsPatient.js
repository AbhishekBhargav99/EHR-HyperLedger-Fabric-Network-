const network = require('../patient-assets/application-javascript/app.js');

let patientExistsinWallet = async function(pId){
    try{
        // checks whether it is present in the wallet
        const networkObj = await network.connectToNetwork(pId);
        // console.log(networkObj);
        if(networkObj.error)
            return false
        await networkObj.gateway.disconnect();
        return true;
        
    } catch(err){
        return false;
    }
}

let getDocsByHospId = async function(hospId){
    if(hospId > 2 && hospId < 0) return;
    let adminId = 'hosp3admin';
    if(hospId != 3)
        adminId = hospId === 1 ? 'hosp1admin' : 'hosp2admin';
    const networkObj = await network.connectToNetwork(adminId, hospId);
    const res = await network.getAllDoctorsByHospitalId(networkObj, hospId);
    return res;
}

let getPatientById = async function(patientId){
    let res = await patientExistsinWallet(patientId);
    console.log("patient --- > ", res);
    if(!res)
        return;

    const networkObj = await network.connectToNetwork(patientId, 3);
    // console.log(networkObj.error);
    const response = await network.invoke(networkObj, true, 'PatientContract:readPatient', patientId);
    if(response.error){
        console.log(`Patient - ${patientId} does not exist`);
        return;
    }
    console.log(JSON.parse(response.toString()));
    // {
    //   patientId: 'PID0',
    //   firstName: 'Rahul',
    //   lastName: 'Mehra',
    //   age: '50',
    //   phoneNumber: '9469515437',
    //   emergPhoneNumber: '9469515437',
    //   address: 'Pune, Maharashtra',
    //   bloodGroup: 'O+',
    //   allergies: 'No',
    //   symptoms: 'Cholesterol, Total 250 mg/dl',
    //   diagnosis: 'Diabetes',
    //   treatment: 'Insulin 10 mg everyday',
    //   followUp: '6 Months',
    //   permissionGranted: [ 'hosp1admin', 'hosp2admin' ],
    //   password: 'ee6affdb08c3ef9c6444816329b56250ae42a2149b3e72136251a7d8340de43b',
    //   pwdTemp: false
    // }
}

let getPatientHistoryById = async function(patientId) {
    let res = await patientExistsinWallet(patientId);
    console.log("patient --- > ", res);
    if(!res)
        return;

    const networkObj = await network.connectToNetwork(patientId);
    // console.log(networkObj.error);
    const response = await network.invoke(networkObj, true, 'PatientContract:getPatientHistory', patientId);
    if(response.error){
        console.log(`Patient - ${patientId} does not exist`);
        return;
    }

    console.log( JSON.parse(response.toString()))
    
    // let obj = JSON.parse(response.toString())[0];

    // var utcSeconds = obj.Timestamp.seconds.low
    // var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
    // let tym = d.setUTCSeconds(utcSeconds);
    // console.log("result ", new Date(tym)); // result  2022-01-26T14:07:47.000Z

    // console.log(obj);
    // {
    //     firstName: 'Rahul',
    //     lastName: 'Mehra',
    //     age: '50',
    //     address: 'Pune, Maharashtra',
    //     phoneNumber: '9469515437',
    //     emergPhoneNumber: '9469515437',
    //     bloodGroup: 'O+',
    //     allergies: 'No',
    //     symptoms: 'Cholesterol, Total 250 mg/dl',
    //     diagnosis: 'Diabetes',
    //     treatment: 'Insulin 10 mg everyday',
    //     followUp: '6 Months',
    //     changedBy: 'initLedger',
    //     Timestamp: {
    //       seconds: { low: 1643206067, high: 0, unsigned: false },
    //       nanos: 71198127
    //     }
    // }
      
}

let listAllDocs = async function(){
    let hospIds = [1, 2, 3];
    let allDocs = [];
    try{
        for(id of hospIds){
            let tmp = await getDocsByHospId(id);
            allDocs.push(...tmp);
        }
        console.log(allDocs);
    }   catch(err){
        console.log("Enter valid Hospital Id");
    }
}

let grantAccessToDoctor = async function(patientId, doctorId){

    let res = await patientExistsinWallet(patientId);
    console.log("patient --- > ", res);
    if(!res)
        return;

    let args = {
        patientId: patientId, 
        doctorId: doctorId
    };
    args = [JSON.stringify(args)];
    const networkObj = await network.connectToNetwork(patientId, 2);
    const response = await network.invoke(networkObj, false, 'PatientContract:grantAccessToDoctor', args);
    if(response.error){
        console.log(`Patient - ${patientId} does not exist`);
        return;
    }

    // getPatientById
    // {
    //     patientId: 'PID0',
    //     firstName: 'Rahul',
    //     lastName: 'Mehra',
    //     age: '50',
    //     phoneNumber: '9469515437',
    //     emergPhoneNumber: '9469515437',
    //     address: 'Pune, Maharashtra',
    //     bloodGroup: 'O+',
    //     allergies: 'No',
    //     symptoms: 'Cholesterol, Total 250 mg/dl',
    //     diagnosis: 'Diabetes',
    //     treatment: 'Insulin 10 mg everyday',
    //     followUp: '6 Months',
    //     permissionGranted: [ 'hosp1admin', 'hosp2admin', 'HOSP1-DOC0' ],
    //     password: 'ee6affdb08c3ef9c6444816329b56250ae42a2149b3e72136251a7d8340de43b',
    //     pwdTemp: false
    // }  

}

let revokeAccessFromDoctor = async function(patientId, doctorId){

    let res = await patientExistsinWallet(patientId);
    console.log("patient --- > ", res);
    if(!res)
        return;

    let args = {
        patientId: patientId, 
        doctorId: doctorId
    };
    args = [JSON.stringify(args)];
    const networkObj = await network.connectToNetwork(patientId, 3);
    const response = await network.invoke(networkObj, false, 'PatientContract:revokeAccessFromDoctor', args);
    if(response.error){
        console.log("Could not revoke access");
        return;
    }

    // getPatientById
    // {
    //     patientId: 'PID0',
    //     firstName: 'Rahul',
    //     lastName: 'Mehra',
    //     age: '50',
    //     phoneNumber: '9469515437',
    //     emergPhoneNumber: '9469515437',
    //     address: 'Pune, Maharashtra',
    //     bloodGroup: 'O+',
    //     allergies: 'No',
    //     symptoms: 'Cholesterol, Total 250 mg/dl',
    //     diagnosis: 'Diabetes',
    //     treatment: 'Insulin 10 mg everyday',
    //     followUp: '6 Months',
    //     permissionGranted: [ 'hosp1admin', 'hosp2admin'],
    //     password: 'ee6affdb08c3ef9c6444816329b56250ae42a2149b3e72136251a7d8340de43b',
    //     pwdTemp: false
    // }  

}


let updatePatient = async function(){
    let patientId = "PID0"
    let res = await patientExistsinWallet(patientId);
    console.log("patient --- > ", res);
    if(!res)
        return;

    let args = {
        patientId: patientId,
        firstName: 'Rahul',
        lastName: 'Mehra',
        age: '50',
        phoneNumber: '11111111',
        emergPhoneNumber: '11111111',
        address: 'Pune, Maharashtra',
        allergies: "No",
        changedBy: patientId,
    } 
    let data = [JSON.stringify(args)];

    const networkObj = await network.connectToNetwork(patientId);
    const response = await network.invoke(networkObj, false, 'PatientContract:updatePatientPersonalDetails', data);
    if(response.error){
        console.log(`Patient - ${patientId} does not exist`);
        return;
    }

    // getPatientById
    // {
    //     patientId: 'PID0',
    //     firstName: 'Rahul',
    //     lastName: 'Mehra',
    //     age: '50',
    //     phoneNumber: '11111111',
    //     emergPhoneNumber: '11111111',
    //     address: 'Pune, Maharashtra',
    //     bloodGroup: 'O+',
    //     allergies: 'No',
    //     symptoms: 'Cholesterol, Total 250 mg/dl',
    //     diagnosis: 'Diabetes',
    //     treatment: 'Insulin 10 mg everyday',
    //     followUp: '6 Months',
    //     permissionGranted: [ 'hosp1admin', 'hosp2admin' ],
    //     password: 'ee6affdb08c3ef9c6444816329b56250ae42a2149b3e72136251a7d8340de43b',
    //     pwdTemp: false
    //   }

}








async function main(){
    await getPatientById("PID3");   
    // let res = await validatePatient("PID1");
    // console.log(res);
    // let res = validatePatient("PID")
    // await grantAccessToDoctor("PID3", "Doc-5")
    // await revokeAccessFromDoctor("PID3", "Doc-5")
    // await getPatientHistoryById("PID0");
    // await updatePatient();
    // await listAllDocs();
    
}

main();