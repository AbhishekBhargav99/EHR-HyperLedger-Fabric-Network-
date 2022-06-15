const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, enrollAdmin } = require('../patient-assets/application-javascript/CAUtil.js');
const { buildWallet, buildCCPHosp3 } = require('../patient-assets/application-javascript/AppUtil.js');
const walletPath = path.join(__dirname, '../patient-assets/application-javascript/wallet');
const client = require('./redisUtils/client');
const admin3 = 'hosp3admin';
const password = 'hosp3ehrNet';
const mspHosp3 = 'hosp3MSP';
const hospId = 3;


async function main(){
    try {
        await client.setRedisClientData(hospId, admin3, password);
        
        const ccp = await buildCCPHosp3();
        const caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp3.ehrNet.com');
        const wallet = await buildWallet(Wallets, walletPath);
        await enrollAdmin(caClient, wallet, mspHosp3, admin3, password);   
        console.log('msg: Successfully enrolled admin user ' + admin3 + ' and imported it into the wallet');
    } catch (error) {
        console.error(`Failed to enroll admin user ' + ${admin3} + : ${error}`);
        process.exit(1);
    }
}

main();