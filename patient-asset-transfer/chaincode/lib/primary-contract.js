const { Contract } = require('fabric-contract-api');
let Patient = require('./Patient.js');
let initPatients = require('./initLedger.json');


class PrimaryContract extends Contract{

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        for (let i = 0; i < initPatients.length; i++) {
            await ctx.stub.putState(initPatients[i].patientId , Buffer.from(JSON.stringify(initPatients[i])));
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    // # ----------------------------############### ----------------------------------------------------
    // async CreateAsset(ctx, id, color, size, owner, appraisedValue) {
    //     const asset = {
    //         ID: id,
    //         Color: color,
    //         Size: size,
    //         Owner: owner,
    //         AppraisedValue: appraisedValue,
    //     };
    //     ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
    //     return JSON.stringify(asset);
    // }


    // async ReadAsset(ctx, id) {
    //     const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
    //     if (!assetJSON || assetJSON.length === 0) {
    //         throw new Error(`The asset ${id} does not exist`);
    //     }
    //     return assetJSON.toString();
    // }

    // async DeleteAsset(ctx, id) {
    //     const exists = await this.AssetExists(ctx, id);
    //     if (!exists) {
    //         throw new Error(`The asset ${id} does not exist`);
    //     }
    //     return ctx.stub.deleteState(id);
    // }

    // // AssetExists returns true when asset with given ID exists in world state.
    // async AssetExists(ctx, id) {
    //     const assetJSON = await ctx.stub.getState(id);
    //     return assetJSON && assetJSON.length > 0;
    // }


    // ########################################################

    async patientExists(ctx, patientId) {
        const buffer = await ctx.stub.getState(patientId);
        return (!!buffer && buffer.length > 0);
    }

    //Read patient details based on patientId
    async readPatient(ctx, patientId) {
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }

        const buffer = await ctx.stub.getState(patientId);
        let asset = JSON.parse(buffer.toString());
        asset = ({
            patientId: patientId,
            firstName: asset.firstName,
            lastName: asset.lastName,
            // email: asset.email,
            password: asset.password,
            age: asset.age,
            // phoneNumber: asset.phoneNumber,
            gender: asset.gender,
            // weight: asset.weight,
            // address: asset.address,
            bloodGroup: asset.bloodGroup,
            changedBy: asset.changedBy,
            reasonForUpdate: asset.reasonForUpdate,
            permanentToken: asset.permanentToken,
            medicalRecord : asset.medicalRecord,
            permissionGranted: asset.permissionGranted
        });
        return asset;
    }

    async getAllPatientResults(iterator, isHistory) {

        let allResults = [];
        while (true) {
            let res = await iterator.next();
            // console.info("iterator.next -> ", res);
            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                // console.info("res ------>>>>  ", res);
                // console.info("res.value --->> ", res.value)
                // console.info("res.value.value.toString  ---->>>>>>", res.value.value.toString('utf8'));
                console.info("res.valu.timestamp ---->>> ", res.value.timestamp);
                if (isHistory && isHistory === true) {
                    jsonRes.Timestamp = res.value.timestamp;
                }
                jsonRes.Key = res.value.key;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }
                console.info("Jsonres  ---->>> ", jsonRes);
                allResults.push(jsonRes);
            }
            if (res.done) {
                await iterator.close();
                return allResults;
            }
        }
    }

}

// res.value --->>  KeyModification {
//     txId: 'c047a98fefc8c1cbb9ceb4c4795cbcfa93c1ea51fa6c69ab3e5e557cfd5bb43f',
//     value: <Buffer 7b 22 66 69 72 73 74 4e 61 6d 65 22 3a 22 52 61 68 75 6c 22 2c 22 6c 61 73 74 4e 61 6d 65 22 3a 22 4d 65 68 72 61 22 2c 22 61 67 65 22 3a 22 35 30 22 ... 436 more bytes>,
//     timestamp: Timestamp {
//       seconds: Long { low: 1643264372, high: 0, unsigned: false },
//       nanos: 737412589
//     }
//   }
//   res.value.value.toString  ---->>>>>> {"firstName":"Rahul","lastName":"Mehra","age":"50","phoneNumber":"9469515437","emergPhoneNumber":"9469515437","address":"Pune, Maharashtra","bloodGroup":"O+","allergies":"No","symptoms":"Cholesterol, Total 250 mg/dl","diagnosis":"Diabetes","treatment":"Insulin 10 mg everyday","followUp":"6 Months","permissionGranted":["hosp1admin","hosp2admin"],"changedBy":"initLedger","password":"ee6affdb08c3ef9c6444816329b56250ae42a2149b3e72136251a7d8340de43b",newPatient":false,"docType":"patient"}
//   res.valu.timestamp ---->>>  Timestamp {
//     seconds: Long { low: 1643264372, high: 0, unsigned: false },
//     nanos: 737412589
//   }
//   Jsonres  ---->>>  {
//     Timestamp: Timestamp {
//       seconds: Long { low: 1643264372, high: 0, unsigned: false },
//       nanos: 737412589
//     },
//     Key: undefined,
//     Record: {
//       firstName: 'Rahul',
//       lastName: 'Mehra',
//       age: '50',
//       phoneNumber: '9469515437',
//       emergPhoneNumber: '9469515437',
//       address: 'Pune, Maharashtra',
//       bloodGroup: 'O+',
//       allergies: 'No',
//       symptoms: 'Cholesterol, Total 250 mg/dl',
//       diagnosis: 'Diabetes',
//       treatment: 'Insulin 10 mg everyday',
//       followUp: '6 Months',
//       permissionGranted: [ 'hosp1admin', 'hosp2admin' ],
//       changedBy: 'initLedger',
//       password: 'ee6affdb08c3ef9c6444816329b56250ae42a2149b3e72136251a7d8340de43b',
//       newPatient: false,
//       docType: 'patient'
//     }
//   }
//   iterator.next ->  { done: true }
  


module.exports = PrimaryContract;