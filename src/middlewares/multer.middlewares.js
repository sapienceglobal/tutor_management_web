// import multer from "multer"
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, '')
//     },
//     filename: function (req, file, cb) {
//       cb(null, file.originalname)
//     }
//   })
  
//   export const upload = multer({ storage: storage })


  import multer from "multer";
import path from "path";

// Set the destination to a temporary folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

export const upload = multer({ storage: storage });
