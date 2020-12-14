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
function listening110032(e, netType) {
    return new Promise(async function(resolve, reject) {
        let isAutoMode = getAutoPilot();
        // console.info('SDK: NOW isAutoMode = ' + isAutoMode);
    
        let myUserID     = e.to_peer_id;
        let nodeID       = e.funder_node_address;
        let userID       = e.funder_peer_id;
        let channel_id   = e.temporary_channel_id;
        saveChannelStatus(myUserID, channel_id, false, kStatusOpenChannel);
        saveCounterparty(myUserID, channel_id, nodeID, userID);
    
        // auto mode is closed
        if (isAutoMode != 'Yes') return resolve(true);
    
        // console.info('SDK: listening110032 = ' + JSON.stringify(e));
    
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
    
        await acceptChannel(myUserID, nodeID, userID, info);
    
        let returnData = {
            nodeID: nodeID,
            userID: userID,
            info33: info
        };
    
        resolve(returnData);
    })
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
function listening110034(e) {
    return new Promise(async function(resolve, reject) {
        let isAutoMode = getAutoPilot();
        let myUserID   = e.to_peer_id;
        let channel_id = e.temporary_channel_id;
        
        // Bob sign the tx on client
        let privkey    = await getFundingPrivKey(myUserID, channel_id);
        let data       = e.sign_data;
        let inputs     = data.inputs;
        let signed_hex = signP2SH(false, data.hex, data.pub_key_a, 
            data.pub_key_b, privkey, inputs);
            
        saveSignedHex(myUserID, channel_id, signed_hex, kTbSignedHex);
        saveChannelStatus(myUserID, channel_id, false, kStatusAssetFundingCreated);
    
        // auto mode is closed
        if (isAutoMode != 'Yes') return resolve(true);
    
        // console.info('listening110034 = ' + JSON.stringify(e));
    
        let nodeID = e.funder_node_address;
        let userID = e.funder_peer_id;

        // will send -100035 AssetFundingSigned
        let info                   = new AssetFundingSignedInfo();
        info.temporary_channel_id  = channel_id;
        info.signed_alice_rsmc_hex = signed_hex;
        
        let resp = await assetFundingSigned(myUserID, nodeID, userID, info);
    
        let returnData = {
            nodeID:   nodeID,
            userID:   userID,
            info35:   info,
            privkey:  privkey,
            info1035: resp.info1035,
            resp1035: resp.resp1035
        };

        resolve(returnData);
    })
}

/**
 * save funding private key of Alice side
 * Once sent -100035 AssetFundingSigned , the final channel_id has generated.
 * So need update the local saved data for funding private key and channel_id.
 * @param e 
 */
function listening110035(e) {
    return new Promise(async function(resolve, reject) {
        // console.info('listening110035 = ' + JSON.stringify(e));
    
        let myUserID     = e.to_peer_id;
        let tempCID      = e.temporary_channel_id;
        let channel_id   = e.channel_id;
        let channel_addr = await getChannelAddr(tempCID);
    
        let fundingPrivKey = await getFundingPrivKey(myUserID, tempCID);
        saveFundingPrivKey(myUserID, channel_id, fundingPrivKey);
    
        let tempPrivKey = getTempPrivKey(myUserID, kTempPrivKey, tempCID);
        saveTempPrivKey(myUserID, kTempPrivKey, channel_id, tempPrivKey);
    
        delChannelAddr(tempCID);
        saveChannelAddr(channel_id, channel_addr);
    
        delChannelStatus(tempCID, true);
        saveChannelStatus(myUserID, channel_id, true, kStatusAssetFundingSigned);

        let result = await getCounterparty(myUserID, tempCID);
        saveCounterparty(myUserID, channel_id, result.toNodeID, result.toUserID);
        delCounterparty(myUserID, tempCID);
    
        // Alice sign the tx on client
        let signed_hex = signP2SH(false, e.hex, e.pub_key_a, e.pub_key_b, 
            tempPrivKey, e.inputs);
    
        // will send -101134
        let info           = new SignedInfo101134();
        info.channel_id    = channel_id;
        info.rd_signed_hex = signed_hex;
    
        await sendSignedHex101134(info);
        resolve(info);
    })
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
function listening110040(e, netType) {
    return new Promise(async function(resolve, reject) {
        let myUserID   = e.to_peer_id;
        let channel_id = e.channel_id;
        let isAutoMode = getAutoPilot();
        // console.info('SDK: NOW isAutoMode = ' + isAutoMode);
    
        // Receiver sign the tx on client side
        // NO.1
        let cr      = e.c3a_counterparty_partial_signed_data;
        let inputs  = cr.inputs;
        let privkey = await getFundingPrivKey(myUserID, channel_id);
        let cr_hex  = signP2SH(false, cr.hex, cr.pub_key_a, cr.pub_key_b, privkey, inputs);
        saveSignedHex(myUserID, channel_id, cr_hex, kTbSignedHexCR110040);
    
        // NO.2
        let hr     = e.c3a_htlc_partial_signed_data;
        inputs     = hr.inputs;
        let hr_hex = signP2SH(false, hr.hex, hr.pub_key_a, hr.pub_key_b, privkey, inputs);
        saveSignedHex(myUserID, channel_id, hr_hex, kTbSignedHexHR110040);
        
        // NO.3
        let rr     = e.c3a_rsmc_partial_signed_data;
        inputs     = rr.inputs;
        let rr_hex = signP2SH(false, rr.hex, rr.pub_key_a, rr.pub_key_b, privkey, inputs);
        saveSignedHex(myUserID, channel_id, rr_hex, kTbSignedHexRR110040);
    
        // save some data
        saveInvoiceH(e.h);
        saveTempData(myUserID, channel_id, e.payer_commitment_tx_hash);
    
        let isFunder = await getIsFunder(myUserID, channel_id);
        saveChannelStatus(myUserID, channel_id, isFunder, kStatusAddHTLC);
        saveSenderRole(kIsReceiver);
    
        // auto mode is closed
        if (isAutoMode != 'Yes') return resolve(true);
    
        // console.info('listening110040 = ' + JSON.stringify(e));
    
        let nodeID = e.payer_node_address;
        let userID = e.payer_peer_id;
    
        let addr_1 = genNewAddress(myUserID, netType);
        let addr_2 = genNewAddress(myUserID, netType);
        saveAddress(myUserID, addr_1);
        saveAddress(myUserID, addr_2);
    
        // Bob will send -100041 HTLCSigned
        // is payInvoice Step 3 also
    
        let info                                  = new HtlcSignedInfo();
        info.payer_commitment_tx_hash             = e.payer_commitment_tx_hash;
        info.curr_rsmc_temp_address_pub_key       = addr_1.result.pubkey;
        info.curr_htlc_temp_address_pub_key       = addr_2.result.pubkey;
        info.last_temp_address_private_key        = getTempPrivKey(myUserID, kTempPrivKey, channel_id);
        info.c3a_complete_signed_rsmc_hex         = rr_hex;
        info.c3a_complete_signed_counterparty_hex = cr_hex;
        info.c3a_complete_signed_htlc_hex         = hr_hex;
        
        // Save address index to OBD and can get private key back if lose it.
        info.curr_rsmc_temp_address_index = addr_1.result.index;
        info.curr_htlc_temp_address_index = addr_2.result.index;
    
        let resp = await HTLCSigned(myUserID, nodeID, userID, info);

        let returnData = {
            nodeID:  nodeID,
            userID:  userID,
            info41:  info,
            privkey: privkey,
            info101: resp,
        };
    
        resolve(returnData);
    })
}

/**
 * Step 2: automatically invoke -100040 addHTLC
 * @param e
 * @param myUserID
 * @param channel_id
 * @param from100105  get data from 100105
 * @param nextPay  amount of pay to next ndoe
 */
function payInvoiceStep2(e, myUserID, channel_id, from100105, nextPay) {
    return new Promise(async function(resolve, reject) {
        let result = await getCounterparty(myUserID, channel_id);
        let nodeID = result.toNodeID;
        let userID = result.toUserID;
        
        let info                    = new addHTLCInfo();
        info.recipient_user_peer_id = userID;
        // info.property_id         = e.property_id;

        if (from100105) {
            info.amount          = nextPay;
            info.amount_to_payee = e.htlc_amount_to_payee;
            info.h               = e.htlc_h;
            info.routing_packet  = e.htlc_routing_packet;
            info.memo            = e.htlc_memo;
            info.cltv_expiry     = e.htlc_cltv_expiry;

        } else { // payInvoice
            // Plus should pay htlc fee
            let payFee = getPayHtlcFee();
            let amount = Number(e.amount) + Number(payFee);

            console.info('payInvoice payFee = ' + payFee);
            console.info('payInvoice total amount = ' + amount);

            info.amount          = amount;
            info.amount_to_payee = e.amount;
            info.h               = e.h;
            info.routing_packet  = e.routing_packet;
            info.memo            = e.memo;
            info.cltv_expiry     = e.min_cltv_expiry;
        }
        
        info.last_temp_address_private_key = getTempPrivKey(myUserID, kTempPrivKey, channel_id);
    
        let index  = getNewAddrIndex(myUserID);
        let addr_1 = genAddressFromMnemonic(getMnemonicWithLogined(), index, true);
        saveAddress(myUserID, addr_1);
        info.curr_rsmc_temp_address_pub_key = addr_1.result.pubkey;
    
        index      = getNewAddrIndex(myUserID);
        let addr_2 = genAddressFromMnemonic(getMnemonicWithLogined(), index, true);
        saveAddress(myUserID, addr_2);
        info.curr_htlc_temp_address_pub_key = addr_2.result.pubkey;
    
        index      = getNewAddrIndex(myUserID);
        let addr_3 = genAddressFromMnemonic(getMnemonicWithLogined(), index, true);
        saveAddress(myUserID, addr_3);
        info.curr_htlc_temp_address_for_ht1a_pub_key = addr_3.result.pubkey;
    
        // Save address index to OBD and can get private key back if lose it.
        info.curr_rsmc_temp_address_index          = addr_1.result.index;
        info.curr_htlc_temp_address_index          = addr_2.result.index;
        info.curr_htlc_temp_address_for_ht1a_index = addr_3.result.index;
    
        let privkey  = await getFundingPrivKey(myUserID, channel_id);
        let isFunder = await getIsFunder(myUserID, channel_id);
        let resp     = await addHTLC(myUserID, nodeID, userID, info, isFunder);

        let returnData = {
            nodeID:  nodeID,
            userID:  userID,
            info40:  info,
            info100: resp,
            privkey: privkey,
        };
    
        resolve(returnData);
    })
}

/**
 * payInvoice Step 4, Bob will send -100045 forwardR
 * @param myUserID 
 * @param nodeID 
 * @param userID 
 * @param channel_id
 * @param e data from 100105
 */
function payInvoiceStep4(myUserID, nodeID, userID, channel_id, e) {
    return new Promise(async function(resolve, reject) {
        let r = getPrivKeyFromPubKey(myUserID, getInvoiceH());
        console.info('R = ' + r);

        // Bob has NOT R. Bob maybe a middleman node.
        if (r === '') {
            saveRoutingPacket(e.htlc_routing_packet);

            // Find next channel_id in htlc_routing_packet
            let routs = e.htlc_routing_packet.split(',');
            let next_channel_id, nextPay;
            for (let i = 0; i < routs.length; i++) {
                if (routs[i] === channel_id) {
                    next_channel_id = routs[i + 1];

                    // Calculate how much assets should pay to next node.
                    let amount  = e.htlc_amount_to_payee;
                    let htlcFee = getFeeOfEveryHop(amount); // fee of every hop
                    let midLeft = routs.length - i - 2; // how many middleman left
                    nextPay = Number(amount) + accMul(midLeft, htlcFee);
                    console.info('midLeft = ' + midLeft);
                    console.info('nextPay = ' + nextPay);
                    break;
                }
            }
            console.info('Next channel_id = ' + next_channel_id);

            // Launch a HTLC between Bob and Carol (next node).
            let resp = await payInvoiceStep2(e, myUserID, next_channel_id, '100105', nextPay);

            let returnData = {
                status:    false,
                infoStep2: resp,
            };

            resolve(returnData);

        } else {
            // Bob will send -100045 forwardR
            let info        = new ForwardRInfo();
            info.channel_id = channel_id;
            info.r          = r;
            
            let isFunder = await getIsFunder(myUserID, channel_id);
            let resp     = await forwardR(myUserID, nodeID, userID, info, isFunder);
        
            let returnData = {
                status:  true,
                info45:  info,
                info106: resp,
            };
        
            resolve(returnData);
        }
    })
}

/**
 * payInvoice Step 6, Alice will send -100049 closeHTLC
 * Save address index to OBD and can get private key back if lose it.
 * @param myUserID 
 * @param nodeID 
 * @param userID 
 * @param channel_id 
 * @param privkey 
 */
function payInvoiceStep6(myUserID, nodeID, userID, channel_id, privkey) {
    return new Promise(async function(resolve, reject) {
        let info      = new CloseHtlcTxInfo();
        let privkey_1 = getTempPrivKey(myUserID, kRsmcTempPrivKey, channel_id);
        let privkey_2 = getTempPrivKey(myUserID, kHtlcTempPrivKey, channel_id);
        let privkey_3 = getTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, channel_id);
        let addr      = genNewAddress(myUserID, true);
        saveAddress(myUserID, addr);
    
        info.channel_id                                  = channel_id;
        info.last_rsmc_temp_address_private_key          = privkey_1;
        info.last_htlc_temp_address_private_key          = privkey_2;
        info.last_htlc_temp_address_for_htnx_private_key = privkey_3;
        info.curr_temp_address_pub_key                   = addr.result.pubkey;
        info.curr_temp_address_index                     = addr.result.index;
    
        let isFunder = await getIsFunder(myUserID, channel_id);
        let resp     = await closeHTLC(myUserID, nodeID, userID, info, isFunder);

        let returnData = {
            info49:  info,
            info110: resp,
            privkey: privkey,
        };
    
        resolve(returnData);
    })
}

/**
 * listening to -110041
 * @param e 
 */
function listening110041(e) {
    return new Promise(async function(resolve, reject) {
        let myUserID   = e.to_peer_id;
        let channel_id = e.channel_id;
    
        // Sign the tx on client side
        // NO.1
        let ahl      = e.c3a_htlc_hlock_partial_signed_data;
        let inputs   = ahl.inputs;
        let temp2    = getTempPrivKey(myUserID, kHtlcTempPrivKey, channel_id);
        let ahl_hex  = signP2SH(false, ahl.hex, ahl.pub_key_a, ahl.pub_key_b, temp2, inputs);
    
        // NO.2
        let ahh     = e.c3a_htlc_ht_partial_signed_data;
        inputs      = ahh.inputs;
        let ahh_hex = signP2SH(false, ahh.hex, ahh.pub_key_a, ahh.pub_key_b, temp2, inputs);
    
        // NO.3
        let arr     = e.c3a_rsmc_rd_partial_signed_data;
        inputs      = arr.inputs;
        let temp1   = getTempPrivKey(myUserID, kRsmcTempPrivKey, channel_id);
        let arr_hex = signP2SH(false, arr.hex, arr.pub_key_a, arr.pub_key_b, temp1, inputs);
        
        // NO.4
        let bc      = e.c3b_counterparty_partial_signed_data;
        inputs      = bc.inputs;
        let privkey = await getFundingPrivKey(myUserID, channel_id);
        let bc_hex = signP2SH(false, bc.hex, bc.pub_key_a, bc.pub_key_b, privkey, inputs);
    
        // NO.5
        let bh     = e.c3b_htlc_partial_signed_data;
        inputs     = bh.inputs;
        let bh_hex = signP2SH(false, bh.hex, bh.pub_key_a, bh.pub_key_b, privkey, inputs);
    
        // NO.6
        let br     = e.c3b_rsmc_partial_signed_data;
        inputs     = br.inputs;
        let br_hex = signP2SH(false, br.hex, br.pub_key_a, br.pub_key_b, privkey, inputs);
        
        // will send 100102
        let signedInfo                                  = new SignedInfo100102();
        signedInfo.channel_id                           = channel_id;
        signedInfo.c3a_rsmc_rd_complete_signed_hex      = arr_hex;
        signedInfo.c3a_htlc_ht_complete_signed_hex      = ahh_hex;
        signedInfo.c3a_htlc_hlock_complete_signed_hex   = ahl_hex;
        signedInfo.c3b_rsmc_complete_signed_hex         = br_hex;
        signedInfo.c3b_counterparty_complete_signed_hex = bc_hex;
        signedInfo.c3b_htlc_complete_signed_hex         = bh_hex;

        let resp = await sendSignedHex100102(myUserID, signedInfo);
    
        // save some data
        let isFunder = await getIsFunder(myUserID, channel_id);
        saveChannelStatus(myUserID, channel_id, isFunder, kStatusHTLCSigned);
    
        let returnData = {
            nodeID:  resp.nodeID,
            userID:  resp.userID,
            info102: signedInfo,
            info103: resp.signedInfo,
        };
    
        resolve(returnData);
    })
}

/**
 * listening to -110042
 * @param e 
 * @param netType
 */
function listening110042(e, netType) {
    return new Promise(async function(resolve, reject) {
        let myUserID   = e.to_peer_id;
        let channel_id = e.channel_id;
    
        // Sign the tx on client side
        // NO.1
        let ahh      = e.c3a_htlc_hed_raw_data;
        let inputs   = ahh.inputs;
        let privkey  = await getFundingPrivKey(myUserID, channel_id);
        let ahh_hex  = signP2SH(true, ahh.hex, ahh.pub_key_a, ahh.pub_key_b, privkey, inputs);
    
        // NO.2
        let ahb     = e.c3a_htlc_htbr_raw_data;
        inputs      = ahb.inputs;
        let ahb_hex = signP2SH(true, ahb.hex, ahb.pub_key_a, ahb.pub_key_b, privkey, inputs);
    
        // NO.3
        let ahr     = e.c3a_htlc_htrd_partial_data;
        inputs      = ahr.inputs;
        let ahr_hex = signP2SH(false, ahr.hex, ahr.pub_key_a, ahr.pub_key_b, privkey, inputs);
    
        // NO.4
        let bhl     = e.c3b_htlc_hlock_partial_data;
        inputs      = bhl.inputs;
        let temp2   = getTempPrivKey(myUserID, kHtlcTempPrivKey, channel_id);
        let bhl_hex = signP2SH(false, bhl.hex, bhl.pub_key_a, bhl.pub_key_b, temp2, inputs);
    
        // NO.5
        let bhh     = e.c3b_htlc_htd_partial_data;
        inputs      = bhh.inputs;
        let bhh_hex = signP2SH(false, bhh.hex, bhh.pub_key_a, bhh.pub_key_b, temp2, inputs);
    
        // NO.6
        let brr     = e.c3b_rsmc_rd_partial_data;
        inputs      = brr.inputs;
        let temp1   = getTempPrivKey(myUserID, kRsmcTempPrivKey, channel_id);
        let brr_hex = signP2SH(false, brr.hex, brr.pub_key_a, brr.pub_key_b, temp1, inputs);
        
        // will send 100104
        // new address
        let addr    = genNewAddress(myUserID, netType);
        saveAddress(myUserID, addr);
        // TempPrivKey NO.3
        saveTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, channel_id, addr.result.wif);
    
        let signedInfo                                   = new SignedInfo100104();
        signedInfo.channel_id                            = channel_id;
        signedInfo.curr_htlc_temp_address_for_he_pub_key = addr.result.pubkey;
        signedInfo.curr_htlc_temp_address_for_he_index   = addr.result.index;
        signedInfo.c3a_htlc_htrd_complete_signed_hex     = ahr_hex;
        signedInfo.c3a_htlc_htbr_partial_signed_hex      = ahb_hex;
        signedInfo.c3a_htlc_hed_partial_signed_hex       = ahh_hex;
        signedInfo.c3b_rsmc_rd_complete_signed_hex       = brr_hex;
        signedInfo.c3b_htlc_htd_complete_signed_hex      = bhh_hex;
        signedInfo.c3b_htlc_hlock_complete_signed_hex    = bhl_hex;
    
        let resp = await sendSignedHex100104(myUserID, signedInfo);

        let returnData;
        if (resp.status === false) {
            returnData = {
                status:  false,
                nodeID:  resp.nodeID,
                userID:  resp.userID,
                info104: signedInfo,
                info105: resp.info105,
                infoStep2: resp.infoStep2,
            };

        } else {
            returnData = {
                status:  true,
                nodeID:  resp.nodeID,
                userID:  resp.userID,
                info104: signedInfo,
                info105: resp.info105,
                info45:  resp.info45,
                info106: resp.info106,
            };
        }

        resolve(returnData);
    })
}

