const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

module.exports = tokenSchema;