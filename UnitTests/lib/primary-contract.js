/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
let Patient = require('./Patient.js');
let initPatients = require('./initLedger.json');


class PrimaryContract extends Contract{

    async initLedger(ctx) {
       
        for (let i = 0; i < initPatients.length; i++) {
            initPatients[i].docType = 'patient';
            await ctx.stub.putState(initPatients[i].patientId , Buffer.from(JSON.stringify(initPatients[i])));
            // console.info('Added <--> ', initPatients[i]);
        }
    }

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
            email: asset.email,
            password: asset.password,
            age: asset.age,
            phoneNumber: asset.phoneNumber,
            gender: asset.gender,
            weight: asset.weight,
            address: asset.address,
            bloodGroup: asset.bloodGroup,
            changedBy: asset.changedBy,
            reasonsForVisit: asset.reasonsForVisit,
            allergies: asset.allergies,
            symptoms: asset.symptoms,
            diagnosis: asset.diagnosis,
            treatment: asset.treatment,
            medication: asset.medication,
            followUp: asset.followUp,
            notes: asset.notes,
            newPatient: asset.newPatient,
            permissionGranted: asset.permissionGranted
        });
        return asset;
    }


    async getAllPatientResults(iterator) {

        let allResults = [];
        while (true) {
            let res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                jsonRes.Key = res.value.key;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    jsonRes.Record = res.value.value.toString('utf8');
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
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