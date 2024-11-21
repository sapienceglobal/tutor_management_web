import { upload } from "../middlewares/multer.middlewares.js"
import { userRegister, loginUser, checkUser, logoutUser, editUserDetails, updateLocation, admissionForm } from "../controllers/user.controller.js"
import { Router } from "express"
import { verifyjwt } from "../middlewares/auth.middlewares.js"
import path from "path";
import { fileURLToPath } from 'url';



const userRouter = Router()
userRouter.post("/registerUser", upload.single("image"), userRegister)
userRouter.post("/loginUser", loginUser)
// userRouter.post("/loginUserByGoogle",loginUserByGoogle)
userRouter.get("/checkuser", verifyjwt, checkUser)
userRouter.get("/logout", verifyjwt, logoutUser)
userRouter.post("/updatelocation", verifyjwt, updateLocation)
userRouter.post("/admissionform", admissionForm)
userRouter.post("/editdetails", verifyjwt, upload.single("image"), editUserDetails)
userRouter.get("/pdf/:fileName", verifyjwt, (req, res) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const { fileName } = req.params;
    const filePath = path.join(__dirname, "../public/pdfs", fileName);

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ message: "File not found!" });
        }
    });
});
export default userRouter