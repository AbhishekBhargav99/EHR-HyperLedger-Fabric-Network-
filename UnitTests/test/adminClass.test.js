const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const PrimaryContract = require('../lib/primary-contract.js');
const AdminContract = require('../lib/admin-contract.js');
let assert = sinon.assert;
chai.use(sinonChai);

const crypto = require('crypto'); 
const initData = require('../lib/initLedger.json');

describe("Admin Contract Tests", () => {
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

    describe('Test CreateAsset', () => {
        
        
        it('should return success on CreatePatient', async () => {
            let adminContract = new AdminContract();
            let patientArgs = JSON.stringify(args);
            await adminContract.createPatient(transactionContext, patientArgs);
            args.password = crypto.createHash('sha256').update(args.password).digest('hex');
            let ret = JSON.parse((await chaincodeStub.getState(args.patientId)).toString());

            expect(ret.patientId).to.eql(args.patientId);
            expect(ret.firstName).to.eql(args.firstName);
            expect(ret.lastName).to.eql(args.lastName);
            expect(ret.email).to.eql(args.email);
            expect(ret.password).to.eql(args.password);
        });

        it('should return Failure on CreatePatient as Patient Already Exists', async () => {
           
            let adminContract = new AdminContract();
            let patientArgs = JSON.stringify(args);
            await adminContract.createPatient(transactionContext, patientArgs);
            try{
                await adminContract.createPatient(transactionContext, patientArgs);
            } catch(err){
                expect(err.message).to.equal(`The patient ${args.patientId} already exists`);
            }
        });

    });

    describe('Get Patient New Id', () => {
        it('Should return last Used Patient Id', async() => {
            let primaryContract = new PrimaryContract();
            await primaryContract.initLedger(transactionContext);
            let adminContract = new AdminContract();
            let expectedId = "PID1001xyz";
            let ret2 = await adminContract.getLatestPatientId(transactionContext);
            expect(ret2).to.equal(expectedId);
        })

        it('Should return no Id as Patient doesnot yet exists', async() => {
            let adminContract = new AdminContract();
            try{
                let ret2 = await adminContract.getLatestPatientId(transactionContext);
            } catch(err){
                expect(err.message).to.equal('No Patient Exists yet')
            }
        })

    });


    describe('Query All the Patients',  () => {
        it('Read all the patients added to ledger', async() => {
            let adminContract = new AdminContract();
            let primaryContract = new PrimaryContract();
            await primaryContract.initLedger(transactionContext);
            let patientArgs = JSON.stringify(args);
            await adminContract.createPatient(transactionContext, patientArgs);

            let res = await adminContract.queryAllPatients(transactionContext);
            expect(res[0].patientId).to.be.equal(initData[0].patientId);
            expect(res[1].patientId).to.be.equal(initData[1].patientId);
            expect(res[2].patientId).to.be.equal(args.patientId);
        })

        it('Should not read any patient patient as none exists', async() =>{
            let adminContract = new AdminContract();
            let res = await adminContract.queryAllPatients(transactionContext);
            let expectedRes = [];
            expect(res).to.eql(expectedRes);
            expect(res.length).to.be.equal(0);
        })
    })

});