import mongoose from "mongoose"; 

let admissionFormSchema=new mongoose.Schema({
fullName:{
    type: String,
        required: true
},
fathersName:{
    type: String,
    required: true
},
mobile:{
    type:number,
    required: true
},
location:{
    type: String,
    required: true
}
})

let admissionForm=mongoose.model("admissionForm",admissionFormSchema)
export default admissionForm;