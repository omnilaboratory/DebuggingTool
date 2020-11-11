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

            let channel_id = e.temporary_channel_id;
            saveCounterparty(myUserID,  channel_id, nodeID, userID);
            saveChannelStatus(myUserID, channel_id, true, kStatusOpenChannel);

            let privkey = getPrivKeyFromPubKey(myUserID, info.funding_pubkey);
            saveFundingPrivKey(myUserID, channel_id, privkey);
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
            let privkey    = getPrivKeyFromPubKey(myUserID, info.funding_pubkey);
            saveFundingPrivKey(myUserID, channel_id, privkey);
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

            // Sign the tx on client
            let privkey    = getPrivKeyFromAddress(info.from_address);
            let signed_hex = signP2PKH(e.hex, privkey);

            // saveFundingPrivKey(myUserID, channel_id, info.from_address_private_key);

            info.from_address_private_key = privkey;
            saveFundingBtcData(myUserID, channel_id, info);
            saveTempData(myUserID, channel_id, signed_hex);
            resolve(e);
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

            // Sign tx
            if (e.hex) {
                // Alice sign the tx on client
                let privkey    = await getFundingPrivKey(myUserID, channel_id);
                let signed_hex = signP2SH(true, e.hex, e.pub_key_a, 
                    e.pub_key_b, privkey, e.inputs);

                // FUNCTION ONLY FOR GUI TOOL
                displaySentMessage100341(nodeID, userID, signed_hex);

                // SDK API
                await sendSignedHex100341(nodeID, userID, signed_hex);
            }

            resolve(true);
        });
    })
}

/**
 * Type -100341 Protocol send signed_hex that Alice signed in 100340 to OBD.
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signed_hex 
 */
function sendSignedHex100341(nodeID, userID, signed_hex) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100341(nodeID, userID, signed_hex, function(e) {
            console.info('SDK: -100341 sendSignedHex100341 = ' + JSON.stringify(e));
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

            // saveFundingPrivKey(myUserID, channel_id, info.channel_address_private_key);
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
            console.info('SDK: -102120 fundingAsset = ' + JSON.stringify(e));
            
            // Sign the tx on client
            let privkey    = getPrivKeyFromAddress(info.from_address);
            let signed_hex = signP2PKH(e.hex, privkey);

            let channel_id = await getChannelIDFromAddr(info.to_address);
            saveChannelStatus(myUserID, channel_id, true, kStatusFundingAsset);
            saveTempData(myUserID, channel_id, signed_hex);
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
 * @param tempKey  temp_address_private_key
 */
function assetFundingCreated(myUserID, nodeID, userID, info, tempKey) {
    return new Promise((resolve, reject) => {
        obdApi.assetFundingCreated(nodeID, userID, info, async function(e) {
            console.info('SDK: -100034 - assetFundingCreated = ' + JSON.stringify(e));
            let channel_id = info.temporary_channel_id;

            // Alice sign the tx on client
            let privkey    = await getFundingPrivKey(myUserID, channel_id);
            let signed_hex = signP2SH(true, e.hex, e.pub_key_a, 
                e.pub_key_b, privkey, e.inputs);
            
            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage101034(nodeID, userID, signed_hex);

            // SDK API
            await sendSignedHex101034(nodeID, userID, signed_hex);

            // Save temporary private key to local storage
            saveTempPrivKey(myUserID, kTempPrivKey, channel_id, tempKey);
            saveChannelStatus(myUserID, channel_id, true, kStatusAssetFundingCreated);
            resolve(true);
        });
    })
}

/**
 * Type -101034 Protocol send signed_hex that Alice signed in 100034 to OBD.
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signed_hex 
 */
function sendSignedHex101034(nodeID, userID, signed_hex) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex101034(nodeID, userID, signed_hex, function(e) {
            console.info('sendSignedHex101034 = ' + JSON.stringify(e));
            resolve(true);
        });
    })
}

/**
 * Type -101134 Protocol send signed_hex that Alice signed in 110035 to OBD.
 * @param info SignedInfo101134
 */
function sendSignedHex101134(info) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex101134(info, function(e) {
            console.info('sendSignedHex101134 = ' + JSON.stringify(e));

            // FUNCTION ONLY FOR GUI TOOL
            listening110035ForGUITool(e);

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
            
            // FUNCTION ONLY FOR GUI TOOL
            disableInvokeAPI();
            tipsOnTop('', kProcessing);

            let channel_id = info.temporary_channel_id;
            
            // Bob sign the tx on client side
            // NO.1 alice_br_sign_data
            let br      = e.alice_br_sign_data;
            let inputs  = br.inputs;
            let privkey = await getFundingPrivKey(myUserID, channel_id);
            let br_hex  = signP2SH(true, br.hex, br.pub_key_a, br.pub_key_b, 
                privkey, inputs);

            // NO.2 alice_rd_sign_data
            let rd     = e.alice_rd_sign_data;
            inputs     = rd.inputs;
            let rd_hex = signP2SH(true, rd.hex, rd.pub_key_a, rd.pub_key_b, 
                privkey, inputs);

            // will send 101035
            let signedInfo                  = new SignedInfo101035();
            signedInfo.temporary_channel_id = channel_id;
            signedInfo.br_signed_hex        = br_hex;
            signedInfo.rd_signed_hex        = rd_hex;
            signedInfo.br_id                = br.br_id;

            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage101035(nodeID, userID, signedInfo);

            // SDK API
            await sendSignedHex101035(nodeID, userID, signedInfo, 
                myUserID, channel_id, privkey);
        });
    })
}

