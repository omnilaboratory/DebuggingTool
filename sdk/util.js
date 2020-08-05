// util.js
// Functions related to save and get data 

//
const kCounterparties = 'counterparties';

//
const kAddress = 'address';

//
const kMnemonic = 'mnemonic';

//
const kChannelID = 'channel_id';

//
const kChannelAddress = 'channel_address';

//
const kTempHash = 'temp_hash';

//
const kFundingBtc = 'funding_btc';

//
const kRoutingPacket = 'routing_packet';

//
const kCltvExpiry = 'cltv_expiry';

//
const kHtlcH = 'htlc_h';

//
const kHtlcR = 'htlc_r';

/**
 * Save RSMC tx temporary private key to local storage
 */
const kTempPrivKey = 'temp_priv_key';

/**
 * Save RSMC tx temporary private key to local storage
 */
const kRsmcTempPrivKey = 'rsmc_temp_priv_key';

/**
 * Save HTLC tx temporary private key to local storage
 */
const kHtlcTempPrivKey = 'htlc_temp_priv_key';

/**
 * Save HTLC htnx tx temporary private key to local storage
 */
const kHtlcHtnxTempPrivKey = 'htlc_htnx_temp_priv_key';

/**
 * Save auto pilot status
 */
const kAutoPilot = 'auto_pilot';

/**
 * Object of IndexedDB.
 */
var db;

/**
 * Object Store (table) name of IndexedDB.
 * Global messages
 */
const kTbGlobalMsg = 'tb_global_msg';

/**
 * Object Store (table) name of IndexedDB.
 * Funding private key
 */
const kTbFundingPrivKey = 'tb_funding_priv_key';

/**
 * Object Store (table) name of IndexedDB.
 * temp private key
 */
// const kTbTempPrivKey = 'tb_temp_priv_key';

/**
 *  List of Counterparties who have interacted
 *  @param myUserID The user id of logged in
 *  @param toNodeID The node id of the counterparty.
 *  @param toUserID The user id of the counterparty.
 */
function saveCounterparties(myUserID, toNodeID, toUserID) {

    let list = JSON.parse(localStorage.getItem(kCounterparties));

    // If has data.
    if (list) {
        // console.info('HAS DATA');
        for (let i = 0; i < list.result.length; i++) {
            // same userID
            if (myUserID === list.result[i].userID) {
                for (let i2 = 0; i2 < list.result[i].data.length; i2++) {
                    // if UserPeerID is same, then NodePeerID is updated.
                    if (list.result[i].data[i2].userID === toUserID) {
                        list.result[i].data[i2].nodeID = toNodeID;
                        localStorage.setItem(kCounterparties, JSON.stringify(list));
                        return;
                    }
                }

                // Add a new data to the userID
                let new_data = {
                    userID: toUserID,
                    nodeID: toNodeID
                }
                list.result[i].data.push(new_data);
                localStorage.setItem(kCounterparties, JSON.stringify(list));
                return;
            }
        }

        // A new User ID.
        let new_data = {
            userID: myUserID,
            data: [{
                userID: toUserID,
                nodeID: toNodeID
            }]
        }
        list.result.push(new_data);
        localStorage.setItem(kCounterparties, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                userID: myUserID,
                data: [{
                    userID: toUserID,
                    nodeID: toNodeID
                }]
            }]
        }
        localStorage.setItem(kCounterparties, JSON.stringify(data));
    }
}

/**
 * Get Lastest Counterparty
 * @param myUserID The user id of logged in
 */
function getCounterparty(myUserID) {

    let data = JSON.parse(localStorage.getItem(kCounterparties));

    // If has data.
    if (data) {
        // console.info('HAS DATA');
        for (let i = 0; i < data.result.length; i++) {
            if (myUserID === data.result[i].userID) {
                let lastIndex = data.result[i].data.length - 1;
                return data.result[i].data[lastIndex];
            }
        }
        return '';
    } else {
        return '';
    }
}

//
function getFundingPrivKeyFromPubKey(myUserID, pubkey) {

    let addr = JSON.parse(localStorage.getItem(kAddress));

    // If has data.
    if (addr) {
        // console.info('HAS DATA');
        for (let i = 0; i < addr.result.length; i++) {
            if (myUserID === addr.result[i].userID) {
                for (let j = 0; j < addr.result[i].data.length; j++) {
                    if (pubkey === addr.result[i].data[j].pubkey) {
                        return addr.result[i].data[j].wif;
                    }
                }
            }
        }
        return '';
    } else {
        return '';
    }
}

