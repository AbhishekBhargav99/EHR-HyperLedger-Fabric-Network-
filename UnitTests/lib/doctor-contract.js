/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';
const AdminContract = require('./admin-contract.js');
const PrimaryContract = require("./primary-contract.js");
const { Context } = require('fabric-contract-api');

class DoctorContract extends AdminContract {

    //  Redundant
    //Read patient details based on patientId
    async readPatient(ctx, args) {

        args = JSON.parse(args);
        let patientId = args.patientId;
        let doctorId = args.doctorId;
        let asset = await PrimaryContract.prototype.readPatient(ctx, patientId)

        // Check if doctor has the permission to read the patient
        const permissionArray = asset.permissionGranted;
        if(!permissionArray.includes(doctorId)) {
            throw new Error(`The doctor ${doctorId} does not have permission to patient ${patientId}`);
        }
        asset = ({
            patientId: patientId,
            firstName: asset.firstName,
            lastName: asset.lastName,
            age: asset.age,
            gender: asset.gender,
            weight: asset.weight,
            bloodGroup: asset.bloodGroup,
            reasonsForVisit: asset.reasonsForVisit,
            allergies: asset.allergies,
            symptoms: asset.symptoms,
            diagnosis: asset.diagnosis,
            treatment: asset.treatment,
            medication: asset.medication,
            followUp: asset.followUp,
            notes: asset.notes
        });
        return asset;
    }

    //This function is to update patient medical details. This function should be called by only doctor.
    async updatePatientMedicalDetails(ctx, args) {
        args = JSON.parse(args);
        let isDataChanged = false;
        let patientId = args.patientId;
        let doctorId = args.doctorId;
        let newreasonsForVisit = args.reasonsForVisit;
        let newAllergies = args.allergies;
        let newSymptoms = args.symptoms;
        let newDiagnosis = args.diagnosis;
        let newTreatment = args.treatment;
        let newMedication = args.medication;
        let newFollowUp = args.followUp;
        let newNotes = args.notes;
        let updatedBy = args.changedBy;
        const patient = await PrimaryContract.prototype.readPatient(ctx, patientId);
    
        const permissionArray = patient.permissionGranted;
        if(!permissionArray.includes(doctorId)) {
            throw new Error(`The doctor ${doctorId} does not have permission to patient ${patientId}`);
        }

        if (newreasonsForVisit !== null && newreasonsForVisit !== '' && patient.reasonsForVisit !== newreasonsForVisit) {
            patient.reasonsForVisit = newreasonsForVisit;
            isDataChanged = true;
        }

        if (newSymptoms !== null && newSymptoms !== '' && patient.symptoms !== newSymptoms) {
            patient.symptoms = newSymptoms;
            isDataChanged = true;
        }

        if (newDiagnosis !== null && newDiagnosis !== '' && patient.diagnosis !== newDiagnosis) {
            patient.diagnosis = newDiagnosis;
            isDataChanged = true;
        }

        if (newTreatment !== null && newTreatment !== '' && patient.treatment !== newTreatment) {
            patient.treatment = newTreatment;
            isDataChanged = true;
        }

        if(newAllergies !== null && newAllergies !== '' && patient.allergies !== newAllergies){
            patient.allergies = newAllergies;
            isDataChanged = true;
        }

        if(newMedication !== null && newMedication !== '' && patient.medication !== newMedication){
            patient.medication = newMedication;
            isDataChanged = true;
        }

        if (newFollowUp !== null && newFollowUp !== '' && patient.followUp !== newFollowUp) {
            patient.followUp = newFollowUp;
            isDataChanged = true;
        }

        if (newNotes !== null && newNotes !== '' && patient.notes !== newNotes) {
            patient.notes = newNotes;
            isDataChanged = true;
        }

        if (updatedBy !== null && updatedBy !== '') {
            patient.changedBy = updatedBy;
        }

        if (isDataChanged === false) return;

        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(patientId, buffer);
    }

    //Retrieves patient medical history based on patientId
    async getPatientHistory(ctx, args) {
        args = JSON.parse(args);
        let patientId = args.patientId;
        let doctorId = args.doctorId;

        const patient = await PrimaryContract.prototype.readPatient(ctx, patientId);
        // const doctorId = await this.getClientId(ctx);
    
        const permissionArray = patient.permissionGranted;
        if(!permissionArray.includes(doctorId)) {
            throw new Error(`The doctor ${doctorId} does not have permission to patient ${patientId}`);
        }
        // let resultsIterator = await ctx.stub.getHistoryForKey(patientId);
        let resultsIterator = await ctx.stub.getStateByRange('', '');
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
                patientId: obj.Record.patientId,   
            }

            if(!medicalHistory){
                asset[i].firstName = obj.Record.firstName,
                asset[i].lastName = obj.Record.lastName,
                asset[i].age= obj.Record.age,
                asset[i].gender =  obj.Record.gender,
                asset[i].weight = obj.Record.weight,
                asset[i].bloodGroup = obj.Record.bloodGroup
            }
            if(medicalHistory && obj.Record.changedBy === pId )
                continue;

            if(medicalHistory){
                asset[i].reasonsForVisit =  obj.Record.reasonsForVisit,
                asset[i].allergies =  obj.Record.allergies,
                asset[i].symptoms = obj.Record.symptoms,
                asset[i].diagnosis =  obj.Record.diagnosis,
                asset[i].treatment = obj.Record.treatment,
                asset[i].medication = obj.Record.medication,
                asset[i].followUp = obj.Record.followUp
                asset[i].notes = obj.Record.notes
                asset[i].changedBy = obj.Record.changedBy;
            }
            allRecords.push(asset[i]);
        }

        return allRecords;
    };

}
module.exports = DoctorContract;