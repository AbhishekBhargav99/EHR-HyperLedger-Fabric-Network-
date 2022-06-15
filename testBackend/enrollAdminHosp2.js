const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, enrollAdmin } = require('../patient-assets/application-javascript/CAUtil.js');
const { buildCCPHosp2, buildWallet } = require('../patient-assets/application-javascript/AppUtil.js');
const walletPath = path.join(__dirname, '../patient-assets/application-javascript/wallet');
const client = require('./redisUtils/client');
const admin2 = 'hosp2admin';
const password = 'hosp2ehrNet';
const mspHosp2 = 'hosp2MSP';
const hospId = 2;


async function main() {
    try {
        await client.setRedisClientData(hospId, admin2, password)
        const ccp = await buildCCPHosp2();
        const caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp2.ehrNet.com');
        const wallet = await buildWallet(Wallets, walletPath);
        await enrollAdmin(caClient, wallet, mspHosp2, admin2, password);

        console.log('msg: Successfully enrolled admin user ' + admin2 + ' and imported it into the wallet');
    } catch (error) {
        console.error(`Failed to enroll admin user ' + ${admin2} + : ${error}`);
        process.exit(1);
    }
}

main();