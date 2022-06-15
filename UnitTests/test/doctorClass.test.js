const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const DoctorContract = require('../lib/doctor-contract.js');
const AdminContract = require('../lib/admin-contract.js');
const PatientContract = require('../lib/patient-contract.js');
const PrimaryContract = require('../lib/primary-contract.js');

let assert = sinon.assert;
chai.use(sinonChai);

const crypto = require('crypto'); 
const initData = require('../lib/initLedger.json');



describe("Doctor Contract Tests", () => {
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
        };
        rec = {
            patientId : args.patientId,
            doctorId : '',
            reasonsForVisit : 'Fever',
            allergies : 'none',
            symptoms: 'comon cold',
            diagnosis : 'Chest Congestion',
            treatment : 'Eat the medication 3 times',
            medication: 'Paracetamol - 300mg',
            followUp: '2 weeks',
            notes: 'Take Care',
            changedBy: '',
        }
    });

    describe("Read a Paitent", () => {
        it('should read Patient as Permission Granted', async () => {
            let adminContract = new AdminContract();
            let patientContract = new PatientContract();
            let doctorContract = new DoctorContract();
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
            let patientRec = await doctorContract.readPatient(transactionContext, grantArgs);
            expect(patientRec.patientId).to.be.equal(args.patientId);
            expect(patientRec.firstName).to.be.equal(args.firstName);
            expect(patientRec.lastName).to.be.equal(args.lastName);
            expect(patientRec.age).to.be.equal(args.age);
            expect(patientRec.gender).to.be.equal(args.gender);
            expect(patientRec.bloodGroup).to.be.equal(args.bloodGroup);
            expect(true).to.be.true;
        });

        it("should not read a patient as permission not granted", async () => {
            let adminContract = new AdminContract();
            let doctorContract = new DoctorContract();
            let patientArgs = JSON.stringify(args);       
            await adminContract.createPatient(transactionContext, patientArgs);
            let doctorId = "Doc-1";
            rec.doctorId = doctorId
            let gArgs = {
                patientId: args.patientId,
                doctorId: doctorId
            }
            let grantArgs = JSON.stringify(gArgs);
            try{
                await doctorContract.readPatient(transactionContext, grantArgs);
            } catch(err){
                expect(err.message).to.equal(`The doctor ${gArgs.doctorId} does not have permission to patient ${gArgs.patientId}`);
            }

        })
    });

    describe('Update Patient Medical Details', () => {
        it('Permissioned Doctor should add medical details', async() => {
            let adminContract = new AdminContract();
            let patientContract = new PatientContract();
            let doctorContract = new DoctorContract();
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
            rec.doctorId = doctorId; rec.changedBy = doctorId;
            let updateArgs = JSON.stringify(rec);
            await doctorContract.updatePatientMedicalDetails(transactionContext, updateArgs);
            res = await doctorContract.readPatient(transactionContext, grantArgs);
            expect(res.patientId).to.be.equal(args.patientId);
            expect(res.firstName).to.be.equal(args.firstName);
            expect(res.allergies).to.be.equal(rec.allergies);
            expect(res.symptoms).to.be.equal(rec.symptoms);
            expect(res.diagnosis).to.be.equal(rec.diagnosis);
            expect(res.treatment).to.be.equal(rec.treatment);
            expect(res.followUp).to.be.equal(rec.followUp);
            expect(res.notes).to.be.equal(rec.notes);
            expect(true).to.be.equal(true);
            
        })

        it("Doctor should not add Medical Records as Permission not granted", async () => {
            let adminContract = new AdminContract();
            let doctorContract = new DoctorContract();
            let patientArgs = JSON.stringify(args);       
            await adminContract.createPatient(transactionContext, patientArgs);
            let doctorId = "Doc-1"
            rec.doctorId = doctorId; rec.changedBy = doctorId;
            let updateArgs = JSON.stringify(rec);
            try{
                await doctorContract.updatePatientMedicalDetails(transactionContext, updateArgs);
            } catch(err){
                expect(err.message).to.equal(`The doctor ${doctorId} does not have permission to patient ${args.patientId}`)
            }
        })
    })

    describe('View Medical Record', () => {
        it('should view the medical record added by doctor with permission', async () => {
            let adminContract = new AdminContract();
            let patientContract = new PatientContract();
            let doctorContract = new DoctorContract();
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
            rec.doctorId = doctorId; rec.changedBy = doctorId;
            let updateArgs = JSON.stringify(rec);
            await doctorContract.updatePatientMedicalDetails(transactionContext, updateArgs);
            res = await doctorContract.readPatient(transactionContext, grantArgs);
            expect(res.patientId).to.be.equal(args.patientId);
            expect(res.firstName).to.be.equal(args.firstName);
            expect(res.allergies).to.be.equal(rec.allergies);
            expect(res.symptoms).to.be.equal(rec.symptoms);
            expect(res.diagnosis).to.be.equal(rec.diagnosis);
            expect(res.treatment).to.be.equal(rec.treatment);
            expect(res.followUp).to.be.equal(rec.followUp);
            expect(res.notes).to.be.equal(rec.notes);
            res = await doctorContract.getPatientHistory(transactionContext, grantArgs);
            res = res[0];
            expect(res.patientId).to.be.equal(args.patientId);
            expect(res.allergies).to.be.equal(rec.allergies);
            expect(res.symptoms).to.be.equal(rec.symptoms);
            expect(res.diagnosis).to.be.equal(rec.diagnosis);
            expect(res.treatment).to.be.equal(rec.treatment);
            expect(res.followUp).to.be.equal(rec.followUp);
            expect(res.changedBy).to.be.equal(rec.changedBy);
            expect(res.medication).to.be.equal(rec.medication);
        })

        it('Doctor should not read patient Medical data as permission not granted', async () => {
            let adminContract = new AdminContract();
            let doctorContract = new DoctorContract();
            let patientArgs = JSON.stringify(args);       
            await adminContract.createPatient(transactionContext, patientArgs);
            let doctorId = "Doc-1"
            rec.doctorId = doctorId; rec.changedBy = doctorId;
            let gArgs = {
                patientId: args.patientId,
                doctorId: doctorId
            }
            let grantArgs = JSON.stringify(gArgs);
            try{
                await doctorContract.getPatientHistory(transactionContext, grantArgs);
            } catch(err){
                expect(err.message).to.equal(`The doctor ${doctorId} does not have permission to patient ${args.patientId}`)
            }
        })
    })

    describe('Query Patients', () => {
        it('doctor should vew all the patients for whom the permission has been granted', async () => {
            let primaryContract = new PrimaryContract();
            let patientContract = new PatientContract();
            let doctorContract = new DoctorContract();
            await primaryContract.initLedger(transactionContext);
            let PID1 = 'PID1000xyz', PID2 = 'PID1001xyz';
            let doctorId = "Doc-1";
            let gArgs1 = {
                patientId: PID1,
                doctorId: doctorId
            }
            let gArgs2 = {
                patientId: PID2,
                doctorId: doctorId
            }
            let grantArgs1 = JSON.stringify(gArgs1);
            let grantArgs2 = JSON.stringify(gArgs2);
            let res = await patientContract.grantAccessToDoctor(transactionContext, grantArgs1);
            expect(res.includes(doctorId)).to.be.equal(true);
            res = await patientContract.grantAccessToDoctor(transactionContext, grantArgs2);
            expect(res.includes(doctorId)).to.be.equal(true);
            res = await doctorContract.queryAllPatients(transactionContext, doctorId);
            expect(res.length).to.be.equal(2);
            expect(res[0].patientId).to.be.equal(initData[0].patientId);
            expect(res[0].firstName).to.be.equal(initData[0].firstName);
            expect(res[0].lastName).to.be.equal(initData[0].lastName);
            expect(res[0].age).to.be.equal(initData[0].age);
            expect(res[1].patientId).to.be.equal(initData[1].patientId);
            expect(res[1].firstName).to.be.equal(initData[1].firstName);
            expect(res[1].lastName).to.be.equal(initData[1].lastName);
            expect(res[1].age).to.be.equal(initData[1].age);

        })
    })

});