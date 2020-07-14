class Wallet {

    constructor() {
        this.obdApi = new ObdApi();
    }

    /**
     * 
     * @param mnemonic 
     * @param callback 
     */
    logIn(mnemonic, callback) {
        obdApi.logIn(mnemonic, callback);
    }
}