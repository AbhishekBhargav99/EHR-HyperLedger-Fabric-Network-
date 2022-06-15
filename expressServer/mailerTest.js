const express = require('express')
const nodemailer = require('nodemailer');
const google = require('googleapis');
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});

const app = express()
const cors = require('cors');
app.use(express.urlencoded({extended: false}));
// parse json
app.use(express.json());
app.use(cors());
// const OAuth2 = google.auth.OAuth2;



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
//   to: 'riseabsei720@gmail.com',
//   subject: 'Nodemailer Project',
//   text: 'Hi from your nodemailer project'
// };


// transporter.sendMail(mailOptions, function(err, data ) {
//   if (err) {
//     console.log("Error " + err);
//   } else {
//     console.log("Email sent successfully");
//   }
// });



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


app.post('/sendMail', async (req, res) => {
  let {email, otp} = req.body;
  const mail = {
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: 'OTP Verification Code',
    text: `
      "Your Otp is" ${otp}, expires in 10 mins`,
    }

    transporter.sendMail(mail, (err, data) => {
      if (err) {
          res.json({
              status: 'fail',
          })
      } else {
          res.json({
              status: 'success'
          })
      }
  })
})


app.listen(3001, () => {
  console.log(`Server listening on port 3001`)
})