/**
 * Add a record to table Funding private key or Last temp private key
 * @param user_id
 * @param channel_id
 * @param privkey
 * @param tbName: Funding private key or Last temp private key
 */
function addDataInTable(user_id, channel_id, privkey, tbName) {

    let request = db.transaction([tbName], 'readwrite')
        .objectStore(tbName)
        .add({ user_id: user_id, channel_id: channel_id, privkey: privkey });
  
    request.onsuccess = function (e) {
        console.log('Data write success.');
    };
  
    request.onerror = function (e) {
        console.log('Data write false.');
    }
}

/**
 * Save channelID to local storage
 * @param channelID
 */
function saveChannelID(channelID) {
    localStorage.setItem(kChannelID, channelID);
}

/**
 * Get channelID from local storage
 */
function getChannelID() {
    return localStorage.getItem(kChannelID);
}

/**
 * Address generated from mnemonic words save to local storage.
 * @param myUserID 
 * @param value 
 */
function saveAddress(myUserID, value) {

    let resp = JSON.parse(localStorage.getItem(kAddress));

    // If has data.
    if (resp) {
        // console.info('HAS DATA');
        for (let i = 0; i < resp.result.length; i++) {
            if (myUserID === resp.result[i].userID) {
                // Add new dato to 
                let new_data = {
                    address: value.result.address,
                    index:   value.result.index,
                    pubkey:  value.result.pubkey,
                    wif:     value.result.wif
                }
                resp.result[i].data.push(new_data);
                localStorage.setItem(kAddress, JSON.stringify(resp));
                return;
            }
        }

        // A new User ID.
        let new_data = {
            userID: myUserID,
            data: [{
                address: value.result.address,
                index:   value.result.index,
                pubkey:  value.result.pubkey,
                wif:     value.result.wif
            }]
        }
        resp.result.push(new_data);
        localStorage.setItem(kAddress, JSON.stringify(resp));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                userID: myUserID,
                data: [{
                    address: value.result.address,
                    index:   value.result.index,
                    pubkey:  value.result.pubkey,
                    wif:     value.result.wif
                }]
            }]
        }
        localStorage.setItem(kAddress, JSON.stringify(data));
    }
}

/**
 * Get addresses by mnemonic words created from local storage
 */
function getAddress() {
    return JSON.parse(localStorage.getItem(kAddress));
}

/**
 * save Channel ddress to localStorage
 * @param address
 */
function saveChannelAddress(address) {
    localStorage.setItem(kChannelAddress, address);
}

/**
 * get Channel ddress from localStorage
 */
function getChannelAddress() {
    return localStorage.getItem(kChannelAddress);
}

/**
 * save temp hash from:
 * @param hex
 * 1) fundingBitcoin -102109 return
 * 2) bitcoinFundingCreated type ( -100340 ) return
 * 3) FundingAsset type ( -102120 ) return
 * 4) commitmentTransactionCreated type ( -100351 ) return
 * 5) HTLCCreated type ( -100040 ) return
 */
function saveTempHash(hex) {
    localStorage.setItem(kTempHash, hex);
}

/**
 * get temp hash from:
 * 1) fundingBitcoin -102109 return
 * 2) bitcoinFundingCreated type ( -100340 ) return
 * 3) FundingAsset type ( -102120 ) return
 * 4) commitmentTransactionCreated type ( -100351 ) return
 * 5) HTLCCreated type ( -100040 ) return
 */
function getTempHash() {
    return localStorage.getItem(kTempHash);
}

// 
function saveFundingBtcData(myUserID, info) {

    let resp = JSON.parse(localStorage.getItem(kFundingBtc));

    // If has data.
    if (resp) {
        // console.info('HAS DATA');
        for (let i = 0; i < resp.result.length; i++) {
            if (myUserID === resp.result[i].userID) {
                // Remove
                resp.result.splice(i, 1);
            }
        }

        // A new User ID.
        let new_data = {
            userID:                   myUserID,
            from_address:             info.from_address,
            from_address_private_key: info.from_address_private_key,
            to_address:               info.to_address,
            amount:                   info.amount,
            miner_fee:                info.miner_fee
        }
        resp.result.push(new_data);
        localStorage.setItem(kFundingBtc, JSON.stringify(resp));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                userID:                   myUserID,
                from_address:             info.from_address,
                from_address_private_key: info.from_address_private_key,
                to_address:               info.to_address,
                amount:                   info.amount,
                miner_fee:                info.miner_fee
            }]
        }
        localStorage.setItem(kFundingBtc, JSON.stringify(data));
    }
}

