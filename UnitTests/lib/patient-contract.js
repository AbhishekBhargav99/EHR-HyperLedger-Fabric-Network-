/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

let Patient = require('./Patient.js');
const crypto = require('crypto');
const PrimaryContract = require('./primary-contract.js');
const { Context } = require('fabric-contract-api');

class PatientContract extends PrimaryContract {
    //Read patient details based on patientId
    async readPatient(ctx, patientId) {
        return await super.readPatient(ctx, patientId);
    }

    async getPatientPersonelDetails(ctx, patientId){
        
        let asset = await this.readPatient(ctx, patientId);

        let patient = {
            patientId: asset.patientId,
            firstName: asset.firstName,
            lastName: asset.lastName,
            email: asset.email,
            age: asset.age,
            phoneNumber: asset.phoneNumber,
            gender: asset.gender,
            weight: asset.weight,
            address: asset.address,
            bloodGroup: asset.bloodGroup,
        }
        return patient;
    }

    //This function is to update patient personal details. This function should be called by patient.
    async updatePatientPersonalDetails(ctx, args) {
        args = JSON.parse(args);
        let isDataChanged = false;
        let patientId = args.patientId;
        let newemail = args.email;
        let updatedBy = args.changedBy;
        let newPhoneNumber = args.phoneNumber;
        let newAddress = args.address;
        let newWeight = args.weight;

        let patient = await this.readPatient(ctx, patientId)
        
        if (updatedBy !== null && updatedBy !== '') {
            patient.changedBy = updatedBy;
        }

        if (newPhoneNumber !== null && newPhoneNumber !== '' && patient.phoneNumber !== newPhoneNumber) {
            patient.phoneNumber = newPhoneNumber;
            isDataChanged = true;
        }

        if (newAddress !== null && newAddress !== '' && patient.address !== newAddress) {
            patient.address = newAddress;
            isDataChanged = true;
        }

        if (newemail !== null && newemail !== '' && patient.email !== newemail) {
            patient.email = newemail;
            isDataChanged = true;
        }

        if (newWeight !== null && newWeight !== '' && patient.weight !== newWeight) {
            patient.weight = newWeight;
            isDataChanged = true;
        }

        if (isDataChanged === false) return;

        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(patientId, buffer);
    } 

    //Retrieves patient medical history based on patientId
    async getPatientMedicalHistory(ctx, patientId) {
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }
        // let resultsIterator = await ctx.stub.getHistoryForKey(patientId);
        let resultsIterator = await ctx.stub.getStateByRange('', '');
        let asset = await this.getAllPatientResults(resultsIterator);
        return this.fetchLimitedFields(asset, patientId);
    }
    
    // Utitility Function for fetching limited fields
    fetchLimitedFields = (asset, pId = '') => {
        let allRecords = [];
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            asset[i] = {
                patientId: obj.Record.patientId,
                reasonsForVisit: obj.Record.reasonsForVisit,
                allergies: obj.Record.allergies,
                symptoms: obj.Record.symptoms,
                diagnosis: obj.Record.diagnosis,
                treatment: obj.Record.treatment,
                medication: obj.Record.medication,
                followUp: obj.Record.followUp,
                notes: obj.Record.notes,
                changedBy : obj.Record.changedBy,
            }
            allRecords.push(asset[i]);
        }

        return allRecords;
    };

    // Agument will have patientid & docId
    async grantAccessToDoctor(ctx, args) {
        args = JSON.parse(args);
        let patientId = args.patientId;
        let doctorId = args.doctorId;
        // Get the patient asset from world state
        const patient = await this.readPatient(ctx, patientId);
        // unique doctorIDs in permissionGranted
        if (!patient.permissionGranted.includes(doctorId)) {
            patient.permissionGranted.push(doctorId);
            patient.changedBy = patientId;
        }
        const buffer = Buffer.from(JSON.stringify(patient));
        // Update the ledger with updated permissionGranted
        await ctx.stub.putState(patientId, buffer);
        let permissionedArray = patient.permissionGranted;
        return permissionedArray;
    };

    

    // Remove Doctor from permissions array
    async revokeAccessFromDoctor(ctx, args) {
        args = JSON.parse(args);
        let patientId = args.patientId;
        let doctorId = args.doctorId;

        // Get the patient asset from world state
        const patient = await this.readPatient(ctx, patientId);
        // Remove the doctor if existing
        if (patient.permissionGranted.includes(doctorId)) {
            patient.permissionGranted = patient.permissionGranted.filter(doctor => doctor !== doctorId);
            patient.changedBy = patientId;
        }
        const buffer = Buffer.from(JSON.stringify(patient));
        // Update the ledger with updated permissionGranted
        await ctx.stub.putState(patientId, buffer);
        let permissionedArray = patient.permissionGranted;
        return permissionedArray;
    };  
}

module.exports = PatientContract;