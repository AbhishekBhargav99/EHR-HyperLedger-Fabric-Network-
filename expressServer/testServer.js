const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
app.use(express.json());

let refreshTokens = [];
const encrytLib = require('./middleware/encryptionlib');
const encrypt = encrytLib.encrypt;
const decrypt = encrytLib.decrypt;
const cors = require('cors');

app.use(express.urlencoded({extended: false}));
// parse json
app.use(express.json());
app.use(cors());

const posts = [
    {
        username: 'Abhi',
        title: 'Post 1'
    },
    {
        username: 'Rahul',
        title: 'Post 2'
    }
]

app.post('/refreshToken', (req, res) => {
    // console.log()
    const refreshToken = req.body.refreshToken;
    console.log('refresh -> ', refreshToken);
    console.log(refreshTokens)
    if(!refreshToken)
        return res.sendStatus(401);
    if(!refreshTokens.includes(refreshToken))
        return res.sendStatus(403);
    
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        const accessToken = generateAccessToken({
            name : user.name,
            role: user.role
        })
        res.json({accessToken: accessToken});
    })
    
})

app.get('/posts', authenticateToken, (req, res) => {

    console.log(req.user);
    // { name: 'Rahul', role: 'Admin', iat: 1648102346 }
    res.json(posts.filter(post => 
        post.username === req.user.name
    ))

    // res.status(200).json(posts);
})

app.post('/login',  (req, res) => {
    const {username, role} = req.body
    const user = {
        name: username,
        role: role
    }
    // require('crypto').randomBytes(64).toString('hex')
    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
    refreshTokens.push(refreshToken);
    res.json({accessToken: accessToken, refreshToken: refreshToken});
})

function authenticateToken(req, res, next) {
    const token = req.headers['authtoken']
    console.log("token", token)
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    //   console.log(err)
        console.log(user);
      if (err) return res.sendStatus(403)
      req.user = user
      next()
    })
  }

function generateAccessToken(user) {
   return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'});
}


app.get('/encryptText', async (req, res) => {
    newObj = {};
    
    for( key in req.body){
        // console.log(key, req.body[key]);
        newObj[key] = encrypt(req.body[key]).encryptedData;
    }
    res.status(201).json(newObj);
})

app.get('/decryptText', async (req, res) => {
    newObj = {};
    for( key in req.body){
        newObj[key] = decrypt(req.body[key]);
    }
    res.status(201).json(newObj);
})


app.listen(3000,  () => {
  console.log(`Example app listening on port 3000`)
} );
