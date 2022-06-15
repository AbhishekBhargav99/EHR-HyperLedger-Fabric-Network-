const redis = require('redis');
const util = require('util');

async function inRedis(){
    let redisPassword = 'hosp1ehrNet';
    let redisClient = redis.createClient(redisUrl);
    redisClient.AUTH(redisPassword);
    redisClient.SET('hosp1admin', redisPassword);
    redisClient.QUIT();
}
async function initRedis() {
    // let redisUrl = 'redis://127.0.0.1:6379';
    let redisPassword = 'hosp1ehrNet';
    // let redisUrl = `redis://:${redisPassword}@localhost:6379`
    let redisUrl = 'redis://127.0.0.1:6379';
    let redisClient = redis.createClient(redisUrl);
    redisClient.AUTH(redisPassword);

    // console.log(redisClient.isOpen);
    // redisClient.AUTH(redisPassword, function(err, reply){
    //     console.log("error : ", err);
    //     console.log("reply : ", reply);
    // });

    // redisClient.SET('hosp1admin', redisPassword);
    redisClient.SET('PID1', 'Patient 1');
    redisClient.QUIT();
    // console.log(redisClient.isOpen);

    // redisClient.disconnect();
    // let redisUrl = 'redis://127.0.0.1:6380';
    // let redisclient = redis.createClient(redisUrl);
    // await redisclient.connect();
    // let jsonData = {
    //     id : 'DOC1',
    //     email: 'doc1@gmail.com',
    // }
    // let data = await redisclient.SET('DOC1', JSON.stringify(jsonData));
    // console.log(redisclient.isOpen, data); // this is true
    // await redisclient.disconnect();
    // console.log(redisclient.isOpen, data);
}


async function testJson(){
    let redisPassword = 'hosp1ehrNet';
    let redisUrl = 'redis://127.0.0.1:6380';
    let redisClient = redis.createClient(redisUrl);
    redisClient.AUTH(redisPassword);
    let obj = {
    email : 'bhargavab720@gmail.com',
    contact: '7889963163',
    password: 'abhi@123',
    };

    redisClient.on(err => {
        console.log("error : ", err)
    })

    redisClient.SET('PID0', JSON.stringify(obj));
    redisClient.QUIT();
    
     
    

}

async function getClient(redisUrl){
    
    let redisPassword = 'hosp1ehrNet';
    const redisClient = redis.createClient(redisUrl);
    redisClient.AUTH(redisPassword);
    redisClient.get = util.promisify(redisClient.get);
    return redisClient;
}

async function getRedis(){

    console.log("-------------");
    let redisUrl = 'redis://127.0.0.1:6379';
   const redisClient = await getClient(redisUrl);
   const val = await redisClient.get("PID1");
   console.log("value : ", val);
   redisClient.QUIT();

}


async function getInfo() {
    let redisPassword = 'hosp1ehrNet';
    let redisUrl = `redis://:${redisPassword}@localhost:6379`;
    let redisClient = redis.createClient({
        url: `redis://:${redisPassword}@127.0.0.1:6379`
    });
    // await redisClient.connect();
    let data = redisClient.GET('PID0');
    console.log("data", data);
    redisClient.QUIT();

}

async function main(){
    // await inRedis();
    // await initRedis();
    // await testJson();
    await getRedis();
    // await getInfo()
}

main();