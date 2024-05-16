import { Router } from "express"
import { verifyjwt } from "../middlewares/auth.middlewares"



const userLocation=Router()
userLocation.post("/getlocation",userRegister)
export default userLocation