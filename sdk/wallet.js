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
 * Type -102004 Protocol is used to sign up a new user 
 * by hirarchecal deterministic wallet system integrated in OBD.
 */
function genMnemonic() {
    let mnemonic = btctool.generateMnemonic(128);
    console.info('SDK - genMnemonic = ' + mnemonic);
    sdkSaveMnemonic(mnemonic);
    return mnemonic;
}

/**
 * Type -102001 Protocol is used to login to OBD.
 * @param mnemonic 
 * @param callback 
 */
function logIn(mnemonic, callback) {
    obdApi.logIn(mnemonic, callback);
}

// FOR TEST
// mnemonic words generated with signUp api save to local storage.
function sdkSaveMnemonic(value) {

    // let mnemonic = JSON.parse(sessionStorage.getItem(itemMnemonic));
    let mnemonic = JSON.parse(localStorage.getItem('saveMnemonic'));

    // If has data.
    if (mnemonic) {
        // console.info('HAS DATA');
        let new_data = {
            mnemonic: value,
        }
        mnemonic.result.push(new_data);
        // sessionStorage.setItem(itemMnemonic, JSON.stringify(mnemonic));
        localStorage.setItem('saveMnemonic', JSON.stringify(mnemonic));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                mnemonic: value
            }]
        }
        // sessionStorage.setItem(itemMnemonic, JSON.stringify(data));
        localStorage.setItem('saveMnemonic', JSON.stringify(data));
    }
}