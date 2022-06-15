'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser } = require('./CAUtil.js');
const { buildCCPHosp3, buildCCPHosp2, buildCCPHosp1, buildWallet } = require('./AppUtil.js');

const channelName = 'hospitalchannel';
const chaincodeName = 'patient';
const mspOrg1 = 'hosp1MSP';
const mspOrg2 = 'hosp2MSP';
const mspOrg3 = 'hosp3MSP';
const walletPath = path.join(__dirname, 'wallet');

async function buildCCPForHosp(hospitalId){
    let ccp = "";
    if (hospitalId === 1)
        ccp = buildCCPHosp1();
    else if (hospitalId === 2)
        ccp = buildCCPHosp2();
    else if (hospitalId === 3)
        ccp = buildCCPHosp3();
    return ccp;
}

async function createWallet(){
    const walletPath = path.join(process.cwd(), '../patient-assets/application-javascript/wallet/');
    const wallet = await buildWallet(Wallets, walletPath);
    return wallet;
}

async function buildCAClientForHospital(hospitalId){
    const ccp = await buildCCPForHosp(hospitalId);
    let caClient = "";
    if (hospitalId === 1) {
        caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp1.ehrNet.com');
    } else if (hospitalId === 2) {
        caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp2.ehrNet.com');
    } else if (hospitalId === 3) {
        caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp3.ehrNet.com');
    }
    return caClient;
}


exports.doesUserExists = async function(userId){
    try{
        const wallet = await createWallet();
        const userExists = await wallet.get(userId);
        if(userExists){
            return true;
        } else{
            return false;
        }
        
    } catch(err){
        const response = {};
        response.error = err;
        return response;
    }
}


