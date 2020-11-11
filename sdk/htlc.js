// htlc.js
// HTLC Payment


/**
 *  create an invoice.
 *  @param info 
 *  @param callback 
 */
function addInvoice(info, callback) {
    obdApi.addInvoice(info, callback);
}

/**
 * This protocol is the first step of a payment, 
 * which seeks a full path of nodes, decide which path is the 
 * optimistic one, in terms of hops, node's histroy service quility, and fees.
 * 
 * @param info 
 */
function HTLCFindPath(info) {
    return new Promise((resolve, reject) => {
        obdApi.HTLCFindPath(info, function(e) {
            console.info('SDK: -100401 - HTLCFindPath = ' + JSON.stringify(e));
            resolve(e);
        });
    })
}

/**
 * Add an HTLC.
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 * @param isFunder 
 */
function addHTLC(myUserID, nodeID, userID, info, isFunder) {
    return new Promise((resolve, reject) => {
        obdApi.addHTLC(nodeID, userID, info, function(e) {
            console.info('SDK: -100040 addHTLC = ' + JSON.stringify(e));

            // FUNCTION ONLY FOR GUI TOOL
            // disableInvokeAPI();
            // afterCommitmentTransactionCreated();

            // Sender sign the tx on client side
            // NO.1 counterparty_raw_data
            let cr      = e.counterparty_raw_data;
            let inputs  = cr.inputs;
            let privkey = await getFundingPrivKey(myUserID, e.channel_id);
            let cr_hex  = signP2SH(true, cr.hex, cr.pub_key_a, cr.pub_key_b, 
                privkey, inputs);

            // NO.2 rsmc_raw_data
            let rr     = e.rsmc_raw_data;
            inputs     = rr.inputs;
            let rr_hex = signP2SH(true, rr.hex, rr.pub_key_a, rr.pub_key_b, 
                privkey, inputs);

            // NO.3 rsmc_raw_data
            let rr     = e.rsmc_raw_data;
            inputs     = rr.inputs;
            let rr_hex = signP2SH(true, rr.hex, rr.pub_key_a, rr.pub_key_b, 
                privkey, inputs);

            // will send 100100
            let signedInfo                     = new SignedInfo100100();
            signedInfo.channel_id              = e.channel_id;
            signedInfo.counterparty_signed_hex = cr_hex;
            signedInfo.rsmc_signed_hex         = rr_hex;

            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage100100(nodeID, userID, signedInfo);

            // SDK API
            await sendSignedHex100100(nodeID, userID, signedInfo);

            // save 3 privkeys
            saveTempPrivKey(myUserID, kRsmcTempPrivKey, e.channel_id, 
                info.curr_rsmc_temp_address_private_key);
            saveTempPrivKey(myUserID, kHtlcTempPrivKey, e.channel_id, 
                info.curr_htlc_temp_address_private_key);
            saveTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, e.channel_id, 
                info.curr_htlc_temp_address_for_ht1a_private_key);

            //
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusAddHTLC);
            saveSenderRole(kIsSender);
            resolve(true);
        });
    })
}

/**
 * Type -100041 Protocol is used to response an incoming HTLC.
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 * @param isFunder 
 */
function HTLCSigned(myUserID, nodeID, userID, info, isFunder) {
    return new Promise((resolve, reject) => {
        obdApi.htlcSigned(nodeID, userID, info, function(e) {
            console.info('SDK: -100041 htlcSigned = ' + JSON.stringify(e));
            saveTempPrivKey(myUserID, kRsmcTempPrivKey, e.channel_id, info.curr_rsmc_temp_address_private_key);
            saveTempPrivKey(myUserID, kHtlcTempPrivKey, e.channel_id, info.curr_htlc_temp_address_private_key);
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusHTLCSigned);
            resolve(e);
        });
    })
}

/**
 * Type -100045 Protocol is used to forward R to a user.
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 * @param isFunder 
 */
function forwardR(myUserID, nodeID, userID, info, isFunder) {
    return new Promise((resolve, reject) => {
        obdApi.forwardR(nodeID, userID, info, function(e) {
            console.info('SDK: -100045 forwardR = ' + JSON.stringify(e));
            saveTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, e.channel_id, 
                info.curr_htlc_temp_address_for_he1b_private_key);
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusForwardR);
            resolve(true);
        });
    })
}

/**
 * Type -100046 Protocol is used to recieve reverify R. 
 * If correct, then creates rest HTLC commitment transactions.
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 * @param isFunder 
 */
function signR(myUserID, nodeID, userID, info, isFunder) {
    return new Promise((resolve, reject) => {
        obdApi.signR(nodeID, userID, info, function(e) {
            console.info('SDK: -100046 signR = ' + JSON.stringify(e));
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusSignR);
            resolve(true);
        });
    })
}

/**
 * Type -100049 message is used to close a HTLC.
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 * @param isFunder 
 */
function closeHTLC(myUserID, nodeID, userID, info, isFunder) {
    return new Promise((resolve, reject) => {
        obdApi.closeHTLC(nodeID, userID, info, function(e) {
            console.info('SDK: -100049 closeHTLC = ' + JSON.stringify(e));
            saveTempPrivKey(myUserID, kTempPrivKey, e.channel_id, 
                info.curr_rsmc_temp_address_private_key);
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusCloseHTLC);
            saveSenderRole(kIsSender);
            resolve(true);
        });
    })
}

/**
 * Type -100050 Protocol is used to response the request of close HTLC .
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 * @param isFunder 
 */
function closeHTLCSigned(myUserID, nodeID, userID, info, isFunder) {
    return new Promise((resolve, reject) => {
        obdApi.closeHTLCSigned(nodeID, userID, info, function(e) {
            console.info('SDK: -100050 closeHTLCSigned = ' + JSON.stringify(e));
            saveTempPrivKey(myUserID, kTempPrivKey, e.channel_id, info.curr_rsmc_temp_address_private_key);
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusCloseHTLCSigned);
            resolve(true);
        });
    })
}
