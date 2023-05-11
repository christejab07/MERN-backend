import { Router } from "express"
const router = Router();

/** import all controllers */
import * as controller from '../controllers/appController.js';
import Auth, { localVariables } from "../middlewares/auth.js";
import { registerMail } from "../controllers/mailer.js";

/** POST method */
router.route('/register').post(controller.register) //register user
router.route('/registerMail').post(registerMail)  //send the email
router.route('/authenticate').post(controller.verifyUser, (req, res) => res.end()) // authenticate user
router.route('/login').post(controller.verifyUser, controller.login) // login in the app

/** GET methods */

router.route('/user/:username').get(controller.getUser) // get user with username
router.route('/generateOTP').get(controller.verifyUser, localVariables, controller.generateOTP) //generate random OTP
router.route('/verifyOTP').get(controller.verifyUser, controller.verifyOTP) //verify generated OTP
router.route('/createResetSession').get(controller.createResetSession) //reset all the variables

/** PUT methods */

router.route('/updateUser').put(Auth, controller.updateUser) //used to update the user's profile
router.route('/resetPassword').put(controller.verifyUser, controller.resetPassword) //used to reset password


export default router;