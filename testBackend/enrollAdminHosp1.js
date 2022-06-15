const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, enrollAdmin } = require('../patient-assets/application-javascript/CAUtil.js');
const { buildCCPHosp1, buildWallet } = require('../patient-assets/application-javascript/AppUtil.js');
const walletPath = path.join(__dirname, '../patient-assets/application-javascript/wallet');
const client = require('./redisUtils/client');
const admin1 = 'hosp1admin';
const password = 'hosp1ehrNet';
const mspHosp1 = 'hosp1MSP';
const hospId = 1;


async function main() {
    try {

        await client.setRedisClientData(hospId, admin1, password);
        // build an in memory object with the network configuration (also known as a connection profile)
        const ccp = await buildCCPHosp1();

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        const caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp1.ehrNet.com');

        // setup the wallet to hold the credentials of the application user
        const wallet = await buildWallet(Wallets, walletPath);

        // to be executed and only once per hospital. Which enrolls admin and creates admin in the wallet
        await enrollAdmin(caClient, wallet, mspHosp1, admin1, password);
        
        console.log('msg: Successfully enrolled admin user ' + admin1 + ' and imported it into the wallet');
    } catch (error) {
        console.error(`Failed to enroll admin user ' + ${admin1} + : ${error}`);
        process.exit(1);
    }
}

main();