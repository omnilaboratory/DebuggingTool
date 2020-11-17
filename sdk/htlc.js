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
        obdApi.addHTLC(nodeID, userID, info, async function(e) {
            console.info('SDK: -100040 addHTLC = ' + JSON.stringify(e));

            // FUNCTION ONLY FOR GUI TOOL
            // disableInvokeAPI();
            // afterCommitmentTransactionCreated();

            // Sender sign the tx on client side
            // NO.1
            let cr      = e.c3a_counterparty_raw_data;
            let inputs  = cr.inputs;
            let privkey = await getFundingPrivKey(myUserID, e.channel_id);
            let cr_hex  = signP2SH(true, cr.hex, cr.pub_key_a, cr.pub_key_b, 
                privkey, inputs);

            // NO.2
            let hr     = e.c3a_htlc_raw_data;
            inputs     = hr.inputs;
            let hr_hex = signP2SH(true, hr.hex, hr.pub_key_a, hr.pub_key_b, 
                privkey, inputs);

            // NO.3
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
 */
function HTLCSigned(myUserID, nodeID, userID, info) {
    return new Promise((resolve, reject) => {
        obdApi.htlcSigned(nodeID, userID, info, async function(e) {
            console.info('SDK: -100041 htlcSigned = ' + JSON.stringify(e));
            
            // FUNCTION ONLY FOR GUI TOOL
            disableInvokeAPI();
            tipsOnTop('', kProcessing);

            let channel_id = e.channel_id;

            // Sign the tx on client side
            // NO.1
            let ahb      = e.c3a_htlc_br_raw_data;
            let inputs   = ahb.inputs;
            let privkey  = await getFundingPrivKey(myUserID, channel_id);
            let ahb_hex  = signP2SH(true, ahb.hex, ahb.pub_key_a, ahb.pub_key_b, privkey, inputs);

            // NO.2
            let ahl     = e.c3a_htlc_hlock_raw_data;
            inputs      = ahl.inputs;
            let ahl_hex = signP2SH(true, ahl.hex, ahl.pub_key_a, ahl.pub_key_b, privkey, inputs);

            // NO.3
            let ahh     = e.c3a_htlc_ht_raw_data;
            inputs      = ahh.inputs;
            let ahh_hex = signP2SH(true, ahh.hex, ahh.pub_key_a, ahh.pub_key_b, privkey, inputs);

            // NO.4
            let arb     = e.c3a_rsmc_br_raw_data;
            inputs      = arb.inputs;
            let arb_hex = signP2SH(true, arb.hex, arb.pub_key_a, arb.pub_key_b, privkey, inputs);

            // NO.5
            let arr     = e.c3a_rsmc_rd_raw_data;
            inputs      = arr.inputs;
            let arr_hex = signP2SH(true, arr.hex, arr.pub_key_a, arr.pub_key_b, privkey, inputs);

            // NO.6
            let bc     = e.c3b_counterparty_raw_data;
            inputs     = bc.inputs;
            let bc_hex = signP2SH(true, bc.hex, bc.pub_key_a, bc.pub_key_b, privkey, inputs);

            // NO.7
            let bh     = e.c3b_htlc_raw_data;
            inputs     = bh.inputs;
            let bh_hex = signP2SH(true, bh.hex, bh.pub_key_a, bh.pub_key_b, privkey, inputs);

            // NO.8
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
            let privkey1 = getPrivKeyFromPubKey(myUserID, info.curr_rsmc_temp_address_pub_key);
            let privkey2 = getPrivKeyFromPubKey(myUserID, info.curr_htlc_temp_address_pub_key);
            saveTempPrivKey(myUserID, kRsmcTempPrivKey, channel_id, privkey1);
            saveTempPrivKey(myUserID, kHtlcTempPrivKey, channel_id, privkey2);
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
 * @param myUserID  user id of currently loged in.
 * @param signedInfo 
 */
function sendSignedHex100102(myUserID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100102(signedInfo, async function(e) {
            console.info('sendSignedHex100102 = ' + JSON.stringify(e));

            let nodeID     = e.payee_node_address;
            let userID     = e.payee_peer_id;
            let channel_id = e.channel_id;

            // Sign the tx on client side
            // NO.1
            let ahh      = e.c3a_htlc_htrd_raw_data;
            let inputs   = ahh.inputs;
            let temp3    = getTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, channel_id);
            let ahh_hex  = signP2SH(true, ahh.hex, ahh.pub_key_a, ahh.pub_key_b, temp3, inputs);

            // NO.2
            let brb     = e.c3b_rsmc_br_raw_data;
            inputs      = brb.inputs;
            let privkey = await getFundingPrivKey(myUserID, channel_id);
            let brb_hex = signP2SH(true, brb.hex, brb.pub_key_a, brb.pub_key_b, privkey, inputs);

            // NO.3
            let brr     = e.c3b_rsmc_rd_raw_data;
            inputs      = brr.inputs;
            let brr_hex = signP2SH(true, brr.hex, brr.pub_key_a, brr.pub_key_b, privkey, inputs);
            
            // NO.4
            let bhb     = e.c3b_htlc_br_raw_data;
            inputs      = bhb.inputs;
            let bhb_hex = signP2SH(true, bhb.hex, bhb.pub_key_a, bhb.pub_key_b, privkey, inputs);

            // NO.5
            let bhl     = e.c3b_htlc_hlock_raw_data;
            inputs      = bhl.inputs;
            let bhl_hex = signP2SH(true, bhl.hex, bhl.pub_key_a, bhl.pub_key_b, privkey, inputs);

            // NO.6
            let bhh     = e.c3b_htlc_htd_raw_data;
            inputs      = bhh.inputs;
            let bhh_hex = signP2SH(true, bhh.hex, bhh.pub_key_a, bhh.pub_key_b, privkey, inputs);

            // will send 100103
            let signedInfo                               = new SignedInfo100103();
            signedInfo.channel_id                        = channel_id;
            signedInfo.c3a_htlc_htrd_partial_signed_hex  = ahh_hex;
            signedInfo.c3b_rsmc_rd_partial_signed_hex    = brr_hex;
            signedInfo.c3b_rsmc_br_partial_signed_hex    = brb_hex;
            signedInfo.c3b_htlc_htd_partial_signed_hex   = bhh_hex;
            signedInfo.c3b_htlc_hlock_partial_signed_hex = bhl_hex;
            signedInfo.c3b_htlc_br_partial_signed_hex    = bhb_hex;
            
            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage100103(nodeID, userID, signedInfo);

            // SDK API
            await sendSignedHex100103(nodeID, userID, signedInfo);

            resolve(true);
        });
    })
}

/**
 * Type -100103 Protocol send signed info that signed in 100040 to OBD.
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 */
function sendSignedHex100103(nodeID, userID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100103(nodeID, userID, signedInfo, function(e) {
            console.info('sendSignedHex100103 = ' + JSON.stringify(e));

            // FUNCTION ONLY FOR GUI TOOL
            // afterCommitmentTransactionAccepted();
            // displayMyChannelListAtTopRight(kPageSize, kPageIndex);

            resolve(true);
        });
    })
}

/**
 * Type -100104 Protocol send signed info that signed in 110042 to OBD.
 * @param myUserID  user id of currently loged in.
 * @param signedInfo 
 */
function sendSignedHex100104(myUserID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100104(signedInfo, async function(e) {
            console.info('sendSignedHex100104 = ' + JSON.stringify(e));

            let nodeID     = e.payer_node_address;
            let userID     = e.payer_peer_id;
            let channel_id = e.channel_id;

            // Sign the tx on client side
            // NO.1
            let tx      = e.c3b_htlc_hlock_he_raw_data;
            let inputs  = tx.inputs;
            let privkey = await getFundingPrivKey(myUserID, channel_id);
            let hex     = signP2SH(true, tx.hex, tx.pub_key_a, tx.pub_key_b, privkey, inputs);

            // will send 100105
            let signedInfo                                  = new SignedInfo100105();
            signedInfo.channel_id                           = channel_id;
            signedInfo.c3b_htlc_hlock_he_partial_signed_hex = hex;

            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage100105(nodeID, userID, signedInfo);

            // SDK API
            await sendSignedHex100105(myUserID, nodeID, userID, signedInfo, channel_id);

            resolve(true);
        });
    })
}

