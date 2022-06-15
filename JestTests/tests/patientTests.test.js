const network = require('../../patient-assets/application-javascript/app');
const patients = require('../../patient-asset-transfer/chaincode/lib/initLedger');
const doctors = require('../../testBackend/sampleDocs');


describe("Connecting To Network", () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    test('should connect to network By Patient Id ', async () => {
        let patientId = "PID1000xyz";
        const networkObj = await network.connectToNetwork(patientId);
        expect(networkObj).toHaveProperty('contract');
        expect(networkObj).toHaveProperty('network');
        expect(networkObj).toHaveProperty('gateway');
        expect(networkObj.error).toBeUndefined();
    });

    test('should connect to network By Doctor Id ', async () => {
        let patientId = "Doc-1";
        const networkObj = await network.connectToNetwork(patientId);
        expect(networkObj).toHaveProperty('contract');
        expect(networkObj).toHaveProperty('network');
        expect(networkObj).toHaveProperty('gateway');
        expect(networkObj.error).toBeUndefined();
    });
    test('should connect to network By Admin Id ', async () => {
        let patientId = "hosp1admin";
        const networkObj = await network.connectToNetwork(patientId);
        expect(networkObj).toHaveProperty('contract');
        expect(networkObj).toHaveProperty('network');
        expect(networkObj).toHaveProperty('gateway');
        expect(networkObj.error).toBeUndefined();
    });

    test('should not read Patient for wrong Id', async () => {
        let patientId = "PID1003xyz";
        const networkObj = await network.connectToNetwork(patientId);
        expect(networkObj.error).toEqual(`An identity for the user ${patientId} does not exist in the wallet. Register ${patientId} first`);
    })
})

describe('Read Patient Personnel Information', () => {
    test('should Read personel Information Based on correct Patient Id', async () => {
        
        const patient = patients[0];
        const networkObj = await network.connectToNetwork(patient.patientId);
        const response = await network.invoke(networkObj, true, 'PatientContract:getPatientPersonelDetails', patient.patientId);
        const parsedRes = JSON.parse(response.toString());
        expect(parsedRes.patientId).toEqual(patient.patientId);
        expect(parsedRes.firstName).toEqual(patient.firstName);
        expect(parsedRes.lastName).toEqual(patient.lastName);
    });

    test('should not Read personel Information Based on incorrect Patient Id', async () => {
        let patientId = "PID1003xyz";
        const networkObj = await network.connectToNetwork(patientId);
        expect(networkObj.error).toEqual(`An identity for the user ${patientId} does not exist in the wallet. Register ${patientId} first`);
        
    });
});

describe('Grant and Revoke Permissions from Doctors', () => {
    test('Grant Permissions to Doctor',async () => {
        let doctorId = doctors[0].id;
        let patientId = patients[0].patientId;
        let args = {
            patientId: patientId,
            doctorId: doctorId
        };
        let passingArgs = [JSON.stringify(args)];
        let networkObj = await network.connectToNetwork(patientId);
        const response = await network.invoke(networkObj, false, 'PatientContract:grantAccessToDoctor', passingArgs);
        let parsedResponse = response.toString();
        expect(parsedResponse).toContain(doctorId)

    })

    test('Add Medical Record by Doctor', async () => {
        let doctorId = doctors[0].id;
        let patientId = patients[0].patientId;
        let hospitalId = 1;
        let medRecords = {
            reasonForVisit: 'High Fever',
            temperature: '102 F'
        };
        let args = {
            patientId : patientId,
            changedBy: doctorId,
            medRecords: medRecords
        };
        args = [JSON.stringify(args)];
        const networkObj = await network.connectToNetwork(doctorId, hospitalId);
        const response = await network.invoke(networkObj, false, 'DoctorContract:updatePatientMedicalDetails', args)
        console.log('Response :: ----------------------------', response);
    })

    test('Revoke Permissions from Doctor',async () => {
        let doctorId = doctors[0].id;
        let patientId = patients[0].patientId;
        let args = {
            patientId:  patientId,
            doctorId: doctorId
        };
        args = [JSON.stringify(args)];
        const networkObj = await network.connectToNetwork(patientId);
        const response = await network.invoke(networkObj, false, 'PatientContract:revokeAccessFromDoctor', args);
        let parsedResponse = response.toString();
        expect(parsedResponse).not.toContain(doctorId)

    })
})