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
 *  Pay an invoice. This protocol is the first step of a payment, 
 * which seeks a full path of nodes, decide which path is the 
 * optimistic one, in terms of hops, node's histroy service quility, and fees.
 * 
 *  @param info 
 */
function payInvoice(info) {
    return new Promise((resolve, reject) => {
        obdApi.payInvoice(info, function(e) {
            console.info('SDK: -100401 - payInvoice = ' + JSON.stringify(e));
            saveHtlcH(e.h);
            saveRoutingPacket(e.routing_packet);
            saveCltvExpiry(e.min_cltv_expiry);
            resolve(true);
        });
    })
}

/**
 * Add an HTLC.
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function addHTLC(myUserID, nodeID, userID, info) {
    return new Promise((resolve, reject) => {
        obdApi.htlcCreated(nodeID, userID, info, function(e) {
            console.info('SDK: -100040 htlcCreated = ' + JSON.stringify(e));
            // save 3 privkeys
            saveTempPrivKey(myUserID, kRsmcTempPrivKey, e.channel_id, 
                info.curr_rsmc_temp_address_private_key);
            saveTempPrivKey(myUserID, kHtlcTempPrivKey, e.channel_id, 
                info.curr_htlc_temp_address_private_key);
            saveTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, e.channel_id, 
                info.curr_htlc_temp_address_for_ht1a_private_key);

            //
            saveChannelStatus(myUserID, e.channel_id, true, kStatusAddHTLC);
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
 */
function HTLCSigned(myUserID, nodeID, userID, info) {
    return new Promise((resolve, reject) => {
        obdApi.htlcSigned(nodeID, userID, info, function(e) {
            console.info('SDK: -100041 htlcSigned = ' + JSON.stringify(e));
            saveTempPrivKey(myUserID, kRsmcTempPrivKey, e.channel_id, info.curr_rsmc_temp_address_private_key);
            saveTempPrivKey(myUserID, kHtlcTempPrivKey, e.channel_id, info.curr_htlc_temp_address_private_key);
            saveChannelStatus(myUserID, e.channel_id, false, kStatusHTLCSigned);
            resolve(true);
        });
    })
}

/**
 * Type -100045 Protocol is used to forward R to a user.
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function forwardR(myUserID, nodeID, userID, info) {
    return new Promise((resolve, reject) => {
        obdApi.forwardR(nodeID, userID, info, function(e) {
            console.info('SDK: -100045 forwardR = ' + JSON.stringify(e));
            saveTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, e.channel_id, 
                info.curr_htlc_temp_address_for_he1b_private_key);
            saveChannelStatus(myUserID, e.channel_id, false, kStatusForwardR);
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
 */
function signR(myUserID, nodeID, userID, info) {
    return new Promise((resolve, reject) => {
        obdApi.signR(nodeID, userID, info, function(e) {
            console.info('SDK: -100046 signR = ' + JSON.stringify(e));
            saveChannelStatus(myUserID, e.channel_id, true, kStatusSignR);
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
 */
function closeHTLC(myUserID, nodeID, userID, info) {
    return new Promise((resolve, reject) => {
        obdApi.closeHTLC(nodeID, userID, info, function(e) {
            console.info('SDK: -100049 closeHTLC = ' + JSON.stringify(e));
            saveTempPrivKey(myUserID, kTempPrivKey, e.channel_id, 
                info.curr_rsmc_temp_address_private_key);
            saveChannelStatus(myUserID, e.channel_id, true, kStatusCloseHTLC);
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
 */
function closeHTLCSigned(myUserID, nodeID, userID, info) {
    return new Promise((resolve, reject) => {
        obdApi.closeHTLCSigned(nodeID, userID, info, function(e) {
            console.info('SDK: -100050 closeHTLCSigned = ' + JSON.stringify(e));
            saveTempPrivKey(myUserID, kTempPrivKey, e.channel_id, info.curr_rsmc_temp_address_private_key);
            saveChannelStatus(myUserID, e.channel_id, false, kStatusCloseHTLCSigned);
            resolve(true);
        });
    })
}
