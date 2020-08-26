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
        obdApi.openChannel(nodeID, userID, info, function(e) {
            console.info('SDK: -100032 openChannel = ' + JSON.stringify(e));
            // Functions related to save and get data have be moved to SDK.
            saveCounterparties(myUserID, nodeID, userID);
            saveChannelStatus(myUserID, e.temporary_channel_id, true, kStatusOpenChannel);
            let privkey = getFundingPrivKeyFromPubKey(myUserID, info.funding_pubkey);
            saveFundingPrivKey(myUserID, e.temporary_channel_id, privkey, kTbFundingPrivKey);
            resolve(e);
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
        obdApi.acceptChannel(nodeID, userID, info, function(e) {
            console.info('SDK: -100033 acceptChannel = ' + JSON.stringify(e));

            let channel_id = e.temporary_channel_id;
            let privkey    = getFundingPrivKeyFromPubKey(myUserID, info.funding_pubkey);
            saveFundingPrivKey(myUserID, channel_id, privkey, kTbFundingPrivKey);
            saveCounterparties(myUserID, nodeID, userID);
            saveChannelStatus(myUserID, channel_id, false, kStatusAcceptChannel);
            saveChannelAddr(channel_id, e.channel_address);
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
    return new Promise((resolve, reject) => {
        obdApi.fundingBitcoin(info, async function(e) {
            console.info('SDK: -102109 fundingBitcoin = ' + JSON.stringify(e));
            saveTempHash(e.hex);
            saveFundingBtcData(myUserID, info);
    
            let channel_id = await getChannelIDFromAddr(info.to_address);
            let status     = await getChannelStatus(channel_id, true);
            console.info('fundingBitcoin status = ' + status);
            switch (Number(status)) {
                case kStatusAcceptChannel:
                    saveChannelStatus(myUserID, channel_id, true, kStatusFirstFundingBitcoin);
                    break;
                case kStatusFirstBitcoinFundingSigned:
                    saveChannelStatus(myUserID, channel_id, true, kStatusSecondFundingBitcoin);
                    break;
                case kStatusSecondBitcoinFundingSigned:
                    saveChannelStatus(myUserID, channel_id, true, kStatusThirdFundingBitcoin);
                    break;
            }
            resolve(true);
        });
    })
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
    return new Promise((resolve, reject) => {
        obdApi.bitcoinFundingCreated(nodeID, userID, info, async function(e) {
            console.info('SDK: -100340 bitcoinFundingCreated = ' + JSON.stringify(e));
    
            let channel_id = e.temporary_channel_id;
            let status     = await getChannelStatus(channel_id, true);
            console.info('bitcoinFundingCreated status = ' + status);
            switch (Number(status)) {
                case kStatusFirstFundingBitcoin:
                    saveChannelStatus(myUserID, channel_id, true, kStatusFirstBitcoinFundingCreated);
                    break;
                case kStatusSecondFundingBitcoin:
                    saveChannelStatus(myUserID, channel_id, true, kStatusSecondBitcoinFundingCreated);
                    break;
                case kStatusThirdFundingBitcoin:
                    saveChannelStatus(myUserID, channel_id, true, kStatusThirdBitcoinFundingCreated);
                    break;
            }
            resolve(true);
        });
    })
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
    return new Promise((resolve, reject) => {
        obdApi.bitcoinFundingSigned(nodeID, userID, info, async function(e) {
            console.info('SDK: -100350 bitcoinFundingSigned = ' + JSON.stringify(e));
    
            let channel_id = e.temporary_channel_id;
            let status     = await getChannelStatus(channel_id, false);
            console.info('bitcoinFundingSigned status = ' + status);
            switch (Number(status)) {
                case kStatusFirstBitcoinFundingCreated:
                    saveChannelStatus(myUserID, channel_id, false, kStatusFirstBitcoinFundingSigned);
                    break;
                case kStatusSecondBitcoinFundingCreated:
                    saveChannelStatus(myUserID, channel_id, false, kStatusSecondBitcoinFundingSigned);
                    break;
                case kStatusThirdBitcoinFundingCreated:
                    saveChannelStatus(myUserID, channel_id, false, kStatusThirdBitcoinFundingSigned);
                    break;
            }
            resolve(true);
        });
    })
}

/**
 * Type -102120 Protocol is used to Alice starts to deposit omni assets to 
 * the channel. This is quite similar to the the btc funding procedure.
 * 
 * @param myUserID The user id of logged in
 * @param info 
 */
function fundingAsset(myUserID, info) {
    return new Promise((resolve, reject) => {
        obdApi.fundingAsset(info, async function(e) {
            console.info('SDK: -102120 fundingAssetOfOmni = ' + JSON.stringify(e));
            saveTempHash(e.hex);
            let channel_id = await getChannelIDFromAddr(info.to_address);
            saveChannelStatus(myUserID, channel_id, true, kStatusFundingAsset);
            resolve(true);
        });
    })
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
    return new Promise((resolve, reject) => {
        obdApi.assetFundingCreated(nodeID, userID, info, function(e) {
            console.info('SDK: -100034 - assetFundingCreated = ' + JSON.stringify(e));
            // Save temporary private key to local storage
            saveTempPrivKey(myUserID, kTempPrivKey, info.temporary_channel_id, 
                info.temp_address_private_key);
            saveChannelStatus(myUserID, info.temporary_channel_id, true, kStatusAssetFundingCreated);
            resolve(true);
        });
    })
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
    return new Promise((resolve, reject) => {
        obdApi.assetFundingSigned(nodeID, userID, info, async function(e) {
            console.info('SDK: -100035 - assetFundingSigned = ' + JSON.stringify(e));
            
            // Once sent -100035 AssetFundingSigned , the final channel_id has generated.
            // So need update the local saved data for funding private key and channel_id.

            let priv_key     = info.fundee_channel_address_private_key;
            let tempCID      = info.temporary_channel_id;
            let channel_id   = e.channel_id;
            let channel_addr = await getChannelAddr(tempCID);

            saveFundingPrivKey(myUserID, channel_id, priv_key, kTbFundingPrivKey);

            //
            delChannelAddr(tempCID);
            saveChannelAddr(channel_id, channel_addr);

            //
            delChannelStatus(tempCID, false);
            saveChannelStatus(myUserID, channel_id, false, kStatusAssetFundingSigned);

            resolve(e);
        });
    })
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
    return new Promise((resolve, reject) => {
        obdApi.commitmentTransactionCreated(nodeID, userID, info, function(e) {
            console.info('SDK: -100351 commitmentTransactionCreated = ' + JSON.stringify(e));
            saveTempPrivKey(myUserID, kTempPrivKey, e.channel_id, info.curr_temp_address_private_key);
            saveChannelStatus(myUserID, e.channel_id, true, kStatusCommitmentTransactionCreated);
            resolve(true);
        });
    })
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
    return new Promise((resolve, reject) => {
        obdApi.commitmentTransactionAccepted(nodeID, userID, info, function(e) {
            console.info('SDK: -100352 commitmentTransactionAccepted = ' + JSON.stringify(e));
            saveTempPrivKey(myUserID, kTempPrivKey, e.channel_id, info.curr_temp_address_private_key);
            saveChannelStatus(myUserID, e.channel_id, false, kStatusCommitmentTransactionAccepted);
            resolve(true);
        });
    })
}

/**
 * Type -100038 Protocol is used to close a channel. 
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param channel_id 
 */
function closeChannel(myUserID, nodeID, userID, channel_id) {
    return new Promise((resolve, reject) => {
        obdApi.closeChannel(nodeID, userID, channel_id, function(e) {
            console.info('SDK: -100038 closeChannel = ' + JSON.stringify(e));
            saveChannelStatus(myUserID, channel_id, true, kStatusCloseChannel);
            resolve(true);
        });
    })
}

/**
 * Type -100039 Protocol is used to response the close channel request.
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function closeChannelSigned(myUserID, nodeID, userID, info) {
    return new Promise((resolve, reject) => {
        obdApi.closeChannelSigned(nodeID, userID, info, function(e) {
            console.info('SDK: -100039 closeChannelSigned = ' + JSON.stringify(e));
            saveChannelStatus(myUserID, e.channel_id, false, kStatusCloseChannelSigned);
            resolve(true);
        });
    })
}
