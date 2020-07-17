class Wallet {

    constructor() {
        this.obdApi = new ObdApi();
    }

    /**
     * Type -102004 Protocol is used to sign up a new user 
     * by hirarchecal deterministic wallet system integrated in OBD.
     */
    genMnemonic() {
        let mnemonic = btctool.generateMnemonic(128);
        console.info('SDK - genMnemonic = ' + mnemonic);
        this.sdkSaveMnemonic(mnemonic);
        return mnemonic;
    }

    /**
     * Type -102001 Protocol is used to login to OBD.
     * @param mnemonic 
     * @param callback 
     */
    logIn(mnemonic, callback) {
        this.obdApi.logIn(mnemonic, callback);
    }

    
    // mnemonic words generated with signUp api save to local storage.
    sdkSaveMnemonic(value) {

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
}