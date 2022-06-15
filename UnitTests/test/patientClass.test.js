const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const PrimaryContract = require('../lib/primary-contract.js');
const AdminContract = require('../lib/admin-contract.js');
const PatientContract = require('../lib/patient-contract.js');
let assert = sinon.assert;
chai.use(sinonChai);

const crypto = require('crypto'); 
const initData = require('../lib/initLedger.json');


describe("Patient Contract Tests", () => {
    let transactionContext, chaincodeStub, asset;
    beforeEach(() => {
        transactionContext = new Context();

        chaincodeStub = sinon.createStubInstance(ChaincodeStub);
        transactionContext.setChaincodeStub(chaincodeStub);

        chaincodeStub.putState.callsFake((key, value) => {
            if (!chaincodeStub.states) {
                chaincodeStub.states = {};
            }
            chaincodeStub.states[key] = value;
        });

        chaincodeStub.getState.callsFake(async (key) => {
            let ret;
            if (chaincodeStub.states) {
                ret = chaincodeStub.states[key];
            }
            return Promise.resolve(ret);
        });

        chaincodeStub.deleteState.callsFake(async (key) => {
            if (chaincodeStub.states) {
                delete chaincodeStub.states[key];
            }
            return Promise.resolve(key);
        });

        chaincodeStub.getStateByRange.callsFake(async () => {
            function* internalGetStateByRange() {
                if (chaincodeStub.states) {
                    // Shallow copy
                    const copied = Object.assign({}, chaincodeStub.states);

                    for (let key in copied) {
                        yield {value: copied[key]};
                    }
                }
            }

            return Promise.resolve(internalGetStateByRange());
        });

        asset =  {
            "patientId": "PID1000xyz",
            "firstName": "Rahul",
            "lastName": "Mehra",
            "email": "rahul946@gmail.com",
            "password": "ee6affdb08c3ef9c6444816329b56250ae42a2149b3e72136251a7d8340de43b",
            "age": "50",
            "phoneNumber": "9469515437",
            "gender" : "M",
            "weight" : "75 Kgs",
            "address": "Pune, Maharashtra, 411043",
            "bloodGroup": "O+",
            "changedBy": "initLedger",
            "reasonsForVisit" : "Heart Pain",
            "allergies": "Face Pimples",
            "symptoms": "High Sugar Levels",
            "diagnosis": "Sugar Levels - 250 mg/dl",
            "treatment": "Reduce Junk and Sugary Foods",
            "medication": "Insulin 10mg daily dose",
            "followUp": "6 Months",
            "notes" : "Consuming too much sugar,Family History of Diabetes",
            "newPatient": false,
            "permissionGranted": ["hosp1admin", "hosp2admin"]
        };

        args = {
            patientId : "PID1002xyz",
            firstName : "Ayush",
            lastName : "Raina",
            email : "ayush123@gmail.com",
            password: "111222",
            age : "25-03-2002",
            phoneNumber : "9149728066",
            gender: "M",
            weight : "72 kgs",
            address: "Jammu, j&k",
            bloodGroup: "B+",
            changedBy: 'hosp1admin',
        }
    });
    
    describe('Read Patient', () => {

        it('should get the patient with given patient Id', async() => {
            let adminContract = new AdminContract();
            let patientContract = new PatientContract();
            let patientArgs = JSON.stringify(args);       
            await adminContract.createPatient(transactionContext, patientArgs);
            let res = await patientContract.readPatient(transactionContext, args.patientId);
            expect(res.patientId).to.be.equal(args.patientId);
        });

        it('should not get the patient as no such patient exists', async() => {
            let adminContract = new AdminContract();
            let patientContract = new PatientContract();
            let patientArgs = JSON.stringify(args); 
            let patientId = "PID1003abc"    
            await adminContract.createPatient(transactionContext, patientArgs);
            try{
                let res = await patientContract.readPatient(transactionContext, patientId);
            } catch(err){
                expect(err.message).to.equal(`The patient ${patientId} does not exist`);
            }
            expect(true).to.be.equal(true);
        })
    })

    describe('Read Patient Personel Details', () => {

        it('should get the patient personel details with given patient Id', async() => {
            let adminContract = new AdminContract();
            let patientContract = new PatientContract();
            let patientArgs = JSON.stringify(args);       
            await adminContract.createPatient(transactionContext, patientArgs);
            let res = await patientContract.getPatientPersonelDetails(transactionContext, args.patientId);
            let newArgs = args;
            delete newArgs['password'];
            delete newArgs['changedBy'];
            let expectedPatient = newArgs;
            expect(res.patientId).to.be.equal(args.patientId);
            expect(res).to.eql(expectedPatient);
        });

        it('should not get the patient personel Details as no such patient exists', async() => {
            let adminContract = new AdminContract();
            let primaryContract = new PrimaryContract();
            let patientContract = new PatientContract();
            let patientArgs = JSON.stringify(args); 
            let patientId = "PID1003abc"    
            await adminContract.createPatient(transactionContext, patientArgs);
            try{
                let res = await patientContract.getPatientPersonelDetails(transactionContext, patientId);
            } catch(err){
                expect(err.message).to.equal(`The patient ${patientId} does not exist`);
            }
            expect(true).to.be.equal(true);
        })
    })

    describe('Update Personel Details', () => {

        it('should update personel with given patient Id', async() => {
            let adminContract = new AdminContract();
            let patientContract = new PatientContract();
            let patientArgs = JSON.stringify(args);       
            await adminContract.createPatient(transactionContext, patientArgs);
            let updatedPersonelDetails = {
                patientId : args.patientId,
                email : 'ayush@gmail.com',
                changedBy : 'self',
                phoneNumber: '9115677890',
                address : "Pune, India",
                weight : '65 kgs'
            }
            let updatedPersonelDetailsArgs = JSON.stringify(updatedPersonelDetails);
            await patientContract.updatePatientPersonalDetails(transactionContext,updatedPersonelDetailsArgs);
            let res = await patientContract.getPatientPersonelDetails(transactionContext, args.patientId);
            expect(res.email).to.equal(updatedPersonelDetails.email);
            expect(res.phoneNumber).to.equal(updatedPersonelDetails.phoneNumber);
            expect(res.address).to.equal(updatedPersonelDetails.address);
            expect(res.weight).to.equal(updatedPersonelDetails.weight);
            expect(res.patientId).to.be.equal(args.patientId);
            
        });

        it('should not update personel Details as no such patient exists', async() => {
            let adminContract = new AdminContract();
            let primaryContract = new PrimaryContract();
            let patientContract = new PatientContract();
            let patientArgs = JSON.stringify(args); 
            let patientId = "PID1003abc"    
            let updatedPersonelDetails = {
                patientId : patientId,
                email : 'ayush@gmail.com',
                changedBy : 'self',
                phoneNumber: '9115677890',
                address : "Pune, India",
                weight : '65 kgs'
            }
            let updatedPersonelDetailsArgs = JSON.stringify(updatedPersonelDetails);
            try{
                await patientContract.updatePatientPersonalDetails(transactionContext,updatedPersonelDetailsArgs);
            } catch(err){
                expect(err.message).to.equal(`The patient ${patientId} does not exist`);
            }
            expect(true).to.be.equal(true);
        })
    })


    describe('Grant Permission to Doctor', () => {
        it('should include Doctor in permissioned list', async () => {
            let adminContract = new AdminContract();
            let patientContract = new PatientContract();
            let patientArgs = JSON.stringify(args);       
            await adminContract.createPatient(transactionContext, patientArgs);
            let doctorId = "Doc-1";
            let gArgs = {
                patientId: args.patientId,
                doctorId: doctorId
            }
            let grantArgs = JSON.stringify(gArgs);
            let res = await patientContract.grantAccessToDoctor(transactionContext, grantArgs);
            expect(res.includes(doctorId)).to.be.equal(true);
        })

        it('should not grant Permissions as Patient does not exists', async() => {
            let adminContract = new AdminContract();
            let patientContract = new PatientContract();
            let patientArgs = JSON.stringify(args);       
            await adminContract.createPatient(transactionContext, patientArgs);
            let doctorId = "Doc-1";
            let patientId = "PID10003xyz"
            let gArgs = {
                patientId: patientId,
                doctorId: doctorId
            }
            let grantArgs = JSON.stringify(gArgs);
            try{
                let res = await patientContract.grantAccessToDoctor(transactionContext, grantArgs);
            } catch(err){
                expect(err.message).to.equal(`The patient ${patientId} does not exist`);
            }
        })
    })

    describe('Revoke Permission From Doctor', () => {
        it('should include Doctor in permissioned list', async () => {
            let adminContract = new AdminContract();
            let patientContract = new PatientContract();
            let patientArgs = JSON.stringify(args);       
            await adminContract.createPatient(transactionContext, patientArgs);
            let doctorId = "Doc-1";
            let gArgs = {
                patientId: args.patientId,
                doctorId: doctorId
            }
            let grantArgs = JSON.stringify(gArgs);
            let res = await patientContract.grantAccessToDoctor(transactionContext, grantArgs);
            expect(res.includes(doctorId)).to.be.equal(true);
            res = await patientContract.revokeAccessFromDoctor(transactionContext, grantArgs);
            expect(res.includes(doctorId)).to.be.equal(false);
        })

        it('should not revoke Access as Patient does not exists', async() => {
            let adminContract = new AdminContract();
            let patientContract = new PatientContract();
            let patientArgs = JSON.stringify(args);       
            await adminContract.createPatient(transactionContext, patientArgs);
            let doctorId = "Doc-1";
            let patientId = "PID10003xyz"
            let gArgs = {
                patientId: args.patientId,
                doctorId: doctorId
            }
            let grantArgs = JSON.stringify(gArgs);
            let res = await patientContract.grantAccessToDoctor(transactionContext, grantArgs);
            expect(res.includes(doctorId)).to.be.equal(true);
            try{
                gArgs.patientId = patientId;
                grantArgs = JSON.stringify(gArgs);
                res = await patientContract.revokeAccessFromDoctor(transactionContext, grantArgs);
            } catch(err){
                expect(err.message).to.equal(`The patient ${patientId} does not exist`);
            }
        })
    })

    describe('Check Medical History', () => {
        it("Should return Medical History of Patient and should be empty", async () => {
            let adminContract = new AdminContract();
            let patientContract = new PatientContract();
            let patientArgs = JSON.stringify(args);       
            await adminContract.createPatient(transactionContext, patientArgs);
            let doctorId = "Doc-1";
            let patientId = "PID10003xyz"
            let gArgs = {
                patientId: args.patientId,
                doctorId: doctorId
            }
            let grantArgs = JSON.stringify(gArgs);
            let res = await patientContract.grantAccessToDoctor(transactionContext, grantArgs);
            expect(res.includes(doctorId)).to.be.equal(true);
            let medRes = await patientContract.getPatientMedicalHistory(transactionContext, args.patientId);
            medRes = medRes[0];
            expect(medRes.patientId).to.be.equal(args.patientId);
            expect(medRes.changedBy).to.be.equal(args.patientId);
            expect(medRes.medication).to.be.equal('');
            expect(medRes.allergies).to.equal('');
            expect(medRes.diagnosis).to.equal('');
            expect(medRes.treatment).to.equal('');
            expect(medRes.followUp).to.equal('');
            expect(medRes.notes).to.equal('');
            expect(true).to.be.equal(true);
        })
    })

});