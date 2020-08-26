// auto_pilot.js
// Auto Pilot
// Auto response to some request like 
// openChannel, bitcoinFundingCreated, assetFundingCreated, 
// commitmentTransactionCreated, addHTLC, forwardR, closeHTLC.


/**
 * auto response to -100032 (openChannel) 
 * listening to -110032 and send -100033 acceptChannel
 * 
 * @param e 
 * @param netType true: testnet  false: mainnet
 */
async function listening110032(e, netType) {

    let isAutoMode = getAutoPilot();
    console.info('SDK: NOW isAutoMode = ' + isAutoMode);

    let myUserID     = e.to_peer_id;
    let nodeID       = e.funder_node_address;
    let userID       = e.funder_peer_id;
    let channel_id   = e.temporary_channel_id;
    saveChannelStatus(myUserID, channel_id, false, kStatusOpenChannel);
    saveCounterparties(myUserID, nodeID, userID);

    if (isAutoMode === 'No' || isAutoMode === null) return;
    
    console.info('SDK: listening110032 = ' + JSON.stringify(e));
    
    let info                  = new AcceptChannelInfo();
    info.temporary_channel_id = channel_id;
    info.approval             = true;

    let isExist = 0;
    while (isExist === 0) {
        let addr = genNewAddress(myUserID, netType);
        saveAddress(myUserID, addr);
        info.funding_pubkey = addr.result.pubkey;
        isExist = await asyncCheckChannelAddessExist(nodeID, userID, info);
    }

    // SDK API send -100033 acceptChannel
    acceptChannel(myUserID, nodeID, userID, info);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100033(nodeID, userID, info);
}

/**
 * listening to -110033
 * @param e 
 */
function listening110033(e) {
    saveChannelStatus(e.to_peer_id, e.temporary_channel_id, true, kStatusAcceptChannel);
}

/**
 * auto response to -100034 (AssetFundingCreated)
 * listening to -110034 and send -100035 AssetFundingSigned
 * @param e 
 */
async function listening110034(e) {

    let isAutoMode = getAutoPilot();
    console.info('SDK: NOW isAutoMode = ' + isAutoMode);

    let myUserID   = e.to_peer_id;
    let channel_id = e.temporary_channel_id;
    saveChannelStatus(myUserID, channel_id, false, kStatusAssetFundingCreated);

    if (isAutoMode === 'No' || isAutoMode === null) return;
    
    console.info('listening110034 = ' + JSON.stringify(e));

    let nodeID   = e.funder_node_address;
    let userID   = e.funder_peer_id;

    // will send -100035 AssetFundingSigned
    let info                                = new AssetFundingSignedInfo();
    info.temporary_channel_id               = channel_id;
    info.fundee_channel_address_private_key = await asyncGetFundingPrivKey(
        myUserID, db, channel_id, kTbFundingPrivKey);

    // SDK API
    assetFundingSigned(myUserID, nodeID, userID, info);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100035(nodeID, userID, info);
}

/**
 * save funding private key of Alice side
 * Once sent -100035 AssetFundingSigned , the final channel_id has generated.
 * So need update the local saved data for funding private key and channel_id.
 * @param e 
 */
async function listening110035(e) {
    console.info('listening110035 = ' + JSON.stringify(e));

    let myUserID     = e.to_peer_id;
    let tempCID      = e.temporary_channel_id;
    let channel_id   = e.channel_id;
    let channel_addr = await getChannelAddr(tempCID);

    let fundingPrivKey = await asyncGetFundingPrivKey(myUserID, db, tempCID, kTbFundingPrivKey);
    saveFundingPrivKey(myUserID, channel_id, fundingPrivKey, kTbFundingPrivKey);

    //
    let tempPrivKey = getTempPrivKey(myUserID, kTempPrivKey, tempCID);
    saveTempPrivKey(myUserID, kTempPrivKey, channel_id, tempPrivKey);

    //
    delChannelAddr(tempCID);
    saveChannelAddr(channel_id, channel_addr);

    //
    delChannelStatus(tempCID, true);
    saveChannelStatus(myUserID, channel_id, true, kStatusAssetFundingSigned);
}

/**
 * listening to -110038 and save request_close_channel_hash
 * @param e 
 */
function listening110038(e) {
    saveTempHash(e.request_close_channel_hash);
    saveChannelStatus(e.to_peer_id, e.channel_id, false, kStatusCloseChannel);
}

/**
 * listening to -110039
 * @param e 
 */
function listening110039(e) {
    saveChannelStatus(e.to_peer_id, e.channel_id, true, kStatusCloseChannelSigned);
}

/**
 * auto response to -100040 (addHTLC) 
 * listening to -110040 and send -100041 HTLCSigned
 * @param e 
 * @param netType true: testnet  false: mainnet
 */
