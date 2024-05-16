import {upload} from "../middlewares/multer.middlewares.js"
import {userRegister,loginUser,checkUser,logoutUser,editUserDetails,updateLocation} from "../controllers/user.controller.js"
import { Router } from "express"
import { verifyjwt } from "../middlewares/auth.middlewares.js"
 
const userRouter=Router()
userRouter.post("/registerUser",upload.single("image"),userRegister)
userRouter.post("/loginUser",loginUser)
userRouter.get("/checkuser",verifyjwt,checkUser)
userRouter.get("/logout",verifyjwt,logoutUser)
userRouter.get("/updatelocation",verifyjwt,updateLocation)
userRouter.post("/editdetails",verifyjwt,upload.single("image"),editUserDetails)
export default userRouter