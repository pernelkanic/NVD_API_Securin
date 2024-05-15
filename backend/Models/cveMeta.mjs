import mongoose from "mongoose";

const history = mongoose.Schema({
    status:{
        type:String,
        default:"info"
    }
    ,
    cvehistory:{
        total : {
            type:Number,
            default:0
        },
        lastUpdated:{
            type:Date,
            
        }
    },
    
})
const historydata = mongoose.model('historydata', history);
export default historydata;