/**
 * Type -100105 Protocol send signed info that signed in 100104 to OBD.
 * @param myUserID  user id of currently loged in.
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 * @param channel_id 
 */
function sendSignedHex100105(myUserID, nodeID, userID, signedInfo, channel_id) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100105(nodeID, userID, signedInfo, async function(e) {
            console.info('sendSignedHex100105 = ' + JSON.stringify(e));

            let isFunder = await getIsFunder(myUserID, channel_id);
            saveChannelStatus(myUserID, channel_id, isFunder, kStatusHTLCSigned);

            //------------------------------------------
            // If Bob has R, will send -100045 forwardR
            // let privkey = await getFundingPrivKey(myUserID, channel_id);
            payInvoiceStep4(myUserID, nodeID, userID, channel_id);

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
        obdApi.forwardR(nodeID, userID, info, async function(e) {
            console.info('SDK: -100045 forwardR = ' + JSON.stringify(e));

            let channel_id = e.channel_id;

            // Sign the tx on client side
            // NO.1
            let tx     = e.c3b_htlc_herd_raw_data;
            let inputs = tx.inputs;
            let temp3  = getTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, channel_id);
            let hex    = signP2SH(true, tx.hex, tx.pub_key_a, tx.pub_key_b, temp3, inputs);
            
            // will send 100106
            let signedInfo                              = new SignedInfo100106();
            signedInfo.channel_id                       = channel_id;
            signedInfo.c3b_htlc_herd_partial_signed_hex = hex;

            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage100106(nodeID, userID, signedInfo);

            // SDK API
            sendSignedHex100106(nodeID, userID, signedInfo);
            // await sendSignedHex100106(nodeID, userID, signedInfo);

            // save some data
            saveChannelStatus(myUserID, channel_id, isFunder, kStatusForwardR);
            resolve(true);
        });
    })
}

