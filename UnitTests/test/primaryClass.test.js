// var MyClass = require('../lib/myClass.js');
// var myObj = new MyClass();

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



// describe.skip('Tests myclass', () => {



//     it('Test add function', function () {
//         expect(myObj.add(1, 2)).to.be.equal(3);
//     })


//     it('spy add method', () => {

//         // spy creates a warapper around the method and then we can use it to 
//         // keep track of method
//         var spy = sinon.spy(myObj, "add");
//         var a1 = 10, a2 = 20;
//         myObj.callFunc(a1, a2);
//         // sinon.assert.calledOnce(spy);
//         // Or 
//         expect(spy.calledOnce).to.be.true;
//     })

//     it('Mock the say Hello', () => {
//         var mock = sinon.mock(myObj);
//         var expectations = mock.expects("sayHello");
//         expectations.exactly(1);
//         expectations.withArgs('Hello World');
//         myObj.callFunc(10, 20);
//         mock.verify();
//     })



// });

// describe.skip("Test suite for stub", function() {
//     it('Stub the add method', () => {
//         var stub = sinon.stub(myObj, 'add');
//         stub.withArgs(10, 20)
//         .onFirstCall().returns(100)
//         .onSecondCall().returns(200);

//         expect(myObj.callFunc(10, 20)).to.be.equal(100);
//         expect(myObj.callFunc(10, 20)).to.be.equal(200);
//     })
// })

describe("Primary Contract Tests", () => {
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

    describe('Test InitLedger', () => {
        it('should return error on InitLedger', async () => {
            chaincodeStub.putState.rejects('failed inserting key');
            let primaryContract = new PrimaryContract();
            try {
                await primaryContract.initLedger(transactionContext);
                assert.fail('InitLedger should have failed');
            } catch (err) {
                // console.log('err ->...... name', err.name);
                expect(err.name).to.equal('failed inserting key');
            }
        });

        it('should return success on InitLedger', async () => {
            let primaryContract = new PrimaryContract();
            await primaryContract.initLedger(transactionContext);
            let PID1 = 'PID1000xyz', PID2 = 'PID1001xyz';
            let ret1 = JSON.parse((await chaincodeStub.getState(PID1)).toString());
            let ret2 = await primaryContract.patientExists(transactionContext, PID1);
            let ret3 = JSON.parse((await chaincodeStub.getState(PID2)).toString());
            let ret4 = await primaryContract.patientExists(transactionContext, PID2);
            
            expect(ret1).to.eql(Object.assign({docType: 'patient'}, asset));
            expect(ret2).to.be.equal(true);
            expect(ret3).to.eql(Object.assign({docType: 'patient'}, initData[1]));
            expect(ret4).to.be.equal(true);
        });
    });


    

    describe('Test Read Patient', () => {
        
        it('should succesfully Read the Patient', async () => {
            let primaryContract = new PrimaryContract();
            let adminContract = new AdminContract();
            let patientArgs = JSON.stringify(args);
            await adminContract.createPatient(transactionContext, patientArgs);
            args.password = crypto.createHash('sha256').update(args.password).digest('hex');
            let ret = await primaryContract.readPatient(transactionContext, args.patientId);
            expect(ret.patientId).to.eql(args.patientId);
            expect(ret.firstName).to.eql(args.firstName);
            expect(ret.lastName).to.eql(args.lastName);
            expect(ret.email).to.eql(args.email);
            expect(ret.password).to.eql(args.password);
        });

        it('should return Failure on Read Patient as Patient Does not Exists', async () => {
            let primaryContract = new PrimaryContract();
            let patientId = 'PID1003xyz'
            try{
                await primaryContract.readPatient(transactionContext, patientId);
            } catch(err){
                expect(err.message).to.equal(`The patient ${patientId} does not exist`)
            }
        })

       
    });

    describe('Query All Patients', () => {
        it("Should return success on read All Patients", async() => {
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
    })
    
})
