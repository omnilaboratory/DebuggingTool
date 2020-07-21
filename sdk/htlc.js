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
    obdApi.payInvoice(info, function(e) {
        console.info('SDK: -100401 - payInvoice = ' + JSON.stringify(e));
        saveHtlcH(e.h);
        saveRoutingPacket(e.routing_packet);
        saveCltvExpiry(e.min_cltv_expiry);
    });
}

/**
 * Add an HTLC.
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function addHTLC(myUserID, nodeID, userID, info) {
    obdApi.htlcCreated(nodeID, userID, info, function(e) {
        console.info('SDK: -100040 htlcCreated = ' + JSON.stringify(e));
        saveChannelID(e.channel_id);
        // save 3 privkeys
        saveTempPrivKey(myUserID, kRsmcTempPrivKey, e.channel_id, 
            info.curr_rsmc_temp_address_private_key);
        saveTempPrivKey(myUserID, kHtlcTempPrivKey, e.channel_id, 
            info.curr_htlc_temp_address_private_key);
        saveTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, e.channel_id, 
            info.curr_htlc_temp_address_for_ht1a_private_key);
    });
}

/**
 * Type -100041 Protocol is used to response an incoming HTLC.
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function HTLCSigned(myUserID, nodeID, userID, info) {
    obdApi.htlcSigned(nodeID, userID, info, function(e) {
        console.info('SDK: -100041 htlcSigned = ' + JSON.stringify(e));
        // saveChannelList(e, e.channel_id, msgType);

        saveChannelID(e.channel_id);
        saveTempPrivKey(myUserID, kRsmcTempPrivKey, e.channel_id, info.curr_rsmc_temp_address_private_key);
        saveTempPrivKey(myUserID, kHtlcTempPrivKey, e.channel_id, info.curr_htlc_temp_address_private_key);
    });
}

/**
 * Type -100045 Protocol is used to forward R to a user.
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function htlcSendVerifyR(myUserID, nodeID, userID, info) {
    obdApi.htlcSendVerifyR(nodeID, userID, info, function(e) {
        console.info('SDK: -100045 htlcSendVerifyR = ' + JSON.stringify(e));
        // saveChannelList(e, e.channel_id, msgType);

        saveChannelID(e.channel_id);
        saveTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, e.channel_id, 
            info.curr_htlc_temp_address_for_he1b_private_key);
    });
}

/**
 * Type -100046 Protocol is used to recieve reverify R. 
 * If correct, then creates rest HTLC commitment transactions.
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function htlcSendSignVerifyR(nodeID, userID, info) {
    obdApi.htlcSendSignVerifyR(nodeID, userID, info, function(e) {
        console.info('SDK: -100046 htlcSendSignVerifyR = ' + JSON.stringify(e));
        // saveChannelList(e, e.channel_id, msgType);
        saveChannelID(e.channel_id);
    });
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
    obdApi.closeHTLC(nodeID, userID, info, function(e) {
        console.info('SDK: -100049 closeHTLC = ' + JSON.stringify(e));
        // saveChannelList(e, e.channel_id, msgType);
        // saveTempPrivKey(RsmcTempPrivKey, e.channel_id, info.curr_rsmc_temp_address_private_key);
        saveChannelID(e.channel_id);
        addDataInTable(myUserID, e.channel_id, 
            info.curr_rsmc_temp_address_private_key, kTbTempPrivKey);
    });
}