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
    saveCounterparty(myUserID, channel_id, nodeID, userID);

    if (isAutoMode != 'Yes') return;

    console.info('SDK: listening110032 = ' + JSON.stringify(e));

    // will send -100033 acceptChannel
    let info                  = new AcceptChannelInfo();
    info.temporary_channel_id = channel_id;
    info.approval             = true;

    let isExist = 0;
    while (isExist === 0) {
        let addr = genNewAddress(myUserID, netType);
        saveAddress(myUserID, addr);
        info.funding_pubkey = addr.result.pubkey;
        isExist = await checkChannelAddessExist(nodeID, userID, info);
    }

    // Save address index to OBD and can get private key back if lose it.
    info.fundee_address_index = Number(getIndexFromPubKey(info.funding_pubkey));

    // SDK API send -100033 acceptChannel
    await acceptChannel(myUserID, nodeID, userID, info);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100033(nodeID, userID, info);
    afterAcceptChannel();
    displayMyChannelListAtTopRight(kPageSize, kPageIndex);
}

/**
 * listening to -110033
 * @param e 
 */
function listening110033(e) {
    saveChannelStatus(e.to_peer_id, e.temporary_channel_id, true, kStatusAcceptChannel);
    saveChannelAddr(e.temporary_channel_id, e.channel_address);
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

    // Bob sign the tx on client
    let privkey = await getFundingPrivKey(myUserID, channel_id);
    let data    = e.sign_data;
    let inputs  = data.inputs;
    // console.info('e.sign_data = ' + JSON.stringify(e.sign_data));
    let signed_hex = signP2SH(false, data.hex, data.pub_key_a, 
        data.pub_key_b, privkey, inputs);
    // let signed_hex = signP2SH(false, data.hex, data.pub_key_a, 
    //     data.pub_key_b, privkey, data.inputs[0].amount);
    saveSignedHex(myUserID, channel_id, signed_hex);


    // auto mode is closed
    if (isAutoMode != 'Yes') return;

    console.info('listening110034 = ' + JSON.stringify(e));

    let nodeID = e.funder_node_address;
    let userID = e.funder_peer_id;

    // will send -100035 AssetFundingSigned
    let info                   = new AssetFundingSignedInfo();
    info.temporary_channel_id  = channel_id;
    info.signed_alice_rsmc_hex = signed_hex;

    // SDK API
    let resp = await assetFundingSigned(myUserID, nodeID, userID, info);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100035(nodeID, userID, info);
    afterAssetFundingSigned(resp);
    displayMyChannelListAtTopRight(kPageSize, kPageIndex);
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

    let fundingPrivKey = await getFundingPrivKey(myUserID, tempCID);
    saveFundingPrivKey(myUserID, channel_id, fundingPrivKey);

    //
    let tempPrivKey = getTempPrivKey(myUserID, kTempPrivKey, tempCID);
    saveTempPrivKey(myUserID, kTempPrivKey, channel_id, tempPrivKey);

    //
    delChannelAddr(tempCID);
    saveChannelAddr(channel_id, channel_addr);

    //
    delChannelStatus(tempCID, true);
    saveChannelStatus(myUserID, channel_id, true, kStatusAssetFundingSigned);

    //
    let result = await getCounterparty(myUserID, tempCID);
    saveCounterparty(myUserID, channel_id, result.toNodeID, result.toUserID);
    delCounterparty(myUserID, tempCID);


    // Alice sign the tx on client
    let signed_hex = signP2SH(false, e.hex, e.pub_key_a, e.pub_key_b, 
        tempPrivKey, e.inputs);
    // let signed_hex = signP2SH(false, e.hex, e.pub_key_a, e.pub_key_b, 
    //     fundingPrivKey, e.inputs[0].amount);

    // will send -101134
    let info           = new SignedInfo101134();
    info.channel_id    = channel_id;
    info.rd_signed_hex = signed_hex;
    await sendSignedHex101134(info);
}

/**
 * listening to -110038 and save request_close_channel_hash
 * @param e 
 */
async function listening110038(e) {
    saveTempData(e.to_peer_id, e.channel_id, e.request_close_channel_hash);
    let isFunder = await getIsFunder(e.to_peer_id, e.channel_id);
    saveChannelStatus(e.to_peer_id, e.channel_id, isFunder, kStatusCloseChannel);
    saveSenderRole(kIsReceiver);
}

/**
 * listening to -110039
 * @param e 
 */
