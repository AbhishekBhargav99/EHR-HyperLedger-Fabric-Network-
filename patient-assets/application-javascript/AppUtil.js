'use strict';

const fs = require('fs');
const path = require('path');

exports.prettyJSONString = (inputString) => {
	if (inputString) {
		 return JSON.stringify(JSON.parse(inputString), null, 2);
	}
	else {
		 return inputString;
	}
}


exports.buildWallet = async (Wallets, walletPath) => {
	// Create a new  wallet : Note that wallet is for managing identities.
	let wallet;
	if (walletPath) {
		wallet = await Wallets.newFileSystemWallet(walletPath);
		console.log(`Built a file system wallet at ${walletPath}`);
	} else {
		wallet = await Wallets.newInMemoryWallet();
		console.log('Built an in memory wallet');
	}

	return wallet;
};

exports.buildCCPHosp1 = () => {
    // load the common connection configuration file
    const ccpPath = path.resolve(__dirname, '..', '..', 'hospitalNetwork',
      'organizations', 'peerOrganizations', 'hosp1.ehrNet.com', 'connection-hosp1.json');
    const fileExists = fs.existsSync(ccpPath);
    if (!fileExists) {
      throw new Error(`no such file or directory: ${ccpPath}`);
    }
    const contents = fs.readFileSync(ccpPath, 'utf8');
  
    // build a JSON object from the file contents
    const ccp = JSON.parse(contents);
  
    console.log(`Loaded the network configuration located at ${ccpPath}`);
    return ccp;
};


exports.buildCCPHosp2 = () => {
    // load the common connection configuration file
    const ccpPath = path.resolve(__dirname, '..', '..', 'hospitalNetwork',
      'organizations', 'peerOrganizations', 'hosp2.ehrNet.com', 'connection-hosp2.json');
    const fileExists = fs.existsSync(ccpPath);
    if (!fileExists) {
      throw new Error(`no such file or directory: ${ccpPath}`);
    }
    const contents = fs.readFileSync(ccpPath, 'utf8');
  
    // build a JSON object from the file contents
    const ccp = JSON.parse(contents);
  
    console.log(`Loaded the network configuration located at ${ccpPath}`);
    return ccp;
};

exports.buildCCPHosp3 = () => {
    // load the common connection configuration file
    const ccpPath = path.resolve(__dirname, '..', '..', 'hospitalNetwork',
      'organizations', 'peerOrganizations', 'hosp3.ehrNet.com', 'connection-hosp3.json');
    const fileExists = fs.existsSync(ccpPath);
    if (!fileExists) {
      throw new Error(`no such file or directory: ${ccpPath}`);
    }
    const contents = fs.readFileSync(ccpPath, 'utf8');
  
    // build a JSON object from the file contents
    const ccp = JSON.parse(contents);
  
    console.log(`Loaded the network configuration located at ${ccpPath}`);
    return ccp;
};