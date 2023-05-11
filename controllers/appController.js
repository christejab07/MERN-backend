import userModel from "../model/user.model.js"
import bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator'
import Jwt from "jsonwebtoken";
import ENV from '../config.js';

/** middleware to verify user */
export async function verifyUser(req, res, next) {
     try {
          const { username } = req.method == "GET" ? req.query : req.body;
          // check the user existence
          let exist = await userModel.findOne({ username })
          if (!exist) return res.status(404).send({ error: "Can't find User!" })
          next();
     } catch (error) {
          return res.status(404).send({ error: "Authentication error" })
     }
}

/** POST: http://localhost:8080/api/register
 * @param : {
  "username": "example123",
  "password": "admin@123",
  "email": "example@gmail.com",
  "firstName": "bill",
  "lastName": "weasley",
  "mobile": 032894768,
  "address": "Rue 218, Lumiere du Sud, Tarin",
  "profile": ""
  }
 */
export async function register(req, res) {

     try {
          const { username, password, profile, email } = req.body;

          //check for existing username
          const existUsername = new Promise((resolve, reject) => {
               userModel.findOne({ username })
                    .then((user) => {
                         if (user) reject({ error: "Please use another name, this one is already taken." })

                         resolve()
                    })
                    .catch(error => {
                         return res.status(401).send({error})
                    })
          })


          // check for existing email
          const existEmail = new Promise((resolve, reject) => {
               userModel.findOne({ email })
                    .then((err, email) => {
                         if (err) reject(new Error(err))
                         if (email) reject({ error: "Please use unique Email" })

                         resolve()
                    })

          });


          Promise.all([existUsername, existEmail])
               .then(() => {
                    if (password) {
                         bcrypt.hash(password, 10)
                              .then(hashedPassword => {

                                   const user = new userModel({
                                        username,
                                        password: hashedPassword,
                                        profile: profile || '',
                                        email
                                   });
                                   //return save result as a response
                                   user.save()
                                        .then(result => res.status(201).send({ msg: "User Register Successfully" }))
                                        .catch(error => res.status(500).send({ error }))

                              }).catch(error => {
                                   return res.status(500).send({
                                        error: "Enable to hashed password"
                                   })
                              })
                    }
               }).catch(error => {
                    return res.status(500).send({ error })
               })


     } catch (error) {
          return res.status(500).send(error);
     }

}
/** POST : http://localhost:8080/api/login
 * @param: {
 * "username": "example123",
 * "password": "admin@123"
 *  }
 */
export async function login(req, res) {
     const { username, password } = req.body;

     try {
          userModel.findOne({ username })
               .then(user => {
                    bcrypt.compare(password, user.password)
                         .then(passwordCheck => {
                              if (!passwordCheck) return res.status(400).send({ error: "Don't have such password" })

                              //create jwt token
                              const token = Jwt.sign({
                                   userId: user._id,
                                   username: user.username
                              }, ENV.JWT_SECRET, { expiresIn: '24h' });
                              return res.status(200).send({
                                   msg: "Login happened Successful...!",
                                   username: user.username,
                                   token
                              })
                         })
                         .catch(error => {
                              return res.status(400).send({ error: "Password does not match" })
                         })
               })
               .catch(error => {
                    return res.status(404).send({ error: "Username not found" })
               })
     }
     catch (error) {
          return res.status(500).send({ error })
     }
}
/** GET: http://localhost:8080/api/user/example123 */
export async function getUser(req, res) {
     const { username } = req.params;

     try {
          if (!username) return res.status(501).send({ error: "Invalid username" })
          userModel.findOne({ username })
               .then(user => {
                    if (!user) {
                         return res.status(501).send({ error: "Couldn't find the user" })
                    }

                    /** remove password from the response to be returned */
                    //mongoose return unnecessary data woth object which is in json format
                    else {
                         const { password, ...rest } = Object.assign({}, user.toJSON());
                         console.log(password);
                         return res.status(201).send(rest)
                    }
               })
               .catch(error =>{
                    return res.status(400).send({ error: "Unknown user", error })
               })
     } catch (error) {
          return res.status(404).send({ error: "Cannot find the user data" })
     }
}
/** PUT: http://localhost:8080/api/updateUser
 * @param: {
  "header": "<token>"
}
body: {
     firstName: '',
     address: '',
     profile: ''
}
 */
export async function updateUser(req, res) {
     try {
          // const id = req.query.id;
          const { userId } = req.user;

          if(userId){
               const body = req.body;

               // update data
               userModel.updateOne({ _id: userId}, body)
               .then(data =>{
                    return res.status(201).send({msg: "Record updated...!"})
               })
               .catch(error => {
                    return res.status(401).send({error})
               })
          }
          else{
               return res.status(401).send({error: "User not found...!"})
          }
     } catch (error) {
          console.log(error);
          return res.status(401).send({error});
     }
}
/** GET: http://localhost:8080/api/generateOTP */
export async function generateOTP(req, res) {
     req.app.locals.OTP = await otpGenerator.generate(6, {lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false})
     res.status(201).send({code: req.app.locals.OTP})
}
/** GET: http://localhost:8080/api/verifyOTP */
export async function verifyOTP(req, res) {
     const { code } = req.query;
     if(parseInt(req.app.locals.OTP) === parseInt(code)){
          req.app.locals.OTP = null //reset OTP value
          req.app.locals.resetSession = true //start session for reset password
          return res.status(201).send({msg: "Verify successfully"})
     }
     return res.status(400).send({err: "Invalid OTP"})
}
/** GET: http://localhost:8080/api/createResetSession */
export async function createResetSession(req, res) {
     if(req.app.locals.resetSession){

          return res.status(201).send({flag: req.app.locals.resetSession})
     }
     return res.status(440).send({error: "Session expired!"})
}

/** PUT: http://localhost:8080/api/resetPassword */
export async function resetPassword(req, res) {
     try {
          if(!req.app.locals.resetSession) return res.status(440).send({error: "Session expired!"})

          const { username, password } = req.body;
           
          try {
               userModel.findOne({username})
               .then(user => {
                    bcrypt.hash(password, 10)
                    .then(hashedPassword => {
                         userModel.updateOne({username: user.username}, {password: hashedPassword})
                         .then(data => {
                              req.app.locals.resetSession = false //reset session
                              return res.status(201).send({msg: "Record Updated ..!"})
                         }).catch(err => {
                              throw err;
                         })
                    })
                    .catch(e =>{
                         return res.status(500).send({ error: "Unable to hash the password"})
                    })
               })
               .catch(error =>{
                    return res.status(404).send({error: "Username not found"})
               })
          } catch (error) {
               return res.status(500).send(error)
          }
     } catch (error) {
          return res.status(401).send( error )
     }
}