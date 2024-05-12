import {upload} from "../middlewares/multer.middlewares.js"
import {userRegister,loginUser,checkUser,logoutUser,editUserDetails} from "../controllers/user.controller.js"
import { Router } from "express"
import { verifyjwt } from "../middlewares/auth.middlewares.js"
 
const userRouter=Router()
userRouter.post("/registerUser",userRegister)
userRouter.post("/loginUser",loginUser)
userRouter.get("/checkuser",verifyjwt,checkUser)
userRouter.get("/logout",verifyjwt,logoutUser)
userRouter.post("/editdetails",verifyjwt,upload.single("image"),editUserDetails)
export default userRouter