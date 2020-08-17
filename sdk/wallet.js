var obdApi = new ObdApi();

/**
 *  Connect to a OBD
 *  @param nodeAddress 
 *  @param callback 
 *  @param globalCallback 
 */
function connectToServer(nodeAddress, callback, globalCallback) {
    obdApi.connectToServer(nodeAddress, callback, globalCallback);
}

/**
 *  connect to a remote counterparty's OBD server.
 *  @param info remote_node_address
 *  @param callback 
 */
function connectPeer(info, callback) {
    obdApi.connectPeer(info, callback);
}

/**
 * Mode 1 local OBD:
 * 
 * Type -102004 Protocol is used to sign up a new user by 
 * hirarchecal deterministic wallet system integrated in 
 * the local client. Client generates mnemonic words and 
 * the hash of the mnemonic words as the UserID.
 */
function genMnemonic() {
    let mnemonic = btctool.generateMnemonic(128);
    console.info('SDK: - genMnemonic = ' + mnemonic);
    return mnemonic;
}

/**
 * Type -103000 Protocol generates a new address from mnemonic words. 
 * This message requires to generate address on local device from 
 * mnemonic words using BIP32. Clients interacting with obd, e.g wallets, 
 * shall implement this HD mechanism for security guarantees. Mnemonic words 
 * shall be kept in a safe place, and never be shared with any obd instances.
 * 
 * @param mnemonic 
 * @param index
 * @param netType true: testnet  false: mainnet
 */
function genAddressFromMnemonic(mnemonic, index, netType) {
    let result = btctool.generateWalletInfo(mnemonic, index, netType);
    console.info('SDK: - genAddressFromMnemonic = ' + JSON.stringify(result));
    return result;
}

/**
 * Type -102001 Protocol is used to login to OBD.
 * @param mnemonic 
 * @param callback 
 */
// function logIn(mnemonic, callback) {
//     obdApi.logIn(mnemonic, callback);
// }

function logIn(mnemonic) {
    return new Promise((resolve, reject) => {
        obdApi.logIn(mnemonic, function(e) {
            console.info('SDK: -102001 logIn = ' + JSON.stringify(e));
            // SDK API: Register event needed for listening.
            registerEvent(true);
    
            // SDK API: Save mnemonic
            saveMnemonic(e.userPeerId, mnemonic);
    
            resolve(e);
        });
    })
}
