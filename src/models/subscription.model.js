import mongoose , {Schema} from "mongoose";

const subscriptionScema = new  Schema({

subscriber :{
    type:Schema.Types.ObjectId,
    ref:"User"  //one who is suscriing
},
channel:{
    type:Schema.Types.ObjectId,
    ref:"User"// one who gets subscribd
}

})

export const Subscription = mongoose.model("Subscription" , subscriptionScema)