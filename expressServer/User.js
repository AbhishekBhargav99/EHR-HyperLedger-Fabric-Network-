const mongoose  = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    age: Number,
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    createdAt: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    },
    updatedAt: {
        type: Date,
        default: () => new Date().getTime()
    },
    hobbies: [String],
    bestFriend: mongoose.Schema.Types.ObjectId,
    address: {
        street: String,
        city: String
    }
})

// collection name is User
// module.exports =  mongoose.model("users", userSchema);
module.exports =  userSchema