async function listening110039(e) {
    let isFunder = await getIsFunder(e.to_peer_id, e.channel_id);
    saveChannelStatus(e.to_peer_id, e.channel_id, isFunder, kStatusCloseChannelSigned);
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

    saveInvoiceH(e.h);
    saveTempData(myUserID, e.channel_id, e.payer_commitment_tx_hash);

    let isFunder = await getIsFunder(myUserID, e.channel_id);
    saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusAddHTLC);
    saveSenderRole(kIsReceiver);

    if (isAutoMode != 'Yes') return;

    console.info('listening110040 = ' + JSON.stringify(e));

    let nodeID   = e.payer_node_address;
    let userID   = e.payer_peer_id;

    let addr_1 = genNewAddress(myUserID, netType);
    let addr_2 = genNewAddress(myUserID, netType);
    saveAddress(myUserID, addr_1);
    saveAddress(myUserID, addr_2);

    // Bob will send -100041 HTLCSigned
    // is payInvoice Step 3 also

    let info                                = new HtlcSignedInfo();
    info.payer_commitment_tx_hash           = e.payer_commitment_tx_hash;
    info.curr_rsmc_temp_address_pub_key     = addr_1.result.pubkey;
    info.curr_rsmc_temp_address_private_key = addr_1.result.wif;
    info.curr_htlc_temp_address_pub_key     = addr_2.result.pubkey;
    info.curr_htlc_temp_address_private_key = addr_2.result.wif;
    info.last_temp_address_private_key      = getTempPrivKey(myUserID, kTempPrivKey, e.channel_id);
    info.channel_address_private_key        = await getFundingPrivKey(myUserID, e.channel_id);

    // Save address index to OBD and can get private key back if lose it.
    info.curr_rsmc_temp_address_index = Number(getIndexFromPubKey(addr_1.result.pubkey));
    info.curr_htlc_temp_address_index = Number(getIndexFromPubKey(addr_2.result.pubkey));

    // SDK API
    let resp = await HTLCSigned(myUserID, nodeID, userID, info, isFunder);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100041(nodeID, userID, info);
    afterHTLCSigned();

    //------------------------
    // If Bob has R, will send -100045 forwardR
    let fundingPrivKey = info.channel_address_private_key;
    payInvoiceStep4(myUserID, resp, nodeID, userID, e.channel_id, fundingPrivKey);
}

/**
 * payInvoice Step 4, Bob will send -100045 forwardR
 * @param myUserID 
 * @param e 
 * @param nodeID 
 * @param userID 
 * @param channel_id
 * @param fundingPrivKey
 */
async function payInvoiceStep4(myUserID, e, nodeID, userID, channel_id, fundingPrivKey) {
    
    if (e === null) {
        alert("HTLCSigned failed. payInvoice paused.");
        return;
    }

    let r = getPrivKeyFromPubKey(myUserID, getInvoiceH());

    // Bob has NOT R. Bob maybe a middleman node.
    if (r === '') return;

    // Bob will send -100045 forwardR
    let info        = new ForwardRInfo();
    info.channel_id = channel_id;
    info.r          = r;
    console.info('-100045 forwardR info.r = ' + info.r);
    
    let result = genNewAddress(myUserID, true);
    saveAddress(myUserID, result);

    info.curr_htlc_temp_address_for_he1b_pub_key     = result.result.pubkey;
    info.curr_htlc_temp_address_for_he1b_private_key = result.result.wif;
    info.channel_address_private_key                 = fundingPrivKey;

    // Save address index to OBD and can get private key back if lose it.
    info.curr_htlc_temp_address_for_he1b_index = Number(getIndexFromPubKey(result.result.pubkey));

    displaySentMessage100045(nodeID, userID, info);

    let isFunder = await getIsFunder(myUserID, channel_id);
    await forwardR(myUserID, nodeID, userID, info, isFunder);

    // NOT SDK API. This a client function, just for Debugging Tool.
    afterForwardR();
}

/**
 * listening to -110041
 * @param e 
 */