/**
 * Type -101035 Protocol send signed info that Bob signed in 100035 to OBD.
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 * @param myUserID The user id of logged in
 * @param tempCID temporary_channel_id
 * @param priv_key channel_address_private_key
 */
function sendSignedHex101035(nodeID, userID, signedInfo, myUserID, tempCID, priv_key) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex101035(nodeID, userID, signedInfo, async function(e) {
            console.info('sendSignedHex101035 = ' + JSON.stringify(e));

            // Once sent -100035 AssetFundingSigned , the final channel_id has generated.
            // So need update the local saved data of funding private key and channel_id.

            let channel_id   = e.channel_id;
            let channel_addr = await getChannelAddr(tempCID);

            saveFundingPrivKey(myUserID, channel_id, priv_key);

            //
            delChannelAddr(tempCID);
            saveChannelAddr(channel_id, channel_addr);

            //
            delChannelStatus(tempCID, false);
            saveChannelStatus(myUserID, channel_id, false, kStatusAssetFundingSigned);

            //
            delCounterparty(myUserID, tempCID);
            saveCounterparty(myUserID, channel_id, nodeID, userID);

            // FUNCTION ONLY FOR GUI TOOL
            afterAssetFundingSigned(e);
            displayMyChannelListAtTopRight(kPageSize, kPageIndex);

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
 * @param isFunder 
 * @param tempKey curr_temp_address_private_key 
 */
function commitmentTransactionCreated(myUserID, nodeID, userID, info, isFunder, tempKey) {
    return new Promise((resolve, reject) => {
        obdApi.commitmentTransactionCreated(nodeID, userID, info, async function(e) {
            console.info('SDK: -100351 commitmentTransactionCreated = ' + JSON.stringify(e));

            // FUNCTION ONLY FOR GUI TOOL
            // disableInvokeAPI();
            afterCommitmentTransactionCreated();

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

            // will send 100360
            let signedInfo                     = new SignedInfo100360();
            signedInfo.channel_id              = e.channel_id;
            signedInfo.counterparty_signed_hex = cr_hex;
            signedInfo.rsmc_signed_hex         = rr_hex;

            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage100360(nodeID, userID, signedInfo);

            // SDK API
            await sendSignedHex100360(nodeID, userID, signedInfo);

            // save some data
            saveTempPrivKey(myUserID, kTempPrivKey, e.channel_id, tempKey);
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusCommitmentTransactionCreated);
            saveSenderRole(kIsSender);
            resolve(true);
        });
    })
}

/**
 * Type -100360 Protocol send signed info that Sender signed in 100351 to OBD.
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 */
function sendSignedHex100360(nodeID, userID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100360(nodeID, userID, signedInfo, function(e) {
            console.info('sendSignedHex100360 = ' + JSON.stringify(e));
            resolve(e);
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
 * @param isFunder 
 * @param tempKey curr_temp_address_private_key
 */
function commitmentTransactionAccepted(myUserID, nodeID, userID, info, isFunder, tempKey) {
    return new Promise((resolve, reject) => {
        obdApi.commitmentTransactionAccepted(nodeID, userID, info, async function(e) {
            console.info('SDK: -100352 commitmentTransactionAccepted = ' + JSON.stringify(e));

            // FUNCTION ONLY FOR GUI TOOL
            disableInvokeAPI();
            tipsOnTop('', kProcessing);

            // Receiver sign the tx on client side

            // NO.1 c2a_br_raw_data
            let c2a_br     = e.c2a_br_raw_data;
            let inputs     = c2a_br.inputs;
            let privkey    = await getFundingPrivKey(myUserID, e.channel_id);
            let c2a_br_hex = signP2SH(true, c2a_br.hex, c2a_br.pub_key_a, 
                c2a_br.pub_key_b, privkey, inputs);

            // NO.2 c2a_rd_raw_data
            let c2a_rd     = e.c2a_rd_raw_data;
            inputs         = c2a_rd.inputs;
            let c2a_rd_hex = signP2SH(true, c2a_rd.hex, c2a_rd.pub_key_a, 
                c2a_rd.pub_key_b, privkey, inputs);
            
            // NO.3 c2b_counterparty_raw_data
            let c2b_cr     = e.c2b_counterparty_raw_data;
            inputs         = c2b_cr.inputs;
            let c2b_cr_hex = signP2SH(true, c2b_cr.hex, c2b_cr.pub_key_a, 
                c2b_cr.pub_key_b, privkey, inputs);
            
            // NO.4 c2b_rsmc_raw_data
            let c2b_rr     = e.c2b_rsmc_raw_data;
            inputs         = c2b_rr.inputs;
            let c2b_rr_hex = signP2SH(true, c2b_rr.hex, c2b_rr.pub_key_a, 
                c2b_rr.pub_key_b, privkey, inputs);

            // will send 100361
            let signedInfo                         = new SignedInfo100361();
            signedInfo.channel_id                  = e.channel_id;
            signedInfo.c2b_rsmc_signed_hex         = c2b_rr_hex;
            signedInfo.c2b_counterparty_signed_hex = c2b_cr_hex;
            signedInfo.c2a_rd_signed_hex           = c2a_rd_hex;
            signedInfo.c2a_br_signed_hex           = c2a_br_hex;
            signedInfo.c2a_br_id                   = c2a_br.br_id;

            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage100361(nodeID, userID, signedInfo);

            // SDK API
            await sendSignedHex100361(nodeID, userID, signedInfo);

            // 
            saveTempPrivKey(myUserID, kTempPrivKey, e.channel_id, tempKey);
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusCommitmentTransactionAccepted);
            resolve(true);
        });
    })
}

/**
 * Type -100361 Protocol send signed info that Receiver signed in 100352 to OBD.
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 */
function sendSignedHex100361(nodeID, userID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100361(nodeID, userID, signedInfo, function(e) {
            console.info('sendSignedHex100361 = ' + JSON.stringify(e));
            resolve(e);
        });
    })
}

/**
 * Type -100362 Protocol send signed info that Receiver signed in 110352 to OBD.
 * 
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 */
function sendSignedHex100362(myUserID, nodeID, userID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100362(nodeID, userID, signedInfo, async function(e) {
            console.info('sendSignedHex100362 = ' + JSON.stringify(e));

            // Receiver sign the tx on client side
            // NO.1 c2b_br_raw_data
            let br      = e.c2b_br_raw_data;
            let inputs  = br.inputs;
            let privkey = await getFundingPrivKey(myUserID, e.channel_id);
            let br_hex  = signP2SH(true, br.hex, br.pub_key_a, br.pub_key_b, privkey, inputs);

            // NO.2 c2b_rd_raw_data
            let rd      = e.c2b_rd_raw_data;
            inputs      = rd.inputs;
            let rd_hex  = signP2SH(true, rd.hex, rd.pub_key_a, rd.pub_key_b, privkey, inputs);

            // will send 100363
            let signedInfo               = new SignedInfo100363();
            signedInfo.channel_id        = e.channel_id;
            signedInfo.c2b_rd_signed_hex = rd_hex;
            signedInfo.c2b_br_signed_hex = br_hex;
            signedInfo.c2b_br_id         = br.br_id;

            // FUNCTION ONLY FOR GUI TOOL
            displaySentMessage100363(nodeID, userID, signedInfo);

            // SDK API
            await sendSignedHex100363(nodeID, userID, signedInfo);
            resolve(e);
        });
    })
}

