const network = require('../patient-assets/application-javascript/app.js');

// exports.invoke = async function (networkObj, isQuery, func, args = '')


const lastPatientId = async (adminId, hospId) => {
    let isValidated = await validateAdmin(adminId, hospId);
    if(!isValidated){
        let response = {};
        response.error = "Admin Validation Failed";
        return response;
    }
    let contract = 'AdminContract:getLatestPatientId';
    const networkObj = await network.connectToNetwork(adminId);
    const lastId = await network.invoke(networkObj, true, contract);
    // lastId --> buffer
    console.log("type : ", typeof(lastId.toString()));
    // const lastId = await network.invoke(netObj, true, 'AdminContract:getLatestPatientId');
    return (lastId.toString()) // -> PIDx
}



const readPatient = async (adminId, hospId) => {
    let isValidated = await validateAdmin(adminId, hospId);
    if(!isValidated){
        let response = {};
        response.error = "Admin Validation Failed";
        return response;
    }
    let contract = 'AdminContract:readPatient';
    let args = "PID0"
    const networkObj = await network.connectToNetwork(adminId);
    const patient = await network.invoke(networkObj, true, contract,args );
    console.log(patient);
    console.log(JSON.parse(patient.toString()));
    // {
    //     patientId: 'PID0',
    //     firstName: 'Rahul',
    //     lastName: 'Mehra',
    //     phoneNumber: '9469515437',
    //     emergPhoneNumber: '9469515437'
    // }
      
}

const queryAllPatient = async (adminId, hospId) => {
    let isValidated = await validateAdmin(adminId, hospId);
    if(!isValidated){
        let response = {};
        response.error = "Admin Validation Failed";
        return response;
    }
    let contract = 'AdminContract:queryAllPatients';
    let args = '';
    const networkObj = await network.connectToNetwork(adminId);
    const patient = await network.invoke(networkObj, true, contract,args );
    console.log(patient);
    console.log(JSON.parse(patient.toString()));   
    // [
    //     {
    //       patientId: 'PID0',
    //       firstName: 'Rahul',
    //       lastName: 'Mehra',
    //       phoneNumber: '9469515437',
    //       emergPhoneNumber: '9469515437'
    //     },
    //     {
    //       patientId: 'PID1',
    //       firstName: 'Abhay',
    //       lastName: 'Chauhan',
    //       phoneNumber: '9419123505',
    //       emergPhoneNumber: '9469515437'
    //     }
    //   ]
    // console.log("first patient : ", JSON.parse(patient.toString())[0]) -> first patient
      
}

const createPatient = async (adminId, hospId) => {
    let isValidated = await validateAdmin(adminId, hospId);
    // console.log("validation ---->>  ", isValidated);
    if(!isValidated){
        let response = {};
        response.error = "Admin Validation Failed";
        return response;
    } 
    console.log("----------------In create Patient--------------------");
    let lastId = await lastPatientId(adminId, hospId);
    let newId = 'PID' + (parseInt(lastId.slice(3)) + 1);
    // console.log("lasId : ", lastId);
    // newId = "PID10"
    // console.log("lastId", newId); // -> pidx+1
    let args = {
        patientId : newId,
        firstName : "Abhishek",
        lastName :"Bhargav", 
        email: "bhargavab720@gmail.com",
        password : "password",
        age : "20",
        phoneNumber : "7889963163",
        address : "Jammu, J&k, India",
        bloodGroup : "A+",
        changedBy : adminId,
    }
    const data = JSON.stringify(args);
    let argsData = [data];
    const networkObj = await network.connectToNetwork(adminId, hospId);
    const createPatientRes = await network.invoke(networkObj, false, 'AdminContract:createPatient', argsData);
    if (createPatientRes.error) {
        console.log("Error in creating patient");
        return false;
    }
    const userData = JSON.stringify({ 
        hospitalId: adminId.slice(4, 5),
        userId: newId, 
        role: 'patient', 
        firstName: args.firstName,
        lastName: args.lastName,
    });
    const registerUserRes = await network.registerUser(userData);
    if (registerUserRes.error) {
        await network.invoke(networkObj, false, 'AdminContract:deletePatient', [newId]);
        console.log("New Patient deleted from ledger");
        return false;
    }
    return true;

}

let createDoctor = async function (adminId, hospId){
    // let isValidated = await validateAdmin(adminId, hospId);
    // if(!isValidated){
    //     let response = {};
    //     response.error = "Admin Validation Failed";
    //     return response;
    // }
    const userData = JSON.stringify({ 
        userId: "Doc-5",
        hospitalId: "2",
        firstName: "Henry",
        lastName: "Kissinger",
        speciality: "ENT",
        email : "henry919@gmail.com"
    })
    const networkObj = await network.connectToNetwork(adminId, hospId);
    const registerUserRes = await network.registerUser(userData);
    if(registerUserRes.error){
        console.log("Error : ", registerUserRes.error);
        console.log("Doctor registration failed");
    }
} 


let getAllDocsByHospId = async function(adminId, hospId){
    let isValidated = await validateAdmin(adminId, hospId);
    if(!isValidated){
        let response = {};
        response.error = "Admin Validation Failed";
        return response;
    }
    const networkObj = await network.connectToNetwork(adminId,hospId);
    const res = await network.getAllDoctorsByHospitalId(networkObj, hospId);
    console.log("result ------ > ", res);
    return true;
}

let validateAdmin = async function(adminId, hospId){
    const networkObj = await network.connectToNetwork(adminId);
    const res = await network.validateAdminbyHospitalId(networkObj, hospId);
    if(res.error) 
        return false;
    else 
        return true;
    // console.log("validation : ", res);
    // true or  err = "UnAuthorized Access";
}

async function main(){
    // let res = await createPatient("hosp3admin", 3);
    // if(res){
    //     console.log("Successfull creation of patient");
    // } else {
    //     console.log("Patient could not be created succesfully")
    // }
    // await deletePatient('hosp1admin', 1)
    // await queryAllPatient('hosp3admin', 3);
    await createDoctor('hosp2admin', 2);
    // let res = await getAllDocsByHospId("hosp1admin", 1);
    // console.log(res);
    // await createPatient("hosp2admin", 2);
    // await getAdminHospitalId()
    // let res = await validateAdmin('hosp2admin', 3);
    // console.log(res);
}

main();