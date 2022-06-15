const express = require('express')
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express()
const port = 3000
const adminRouter = require('./routes/adminRoutes');
const doctorRouter = require('./routes/doctorRoutes');
const patientRouter = require('./routes/patientRoutes');

const adminModel = require('./models/allModels').adminModel;
const patientModel = require('./models/allModels').patientModel;
const doctorModels = require('./models/allModels').doctorModels;
const tokenModel = require('./models/allModels').tokenModel;


const cors = require('cors');
const client = require('../testBackend/redisUtils/client');
const network = require('../patient-assets/application-javascript/app');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
// const doctorModels = require('./models/allModels').doctorModels;
// const patientModel = require('./models/allModels').patientModel;



const ROLE_ADMIN = "admin";
const ROLE_PATIENT = "patient";
const ROLE_DOCTOR = "doctor";

// parse form data
app.use(express.urlencoded({extended: false}));
// parse json
app.use(express.json());
app.use(cors());

// 403 -> not exist in wallet - forbidden
// 401 -> unauthorised for login
// 428 -> precondition required



app.post('/login', async(req, res) => {
  let {username, password, hospitalId, role} = req.body;
  username = username.trim();
  password = password.trim();
  hospitalId = hospitalId.trim();
  role = role.trim();
  
  if(role === ROLE_ADMIN){

      try{
        if(!username || !password){
            return res.status(400).json({error: 'Fill All Data'});
        }
        const adminLogin = await adminModel[hospitalId].findOne({adminId: username});
        if(!adminLogin)
            return res.status(401).json({error: 'Enter Valid Credentials'});
        
        else{
            const isMatch = await bcrypt.compare(password, adminLogin.password);
            if(!isMatch)
                return res.status(401).json({error: 'Add valid password'});    
        }

        const user = {
          username: username,
          role: ROLE_ADMIN 
        }

        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
        return res.status(200).json({message: 'Sigin success', accessToken: accessToken });

    } catch(err){
        console.log(err);
    }

  }

  if(role === ROLE_DOCTOR){

    try{
      if(!username || !password){
          return res.status(400).json({error: 'Fill All Data'});
      }
      const doctorLogin = await doctorModels[hospitalId].findOne({doctorId: username});
      
      if(!doctorLogin)
          return res.status(401).json({error: 'Enter Valid Credentials'});
      
      else{
          const isMatch = await bcrypt.compare(password, doctorLogin.password);
          if(!isMatch)
              return res.status(401).json({error: 'Add valid password'});    
      }
      const user = {
        username: username,
        role: ROLE_DOCTOR
      }

      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
      return res.status(200).json({message: 'Sigin success', accessToken: accessToken });

    } catch(err){
        console.log(err);
    }
    
  }

  if(role === ROLE_PATIENT){
    console.log('patient');
    const hospId = parseInt(hospitalId);
    let pWord = crypto.createHash('sha256').update(password).digest('hex');
    const networkObj = await network.connectToNetwork(username, hospId);

    if(networkObj.error){
      return res.status(403).json({"message" : "Patient does not exists in wallet" });
    }
    let response = await network.invoke(networkObj, true, "PatientContract:getPatientPassword", username);
    if(response.error){
      return res.status(401).json({"message" : "Patient Doesnot exists" });
    }
    else{
        let data = JSON.parse(response.toString());

        const user = {
          username: username,
          role: ROLE_PATIENT
        }
  
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
        if(data.password === pWord)
            return res.status(200).json({message: 'Sigin success', accessToken: accessToken });
        else{
            return res.status(401).json({"message" : "Invalid Credentials" });
        }
    }

   
  }
})




// async function sendMail(email, otp){

// let transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     type: 'OAuth2',
//     user: process.env.MAIL_USERNAME,
//     pass: process.env.MAIL_PASSWORD,
//     clientId: process.env.OAUTH_CLIENTID,
//     clientSecret: process.env.OAUTH_CLIENT_SECRET,
//     refreshToken: process.env.OAUTH_REFRESH_TOKEN
//   }
// });

// let mailOptions = {
//   from: '20jerry98@gmail.com',
//   to: email,
//   subject: 'PASSWORD CHANGE',
//   text: `Your OTP is ${otp}, expires in 1 hour`
// };

// let response = await transporter.sendMail(mailOptions);
// // console.log(response);

// }


// ****************  Sending Mail *****************************