//
function getFundingBtcData(myUserID) {

    let resp = JSON.parse(localStorage.getItem(kFundingBtc));

    // If has data.
    if (resp) {
        for (let i = 0; i < resp.result.length; i++) {
            if (myUserID === resp.result[i].userID) {
                return resp.result[i];
            }
        }
        return '';
    } else {
        return '';
    }
}

/**
 * Save Htlc H
 * @param value
 */
function saveHtlcH(value) {
    localStorage.setItem(kHtlcH, value);
}

/**
 * Get Htlc H
 */
function getHtlcH() {
    return localStorage.getItem(kHtlcH);
}

/**
 * Save Routing Packet
 * @param value
 */
function saveRoutingPacket(value) {
    localStorage.setItem(kRoutingPacket, value);
}

/**
 * Get Routing Packet
 */
function getRoutingPacket() {
    return localStorage.getItem(kRoutingPacket);
}

/**
 * Save Cltv Expiry
 * @param value
 */
function saveCltvExpiry(value) {
    localStorage.setItem(kCltvExpiry, value);
}

/**
 * Get Cltv Expiry
 */
function getCltvExpiry() {
    return localStorage.getItem(kCltvExpiry);
}

/**
 * Save temporary private key to local storage
 * @param myUserID
 * @param saveKey
 * @param channelID
 * @param privkey
 */
function saveTempPrivKey(myUserID, saveKey, channelID, privkey) {
    
    let resp = JSON.parse(localStorage.getItem(saveKey));

    // If has data.
    if (resp) {
        // console.info('HAS DATA');
        for (let i = 0; i < resp.result.length; i++) {
            if (myUserID === resp.result[i].userID) {
                for (let j = 0; j < resp.result[i].data.length; j++) {
                    if (channelID === resp.result[i].data[j].channelID) {
                        // update privkey 
                        resp.result[i].data[j].privkey = privkey;
                        localStorage.setItem(saveKey, JSON.stringify(resp));
                        return;
                    }
                }

                // A new channel id
                let new_data = {
                    channelID: channelID,
                    privkey:   privkey
                }
                resp.result[i].data.push(new_data);
                localStorage.setItem(saveKey, JSON.stringify(resp));
                return;
            }
        }

        // A new User ID.
        let new_data = {
            userID:  myUserID,
            data: [{
                channelID: channelID,
                privkey:   privkey
            }]
        }
        resp.result.push(new_data);
        localStorage.setItem(saveKey, JSON.stringify(resp));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                userID:  myUserID,
                data: [{
                    channelID: channelID,
                    privkey:   privkey
                }]
            }]
        }
        localStorage.setItem(saveKey, JSON.stringify(data));
    }
}

/**
 * Get temporary private key from local storage
 * @param myUserID
 * @param saveKey
 * @param channelID
 */
function getTempPrivKey(myUserID, saveKey, channelID) {
    
    let resp = JSON.parse(localStorage.getItem(saveKey));

    // If has data.
    if (resp) {
        // console.info('HAS DATA');
        for (let i = 0; i < resp.result.length; i++) {
            if (myUserID === resp.result[i].userID) {
                for (let j = 0; j < resp.result[i].data.length; j++) {
                    if (channelID === resp.result[i].data[j].channelID) {
                        return resp.result[i].data[j].privkey;
                    }
                }
            }
        }
        return '';
    } else {
        return '';
    }
}

/**
 * Save mnemonic words used by a user to log in
 * @param myUserID user id of currently logged in
 * @param value mnemonic words
 */
function saveMnemonic(myUserID, value) {

    let resp = JSON.parse(localStorage.getItem(kMnemonic));

    // If has data.
    if (resp) {
        // console.info('HAS DATA');
        for (let i = 0; i < resp.result.length; i++) {
            if (myUserID === resp.result[i].userID) {
                return;
            }
        }

        // A new user.
        let new_data = {
            userID:   myUserID,
            mnemonic: value,
        }
        resp.result.push(new_data);
        localStorage.setItem(kMnemonic, JSON.stringify(resp));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                userID:   myUserID,
                mnemonic: value,
            }]
        }
        localStorage.setItem(kMnemonic, JSON.stringify(data));
    }
}

/**
 * Get mnemonic words used by a user to log in
 * @param myUserID user id of currently logged in
 * @param param    0: Return all data   1: Return data that lastest key value is Yes
 */
