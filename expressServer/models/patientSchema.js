const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    phoneNumber:{
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    weight: {
        type: String,
        required: true,
    }
});


module.exports = patientSchema;