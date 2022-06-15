// const { resolve } = require('path');
const redis = require('redis');
const util = require('util');

function getredisCredentials(hospId){
    let redisUrl = '';
    let redisPassword = '';
    if(hospId === 1){
        redisUrl = 'redis://127.0.0.1:6379';
        redisPassword = 'hosp1ehrNet';
    }
    else if(hospId === 2){
        redisUrl = 'redis://127.0.0.1:6380';
        redisPassword = 'hosp2ehrNet';
    }
    else if( hospId === 3){
        redisUrl = 'redis://127.0.0.1:6381';
        redisPassword = 'hosp3ehrNet';
    }
    return { redisUrl: redisUrl, redisPassword: redisPassword};
}

async function getClient(hospId){

    const {redisUrl, redisPassword} = getredisCredentials(hospId);
    const redisClient = redis.createClient(redisUrl);
    redisClient.AUTH(redisPassword);
    redisClient.get = util.promisify(redisClient.get);
    return redisClient;
}

exports.getRedisClientData = async function(hospId, username){
    const redisClient = await getClient(hospId);
    const data = await redisClient.get(username);
    // console.log("value : ", data);
    redisClient.QUIT();
    return data; 
}

// exports.exists = async function(hospId, key){
//     const {redisUrl, redisPassword} = getredisCredentials(hospId);
//     const redisClient = redis.createClient(redisUrl);
//     await redisClient.AUTH(redisPassword);
//     await redisClient.exists(key, function(err, rep){
//         if(rep === 1){
//             console.log('exists')
//         } else{
//             console.log('not exists')
//         }
//     })
//     // console.log(val);
//     redisClient.QUIT();
// }

// exports.get = async function(hospId, key){
//     const {redisUrl, redisPassword} = getredisCredentials(hospId);
//     const redisClient = redis.createClient(redisUrl);
//     await redisClient.AUTH(redisPassword);
//     return new Promise((resolve) => {

//         redisClient.get(key, function (err, reply) {
//           if(err){
//             resolve(null)
//           }
//           else {
//             resolve(reply)
//           }
//         })
//       })
//       redisClient.QUIT();
// }

exports.setRedisClientData = async function(hospId, username, data){
    const {redisUrl, redisPassword} = getredisCredentials(hospId);
    const redisClient = redis.createClient(redisUrl);
    await redisClient.AUTH(redisPassword);
    redisClient.SET(username, data);
    redisClient.QUIT()
}



// async function main() {
//     let userName = 'hosp1admin';
//     let password = 'hosp5ehrNet';
//     // await setRedisClientData(1, userName, password);
//     await getRedisClient(1, userName);
// }

// main();