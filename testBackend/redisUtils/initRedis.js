//  Redundant file


// const { RedisClient } = require('redis')
const { RedisClient } = require('redis');
const client = require('./client');



async function main() {
    let hospId = 1;
    let key = 'hosp1admin';
    // let data = await client.getRedisClientData(hospId, key);
    let prms = client.get(hospId, key);
    prms.then(function(val){
        console.log(val);
    })

    // console.log("Data", dat);
    client.exists(hospId, key);


}
main();
