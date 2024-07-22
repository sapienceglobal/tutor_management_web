import mongoose from "mongoose"

const admissionForm = new mongoose.Schema({

    fullName: {
        type: String,
        required: [true, "please provide name"],
    },

   fathersName: {
        type: String,
        required: [true, "please provide fathersName"],
    },
    mobNo: {
        type: Number,
        required: [true, "please provide mobile number"],
    },
    location: {
        type: String,
        required: [true, "please provide location"],
    }

})
const AdmissionForm = mongoose.model("admissionForm", admissionForm)
export default AdmissionForm