/**
 * Type -100106 Protocol send signed info that signed in 100045 to OBD.
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 */
function sendSignedHex100106(nodeID, userID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100106(nodeID, userID, signedInfo, function(e) {
            console.info('sendSignedHex100106 = ' + JSON.stringify(e));
            resolve(true);
        });
    })
}

/**
 * Type -100110 Protocol send signed info that signed in 100049 to OBD.
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 */
function sendSignedHex100110(nodeID, userID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100110(nodeID, userID, signedInfo, function(e) {
            console.info('sendSignedHex100110 = ' + JSON.stringify(e));
            resolve(true);
        });
    })
}

/**
 * Type -100111 Protocol send signed info that signed in 100050 to OBD.
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 */
function sendSignedHex100111(nodeID, userID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100111(nodeID, userID, signedInfo, function(e) {
            console.info('sendSignedHex100111 = ' + JSON.stringify(e));
            resolve(true);
        });
    })
}

/**
 * Type -100112 Protocol send signed info that signed in 110050 to OBD.
 * @param myUserID The user id of logged in
 * @param signedInfo 
 */
function sendSignedHex100112(myUserID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100112(signedInfo, async function(e) {
            console.info('sendSignedHex100112 = ' + JSON.stringify(e));

            let nodeID     = e.sendee_node_address;
            let userID     = e.sendee_peer_id;
            let channel_id = e.channel_id;

            // Sign the tx on client side
            // NO.1
            let br      = e.c4b_br_raw_data;
            let inputs  = br.inputs;
            let privkey = await getFundingPrivKey(myUserID, channel_id);
            let br_hex  = signP2SH(true, br.hex, br.pub_key_a, br.pub_key_b, privkey, inputs);

            // NO.2
            let rd     = e.c4b_rd_raw_data;
            inputs     = rd.inputs;
            let rd_hex = signP2SH(true, rd.hex, rd.pub_key_a, rd.pub_key_b, privkey, inputs);
            
            // will send 100113
            let signedInfo                       = new SignedInfo100113();
            signedInfo.channel_id                = channel_id;
            signedInfo.c4b_rd_partial_signed_hex = rd_hex;
            signedInfo.c4b_br_partial_signed_hex = br_hex;
            signedInfo.c4b_br_id                 = br.br_id;
            
            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage100113(nodeID, userID, signedInfo);

            // SDK API
            await sendSignedHex100113(myUserID, nodeID, userID, signedInfo);
            resolve(true);
        });
    })
}

/**
 * Type -100113 Protocol send signed info that signed in 100112 to OBD.
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 */
function sendSignedHex100113(myUserID, nodeID, userID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100113(nodeID, userID, signedInfo, async function(e) {
            console.info('sendSignedHex100113 = ' + JSON.stringify(e));

            // FUNCTION ONLY FOR GUI TOOL
            listening110050ForGUITool(e);

            // save some data
            let isFunder = await getIsFunder(myUserID, e.channel_id);
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusCloseHTLCSigned);
            savePayInvoiceCase('No');
            resolve(true);
        });
    })
}

/**
 * Type -100114 Protocol send signed info that signed in 110051 to OBD.
 * @param signedInfo 
 */
