// basic.js
// Basic Lightning Network Operations 


/**
 *  Type -100032 Protocol is used to request to create a channel with someone else(Bob).
 *  @param myUserID The user id of logged in
 *  @param nodeID peer id of the obd node where the fundee logged in.
 *  @param userID the user id of the fundee.
 *  @param info 
 */
function openChannel(myUserID, nodeID, userID, info) {
    return new Promise((resolve, reject) => {
        obdApi.openChannel(nodeID, userID, info, async function(e) {
            console.info('SDK: -100032 openChannel = ' + JSON.stringify(e));
            // Functions related to save and get data have be moved to SDK.
            saveCounterparties(myUserID, nodeID, userID);
            await saveChannelData(myUserID, e.temporary_channel_id, '', true, 1);
            let privkey = getFundingPrivKeyFromPubKey(myUserID, info.funding_pubkey);
            saveFundingPrivKey(myUserID, e.temporary_channel_id, privkey, kTbFundingPrivKey);
            resolve(true);
        });
    })
}

/**
 * Type -100033 Bob replies to accept, his OBD completes his message and 
 * routes it back to Alice's OBD. Then Alice sees the response of acceptance.
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function acceptChannel(myUserID, nodeID, userID, info) {
    return new Promise((resolve, reject) => {
        obdApi.acceptChannel(nodeID, userID, info, async function(e) {
            console.info('SDK: -100033 acceptChannel = ' + JSON.stringify(e));
            // Functions related to save and get data have be moved to SDK.
            let privkey = getFundingPrivKeyFromPubKey(myUserID, info.funding_pubkey);
            saveFundingPrivKey(myUserID, info.temporary_channel_id, privkey, kTbFundingPrivKey);
            saveCounterparties(myUserID, nodeID, userID);
            await saveChannelData(myUserID, e.temporary_channel_id, e.channel_address, false, 2);
            resolve(true);
        });
    })
}

/**
 * Type 102109 Protocol is used for depositing bitcoin into a channel. 
 * Since the basic Omnilayer protocal uses BTC as miner fee in 
 * constructing transactions, this message 102109 is mandatory 
 * for depositing a little BTC into a channel as miner fee.
 * 
 * @param myUserID The user id of logged in
 * @param info 
 */
function fundingBitcoin(myUserID, info) {
    obdApi.fundingBitcoin(info, async function(e) {
        console.info('SDK: -102109 fundingBitcoin = ' + JSON.stringify(e));
        saveTempHash(e.hex);
        saveFundingBtcData(myUserID, info);

        let channel_addr = info.to_address;
        let channel_id   = await getChannelIDFromAddr(channel_addr);
        let status       = await getChannelStatus(channel_id, true);
        console.info('fundingBitcoin status = ' + status);
        switch (Number(status)) {
            case 2:
                await saveChannelData(myUserID, channel_id, channel_addr, true, 3);
                break;
            case 5:
                await saveChannelData(myUserID, channel_id, channel_addr, true, 6);
                break;
            case 8:
                await saveChannelData(myUserID, channel_id, channel_addr, true, 9);
                break;
        }
    });
}

/**
 * Type -100340 Protocol is used to notify the success of 
 * funding BTC to the counterpart of the channel.
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function bitcoinFundingCreated(myUserID, nodeID, userID, info) {
    obdApi.bitcoinFundingCreated(nodeID, userID, info, async function(e) {
        console.info('SDK: -100340 bitcoinFundingCreated = ' + JSON.stringify(e));

        let channel_id   = e.temporary_channel_id;
        let channel_addr = await getChannelAddress(channel_id);
        let status       = await getChannelStatus(channel_id, true);
        console.info('bitcoinFundingCreated status = ' + status);
        switch (Number(status)) {
            case 3:
                await saveChannelData(myUserID, channel_id, channel_addr, true, 4);
                break;
            case 6:
                await saveChannelData(myUserID, channel_id, channel_addr, true, 7);
                break;
            case 9:
                await saveChannelData(myUserID, channel_id, channel_addr, true, 10);
                break;
        }
    });
}

/**
 * Type -100350 Protocol is used to Bob tells his OBD to reply Alice 
 * that he knows the BTC funding by message -100350.
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function bitcoinFundingSigned(myUserID, nodeID, userID, info) {
    obdApi.bitcoinFundingSigned(nodeID, userID, info, async function(e) {
        console.info('SDK: -100350 bitcoinFundingSigned = ' + JSON.stringify(e));

        let channel_id   = e.temporary_channel_id;
        let channel_addr = await getChannelAddress(channel_id);
        let status       = await getChannelStatus(channel_id, false);
        console.info('bitcoinFundingSigned status = ' + status);
        switch (Number(status)) {
            case 4:
                await saveChannelData(myUserID, channel_id, channel_addr, false, 5);
                break;
            case 7:
                await saveChannelData(myUserID, channel_id, channel_addr, false, 8);
                break;
            case 10:
                await saveChannelData(myUserID, channel_id, channel_addr, false, 11);
                break;
        }
    });
}

/**
 * Type -102120 Protocol is used to Alice starts to deposit omni assets to 
 * the channel. This is quite similar to the the btc funding procedure.
 * 
 * @param info 
 */
