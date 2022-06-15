const network = require('../../patient-assets/application-javascript/app');
const patients = require('../../patient-asset-transfer/chaincode/lib/initLedger');
const doctors = require('../../testBackend/sampleDocs');

describe('Add New Medical Record', () => {

    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

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

    test('should be able to read Patient History', async () => {
        let doctorId = doctors[0].id;
        let patientId = patients[0].patientId;
        let hospitalId = 1;
        const networkObj = await network.connectToNetwork(doctorId, hospitalId);
        const response = await network.invoke(networkObj, true, 'DoctorContract:getPatientHistory', patientId);
        const parsedResponse = await JSON.parse(response);
        expect(parsedResponse[0].changedBy).toEqual(doctorId);
        expect(parsedResponse.length).not.toEqual(0);
    })

    test('Revoke Permission of Doctor', async () => {
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

    test('should not be able to read Patient History as Permission Revoked', async () => {
        let doctorId = doctors[0].id;
        let patientId = patients[0].patientId;
        let hospitalId = 1;
        const networkObj = await network.connectToNetwork(doctorId, hospitalId);
        const response = await network.invoke(networkObj, true, 'DoctorContract:getPatientHistory', patientId);
        expect(response.error.length).not.toEqual(0);
    })

})