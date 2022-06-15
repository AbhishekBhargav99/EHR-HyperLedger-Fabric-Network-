const network = require('../../patient-assets/application-javascript/app');
const patients = require('../../patient-asset-transfer/chaincode/lib/initLedger');
const doctors = require('../../testBackend/sampleDocs');
const { testTimeout } = require('../jest-config');

describe('Add New Patient', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });
    test('Should be able to add new Patients', async () => {
        let adminId = "hosp1admin";
        let hospitalId = 1;
        let networkObj = await network.connectToNetwork(adminId, hospitalId );
        let lastId = await network.invoke(networkObj, true, 'AdminContract:getLatestPatientId');
        lastId = lastId.toString().slice(3, 7)
        let patientId = 'PID' + ( parseInt(lastId) + 1) + (Math.random() + 1).toString(36).substring(8);
        let password = 'password';

        let data = {
            patientId: patientId,
            firstName: "Abhishek",
            lastName: "Bhargav",
            password: password,
            age: "25-03-2000",
            gender: "M",
            bloodGroup: "o+",
            changedBy: adminId,
            permanentToken: 'token'
        }
    
    
        data = JSON.stringify(data);
        let argsData = [data];
        networkObj = await network.connectToNetwork(adminId, hospitalId);
        const createPatientRes = await network.invoke(networkObj, false, 'AdminContract:createPatient', argsData);
        const userData = JSON.stringify({ 
            hospitalId: hospitalId,
            userId: patientId, 
            role: 'patient', 
            firstName: data.firstName,
            lastName: data.lastName,
        });
        const registerUserRes = await network.registerUser(userData);
        expect(registerUserRes).toEqual(`Successfully registered user: ${patientId}`)
    })

    test('should not be able to add patient as Admin Id Incorrect', async () => {
        let adminId = "hosp4admin";
        const networkObj = await network.connectToNetwork(adminId);
        expect(networkObj.error).toEqual(`An identity for the user ${adminId} does not exist in the wallet. Register ${adminId} first`);
    })
});


describe('Add new Doctor', () => {
    test('should be able to add new Doctor', async () => {
        let adminId = 'hosp1admin';
        let hospitalId = 1;
        let data = {
            userId: "Doc-20",
            role: 'Doctor',
            firstName: "Ayush",
            lastName: "Raina",
            hospitalId: JSON.stringify(hospitalId),
            email: "20jerry98@gmail.com",
            speciality: "Neurology"
        }
        const docData = JSON.stringify(data);
        const registerUserRes = await network.registerUser(docData);
        expect(registerUserRes).toEqual(`Successfully registered user: ${data.userId}`)
    })
})

describe('Retreive Data', () => {
    test('should be able to get all the History of all Patients with limited Fields', async () => {
        let adminId = 'hosp1admin';
        let hospitalId = 1;
        const networkObj = await network. connectToNetwork(adminId, hospitalId);
        const response = await network.invoke(networkObj, true, 'AdminContract:queryAllPatients');
        const parsedResponse = await JSON.parse(response);
        expect(parsedResponse[0].patientId).toEqual('PID1000xyz');
        expect(parsedResponse[1].patientId).toEqual('PID1001xyz');
    })

    test('should be able to retrieve all Doctors of the Hospital', async () => {
        let adminId = 'hosp1admin';
        let hospitalId = 1;
        const networkObj = await network.connectToNetwork(adminId, hospitalId);
        const response = await network.getAllDoctorsByHospitalId(networkObj, hospitalId);
        expect(response[0].id).toEqual('Doc-1');
        expect(response[1].id).toEqual('Doc-2');
    })
})

describe('should be able to read all the patients registered', () => {

    test('view all Patients by limited Fields', async () => {
        let adminId = 'hosp1admin';
        let hospitalId = 1;
        const networkObj = await network. connectToNetwork(adminId, hospitalId);
        const response = await network.invoke(networkObj, true, 'AdminContract:queryAllPatients');
        const parsedResponse = await JSON.parse(response);
        expect(parsedResponse.length).not.toEqual(0);
        expect(parsedResponse[0].patientId).toEqual(patients[0].patientId);
        expect(parsedResponse[0].firstName).toEqual(patients[0].firstName);
        expect(parsedResponse[0].lastName).toEqual(patients[0].lastName);
    })
    
})