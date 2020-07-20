// util.js
// Functions related to save and get data 


/**
 * Object Store (table) name of IndexedDB.
 * Funding private key
 */
const tbFundingPrivKey = 'funding_privkey';

//
const itemCounterparties = 'counterparties';

//
const itemAddr = 'addr';

//
const itemChannelID = 'channel_id';

//
const itemChannelAddress = 'channel_address';

/**
 *  List of Counterparties who have interacted
 *  @param myUserID The user id of logged in
 *  @param toNodeID The node id of the counterparty.
 *  @param toUserID The user id of the counterparty.
 */
function saveCounterparties(myUserID, toNodeID, toUserID) {

    let list = JSON.parse(localStorage.getItem(itemCounterparties));

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
                        localStorage.setItem(itemCounterparties, JSON.stringify(list));
                        return;
                    }
                }

                // Add a new data to the userID
                let new_data = {
                    userID: toUserID,
                    nodeID: toNodeID
                }
                list.result[i].data.push(new_data);
                localStorage.setItem(itemCounterparties, JSON.stringify(list));
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
        localStorage.setItem(itemCounterparties, JSON.stringify(list));

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
        localStorage.setItem(itemCounterparties, JSON.stringify(data));
    }
}

/**
 * Get Lastest Counterparty
 * @param myUserID The user id of logged in
 */
function getCounterparty(myUserID) {

    let data = JSON.parse(localStorage.getItem(itemCounterparties));

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

    let addr = JSON.parse(localStorage.getItem(itemAddr));

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
    localStorage.setItem(itemChannelID, channelID);
}

/**
 * Get channelID from local storage
 */
function getChannelID() {
    return localStorage.getItem(itemChannelID);
}

/**
 * Get addresses by mnemonic words created from local storage
 */
function getAddress() {
    return JSON.parse(localStorage.getItem(itemAddr));
}

/**
 * save Channel ddress to localStorage
 * @param address
 */
function saveChannelAddress(address) {
    localStorage.setItem(itemChannelAddress, address);
}

/**
 * get Channel ddress from localStorage
 */
function getChannelAddress() {
    return localStorage.getItem(itemChannelAddress);
}