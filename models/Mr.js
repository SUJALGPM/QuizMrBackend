const mongosoe = require("mongoose");

const mrSchema = new mongosoe.Schema({

    USERNAME: {
        type: String,
        required: false,
    },
    MRID: {
        type: String,
        required: true,
        unique: true,
    },
    PASSWORD: {
        type: String,
        // required: true,
    },
    EMAIL: {
        type: String,
        required: false,
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

    Doctors: [
        { type: mongosoe.Schema.Types.ObjectId, ref: 'Quiz' }
    ]
})


module.exports = mongosoe.model("Mr", mrSchema);