const mongoose = require('mongoose');
const bcrypt = require('bcrypt');



const doctorSchema = new mongoose.Schema({
    adminId: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
})



module.exports = doctorSchema;