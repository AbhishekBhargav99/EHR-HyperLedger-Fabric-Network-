const express = require('express');
const mongoose = require('mongoose');
var Mongoose = require('mongoose').Mongoose;
const jwt = require('jsonwebtoken');

const app = express()
const port = 3000;
const cors = require('cors');
const bcrypt = require('bcrypt');

const dotenv = require('dotenv');
dotenv.config({path: './config.env'});
const DBHP1 = process.env.DATABASEHP1;
const DBHP2 = process.env.DATABASEHP2;
const DBHP3 = process.env.DATABASEHP3;
const userSchema = require('./User');
const connHosp1 = require('./dbs/dbHosp1Conn');
const connHosp2 = require('./dbs/dbHosp2Conn');
const connHosp3 = require('./dbs/dbHosp3Conn');
var modelUserHosp1 = '';
var modelUserHosp2 = '';
var modelUserHosp3 = '';



app.use(express.urlencoded({extended: false}));
// parse json
app.use(express.json());
app.use(cors());

const doctorModels = require('./models/allModels').doctorModels;

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useFindAndModify: false,
    // useCreateIndex: true, 
}

async function formConnections(){
    
    var ins2 = new Mongoose();
    ins2.connect(DBHP2, connectionParams)
    .then( () => {
            console.log('Connection Initialised to Cloud Database 2');
    })
    .catch( err => {
        console.log(err);
    })
    userHospital2 = await ins2.model('users', userSchema);
    var ins3 = new Mongoose();
    ins3.connect(DBHP3, connectionParams)
    .then( () => {
            console.log('Connection Initialised to Cloud Database 3');
    })
    .catch( err => {
        console.log(err);
    })
    userHospital3 = await ins3.model('users', userSchema);

    // dbConnections['1'] = await mongoose.createConnection(DBHP1, connectionParams, () => {
    //     console.log('Hospital 1 Db initialized')
    // })
    // userHospital1 =  dbConnections['1'].model('users', userSchema);
    
    // dbConnections['2'] = await mongoose.createConnection(DBHP2, connectionParams, () => {
    //     console.log('Hospital 2 Db initialized')
    // })
    // userHospital2 = dbConnections['2'].model('users', userSchema);
    
    // dbConnections['3'] = await mongoose.createConnection(DBHP3, connectionParams, () => {
    //     console.log('Hospital 3 Db initialized')
    // })
    // userHospital3 = dbConnections['3'].model('users', userSchema);
}


// formConnections();

async function createModels(){
    modelUserHosp1 = connHosp1.model('users', userSchema);
    modelUserHosp2 = connHosp2.model('users', userSchema);
    modelUserHosp3 = connHosp3.model('users', userSchema);
}

// createModels();





// mongoose.createConnection








app.get('/', async (req, res) => {
    let user = {'message' : 'hi'};
    try{
        user = await User.create({
            name: 'Rahul12',
            age: 12,
            // email : 'abHi@123'
        })
    } catch(e){
        console.log(e.message);
    }
    // let cnt = await User.deleteMany({});
    // console.log(cnt);
    // let allUsers = await User.where('age')
    //                     .gte(12)
    //                     .select('name')
    //                     .limit(2);
    let allUsers = await User.find({});
   
    res.json(allUsers);
    // res.send('Hello World!')
})

// async function createDoctor(hospitalid, data){
//     let doctorData = new 

// }

app.post('/user', async (req, res) => {
    let {hospitalid} = req.headers;
    const {doctorId} = req.body;
    try{
        const userExist = await doctorModels[hospitalid].findOne({doctorId: doctorId});
        
        if(userExist ){
            return res.status(422).json({error: 'User Already Present'});
        }

        const doctor = new doctorModels[hospitalid](req.body);
        const registeredDoc = await doctor.save();
        return res.status(201).json(registeredDoc);

    } catch(err){
        console.log(err.message);
        return res.status(500).json({error: 'Failed to register'});
    }
})

app.get('/users', async (req, res) => {
    let {hospitalid} = req.headers;
    // let users = {'Hi' : 'There'};
    // if(hospitalid === '1'){
    //     users = await modelUserHosp1.find({});
    // }
    // if(hospitalid === '2'){
    //     users = await modelUserHosp2.find({});
    // }
    // if(hospitalid === '3'){
    //     // users = await modelUserHosp3.where('age').gte(13);
    //     users = await modelUserHosp3.find({});
    // }
    try{
        const doctors = await doctorModels[hospitalid].find({});
        return res.status(200).json(doctors); 
    } catch(err){
        console.log(err.message);
        return res.status(500).json({error: 'Could Not Fetch Doctors'});
    }
})

async function authenticateToken(req, res, next){
    const jwtToken = req.headers['authorization']
    // const token = authHeader && authHeader.split(' ')[1];
    if (!jwtToken) 
        return res.status(401).json({error: 'Token missing'});
    try{
        const payload = jwt.verify(jwtToken, process.env.SECRET, (err, user) => {
            if (err) 
                return res.status(500).json({error: 'Payload Changed'});
            req.user = user
            next();
        });
    } catch(err){
        return res.status(500).json({error: 'Payload Changed'});
    }
}

app.post('/changePassword', authenticateToken, async (req, res) => {
    
    let user = req.user;
    console.log('user', user);
    let doctorId = user.id;
    let hospitalId = user.hospitalId
    const {password} = req.body;
    try{
        const hashedPassword =  await bcrypt.hash(password, 12);
        await doctorModels[hospitalId].updateOne(
            {doctorId: doctorId}, 
            {   
                $set:{ password: hashedPassword}
            }
        );
        return res.status(200).json({message: 'Password Changed'});
    }catch(err){
        // console.log(err);
        // console.log(err.message);
        console.log('err');
    }
    


})

app.get('/signin', async (req, res) => {
    try{
        const {doctorId, password} = req.body;
        const { hospitalid } = req.headers;
        if(!doctorId || !password){
            return res.status(400).json({error: 'Fill All Data'});
        }
        const doctorLogin = await doctorModels[hospitalid].findOne({doctorId: doctorId});

        
        if(!doctorLogin)
            return res.status(400).json({error: 'User Does not exitsts'});
        
        
        else{
            const isMatch = await bcrypt.compare(password, doctorLogin.password);
            if(!isMatch)
                return res.status(400).json({error: 'Add valid password'});    
        }
        const token = jwt.sign({id: doctorLogin.doctorId,
            hospitalId: hospitalid,
            role: 'doctor'},
            process.env.SECRET);

        return res.status(200).json({message: 'Sigin success', accessToken: token })

    } catch(err){
        console.log(err);
    }
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})