/**
 * Type -100363 Protocol send signed info that Receiver signed in 100362 to OBD.
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param signedInfo 
 */
function sendSignedHex100363(nodeID, userID, signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100363(nodeID, userID, signedInfo, function(e) {
            console.info('sendSignedHex100363 = ' + JSON.stringify(e));

            // FUNCTION ONLY FOR GUI TOOL
            listening110352ForGUITool(e);

            resolve(e);
        });
    })
}

/**
 * Type -100364 Protocol send signed info that Receiver signed in 110353 to OBD.
 * @param signedInfo 
 */
function sendSignedHex100364(signedInfo) {
    return new Promise((resolve, reject) => {
        obdApi.sendSignedHex100364(signedInfo, function(e) {
            console.info('sendSignedHex100364 = ' + JSON.stringify(e));

            // FUNCTION ONLY FOR GUI TOOL
            afterCommitmentTransactionAccepted();
            displayMyChannelListAtTopRight(kPageSize, kPageIndex);

            resolve(e);
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
 * @param isFunder 
 */
function closeChannel(myUserID, nodeID, userID, channel_id, isFunder) {
    return new Promise((resolve, reject) => {
        obdApi.closeChannel(nodeID, userID, channel_id, function(e) {
            console.info('SDK: -100038 closeChannel = ' + JSON.stringify(e));
            saveChannelStatus(myUserID, channel_id, isFunder, kStatusCloseChannel);
            saveSenderRole(kIsSender);
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
 * @param isFunder 
 */
function closeChannelSigned(myUserID, nodeID, userID, info, isFunder) {
    return new Promise((resolve, reject) => {
        obdApi.closeChannelSigned(nodeID, userID, info, function(e) {
            console.info('SDK: -100039 closeChannelSigned = ' + JSON.stringify(e));
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusCloseChannelSigned);
            resolve(true);
        });
    })
}
