/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

let Patient = require('./Patient.js');
const PrimaryContract = require('./primary-contract.js');



class AdminContract extends PrimaryContract {

    //Returns the last patientId in the set
    async getLatestPatientId(ctx) {
        let allResults = await this.queryAllPatients(ctx);
        if(allResults.length === 0){
            throw new Error(`No Patient Exists yet`);
        }
        return allResults[allResults.length - 1].patientId;
    }

    //Create patient in the ledger
    async createPatient(ctx, args) {
        args = JSON.parse(args);
        const exists = await this.patientExists(ctx, args.patientId);
        let newPatient = new Patient(args.patientId, args.firstName, args.lastName, args.email, args.password, args.age,
            args.phoneNumber, args.gender, args.weight, args.address, args.bloodGroup, args.changedBy);
        if (exists) {
            throw new Error(`The patient ${newPatient.patientId} already exists`);
        }
        const buffer = Buffer.from(JSON.stringify(newPatient));
        await ctx.stub.putState(newPatient.patientId, buffer);
        // return JSON.stringify(newPatient);
    }

    
    //Retrieves all patients details
    async queryAllPatients(ctx) {
        let resultsIterator = await ctx.stub.getStateByRange('', '');
        let asset = await this.getAllPatientResults(resultsIterator, false);
        return this.fetchLimitedFields(asset);
    }

    fetchLimitedFields = asset => {
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            asset[i] = {
                patientId: obj.Record.patientId,
                firstName: obj.Record.firstName,
                lastName: obj.Record.lastName,
                phoneNumber: obj.Record.phoneNumber,
                email: obj.Record.email,
                age: obj.Record.age,
                address: obj.Record.address,
            };
        }

        return asset;
    }
}
module.exports = AdminContract;