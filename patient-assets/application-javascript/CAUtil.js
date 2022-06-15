// Enroll the admin of the hospital
exports.enrollAdmin = async (caClient, wallet, orgMspId, adminUserId, adminUserPasswd) => {
    try {
        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get(adminUserId);
        if (identity) {
            console.log('An identity for the admin user already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await caClient.enroll({ 
            enrollmentID: adminUserId, 
            enrollmentSecret: adminUserPasswd,
            attrs: [{
                name: 'userId',
                value: `${adminUserId}`,
                ecert: true,
            },
            {
                name: 'role',
                value: 'admin',
                ecert: true,
            }] 
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: orgMspId,
            type: 'X.509',
        };
        await wallet.put(adminUserId, x509Identity);
        console.log('Successfully enrolled admin user and imported it into the wallet');
    } catch (error) {
        console.error(`Failed to enroll admin user : ${error}`);
    }
};

// Create a new CA client for interacting with CA.
exports.buildCAClient = async (FabricCAServices, ccp, caHostName) => {

    const caInfo = await ccp.certificateAuthorities[caHostName]; // lookup CA details from config
    // console.log("caInfo :: ", caInfo);
    // "certificateAuthorities": {
    //     "ca.org1.example.com": {
    //         "url": "https://localhost:7054",
    //         "caName": "ca-org1",
    //         "tlsCACerts": {
    //             "pem": ["-----BEGIN CERTIFICATE-----\nMIICJzCCAc2gAwIBAgIUBZddG8aoZxgu5xF0aFasgSlqToIwCgYIKoZIzj0EAwIw\ncDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMQ8wDQYDVQQH\nEwZEdXJoYW0xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMjIwMTIyMTkzNzAwWhcNMzcwMTE4MTkzNzAw\nWjBwMQswCQYDVQQGEwJVUzEXMBUGA1UECBMOTm9ydGggQ2Fyb2xpbmExDzANBgNV\nBAcTBkR1cmhhbTEZMBcGA1UEChMQb3JnMS5leGFtcGxlLmNvbTEcMBoGA1UEAxMT\nY2Eub3JnMS5leGFtcGxlLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABOGw\n8g3xurXDAPNdl9qgv2+XihUY6QNiZOKL8FQrXaj9KetaVGCZOlDo0OPSnz6maNCE\n0SqzZW2sR5JVtVAzyemjRTBDMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMBAf8ECDAG\nAQH/AgEBMB0GA1UdDgQWBBR38iYJD255LrUO+3U5ao6N5SV9ejAKBggqhkjOPQQD\nAgNIADBFAiEA2CvSmHxuqjApi0aNEx0VZ3RQGEIb+nbc4MG8elpbaa0CIE9Jzb/e\n72s6Dk/78/Wioz/aas6IeLWE0Z95HeK8FXrI\n-----END CERTIFICATE-----\n"]
    //         },
    //         "httpOptions": {
    //             "verify": false
    //         }
    //     }
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

    console.log(`Built a CA Client named ${caInfo.caName}`);
    return caClient;
};


// Register users
exports.registerAndEnrollUser = async (caClient, wallet, orgMspId, userId, adminUserId, attributes, affiliation) => {
    try {
        // Check to see if we've already enrolled the user
        const userIdentity = await wallet.get(userId);
        if (userIdentity) {
            console.log(`An identity for the user ${userId} already exists in the wallet`);
            throw new Error(`An identity for the user ${userId} already exists in the wallet`);
        }

        // Must use an admin to register a new user
        const adminIdentity = await wallet.get(adminUserId);
        if (!adminIdentity) {
            console.log(`An identity for the admin user ${adminUserId} does not exist in the wallet`);
            throw new Error(`An identity for the admin user ${adminUserId} does not exist in the wallet`);
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

        // Get all the parameters from the JSON string
        attributes = JSON.parse(attributes);
        const firstName = attributes.firstName;
        const lastName = attributes.lastName;
        const role = attributes.role;
        const email = (role === 'doctor') ? attributes.email : '';
        // console.log("Email : ", email);
        const speciality = (role === 'doctor') ? attributes.speciality : '';

        // Register the user, enroll the user, and import the new identity into the wallet.
        // if affiliation is specified by client, the affiliation value must be configured in CA
        // NOTE: Pubic key can be added into attrs
        const secret = await caClient.register({
            affiliation: affiliation,
            enrollmentID: userId,
            // NOTE: Role must be client, other roles access is denied
            role: 'client',
            attrs: [{
                name: 'firstName',
                value: firstName,
                ecert: true,
            },
            {
                name: 'lastName',
                value: lastName,
                ecert: true,
            },
            {
                name: 'role',
                value: role,
                ecert: true,
            },
            {
                name: 'speciality',
                value: speciality,
                ecert: true,
            }, 
            {
                name: 'email',
                value: email,
                ecert: true,

            }],
        }, adminUser);


        const enrollment = await caClient.enroll({
            enrollmentID: userId,
            enrollmentSecret: secret,
            attrs: [{
                name: 'firstName',
                value: firstName,
                ecert: true,
            },
            {
                name: 'lastName',
                value: lastName,
                ecert: true,
            },
            {
                name: 'role',
                value: role,
                ecert: true,
            },
            {
                name: 'speciality',
                value: speciality,
                ecert: true,
            },
            {
                name: 'email',
                value: email,
                ecert: true,

            }],
        });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: orgMspId,
            type: 'X.509',
        };

        await wallet.put(userId, x509Identity);

        console.log(`Successfully registered and enrolled user ${userId} and imported it into the wallet`);
    } catch (error) {
        throw new Error(`Failed to register user ${userId}`);
    }
};

