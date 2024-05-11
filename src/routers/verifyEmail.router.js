import {upload} from "../middlewares/multer.middlewares.js"
import {verifyEmail,verifyEmailPage,forgetPassword,forgetPasswordPage} from "../controllers/verifyEmail.controller.js"
import { Router } from "express"
 
const verifyEmailRouter=Router()
verifyEmailRouter.post("/verifyemail",verifyEmail)
verifyEmailRouter.post("/verifyemailpage",verifyEmailPage)
verifyEmailRouter.post("/forgetpassword",forgetPassword)
verifyEmailRouter.post("/forgetpasswordpage",forgetPasswordPage)
export default verifyEmailRouter