/**
 * listening to -110043
 * @param e 
 */
function listening110043(e) {
    // console.info('listening110043 = ' + JSON.stringify(e));
}

/**
 * auto response to -100045 (forwardR) 
 * listening to -110045 and send -100046 signR
 * @param e 
 */
function listening110045(e) {
    return new Promise(async function(resolve, reject) {
        let isAutoMode = getAutoPilot();
        // console.info('SDK: NOW isAutoMode = ' + isAutoMode);
        
        let isInPayInvoice = getPayInvoiceCase();
        // console.info('isInPayInvoice = ' + isInPayInvoice);
    
        let myUserID   = e.to_peer_id;
        let channel_id = e.channel_id;
    
        // Sign the tx on client side
        // NO.1 
        let br      = e.c3b_htlc_hebr_raw_data;
        let inputs  = br.inputs;
        let privkey = await getFundingPrivKey(myUserID, channel_id);
        let br_hex  = signP2SH(true, br.hex, br.pub_key_a, br.pub_key_b, privkey, inputs);
        saveSignedHex(myUserID, channel_id, br_hex, kTbSignedHexBR110045);
        
        // NO.2
        let rd     = e.c3b_htlc_herd_partial_signed_data;
        inputs     = rd.inputs;
        let rd_hex = signP2SH(false, rd.hex, rd.pub_key_a, rd.pub_key_b, privkey, inputs);
        saveSignedHex(myUserID, channel_id, rd_hex, kTbSignedHexRD110045);
        
        let isFunder = await getIsFunder(myUserID, channel_id);
        saveChannelStatus(myUserID, channel_id, isFunder, kStatusForwardR);
        saveInvoiceR(e.r);

        // auto mode is closed
        if (isAutoMode != 'Yes') {  
            // Not in pay invoice case
            if (isInPayInvoice != 'Yes') return resolve(true);
        }
    
        // console.info('listening110045 = ' + JSON.stringify(e));
        
        let nodeID   = e.payee_node_address;
        let userID   = e.payee_peer_id;
    
        // Alice will send -100046 signR
        // is payInvoice Step 5 also
    
        let info                               = new SignRInfo();
        info.channel_id                        = channel_id;
        info.c3b_htlc_herd_complete_signed_hex = rd_hex;
        info.c3b_htlc_hebr_partial_signed_hex  = br_hex;
    
        await signR(myUserID, nodeID, userID, info, isFunder);
        
        //------------------------
        // If is payInvoice case, Alice will send -100049 closeHTLC
        let resp = await payInvoiceStep6(myUserID, nodeID, userID, channel_id, privkey);

        let returnData = {
            nodeID:  nodeID,
            userID:  userID,
            info46:  info,
            info49:  resp.info49,
            info110: resp.info110,
            privkey: resp.privkey,
        };
    
        resolve(returnData);
    })
}

