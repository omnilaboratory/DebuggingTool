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
            // NO.1 c3a_counterparty_raw_data
            let cr      = e.c3a_counterparty_raw_data;
            let inputs  = cr.inputs;
            let privkey = await getFundingPrivKey(myUserID, e.channel_id);
            let cr_hex  = signP2SH(true, cr.hex, cr.pub_key_a, cr.pub_key_b, 
                privkey, inputs);

            // NO.2 c3a_htlc_raw_data
            let hr     = e.c3a_htlc_raw_data;
            inputs     = hr.inputs;
            let hr_hex = signP2SH(true, hr.hex, hr.pub_key_a, hr.pub_key_b, 
                privkey, inputs);

            // NO.3 c3a_rsmc_raw_data
            let rr     = e.c3a_rsmc_raw_data;
            inputs     = rr.inputs;
            let rr_hex = signP2SH(true, rr.hex, rr.pub_key_a, rr.pub_key_b, 
                privkey, inputs);

            // will send 100100
            let signedInfo                                 = new SignedInfo100100();
            signedInfo.channel_id                          = e.channel_id;
            signedInfo.c3a_counterparty_partial_signed_hex = cr_hex;
            signedInfo.c3a_htlc_partial_signed_hex         = hr_hex;
            signedInfo.c3a_rsmc_partial_signed_hex         = rr_hex;

            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage100100(nodeID, userID, signedInfo);

            // SDK API
            await sendSignedHex100100(nodeID, userID, signedInfo);

            // save 3 privkeys
            saveTempPrivKey(myUserID, kRsmcTempPrivKey, e.channel_id, 
                getPrivKeyFromPubKey(myUserID, info.curr_rsmc_temp_address_pub_key));
            saveTempPrivKey(myUserID, kHtlcTempPrivKey, e.channel_id, 
                getPrivKeyFromPubKey(myUserID, info.curr_htlc_temp_address_pub_key));
            saveTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, e.channel_id, 
                getPrivKeyFromPubKey(myUserID, info.curr_htlc_temp_address_for_ht1a_pub_key));

            //
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusAddHTLC);
            saveSenderRole(kIsSender);
            resolve(true);
        });
    })
}

/**
 * Type -100100 Protocol send signed info that signed in 100040 to OBD.
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 */
function sendSignedHex100100(nodeID, userID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100100(nodeID, userID, signedInfo, function(e) {
            console.info('sendSignedHex100100 = ' + JSON.stringify(e));

            // FUNCTION ONLY FOR GUI TOOL
            // afterCommitmentTransactionAccepted();
            // displayMyChannelListAtTopRight(kPageSize, kPageIndex);

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
            
            let channel_id = e.channel_id;

            // Sign the tx on client side
            // NO.1 c3a_htlc_br_raw_data
            let ahb      = e.c3a_htlc_br_raw_data;
            let inputs   = ahb.inputs;
            let privkey  = await getFundingPrivKey(myUserID, channel_id);
            let ahb_hex  = signP2SH(true, ahb.hex, ahb.pub_key_a, ahb.pub_key_b, privkey, inputs);

            // NO.2 c3a_htlc_hlock_raw_data
            let ahl     = e.c3a_htlc_hlock_raw_data;
            inputs      = ahl.inputs;
            let ahl_hex = signP2SH(true, ahl.hex, ahl.pub_key_a, ahl.pub_key_b, privkey, inputs);

            // NO.3 c3a_htlc_ht_raw_data
            let ahh     = e.c3a_htlc_ht_raw_data;
            inputs      = ahh.inputs;
            let ahh_hex = signP2SH(true, ahh.hex, ahh.pub_key_a, ahh.pub_key_b, privkey, inputs);

            // NO.4 c3a_rsmc_br_raw_data
            let arb     = e.c3a_rsmc_br_raw_data;
            inputs      = arb.inputs;
            let arb_hex = signP2SH(true, arb.hex, arb.pub_key_a, arb.pub_key_b, privkey, inputs);

            // NO.5 c3a_rsmc_rd_raw_data
            let arr     = e.c3a_rsmc_rd_raw_data;
            inputs      = arr.inputs;
            let arr_hex = signP2SH(true, arr.hex, arr.pub_key_a, arr.pub_key_b, privkey, inputs);

            // NO.6 c3b_counterparty_raw_data
            let bc     = e.c3b_counterparty_raw_data;
            inputs     = bc.inputs;
            let bc_hex = signP2SH(true, bc.hex, bc.pub_key_a, bc.pub_key_b, privkey, inputs);

            // NO.7 c3b_htlc_raw_data
            let bh     = e.c3b_htlc_raw_data;
            inputs     = bh.inputs;
            let bh_hex = signP2SH(true, bh.hex, bh.pub_key_a, bh.pub_key_b, privkey, inputs);

            // NO.8 c3b_rsmc_raw_data
            let br     = e.c3b_rsmc_raw_data;
            inputs     = br.inputs;
            let br_hex = signP2SH(true, br.hex, br.pub_key_a, br.pub_key_b, privkey, inputs);
            
            // will send 100101
            let signedInfo                                 = new SignedInfo100101();
            signedInfo.channel_id                          = channel_id;
            signedInfo.c3a_rsmc_rd_partial_signed_hex      = arr_hex;
            signedInfo.c3a_rsmc_br_partial_signed_hex      = arb_hex;
            signedInfo.c3a_htlc_ht_partial_signed_hex      = ahh_hex;
            signedInfo.c3a_htlc_hlock_partial_signed_hex   = ahl_hex;
            signedInfo.c3a_htlc_br_partial_signed_hex      = ahb_hex;
            signedInfo.c3b_rsmc_partial_signed_hex         = br_hex;
            signedInfo.c3b_counterparty_partial_signed_hex = bc_hex;
            signedInfo.c3b_htlc_partial_signed_hex         = bh_hex;

            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage100101(nodeID, userID, signedInfo);

            // SDK API
            await sendSignedHex100101(nodeID, userID, signedInfo);

            // save some data
            saveTempPrivKey(myUserID, kRsmcTempPrivKey, channel_id, 
                info.curr_rsmc_temp_address_private_key);
            saveTempPrivKey(myUserID, kHtlcTempPrivKey, channel_id, 
                info.curr_htlc_temp_address_private_key);
            saveChannelStatus(myUserID, channel_id, isFunder, kStatusHTLCSigned);
            resolve(e);
        });
    })
}

/**
 * Type -100101 Protocol send signed info that signed in 100041 to OBD.
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 */
function sendSignedHex100101(nodeID, userID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100101(nodeID, userID, signedInfo, function(e) {
            console.info('sendSignedHex100101 = ' + JSON.stringify(e));
            resolve(true);
        });
    })
}

/**
 * Type -100102 Protocol send signed info that signed in 110041 to OBD.
 * @param signedInfo 
 */
function sendSignedHex100102(signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100102(signedInfo, function(e) {
            console.info('sendSignedHex100102 = ' + JSON.stringify(e));
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
