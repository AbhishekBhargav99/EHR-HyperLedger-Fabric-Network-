const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser } = require('../patient-assets/application-javascript/CAUtil.js');
const walletPath = path.join(__dirname, '/../patient-assets/application-javascript/wallet');
const { buildCCPHosp1, buildCCPHosp2, buildWallet, buildCCPHosp3 } = require('../patient-assets/application-javascript/AppUtil.js');
const client = require('./redisUtils/client');

let mspOrg;
let adminId;
let caClient;

// const attr = {
//     firstName: doctor.firstName,
//     lastName: doctor.lastName,
//     role: 'doctor',
//     speciality: doctor.speciality
// }
// userId = PID0, Hosp1-DOC0
// const attr = {
//     firstName: patient.firstName,
//     lastName: patient.lastName, 
//     role: 'patient',
// }

exports.enrollRegisterUser = async function (hospId, userId, attributes) {
    try {
        const wallet = await buildWallet(Wallets, walletPath);
        hospId = parseInt(hospId);
        if (hospId === 1) {
            const ccp = await  buildCCPHosp1();
            caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp1.ehrNet.com');
            mspOrg = 'hosp1MSP';  adminId = 'hosp1admin';
        } else if (hospId === 2) {
            const ccp = await buildCCPHosp2();
            caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp2.ehrNet.com');
            mspOrg = 'hosp2MSP';  adminId = 'hosp2admin';
        } else if (hospId === 3) {
            const ccp = await buildCCPHosp3();
            caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp3.ehrNet.com');
            mspOrg = 'hosp3MSP';  adminId = 'hosp3admin';
        }

        
        await registerAndEnrollUser(caClient, wallet, mspOrg, userId, adminId, attributes);
        console.log('Successfully enrolled user ' + userId + ' and imported it into the wallet');
    } catch (error) {
        console.log(error);
        console.error(`Failed to register user "${userId}": ${error}`);
        process.exit(1);
    }
};