/**
 * listening to -110046
 * @param e 
 */
async function listening110046(e) {
    console.info('listening110046');
    let myUserID   = e.to_peer_id;
    let channel_id = e.channel_id;
    let isFunder   = await getIsFunder(myUserID, channel_id);
    saveChannelStatus(myUserID, channel_id, isFunder, kStatusSignR);
}

/**
 * auto response to -100049 (CloseHTLC) 
 * listening to -110049 and send -100050 CloseHTLCSigned
 * @param e 
 * @param netType true: testnet  false: mainnet
 */
function listening110049(e, netType) {
    return new Promise(async function(resolve, reject) {
        // let isAutoMode = getAutoPilot();
        // console.info('SDK: NOW isAutoMode = ' + isAutoMode);
    
        let myUserID   = e.to_peer_id;
        let channel_id = e.channel_id;
    
        // Receiver sign the tx on client side
        // NO.1
        let cr      = e.c4a_counterparty_partial_signed_data;
        let inputs  = cr.inputs;
        let privkey = await getFundingPrivKey(myUserID, channel_id);
        let cr_hex  = signP2SH(false, cr.hex, cr.pub_key_a, cr.pub_key_b, privkey, inputs);
        saveSignedHex(myUserID, channel_id, cr_hex, kTbSignedHexCR110040);
    
        // NO.2
        let rr     = e.c4a_rsmc_partial_signed_data;
        inputs     = rr.inputs;
        let rr_hex = signP2SH(false, rr.hex, rr.pub_key_a, rr.pub_key_b, privkey, inputs);
        saveSignedHex(myUserID, channel_id, rr_hex, kTbSignedHexHR110040);
    
        // save some data
        let isFunder = await getIsFunder(myUserID, channel_id);
        saveChannelStatus(myUserID, channel_id, isFunder, kStatusCloseHTLC);
        saveTempData(myUserID, channel_id, e.msg_hash);
        saveSenderRole(kIsReceiver);
    
        // console.info('listening110049 = ' + JSON.stringify(e));
    
        let nodeID = e.sender_node_address;
        let userID = e.sender_peer_id;
    
        let addr = genNewAddress(myUserID, netType);
        saveAddress(myUserID, addr);
        
        // will send -100050 CloseHTLCSigned
        // is payInvoice Step 7 also
    
        let info                                         = new CloseHtlcTxInfoSigned();
        info.msg_hash                                    = e.msg_hash;
        info.last_rsmc_temp_address_private_key          = getTempPrivKey(myUserID, kRsmcTempPrivKey, channel_id);
        info.last_htlc_temp_address_private_key          = getTempPrivKey(myUserID, kHtlcTempPrivKey, channel_id);
        info.last_htlc_temp_address_for_htnx_private_key = getTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, channel_id);
        info.curr_temp_address_pub_key                   = addr.result.pubkey;
        info.c4a_rsmc_complete_signed_hex                = rr_hex;
        info.c4a_counterparty_complete_signed_hex        = cr_hex;
        // Save address index to OBD and can get private key back if lose it.
        info.curr_temp_address_index = addr.result.index;
        
        let resp = await closeHTLCSigned(myUserID, nodeID, userID, info, isFunder);

        let returnData = {
            nodeID:  nodeID,
            userID:  userID,
            info50:  info,
            info111: resp,
            privkey: privkey,
        };
    
        resolve(returnData);
    })
}

