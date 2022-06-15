const mongoose = require('mongoose');
const bcrypt = require('bcrypt');



const doctorSchema = new mongoose.Schema({
    doctorId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    }

})



module.exports = doctorSchema;


