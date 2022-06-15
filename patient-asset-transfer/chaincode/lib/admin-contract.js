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
        return allResults[allResults.length - 1].patientId;
    }

    //Create patient in the ledger
    async createPatient(ctx, args) {
        args = JSON.parse(args);
        const exists = await this.patientExists(ctx, args.patientId);
        let newPatient = await new Patient(args.patientId, args.firstName, args.lastName, args.password, args.age,
            args.gender,  args.bloodGroup, args.changedBy, 'patientCreated', args.permanentToken);
        if (exists) {
            throw new Error(`The patient ${newPatient.patientId} already exists`);
        }

        const buffer = Buffer.from(JSON.stringify(newPatient));
        await ctx.stub.putState(newPatient.patientId, buffer);
    }

    // Redundant
    //Read patient details based on patientId 
    // async readPatient(ctx, patientId) {
    //     try{
    //         let asset = await super.readPatient(ctx, patientId);
    //         asset = ({
    //             patientId: patientId,
    //             firstName: asset.firstName,
    //             lastName: asset.lastName,
    //             phoneNumber: asset.phoneNumber,
    //             email: asset.email
    //         });
    //         return asset;
    //     } catch(err){
    //         throw new err;
    //     }

    // }


    //Read patients based on lastname
    // async queryPatientsByLastName(ctx, lastName) {
    //     let queryString = {};
    //     queryString.selector = {};
    //     queryString.selector.docType = 'patient';
    //     queryString.selector.lastName = lastName;
    //     const buffer = await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
    //     let asset = JSON.parse(buffer.toString());

    //     return this.fetchLimitedFields(asset);
    // }

    //Read patients based on firstName
    // async queryPatientsByFirstName(ctx, firstName) {
    //     let queryString = {};
    //     queryString.selector = {};
    //     queryString.selector.docType = 'patient';
    //     queryString.selector.firstName = firstName;
    //     const buffer = await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
    //     let asset = JSON.parse(buffer.toString());

    //     return this.fetchLimitedFields(asset);
    // }

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
                patientId: obj.Key,
                firstName: obj.Record.firstName,
                lastName: obj.Record.lastName,
                // phoneNumber: obj.Record.phoneNumber,
                // email: obj.Record.email,
                age: obj.Record.age,
                // address: obj.Record.address,
            };
        }

        return asset;
    }
}
module.exports = AdminContract;