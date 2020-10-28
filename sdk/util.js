// util.js
// Functions related to save and get data 

//
const kAddress = 'address';

//
const kMnemonic = 'mnemonic';

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
 * Save pay invoice case
 */
const kPayInvoiceCase = 'pay_invoice_case';

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
 * tb_channel_status
 */
const kTbChannelStatus = 'tb_channel_status';

/**
 * Object Store (table) name of IndexedDB.
 * tb_channel_addr
 */
const kTbChannelAddr = 'tb_channel_addr';

/**
 * Object Store (table) name of IndexedDB.
 * tb_channel_addr
 */
const kTbCounterparty = 'tb_counterparty';

/**
 * Object Store (table) name of IndexedDB.
 * tb_channel_addr
 */
const kTbFundingBTC = 'tb_funding_btc';

/**
 * Object Store (table) name of IndexedDB.
 * tb_channel_addr
 */
const kTbTempData = 'tb_temp_data';

/**
 * Object Store (table) name of IndexedDB.
 * tb_channel_addr
 */
const kTbHTLCPathData = 'tb_htlc_path_data';

/**
 * Object Store (table) name of IndexedDB.
 * tb_channel_addr
 */
const kTbForwardR = 'tb_forward_r';

/**
 * Object Store (table) name of IndexedDB.
 * tb_channel_addr
 */
const kTbInvoiceR = 'tb_invoice_r';

/**
 * 
 */
const kInvoiceH = 'invoice_h';

/**
 * 
 */
const kSenderRole = 'sender_role';

/**
 * Object Store (table) name of IndexedDB.
 * temp private key
 */
// const kTbTempPrivKey = 'tb_temp_priv_key';

/**
 *  List of Counterparties who have interacted
 *  @param myUserID The user id of logged in
 *  @param channel_id 
 *  @param toNodeID The node id of the counterparty.
 *  @param toUserID The user id of the counterparty.
 */
function saveCounterparty(myUserID, channel_id, toNodeID, toUserID) {

    let key     =  myUserID + channel_id;
    let request = db.transaction([kTbCounterparty], 'readwrite')
        .objectStore(kTbCounterparty)
        .put({ key: key, user_id: myUserID, toNodeID: toNodeID, toUserID: toUserID });
  
    request.onsuccess = function (e) {
        console.log('saveCounterparty Data write success.');
    };
  
    request.onerror = function (e) {
        console.log('saveCounterparty Data write false.');
    }
}

/**
 * Get Lastest Counterparty
 * @param myUserID The user id of logged in
 * @param channel_id 
 */
function getCounterparty(myUserID, channel_id) {

    return new Promise((resolve, reject) => {
        let key         = myUserID + channel_id;
        let transaction = db.transaction([kTbCounterparty], 'readonly');
        let store       = transaction.objectStore(kTbCounterparty);
        let request     = store.get(key);
    
        request.onerror = function(e) {
            console.log('Read data false.');
            reject('Read data false.');
        };
    
        request.onsuccess = function (e) {
            if (request.result) {
                let data = {
                    toNodeID: request.result.toNodeID,
                    toUserID: request.result.toUserID
                };
                // console.log('getCounterparty = ' + JSON.stringify(data));
                resolve(data);
            } else {
                console.log('getCounterparty = No Data.');
                resolve('');
            }
        }
    })
}

/**
 * Get all Counterparty
 * @param myUserID The user id of logged in
 */
