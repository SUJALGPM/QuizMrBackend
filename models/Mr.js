const mongosoe = require("mongoose");

const mrSchema = new mongosoe.Schema({

    USERNAME: {
        type: String,
        unique: true
        // required: true,
    },
    MRID: {
        type: String,
        required: false,
    },
    PASSWORD: {
        type: String,
        // required: true,
    },
    EMAIL: {
        type: String,
        unique: true,
        // required: true,
    },
    // ACNAME: {
    //     type: String,
    //     required: false
    // },
    ROLE: {
        type: String,
        // required: true,
    },
    HQ: {
        type: String,
        // required : true,
    },
    REGION: {
        type: String,
        // required:true,
    },
    ZONE: {
        type: String,
    },
    BUSINESSUNIT: {
        type: String,
        // required:true

    },
    DOJ: {
        type: String,
        // required:true
    },

    loginLogs: [
        {
            timestamp: {
                type: Date,
                default: Date.now,
            },
            cnt: {
                type: Number,
                required: false,
                default: 0
            },
        },
    ],
})


module.exports = mongosoe.model("Mr", mrSchema);