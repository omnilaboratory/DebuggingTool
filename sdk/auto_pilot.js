// auto_pilot.js
// Auto Pilot
// Auto response to some request like 
// openChannel, bitcoinFundingCreated, assetFundingCreated, 
// commitmentTransactionCreated, addHTLC, forwardR, closeHTLC.

/**
 * Register event needed for listening.
 * @param netType true: testnet  false: mainnet
 */
function registerEvent(netType) {
    // auto response mode
    let msg_110032 = enumMsgType.MsgType_RecvChannelOpen_32;
    obdApi.registerEvent(msg_110032, function(e) {
        listening110032(e, netType);
    });

    // auto response mode
    let msg_110340 = enumMsgType.MsgType_FundingCreate_RecvBtcFundingCreated_340;
    obdApi.registerEvent(msg_110340, function(e) {
        listening110340(e);
    });

    // auto response mode
    let msg_110034 = enumMsgType.MsgType_FundingCreate_RecvAssetFundingCreated_34;
    obdApi.registerEvent(msg_110034, function(e) {
        listening110034(e);
    });

    // auto response mode
    let msg_110035 = enumMsgType.MsgType_FundingSign_RecvAssetFundingSigned_35;
    obdApi.registerEvent(msg_110035, function(e) {
        listening110035(e);
    });

    // auto response mode
    let msg_110351 = enumMsgType.MsgType_CommitmentTx_RecvCommitmentTransactionCreated_351;
    obdApi.registerEvent(msg_110351, function(e) {
        listening110351(e);
    });
    
    // auto response mode
    let msg_110040 = enumMsgType.MsgType_HTLC_RecvAddHTLC_40;
    obdApi.registerEvent(msg_110040, function(e) {
        listening110040(e);
    });

    // auto response mode
    let msg_110045 = enumMsgType.MsgType_HTLC_RecvVerifyR_45;
    obdApi.registerEvent(msg_110045, function(e) {
        listening110045(e);
    });

    // auto response mode
    let msg_110049 = enumMsgType.MsgType_HTLC_RecvRequestCloseCurrTx_49;
    obdApi.registerEvent(msg_110049, function(e) {
        listening110049(e);
    });

    // save request_close_channel_hash
    let msg_110038 = enumMsgType.MsgType_RecvCloseChannelRequest_38;
    obdApi.registerEvent(msg_110038, function(e) {
        listening110038(e);
    });
}

/**
 * auto response to -100032 (openChannel) 
 * listening to -110032 and send -100033 acceptChannel
 * 
 * @param e 
 * @param netType true: testnet  false: mainnet
 */
function listening110032(e, netType) {

    let isAutoMode = getAutoPilot();
    console.info('SDK: NOW isAutoMode = ' + isAutoMode);

    saveChannelID(e.temporary_channel_id);

    if (isAutoMode === 'No' || isAutoMode === null) return;
    
    console.info('SDK: listening110032 = ' + JSON.stringify(e));

    let nodeID   = e.funder_node_address;
    let userID   = e.funder_peer_id;
    let myUserID = e.to_peer_id;
    let temp_cid = e.temporary_channel_id;

    // Generate an address from mnemonic words.
    let index    = getNewAddrIndex(myUserID);
    // console.info('SDK: addr index = ' + index);
    let mnemonic = getMnemonic(myUserID, 1);
    let addr     = genAddressFromMnemonic(mnemonic, index, netType);
    saveAddress(myUserID, addr);

    // will send -100033 acceptChannel
    let info                  = new AcceptChannelInfo();
    info.temporary_channel_id = temp_cid;
    info.funding_pubkey       = addr.result.pubkey;
    info.approval             = true;

    // SDK API
    acceptChannel(myUserID, nodeID, userID, info);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100033(nodeID, userID, info);
}