async function listening110041(e) {
    let isFunder = await getIsFunder(e.to_peer_id, e.channel_id);
    saveChannelStatus(e.to_peer_id, e.channel_id, isFunder, kStatusHTLCSigned);
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

    saveTempData(myUserID, e.channel_id, e.msg_hash);
    saveInvoiceR(e.r);
    // saveForwardR(myUserID, e.channel_id, e.r);

    let isFunder = await getIsFunder(myUserID, e.channel_id);
    saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusForwardR);

    if (isAutoMode != 'Yes') {  // auto mode closed
        let isInPayInvoice = getPayInvoiceCase();
        console.info('isInPayInvoice = ' + isInPayInvoice);
        // Not in pay invoice case
        if (isInPayInvoice != 'Yes') return;
    }

    console.info('listening110045 = ' + JSON.stringify(e));
    
    let nodeID   = e.payee_node_address;
    let userID   = e.payee_peer_id;

    // Alice will send -100046 signR
    // is payInvoice Step 5 also

    let info                         = new SignRInfo();
    info.channel_id                  = e.channel_id;
    info.r                           = e.r;
    info.msg_hash                    = e.msg_hash;
    info.channel_address_private_key = await getFundingPrivKey(myUserID, e.channel_id);

    // SDK API
    let resp = await signR(myUserID, nodeID, userID, info, isFunder);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100046(nodeID, userID, info);
    afterSignR();

    //------------------------
    // ////// If is payInvoice case, Alice will send -100049 closeHTLC
    // Alice will send -100049 closeHTLC
    let fundingPrivKey = info.channel_address_private_key;
    payInvoiceStep6(myUserID, resp, nodeID, userID, e.channel_id, fundingPrivKey);
}

/**
 * payInvoice Step 6, Alice will send -100049 closeHTLC
 * @param myUserID 
 * @param e 
 * @param nodeID 
 * @param userID 
 * @param channel_id 
 * @param fundingPrivKey 
 */
async function payInvoiceStep6(myUserID, e, nodeID, userID, channel_id, fundingPrivKey) {

    if (e === null) {
        alert("signR failed. payInvoice paused.");
        return;
    }

    // let isInPayInvoice = getPayInvoiceCase();
    // console.info('payInvoiceStep6 isInPayInvoice = ' + isInPayInvoice);

    // Not in pay invoice case
    // if (isInPayInvoice != 'Yes') return;

    // Alice will send -100049 closeHTLC

    let info                         = new CloseHtlcTxInfo();
    info.channel_id                  = channel_id;
    info.channel_address_private_key = fundingPrivKey;

    let privkey_1 = getTempPrivKey(myUserID, kRsmcTempPrivKey, channel_id);
    let privkey_2 = getTempPrivKey(myUserID, kHtlcTempPrivKey, channel_id);
    let privkey_3 = getTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, channel_id);

    info.last_rsmc_temp_address_private_key          = privkey_1;
    info.last_htlc_temp_address_private_key          = privkey_2;
    info.last_htlc_temp_address_for_htnx_private_key = privkey_3;
    
    let result = genNewAddress(myUserID, true);
    saveAddress(myUserID, result);

    info.curr_rsmc_temp_address_pub_key     = result.result.pubkey;
    info.curr_rsmc_temp_address_private_key = result.result.wif;

    // Save address index to OBD and can get private key back if lose it.
    info.curr_rsmc_temp_address_index = Number(getIndexFromPubKey(result.result.pubkey));

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100049(nodeID, userID, info);

    let isFunder = await getIsFunder(myUserID, channel_id);
    await closeHTLC(myUserID, nodeID, userID, info, isFunder);
}

/**
 * listening to -110046
 * @param e 
 */
async function listening110046(e) {
    let isFunder = await getIsFunder(e.to_peer_id, e.channel_id);
    saveChannelStatus(e.to_peer_id, e.channel_id, isFunder, kStatusSignR);
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

    saveTempData(myUserID, e.channel_id, e.msg_hash);

    let isFunder = await getIsFunder(myUserID, e.channel_id);
    saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusCloseHTLC);
    saveSenderRole(kIsReceiver);

    if (isAutoMode != 'Yes') {  // auto mode closed
        let r = getPrivKeyFromPubKey(myUserID, getInvoiceH());
        // Bob has NOT R. Bob maybe a middleman node.
        if (r === '') return;
    }

    console.info('listening110049 = ' + JSON.stringify(e));

    let nodeID   = e.sender_node_address;
    let userID   = e.sender_peer_id;

    let addr = genNewAddress(myUserID, netType);
    saveAddress(myUserID, addr);
    
    // will send -100050 CloseHTLCSigned
    // is payInvoice Step 7 also

    let info                                         = new CloseHtlcTxInfoSigned();
    info.msg_hash                                    = e.msg_hash;
    info.channel_address_private_key                 = await getFundingPrivKey(myUserID, e.channel_id);
    info.last_rsmc_temp_address_private_key          = getTempPrivKey(myUserID, kRsmcTempPrivKey, e.channel_id);
    info.last_htlc_temp_address_private_key          = getTempPrivKey(myUserID, kHtlcTempPrivKey, e.channel_id);
    info.last_htlc_temp_address_for_htnx_private_key = getTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, e.channel_id);
    info.curr_rsmc_temp_address_pub_key              = addr.result.pubkey;
    info.curr_rsmc_temp_address_private_key          = addr.result.wif;

    // Save address index to OBD and can get private key back if lose it.
    info.curr_rsmc_temp_address_index = Number(getIndexFromPubKey(addr.result.pubkey));
    
    // SDK API
    await closeHTLCSigned(myUserID, nodeID, userID, info, isFunder);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100050(nodeID, userID, info);
    afterCloseHTLCSigned();
    displayMyChannelListAtTopRight(kPageSize, kPageIndex);

    // Clear H at Bob side
    saveInvoiceH('');
}