/**
 * listening to -110050
 * @param e 
 */
function listening110050(e) {
    return new Promise(async function(resolve, reject) {
        let myUserID   = e.to_peer_id;
        let channel_id = e.channel_id;
    
        // Sign the tx on client side
        // NO.1
        let ard     = e.c4a_rd_partial_signed_data;
        let inputs  = ard.inputs;
        let tempKey = getTempPrivKey(myUserID, kTempPrivKey, channel_id);
        let ard_hex  = signP2SH(false, ard.hex, ard.pub_key_a, ard.pub_key_b, tempKey, inputs);
    
        // NO.2
        let bcr     = e.c4b_counterparty_partial_signed_data;
        inputs      = bcr.inputs;
        let privkey = await getFundingPrivKey(myUserID, channel_id);
        let bcr_hex = signP2SH(false, bcr.hex, bcr.pub_key_a, bcr.pub_key_b, privkey, inputs);
    
        // NO.3
        let brr     = e.c4b_rsmc_partial_signed_data;
        inputs      = brr.inputs;
        let brr_hex = signP2SH(false, brr.hex, brr.pub_key_a, brr.pub_key_b, privkey, inputs);
    
        // will send 100112
        let signedInfo                                  = new SignedInfo100112();
        signedInfo.channel_id                           = channel_id;
        signedInfo.c4a_rd_complete_signed_hex           = ard_hex;
        signedInfo.c4b_rsmc_complete_signed_hex         = brr_hex;
        signedInfo.c4b_counterparty_complete_signed_hex = bcr_hex;
    
        let resp = await sendSignedHex100112(myUserID, signedInfo);

        if (resp.status === true) {
            let returnData = {
                status:  true,
                nodeID:  resp.nodeID,
                userID:  resp.userID,
                info112: signedInfo,
                info113: resp.info113,
            };
        
            resolve(returnData);
            
        } else { // A multi-hop
            let returnData = {
                status:  false,
                nodeID:  resp.nodeID,
                userID:  resp.userID,
                info112: signedInfo,
                info113: resp.info113,
                nodeID2: resp.nodeID2,
                userID2: resp.userID2,
                info45:  resp.info45,
                info106: resp.info106,
            };
        
            resolve(returnData);
        }
    })
}

