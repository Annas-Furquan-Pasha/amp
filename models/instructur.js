const mongoose = require('mongoose')

const instructorSchema = mongoose.Schema(
    {
        name: {
            type : String,
        },
        email: {
            type: String,
        },
        offering:{
            type: String,
        },
        course: {
            type: String,
        },
        campus:{
            type: String,
        },
        delivery :{
            type: String,
        }
    }, { timestamps: true }
)

const Instructor = mongoose.model("Instructor", instructorSchema)

module.exports = Instructor;