function getMnemonic(myUserID, param) {

    let resp = JSON.parse(localStorage.getItem(kMnemonic));

    // If has data.
    if (resp) {
        // console.info('HAS DATA');
        if (param === 0) {
            return resp.result;
        } else {
            for (let i = 0; i < resp.result.length; i++) {
                if (myUserID === resp.result[i].userID) {
                    return resp.result[i].mnemonic;
                }
            }
            return '';
        }
    } else {
        return '';
    }
}

// save r from forwardR type ( -100045 ) return
function saveForwardR(r) {
    localStorage.setItem(kHtlcR, r);
}

// get r from forwardR type ( -100045 ) return
function getForwardR() {
    return localStorage.getItem(kHtlcR);
}

/**
 * Save auto pilot status
 * @param value Yes or No
 */
function saveAutoPilot(value) {
    localStorage.setItem(kAutoPilot, value);
}

/**
 * Get auto pilot status
 */
function getAutoPilot() {
    return localStorage.getItem(kAutoPilot);
}

/**
 * get a new index of an address
 * @param myUserID 
 */
function getNewAddrIndex(myUserID) {

    let addr = JSON.parse(localStorage.getItem(kAddress));

    // If has data.
    if (addr) {
        // console.info('HAS DATA');
        for (let i = 0; i < addr.result.length; i++) {
            if (myUserID === addr.result[i].userID) {
                maxIndex = addr.result[i].data.length - 1;
                newIndex = addr.result[i].data[maxIndex].index + 1;
                return newIndex;
            }
        }

        // A new User ID.
        return 1;

    } else {
        // console.info('FIRST DATA');
        return 1;
    }
}

/**
 * Type -103156 is used to check channel address if has already created.
 * Return - True: created False: not created
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 * @param callback 
 */
function checkChannelAddessExist(nodeID, userID, info, callback) {
    obdApi.checkChannelAddessExist(nodeID, userID, info, callback);
}

/**
 * Read data from IndexedDB
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function asyncCheckChannelAddessExist(nodeID, userID, info) {

    return new Promise((resolve, reject) => {
        checkChannelAddessExist(nodeID, userID, info, function(e) {
            console.info('SDK: -103156 checkChannelAddessExist = ' + JSON.stringify(e));
            let value = JSON.stringify(e);
            value = value.replace("\"", "").replace("\"", "");
            // console.info('SDK: value = ' + value);
            if (value === 'true') {
                resolve(0);
            } else {
                resolve(1);
            }
        });
    })
}

/**
 * Read data from IndexedDB
 * @param myUserID 
 * @param dataDB
 * @param channel_id
 * @param tbName: Funding private key or Last temp private key
 */
function asyncGetFundingPrivKey(myUserID, dataDB, channel_id, tbName) {

    return new Promise((resolve, reject) => {

        let data        = [];
        let transaction = dataDB.transaction([tbName], 'readonly');
        let store       = transaction.objectStore(tbName);
        let index       = store.index('channel_id');
        let request     = index.get(channel_id);
            request     = index.openCursor(channel_id);

        request.onerror = function(e) {
            console.log('Read data false.');
            reject('Read data false.');
        }

        request.onsuccess = function (e) {
            let result = e.target.result;
            if (result) {
                let value = {
                    user_id: result.value.user_id,
                    privkey: result.value.privkey
                };

                data.push(value);
                result.continue();
            } else {
                console.log('No More Data.');
                for (let i = data.length - 1; i >= 0; i--) {
                    if (myUserID === data[i].user_id) {
                        console.log('FINAL privkey: ' + data[i].privkey);
                        resolve(data[i].privkey);
                    }
                }

                // Not found private key
                resolve('');
            }
        }
    })
}

/**
 * Generate an address from mnemonic words.
 * @param myUserID
 * @param netType true: testnet  false: mainnet
 */
function genNewAddress(myUserID, netType) {
    let index    = getNewAddrIndex(myUserID);
    let mnemonic = getMnemonic(myUserID, 1);
    let address  = genAddressFromMnemonic(mnemonic, index, netType);
    return address;
}

/**
 * Type -103206 Protocol is used to broadcast the commitment transaction 
 * from it's id of database.
 * @param id Number
 */
function sendSomeCommitmentById(id) {
    obdApi.sendSomeCommitmentById(id, function(e) {
        console.info('SDK: -103206 sendSomeCommitmentById = ' + JSON.stringify(e));
    });
}