const transport = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use TLS
    auth: {
        user: process.env.SMTP_TO_EMAIL,
        pass: process.env.SMTP_TO_PASSWORD,
    },
  }
  
  
  const transporter = nodemailer.createTransport(transport)
      transporter.verify((error, success) => {
  if (error) {
      //if error happened code ends here
      console.error(error)
  } else {
      //this means success
      console.log('Ready to send mail!')
  }
  })


  async function sendMail(email, otp){
    const mail = {
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: 'OTP Verification Code',
      text: `
        "Your Otp is" ${otp}, expires in 10 mins`,
      }

      try{
        let response = await transporter.sendMail(mail)
      } catch(err){
        throw new Error(err);
      }
  }




// ***************************************************************************



app.post('/signup', async(req, res) => {
  let {username, email, hospitalId, role} = req.body;

  if(!username || !email || !hospitalId || !role){
    console.log('Missing Fields')
    return res.status(400).send({error: "Values missing"});
  }
  console.log(req.body);  
  let dbModel = "";
  if(role === ROLE_PATIENT){
    dbModel = patientModel;
    console.log('body')
    try{
      let user = await dbModel.findOne({patientId : username, email: email});
      if (!user) {
        return res.status(401).json({error: 'Enter Valid Credentials'});
      }
      let token = await tokenModel.findOne({ userId: username });
      if (token) { 
            await token.deleteOne()
      }
      let otp = Math.floor(100000 + Math.random() * 900000);
      await sendMail(email, otp);
      let patToken = new tokenModel({userId : username, token: otp});
      let response = await patToken.save();
      return res.status(200).json({"message" : 'OTP sent'});
    } catch(err){
      console.log(err);
    }

  }
  else if(role === ROLE_DOCTOR){
    dbModel = doctorModels[hospitalId];
    try{
      let user = await dbModel.findOne({doctorId : username, email: email});
      if (!user) {
        console.log('Doctor not present');
        return res.status(401).json({error: 'Enter Valid Credentials'});
      }
      let token = await tokenModel.findOne({ userId: username });
      if (token) { 
            await token.deleteOne()
      }

      let otp = Math.floor(100000 + Math.random() * 900000);
      await sendMail(email, otp);

      
        let docToken = new tokenModel({userId : username, token: otp});
        let response = await docToken.save();
        return res.status(201).json({"message" : 'OTP sent'});
      

    } catch(err){
      console.log(err);
    }
  }
});

app.post('/resetPassword', async (req, res) => {
  let {username, otp, role, newPassword, hospitalId} = req.body;
  let dbModel = "";
  
  if(role === ROLE_PATIENT){
    console.log(req.body);
    dbModel = patientModel;
    try{
        let token = await tokenModel.findOne({ userId: username, token : otp });
        
        if (!token) { 
          return res.status(401).json({error: 'Enter Valid Credentials'});
        }

        let curTime = new Date();
        if(curTime.getTime() - token.createdAt.getTime()  >= 3600000){
          return res.status(400).json({error: "OTP Timeout"})
        }

        const hospId = parseInt(hospitalId);
        
        let args = {
            patientId: username, 
            newPassword: newPassword
        };
        args = [JSON.stringify(args)];

        const networkObj = await network.connectToNetwork(username, hospId);
        const response = await network.invoke(networkObj, false, 'PatientContract:updatePatientPassword', args);
        
        if(response.error){
            console.log('Error Occured');
            console.log(response.error)
            return res.status(400).json({
                'message': "Could not grant Request",
            })
        }
        
        return res.status(200).json({'message': 'Password Changed'});
    } catch(err){
      console.log(err);
    }

  }

  if(role === ROLE_DOCTOR){
    dbModel = doctorModels[hospitalId];
    try{
      let token = await tokenModel.findOne({ userId: username, token : otp });
      if (!token) { 
        return res.status(401).json({error: 'Enter Valid Credentials'});
      }
      // console.log(token.createdAt.getTime());
      // // console.log(token.createdAt-)
      let curTime = new Date();
        if(curTime.getTime() - token.createdAt.getTime()  >= 360000){
          return res.status(400).json({error: "OTP Timeout"})
        }

        const hashedPassword =  await bcrypt.hash(newPassword, 12);
        await dbModel.updateOne(
            {doctorId: username}, 
            {   
                $set:{ password: hashedPassword}
            }
        );
        return res.status(200).json({'message': 'Password Changed'});
    } catch(err){
      console.log(err);
    }
  }

})




app.use('/adminApi', adminRouter);
app.use('/doctorApi', doctorRouter);
app.use('/patientApi', patientRouter);


app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})