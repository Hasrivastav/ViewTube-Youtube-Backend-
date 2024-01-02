import mongoose, { Schema } from "mongoose";
import { jwt } from "jsonwebtoken";
import bcrypt from "bcrypt"
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName : {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    avatar: {
      type: String, //cludaninary url
      required: true,
    },
    coverimage: {
      type: String, //cludaninary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);




userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
this.password=bcrypt.hash(this.password,10)
next()
})

userSchema.methods.isPasswordCorrect = async function(password){
return await bcrypt.compare(password , this.password)
}
userSchema.methods.generateAccessToken= function(){
 return jwt.sign(
    {
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresTn:process.env.ACCESS_TOKEN_EXPIRY
    }
 )
}
userSchema.methods.generateRefreshToken= function(){
    return jwt.sign(
        {
            _id:this._id,
           
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresTn:process.env.REFRESH_TOKEN_EXPIRY
        }
     )
}

export const USer = mongoose.model("User", userSchema);

//pre is hook which is required as we can not directly has the password it reuns before the"save event
//but the problem here is it will run on any field modification so we used [ismodified function to check for the modification made in password]