function getAllCounterpartyFromUserID(myUserID) {

    return new Promise((resolve, reject) => {

        let data        = [];
        let transaction = db.transaction([kTbCounterparty], 'readonly');
        let store       = transaction.objectStore(kTbCounterparty);
        let index       = store.index('user_id');
        let request     = index.get(myUserID);
            request     = index.openCursor(myUserID);
    
        request.onerror = function(e) {
            console.log('Read data false.');
            reject('Read data false.');
        };
    
        request.onsuccess = function (e) {
            let result = e.target.result;
            if (result) {
                let value = {
                    toNodeID: result.value.toNodeID,
                    toUserID: result.value.toUserID
                };

                let hasRepeat = false;
                for (let i = 0; i < data.length; i++) {
                    if ( (value.toNodeID === data[i].toNodeID) && 
                         (value.toUserID === data[i].toUserID) ) {

                        hasRepeat = true;
                    }
                }

                if (!hasRepeat) { // No repeat
                    data.push(value);
                }
                result.continue();

            } else {
                console.log('getAllCounterpartyFromUserID No More Data.');
                console.log('getAllCounterpartyFromUserID = ' + JSON.stringify(data));
                resolve(data);
            }
        }
    })
}

/**
 * Delete counterparty
 * @param myUserID The user id of logged in
 * @param channel_id 
 */
function delCounterparty(myUserID, channel_id) {
    let key     = myUserID + channel_id;
    let request = db.transaction([kTbCounterparty], 'readwrite')
        .objectStore(kTbCounterparty)
        .delete(key);

    request.onerror = function(e) {
        console.log('delCounterparty failed');
    };

    request.onsuccess = function (e) {
        console.log('delCounterparty success');
    }
}

