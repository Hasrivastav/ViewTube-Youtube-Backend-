import { Router } from "express";
import { loginUser, registerUser ,logoutUser , refreshAccessToken} from "../controllers/user.controler.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const userRouter = Router()

userRouter.route("/register").post(
    upload.fields([
    { 
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }

    ]),
    registerUser)

userRouter.route("/login").post(loginUser) 


//secured routes 
userRouter.route("/logout").post( verifyJWT , logoutUser)
userRouter.route("/refreshToken").post(refreshAccessToken)




export default userRouter;