/**
 * listening to -110050
 * @param e 
 */
async function listening110050(e) {
    let isFunder = await getIsFunder(e.to_peer_id, e.channel_id);
    saveChannelStatus(e.to_peer_id, e.channel_id, isFunder, kStatusCloseHTLCSigned);
    savePayInvoiceCase('No');
}

/**
 * listening to -110080
 * @param e 
 */
async function listening110080(e) {
    let isFunder = await getIsFunder(e.to_peer_id, e.channel_id);
    saveChannelStatus(e.to_peer_id, e.channel_id, isFunder, kStatusAtomicSwap);
    saveSenderRole(kIsReceiver);
}

/**
 * listening to -110081
 * @param e 
 */
async function listening110081(e) {
    let isFunder = await getIsFunder(e.to_peer_id, e.channel_id);
    saveChannelStatus(e.to_peer_id, e.channel_id, isFunder, kStatusAcceptSwap);
}

/**
 * auto response to -100340 (bitcoinFundingCreated)
 * listening to -110340 and send -100350 bitcoinFundingSigned
 * @param e 
 */
async function listening110340(e) {

    let isAutoMode = getAutoPilot();
    console.info('SDK: NOW isAutoMode = ' + isAutoMode);

    let myUserID   = e.to_peer_id;
    let channel_id = e.temporary_channel_id;
    let status     = await getChannelStatus(channel_id, false);
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
            
    saveTempData(myUserID, channel_id, e.funding_txid);

    // Bob sign the tx on client
    let privkey = await getFundingPrivKey(myUserID, channel_id);
    let data    = e.sign_data;
    let inputs  = data.inputs;
    // console.info('e.sign_data = ' + JSON.stringify(e.sign_data));
    let signed_hex = signP2SH(false, data.hex, data.pub_key_a, 
        data.pub_key_b, privkey, inputs);
    // let signed_hex = signP2SH(false, data.hex, data.pub_key_a, 
    //     data.pub_key_b, privkey, data.inputs[0].amount);
    saveSignedHex(myUserID, channel_id, signed_hex);


    // auto mode is closed
    if (isAutoMode != 'Yes') return;

    console.info('listening110340 = ' + JSON.stringify(e));

    let nodeID   = e.funder_node_address;
    let userID   = e.funder_peer_id;

    // will send -100350 bitcoinFundingSigned
    let info                          = new FundingBtcSigned();
    info.temporary_channel_id         = channel_id;
    info.funding_txid                 = e.funding_txid;
    info.approval                     = true;
    info.signed_miner_redeem_transaction_hex = signed_hex;

    // SDK API
    await bitcoinFundingSigned(myUserID, nodeID, userID, info);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100350(nodeID, userID, info);
    afterBitcoinFundingSigned(channel_id);
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
        case kStatusThirdFundingBitcoin:
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

    saveTempData(myUserID, e.channel_id, e.msg_hash);

    let isFunder = await getIsFunder(myUserID, e.channel_id);
    saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusCommitmentTransactionCreated);
    saveSenderRole(kIsReceiver);

    if (isAutoMode != 'Yes') return;

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
    info.channel_address_private_key   = await getFundingPrivKey(myUserID, e.channel_id);

    // Save address index to OBD and can get private key back if lose it.
    info.curr_temp_address_index = Number(getIndexFromPubKey(addr.result.pubkey));

    // SDK API
    await commitmentTransactionAccepted(myUserID, nodeID, userID, info, isFunder);

    // NOT SDK API. This a client function, just for Debugging Tool.
    displaySentMessage100352(nodeID, userID, info);
    afterCommitmentTransactionAccepted();
    displayMyChannelListAtTopRight(kPageSize, kPageIndex);
}

/**
 * listening to -110352
 * @param e 
 */
async function listening110352(e) {
    let isFunder = await getIsFunder(e.to_peer_id, e.channel_id);
    saveChannelStatus(e.to_peer_id, e.channel_id, isFunder, kStatusCommitmentTransactionAccepted);
}