async function listening110040(e, netType) {

    let isAutoMode = getAutoPilot();
    console.info('SDK: NOW isAutoMode = ' + isAutoMode);

    let myUserID = e.to_peer_id;

    saveTempHash(e.payer_commitment_tx_hash);
    saveChannelStatus(myUserID, e.channel_id, false, kStatusAddHTLC);

    if (isAutoMode === 'No' || isAutoMode === null) return;
    
    console.info('listening110040 = ' + JSON.stringify(e));

    let nodeID   = e.payer_node_address;
    let userID   = e.payer_peer_id;

    let addr_1 = genNewAddress(myUserID, netType);
    let addr_2 = genNewAddress(myUserID, netType);
    saveAddress(myUserID, addr_1);
    saveAddress(myUserID, addr_2);

    // will send -100041 HTLCSigned
    let info                                = new HtlcSignedInfo();
    info.payer_commitment_tx_hash           = e.payer_commitment_tx_hash;
    info.curr_rsmc_temp_address_pub_key     = addr_1.result.pubkey;
    info.curr_rsmc_temp_address_private_key = addr_1.result.wif;
    info.curr_htlc_temp_address_pub_key     = addr_2.result.pubkey;
    info.curr_htlc_temp_address_private_key = addr_2.result.wif;
    info.last_temp_address_private_key      = getTempPrivKey(myUserID, kTempPrivKey, e.channel_id);
    info.channel_address_private_key        = await asyncGetFundingPrivKey(
        myUserID, db, e.channel_id, kTbFundingPrivKey);

    // SDK API
    HTLCSigned(myUserID, nodeID, userID, info);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100041(nodeID, userID, info);
}

/**
 * listening to -110041
 * @param e 
 */
function listening110041(e) {
    saveChannelStatus(e.to_peer_id, e.channel_id, true, kStatusHTLCSigned);
}

/**
 * auto response to -100045 (forwardR) 
 * listening to -110045 and send -100046 signR
 * @param e 
 */
async function listening110045(e) {

    let isAutoMode = getAutoPilot();
    console.info('SDK: NOW isAutoMode = ' + isAutoMode);

    let myUserID = e.to_peer_id;

    saveTempHash(e.msg_hash);
    saveForwardR(e.r);
    saveChannelStatus(myUserID, e.channel_id, true, kStatusForwardR);

    if (isAutoMode === 'No' || isAutoMode === null) return;
    
    console.info('listening110045 = ' + JSON.stringify(e));
    
    let nodeID   = e.payee_node_address;
    let userID   = e.payee_peer_id;

    // Alice will send -100046 signR
    let info                         = new SignRInfo();
    info.channel_id                  = e.channel_id;
    info.r                           = e.r;
    info.msg_hash                    = e.msg_hash;
    info.channel_address_private_key = await asyncGetFundingPrivKey(
        myUserID, db, e.channel_id, kTbFundingPrivKey);

    // SDK API
    signR(nodeID, userID, info);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100046(nodeID, userID, info);
}

/**
 * listening to -110046
 * @param e 
 */
function listening110046(e) {
    saveChannelStatus(e.to_peer_id, e.channel_id, false, kStatusSignR);
}

/**
 * auto response to -100049 (CloseHTLC) 
 * listening to -110049 and send -100050 CloseHTLCSigned
 * @param e 
 * @param netType true: testnet  false: mainnet
 */
async function listening110049(e, netType) {

    let isAutoMode = getAutoPilot();
    console.info('SDK: NOW isAutoMode = ' + isAutoMode);

    let myUserID = e.to_peer_id;

    saveTempHash(e.msg_hash);
    saveChannelStatus(myUserID, e.channel_id, false, kStatusCloseHTLC);

    if (isAutoMode === 'No' || isAutoMode === null) return;
    
    console.info('listening110049 = ' + JSON.stringify(e));

    let nodeID   = e.sender_node_address;
    let userID   = e.sender_peer_id;

    let addr = genNewAddress(myUserID, netType);
    saveAddress(myUserID, addr);
    
    // will send -100050 CloseHTLCSigned
    let info                                         = new CloseHtlcTxInfoSigned();
    info.msg_hash                                    = e.msg_hash;
    info.channel_address_private_key                 = await asyncGetFundingPrivKey(
        myUserID, db, e.channel_id, kTbFundingPrivKey);
    info.last_rsmc_temp_address_private_key          = getTempPrivKey(myUserID, kRsmcTempPrivKey, e.channel_id);
    info.last_htlc_temp_address_private_key          = getTempPrivKey(myUserID, kHtlcTempPrivKey, e.channel_id);
    info.last_htlc_temp_address_for_htnx_private_key = getTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, e.channel_id);
    info.curr_rsmc_temp_address_pub_key              = addr.result.pubkey;
    info.curr_rsmc_temp_address_private_key          = addr.result.wif;

    // SDK API
    closeHTLCSigned(myUserID, nodeID, userID, info);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100050(nodeID, userID, info);
}

/**
 * listening to -110050
 * @param e 
 */
