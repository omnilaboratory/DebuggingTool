// basic.js
// Basic Lightning Network Operations 


/**
 *  Type -100032 Protocol is used to request to create a channel with someone else(Bob).
 *  @param myUserID The user id of logged in
 *  @param nodeID peer id of the obd node where the fundee logged in.
 *  @param userID the user id of the fundee.
 *  @param pubkey public key of funder, who wish to deposite BTC and other tokens to the channel
 */
function openChannel(myUserID, nodeID, userID, pubkey) {
    obdApi.openChannel(nodeID, userID, pubkey, function(e) {
        console.info('SDK: -100032 openChannel = ' + JSON.stringify(e));

        // WILL BE UPDATED
        // saveChannelList(e);

        // Functions related to save and get data have be moved to SDK.
        saveCounterparties(myUserID, nodeID, userID);
        saveChannelID(e.temporary_channel_id);
        let privkey = getFundingPrivKeyFromPubKey(myUserID, pubkey);
        addDataInTable(myUserID, e.temporary_channel_id, privkey, kTbFundingPrivKey);
    });
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
    obdApi.acceptChannel(nodeID, userID, info, function(e) {
        console.info('SDK: -100033 acceptChannel = ' + JSON.stringify(e));
        // saveChannelList(e);

        // Functions related to save and get data have be moved to SDK.
        saveCounterparties(myUserID, nodeID, userID);
        saveChannelAddress(e.channel_address);
        let privkey = getFundingPrivKeyFromPubKey(myUserID, info.funding_pubkey);
        addDataInTable(myUserID, info.temporary_channel_id, privkey, kTbFundingPrivKey);
    });
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
function fundingBTC(myUserID, info) {
    obdApi.fundingBTC(info, function(e) {
        console.info('SDK: -102109 fundingBTC = ' + JSON.stringify(e));
        // saveChannelList(e, getChannelID(), msgType);
        saveTempHash(e.hex);
        saveFundingBtcData(myUserID, info);
    });
}

/**
 * Type -100340 Protocol is used to notify the success of 
 * funding BTC to the counterpart of the channel.
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function BTCFundingCreated(nodeID, userID, info) {
    obdApi.btcFundingCreated(nodeID, userID, info, function(e) {
        console.info('SDK: -100340 btcFundingCreated = ' + JSON.stringify(e));
        // saveChannelList(e, info.temporary_channel_id, msgType);
    });
}

/**
 * Type -100350 Protocol is used to Bob tells his OBD to reply Alice 
 * that he knows the BTC funding by message -100350.
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function BTCFundingSigned(nodeID, userID, info) {
    obdApi.btcFundingSigned(nodeID, userID, info, function(e) {
        console.info('SDK: -100350 btcFundingSigned = ' + JSON.stringify(e));
        // saveChannelList(e, info.temporary_channel_id, msgType);
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
        // saveChannelList(e, tempChID, msgType);
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
        // saveChannelList(e, info.temporary_channel_id, msgType);

        // Save temporary private key to local storage
        // OLD RESOLUTION - MAYBE RECOVER LATER
        // const TempPrivKey = 'temp_priv_key';
        // saveTempPrivKey(TempPrivKey, temp_cid, t_ad_prk);

        addDataInTable(myUserID, info.temporary_channel_id, 
            info.temp_address_private_key, kTbTempPrivKey);
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
        // saveChannelList(e, e.channel_id, msgType);
        
        // Once sent -100035 AssetFundingSigned , the final channel_id has generated.
        // So need update the local saved data for funding private key and channel_id.
        addDataInTable(myUserID, e.channel_id, 
            info.fundee_channel_address_private_key, kTbFundingPrivKey);
        saveChannelID(e.channel_id);
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

        saveChannelID(e.channel_id);

        // OLD RESOLUTION - MAYBE RECOVER LATER
        // saveTempPrivKey(TempPrivKey, e.channel_id, info.curr_temp_address_private_key);

        addDataInTable(myUserID, e.channel_id, 
            info.curr_temp_address_private_key, kTbTempPrivKey);
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
function revokeAndAcknowledgeCommitmentTransaction(myUserID, nodeID, userID, info) {
    obdApi.revokeAndAcknowledgeCommitmentTransaction(nodeID, userID, info, function(e) {
        console.info('SDK: -100352 rsmcCTxSigned = ' + JSON.stringify(e));
        // saveChannelList(e, e.channel_id, msgType);

        saveChannelID(e.channel_id);

        // OLD RESOLUTION - MAYBE RECOVER LATER
        // saveTempPrivKey(TempPrivKey, e.channel_id, info.curr_temp_address_private_key);

        addDataInTable(myUserID, e.channel_id, 
            info.curr_temp_address_private_key, kTbTempPrivKey);
    });
}