function fundingAsset(info) {
    obdApi.fundingAsset(info, function(e) {
        console.info('SDK: -102120 fundingAssetOfOmni = ' + JSON.stringify(e));
        saveTempHash(e.hex);
    });
}

/**
 * Type -100034 Protocol is used to notify the success of omni asset 
 * funding transaction to the counterparty of the channel.
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function assetFundingCreated(myUserID, nodeID, userID, info) {
    obdApi.assetFundingCreated(nodeID, userID, info, function(e) {
        console.info('SDK: -100034 - assetFundingCreated = ' + JSON.stringify(e));
        // Save temporary private key to local storage
        saveTempPrivKey(myUserID, kTempPrivKey, info.temporary_channel_id, 
            info.temp_address_private_key);
    });
}

/**
 * Type -100035 Protocol is used to Bob tells his OBD to reply Alice 
 * that he knows the asset funding transaction by message -100035, 
 * and Alice's OBD will creat commitment transactions (C1a & RD1a).
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function assetFundingSigned(myUserID, nodeID, userID, info) {
    obdApi.assetFundingSigned(nodeID, userID, info, function(e) {
        console.info('SDK: -100035 - assetFundingSigned = ' + JSON.stringify(e));
        
        // Once sent -100035 AssetFundingSigned , the final channel_id has generated.
        // So need update the local saved data for funding private key and channel_id.
        saveFundingPrivKey(myUserID, e.channel_id, 
            info.fundee_channel_address_private_key, kTbFundingPrivKey);
        // await saveChannelData(e.channel_id);
    });
}

/**
 * Type -100351 Protocol is used for paying omni assets by 
 * Revocable Sequence Maturity Contract(RSMC) within a channel.
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function commitmentTransactionCreated(myUserID, nodeID, userID, info) {
    obdApi.commitmentTransactionCreated(nodeID, userID, info, function(e) {
        console.info('SDK: -100351 commitmentTransactionCreated = ' + JSON.stringify(e));
        // await saveChannelData(e.channel_id);
        saveTempPrivKey(myUserID, kTempPrivKey, e.channel_id, 
            info.curr_temp_address_private_key);
    });
}

/**
 * Type -100352 Protocol is used to Receiver revokes the previous 
 * commitment transaction and ackonwledge the new transaction.
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function commitmentTransactionAccepted(myUserID, nodeID, userID, info) {
    obdApi.commitmentTransactionAccepted(nodeID, userID, info, function(e) {
        console.info('SDK: -100352 commitmentTransactionAccepted = ' + JSON.stringify(e));
        // await saveChannelData(e.channel_id);
        saveTempPrivKey(myUserID, kTempPrivKey, e.channel_id, info.curr_temp_address_private_key);
    });
}

/**
 * Type -100038 Protocol is used to close a channel. 
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param channel_id 
 */
function closeChannel(nodeID, userID, channel_id) {
    obdApi.closeChannel(nodeID, userID, channel_id, function(e) {
        console.info('SDK: -100038 closeChannel = ' + JSON.stringify(e));
    });
}

/**
 * Type -100039 Protocol is used to response the close channel request.
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function closeChannelSigned(nodeID, userID, info) {
    obdApi.closeChannelSigned(nodeID, userID, info, function(e) {
        console.info('SDK: -100039 closeChannelSigned = ' + JSON.stringify(e));
    });
}
