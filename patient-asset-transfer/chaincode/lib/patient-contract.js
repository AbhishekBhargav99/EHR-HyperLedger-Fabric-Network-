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
            // email: asset.email,
            age: asset.age,
            // phoneNumber: asset.phoneNumber,
            gender: asset.gender,
            // weight: asset.weight,
            // address: asset.address,
            bloodGroup: asset.bloodGroup,
            permissionGranted: asset.permissionGranted
        }
        return patient;
    }

    async getLastTimestamp(ctx, patientId, reason){
        
        let resultsIterator = await ctx.stub.getHistoryForKey(patientId);
        let allResults = [];
        while (true) {
            let res = await resultsIterator.next();
            if (res.value && res.value.value.toString()) {
                let record = {};
                try {
                    record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    record = res.value.value.toString('utf8');
                }
                
                let timestamp = res.value.timestamp;
                let mls = (timestamp.seconds.low + ((timestamp.nanos / 1000000) / 1000)) * 1000;
                console.info(record.reasonForUpdate, ' --- > ', (new Date(mls)));
                if(record.reasonForUpdate === reason){
                    console.info('--------------- Reason For Date  ---------');
                    await resultsIterator.close();
                    const milliseconds = (timestamp.seconds.low + ((timestamp.nanos / 1000000) / 1000)) * 1000;
                    return milliseconds;
                }
            }
            if (res.done) {
                console.info(' -----------------  Done  --------------');
                return (new Date().getTime() - (25 * 60 * 60 * 1000));
            }
        }

    }


    //This function is to update patient personal details. This function should be called by patient.
    // async updatePatientPersonalDetails(ctx, args) {
    //     args = JSON.parse(args);
    //     let isDataChanged = false;
    //     let patientId = args.patientId;
    //     let newemail = args.email;
    //     let updatedBy = args.changedBy;
    //     let newPhoneNumber = args.phoneNumber;
    //     let newAddress = args.address;
    //     let newWeight = args.weight;

    //     let patient = await this.readPatient(ctx, patientId);

    //     let reason = 'updatePersonalDetails'
        
       
    //     if (updatedBy !== null && updatedBy !== '') {
    //         patient.changedBy = updatedBy;
    //     }

    //     if (newPhoneNumber !== null && newPhoneNumber !== '' && patient.phoneNumber !== newPhoneNumber) {
    //         patient.phoneNumber = newPhoneNumber;
    //         isDataChanged = true;
    //     }


    //     if (newAddress !== null && newAddress !== '' && patient.address !== newAddress) {
    //         patient.address = newAddress;
    //         isDataChanged = true;
    //     }


    //     if (newemail !== null && newemail !== '' && patient.email !== newemail) {
    //         patient.email = newemail;
    //         isDataChanged = true;
    //     }

    //     if (newWeight !== null && newWeight !== '' && patient.weight !== newWeight) {
    //         patient.weight = newWeight;
    //         isDataChanged = true;
    //     }

    //     if (isDataChanged === false) return;
    //     console.info('------ last time---------------');
    //     let lastTime = await this.getLastTimestamp(ctx, args.patientId, reason);
    //     console.info('Last Time : ', lastTime);
    //     console.info('--------------------------');
    //     patient.reasonForUpdate = reason;

    //     const buffer = Buffer.from(JSON.stringify(patient));
    //     await ctx.stub.putState(patientId, buffer);
    // }


    //This function is to update patient password. This function should be called by patient.
    async updatePatientPassword(ctx, args) {
        args = JSON.parse(args);
        let patientId = args.patientId;
        let newPassword = args.newPassword;

        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }

        const patient = await this.readPatient(ctx, patientId);

        if (newPassword === null || newPassword === '') {
            throw new Error(`Empty or null values should not be passed for newPassword parameter`);
        }


        patient.password = crypto.createHash('sha256').update(newPassword).digest('hex');
        patient.reasonForUpdate = 'passwordUpdate';
        patient.changedBy = patientId;

        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(patientId, buffer);
    }

    //Returns the patient's password
    async getPatientPassword(ctx, patientId) {
        
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }
        let patient = await this.readPatient(ctx, patientId);
        patient = ({
            password: patient.password,
        })
        return patient;
    }

    //Retrieves patient medical history based on patientId
    async getPatientMedicalHistory(ctx, patientId) {
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }
        let resultsIterator = await ctx.stub.getHistoryForKey(patientId);
        let asset = await this.getAllPatientResults(resultsIterator, true);
        return this.fetchLimitedFields(asset, patientId);
    }
    
    // Utitility Function for fetching limited fields
    fetchLimitedFields = (asset, pId = '') => {
        let allRecords = [];
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            if(obj.Record.changedBy === pId)
                continue;
            
            asset[i] = {
                patientId: obj.Key,
                // firstName: obj.Record.firstName,
                // lastName: obj.Record.lastName,
                // age: obj.Record.age,
                // address: obj.Record.address,
                // phoneNumber: obj.Record.phoneNumber,
                // emergPhoneNumber: obj.Record.emergPhoneNumber,
                // bloodGroup: obj.Record.bloodGroup,
                // reasonsForVisit: obj.Record.reasonsForVisit,
                // allergies: obj.Record.allergies,
                // symptoms: obj.Record.symptoms,
                // diagnosis: obj.Record.diagnosis,
                // treatment: obj.Record.treatment,
                // medication: obj.Record.medication,
                // followUp: obj.Record.followUp,
                // notes: obj.Record.notes,
                changedBy : obj.Record.changedBy,
                medicalRecord: obj.Record.medicalRecord,
                Timestamp : obj.Timestamp
            }
            if(obj.Record.imageUrls)
                asset[i].imageUrls = obj.Record.imageUrls
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