function sendSignedHex100114(signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100114(signedInfo, function(e) {
            console.info('sendSignedHex100114 = ' + JSON.stringify(e));

            // FUNCTION ONLY FOR GUI TOOL
            afterCloseHTLCSigned();
            displayMyChannelListAtTopRight(kPageSize, kPageIndex);

            // Clear H at Bob side
            saveInvoiceH('');
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
        obdApi.closeHTLC(nodeID, userID, info, async function(e) {
            console.info('SDK: -100049 closeHTLC = ' + JSON.stringify(e));
            
            // FUNCTION ONLY FOR GUI TOOL
            // disableInvokeAPI();
            // tipsOnTop('', kProcessing);

            let channel_id = e.channel_id;

            // Sign the tx on client side
            // NO.1
            let cr      = e.c4a_counterparty_raw_data;
            let inputs  = cr.inputs;
            let privkey = await getFundingPrivKey(myUserID, channel_id);
            let cr_hex  = signP2SH(true, cr.hex, cr.pub_key_a, cr.pub_key_b, privkey, inputs);

            // NO.2
            let rr     = e.c4a_rsmc_raw_data;
            inputs      = rr.inputs;
            let rr_hex = signP2SH(true, rr.hex, rr.pub_key_a, rr.pub_key_b, privkey, inputs);

            // will send 100110
            let signedInfo                             = new SignedInfo100110();
            signedInfo.channel_id                      = channel_id;
            signedInfo.counterparty_partial_signed_hex = cr_hex;
            signedInfo.rsmc_partial_signed_hex         = rr_hex;

            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage100110(nodeID, userID, signedInfo);

            // SDK API
            await sendSignedHex100110(nodeID, userID, signedInfo);

            // save some data
            let tempkey = getPrivKeyFromPubKey(myUserID, info.curr_temp_address_pub_key);
            saveTempPrivKey(myUserID, kTempPrivKey, channel_id, tempkey);
            saveChannelStatus(myUserID, channel_id, isFunder, kStatusCloseHTLC);
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
        obdApi.closeHTLCSigned(nodeID, userID, info, async function(e) {
            console.info('SDK: -100050 closeHTLCSigned = ' + JSON.stringify(e));

            // FUNCTION ONLY FOR GUI TOOL
            disableInvokeAPI();
            tipsOnTop('', kProcessing);

            let channel_id = e.channel_id;

            // Sign the tx on client side
            // NO.1
            let abr      = e.c4a_br_raw_data;
            let inputs   = abr.inputs;
            let privkey  = await getFundingPrivKey(myUserID, channel_id);
            let abr_hex  = signP2SH(true, abr.hex, abr.pub_key_a, abr.pub_key_b, privkey, inputs);

            // NO.2
            let ard     = e.c4a_rd_raw_data;
            inputs      = ard.inputs;
            let ard_hex = signP2SH(true, ard.hex, ard.pub_key_a, ard.pub_key_b, privkey, inputs);

            // NO.3
            let bcr     = e.c4b_counterparty_raw_data;
            inputs      = bcr.inputs;
            let bcr_hex = signP2SH(true, bcr.hex, bcr.pub_key_a, bcr.pub_key_b, privkey, inputs);

            // NO.4
            let brr     = e.c4b_rsmc_raw_data;
            inputs      = brr.inputs;
            let brr_hex = signP2SH(true, brr.hex, brr.pub_key_a, brr.pub_key_b, privkey, inputs);

            // will send 100111
            let signedInfo                         = new SignedInfo100111();
            signedInfo.channel_id                  = channel_id;
            signedInfo.c4a_rd_signed_hex           = ard_hex;
            signedInfo.c4a_br_signed_hex           = abr_hex;
            signedInfo.c4a_br_id                   = abr.br_id;
            signedInfo.c4b_rsmc_signed_hex         = brr_hex;
            signedInfo.c4b_counterparty_signed_hex = bcr_hex;

            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage100111(nodeID, userID, signedInfo);

            // SDK API
            await sendSignedHex100111(nodeID, userID, signedInfo);

            // save some data
            let tempkey = getPrivKeyFromPubKey(myUserID, info.curr_temp_address_pub_key);
            saveTempPrivKey(myUserID, kTempPrivKey, channel_id, tempkey);
            saveChannelStatus(myUserID, channel_id, isFunder, kStatusCloseHTLCSigned);
            resolve(true);
        });
    })
}
