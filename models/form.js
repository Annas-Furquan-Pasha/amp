const mongoose = require("mongoose");

const formSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    instructorName: {
        type: String,
        required: true
    },
    availability: {
        type: String,
        required: true,
        ref: 'Instructur'
    },
    instructorId : {
        type: String,
        required: true
    }
});

const FormData = mongoose.model("FormData", formSchema);

module.exports = FormData;