function listening110050(e) {
    saveChannelStatus(e.to_peer_id, e.channel_id, true, kStatusCloseHTLCSigned);
}

/**
 * listening to -110080
 * @param e 
 */
function listening110080(e) {
    saveChannelStatus(e.to_peer_id, e.channel_id, false, kStatusAtomicSwap);
}

/**
 * listening to -110081
 * @param e 
 */
function listening110081(e) {
    saveChannelStatus(e.to_peer_id, e.channel_id, true, kStatusAcceptSwap);
}

/**
 * auto response to -100340 (bitcoinFundingCreated)
 * listening to -110340 and send -100350 bitcoinFundingSigned
 * @param e 
 */
async function listening110340(e) {

    let isAutoMode = getAutoPilot();
    console.info('SDK: NOW isAutoMode = ' + isAutoMode);
    saveTempHash(e.funding_txid);

    let myUserID     = e.to_peer_id;
    let channel_id   = e.temporary_channel_id;
    let status       = await getChannelStatus(channel_id, false);
    console.info('listening110340 status = ' + status);
    switch (Number(status)) {
        case kStatusAcceptChannel:
            saveChannelStatus(myUserID, channel_id, false, kStatusFirstBitcoinFundingCreated);
            break;
        case kStatusFirstBitcoinFundingSigned:
            saveChannelStatus(myUserID, channel_id, false, kStatusSecondBitcoinFundingCreated);
            break;
        case kStatusSecondBitcoinFundingSigned:
            saveChannelStatus(myUserID, channel_id, false, kStatusThirdBitcoinFundingCreated);
            break;
    }
            

    if (isAutoMode === 'No' || isAutoMode === null) return;
    
    console.info('listening110340 = ' + JSON.stringify(e));

    let nodeID   = e.funder_node_address;
    let userID   = e.funder_peer_id;

    // will send -100350 bitcoinFundingSigned
    let info                          = new FundingBtcSigned();
    info.temporary_channel_id         = channel_id;
    info.channel_address_private_key  = await asyncGetFundingPrivKey(
        myUserID, db, channel_id, kTbFundingPrivKey);
    info.funding_txid                 = e.funding_txid;
    info.approval                     = true;

    // SDK API
    bitcoinFundingSigned(nodeID, userID, info);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100350(nodeID, userID, info);
}

/**
 * listening to -110350
 * @param e 
 */
async function listening110350(e) {
    console.info('listening110350');

    let myUserID     = e.to_peer_id;
    let channel_id   = e.temporary_channel_id;
    let status       = await getChannelStatus(channel_id, true);
    console.info('listening110350 status = ' + status);
    switch (Number(status)) {
        case kStatusFirstBitcoinFundingCreated:
            saveChannelStatus(myUserID, channel_id, true, kStatusFirstBitcoinFundingSigned);
            break;
        case kStatusSecondBitcoinFundingCreated:
            saveChannelStatus(myUserID, channel_id, true, kStatusSecondBitcoinFundingSigned);
            break;
        case kStatusThirdBitcoinFundingCreated:
            saveChannelStatus(myUserID, channel_id, true, kStatusThirdBitcoinFundingSigned);
            break;
    }
}

/**
 * auto response to -100351 (commitmentTransactionCreated)
 * listening to -110351 and send -100352 commitmentTransactionAccepted
 * @param e 
 * @param netType true: testnet  false: mainnet
 */
async function listening110351(e, netType) {

    let isAutoMode = getAutoPilot();
    console.info('SDK: NOW isAutoMode = ' + isAutoMode);

    let myUserID = e.to_peer_id;

    saveTempHash(e.msg_hash);
    saveChannelStatus(myUserID, e.channel_id, false, kStatusCommitmentTransactionCreated);

    if (isAutoMode === 'No' || isAutoMode === null) return;
    
    console.info('listening110351 = ' + JSON.stringify(e));

    let nodeID   = e.payer_node_address;
    let userID   = e.payer_peer_id;
    

    let addr = genNewAddress(myUserID, netType);
    saveAddress(myUserID, addr);

    // will send -100352 commitmentTransactionAccepted
    let info                           = new CommitmentTxSigned();
    info.channel_id                    = e.channel_id;
    info.msg_hash                      = e.msg_hash;
    info.curr_temp_address_pub_key     = addr.result.pubkey;
    info.curr_temp_address_private_key = addr.result.wif;
    info.approval                      = true;
    info.last_temp_address_private_key = getTempPrivKey(myUserID, kTempPrivKey, e.channel_id);
    info.channel_address_private_key   = await asyncGetFundingPrivKey(
        myUserID, db, e.channel_id, kTbFundingPrivKey);

    // SDK API
    commitmentTransactionAccepted(myUserID, nodeID, userID, info);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100352(nodeID, userID, info);
}

/**
 * listening to -110352
 * @param e 
 */
function listening110352(e) {
    saveChannelStatus(e.to_peer_id, e.channel_id, true, kStatusCommitmentTransactionAccepted);
}