//
function getPrivKeyFromPubKey(myUserID, pubkey) {

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

//
function getPrivKeyFromAddress(address) {

    let resp = JSON.parse(localStorage.getItem(kAddress));

    // If has data.
    if (resp) {
        for (let i = 0; i < resp.result.length; i++) {
            for (let j = 0; j < resp.result[i].data.length; j++) {
                if (address === resp.result[i].data[j].address) {
                    return resp.result[i].data[j].wif;
                }
            }
        }
        return '';
    } else {
        return '';
    }
}

/**
 * Get address index from address public key.
 * @param pubkey 
 */
function getIndexFromPubKey(pubkey) {

    let resp = JSON.parse(localStorage.getItem(kAddress));

    // If has data.
    if (resp) {
        for (let i = 0; i < resp.result.length; i++) {
            for (let j = 0; j < resp.result[i].data.length; j++) {
                if (pubkey === resp.result[i].data[j].pubkey) {
                    return resp.result[i].data[j].index;
                }
            }
        }
        return '';
    } else {
        return '';
    }
}

/**
 * Get channelID from channel address
 * @param channel_addr
 */
function getChannelIDFromAddr(channel_addr) {

    return new Promise((resolve, reject) => {
        let transaction = db.transaction([kTbChannelAddr], 'readonly');
        let store       = transaction.objectStore(kTbChannelAddr);
        let index       = store.index('channel_addr');
        let request     = index.get(channel_addr);
    
        request.onerror = function(e) {
            console.log('Read data false.');
            reject('Read data false.');
        };
    
        request.onsuccess = function (e) {
            let result = e.target.result;
            if (result) {
                console.log('result.channel_id = ' + result.channel_id);
                resolve(result.channel_id);
            } else {
                console.log('result.channel_id = No Data.');
                resolve('');
            }
        }
    })
}

/**
 * Get channel status
 * @param channel_id
 * @param funder true: is funder  false: is NOT funder
 */
function getChannelStatus(channel_id, funder) {

    return new Promise((resolve, reject) => {
        let key         = channel_id + funder;
        let transaction = db.transaction([kTbChannelStatus], 'readonly');
        let store       = transaction.objectStore(kTbChannelStatus);
        let request     = store.get(key);
    
        request.onerror = function(e) {
            console.log('Read data false.');
            reject('Read data false.');
        };
    
        request.onsuccess = function (e) {
            if (request.result) {
                // console.log('channel status = ' + request.result.status);
                resolve(request.result.status);
            } else {
                console.log('channel status = No Data.');
                resolve(-1);
            }
        }
    })
}

/**
 * Get funder
 * @param user_id
 * @param channel_id
 */
function getIsFunder(user_id, channel_id) {

    return new Promise((resolve, reject) => {
        let transaction = db.transaction([kTbChannelStatus], 'readonly');
        let store       = transaction.objectStore(kTbChannelStatus);
        let index       = store.index('channel_id');
        let request     = index.get(channel_id);
            request     = index.openCursor(channel_id);

        request.onerror = function(e) {
            console.log('Read data false.');
            reject('Read data false.');
        };
    
        request.onsuccess = function (e) {
            let result = e.target.result;
            if (result) {
                if (result.value.user_id === user_id) {
                    console.log('getIsFunder = ' + result.value.funder);
                    resolve(result.value.funder);
                } else {
                    result.continue();
                }
            } else {
                console.log('getIsFunder No More Data.');
                // Not found 
                resolve('');
            }
        }
    })
}

/**
 * Delete channel status
 * @param channel_id
 * @param funder true: is funder  false: is NOT funder
 */
function delChannelStatus(channel_id, funder) {
    let key     = channel_id + funder;
    let request = db.transaction([kTbChannelStatus], 'readwrite')
        .objectStore(kTbChannelStatus)
        .delete(key);

    request.onerror = function(e) {
        console.log('delChannelStatus failed');
    };

    request.onsuccess = function (e) {
        console.log('delChannelStatus success');
    }
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
 * save Channel ddress
 * @param channel_id
 * @param channel_addr
 */
function saveChannelAddr(channel_id, channel_addr) {

    let request = db.transaction([kTbChannelAddr], 'readwrite')
        .objectStore(kTbChannelAddr)
        .put({ channel_id: channel_id, channel_addr: channel_addr });
  
    request.onsuccess = function (e) {
        console.log('saveChannelAddr Data write success.');
    };
  
    request.onerror = function (e) {
        console.log('saveChannelAddr Data write false.');
    }
}

/**
 * get Channel ddress from localStorage
 * @param channel_id
 */
function getChannelAddr(channel_id) {
    
    return new Promise((resolve, reject) => {
        let transaction = db.transaction([kTbChannelAddr], 'readonly');
        let store       = transaction.objectStore(kTbChannelAddr);
        let request     = store.get(channel_id);
    
        request.onerror = function(e) {
            console.log('Read data false.');
        };
    
        request.onsuccess = function (e) {
            if (request.result) {
                console.log('channel_addr = ' + request.result.channel_addr);
                resolve(request.result.channel_addr);
            } else {
                console.log('channel_addr = No Data.');
                resolve('');
            }
        }
    })
}

/**
 * Delete channel address
 * @param channel_id
 */
function delChannelAddr(channel_id) {
    let request = db.transaction([kTbChannelAddr], 'readwrite')
        .objectStore(kTbChannelAddr)
        .delete(channel_id);

    request.onerror = function(e) {
        console.log('delChannelAddr failed');
    };

    request.onsuccess = function (e) {
        console.log('delChannelAddr success');
    }
}

/**
 * save temp hash from:
 * 
 * @param myUserID
 * @param channel_id
 * @param value
 * 
 * 1) fundingBitcoin -102109 return
 * 2) bitcoinFundingCreated type ( -100340 ) return
 * 3) FundingAsset type ( -102120 ) return
 * 4) commitmentTransactionCreated type ( -100351 ) return
 * 5) addHTLC type ( -100040 ) return
 */
function saveTempData(myUserID, channel_id, value) {

    let key     = myUserID + channel_id;
    let request = db.transaction([kTbTempData], 'readwrite')
        .objectStore(kTbTempData)
        .put({ key: key, value: value });
  
    request.onsuccess = function (e) {
        // console.log('Data write success.');
    };
  
    request.onerror = function (e) {
        // console.log('Data write false.');
    }
}

/**
 * get temp hash from:
 * 
 * @param myUserID
 * @param channel_id
 * 
 * 1) fundingBitcoin -102109 return
 * 2) bitcoinFundingCreated type ( -100340 ) return
 * 3) FundingAsset type ( -102120 ) return
 * 4) commitmentTransactionCreated type ( -100351 ) return
 * 5) addHTLC type ( -100040 ) return
 */
function getTempData(myUserID, channel_id) {

    return new Promise((resolve, reject) => {

        let key         = myUserID + channel_id;
        let transaction = db.transaction([kTbTempData], 'readonly');
        let store       = transaction.objectStore(kTbTempData);
        let request     = store.get(key);
    
        request.onerror = function(e) {
            console.log('Read data false.');
            reject('Read data false.');
        };
    
        request.onsuccess = function (e) {
            if (request.result) {
                console.log('getTempData = ' + request.result.value);
                resolve(request.result.value);
            } else {
                console.log('getTempData = No Data.');
                resolve('');
            }
        }
    })
}

/**
 * 
 * @param {*} myUserID 
 * @param {*} channel_id 
 * @param {*} info 
 */
function saveFundingBtcData(myUserID, channel_id, info) {

    let key     = myUserID + channel_id;
    let request = db.transaction([kTbFundingBTC], 'readwrite')
        .objectStore(kTbFundingBTC)
        .put({ key: key, info: info });
  
    request.onsuccess = function (e) {
        // console.log('Data write success.');
    };
  
    request.onerror = function (e) {
        // console.log('Data write false.');
    }
}

/**
 * 
 * @param {*} myUserID 
 * @param {*} channel_id 
 */
function getFundingBtcData(myUserID, channel_id) {

    return new Promise((resolve, reject) => {

        let key         = myUserID + channel_id;
        let transaction = db.transaction([kTbFundingBTC], 'readonly');
        let store       = transaction.objectStore(kTbFundingBTC);
        let request     = store.get(key);
    
        request.onerror = function(e) {
            console.log('Read data false.');
            reject('Read data false.');
        };
    
        request.onsuccess = function (e) {
            if (request.result) {
                console.log('getFundingBtcData = ' + JSON.stringify(request.result.info));
                resolve(request.result.info);
            } else {
                console.log('getFundingBtcData No Data.');
                resolve('');
            }
        }
    })
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

/**
 * save r from addInvoice type ( -100402 )
 * @param r
 */
function saveInvoiceR(r) {
    localStorage.setItem(kTbInvoiceR, r);
}

/**
 * get r from addInvoice type ( -100402 )
 */
function getInvoiceR() {
    return localStorage.getItem(kTbInvoiceR);
}

/**
 * save h from addHTLC type ( -100040 )
 * @param h
 */
function saveInvoiceH(h) {
    localStorage.setItem(kInvoiceH, h);
}

/**
 * get h from addHTLC type ( -100040 )
 */
function getInvoiceH() {
    return localStorage.getItem(kInvoiceH);
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
 * Save auto pilot status
 * @param value Yes or No
 */
function savePayInvoiceCase(value) {
    localStorage.setItem(kPayInvoiceCase, value);
}

/**
 * Get auto pilot status
 */
function getPayInvoiceCase() {
    return localStorage.getItem(kPayInvoiceCase);
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
 * Return - 0: created 1: not created
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function checkChannelAddessExist(nodeID, userID, info) {

    return new Promise((resolve, reject) => {
        obdApi.checkChannelAddessExist(nodeID, userID, info, function(e) {
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
 * Save HTLC Path Data
 * @param e
 */
function saveHTLCPathData(e) {
    localStorage.setItem(kTbHTLCPathData, JSON.stringify(e));
}

/**
 * 
 */
function getHTLCPathData() {
    return JSON.parse(localStorage.getItem(kTbHTLCPathData));
}

/**
 * Save Funding private key
 * @param myUserID
 * @param channel_id
 * @param priv_key
 */
function saveFundingPrivKey(myUserID, channel_id, priv_key) {
    
    let key     = myUserID + channel_id;
    let request = db.transaction([kTbFundingPrivKey], 'readwrite')
        .objectStore(kTbFundingPrivKey)
        .put({ key: key, priv_key: priv_key });
  
    request.onsuccess = function (e) {
        // console.log('Data write success.');
    };
  
    request.onerror = function (e) {
        // console.log('Data write false.');
    }
}

/**
 * 
 * @param myUserID 
 * @param channel_id
 */
function getFundingPrivKey(myUserID, channel_id) {

    return new Promise((resolve, reject) => {

        let key         = myUserID + channel_id;
        let transaction = db.transaction([kTbFundingPrivKey], 'readonly');
        let store       = transaction.objectStore(kTbFundingPrivKey);
        let request     = store.get(key);
    
        request.onerror = function(e) {
            console.log('Read data false.');
            reject('Read data false.');
        };
    
        request.onsuccess = function (e) {
            if (request.result) {
                console.log('getFundingPrivKey = ' + request.result.priv_key);
                resolve(request.result.priv_key);
            } else {
                console.log('getFundingPrivKey = No Data.');
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

/**
 * Open IndexedDB
 */
function openDB() {

    let request = window.indexedDB.open('data');
    
    request.onerror = function (e) {
        console.log('DB open error!');
    };

    request.onsuccess = function (e) {
        db = request.result;
        console.log('DB open success!');
    };

    // Create table and index
    request.onupgradeneeded = function (e) {
        db = e.target.result;

        let os1;
        if (!db.objectStoreNames.contains(kTbGlobalMsg)) {
            os1 = db.createObjectStore(kTbGlobalMsg, { autoIncrement: true });
            os1.createIndex('user_id', 'user_id', { unique: false });
        }

        let os2;
        if (!db.objectStoreNames.contains(kTbFundingPrivKey)) {
            os2 = db.createObjectStore(kTbFundingPrivKey, { keyPath: 'key' });
        }

        let os3;
        if (!db.objectStoreNames.contains(kTbChannelStatus)) {
            os3 = db.createObjectStore(kTbChannelStatus, { keyPath: 'key' });
            os3.createIndex('channel_id', 'channel_id',   { unique: false });
            os3.createIndex('user_id', 'user_id', { unique: false });
            os3.createIndex('funder',  'funder',  { unique: false });
            os3.createIndex('status',  'status',  { unique: false });
        }

        let os4;
        if (!db.objectStoreNames.contains(kTbChannelAddr)) {
            os4 = db.createObjectStore(kTbChannelAddr, { keyPath: 'channel_id' });
            os4.createIndex('channel_addr', 'channel_addr', { unique: true });
        }

        let os5;
        if (!db.objectStoreNames.contains(kTbCounterparty)) {
            os5 = db.createObjectStore(kTbCounterparty, { keyPath: 'key' });
            os5.createIndex('user_id', 'user_id', { unique: false });
        }

        let os6;
        if (!db.objectStoreNames.contains(kTbFundingBTC)) {
            os6 = db.createObjectStore(kTbFundingBTC, { keyPath: 'key' });
        }

        let os7;
        if (!db.objectStoreNames.contains(kTbTempData)) {
            os7 = db.createObjectStore(kTbTempData, { keyPath: 'key' });
        }

        let os8;
        if (!db.objectStoreNames.contains(kTbHTLCPathData)) {
            os8 = db.createObjectStore(kTbHTLCPathData, { keyPath: 'key' });
        }

        let os9;
        if (!db.objectStoreNames.contains(kTbForwardR)) {
            os9 = db.createObjectStore(kTbForwardR, { keyPath: 'key' });
        }

        let os10;
        if (!db.objectStoreNames.contains(kTbInvoiceR)) {
            os10 = db.createObjectStore(kTbInvoiceR, { keyPath: 'key' });
        }
    }
}

/**
 * Save channel data to local storage
 * @param myUserID  user id of currently loged in.
 * @param channel_id
 * @param funder  true: myUserID is funder  false: myUserID is NOT funder
 * @param status  1: openChannel done  2: acceptChannel done
 * 3: first fundingBitcoin done   4: first bitcoinFundingCreated done    5: first bitcoinFundingSigned done
 * 6: second fundingBitcoin done  7: second bitcoinFundingCreated done   8: second bitcoinFundingSigned done
 * 9: third fundingBitcoin done  10: third bitcoinFundingCreated done   11: third bitcoinFundingSigned done
 * 12: fundingAsset done  13: assetFundingCreated done  14: assetFundingSigned done
 * 15: commitmentTransactionCreated done  16: commitmentTransactionAccepted done
 * 17: payInvoice done  18: addHTLC done
 */
function saveChannelStatus(myUserID, channel_id, funder, status) {
    
    let key     = channel_id + funder;
    let request = db.transaction([kTbChannelStatus], 'readwrite')
        .objectStore(kTbChannelStatus)
        .put({ key: key, user_id: myUserID, channel_id: channel_id, funder: funder, status: status });
  
    request.onsuccess = function (e) {
        console.log('saveChannelStatus Data write success.');
    };
  
    request.onerror = function (e) {
        console.log('saveChannelStatus Data write false.');
    }
}

/**
 * @param val  kIsSender: is sender  kIsReceiver: is receiver
 */
function saveSenderRole(val) {
    localStorage.setItem(kSenderRole, val);
}

/**
 * 
 */
function getSenderRole() {
    return localStorage.getItem(kSenderRole);
}

/**
 * Sign P2PKH address with TransactionBuilder way
 * main network: btctool.bitcoin.networks.bitcoin;
 * @param txhex
 * @param privkey
 */
function signP2PKH(txhex, privkey) {

    const network = btctool.bitcoin.networks.testnet;
    const tx      = btctool.bitcoin.Transaction.fromHex(txhex);
    const txb     = btctool.bitcoin.TransactionBuilder.fromTransaction(tx, network);
    const key     = btctool.bitcoin.ECPair.fromWIF(privkey, network);

    txb.sign({
        prevOutScriptType: 'p2pkh',
        vin: 0,
        keyPair: key,
    });

    // Export hex
    let toHex = txb.build().toHex();
    console.info('signP2PKH - toHex = ' + toHex);
    return toHex;
}

/**
 * Sign P2SH address with TransactionBuilder way for 2-2 multi-sig address
 * @param is_alice
 * @param txhex
 * @param pubkey_1
 * @param pubkey_2
 * @param privkey
 * @param amount    amount in input
 */
function signP2SH(is_alice, txhex, pubkey_1, pubkey_2, privkey, amount) {

    const network = btctool.bitcoin.networks.testnet;
    const tx      = btctool.bitcoin.Transaction.fromHex(txhex);
    const txb     = btctool.bitcoin.TransactionBuilder.fromTransaction(tx, network);
    const pubkeys = [pubkey_1, pubkey_2].map(hex => btctool.buffer.Buffer.from(hex, 'hex'));
    const p2ms    = btctool.bitcoin.payments.p2ms({ m: 2, pubkeys, network: network });
    const p2sh    = btctool.bitcoin.payments.p2sh({ redeem: p2ms,  network: network });

    // const wifs = [
    //     'cUAdadTkjeVFsNz5ifhkETfAzk5PvhnLWtmdSKgbyTTjSCE4MYWy',
    //     'cV6dif91LHD8Czk8BTgvYZR3ipUrqyMDMtUXSWsThqpHaQJUuHKA',
    // ].map((wif) => btctool.bitcoin.ECPair.fromWIF(wif, network));

    // testing
    const key     = btctool.bitcoin.ECPair.fromWIF(privkey, network);

    // change to satoshi
    amount = amount * 100000000;
    console.info('amount => ' + amount);

    // Sign
    if (is_alice === true) { // Alice sign the transaction first
        // txb.sign(0, wifs[0], p2sh.redeem.output, undefined, amount, undefined);
        txb.sign(0, key, p2sh.redeem.output, undefined, amount, undefined);
        let aliceHex = txb.buildIncomplete().toHex();
        console.info('aliceHex => ' + aliceHex);
        return aliceHex;

    } else { // Bob sign the transaction
        // txb.sign(0, wifs[1], p2sh.redeem.output, undefined, amount, undefined);
        txb.sign(0, key, p2sh.redeem.output, undefined, amount, undefined);
        let toHex = txb.build().toHex();
        console.info('signP2SH - toHex = ' + toHex);
        return toHex;
    }
}