exports.connectToNetwork = async function (userId, hospId = 1) {
    const gateway = new Gateway();

    let ccp = await buildCCPForHosp(hospId);

    try {
        const wallet = await createWallet();
        const userExists = await wallet.get(userId);
        if (!userExists) {
            console.log('An identity for the user : ' + userId + ' does not exist in the wallet');
            const response = {};
            response.error = 'An identity for the user ' + userId + ' does not exist in the wallet. Register ' + userId + ' first';
            return response;
        }

        
        //  setup the gateway instance
        //  The user will now be able to create connections to the fabric network and be able to
        //  submit transactions and query. All transactions submitted by this gateway will be
        //  signed by this user using the credentials stored in the wallet.
         
        // using asLocalhost as this gateway is using a fabric network deployed locally
        await gateway.connect(ccp, {
            wallet,
            identity: userId,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = await network.getContract(chaincodeName);

        const networkObj = {
            contract: contract,
            network: network,
            gateway: gateway,
        };
        console.log('Succesfully connected to the network.');
        return networkObj;
    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
        const response = {};
        response.error = error;
        return response;
    }
};



exports.invoke = async function (networkObj, isQuery, func, args = '') {
    try {
        if (isQuery === true) {
            const response = await networkObj.contract.evaluateTransaction(func, args);
            await networkObj.gateway.disconnect();
            return response;
        } else {
            if (args) {
                args = JSON.parse(args[0]);
                args = JSON.stringify(args);
            }
            const response = await networkObj.contract.submitTransaction(func, args);
            await networkObj.gateway.disconnect();
            return response;
        }
    } catch (error) {
        const response = {};
        response.error = error;
        console.log(error);
        console.error("#################Failed to submit or evaluate transaction: ###############");
        return response;
    }
};


// attributes JSON string in which userId, hospitalId and role must be present.
//  Creates a patient/doctor and adds to the wallet to the given hospitalId
exports.registerUser = async function (attributes) {
    // console.log("")
    console.log("attr ;", attributes);
    const attrs = JSON.parse(attributes);
    const hospitalId = parseInt(attrs.hospitalId);
    const userId = attrs.userId;

    if (!userId || !hospitalId) {
        const response = {};
        response.error = 'Error! You need to fill all fields before you can register!';
        return response;
    }

    try {
        const wallet = await buildWallet(Wallets, walletPath);
        const caClient = await buildCAClientForHospital(hospitalId);

        if (hospitalId === 1) {
            await registerAndEnrollUser(caClient, wallet, mspOrg1, userId, 'hosp1admin', attributes);
        } else if (hospitalId === 2) {
            await registerAndEnrollUser(caClient, wallet, mspOrg2, userId, 'hosp2admin', attributes);
        } else if (hospitalId === 3) {
            await registerAndEnrollUser(caClient, wallet, mspOrg3, userId, 'hosp3admin', attributes);
        }
        // console.log("attributes", attributes);
        // console.log("attr", attr);
        console.log(`Successfully registered user: + ${userId}`);
        const response = 'Successfully registered user: ' + userId;
        return response;
    } catch (error) {
        console.error(`Failed to register user doc + ${userId} + : ${error}`);
        const response = {};
        response.error = error;
        return response;
    }
};



exports.getAllDoctorsByHospitalId = async function (networkObj, hospitalId) {
    // Get the User from the identity context
    const users = await  networkObj.gateway.identityContext.user;
    // console.log("users: ", users);
    // user - User{name : hosp1admin, certificate, }
    let caClient;
    const result = [];
    try {

        const ccp = await buildCCPForHosp(hospitalId);
        if (hospitalId === 1) {
            caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp1.ehrNet.com');
        } else if (hospitalId === 2) {
            caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp2.ehrNet.com');
        } else if (hospitalId === 3) {
            caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp3.ehrNet.com');
        }

        // Use the identity service to get the user enrolled using the respective CA
        const idService = caClient.newIdentityService();
        // console.log("idService : ", idService);
        const userList = await idService.getAll(users);
        // console.log("idService", idService);
        // IdentityService {
        //   client: FabricCAClient {
        //     _caName: 'ca-hosp1',

        // console.log("userList", userList);
        // userList {
        //   result: {
        //     identities: [
        //       [Object], [Object],
        //       [Object], [Object],
        //       [Object], [Object],
        //       [Object], [Object],
        //       [Object]
        //     ],
        //     caname: 'ca-hosp1'
        //   },
        //   errors: [],
        //   messages: [],
        //   success: true
        // }
        // for all identities the attrs can be found
        const identities = userList.result.identities;

        // Cannot reference identities reference -> IDK
        for (let i = 0; i < identities.length; i++) {
            let tmp = {};
            // console.log("-------------------Identity : " + i + " -----------------");
            // console.log(identities[i]);
            if (identities[i].type === 'client') {
                tmp.id = identities[i].id;
                tmp.role = identities[i].type;
                let attributes = identities[i].attrs;
                // Doctor object will consist of firstName and lastName
                for (let j = 0; j < attributes.length; j++) {
                    if (attributes[j].name.endsWith('Name') || attributes[j].name === 'role' || attributes[j].name === 'speciality' || attributes[j].name === 'email') {
                        tmp[attributes[j].name] = attributes[j].value;
                    }
                }
                result.push(tmp);
            }
        }
    } catch (error) {
        console.error(`Unable to get all doctors : ${error}`);
        const response = {};
        response.error = error;
        return response;
    }
    // return result.filter(
    //     function (result) {
    //         return result.role === 'doctor';
    //     },
    // );

    
    let newArr = result.filter(
        (result => {
            return result.role === 'doctor';
        })
        ) .map( (doctor) => {
            return ({
                id: doctor.id,
                firstName: doctor.firstName,
                lastName : doctor.lastName,
                speciality: doctor.speciality,
                email: doctor.email
            })
        });

    return newArr;
};


exports.validateAdminbyHospitalId = async function (networkObj, hospitalId) {
    let caClient;
    const result = [];
    try {
        const users = networkObj.gateway.identityContext.user;
        if (hospitalId === 1) {
            const ccp = buildCCPHosp1();
            caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp1.ehrNet.com');
        } else if (hospitalId === 2) {
            const ccp = buildCCPHosp2();
            caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp2.ehrNet.com');
        } else if (hospitalId === 3) {
            const ccp = buildCCPHosp3();
            caClient = await buildCAClient(FabricCAServices, ccp, 'ca.hosp3.ehrNet.com');
        }

        const idService = caClient.newIdentityService();
        try{
            const canAcessuserList = await idService.getAll(users);
            return true;
        } catch(err){
            err = "UnAuthorized Access";
            const response = {};
            response.error = err;
            return response;   
        }
    } catch( err ){
        err = "UnAuthorized Access";
        const response = {};
        response.error = err;
        return response;   
    }
  
};