/**
 * listening to -110051
 * @param e 
 */
function listening110051(e) {
    return new Promise(async function(resolve, reject) {
        let myUserID   = e.to_peer_id;
        let channel_id = e.channel_id;
    
        // Sign the tx on client side
        // NO.1
        let brd     = e.c4b_rd_partial_signed_data;
        let inputs  = brd.inputs;
        let tempKey = getTempPrivKey(myUserID, kTempPrivKey, channel_id);
        let brd_hex = signP2SH(false, brd.hex, brd.pub_key_a, brd.pub_key_b, tempKey, inputs);
    
        // will send 100114
        let signedInfo                        = new SignedInfo100114();
        signedInfo.channel_id                 = channel_id;
        signedInfo.c4b_rd_complete_signed_hex = brd_hex;
    
        let resp = await sendSignedHex100114(myUserID, channel_id, signedInfo);

        if (resp === true) {
            let returnData = {
                status:  true,
                info114: signedInfo,
            };
        
            resolve(returnData);

        } else {
            let returnData = {
                status:  false,
                info114: signedInfo,
                nodeID:  resp.nodeID,
                userID:  resp.userID,
                info45:  resp.info45,
                info106: resp.info106,
            };
        
            resolve(returnData);
        }
    })
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
function listening110340(e) {
    return new Promise(async function(resolve, reject) {
        let isAutoMode = getAutoPilot();
        // console.info('SDK: NOW isAutoMode = ' + isAutoMode);
    
        let myUserID   = e.to_peer_id;
        let channel_id = e.temporary_channel_id;
    
        // Bob sign the tx on client
        let privkey    = await getFundingPrivKey(myUserID, channel_id);
        let data       = e.sign_data;
        let inputs     = data.inputs;
        let signed_hex = signP2SH(false, data.hex, data.pub_key_a, 
            data.pub_key_b, privkey, inputs);
        saveSignedHex(myUserID, channel_id, signed_hex, kTbSignedHex);
    
        // save some data
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
    
        // auto mode is closed
        if (isAutoMode != 'Yes') return resolve(true);
    
        // console.info('listening110340 = ' + JSON.stringify(e));
    
        let nodeID = e.funder_node_address;
        let userID = e.funder_peer_id;
    
        // will send -100350 bitcoinFundingSigned
        let info                                 = new FundingBtcSigned();
        info.temporary_channel_id                = channel_id;
        info.funding_txid                        = e.funding_txid;
        info.signed_miner_redeem_transaction_hex = signed_hex;
        info.approval                            = true;
    
        await bitcoinFundingSigned(myUserID, nodeID, userID, info);
    
        let returnData = {
            nodeID:  nodeID,
            userID:  userID,
            info350: info,
            privkey: privkey,
        };
    
        resolve(returnData);
    })
}

/**
 * listening to -110350
 * @param e 
 */
async function listening110350(e) {

    let myUserID     = e.to_peer_id;
    let channel_id   = e.temporary_channel_id;
    let status       = await getChannelStatus(channel_id, true);
    // console.info('listening110350 status = ' + status);
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
function listening110351(e, netType) {
    return new Promise(async function(resolve, reject) {
        let isAutoMode = getAutoPilot();
        let myUserID   = e.to_peer_id;
        let channel_id = e.channel_id;
        // console.info('SDK: NOW isAutoMode = ' + isAutoMode);
    
        // Receiver sign the tx on client side
        // NO.1 counterparty_raw_data
        let cr      = e.counterparty_raw_data;
        let inputs  = cr.inputs;
        let privkey = await getFundingPrivKey(myUserID, channel_id);
        let cr_hex  = signP2SH(false, cr.hex, cr.pub_key_a, cr.pub_key_b, privkey, inputs);
        saveSignedHex(myUserID, channel_id, cr_hex, kTbSignedHexCR110351);
    
        // NO.2 rsmc_raw_data
        let rr     = e.rsmc_raw_data;
        inputs     = rr.inputs;
        let rr_hex = signP2SH(false, rr.hex, rr.pub_key_a, rr.pub_key_b, privkey, inputs);
        saveSignedHex(myUserID, channel_id, rr_hex, kTbSignedHexRR110351);
    
        // save some data
        let isFunder = await getIsFunder(myUserID, channel_id);
        saveChannelStatus(myUserID, channel_id, isFunder, kStatusCommitmentTransactionCreated);
        saveTempData(myUserID, channel_id, e.msg_hash);
        saveSenderRole(kIsReceiver);
    
        // auto mode is closed
        if (isAutoMode != 'Yes') return resolve(true);
    
        //------------------------
        // auto mode is opening
        // console.info('listening110351 = ' + JSON.stringify(e));
    
        let nodeID  = e.payer_node_address;
        let userID  = e.payer_peer_id;
    
        let addr    = genNewAddress(myUserID, netType);
        let tempKey = addr.result.wif;
        saveAddress(myUserID, addr);
    
        // will send -100352 commitmentTransactionAccepted
        let info                           = new CommitmentTxSigned();
        info.channel_id                    = channel_id;
        info.msg_hash                      = e.msg_hash;
        info.c2a_rsmc_signed_hex           = rr_hex;
        info.c2a_counterparty_signed_hex   = cr_hex;
        info.curr_temp_address_pub_key     = addr.result.pubkey;
        info.last_temp_address_private_key = getTempPrivKey(myUserID, kTempPrivKey, channel_id);
        info.approval                      = true;
        // Save address index to OBD and can get private key back if lose it.
        info.curr_temp_address_index = Number(getIndexFromPubKey(addr.result.pubkey));
    
        let resp = await commitmentTransactionAccepted(myUserID, nodeID, 
            userID, info, isFunder, tempKey);

        let returnData = {
            nodeID:  nodeID,
            userID:  userID,
            info352: info,
            info361: resp,
        };
    
        resolve(returnData);
    })
}

/**
 * listening to -110352
 * @param e 
 */
function listening110352(e) {
    return new Promise(async function(resolve, reject) {
        // console.info('listening110352 = ' + JSON.stringify(e));
    
        let myUserID = e.to_peer_id;
        let nodeID   = e.payee_node_address;
        let userID   = e.payee_peer_id;
    
        let isFunder = await getIsFunder(myUserID, e.channel_id);
        saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusCommitmentTransactionAccepted);
    
        // Receiver sign the tx on client side
        // NO.1
        let rd      = e.c2a_rd_partial_data;
        let inputs  = rd.inputs;
        let tempKey = getTempPrivKey(myUserID, kTempPrivKey, e.channel_id);
        let rd_hex  = signP2SH(false, rd.hex, rd.pub_key_a, rd.pub_key_b, tempKey, inputs);
    
        // NO.2
        let cp      = e.c2b_counterparty_partial_data;
        inputs      = cp.inputs;
        let privkey = await getFundingPrivKey(myUserID, e.channel_id);
        let cp_hex  = signP2SH(false, cp.hex, cp.pub_key_a, cp.pub_key_b, privkey, inputs);
    
        // NO.3
        let rp     = e.c2b_rsmc_partial_data;
        inputs     = rp.inputs;
        let rp_hex = signP2SH(false, rp.hex, rp.pub_key_a, rp.pub_key_b, privkey, inputs);
    
        // will send 100362
        let signedInfo                         = new SignedInfo100362();
        signedInfo.channel_id                  = e.channel_id;
        signedInfo.c2b_rsmc_signed_hex         = rp_hex;
        signedInfo.c2b_counterparty_signed_hex = cp_hex;
        signedInfo.c2a_rd_signed_hex           = rd_hex;
    
        let resp = await sendSignedHex100362(myUserID, nodeID, userID, signedInfo);

        let returnData = {
            nodeID:  nodeID,
            userID:  userID,
            info362: signedInfo,
            info363: resp,
        };
    
        resolve(returnData);
    })
}

/**
 * listening to -110353
 * @param e 
 */
function listening110353(e) {
    return new Promise(async function(resolve, reject) {
        // console.info('listening110353 = ' + JSON.stringify(e));
    
        // Receiver sign the tx on client side
        let rd      = e.c2b_rd_partial_data;
        let inputs  = rd.inputs;
        let tempKey = getTempPrivKey(e.to_peer_id, kTempPrivKey, e.channel_id);
        let rd_hex  = signP2SH(false, rd.hex, rd.pub_key_a, rd.pub_key_b, tempKey, inputs);
    
        // will send 100364
        let signedInfo               = new SignedInfo100364();
        signedInfo.channel_id        = e.channel_id;
        signedInfo.c2b_rd_signed_hex = rd_hex;
    
        await sendSignedHex100364(signedInfo);
        resolve(signedInfo);
    })
}