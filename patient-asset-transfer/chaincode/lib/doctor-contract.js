/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';
const AdminContract = require('./admin-contract.js');
const PrimaryContract = require("./primary-contract.js");
const { Context } = require('fabric-contract-api');

class DoctorContract extends AdminContract {

   

    //This function is to update patient medical details. This function should be called by only doctor.
    async updatePatientMedicalDetails(ctx, args) {
        args = JSON.parse(args);
        let newMedicalRecords = args.medRecords;
        let patientId = args.patientId;
        let updatedBy = args.changedBy;
        let imageUrls = args.imageUrls;

        
        const patient = await PrimaryContract.prototype.readPatient(ctx, patientId);
        const doctorId = await this.getClientId(ctx);
    
        const permissionArray = patient.permissionGranted;
        if(!permissionArray.includes(doctorId)) {
            throw new Error(`The doctor ${doctorId} does not have permission to patient ${patientId}`);
        }

        // if (newreasonsForVisit !== null && newreasonsForVisit !== '' && patient.reasonsForVisit !== newreasonsForVisit) {
        //     patient.reasonsForVisit = newreasonsForVisit;
        //     isDataChanged = true;
        // }

        // if (newSymptoms !== null && newSymptoms !== '' && patient.symptoms !== newSymptoms) {
        //     patient.symptoms = newSymptoms;
        //     isDataChanged = true;
        // }

        // if (newDiagnosis !== null && newDiagnosis !== '' && patient.diagnosis !== newDiagnosis) {
        //     patient.diagnosis = newDiagnosis;
        //     isDataChanged = true;
        // }

        // if (newTreatment !== null && newTreatment !== '' && patient.treatment !== newTreatment) {
        //     patient.treatment = newTreatment;
        //     isDataChanged = true;
        // }

        // if(newAllergies !== null && newAllergies !== '' && patient.allergies !== newAllergies){
        //     patient.allergies = newAllergies;
        //     isDataChanged = true;
        // }

        // if(newMedication !== null && newMedication !== '' && patient.medication !== newMedication){
        //     patient.medication = newMedication;
        //     isDataChanged = true;
        // }

        // if (newFollowUp !== null && newFollowUp !== '' && patient.followUp !== newFollowUp) {
        //     patient.followUp = newFollowUp;
        //     isDataChanged = true;
        // }

        // if (newNotes !== null && newNotes !== '' && patient.notes !== newNotes) {
        //     patient.notes = newNotes;
        //     isDataChanged = true;
        // }

        // if (updatedBy !== null && updatedBy !== '') {
        //     patient.changedBy = updatedBy;
        // }

        // if (isDataChanged === false) return;

        patient.medicalRecord = newMedicalRecords;
        patient.changedBy = updatedBy;
        patient.imageUrls = imageUrls;
        patient.reasonForUpdate = 'medicalRecordsUpdate'
        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(patientId, buffer);
    }

    //Retrieves patient medical history based on patientId
    async getPatientHistory(ctx, patientId) {
        
        const patient = await PrimaryContract.prototype.readPatient(ctx, patientId);
        const doctorId = await this.getClientId(ctx);
    
        const permissionArray = patient.permissionGranted;
        if(!permissionArray.includes(doctorId)) {
            throw new Error(`The doctor ${doctorId} does not have permission to patient ${patientId}`);
        }
        let resultsIterator = await ctx.stub.getHistoryForKey(patientId);
        let asset = await this.getAllPatientResults(resultsIterator, true);

        return this.fetchLimitedFields(asset, true, patientId);
    }

    //Retrieves all patients details
    async queryAllPatients(ctx, doctorId) {
        let resultsIterator = await ctx.stub.getStateByRange('', '');
        let asset = await this.getAllPatientResults(resultsIterator, false);
        const permissionedAssets = [];
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            if ('permissionGranted' in obj.Record && obj.Record.permissionGranted.includes(doctorId)) {
                permissionedAssets.push(asset[i]);
            }
        }

        return this.fetchLimitedFields(permissionedAssets);
    }

    fetchLimitedFields = (asset, medicalHistory = false, pId = '') => {
        let allRecords = [];
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            asset[i] = {
                patientId: obj.Key,   
            }

            if(!medicalHistory){
                asset[i].firstName = obj.Record.firstName,
                asset[i].lastName = obj.Record.lastName,
                asset[i].age= obj.Record.age,
                asset[i].gender =  obj.Record.gender,
                // asset[i].weight = obj.Record.weight,
                asset[i].bloodGroup = obj.Record.bloodGroup
            }
            if(medicalHistory && obj.Record.changedBy === pId )
                continue;

            if(medicalHistory){
                // asset[i].reasonsForVisit =  obj.Record.reasonsForVisit,
                // asset[i].allergies =  obj.Record.allergies,
                // asset[i].symptoms = obj.Record.symptoms,
                // asset[i].diagnosis =  obj.Record.diagnosis,
                // asset[i].treatment = obj.Record.treatment,
                // asset[i].medication = obj.Record.medication,
                // asset[i].followUp = obj.Record.followUp
                // asset[i].notes = obj.Record.notes
                asset[i].changedBy = obj.Record.changedBy;
                asset[i].medicalRecord = obj.Record.medicalRecord;
                if(obj.Record.imageUrls)
                    asset[i].imageUrls = obj.Record.imageUrls;
                asset[i].Timestamp = obj.Timestamp;
            }
            allRecords.push(asset[i]);
        }

        return allRecords;
    };


    //  Get the client used to connect to the network
    async getClientId(ctx) {
        const clientIdentity = ctx.clientIdentity.getID();
        console.info(clientIdentity);
        // Ouput of the above - 'x509::/OU=client/CN=Doc-1::/C=US/ST=North Carolina/L=Durham/O=hosp1.ehrNet.com/CN=ca.hosp1.ehrNet.com'
        let identity = clientIdentity.split('::');
        identity = identity[1].split('/')[2].split('=');
        // ['CN', 'hosp1admin']
        return identity[1].toString('utf8');
    }
}
module.exports = DoctorContract;