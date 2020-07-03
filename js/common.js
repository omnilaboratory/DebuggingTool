var obdApi = new ObdApi();
var enumMsgType = new MessageType();

// Save connection status.
var isConnectToOBD = false;

// Save login status.
var isLogined = false;

// Save obd node id.
// var globalNodeID;

// Save userID of a user already logined.
// var globalUserID;

// save OBD messages
var obdMessages = '';
var arrObdMsg = [];

// mnemonic using for login
var mnemonicWithLogined = '';

//
const inNewHtml = 'in_new_html';

//
const itemChannelList = 'channel_list';

//
const itemAddr = 'addr';

//
const itemCounterparties = 'counterparties';

//
const itemOBDList = 'obd_list';

//
const invokeHistory = 'invoke_history';

//
const itemMnemonic = 'mnemonic';

//
const itemGoWhere = 'go_where';

//
const itemChannelID = 'channel_id';

//
const itemTempHash = 'TempHash';

//
const itemChannelAddress = 'ChannelAddress';

//
const itemFundingBtcData = 'FundingBtcData';

//
// const itemFundingAssetHex = 'FundingAssetHex';

//
// const itemFundingBtcTxid = 'FundingBtcTxid';

//
// const itemRsmcMsgHash = 'RsmcMsgHash';

//
// const itemHtlcRequestHash = 'HtlcRequestHash';

//
const itemHtlcVerifyR = 'HtlcVerifyR';

// the info save to local storage [ChannelList].
var channelInfo;

/**
 * Object of IndexedDB.
 */
var db;

/**
 * Object Store (table) name of IndexedDB.
 * Global messages
 */
const tbGlobalMsg = 'global_msg';

/**
 * Object Store (table) name of IndexedDB.
 * Funding private key
 */
const tbFundingPrivkey = 'funding_privkey';

// word wrap code.
// result.setAttribute('style', 'word-break: break-all;white-space: normal;');

/**
 * Save fundingBTC parameters value.
 */
// var btcFromAddr, btcFromAddrPrivKey, btcToAddr, btcAmount, btcMinerFee;

/**
 * open / close auto mode.
 */
var isAutoMode = false;

/**
 * Save funding private key to local storage
 */
const FundingPrivKey = 'FundingPrivKey';

/**
 * Save temporary private key to local storage
 */
const TempPrivKey = 'TempPrivKey';

/**
 * Save RSMC tx temporary private key to local storage
 */
const RsmcTempPrivKey = 'RsmcTempPrivKey';

/**
 * Save HTLC tx temporary private key to local storage
 */
const HtlcTempPrivKey = 'HtlcTempPrivKey';

/**
 * Save HTLC htnx tx temporary private key to local storage
 */
const HtlcHtnxTempPrivKey = 'HtlcHtnxTempPrivKey';


// Get name of saveGoWhere variable.
function getSaveName() {
    return itemGoWhere;
}

// auto response to -100040 (HTLCCreated) 
// listening to -110040 and send -100041 HTLCSigned
function listening110040(e, msgType) {
    console.info('NOW isAutoMode = ' + isAutoMode);

    saveTempHash(e.commitment_tx_hash);

    if (!isAutoMode) return;
    
    console.info('listening110040 = ' + JSON.stringify(e));

    // Generate an address by local js library.
    let addr_1 = genAddressFromMnemonic();
    let addr_2 = genAddressFromMnemonic();
    saveAddresses(addr_1);
    saveAddresses(addr_2);

    // will send -100041 HTLCSigned
    getFPKByAsync(db, e.channel_id).then(function (result) {
        let info                                = new HtlcSignedInfo();
        info.commitment_tx_hash                 = e.commitment_tx_hash;
        info.channel_address_private_key        = result;
        info.last_temp_address_private_key      = getTempPrivKey(TempPrivKey, e.channel_id);
        info.curr_rsmc_temp_address_pub_key     = addr_1.result.pubkey;
        info.curr_rsmc_temp_address_private_key = addr_1.result.wif;
        info.curr_htlc_temp_address_pub_key     = addr_2.result.pubkey;
        info.curr_htlc_temp_address_private_key = addr_2.result.wif;
    
        // OBD API
        obdApi.htlcSigned(e.payer_node_address, e.payer_peer_id, info, function(e) {
            console.info('-100041 htlcSigned = ' + JSON.stringify(e));
            saveChannelList(e, e.channel_id, msgType);
            saveTempPrivKey(RsmcTempPrivKey, e.channel_id, addr_1.result.wif);
            saveTempPrivKey(HtlcTempPrivKey, e.channel_id, addr_2.result.wif);
        });
    });
}

// auto response to -100045 (HTLCSendVerifyR) 
// listening to -110045 and send -100046 HTLCSendSignVerifyR
function listening110045(e, msgType) {
    console.info('NOW isAutoMode = ' + isAutoMode);

    saveTempHash(e.msg_hash);
    saveHtlcVerifyR(e.r);

    if (!isAutoMode) return;
    
    console.info('listening110045 = ' + JSON.stringify(e));

    // Alice will send -100046 HTLCSendSignVerifyR
    getFPKByAsync(db, e.channel_id).then(function (result) {
        let info                         = new HtlcSendSignVerifyRInfo();
        info.channel_id                  = e.channel_id;
        info.r                           = e.r;
        info.msg_hash                    = e.msg_hash;
        info.channel_address_private_key = result;
    
        // OBD API
        obdApi.htlcSendSignVerifyR(e.payer_node_address, e.payer_peer_id, info, function(e) {
            console.info('-100046 htlcSendSignVerifyR = ' + JSON.stringify(e));
            saveChannelList(e, e.channel_id, msgType);
        });
    });
}

// auto response to -100049 (CloseHTLC) 
// listening to -110049 and send -100050 CloseHTLCSigned
function listening110049(e, msgType) {
    console.info('NOW isAutoMode = ' + isAutoMode);

    saveTempHash(e.msg_hash);

    if (!isAutoMode) return;
    
    console.info('listening110049 = ' + JSON.stringify(e));

    // Generate an address by local js library.
    let addr = genAddressFromMnemonic();
    saveAddresses(addr);
    
    // will send -100050 CloseHTLCSigned
    getFPKByAsync(db, e.channel_id).then(function (result) {
        let info                                         = new CloseHtlcTxInfoSigned();
        info.msg_hash                                    = e.msg_hash;
        info.channel_address_private_key                 = result;
        info.last_rsmc_temp_address_private_key          = getTempPrivKey(RsmcTempPrivKey, e.channel_id);
        info.last_htlc_temp_address_private_key          = getTempPrivKey(HtlcTempPrivKey, e.channel_id);
        info.last_htlc_temp_address_for_htnx_private_key = getTempPrivKey(HtlcHtnxTempPrivKey, e.channel_id);
        info.curr_rsmc_temp_address_pub_key              = addr.result.pubkey;
        info.curr_rsmc_temp_address_private_key          = addr.result.wif;
    
        // OBD API
        obdApi.closeHTLCSigned(e.sender_node_address, e.sender_peer_id, info, function(e) {
            console.info('-100050 closeHTLCSigned = ' + JSON.stringify(e));
            saveTempPrivKey(RsmcTempPrivKey, e.channel_id, info.curr_rsmc_temp_address_private_key);
        });
    });
}

// auto response to -100032 (openChannel) 
// listening to -110032 and send -100033 acceptChannel
function listening110032(e, msgType) {
    console.info('NOW isAutoMode = ' + isAutoMode);
    saveChannelID(e.temporary_channel_id);

    if (!isAutoMode) return;
    
    console.info('listening110032 = ' + JSON.stringify(e));

    let p2pID    = e.funder_node_address;
    let name     = e.funder_peer_id;
    let temp_cid = e.temporary_channel_id;

    // Generate an address by local js library.
    let addr = genAddressFromMnemonic();
    saveAddresses(addr);

    // will send -100033 acceptChannel
    let info                  = new AcceptChannelInfo();
    info.temporary_channel_id = temp_cid;
    info.funding_pubkey       = addr.result.pubkey;
    info.approval             = true;

    // OBD API
    obdApi.acceptChannel(p2pID, name, info, function(e) {
        console.info('-100033 acceptChannel = ' + JSON.stringify(e));
        saveChannelList(e);
        saveCounterparties(name, p2pID);
        saveChannelAddress(e.channel_address);
        addData2TbFundingPrivkey($("#logined").text(), temp_cid, addr.result.wif);
    });
}

// auto response to -100340 (BTCFundingCreated)
// listening to -110340 and send -100350 BTCFundingSigned
function listening110340(e, msgType) {
    console.info('NOW isAutoMode = ' + isAutoMode);

    saveTempHash(e.funding_txid);

    if (!isAutoMode) return;
    
    console.info('listening110340 = ' + JSON.stringify(e));

    // will send -100350 BTCFundingSigned
    getFPKByAsync(db, e.temporary_channel_id).then(function (result) {
        let info                          = new FundingBtcSigned();
        info.temporary_channel_id         = e.temporary_channel_id;
        info.channel_address_private_key  = result;
        info.funding_txid                 = e.funding_txid;
        info.approval                     = true;
    
        // OBD API
        obdApi.btcFundingSigned(e.funder_node_address, e.funder_peer_id, info, function(e) {
            console.info('-100350 btcFundingSigned = ' + JSON.stringify(e));
            saveChannelList(e, e.temporary_channel_id, msgType);
        });
    });
}

// auto response to -100034 (AssetFundingCreated)
// listening to -110034 and send -100035 AssetFundingSigned
function listening110034(e, msgType) {
    console.info('NOW isAutoMode = ' + isAutoMode);
    if (!isAutoMode) return;
    console.info('listening110034 = ' + JSON.stringify(e));

    // will send -100035 AssetFundingSigned
    getFPKByAsync(db, e.temporary_channel_id).then(function (result) {
        let info                                = new ChannelFundingSignedInfo();
        info.temporary_channel_id               = e.temporary_channel_id;
        info.fundee_channel_address_private_key = result;
    
        // OBD API
        obdApi.channelFundingSigned(e.funder_node_address, e.funder_peer_id, info, function(e) {
            console.info('-100035 AssetFundingSigned = ' + JSON.stringify(e));
            saveChannelList(e, e.channel_id, msgType);
    
            // Once sent -100035 AssetFundingSigned , the final channel_id has generated.
            // So need update the local saved data for funding private key and channel_id.
            addData2TbFundingPrivkey($("#logined").text(), e.channel_id, 
                info.fundee_channel_address_private_key);
            saveChannelID(e.channel_id);
        });
    });
}

// save funding private key of Alice side
// Once sent -100035 AssetFundingSigned , the final channel_id has generated.
// So need update the local saved data for funding private key and channel_id.
function listening110035(e, msgType) {
    console.info('listening110035 = ' + JSON.stringify(e));

    getFPKByAsync(db, e.temporary_channel_id).then(function (result) {
        addData2TbFundingPrivkey($("#logined").text(), e.channel_id, result);
    });

    let tempPrivKey = getTempPrivKey(TempPrivKey, e.temporary_channel_id);
    saveTempPrivKey(TempPrivKey, e.channel_id, tempPrivKey);

    saveChannelID(e.channel_id);
}

// auto response to -100351 (RSMCCTxCreated)
// listening to -110351 and send -100352 RSMCCTxSigned
function listening110351(e, msgType) {
    console.info('NOW isAutoMode = ' + isAutoMode);

    saveTempHash(e.msg_hash);

    if (!isAutoMode) return;

    console.info('listening110351 = ' + JSON.stringify(e));

    // Generate an address by local js library.
    let addr = genAddressFromMnemonic();
    saveAddresses(addr);

    // will send -100352 RSMCCTxSigned
    getFPKByAsync(db, e.channel_id).then(function (resp) {
        let info                           = new CommitmentTxSigned();
        info.channel_id                    = e.channel_id;
        info.msg_hash                      = e.msg_hash;
        info.curr_temp_address_pub_key     = addr.result.pubkey;
        info.curr_temp_address_private_key = addr.result.wif;
        info.channel_address_private_key   = resp;
        info.last_temp_address_private_key = getTempPrivKey(TempPrivKey, e.channel_id);
        info.approval                      = true;
    
        // OBD API
        obdApi.revokeAndAcknowledgeCommitmentTransaction(
            e.payer_node_address, e.payer_peer_id, info, function(e) {
            console.info('-100352 RSMCCTxSigned = ' + JSON.stringify(e));
            saveChannelList(e, e.channel_id, msgType);
            saveTempPrivKey(TempPrivKey, e.channel_id, info.curr_temp_address_private_key);
        });
    });
}

// 
function registerEvent() {
    // auto response mode
    let msg_110032 = enumMsgType.MsgType_RecvChannelOpen_32;
    obdApi.registerEvent(msg_110032, function(e) {
        listening110032(e, msg_110032);
    });

    // auto response mode
    let msg_110340 = enumMsgType.MsgType_FundingCreate_RecvBtcFundingCreated_340;
    obdApi.registerEvent(msg_110340, function(e) {
        listening110340(e, msg_110340);
    });

    // auto response mode
    let msg_110034 = enumMsgType.MsgType_FundingCreate_RecvAssetFundingCreated_34;
    obdApi.registerEvent(msg_110034, function(e) {
        listening110034(e, msg_110034);
    });

    // auto response mode
    let msg_110035 = enumMsgType.MsgType_FundingSign_RecvAssetFundingSigned_35;
    obdApi.registerEvent(msg_110035, function(e) {
        listening110035(e, msg_110035);
    });

    // auto response mode
    let msg_110351 = enumMsgType.MsgType_CommitmentTx_RecvCommitmentTransactionCreated_351;
    obdApi.registerEvent(msg_110351, function(e) {
        listening110351(e, msg_110351);
    });
    
    // auto response mode
    let msg_110040 = enumMsgType.MsgType_HTLC_RecvAddHTLC_40;
    obdApi.registerEvent(msg_110040, function(e) {
        listening110040(e, msg_110040);
    });

    // auto response mode
    let msg_110045 = enumMsgType.MsgType_HTLC_SendVerifyR_45;
    obdApi.registerEvent(msg_110045, function(e) {
        listening110045(e, msg_110045);
    });

    // auto response mode
    let msg_110049 = enumMsgType.MsgType_HTLC_RecvRequestCloseCurrTx_49;
    obdApi.registerEvent(msg_110049, function(e) {
        listening110049(e, msg_110049);
    });
}

// logIn API at local.
function logIn(msgType) {

    let mnemonic = $("#mnemonic").val();
    // console.info('mnemonic = ' + mnemonic);

    if (mnemonic === '') {
        alert('Please input a valid mnemonic.');
        return;
    }

    obdApi.logIn(mnemonic, function(e) {

        // Register event needed for listening.
        registerEvent();

        console.info('logIn - OBD Response = ' + JSON.stringify(e));
        // If already logined, then stop listening to OBD Response,
        // DO NOT update the userID.
        if (isLogined) {
            createOBDResponseDiv(e, msgType);
            return;
        }

        // Otherwise, a new loginning, update the userID.
        mnemonicWithLogined = mnemonic;
        // nodeID              = e.nodePeerId;
        // globalUserID        = e.userPeerId;
        $("#logined").text(e.userPeerId);
        isLogined = true;
    });
}

// -102003 connectP2PPeer API at local.
function connectP2PPeer(msgType) {
    
    let info                 = new P2PPeer();
    info.remote_node_address = $("#remote_node_address").val();

    // OBD API
    obdApi.connectP2PPeer(info, function(e) {
        console.info('-102003 connectP2PPeer = ' + JSON.stringify(e));
        createOBDResponseDiv(e, msgType);
    });
}

// -100032 openChannel API at local.
function openChannel(msgType) {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();
    let pubkey  = $("#funding_pubkey").val();

    // OBD API
    obdApi.openChannel(nodeID, userID, pubkey, function(e) {
        console.info('-100032 openChannel = ' + JSON.stringify(e));
        saveChannelList(e);
        saveCounterparties(userID, nodeID);
        let privkey = getFundingPrivKeyFromPubKey(pubkey);
        addData2TbFundingPrivkey($("#logined").text(), e.temporary_channel_id, privkey);
        saveChannelID(e.temporary_channel_id);
    });
}

// -100033 accept Channel API at local.
function acceptChannel(msgType) {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();

    let info                  = new AcceptChannelInfo();
    info.temporary_channel_id = $("#temporary_channel_id").val();
    info.funding_pubkey       = $("#funding_pubkey").val();
    info.approval             = $("#checkbox_n33").prop("checked");

    // OBD API
    obdApi.acceptChannel(nodeID, userID, info, function(e) {
        console.info('-100033 acceptChannel = ' + JSON.stringify(e));
        saveChannelList(e);
        saveCounterparties(userID, nodeID);
        saveChannelAddress(e.channel_address);
        let privkey = getFundingPrivKeyFromPubKey(info.funding_pubkey);
        addData2TbFundingPrivkey($("#logined").text(), info.temporary_channel_id, privkey);
    });
}

/** 
 * -100045 htlcSendVerifyR API at local.
 * @param msgType
 */
function htlcSendVerifyR(msgType) {

    let nodeID      = $("#recipient_node_peer_id").val();
    let userID      = $("#recipient_user_peer_id").val();

    let info        = new HtlcSendVerifyRInfo();
    info.channel_id = $("#channel_id").val();
    info.r          = $("#r").val();
    info.channel_address_private_key                 = $("#channel_address_private_key").val();
    info.curr_htlc_temp_address_for_he1b_pub_key     = $("#curr_htlc_temp_address_for_he1b_pub_key").val();
    info.curr_htlc_temp_address_for_he1b_private_key = $("#curr_htlc_temp_address_for_he1b_private_key").val();

    // OBD API
    obdApi.htlcSendVerifyR(nodeID, userID, info, function(e) {
        console.info('-100045 htlcSendVerifyR = ' + JSON.stringify(e));
        saveChannelList(e, info.channel_id, msgType);
        saveTempPrivKey(HtlcHtnxTempPrivKey, info.channel_id, info.curr_htlc_temp_address_for_he1b_private_key);
    });
}

/** 
 * -100046 htlcSendSignVerifyR API at local.
 * @param msgType
 */
function htlcSendSignVerifyR(msgType) {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                         = new HtlcSendSignVerifyRInfo();
    info.channel_id                  = $("#channel_id").val();
    info.r                           = $("#r").val();
    info.msg_hash                    = $("#msg_hash").val();
    info.channel_address_private_key = $("#channel_address_private_key").val();

    // OBD API
    obdApi.htlcSendSignVerifyR(nodeID, userID, info, function(e) {
        console.info('-100046 htlcSendSignVerifyR = ' + JSON.stringify(e));
        saveChannelList(e, info.channel_id, msgType);
    });
}

/** 
 * -100049 closeHTLC API at local.
 * @param msgType
 */
function closeHTLC(msgType) {

    let nodeID    = $("#recipient_node_peer_id").val();
    let userID    = $("#recipient_user_peer_id").val();

    let info                                         = new CloseHtlcTxInfo();
    info.channel_id                                  = $("#channel_id").val();
    info.channel_address_private_key                 = $("#channel_address_private_key").val();
    info.last_rsmc_temp_address_private_key          = $("#last_rsmc_temp_address_private_key").val();
    info.last_htlc_temp_address_private_key          = $("#last_htlc_temp_address_private_key").val();
    info.last_htlc_temp_address_for_htnx_private_key = $("#last_htlc_temp_address_for_htnx_private_key").val();
    info.curr_rsmc_temp_address_pub_key              = $("#curr_rsmc_temp_address_pub_key").val();
    info.curr_rsmc_temp_address_private_key          = $("#curr_rsmc_temp_address_private_key").val();

    // OBD API
    obdApi.closeHTLC(nodeID, userID, info, function(e) {
        console.info('-100049 closeHTLC = ' + JSON.stringify(e));
        saveChannelList(e, e.channel_id, msgType);
        saveTempPrivKey(RsmcTempPrivKey, e.channel_id, info.curr_rsmc_temp_address_private_key);
    });
}

/** 
 * -100050 closeHTLCSigned API at local.
 * @param msgType
 */
function closeHTLCSigned(msgType) {

    let nodeID    = $("#recipient_node_peer_id").val();
    let userID    = $("#recipient_user_peer_id").val();

    let info                                         = new CloseHtlcTxInfoSigned();
    info.msg_hash                                    = $("#msg_hash").val();
    info.channel_address_private_key                 = $("#channel_address_private_key").val();
    info.last_rsmc_temp_address_private_key          = $("#last_rsmc_temp_address_private_key").val();
    info.last_htlc_temp_address_private_key          = $("#last_htlc_temp_address_private_key").val();
    info.last_htlc_temp_address_for_htnx_private_key = $("#last_htlc_temp_address_for_htnx_private_key").val();
    info.curr_rsmc_temp_address_pub_key              = $("#curr_rsmc_temp_address_pub_key").val();
    info.curr_rsmc_temp_address_private_key          = $("#curr_rsmc_temp_address_private_key").val();

    // OBD API
    obdApi.closeHTLCSigned(nodeID, userID, info, function(e) {
        console.info('-100050 closeHTLCSigned = ' + JSON.stringify(e));
        saveTempPrivKey(RsmcTempPrivKey, e.channel_id, info.curr_rsmc_temp_address_private_key);
    });
}

/** 
 * -100080 atomicSwap API at local.
 * @param msgType
 */
function atomicSwap(msgType) {

    let info                    = new AtomicSwapRequest();
    info.channel_id_from        = $("#channel_id_from").val();
    info.channel_id_to          = $("#channel_id_to").val();
    info.recipient_user_peer_id = $("#recipient_user_peer_id").val();
    info.property_sent          = Number($("#property_sent").val());
    info.amount                 = Number($("#amount").val());
    info.exchange_rate          = Number($("#exchange_rate").val());
    info.property_received      = Number($("#property_received").val());
    info.transaction_id         = $("#transaction_id").val();
    info.time_locker            = Number($("#time_locker").val());

    // OBD API
    obdApi.atomicSwap(info, function(e) {
        console.info('-100080 atomicSwap = ' + JSON.stringify(e));
    });
}

/** 
 * -100081 atomicSwapAccepted API at local.
 * @param msgType
 */
function atomicSwapAccepted(msgType) {

    let info                    = new AtomicSwapAccepted();
    info.channel_id_from        = $("#channel_id_from").val();
    info.channel_id_to          = $("#channel_id_to").val();
    info.recipient_user_peer_id = $("#recipient_user_peer_id").val();
    info.property_sent          = Number($("#property_sent").val());
    info.amount                 = Number($("#amount").val());
    info.exchange_rate          = Number($("#exchange_rate").val());
    info.property_received      = Number($("#property_received").val());
    info.transaction_id         = $("#transaction_id").val();
    info.target_transaction_id  = $("#target_transaction_id").val();
    info.time_locker            = Number($("#time_locker").val());

    // OBD API
    obdApi.atomicSwapAccepted(info, function(e) {
        console.info('-100081 atomicSwapAccepted = ' + JSON.stringify(e));
    });
}

/** 
 * -100038 closeChannel API at local.
 * @param msgType
 */
function closeChannel(msgType) {

    let channel_id = $("#channel_id").val();

    // OBD API
    obdApi.closeChannel(channel_id, function(e) {
        console.info('-100038 closeChannel = ' + JSON.stringify(e));
        saveChannelList(e, channel_id, msgType);
    });
}

/** 
 * -100039 closeChannelSigned API at local.
 * @param msgType
 */
function closeChannelSigned(msgType) {

    let info                        = new CloseChannelSign();
    info.channel_id                 = $("#channel_id").val();
    info.request_close_channel_hash = $("#request_close_channel_hash").val();
    info.approval                   = $("#checkbox_n39").prop("checked");

    // OBD API
    obdApi.closeChannelSign(info, function(e) {
        console.info('-100039 closeChannelSign = ' + JSON.stringify(e));
        saveChannelList(e, info.channel_id, msgType);
    });
}

/** 
 * 1200 getBalanceForOmni API at local.
 * @param msgType
 */
function getBalanceForOmni(msgType) {

    let address = $("#address").val();

    // OBD API
    obdApi.omniGetAllBalancesForAddress(address, function(e) {
        console.info('1200 getBalanceForOmni - OBD Response = ' + JSON.stringify(e));
    });
}

/** 
 * -102113 issuanceFixed API at local.
 * @param msgType
 */
function issuanceFixed(msgType) {

    let info            = new OmniSendIssuanceFixed();
    info.from_address   = $("#from_address").val();
    info.name           = $("#name").val();
    info.ecosystem      = Number($("#ecosystem").val());
    info.divisible_type = Number($("#divisible_type").val());
    info.data           = $("#data").val();
    info.amount         = Number($("#amount").val());

    // OBD API
    obdApi.createNewTokenFixed(info, function(e) {
        console.info('-102113 createNewTokenFixed = ' + JSON.stringify(e));
    });
}

/** 
 * -102114 issuanceManaged API at local.
 * @param msgType
 */
function issuanceManaged(msgType) {

    let info            = new OmniSendIssuanceManaged();
    info.from_address   = $("#from_address").val();
    info.name           = $("#name").val();
    info.ecosystem      = Number($("#ecosystem").val());
    info.divisible_type = Number($("#divisible_type").val());
    info.data           = $("#data").val();

    // OBD API
    obdApi.createNewTokenManaged(info, function(e) {
        console.info('-102114 issuanceManaged = ' + JSON.stringify(e));
    });
}

/** 
 * -102115 sendGrant API at local.
 * @param msgType
 */
function sendGrant(msgType) {

    let info          = new OmniSendGrant();
    info.from_address = $("#from_address").val();
    info.property_id  = Number($("#property_id").val());
    info.amount       = Number($("#amount").val());
    info.memo         = $("#memo").val();

    // OBD API
    obdApi.omniSendGrant(info, function(e) {
        console.info('-102115 sendGrant = ' + JSON.stringify(e));
    });
}

/** 
 * -102116 sendRevoke API at local.
 * @param msgType
 */
function sendRevoke(msgType) {

    let info          = new OmniSendRevoke();
    info.from_address = $("#from_address").val();
    info.property_id  = Number($("#property_id").val());
    info.amount       = Number($("#amount").val());
    info.memo         = $("#memo").val();

    // OBD API
    obdApi.omniSendRevoke(info, function(e) {
        console.info('-102116 sendRevoke = ' + JSON.stringify(e));
    });
}

/** 
 * -102117 listProperties API at local.
 * @param msgType
 */
function listProperties(msgType) {
    // OBD API
    obdApi.listProperties(function(e) {
        console.info('-102117 listProperties = ' + JSON.stringify(e));
    });
}

/** 
 * -102118 getTransaction API at local.
 * @param msgType
 */
function getTransaction(msgType) {

    let txid = $("#txid").val();

    // OBD API
    obdApi.getOmniTxByTxid(txid, function(e) {
        console.info('-102118 getTransaction = ' + JSON.stringify(e));
    });
}

/** 
 * -102119 getAssetNameByID API at local.
 * @param msgType
 */
function getAssetNameByID(msgType) {

    let propertyId = $("#PropertyID").val();

    // OBD API
    obdApi.omniGetAssetNameByID(propertyId, function(e) {
        console.info('-102119 getAssetNameByID = ' + JSON.stringify(e));
    });
}

/** 
 * -103208 getAllBRTx API at local.
 * @param msgType
 */
function getAllBRTx(msgType) {

    let channel_id = $("#channel_id").val();

    // OBD API
    obdApi.getAllBRTx(channel_id, function(e) {
        console.info('-103208 getAllBRTx = ' + JSON.stringify(e));
    });
}

/** 
 * -103154 GetChannelDetail API at local.
 * @param msgType
 */
function getChannelDetail(msgType) {

    let id = $("#id").val();

    // OBD API
    obdApi.getChannelById(Number(id), function(e) {
        console.info('-103154 GetChannelDetail = ' + JSON.stringify(e));
    });
}

/** 
 * -103150 getAllChannels API at local.
 * @param msgType
 */
function getAllChannels(msgType) {
    // OBD API
    obdApi.getAllChannels(function(e) {
        console.info('-103150 getAllChannels = ' + JSON.stringify(e));
    });
}

/** 
 * -103200 GetAllCommitmentTransactions API at local.
 * @param msgType
 */
function getAllCommitmentTransactions(msgType) {

    let channel_id = $("#channel_id").val();

    // OBD API
    obdApi.getItemsByChannelId(channel_id, function(e) {
        console.info('-103200 GetAllCommitmentTransactions = ' + JSON.stringify(e));
    });
}

/** 
 * -103203 getLatestCommitmentTx API at local.
 * @param msgType
 */
function getLatestCommitmentTx(msgType) {

    let channel_id = $("#channel_id").val();

    // OBD API
    obdApi.getLatestCommitmentTxByChannelId(channel_id, function(e) {
        console.info('-103203 getLatestCommitmentTx = ' + JSON.stringify(e));
    });
}

// -100340 BTC Funding Created API at local.
function btcFundingCreated(msgType) {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                         = new FundingBtcCreated();
    info.temporary_channel_id        = $("#temporary_channel_id").val();
    info.channel_address_private_key = $("#channel_address_private_key").val();
    info.funding_tx_hex              = $("#funding_tx_hex").val();

    // OBD API
    obdApi.btcFundingCreated(nodeID, userID, info, function(e) {
        console.info('-100340 btcFundingCreated = ' + JSON.stringify(e));
        saveChannelList(e, info.temporary_channel_id, msgType);
    });
}

// -100350 BTC Funding Signed API at local.
function btcFundingSigned(msgType) {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                         = new FundingBtcSigned();
    info.temporary_channel_id        = $("#temporary_channel_id").val();
    info.channel_address_private_key = $("#channel_address_private_key").val();
    info.funding_txid                = $("#funding_txid").val();
    info.approval                    = $("#checkbox_n3500").prop("checked");

    // OBD API
    obdApi.btcFundingSigned(nodeID, userID, info, function(e) {
        console.info('-100350 btcFundingSigned = ' + JSON.stringify(e));
        saveChannelList(e, info.temporary_channel_id, msgType);
    });
}

// -100034 Omni Asset Funding Created API at local.
function assetFundingCreated(msgType) {

    let nodeID   = $("#recipient_node_peer_id").val();
    let userID   = $("#recipient_user_peer_id").val();
    let temp_cid = $("#temporary_channel_id").val();
    let t_ad_pbk = $("#temp_address_pub_key").val();
    let t_ad_prk = $("#temp_address_private_key").val();
    let privkey  = $("#channel_address_private_key").val();
    let tx_hex   = $("#funding_tx_hex").val();

    let info                         = new ChannelFundingCreatedInfo();
    info.temporary_channel_id        = temp_cid;
    info.temp_address_pub_key        = t_ad_pbk;
    info.temp_address_private_key    = t_ad_prk;
    info.channel_address_private_key = privkey;
    info.funding_tx_hex              = tx_hex;

    // OBD API
    obdApi.channelFundingCreated(nodeID, userID, info, function(e) {
        console.info('-100034 - assetFundingCreated = ' + JSON.stringify(e));
        saveChannelList(e, temp_cid, msgType);
        saveTempPrivKey(TempPrivKey, temp_cid, t_ad_prk);
    });
}

// -100035 Omni Asset Funding Signed API at local.
function assetFundingSigned(msgType) {

    let nodeID    = $("#recipient_node_peer_id").val();
    let userID    = $("#recipient_user_peer_id").val();
    let temp_cid  = $("#temporary_channel_id").val();
    let privkey   = $("#fundee_channel_address_private_key").val();
    // let approval   = $("#checkbox_n35").prop("checked");

    let info                                = new ChannelFundingSignedInfo();
    info.temporary_channel_id               = temp_cid;
    info.fundee_channel_address_private_key = privkey;
    // info.approval = approval;

    // OBD API
    obdApi.channelFundingSigned(nodeID, userID, info, function(e) {
        console.info('-100035 - assetFundingSigned = ' + JSON.stringify(e));
        saveChannelList(e, e.channel_id, msgType);
        
        // Once sent -100035 AssetFundingSigned , the final channel_id has generated.
        // So need update the local saved data for funding private key and channel_id.
        addData2TbFundingPrivkey($("#logined").text(), e.channel_id, privkey);
        saveChannelID(e.channel_id);
    });
}

// -102109 funding BTC API at local.
function fundingBTC(msgType) {

    let from_address             = $("#from_address").val();
    let from_address_private_key = $("#from_address_private_key").val();
    let to_address               = $("#to_address").val();
    let amount                   = $("#amount").val();
    let miner_fee                = $("#miner_fee").val();

    let info                      = new BtcFundingInfo();
    info.from_address             = from_address;
    info.from_address_private_key = from_address_private_key;
    info.to_address               = to_address;
    info.amount                   = Number(amount);
    info.miner_fee                = Number(miner_fee);

    //Save value to variable
    // btcFromAddr        = from_address;
    // btcFromAddrPrivKey = from_address_private_key;
    // btcToAddr          = to_address;
    // btcAmount          = amount;
    // btcMinerFee        = miner_fee;

    // Get temporary_channel_id
    let tempChID = getChannelID();

    // OBD API
    obdApi.fundingBTC(info, function(e) {
        console.info('-102109 fundingBTC = ' + JSON.stringify(e));
        saveChannelList(e, tempChID, msgType);
        saveTempHash(e.hex);
        saveFundingBtcData(info);
    });
}

//  -102120 funding Omni Asset API at local.
function fundingAsset(msgType) {

    let info                      = new OmniFundingAssetInfo();
    info.from_address             = $("#from_address").val();
    info.from_address_private_key = $("#from_address_private_key").val();
    info.to_address               = $("#to_address").val();
    info.amount                   = Number($("#amount").val());
    info.property_id              = Number($("#property_id").val());

    // Get temporary_channel_id
    let tempChID = getChannelID();

    // OBD API
    obdApi.fundingAssetOfOmni(info, function(e) {
        console.info(' -102120 fundingAssetOfOmni = ' + JSON.stringify(e));
        saveChannelList(e, tempChID, msgType);
        saveTempHash(e.hex);
    });
}

// -100402 createInvoice API at local.
function createInvoice(msgType) {

    let info         = new InvoiceInfo();
    info.property_id = Number($("#property_id").val());
    info.amount      = Number($("#amount").val());
    info.h           = $("#h").val();
    info.expiry_time = $("#expiry_time").val();
    info.description = $("#description").val();

    // OBD API
    obdApi.htlcInvoice(info, function(e) {
        console.info('-100402 createInvoice = ' + JSON.stringify(e));

        $("#newDiv").remove();
        createElement($("#name_req_div"), 'div', '', 'panelItem', 'newDiv');
        
        let newDiv     = $("#newDiv");
        let strInvoice = JSON.stringify(e);

        // Basecode string of invoice
        strInvoice = strInvoice.replace("\"", "").replace("\"", "");
        createElement(newDiv, 'div', strInvoice, 'str_invoice');

        // QRCode of invoice
        createElement(newDiv, 'div', '', 'qrcode', 'qrcode');
        let qrcode = new QRCode("qrcode", {
            width : 160, height : 160
        });
        qrcode.makeCode(strInvoice);
    });
}

// -100040 htlcCreated API at local.
function htlcCreated(msgType) {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();

    let info                                         = new HtlcCreatedInfo();
    info.recipient_user_peer_id                      = userID;
    info.property_id                                 = Number($("#property_id").val());
    info.amount                                      = Number($("#amount").val());
    info.memo                                        = $("#memo").val();
    info.h                                           = $("#h").val();
    info.routing_packet                              = $("#routing_packet").val();
    info.channel_address_private_key                 = $("#channel_address_private_key").val();
    info.last_temp_address_private_key               = $("#last_temp_address_private_key").val();
    info.curr_rsmc_temp_address_pub_key              = $("#curr_rsmc_temp_address_pub_key").val();
    info.curr_rsmc_temp_address_private_key          = $("#curr_rsmc_temp_address_private_key").val();
    info.curr_htlc_temp_address_pub_key              = $("#curr_htlc_temp_address_pub_key").val();
    info.curr_htlc_temp_address_private_key          = $("#curr_htlc_temp_address_private_key").val();
    info.curr_htlc_temp_address_for_ht1a_pub_key     = $("#curr_htlc_temp_address_for_ht1a_pub_key").val();
    info.curr_htlc_temp_address_for_ht1a_private_key = $("#curr_htlc_temp_address_for_ht1a_private_key").val();

    // OBD API
    obdApi.htlcCreated(nodeID, userID, info, function(e) {
        console.info('-100040 htlcCreated = ' + JSON.stringify(e));
        // save 3 privkeys
        saveTempPrivKey(RsmcTempPrivKey, e.channel_id, info.curr_rsmc_temp_address_private_key);
        saveTempPrivKey(HtlcTempPrivKey, e.channel_id, info.curr_htlc_temp_address_private_key);
        saveTempPrivKey(HtlcHtnxTempPrivKey, e.channel_id, info.curr_htlc_temp_address_for_ht1a_private_key);
    });
}

// -100041 htlcSigned API at local.
function htlcSigned(msgType) {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();

    let info                                = new HtlcSignedInfo();
    info.commitment_tx_hash                 = $("#commitment_tx_hash").val();
    info.channel_address_private_key        = $("#channel_address_private_key").val();
    info.last_temp_address_private_key      = $("#last_temp_address_private_key").val();
    info.curr_rsmc_temp_address_pub_key     = $("#curr_rsmc_temp_address_pub_key").val();
    info.curr_rsmc_temp_address_private_key = $("#curr_rsmc_temp_address_private_key").val();
    info.curr_htlc_temp_address_pub_key     = $("#curr_htlc_temp_address_pub_key").val();
    info.curr_htlc_temp_address_private_key = $("#curr_htlc_temp_address_private_key").val();

    // OBD API
    obdApi.htlcSigned(nodeID, userID, info, function(e) {
        console.info('-100041 htlcSigned = ' + JSON.stringify(e));
        saveChannelList(e, e.channel_id, msgType);
        saveTempPrivKey(RsmcTempPrivKey, e.channel_id, info.curr_rsmc_temp_address_private_key);
        saveTempPrivKey(HtlcTempPrivKey, e.channel_id, info.curr_htlc_temp_address_private_key);
    });
}

// -100401 htlcSigned API at local.
function htlcFindPath(msgType) {

    let info     = new HtlcFindPathInfo();
    info.invoice = $("#invoice").val();
    // info.recipient_node_peer_id = $("#recipient_node_peer_id").val();
    // info.recipient_user_peer_id = $("#recipient_user_peer_id").val();
    // info.property_id            = Number($("#property_id").val());
    // info.amount                 = Number($("#amount").val());

    // OBD API
    obdApi.htlcFindPath(info, function(e) {
        console.info('-100401 - htlcFindPath = ' + JSON.stringify(e));
    });
}

// -100351 Commitment Transaction Created API at local.
function rsmcCTxCreated(msgType) {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();
    
    let info                           = new CommitmentTx();
    info.channel_id                    = $("#channel_id").val();
    info.amount                        = Number($("#amount").val());
    info.channel_address_private_key   = $("#channel_address_private_key").val();
    info.curr_temp_address_pub_key     = $("#curr_temp_address_pub_key").val();
    info.curr_temp_address_private_key = $("#curr_temp_address_private_key").val();
    info.last_temp_address_private_key = $("#last_temp_address_private_key").val();

    // OBD API
    obdApi.commitmentTransactionCreated(nodeID, userID, info, function(e) {
        console.info('-100351 rsmcCTxCreated = ' + JSON.stringify(e));
        saveTempPrivKey(TempPrivKey, e.channel_id, info.curr_temp_address_private_key);
    });
}

// -100352 Revoke and Acknowledge Commitment Transaction API at local.
function rsmcCTxSigned(msgType) {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                           = new CommitmentTxSigned();
    info.channel_id                    = $("#channel_id").val();
    info.channel_address_private_key   = $("#channel_address_private_key").val();
    info.curr_temp_address_pub_key     = $("#curr_temp_address_pub_key").val();
    info.curr_temp_address_private_key = $("#curr_temp_address_private_key").val();
    info.last_temp_address_private_key = $("#last_temp_address_private_key").val();
    info.msg_hash                      = $("#msg_hash").val();
    info.approval                      = $("#checkbox_n352").prop("checked");

    // OBD API
    obdApi.revokeAndAcknowledgeCommitmentTransaction(nodeID, userID, info, function(e) {
        console.info('-100352 rsmcCTxSigned = ' + JSON.stringify(e));
        saveChannelList(e, e.channel_id, msgType);
        saveTempPrivKey(TempPrivKey, e.channel_id, info.curr_temp_address_private_key);
    });
}

// Invoke each APIs.
function invokeAPIs(objSelf) {

    var msgType = Number(objSelf.getAttribute('type_id'));
    console.info('type_id = ' + msgType);

    switch (msgType) {
        // Util APIs.
        case enumMsgType.MsgType_Core_Omni_Getbalance_2112:
            getBalanceForOmni(msgType);
            break;
        case enumMsgType.MsgType_Core_Omni_CreateNewTokenFixed_2113:
            issuanceFixed(msgType);
            break;
        case enumMsgType.MsgType_Core_Omni_CreateNewTokenManaged_2114:
            issuanceManaged(msgType);
            break;
        case enumMsgType.MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115:
            sendGrant(msgType);
            break;
        case enumMsgType.MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116:
            sendRevoke(msgType);
            break;
        case enumMsgType.MsgType_Core_Omni_ListProperties_2117:
            listProperties(msgType);
            break;
        case enumMsgType.MsgType_Core_Omni_GetTransaction_2118:
            getTransaction(msgType);
            break;
        case enumMsgType.MsgType_Core_Omni_GetProperty_2119:
            getAssetNameByID(msgType);
            break;
        case enumMsgType.MsgType_CommitmentTx_AllBRByChanId_3208:
            getAllBRTx(msgType);
            break;
        case enumMsgType.MsgType_GetChannelInfoByChannelId_3154:
            getChannelDetail(msgType);
            break;
        case enumMsgType.MsgType_ChannelOpen_AllItem_3150:
            getAllChannels(msgType);
            break;
        case enumMsgType.MsgType_CommitmentTx_ItemsByChanId_3200:
            getAllCommitmentTransactions(msgType);
            break;
        case enumMsgType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203:
            getLatestCommitmentTx(msgType);
            break;
        case enumMsgType.MsgType_Mnemonic_CreateAddress_3000:
            var result = genAddressFromMnemonic();
            if (result === '') return;
            saveAddresses(result);
            createOBDResponseDiv(result, msgType);
            break;
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_3001:
            var result = getAddressInfo();
            if (result === '') return;
            createOBDResponseDiv(result, msgType);
            break;

            // APIs for debugging.
        case enumMsgType.MsgType_UserLogin_2001:
            logIn(msgType);
            break;
        case enumMsgType.MsgType_UserLogout_2002:
            obdApi.logout();
            break;
        case enumMsgType.MsgType_GetMnemonic_2004:
            // Generate mnemonic by local js library.
            // var mnemonic = btctool.generateMnemonic(128);
            // let mnemonic = obdApi.genMnemonic();
            let mnemonic = genMnemonic();
            saveMnemonic(mnemonic);
            createOBDResponseDiv(mnemonic);
            break;
        case enumMsgType.MsgType_Core_FundingBTC_2109:
            fundingBTC(msgType);
            break;
        case enumMsgType.MsgType_FundingCreate_SendBtcFundingCreated_340:
            btcFundingCreated(msgType);
            break;
        case enumMsgType.MsgType_FundingSign_SendBtcSign_350:
            btcFundingSigned(msgType);
            break;
        case enumMsgType.MsgType_Core_Omni_FundingAsset_2120:
            fundingAsset(msgType);
            break;
        case enumMsgType.MsgType_FundingCreate_SendAssetFundingCreated_34:
            assetFundingCreated(msgType);
            break;
        case enumMsgType.MsgType_FundingSign_SendAssetFundingSigned_35:
            assetFundingSigned(msgType);
            break;
        case enumMsgType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351:
            rsmcCTxCreated(msgType);
            break;
        case enumMsgType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
            rsmcCTxSigned(msgType);
            break;
        case enumMsgType.MsgType_Core_Omni_GetTransaction_2118:
            txid = "c76710920860456dff2433197db79dd030f9b527e83a2e253f5bc6ab7d197e73";
            obdApi.getOmniTxByTxid(txid);
            break;
            // Open Channel request.
        case enumMsgType.MsgType_SendChannelOpen_32:
            openChannel(msgType);
            break;
            // Accept Channel request.
        case enumMsgType.MsgType_SendChannelAccept_33:
            acceptChannel(msgType);
            break;
        case enumMsgType.MsgType_HTLC_Invoice_402:
            createInvoice(msgType);
            break;
        case enumMsgType.MsgType_HTLC_FindPath_401:
            htlcFindPath(msgType);
            break;
        case enumMsgType.MsgType_HTLC_SendAddHTLC_40:
            htlcCreated(msgType);
            break;
        case enumMsgType.MsgType_HTLC_SendAddHTLCSigned_41:
            htlcSigned(msgType);
            break;
        case enumMsgType.MsgType_HTLC_SendVerifyR_45:
            htlcSendVerifyR(msgType);
            break;
        case enumMsgType.MsgType_HTLC_SendSignVerifyR_46:
            htlcSendSignVerifyR(msgType);
            break;
        case enumMsgType.MsgType_HTLC_SendRequestCloseCurrTx_49:
            closeHTLC(msgType);
            break;
        case enumMsgType.MsgType_HTLC_SendCloseSigned_50:
            closeHTLCSigned(msgType);
            break;
        case enumMsgType.MsgType_SendCloseChannelRequest_38:
            closeChannel(msgType);
            break;
        case enumMsgType.MsgType_SendCloseChannelSign_39:
            closeChannelSigned(msgType);
            break;
        case enumMsgType.MsgType_Atomic_SendSwap_80:
            atomicSwap(msgType);
            break;
        case enumMsgType.MsgType_Atomic_SendSwapAccept_81:
            atomicSwapAccepted(msgType);
            break;
        case enumMsgType.MsgType_p2p_ConnectPeer_2003:
            connectP2PPeer(msgType);
            break;
        default:
            console.info(msgType + " do not exist");
            break;
    }
}

// get a copy of an object
function getNewObjectOf(src) {
    return Object.assign({}, src);
}

// 
function displayOBDMessages(msg) {
    let content = getNewObjectOf(msg);
    console.info("broadcast info:", JSON.stringify(content));

    // For Save all broadcast info to IndexedDB
    let user_id = $("#logined").text();
    // console.info("user_id ===== " + user_id);
    if (content.type === -102001) {
        user_id = content.result.userPeerId;
    }

    let msgHead;
    let msgTime = new Date().toLocaleString();
    let fullMsg = JSON.stringify(content, null, 2);
        fullMsg = jsonFormat(fullMsg);

    switch (Number(content.type)) {
        case enumMsgType.MsgType_UserLogin_2001:
            content.result = 'Logged In - ' + content.from;
            msgHead = msgTime +  '  - Logged In.';
            break;
        case enumMsgType.MsgType_p2p_ConnectPeer_2003:
            content.result = 'Connect to P2P Peer.';
            msgHead = msgTime+  '  - Connect to P2P Peer.';
            break;
        case enumMsgType.MsgType_SendChannelOpen_32:
            content.result = 'LAUNCH - ' + content.from +
                ' - launch an Open Channel request. ';
            msgHead = msgTime +  '  - launch an Open Channel request.';
            break;
        case enumMsgType.MsgType_SendChannelAccept_33:
            if (content.result.curr_state === 11) { // Accept
                content.result = 'ACCEPT - ' + content.from +
                    ' - accept Open Channel request. ';
                msgHead = msgTime +  '  - accept Open Channel request.';
            } else if (content.result.curr_state === 30) { // Not Accept
                content.result = 'DECLINE - ' + content.from +
                    ' - decline Open Channel request. ';
                msgHead = msgTime +  '  - decline Open Channel request.';
            }
            break;
        case enumMsgType.MsgType_FundingCreate_SendBtcFundingCreated_340:
            content.result = 'Notification - ' + content.from +
                ' - depositing BTC in Channel.';
            msgHead = msgTime +  '  - Notification: depositing BTC in Channel.';
            break;
        case enumMsgType.MsgType_FundingSign_SendBtcSign_350:
            content.result = 'Reply - ' + content.from +
                ' - depositing BTC message.';
            msgHead = msgTime +  '  - Reply: depositing BTC message.';
            break;
        case enumMsgType.MsgType_FundingCreate_SendAssetFundingCreated_34:
            content.result = 'Notification - ' + content.from +
                ' - depositing Omni Asset in Channel.';
            msgHead = msgTime +  '  - Notification: depositing Omni Asset in Channel.';
            break;
        case enumMsgType.MsgType_FundingSign_SendAssetFundingSigned_35:
            content.result = 'Reply - ' + content.from +
                ' - depositing Omni Asset message.';
            msgHead = msgTime +  '  - Reply: depositing Omni Asset message.';
            break;
        case enumMsgType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351:
            content.result = 'RSMC transfer - ' + content.from +
                ' - launch a transfer.';
            msgHead = msgTime +  '  - RSMC: launch a transfer.';
            break;
        case enumMsgType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
            content.result = 'RSMC transfer - ' + content.from +
                ' - accept a transfer.';
            msgHead = msgTime +  '  - RSMC: accept a transfer.';
            break;
        case enumMsgType.MsgType_HTLC_SendAddHTLC_40:
            content.result = 'HTLC - ' + content.from +
                ' - launch a HTLC transfer.';
            msgHead = msgTime +  '  - HTLC: launch a HTLC transfer.';
            break;
        case enumMsgType.MsgType_HTLC_SendAddHTLCSigned_41:
            content.result = 'HTLC - ' + content.from +
                ' - accept a HTLC transfer.';
            msgHead = msgTime +  '  - HTLC: accept a HTLC transfer.';
            break;
        case enumMsgType.MsgType_HTLC_SendVerifyR_45:
            content.result = 'HTLC - ' + content.from +
                ' - Sent R.';
            msgHead = msgTime +  '  - HTLC: Sent R.';
            break;
        case enumMsgType.MsgType_HTLC_SendSignVerifyR_46:
            content.result = 'HTLC - ' + content.from +
                ' - Verify R.';
            msgHead = msgTime +  '  - HTLC: Verify R.';
            break;
        case enumMsgType.MsgType_HTLC_SendRequestCloseCurrTx_49:
            content.result = 'HTLC - ' + content.from +
                ' - Request Close.';
            msgHead = msgTime +  '  - HTLC: Request Close.';
            break;
        case enumMsgType.MsgType_HTLC_SendCloseSigned_50:
            content.result = 'HTLC - ' + content.result.msg;
            msgHead = msgTime +  '  - HTLC: Closed.';
            break;
        case enumMsgType.MsgType_SendCloseChannelRequest_38:
            content.result = 'N38 Request Close Channel from - ' + content.from;
            msgHead = msgTime +  '  - Request Close Channel.';
            break;
        case enumMsgType.MsgType_SendCloseChannelSign_39:
            content.result = 'N39 Response Close Channel from - ' + content.from;
            msgHead = msgTime +  '  - Response Close Channel.';
            break;
        case enumMsgType.MsgType_Atomic_SendSwap_80:
            content.result = 'N80 Request Atomic Swap from - ' + content.from;
            msgHead = msgTime +  '  - Request Atomic Swap.';
            break;
        case enumMsgType.MsgType_Atomic_SendSwapAccept_81:
            content.result = 'N81 Response Atomic Swap from - ' + content.from;
            msgHead = msgTime +  '  - Response Atomic Swap.';
            break;
        default:
            msgHead = msgTime;
            break;
    }

    //-----------------
    // Save all broadcast info to IndexedDB
    let newMsg =           '------------------------------------';
        newMsg += '\n\n' + msgHead;
        newMsg += '\n\n' + '------------------------------------';
        newMsg += '\n\n' + fullMsg;
    addData(user_id, newMsg);

    //-----------------
    content = JSON.stringify(content.result);
    if (Number(msg.type) != enumMsgType.MsgType_Error_0) {
        content = content.replace("\"", "").replace("\"", "");
    }
    // console.info("OBD DIS - content = ", content);

    // the info save to local storage [ChannelList].
    channelInfo = content;

    // Some case do not need displayed.
    if (content === 'already login' || content === 'undefined') return;

    // Add new message
    arrObdMsg.push('\n');
    arrObdMsg.push(fullMsg);
    arrObdMsg.push('------------------------------------');
    arrObdMsg.push(msgHead);
    arrObdMsg.push('------------------------------------');
    
    let showMsg = '';
    for (let i = arrObdMsg.length - 1; i >= 0; i--) {
        showMsg += arrObdMsg[i] + '\n\n';
    }
    
    $("#obd_messages").html(showMsg);
}

// 
function getUserDataList(goWhere) {

    var api_id, description, apiItem, menuDiv;
    var jsonFile = "json/user_data_list.json";

    // dynamic create api_list div.
    $.getJSON(jsonFile, function(result) {
        // get [user_data_list] div
        var apiList = $("#user_data_list");

        for (let i = 0; i < result.data.length; i++) {
            api_id = result.data[i].id;
            description = result.data[i].description;

            // menuDiv = document.createElement('div');
            // menuDiv.setAttribute('class', 'menuItem');

            apiItem = document.createElement('a');
            apiItem.id = api_id;
            apiItem.href = '#';
            apiItem.setAttribute('class', 'url');
            apiItem.setAttribute('description', description);
            apiItem.setAttribute('onclick', 'displayUserData(this)');
            apiItem.innerText = api_id;

            // menuDiv.append(apiItem);
            apiList.append(apiItem);

            createElement(apiList, 'p');
        }

        // display User Data in new html page.
        // console.info('goWhere LIST = '+ goWhere);
        if (goWhere) $("#user_data_list").hide();
        switch (goWhere) {
            case 'MnemonicWords':
                displayUserData(MnemonicWords);
                break;
            case 'MyAddresses':
                displayUserData(MyAddresses, inNewHtml);
                break;
            case 'Counterparties':
                displayUserData(Counterparties, inNewHtml);
                break;
            case 'ChannelList':
                displayUserData(ChannelList, inNewHtml);
                break;
        }
    });
}

// getUtilList
function getUtilList() {
    var jsonFile = "json/util_list.json";
    var divName = "#util_list";

    createLeftSideMenu(jsonFile, divName);
}

// getAPIList
function getAPIList() {
    var jsonFile = "json/api_list.json";
    var divName = "#api_list";

    createLeftSideMenu(jsonFile, divName);
}

// 
function getManageAssetList() {
    var jsonFile = "json/manage_asset.json";
    var divName = "#manage_assets_list";

    createLeftSideMenu(jsonFile, divName);
}

// createLeftSideMenu
function createLeftSideMenu(jsonFile, divName) {

    var api_id, type_id, description, apiItem, menuDiv;

    // dynamic create api_list div.
    $.getJSON(jsonFile, function(result) {
        // get [api_list] div
        var apiList = $(divName);

        for (let i = 0; i < result.data.length; i++) {
            api_id = result.data[i].id;
            type_id = result.data[i].type_id;
            description = result.data[i].description;

            menuDiv = document.createElement('div');
            // menuDiv.setAttribute('class', 'menuItem');

            apiItem = document.createElement('a');
            apiItem.id = api_id;
            // apiItem.href = '#';
            apiItem.href = 'javascript:void(0);';
            apiItem.setAttribute('class', 'url');
            apiItem.setAttribute('type_id', type_id);
            apiItem.setAttribute('description', description);
            apiItem.setAttribute('onclick', 'displayAPIContent(this)');
            apiItem.innerText = api_id;

            menuDiv.append(apiItem);
            apiList.append(menuDiv);

            createElement(apiList, 'p');
        }
    });
}

// Invoke a api, show content. Dynamic create content div area.
function displayAPIContent(obj) {
    removeNameReqDiv();
    createApiNameDiv(obj);
    createRequestDiv(obj);
    createInputParamDiv(obj, 'json/util_list.json');
    createInputParamDiv(obj, 'json/api_list.json');
    createInputParamDiv(obj, 'json/manage_asset.json');
}

// create 
function createApiNameDiv(obj) {
    var content_div = $("#name_req_div");

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // create [api_name] element
    var title = document.createElement('div');
    title.setAttribute('class', 'panelTitle');
    createElement(title, 'h2', obj.innerHTML);
    newDiv.append(title);

    // create [api_description] element
    createElement(newDiv, 'text', obj.getAttribute("description"), 'api_description');

    content_div.append(newDiv);
}

// create 
function createRequestDiv(obj) {
    var content_div = $("#name_req_div");

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // create [title] element
    var title = document.createElement('div');
    title.setAttribute('class', 'panelTitle');
    createElement(title, 'h2', 'Request');
    newDiv.append(title);
    // createElement(content_div, 'h2', 'Request');

    // create [func_title] element
    createElement(newDiv, 'text', 'func: ');

    // create [func_name] element: id = JS function name.
    createElement(newDiv, 'text', obj.getAttribute("id"), 'funcText');

    // create [type_id] element
    var value = " type ( " + obj.getAttribute("type_id") + " )";
    createElement(newDiv, 'text', value);

    // create [Invoke API] element
    var button = document.createElement('button');
    button.setAttribute('type_id', obj.getAttribute("type_id"));
    button.setAttribute('class', 'button button_big');
    button.setAttribute('onclick', 'invokeAPIs(this)');
    button.innerText = 'Invoke API';
    newDiv.append(button);

    content_div.append(newDiv);
}

// dynamic create input parameters div area.
function createInputParamDiv(obj, jsonFile) {

    $.getJSON(jsonFile, function(result) {
        // get [content] div
        var content_div = $("#name_req_div");

        // get JS function name.
        var js_func = obj.getAttribute("id");

        for (let i = 0; i < result.data.length; i++) {
            // id = js_func, is JS function name.
            if (js_func === result.data[i].id) {
                var arrParams = result.data[i].parameters;
                // console.info('arrParams = ' + arrParams.length);

                // No parameter.
                if (arrParams.length === 0) {
                    break;
                }

                var newDiv = document.createElement('div');
                newDiv.setAttribute('class', 'panelItem');

                var title = document.createElement('div');
                title.setAttribute('class', 'panelTitle');
                createElement(title, 'h2', 'Input Parameters');
                newDiv.append(title);

                // Parameters
                createParamOfAPI(arrParams, newDiv);
                content_div.append(newDiv);
                autoFillValue(arrParams, obj);
            }
        }

        // display Approval Checkbox
        if (jsonFile === 'json/api_list.json') {
            var msgType = Number(obj.getAttribute("type_id"));
            switch (msgType) {
                case enumMsgType.MsgType_SendChannelAccept_33:
                case enumMsgType.MsgType_FundingSign_SendBtcSign_350:
                // case enumMsgType.MsgType_FundingSign_SendAssetFundingSigned_35:
                case enumMsgType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
                case enumMsgType.MsgType_SendCloseChannelSign_39:
                // case enumMsgType.MsgType_HTLC_SendAddHTLCSigned_41:
                    displayApprovalCheckbox(newDiv, obj, msgType);
                    content_div.append(newDiv);
                    break;
            }
        }
    });
}

//
function fillCounterparty() {
    let result = getLastCounterparty();
    if (result === '') return;
    $("#recipient_node_peer_id").val(result.p2pID);
    $("#recipient_user_peer_id").val(result.name);
}

//
function fillChannelIDAndFundingPrivKey() {
    let channelID = getChannelID();
    $("#channel_id").val(channelID);
    getFPKByAsync(db, channelID).then(function (result) {
        $("#channel_address_private_key").val(result);
    });
}

//
function fillChannelFundingLastTempKeys() {
    fillChannelIDAndFundingPrivKey();
    let tempPrivKey = getTempPrivKey(TempPrivKey, getChannelID());
    $("#last_temp_address_private_key").val(tempPrivKey);
}

//
function fillTempChannelIDAndFundingPrivKey(msgType) {
    let channelID = getChannelID();
    $("#temporary_channel_id").val(channelID);

    getFPKByAsync(db, channelID).then(function (result) {
        // console.log('FINAL RESULT = ' + result);
        if (msgType === 35) {
            $("#fundee_channel_address_private_key").val(result);
        } else {
            $("#channel_address_private_key").val(result);
        }
    });
}

//
function fillTempAddrKey() {
    let result = genAddressFromMnemonic();
    if (result === '') return;
    $("#temp_address_pub_key").val(result.result.pubkey);
    $("#temp_address_private_key").val(result.result.wif);
    $("#temp_address_pub_key").attr("class", "input input_color");
    $("#temp_address_private_key").attr("class", "input input_color");
    saveAddresses(result);
}

//
function fillCurrTempAddrKey() {
    let result = genAddressFromMnemonic();
    if (result === '') return;
    $("#curr_temp_address_pub_key").val(result.result.pubkey);
    $("#curr_temp_address_private_key").val(result.result.wif);
    $("#curr_temp_address_pub_key").attr("class", "input input_color");
    $("#curr_temp_address_private_key").attr("class", "input input_color");
    saveAddresses(result);
}

//
function fillCurrRsmcTempKey() {
    let result = genAddressFromMnemonic();
    if (result === '') return;
    $("#curr_rsmc_temp_address_pub_key").val(result.result.pubkey);
    $("#curr_rsmc_temp_address_private_key").val(result.result.wif);
    $("#curr_rsmc_temp_address_pub_key").attr("class", "input input_color");
    $("#curr_rsmc_temp_address_private_key").attr("class", "input input_color");
    saveAddresses(result);
}

//
function fillCurrHtlcTempKey() {
    let result = genAddressFromMnemonic();
    if (result === '') return;
    $("#curr_htlc_temp_address_pub_key").val(result.result.pubkey);
    $("#curr_htlc_temp_address_private_key").val(result.result.wif);
    $("#curr_htlc_temp_address_pub_key").attr("class", "input input_color");
    $("#curr_htlc_temp_address_private_key").attr("class", "input input_color");
    saveAddresses(result);
}

//
function fillCurrHtlcHe1bTempKey() {
    let result = genAddressFromMnemonic();
    if (result === '') return;
    $("#curr_htlc_temp_address_for_he1b_pub_key").val(result.result.pubkey);
    $("#curr_htlc_temp_address_for_he1b_private_key").val(result.result.wif);
    $("#curr_htlc_temp_address_for_he1b_pub_key").attr("class", "input input_color");
    $("#curr_htlc_temp_address_for_he1b_private_key").attr("class", "input input_color");
    saveAddresses(result);
}

//
function fillCurrHtlcHt1aTempKey() {
    let result = genAddressFromMnemonic();
    if (result === '') return;
    $("#curr_htlc_temp_address_for_ht1a_pub_key").val(result.result.pubkey);
    $("#curr_htlc_temp_address_for_ht1a_private_key").val(result.result.wif);
    $("#curr_htlc_temp_address_for_ht1a_pub_key").attr("class", "input input_color");
    $("#curr_htlc_temp_address_for_ht1a_private_key").attr("class", "input input_color");
    saveAddresses(result);
}

//
function fillFundingBtcData() {
    let result = getFundingBtcData();
    if (result === '') return;
    $("#from_address").val(result.from_address);
    $("#from_address_private_key").val(result.from_address_private_key);
    $("#to_address").val(getChannelAddress());
    $("#amount").val(result.amount);
    $("#miner_fee").val(result.miner_fee);
}

//
function fillFundingAssetData() {
    let result = getFundingBtcData();
    if (result === '') return;
    $("#from_address").val(result.from_address);
    $("#from_address_private_key").val(result.from_address_private_key);
    $("#to_address").val(getChannelAddress());
}

//
function autoFillValue(arrParams, obj) {

    // Auto fill some values
    let channelID, fundingPrivKey;
    let msgType = Number(obj.getAttribute("type_id"));
    switch (msgType) {
        case enumMsgType.MsgType_HTLC_Invoice_402:
            let date = new Date().toJSON().substr(0, 10).replace('T', ' ');
            $("#expiry_time").val(date);
            $("#expiry_time").attr("type", "date");
            break;

        case enumMsgType.MsgType_SendChannelOpen_32:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            break;

        case enumMsgType.MsgType_SendChannelAccept_33:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            // channelID = getChannelID();
            $("#temporary_channel_id").val(getChannelID());
            break;

        case enumMsgType.MsgType_Core_FundingBTC_2109:
            if (!isLogined) return;  // Not logined
            fillFundingBtcData();
            break;

        case enumMsgType.MsgType_Core_Omni_FundingAsset_2120:
            if (!isLogined) return;  // Not logined
            fillFundingAssetData();
            break;

        case enumMsgType.MsgType_FundingCreate_SendBtcFundingCreated_340:
        case enumMsgType.MsgType_FundingSign_SendBtcSign_350:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            fillTempChannelIDAndFundingPrivKey();

            // tempHash = getTempHash();
            if (msgType === enumMsgType.MsgType_FundingSign_SendBtcSign_350) {
                $("#funding_txid").val(getTempHash());
            } else {
                $("#funding_tx_hex").val(getTempHash());
            }
            break;

        case enumMsgType.MsgType_FundingCreate_SendAssetFundingCreated_34:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            fillTempChannelIDAndFundingPrivKey();
            // tempHash = getTempHash();
            $("#funding_tx_hex").val(getTempHash());
            fillTempAddrKey();
            break;

        case enumMsgType.MsgType_FundingSign_SendAssetFundingSigned_35:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            fillTempChannelIDAndFundingPrivKey(35);
            break;

        case enumMsgType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351:
        case enumMsgType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            fillChannelFundingLastTempKeys();
            if (msgType === enumMsgType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352) {
                // tempHash = getTempHash();
                $("#msg_hash").val(getTempHash());
            }
            fillCurrTempAddrKey();
            break;
            
        case enumMsgType.MsgType_HTLC_FindPath_401:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            break;

        case enumMsgType.MsgType_HTLC_SendAddHTLC_40:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            fillChannelFundingLastTempKeys();
            fillCurrRsmcTempKey();
            fillCurrHtlcTempKey();
            fillCurrHtlcHt1aTempKey();
            break;

        case enumMsgType.MsgType_HTLC_SendAddHTLCSigned_41:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            // tempHash = getTempHash();
            $("#commitment_tx_hash").val(getTempHash());
            fillChannelFundingLastTempKeys();
            fillCurrRsmcTempKey();
            fillCurrHtlcTempKey();
            break;
        
        case enumMsgType.MsgType_HTLC_SendVerifyR_45:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            fillChannelIDAndFundingPrivKey();
            fillCurrHtlcHe1bTempKey();
            break;

        case enumMsgType.MsgType_HTLC_SendSignVerifyR_46:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            fillChannelIDAndFundingPrivKey();
            // tempHash = getTempHash();
            $("#msg_hash").val(getTempHash());
            // let r = getHtlcVerifyR();
            $("#r").val(getHtlcVerifyR());
            break;

        case enumMsgType.MsgType_HTLC_SendRequestCloseCurrTx_49:
        case enumMsgType.MsgType_HTLC_SendCloseSigned_50:
            if (!isLogined) return;  // Not logined
            fillCounterparty();

            if (msgType === enumMsgType.MsgType_HTLC_SendCloseSigned_50) {
                // tempHash = getTempHash();
                $("#msg_hash").val(getTempHash());
            }

            channelID = getChannelID();
            getFPKByAsync(db, channelID).then(function (result) {
                $("#channel_address_private_key").val(result);
            });

            let privkey_1 = getTempPrivKey(RsmcTempPrivKey, channelID);
            $("#last_rsmc_temp_address_private_key").val(privkey_1);

            let privkey_2 = getTempPrivKey(HtlcTempPrivKey, channelID);
            $("#last_htlc_temp_address_private_key").val(privkey_2);

            let privkey_3 = getTempPrivKey(HtlcHtnxTempPrivKey, channelID);
            $("#last_htlc_temp_address_for_htnx_private_key").val(privkey_3);

            fillCurrRsmcTempKey();
            break;
    }
}

// display Approval Checkbox
function displayApprovalCheckbox(content_div, obj, msgType) {

    createElement(content_div, 'text', 'Approval ');
    var element = document.createElement('input');
    switch (msgType) {
        case enumMsgType.MsgType_SendChannelAccept_33:
            element.id = 'checkbox_n33';
            break;
        case enumMsgType.MsgType_FundingSign_SendBtcSign_350:
            element.id = 'checkbox_n3500';
            break;
        // case enumMsgType.MsgType_FundingSign_SendAssetFundingSigned_35:
        //     element.id = 'checkbox_n35';
        //     break;
        case enumMsgType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
            element.id = 'checkbox_n352';
            break;
        // case enumMsgType.MsgType_HTLC_SendAddHTLCSigned_41:
        //     element.id = 'checkbox_n41';
        //     break;
        case enumMsgType.MsgType_SendCloseChannelSign_39:
            element.id = 'checkbox_n39';
            break;
    }

    element.type = 'checkbox';
    element.defaultChecked = true;
    element.setAttribute('onclick', 'clickApproval(this)');
    content_div.append(element);
}

// 
function clickApproval(obj) {
    // console.info('clickApproval checked = ' + obj.checked);
    switch (obj.id) {
        case 'checkbox_n33':
            if (obj.checked) {
                $("#funding_pubkey").show();
                $("#funding_pubkeySel").show();
                $("#funding_pubkeyCre").show();
            } else {
                $("#funding_pubkey").hide();
                $("#funding_pubkeySel").hide();
                $("#funding_pubkeyCre").hide();
            }
            break;

        case 'checkbox_n3500':
            if (obj.checked) {
                $("#channel_address_private_key").show();
                $("#channel_address_private_keyDis").show();
                // $("#funding_txid").show();
                // $("#funding_txidGet").show();
            } else {
                $("#channel_address_private_key").hide();
                $("#channel_address_private_keyDis").hide();
                // $("#funding_txid").hide();
                // $("#funding_txidGet").hide();
            }
            break;

        // case 'checkbox_n35':
        //     if (obj.checked) {
        //         $("#fundee_channel_address_private_key").show();
        //         $("#fundee_channel_address_private_keyDis").show();
        //     } else {
        //         $("#fundee_channel_address_private_key").hide();
        //         $("#fundee_channel_address_private_keyDis").hide();
        //     }
        //     break;

        case 'checkbox_n352':
            if (obj.checked) {
                $("#curr_temp_address_pub_key").show();
                $("#curr_temp_address_pub_keySel").show();
                $("#curr_temp_address_private_key").show();
                $("#curr_temp_address_private_keySel").show();
                $("#last_temp_address_private_key").show();
                $("#last_temp_address_private_keyDis").show();
                $("#channel_address_private_key").show();
                $("#channel_address_private_keyDis").show();
            } else {
                $("#curr_temp_address_pub_key").hide();
                $("#curr_temp_address_pub_keySel").hide();
                $("#curr_temp_address_private_key").hide();
                $("#curr_temp_address_private_keySel").hide();
                $("#last_temp_address_private_key").hide();
                $("#last_temp_address_private_keyDis").hide();
                $("#channel_address_private_key").hide();
                $("#channel_address_private_keyDis").hide();
            }
            break;

        // case 'checkbox_n41':
        //     if (obj.checked) {
        //         $("#curr_rsmc_temp_address_pub_key").show();
        //         $("#curr_rsmc_temp_address_pub_keySel").show();
        //         $("#curr_rsmc_temp_address_private_key").show();
        //         $("#curr_rsmc_temp_address_private_keySel").show();
        //         $("#curr_htlc_temp_address_pub_key").show();
        //         $("#curr_htlc_temp_address_pub_keySel").show();
        //         $("#curr_htlc_temp_address_private_key").show();
        //         $("#curr_htlc_temp_address_private_keySel").show();
        //         $("#last_temp_address_private_key").show();
        //         $("#last_temp_address_private_keyDis").show();
        //         $("#channel_address_private_key").show();
        //         $("#channel_address_private_keyDis").show();
        //     } else {
        //         $("#curr_rsmc_temp_address_pub_key").hide();
        //         $("#curr_rsmc_temp_address_pub_keySel").hide();
        //         $("#curr_rsmc_temp_address_private_key").hide();
        //         $("#curr_rsmc_temp_address_private_keySel").hide();
        //         $("#curr_htlc_temp_address_pub_key").hide();
        //         $("#curr_htlc_temp_address_pub_keySel").hide();
        //         $("#curr_htlc_temp_address_private_key").hide();
        //         $("#curr_htlc_temp_address_private_keySel").hide();
        //         $("#last_temp_address_private_key").hide();
        //         $("#last_temp_address_private_keyDis").hide();
        //         $("#channel_address_private_key").hide();
        //         $("#channel_address_private_keyDis").hide();
        //     }
        //     break;

        case 'checkbox_n39':
            if (obj.checked) {
                $("#request_close_channel_hash").show();
                $("#request_close_channel_hashDis").show();
            } else {
                $("#request_close_channel_hash").hide();
                $("#request_close_channel_hashDis").hide();
            }
            break;
    }
}

//
function showTooltip(content, parent, imgPath) {
    var div_help = document.createElement('div');
    div_help.setAttribute('class', 'wrapper');

    var help = document.createElement('i');
    help.setAttribute('class', 'btn_help fa fa-info-circle');
    div_help.append(help);

    // var help = document.createElement('img');
    // help.setAttribute('class', 'btn_help');
    // help.setAttribute('src', 'doc/tooltip/help.png');
    // help.setAttribute('alt', 'help');
    // div_help.append(help);

    var div_tooltip = document.createElement('div');
    div_tooltip.setAttribute('class', 'tooltip_help');

    var tooltip = document.createElement('label');
    tooltip.innerText = content;
    div_tooltip.append(tooltip);

    if (imgPath) {
        createElement(div_tooltip, 'p');
        let img = document.createElement('img');
        img.setAttribute('src', imgPath);
        div_tooltip.append(img);
    }
    
    div_help.append(div_tooltip);
    parent.append(div_help);
}

// create parameter of each API.
function createParamOfAPI(arrParams, content_div) {

    let input_box;
    
    for (let i = 0; i < arrParams.length; i++) {
        
        let parent = document.createElement('div');
        parent.setAttribute('class', 'parent_div');

        // Show tooltip.
        if (arrParams[i].help) {
            showTooltip(arrParams[i].help, parent, arrParams[i].imgPath);
        }

        let div_other = document.createElement('div');

        // create [param_title] element
        createElement(div_other, 'text', arrParams[i].name + ' : ', 'param');

        // create [input box of param] element
        input_box = document.createElement('input');    
        input_box.id = arrParams[i].name;

        if (arrParams[i].name === 'NodeAddress') {
            input_box.setAttribute('class', 'input_node_url');
        } else {
            input_box.setAttribute('class', 'input');
        }

        div_other.append(input_box);
        createButtonOfParam(arrParams, i, div_other);
        createElement(div_other, 'p');
        parent.append(div_other);
        content_div.append(parent);
    }
}

// create button of parameter
function createButtonOfParam(arrParams, index, content_div) {

    var innerText, invokeFunc;
    var arrButtons = arrParams[index].buttons;

    for (let i = 0; i < arrButtons.length; i++) {
        innerText = arrButtons[i].innerText;
        invokeFunc = arrButtons[i].onclick;

        // create [button] element
        var button = document.createElement('button');
        button.id = arrParams[index].name + innerText.substring(0, 3);
        button.innerText = innerText;
        button.setAttribute('class', 'button button_small');
        button.setAttribute('onclick', invokeFunc);
        content_div.append(button);
    }
}

// 
function createInvokeAPIButton(obj) {
    // get [content] div
    var content_div = $("#name_req_div");

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    createElement(newDiv, 'p');

    // create [Send button] element
    var button = document.createElement('button');
    // button.id = 'send_button';
    button.setAttribute('type_id', obj.getAttribute("type_id"));
    button.setAttribute('class', 'button');
    button.setAttribute('onclick', 'invokeAPIs(this)');
    button.innerText = 'Invoke API';
    newDiv.append(button);
    content_div.append(newDiv);
}

//----------------------------------------------------------------
// 
function displayCustomMode() {
    removeNameReqDiv();
    historyCustomInNewHtml();
}

// 
function displayConnectOBD() {
    removeNameReqDiv();
    createConnectNodeDiv();
    afterConnectOBD();
}

// remove name and request Div
function removeNameReqDiv() {
    $("#name_req_div").remove();
    $("#tracker_div").remove();
    var name_req_div = document.createElement('div');
    name_req_div.id = "name_req_div";
    $("#content").append(name_req_div);
}

// 
function removeInvokeHistoryDiv() {
    $("#invoke_history").remove();
    var div = document.createElement('div');
    div.id = "invoke_history";
    $("#menu").append(div);
}

// 
function removeTrackerDiv() {
    $("#name_req_div").remove();
    $("#tracker_div").remove();
    var div = document.createElement('div');
    div.id = "tracker_div";
    $("#content").append(div);
}

// 
function createConnectNodeDiv(isCustom) {
    // var content_div = $("#name_req_div");

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // create [title] element
    var title = document.createElement('div');
    title.setAttribute('class', 'panelTitle');
    createElement(title, 'h2', 'OBD Node');
    newDiv.append(title);

    // create [input title] element
    createElement(newDiv, 'text', 'Node Address: ');

    // create [input] element
    var nodeAddress = document.createElement('input');
    nodeAddress.id = 'NodeAddress';
    nodeAddress.setAttribute('class', 'input_conn_node');
    nodeAddress.placeholder = 'Please input Node URL.';
    nodeAddress.value = getNewestConnOBD();
    newDiv.append(nodeAddress);

    // create [button] element
    var button = document.createElement('button');
    button.id = 'button_connect';
    button.setAttribute('class', 'button button_small');

    if (isCustom === 'custom') {
        button.setAttribute('onclick', 'connectOBDInCustomMode()');
    } else {
        button.setAttribute('onclick', 'connectOBD()');
    }
    
    button.innerText = 'Connect';
    newDiv.append(button);
    
    $("#name_req_div").append(newDiv);
}

// 
function afterConnectOBD() {
    // already connected
    if (isConnectToOBD === true) {
        changeConnectButtonStatus();
        createElement($("#name_req_div"), 'h3', 'Already connected. ' + 
            'Please refresh the page if you want to connect again.');
    } else {
        displayOBDConnectHistory();
    }
}

// create Div
function createCustomModeDiv() {

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // create [title] element
    var title = document.createElement('div');
    title.setAttribute('class', 'panelTitle');
    createElement(title, 'h2', 'Request');
    newDiv.append(title);

    // create [send button] element
    var btnSend = document.createElement('button');
    btnSend.setAttribute('class', 'button button_request');
    btnSend.setAttribute('onclick', 'sendCustomRequest()');
    btnSend.innerText = 'Send';
    newDiv.append(btnSend);

    // create [clear button] element
    var btnClear = document.createElement('button');
    btnClear.setAttribute('class', 'button button_request button_clear_cq');
    btnClear.setAttribute('onclick', 'clearCustomRequest()');
    btnClear.innerText = 'Clear';
    newDiv.append(btnClear);

    //
    var request = document.createElement('textarea');
    request.id = 'custom_request';
    request.setAttribute('class', 'custom_textarea');
    request.setAttribute('cols', '62');
    request.setAttribute('rows', '20');
    request.placeholder = 'Input custom request infomation. (type protocol)';
    newDiv.append(request);

    $("#name_req_div").append(newDiv);
}

// 
function clearOBDMsg() {
    // Clear array
    arrObdMsg.splice(0, arrObdMsg.length);
    $("#obd_messages").html("");
}

// 
function connectOBD() {
    var nodeAddress = $("#NodeAddress").val();

    if (nodeAddress.trim().length === 0) {
        alert('Please input Node Address.');
        return;
    }

    obdApi.connectToServer(nodeAddress, function(response) {
        console.info('connectOBD - OBD Response = ' + response);

        $("#status").text("Connected");
        $("#status_tooltip").text("Connected to " + nodeAddress);
        isConnectToOBD = true; // already connected.

        createOBDResponseDiv(response, 'connect_node_resp');
        changeConnectButtonStatus();
        saveOBDConnectHistory(nodeAddress);
        $("#history_div").remove();

    }, function(globalResponse) {
        displayOBDMessages(globalResponse);
    });
}

// 
function connectOBDInCustomMode() {
    var nodeAddress = $("#NodeAddress").val();
    if (nodeAddress.trim().length === 0) {
        alert('Please input Node Address.');
        return;
    }

    obdApi.connectToServer(nodeAddress, function(response) {
        console.info('connectOBDInCustomMode - OBD Response = ' + response);
        $("#status").text("Connected");
        $("#status_tooltip").text("Connected to " + nodeAddress);
        changeConnectButtonStatus();
        saveOBDConnectHistory(nodeAddress);
        historyInCustom();
    }, function(globalResponse) {
        displayOBDMessages(globalResponse);
    });
}

//
function changeConnectButtonStatus() {
    var button = $("#button_connect");
    button.text("Disconnect");
    button.attr('class', 'button_small disabled');
    button.attr("disabled", "disabled");
    $("#NodeAddress").attr("class", "input_conn_node disabled");
    $("#NodeAddress").attr("disabled", "disabled");
}

// create OBD Response Div 
function createOBDResponseDiv(response, msgType) {

    $("#newDiv").remove();
    $("#obd_response_div").remove();

    var newDiv = document.createElement('div');
    newDiv.id = "newDiv";
    newDiv.setAttribute('class', 'panelItem');

    var obd_response_div = document.createElement('div');
    obd_response_div.id = "obd_response_div";

    // create [title] element
    var title = document.createElement('div');
    title.setAttribute('class', 'panelTitle');
    createElement(title, 'h2', 'Messages');
    newDiv.append(title);

    newDiv.append(obd_response_div);
    $("#name_req_div").append(newDiv);

    switch (msgType) {
        case 'connect_node_resp':
            var msg = response + '. Please refresh the page if you want to connect again.';
            createElement(obd_response_div, 'p', msg);
            break;
        case enumMsgType.MsgType_Mnemonic_CreateAddress_3000:
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_3001:
            parseData3000_3001(response);
            break;
        case enumMsgType.MsgType_UserLogin_2001:
            parseData2001(response);
            break;
        case enumMsgType.MsgType_p2p_ConnectPeer_2003:
            parseData2003(response);
            break;
        default:
            createElement(obd_response_div, 'p', response);
            break;
    }
}

//----------------------------------------------------------------
// Functions of processing each response from invoke APIs.

// 
function parseData2003(response) {
    var arrData = [
        'Connect success.',
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i], 'responseText');
    }
}

// 
function parseData2001(response) {
    if (isLogined) {
        var arrData = [
            'Status : ' + response,
        ];
    }

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// genAddressFromMnemonic
function parseData3000_3001(response) {
    var arrData = [
        'ADDRESS : ' + response.result.address,
        'INDEX : ' + response.result.index,
        'PUB_KEY : ' + response.result.pubkey,
        'WIF : ' + response.result.wif
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// get a new index of address
function getNewAddrIndex() {

    var addr = JSON.parse(localStorage.getItem(itemAddr));
    // console.info('localStorage KEY  = ' + addr);

    // If has data.
    if (addr) {
        // console.info('HAS DATA');
        for (let i = 0; i < addr.result.length; i++) {
            if ($("#logined").text() === addr.result[i].userID) {
                maxIndex = addr.result[i].data.length - 1;
                newIndex = addr.result[i].data[maxIndex].index + 1;
                return newIndex;
            }
        }

        // A new User ID.
        return 1;

    } else {
        // console.info('FIRST DATA');
        return 1;
    }
}

/**
 * Save channelID to local storage
 * @param channelID
 */
function saveChannelID(channelID) {
    let data = {
        channelID: channelID,
    }
    localStorage.setItem(itemChannelID, JSON.stringify(data));

    // console.log('logined userid == ' + $("#logined").text());
    
    // let resp = JSON.parse(localStorage.getItem(itemChannelID));

    // // If has data.
    // if (resp) {
    //     for (let i = 0; i < resp.result.length; i++) {
    //         if ($("#logined").text() === resp.result[i].userID) {
    //             resp.result[i].channelID = channelID;
    //             localStorage.setItem(itemChannelID, JSON.stringify(resp));
    //             return;
    //         }
    //     }

    //     // A new User ID.
    //     let new_data = {
    //         userID:    $("#logined").text(),
    //         channelID: channelID,
    //     }
    //     resp.result.push(new_data);
    //     localStorage.setItem(itemChannelID, JSON.stringify(resp));

    // } else {
    //     let data = {
    //         result: [{
    //             userID:    $("#logined").text(),
    //             channelID: channelID,
    //         }]
    //     }
    //     localStorage.setItem(itemChannelID, JSON.stringify(data));
    // }
}

/**
 * Get channelID from local storage
 */
function getChannelID() {

    let resp = JSON.parse(localStorage.getItem(itemChannelID));

    // If has data.
    if (resp) {
        return resp.channelID;
    } else {
        return '';
    }

    // let resp = JSON.parse(localStorage.getItem(itemChannelID));

    // // If has data.
    // if (resp) {
    //     for (let i = 0; i < resp.result.length; i++) {
    //         if ($("#logined").text() === resp.result[i].userID) {
    //             return resp.result[i].channelID;
    //         }
    //     }
    //     return '';
    // } else {
    //     return '';
    // }
}

//
function getFundingPrivKeyFromPubKey(pubkey) {

    let addr = JSON.parse(localStorage.getItem(itemAddr));

    // If has data.
    if (addr) {
        // console.info('HAS DATA');
        for (let i = 0; i < addr.result.length; i++) {
            if ($("#logined").text() === addr.result[i].userID) {
                for (let j = 0; j < addr.result[i].data.length; j++) {
                    if (pubkey === addr.result[i].data[j].pubkey) {
                        return addr.result[i].data[j].wif;
                    }
                }
            }
        }
        return '';
    } else {
        return '';
    }
}

/**
 * Save temporary private key to local storage
 * @param saveKey
 * @param channelID
 * @param privkey
 */
function saveTempPrivKey(saveKey, channelID, privkey) {
    
    let addr = JSON.parse(localStorage.getItem(saveKey));

    // If has data.
    if (addr) {
        // console.info('HAS DATA');
        for (let i = 0; i < addr.result.length; i++) {
            if ($("#logined").text() === addr.result[i].userID) {
                for (let j = 0; j < addr.result[i].data.length; j++) {
                    if (channelID === addr.result[i].data[j].channelID) {
                        // update privkey 
                        addr.result[i].data[j].privkey = privkey;
                        localStorage.setItem(saveKey, JSON.stringify(addr));
                        return;
                    }
                }

                // A new channel id
                let new_data = {
                    channelID: channelID,
                    privkey:   privkey
                }
                addr.result[i].data.push(new_data);
                localStorage.setItem(saveKey, JSON.stringify(addr));
                return;
            }
        }

        // A new User ID.
        let new_data = {
            userID:  $("#logined").text(),
            data: [{
                channelID: channelID,
                privkey:   privkey
            }]
        }
        addr.result.push(new_data);
        localStorage.setItem(saveKey, JSON.stringify(addr));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                userID:  $("#logined").text(),
                data: [{
                    channelID: channelID,
                    privkey:   privkey
                }]
            }]
        }
        localStorage.setItem(saveKey, JSON.stringify(data));
    }
}

/**
 * Get temporary private key from local storage
 * @param saveKey
 * @param channelID
 */
function getTempPrivKey(saveKey, channelID) {
    
    let addr = JSON.parse(localStorage.getItem(saveKey));

    // If has data.
    if (addr) {
        // console.info('HAS DATA');
        for (let i = 0; i < addr.result.length; i++) {
            if ($("#logined").text() === addr.result[i].userID) {
                for (let j = 0; j < addr.result[i].data.length; j++) {
                    if (channelID === addr.result[i].data[j].channelID) {
                        return addr.result[i].data[j].privkey;
                    }
                }
            }
        }
        return '';
    } else {
        return '';
    }
}

// Address generated from mnemonic words save to local storage.
function saveAddresses(response) {

    let addr = JSON.parse(localStorage.getItem(itemAddr));

    // If has data.
    if (addr) {
        // console.info('HAS DATA');
        for (let i = 0; i < addr.result.length; i++) {
            if ($("#logined").text() === addr.result[i].userID) {
                // Add new dato to 
                let new_data = {
                    address: response.result.address,
                    index: response.result.index,
                    pubkey: response.result.pubkey,
                    wif: response.result.wif
                }
                addr.result[i].data.push(new_data);
                localStorage.setItem(itemAddr, JSON.stringify(addr));
                return;
            }
        }

        // A new User ID.
        let new_data = {
            userID: $("#logined").text(),
            data: [{
                address: response.result.address,
                index: response.result.index,
                pubkey: response.result.pubkey,
                wif: response.result.wif
            }]
        }
        addr.result.push(new_data);
        localStorage.setItem(itemAddr, JSON.stringify(addr));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                userID: $("#logined").text(),
                data: [{
                    address: response.result.address,
                    index: response.result.index,
                    pubkey: response.result.pubkey,
                    wif: response.result.wif
                }]
            }]
        }
        localStorage.setItem(itemAddr, JSON.stringify(data));
    }
}

// Record full flow channel data.
function channelData(response) {

    var data = {
        channelInfo: channelInfo,
        create_at: response.create_at,
        create_by: response.create_by,
        accept_at: response.accept_at,
        address_a: response.address_a,
        address_b: response.address_b,
        channel_address: response.channel_address,
        temporary_channel_id: response.temporary_channel_id,

        request_close_channel_hash: response.request_close_channel_hash,
        date: new Date().toLocaleString(),
    }

    return data;
}

// Depositing btc record.
function btcData(response, msgType) {
    var btc = {
        from_address: $("#from_address").val(),
        amount: $("#amount").val(),
        hex: response.hex,
        txid: response.txid,
        date: new Date().toLocaleString(),
        msgType: msgType,
    }
    return btc;
}

// transfer (HTLC) record.
function htlcData(response, msgType) {
    var data = {
        channelId: response.channelId,
        amount: response.amount,
        htlcChannelPath: response.htlcChannelPath,
        htlcTxHex: response.htlcTxHex,
        msgHash: response.msgHash,
        rsmcTxHex: response.rsmcTxHex,
        toOtherHex: response.toOtherHex,
        date: new Date().toLocaleString(),
        msgType: msgType,
    }

    return data;
}

//
function updateHtlcData(response, data, msgType) {
    data.msgType = msgType;
    data.date = new Date().toLocaleString();
    // data.msgHash = response.msgHash;
    // data.sender = response.sender;
    // data.approval = response.approval;
}

// transfer (RSMC) record.
function rsmcData(response, msgType) {
    var data = {
        channelId: response.channelId,
        amount: response.amount,
        msgHash: response.msgHash,
        rsmcHex: response.rsmcHex,
        toOtherHex: response.toOtherHex,
        date: new Date().toLocaleString(),
        msgType: msgType,
    }

    return data;
}

//
function updateRsmcData(response, data, msgType) {
    data.msgType = msgType;
    data.date = new Date().toLocaleString();

    // data.amount_to_htlc = response.amount_to_htlc;
    // data.amount_to_counterparty = response.amount_to_counterparty;
    // data.amount_to_rsmc = response.amount_to_rsmc;
    // data.rsmc_multi_address = response.rsmc_multi_address;
    // data.rsmc_txid = response.rsmc_txid;
    // data.send_at = response.send_at;
    // data.sign_at = response.sign_at;
    // data.to_other_txid = response.to_other_txid;
}

// Depositing omni assets record.
function omniAssetData(response, msgType) {
    var omniAsset = {
        from_address: $("#from_address").val(),
        amount: $("#amount").val(),
        property_id: $("#property_id").val(),
        hex: response.hex,
        date: new Date().toLocaleString(),
        msgType: msgType,

        // -34 response
        channel_id: '',
        temporary_channel_id: '',
        funding_omni_hex: '',
        rsmc_temp_address_pub_key: '',
        c1a_rsmc_hex: '',
        
        // -35 response
        approval: '',
        rd_hex: '',
        rsmc_signed_hex: '',
    }

    return omniAsset;
}

// 
function dataConstruct(response, tempChID, msgType) {
    var data;
    if (msgType) {
        data = {
            temporary_channel_id: tempChID,
            userID: $("#logined").text(),
            data: [channelData(response)],
            btc: [btcData(response, msgType)],
            omniAsset: [omniAssetData(response, msgType)],
            transfer: [],
            htlc: [],
        }
    } else {
        data = {
            temporary_channel_id: tempChID,
            userID: $("#logined").text(),
            data: [channelData(response)],
            btc: [],
            omniAsset: [],
            transfer: [],
            htlc: [],
        }
    }

    return data;
}

// 
function saveChannelList(response, channelID, msgType) {
    var chID;
    var list = JSON.parse(localStorage.getItem(itemChannelList));

    if (response.temporary_channel_id) {
        chID = response.temporary_channel_id;
    } else {
        chID = channelID;
    }

    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            if (chID === list.result[i].temporary_channel_id) {
                switch (msgType) {
                    case enumMsgType.MsgType_HTLC_SendAddHTLC_40:
                        list.result[i].htlc.push(htlcData(response, msgType));
                        break;
                    case enumMsgType.MsgType_HTLC_SendAddHTLCSigned_41:
                        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
                            if ($("#request_hash").val() === list.result[i].htlc[i2].msgHash) {
                                updateHtlcData(response, list.result[i].htlc[i2], msgType);
                            }
                        }
                        break;
                    case enumMsgType.MsgType_HTLC_SendVerifyR_45:
                        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
                            if ($("#request_hash").val() === list.result[i].htlc[i2].msgHash) {
                                list.result[i].htlc[i2].r = response.r;
                                list.result[i].htlc[i2].msgHash = response.msgHash;
                                list.result[i].htlc[i2].msgType = msgType;
                                list.result[i].htlc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    case enumMsgType.MsgType_HTLC_SendSignVerifyR_46:
                        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
                            if ($("#request_hash").val() === list.result[i].htlc[i2].msgHash) {
                                list.result[i].htlc[i2].msgHash = response.msgHash;
                                list.result[i].htlc[i2].msgType = msgType;
                                list.result[i].htlc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    case enumMsgType.MsgType_HTLC_SendRequestCloseCurrTx_49:
                        list.result[i].htlc.push(htlcData(response, msgType));
                        break;
                    case enumMsgType.MsgType_HTLC_SendCloseSigned_50:
                        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
                            if ($("#request_hash").val() === list.result[i].htlc[i2].msgHash) {
                                list.result[i].htlc[i2].msgType = msgType;
                                list.result[i].htlc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    case enumMsgType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351:
                        list.result[i].transfer.push(rsmcData(response, msgType));
                        break;
                    case enumMsgType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
                        for (let i2 = 0; i2 < list.result[i].transfer.length; i2++) {
                            if ($("#msg_hash").val() === list.result[i].transfer[i2].msgHash) {
                                updateRsmcData(response, list.result[i].transfer[i2], msgType);
                            }
                        }
                        break;
                    case enumMsgType.MsgType_Core_FundingBTC_2109:
                        list.result[i].btc.push(btcData(response, msgType));
                        break;
                    case enumMsgType.MsgType_FundingCreate_SendBtcFundingCreated_340:
                        for (let i2 = 0; i2 < list.result[i].btc.length; i2++) {
                            if (response.funding_txid === list.result[i].btc[i2].txid) {
                                list.result[i].btc[i2].msgType = msgType;
                                list.result[i].btc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    case enumMsgType.MsgType_FundingSign_SendBtcSign_350:
                        for (let i2 = 0; i2 < list.result[i].btc.length; i2++) {
                            if ($("#funding_txid").val() === list.result[i].btc[i2].txid) {
                                // list.result[i].btc[i2].txid = response.txid;
                                // list.result[i].btc[i2].hex  = response.tx_hash;
                                list.result[i].btc[i2].msgType = msgType;
                                list.result[i].btc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    case enumMsgType.MsgType_Core_Omni_FundingAsset_2120:
                        list.result[i].omniAsset.push(omniAssetData(response, msgType));
                        break;
                    case enumMsgType.MsgType_FundingCreate_SendAssetFundingCreated_34:
                        for (let i2 = 0; i2 < list.result[i].omniAsset.length; i2++) {
                            if ($("#funding_tx_hex").val() === list.result[i].omniAsset[i2].hex) {
                                list.result[i].temporary_channel_id = response.channel_id;
                                updateOmniAssetData(response, list.result[i].omniAsset[i2], msgType);
                            }
                        }
                        break;
                    case enumMsgType.MsgType_FundingSign_SendAssetFundingSigned_35:
                        for (let i2 = 0; i2 < list.result[i].omniAsset.length; i2++) {
                            if ($("#channel_id").val() === list.result[i].omniAsset[i2].channel_id) {
                                updateOmniAssetData(response, list.result[i].omniAsset[i2], msgType);
                            }
                        }
                        break;
                    case enumMsgType.MsgType_SendCloseChannelRequest_38:
                        if (list.result[i].data.length > 2) {
                            list.result[i].data[2].request_close_channel_hash = response.request_close_channel_hash;
                            list.result[i].data[2].date = new Date().toLocaleString();
                        } else {
                            list.result[i].data.push(channelData(response));
                        }
                        break;
                    case enumMsgType.MsgType_SendCloseChannelSign_39:
                        list.result[i].data.push(channelData(response));
                        break;
                    default:
                        list.result[i].data.push(channelData(response));
                        break;
                }

                localStorage.setItem(itemChannelList, JSON.stringify(list));
                return;
            }
        }

        // A new 
        list.result.push(dataConstruct(response, chID, msgType));
        localStorage.setItem(itemChannelList, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [dataConstruct(response, chID, msgType)]
        }
        localStorage.setItem(itemChannelList, JSON.stringify(data));
    }
}

//
function updateOmniAssetData(response, data, msgType) {
    data.msgType = msgType;
    data.date = new Date().toLocaleString();
    data.channel_id = response.channel_id;

    if (msgType === enumMsgType.MsgType_FundingCreate_SendAssetFundingCreated_34) {
        data.funding_omni_hex = response.funding_omni_hex;
        data.c1a_rsmc_hex = response.c1a_rsmc_hex;
        data.rsmc_temp_address_pub_key = response.rsmc_temp_address_pub_key;
    } else if (msgType === enumMsgType.MsgType_FundingSign_SendAssetFundingSigned_35) {
        data.approval = response.approval;
        data.rd_hex = response.rd_hex;
        data.rsmc_signed_hex = response.rsmc_signed_hex;
    }
}

// mnemonic words generated with signUp api save to local storage.
function saveMnemonic(response) {

    var mnemonic = JSON.parse(sessionStorage.getItem(itemMnemonic));
    // var mnemonic = JSON.parse(localStorage.getItem(saveMnemonic));

    // If has data.
    if (mnemonic) {
        // console.info('HAS DATA');
        let new_data = {
            mnemonic: response,
        }
        mnemonic.result.push(new_data);
        sessionStorage.setItem(itemMnemonic, JSON.stringify(mnemonic));
        // localStorage.setItem(saveMnemonic, JSON.stringify(mnemonic));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                mnemonic: response
            }]
        }
        sessionStorage.setItem(itemMnemonic, JSON.stringify(data));
        // localStorage.setItem(saveMnemonic, JSON.stringify(data));
    }
}

// 
function getNewestConnOBD() {
    var nodeAddress;
    var list = JSON.parse(localStorage.getItem(itemOBDList));
    // If has data
    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            if (list.result[i].newest === 'yes') {
                nodeAddress = list.result[i].name;
                return nodeAddress;
            }
        }
        return nodeAddress = 'ws://127.0.0.1:60020/ws';
    } else { // NO LOCAL STORAGE DATA YET.
        return nodeAddress = 'ws://127.0.0.1:60020/ws';
    }
}

// List of OBD node that have interacted
function saveOBDConnectHistory(name) {

    var list = JSON.parse(localStorage.getItem(itemOBDList));

    // If has data.
    if (list) {
        // console.info('HAS DATA');
        for (let i = 0; i < list.result.length; i++) {
            list.result[i].newest = '';
        }

        for (let i = 0; i < list.result.length; i++) {
            if (list.result[i].name === name) {
                list.result[i].newest = 'yes';
                localStorage.setItem(itemOBDList, JSON.stringify(list));
                return;
            }
        }

        let new_data = {
            name:  name,
            newest: 'yes'
        }
        list.result.push(new_data);
        localStorage.setItem(itemOBDList, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                name:  name,
                newest: 'yes'
            }]
        }
        localStorage.setItem(itemOBDList, JSON.stringify(data));
    }
}

// Save APIs invoked history in custom mode.
function saveInvokeHistory(name, content) {

    var list = JSON.parse(localStorage.getItem(invokeHistory));

    // If has data.
    if (list) {
        // console.info('HAS DATA');
        // If is same data, delete original and push to array again.
        for (let i = 0; i < list.result.length; i++) {
            if (list.result[i].name === name && list.result[i].content === content) {
                list.result.splice(i, 1);
            }
        }

        let new_data = {
            name:    name,
            content: content,
        }
        list.result.push(new_data);
        localStorage.setItem(invokeHistory, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                name:    name,
                content: content,
            }]
        }
        localStorage.setItem(invokeHistory, JSON.stringify(data));
    }
}

//
function getLastCounterparty() {

    let data = JSON.parse(localStorage.getItem(itemCounterparties));

    // If has data.
    if (data) {
        // console.info('HAS DATA');
        for (let i = 0; i < data.result.length; i++) {
            if ($("#logined").text() === data.result[i].userID) {
                let lastIndex = data.result[i].data.length - 1;
                return data.result[i].data[lastIndex];
            }
        }
        return '';
    } else {
        return '';
    }
}

// 
function saveFundingBtcData(info) {

    let resp = JSON.parse(localStorage.getItem(itemFundingBtcData));

    // If has data.
    if (resp) {
        // console.info('HAS DATA');
        for (let i = 0; i < resp.result.length; i++) {
            if ($("#logined").text() === resp.result[i].userID) {
                // Remove
                resp.result.splice(i, 1);
            }
        }

        // A new User ID.
        let new_data = {
            userID:                   $("#logined").text(),
            from_address:             info.from_address,
            from_address_private_key: info.from_address_private_key,
            to_address:               info.to_address,
            amount:                   info.amount,
            miner_fee:                info.miner_fee
        }
        resp.result.push(new_data);
        localStorage.setItem(itemFundingBtcData, JSON.stringify(resp));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                userID:                   $("#logined").text(),
                from_address:             info.from_address,
                from_address_private_key: info.from_address_private_key,
                to_address:               info.to_address,
                amount:                   info.amount,
                miner_fee:                info.miner_fee
            }]
        }
        localStorage.setItem(itemFundingBtcData, JSON.stringify(data));
    }
}

//
function getFundingBtcData() {

    let resp = JSON.parse(localStorage.getItem(itemFundingBtcData));

    // If has data.
    if (resp) {
        for (let i = 0; i < resp.result.length; i++) {
            if ($("#logined").text() === resp.result[i].userID) {
                return resp.result[i];
            }
        }
        return '';
    } else {
        return '';
    }
}

/**
 * save Channel ddress to localStorage
 * @param address
 */
function saveChannelAddress(address) {
    let data = {
        address: address
    }
    localStorage.setItem(itemChannelAddress, JSON.stringify(data));
}

/**
 * get Channel ddress from localStorage
 */
function getChannelAddress() {

    let resp = JSON.parse(localStorage.getItem(itemChannelAddress));

    // If has data.
    if (resp) {
        return resp.address;
    } else {
        return '';
    }
}

/**
 * get temp hash from:
 * 1) fundingBTC -102109 return
 * 2) BTCFundingCreated type ( -100340 ) return
 * 3) FundingAsset type ( -102120 ) return
 * 4) RSMCCTxCreated type ( -100351 ) return
 * 5) HTLCCreated type ( -100040 ) return
 */
function getTempHash() {

    let resp = JSON.parse(localStorage.getItem(itemTempHash));

    // If has data.
    if (resp) {
        return resp.hex;
    } else {
        return '';
    }
}

/**
 * save temp hash from:
 * @param hex
 * 1) fundingBTC -102109 return
 * 2) BTCFundingCreated type ( -100340 ) return
 * 3) FundingAsset type ( -102120 ) return
 * 4) RSMCCTxCreated type ( -100351 ) return
 * 5) HTLCCreated type ( -100040 ) return
 */
function saveTempHash(hex) {

    // let resp = JSON.parse(localStorage.getItem(itemTempHash));
    let data = {
        hex: hex
    }
    localStorage.setItem(itemTempHash, JSON.stringify(data));

    // If has data.
    // if (resp) {
    //     resp.hex = hex;
    //     localStorage.setItem(itemTempHash, JSON.stringify(resp));
    // } else {
    //     let data = {
    //         hex: hex
    //     }
    //     localStorage.setItem(itemTempHash, JSON.stringify(data));
    // }
}


// get funding_tx_hex from FundingAsset type ( -102120 ) return
// function getTempHash() {

//     let resp = JSON.parse(localStorage.getItem(itemFundingAssetHex));

//     // If has data.
//     if (resp) {
//         return resp.hex;
//     } else {
//         return '';
//     }
// }

// save funding_tx_hex from FundingAsset type ( -102120 ) return
// function saveTempHash(hex) {

//     let resp = JSON.parse(localStorage.getItem(itemFundingAssetHex));

//     // If has data.
//     if (resp) {
//         resp.hex = hex;
//         localStorage.setItem(itemFundingAssetHex, JSON.stringify(resp));
//     } else {
//         let data = {
//             hex: hex
//         }
//         localStorage.setItem(itemFundingAssetHex, JSON.stringify(data));
//     }
// }

// get funding_txid from BTCFundingCreated type ( -100340 ) return
// function getTempHash() {

//     let resp = JSON.parse(localStorage.getItem(itemFundingBtcTxid));

//     // If has data.
//     if (resp) {
//         return resp.txid;
//     } else {
//         return '';
//     }
// }

// save funding_txid from BTCFundingCreated type ( -100340 ) return
// function saveTempHash(txid) {

//     let resp = JSON.parse(localStorage.getItem(itemFundingBtcTxid));

//     // If has data.
//     if (resp) {
//         resp.txid = txid;
//         localStorage.setItem(itemFundingBtcTxid, JSON.stringify(resp));
//     } else {
//         let data = {
//             txid: txid
//         }
//         localStorage.setItem(itemFundingBtcTxid, JSON.stringify(data));
//     }
// }

// save msg_hash from RSMCCTxCreated type ( -100351 ) return
// function saveTempHash(msgHash) {

//     let resp = JSON.parse(localStorage.getItem(itemRsmcMsgHash));

//     // If has data.
//     if (resp) {
//         resp.msgHash = msgHash;
//         localStorage.setItem(itemRsmcMsgHash, JSON.stringify(resp));
//     } else {
//         let data = {
//             msgHash: msgHash
//         }
//         localStorage.setItem(itemRsmcMsgHash, JSON.stringify(data));
//     }
// }

// get msg_hash from RSMCCTxCreated type ( -100351 ) return
// function getTempHash() {

//     let resp = JSON.parse(localStorage.getItem(itemRsmcMsgHash));

//     // If has data.
//     if (resp) {
//         return resp.msgHash;
//     } else {
//         return '';
//     }
// }

// save commitment_tx_hash from HTLCCreated type ( -100040 ) return
// function saveTempHash(commitment_tx_hash) {

//     let resp = JSON.parse(localStorage.getItem(itemHtlcRequestHash));

//     // If has data.
//     if (resp) {
//         resp.commitment_tx_hash = commitment_tx_hash;
//         localStorage.setItem(itemHtlcRequestHash, JSON.stringify(resp));
//     } else {
//         let data = {
//             commitment_tx_hash: commitment_tx_hash
//         }
//         localStorage.setItem(itemHtlcRequestHash, JSON.stringify(data));
//     }
// }

// get commitment_tx_hash from HTLCCreated type ( -100040 ) return
// function getTempHash() {

//     let resp = JSON.parse(localStorage.getItem(itemHtlcRequestHash));

//     // If has data.
//     if (resp) {
//         return resp.commitment_tx_hash;
//     } else {
//         return '';
//     }
// }

// save r from HTLCSendVerifyR type ( -100045 ) return
function saveHtlcVerifyR(r) {

    // let resp = JSON.parse(localStorage.getItem(itemHtlcVerifyR));

    let data = {
        r: r
    }
    localStorage.setItem(itemHtlcVerifyR, JSON.stringify(data));

    // If has data.
    // if (resp) {
    //     resp.r = r;
    //     localStorage.setItem(itemHtlcVerifyR, JSON.stringify(resp));
    // } else {
    //     let data = {
    //         r: r
    //     }
    //     localStorage.setItem(itemHtlcVerifyR, JSON.stringify(data));
    // }
}

// get r from HTLCSendVerifyR type ( -100045 ) return
function getHtlcVerifyR() {

    let resp = JSON.parse(localStorage.getItem(itemHtlcVerifyR));

    // If has data.
    if (resp) {
        return resp.r;
    } else {
        return '';
    }
}

// List of Counterparties who have interacted
function saveCounterparties(name, p2pID) {

    var list = JSON.parse(localStorage.getItem(itemCounterparties));

    // If has data.
    if (list) {
        // console.info('HAS DATA');
        for (let i = 0; i < list.result.length; i++) {
            // same userID
            if ($("#logined").text() === list.result[i].userID) {
                for (let i2 = 0; i2 < list.result[i].data.length; i2++) {
                    // if UserPeerID is same, then NodePeerID is updated.
                    if (list.result[i].data[i2].name === name) {
                        list.result[i].data[i2].p2pID = p2pID;
                        localStorage.setItem(itemCounterparties, JSON.stringify(list));
                        return;
                    }
                }

                // Add a new data to the userID
                let new_data = {
                    name:  name,
                    p2pID: p2pID
                }
                list.result[i].data.push(new_data);
                localStorage.setItem(itemCounterparties, JSON.stringify(list));
                return;
            }
        }

        // A new User ID.
        let new_data = {
            userID: $("#logined").text(),
            data: [{
                name:  name,
                p2pID: p2pID
            }]
        }
        list.result.push(new_data);
        localStorage.setItem(itemCounterparties, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                userID: $("#logined").text(),
                data: [{
                    name:  name,
                    p2pID: p2pID
                }]
            }]
        }
        localStorage.setItem(itemCounterparties, JSON.stringify(data));
    }
}

//----------------------------------------------------------------
// Functions of buttons.

// get balance of btc and omni assets of an address.
function getBalance(strAddr) {

    let result;

    // OBD API
    obdApi.getBtcBalanceByAddress(strAddr, function(e) {
        console.info('getBtcBalance - OBD Response = ' + JSON.stringify(e));
        result = JSON.stringify(e);
        result = result.replace("\"", "").replace("\"", "");
        result = parseFloat(result);
        result = 'Balance : ' + result + ' BTC ';
        $("#" + strAddr).text(result);
    });

    // for omni assets
    obdApi.omniGetAllBalancesForAddress(strAddr, function(e) {
        console.info('-102112 omniGetAllBalancesForAddress = ' + JSON.stringify(e));

        if (e != "") {
            for (let i = 0; i < e.length; i++) {
                result += ' *** ' + parseFloat(e[i].balance) + ' ' + e[i].name +
                    ' (Property ID: ' + e[i].propertyid + ')';
            }

            $("#" + strAddr).text(result);
        }
    });
}

// Generate new mnemonic words.
function autoCreateMnemonic() {
    // Generate mnemonic by local js library.
    var mnemonic = btctool.generateMnemonic(128);
    $("#mnemonic").val(mnemonic);
    saveMnemonic(mnemonic);
}

// Generate a new pub key of an address.
function autoCreateFundingPubkey(param) {
    // Generate address by local js library.
    var result = genAddressFromMnemonic();
    if (result === '') return;

    switch (param) {
        case -102109:
        case -102120:
            $("#from_address").val(result.result.address);
            $("#from_address_private_key").val(result.result.wif);
            break;
        case -100034:
            $("#temp_address_pub_key").val(result.result.pubkey);
            $("#temp_address_private_key").val(result.result.wif);
            break;
        case -100351:
        case -100352:
            $("#curr_temp_address_pub_key").val(result.result.pubkey);
            $("#curr_temp_address_private_key").val(result.result.wif);
            break;
        case -401: // first data for type -40
        case -411: // first data for type -41
        case -49:
        case -50:
            $("#curr_rsmc_temp_address_pub_key").val(result.result.pubkey);
            $("#curr_rsmc_temp_address_private_key").val(result.result.wif);
            break;
        case -402: // second data for type -40
        case -412: // second data for type -41
            $("#curr_htlc_temp_address_pub_key").val(result.result.pubkey);
            $("#curr_htlc_temp_address_private_key").val(result.result.wif);
            break;
        case -403: // third data for type -40
            $("#curr_htlc_temp_address_for_ht1a_pub_key").val(result.result.pubkey);
            $("#curr_htlc_temp_address_for_ht1a_private_key").val(result.result.wif);
            break;
        case -45:
            $("#curr_htlc_temp_address_for_he1b_pub_key").val(result.result.pubkey);
            $("#curr_htlc_temp_address_for_he1b_private_key").val(result.result.wif);
            break;
        default:
            $("#funding_pubkey").val(result.result.pubkey);
            break;
    }

    saveAddresses(result);
}

// auto Calculation Miner Fee
function autoCalcMinerFee() {
    $("#miner_fee").val('0.00001');
}

//----------------------------------------------------------------
// Functions of display User Data.
function displayUserData(obj, param) {
    removeNameReqDiv();
    createApiNameDiv(obj);

    switch (obj.id) {
        case 'MnemonicWords':
            displayMnemonic();
            break;
        case 'MyAddresses':
            displayAddresses(param);
            break;
        case 'Counterparties':
            displayCounterparties(param);
            break;
        case 'ChannelList':
            displayChannelCreation(param);
            break;
    }
}

//
function displayMnemonic() {
    // get [name_req_div] div
    var parent = $("#name_req_div");
    var mnemonic = JSON.parse(sessionStorage.getItem(itemMnemonic));
    // var mnemonic = JSON.parse(localStorage.getItem(saveMnemonic));

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // If has data
    if (mnemonic) {
        for (let i = 0; i < mnemonic.result.length; i++) {
            createElement(newDiv, 'h4', 'NO. ' + (i + 1));
            createElement(newDiv, 'text', mnemonic.result[i].mnemonic, 'responseText');
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createElement(newDiv, 'h3', 'NO DATA YET. YOU CAN CREATE ONE WITH [signUp].');
    }

    parent.append(newDiv);
}

//
function displayAddresses(param) {
    let userID = $("#logined").text();
    let parent = $("#name_req_div");
    let newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    if (param === inNewHtml) { // New page
        var status = JSON.parse(localStorage.getItem(itemGoWhere));
        if (!status.isLogined) { // Not login.
            createElement(newDiv, 'h3', 'NOT LOGINED.');
            parent.append(newDiv);
            return;
        } else {
            userID = status.userID;
        }

    } else {
        if (!isLogined) { // Not login.
            createElement(newDiv, 'h3', 'NOT LOGINED.');
            parent.append(newDiv);
            return;
        }
    }

    var arrData;
    var addr = JSON.parse(localStorage.getItem(itemAddr));

    // If has data
    if (addr) {
        for (let i = 0; i < addr.result.length; i++) {
            if (userID === addr.result[i].userID) {
                // var bigText = 'User ID : ' + addr.result[i].userID;
                // createElement(newDiv, 'text', bigText, 'bigText');
                // createElement(newDiv, 'h2', 'Address List', 'responseText');

                for (let i2 = 0; i2 < addr.result[i].data.length; i2++) {
                    createElement(newDiv, 'h3', 'NO. ' + (i2 + 1), 'responseText');

                    // Get balance of an address.
                    var strAddr = addr.result[i].data[i2].address;
                    createBalanceElement(newDiv, strAddr);

                    arrData = [
                        'Address : ' + addr.result[i].data[i2].address,
                        'Index : ' + addr.result[i].data[i2].index,
                        'PubKey : ' + addr.result[i].data[i2].pubkey,
                        'WIF : ' + addr.result[i].data[i2].wif
                    ];

                    for (let i3 = 0; i3 < arrData.length; i3++) {
                        var point   = arrData[i3].indexOf(':') + 1;
                        var title   = arrData[i3].substring(0, point);
                        var content = arrData[i3].substring(point);
                        createElement(newDiv, 'text', title);
                        createElement(newDiv, 'text', content, 'responseText');
                        createElement(newDiv, 'p');
                    }
                }

                parent.append(newDiv);
                return;
            }
        }

        // The user has not create address yet.
        createElement(newDiv, 'h3', 'NO DATA YET.');
        parent.append(newDiv);

    } else { // NO LOCAL STORAGE DATA YET.
        createElement(newDiv, 'h3', 'NO DATA YET.');
        parent.append(newDiv);
    }
}

//
function createBalanceElement(parent, strAddr) {
    // create [text] element
    var title = document.createElement('text');
    title.id = strAddr;
    title.innerText = 'Balance : ';
    parent.append(title);

    // create [button] element
    var button = document.createElement('button');
    button.innerText = 'Get Balance';
    var clickFunc = "getBalance('" + strAddr + "')";
    button.setAttribute('class', 'button button_small');
    button.setAttribute('onclick', clickFunc);
    parent.append(button);

    createElement(parent, 'p');
}

// List of Counterparties who have interacted
function displayCounterparties(param) {
    let userID = $("#logined").text();
    let arrData;
    let parent = $("#name_req_div");
    let list   = JSON.parse(localStorage.getItem(itemCounterparties));
    let newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    if (param === inNewHtml) { // New page
        var status = JSON.parse(localStorage.getItem(itemGoWhere));
        if (!status.isLogined) { // Not login.
            createElement(newDiv, 'h3', 'NOT LOGINED.');
            parent.append(newDiv);
            return;
        } else {
            userID = status.userID;
        }

    } else {
        if (!isLogined) { // Not login.
            createElement(newDiv, 'h3', 'NOT LOGINED.');
            parent.append(newDiv);
            return;
        }
    }

    // If has data
    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            if (userID === list.result[i].userID) {
                for (let i2 = 0; i2 < list.result[i].data.length; i2++) {
                    createElement(newDiv, 'h3', 'NO. ' + (i2 + 1), 'responseText');
                    arrData = [
                        'NodePeerID : ' + list.result[i].data[i2].p2pID,
                        'UserPeerID : ' + list.result[i].data[i2].name,
                    ];

                    for (let i3 = 0; i3 < arrData.length; i3++) {
                        var point   = arrData[i3].indexOf(':') + 1;
                        var title   = arrData[i3].substring(0, point);
                        var content = arrData[i3].substring(point);
                        createElement(newDiv, 'text', title);
                        createElement(newDiv, 'text', content, 'responseText');
                        createElement(newDiv, 'p');
                    }
                }

                parent.append(newDiv);
                return;
            }
        }

        // The user has not counterparty yet.
        createElement(newDiv, 'h3', 'NO DATA YET.');
        parent.append(newDiv);

    } else { // NO LOCAL STORAGE DATA YET.
        createElement(newDiv, 'h3', 'NO DATA YET.');
        parent.append(newDiv);
    }
}

// List of OBD node that have interacted
function displayOBDConnectHistory() {

    var item;
    var parent = $("#name_req_div");
    var list = JSON.parse(localStorage.getItem(itemOBDList));

    // $("#history_div").remove();
    var newDiv = document.createElement('div');
    newDiv.id = "history_div";
    newDiv.setAttribute('class', 'panelItem');

    createElement(newDiv, 'h3', 'Connection History');

    // If has data
    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            // createElement(newDiv, 'h4', 'NO. ' + (i + 1));
            item = document.createElement('a');
            item.href = '#';
            item.innerText = list.result[i].name;
            item.setAttribute('onclick', 'clickConnectionHistory(this)');
            // item.setAttribute('class', 'url');
            newDiv.append(item);
            createElement(newDiv, 'p');
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createElement(newDiv, 'h4', 'NO CONNECTION HISTORY.');
    }

    parent.append(newDiv);
}

// List of OBD connection history in custom mode.
function connectionHistoryInCustom() {
    var item, del;
    var parent = $("#invoke_history");
    var list   = JSON.parse(localStorage.getItem(itemOBDList));

    createElement(parent, 'h3', 'Connection History');

    // create [button] element
    var button = document.createElement('button');
    button.setAttribute('class', 'button button_clear_history');
    button.setAttribute('onclick', 'clearConnectionHistory()');
    button.innerText = 'Clear';
    parent.append(button);

    createElement(parent, 'p');

    // If has data
    if (list) {
        for (let i = list.result.length - 1; i >= 0; i--) {
            // Delete button
            del = document.createElement('text');
            del.innerText = 'X';
            del.setAttribute('onclick', 'deleteOneConnectionHistory(this)');
            del.setAttribute('class', 'url url_red');
            del.setAttribute('index', i);
            parent.append(del);

            // item name
            item = document.createElement('a');
            item.href = '#';
            item.innerText = list.result[i].name;
            item.setAttribute('onclick', 'clickConnectionHistory(this)');
            item.setAttribute('class', 'url url_conn_history');
            parent.append(item);

            createElement(parent, 'p');
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createElement(parent, 'h4', 'No connection history.');
    }
}

// Data history in custom mode.
function historyInCustom() {
    removeInvokeHistoryDiv();
    connectionHistoryInCustom();
    apiInvokeHistoryInCustom();
}

// List of APIs invoked history in custom mode.
function apiInvokeHistoryInCustom() {
    var item, del;
    var parent = $("#invoke_history");
    var list   = JSON.parse(localStorage.getItem(invokeHistory));

    createElement(parent, 'h3', 'APIs History');

    // create [button] element
    var button = document.createElement('button');
    button.setAttribute('class', 'button button_clear_history');
    button.setAttribute('onclick', 'clearInvokeHistory()');
    button.innerText = 'Clear';
    parent.append(button);

    createElement(parent, 'p');
    
    // If has data
    if (list) {
        // console.info('has data');
        for (let i = list.result.length - 1; i >= 0; i--) {
            // Delete button
            del = document.createElement('text');
            del.innerText = 'X';
            del.setAttribute('onclick', 'deleteOneInvokeHistory(this)');
            del.setAttribute('class', 'url url_red');
            del.setAttribute('index', i);
            parent.append(del);

            // item name
            item = document.createElement('a');
            item.href = '#';
            item.innerText = list.result[i].name;
            item.setAttribute('onclick', 'clickInvokeHistory(this)');
            item.setAttribute('content', list.result[i].content);
            item.setAttribute('class', 'url url_blue');
            parent.append(item);

            createElement(parent, 'p');
        }
    } else { // NO LOCAL STORAGE DATA YET.
        // console.info('no data');
        createElement(parent, 'h4', 'No APIs history.');
    }
}

// 
function clearInvokeHistory(obj) {
    localStorage.removeItem(invokeHistory);
    historyInCustom();
}

// 
function clearConnectionHistory(obj) {
    localStorage.removeItem(itemOBDList);
    historyInCustom();
}

// 
function deleteOneInvokeHistory(obj) {
    var list = JSON.parse(localStorage.getItem(invokeHistory));
    list.result.splice(obj.getAttribute("index"), 1);
    if (list.result.length === 0) { // no item
        localStorage.removeItem(invokeHistory);
    } else {
        localStorage.setItem(invokeHistory, JSON.stringify(list));
    }
    historyInCustom();
}

// 
function deleteOneConnectionHistory(obj) {
    var list = JSON.parse(localStorage.getItem(itemOBDList));
    list.result.splice(obj.getAttribute("index"), 1);
    if (list.result.length === 0) { // no item
        localStorage.removeItem(itemOBDList);
    } else {
        localStorage.setItem(itemOBDList, JSON.stringify(list));
    }
    historyInCustom();
}

//
function clearCustomRequest() {
    $("#custom_request").val("");
}

//
function sendCustomRequest() {

    var custom_request  = $("#custom_request").val().trim();

    try {
        var list = JSON.parse(custom_request);
    } catch (error) {
        alert("Wrong JSON format!");
        return;
    }

    var type    = list.type;
    var saveVal = 'type : ' + type;

    // OBD API
    obdApi.sendJsonData(custom_request, Number(type), function(e) {
        console.info('sendCustomRequest - OBD Response = ' + JSON.stringify(e));
        saveInvokeHistory(saveVal, custom_request);
        historyInCustom();

        // Display user id on screen top.
        if (Number(type) === -102001) {  // Login func
            $('#cm_logined').text(e.userPeerId);
        }

        //
        obdApi.removeEvent(Number(type));
    });
}

//
function clickConnectionHistory(obj) {
    $("#NodeAddress").val(obj.innerText);
}

//
function clickInvokeHistory(obj) {
    $("#custom_request").val(obj.getAttribute("content"));
}

// List of channel creation process records.
function displayChannelCreation(param) {
    // get [name_req_div] div
    var parent = $("#name_req_div");

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    /*
    if (param === inNewHtml) {
        var status = JSON.parse(localStorage.getItem(saveGoWhere));
        if (!status.isLogined) { // Not login.
            createElement(parent, 'text', 'NOT LOGINED.');
            return;
        } else {
            userID = status.userID;
        }
        
    } else {
        if (!isLogined) { // Not login.
            createElement(parent, 'text', 'NOT LOGINED.');
            return;
        }
    }
    */

    var list = JSON.parse(localStorage.getItem(itemChannelList));

    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            // createElement(parent, 'h4', 'NO. ' + (i + 1) + 
            //     ' - Temp Channel ID is: ' + list.result[i].temporary_channel_id);
            createElement(newDiv, 'h2', 'NO. ' + (i + 1), 'responseText');

            // Display channel id in creation process.
            channelID(newDiv, list, i);

            // Display channel info.
            partChannelInfo(newDiv, list, i)

            // Display depositing btc record.
            btcRecord(newDiv, list, i);

            // Display depositing omni asset record.
            omniAssetRecord(newDiv, list, i);

            // Display RSMC - transfer in channel.
            rsmcRecord(newDiv, list, i);

            // Display HTLC - transfer in channel.
            htlcRecord(newDiv, list, i);
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createElement(newDiv, 'h3', 'NO DATA YET.');
    }

    parent.append(newDiv);
}

// Display channel id in creation process.
function channelID(parent, list, i) {
    // var msgType;
    try {
        var msgType = list.result[i].omniAsset[0].msgType;
    } catch (error) {}

    if (msgType === enumMsgType.MsgType_FundingSign_SendAssetFundingSigned_35) {
        createElement(parent, 'text', 'DONE - Channel ID : ');
    } else {
        createElement(parent, 'text', 'TEMP - Channel ID : ');
    }

    createElement(parent, 'p', list.result[i].temporary_channel_id, 'responseText');
}

// Display channel info.
function partChannelInfo(parent, list, i) {

    var arrData;

    for (let i2 = 0; i2 < list.result[i].data.length; i2++) {
        var title = list.result[i].data[i2].channelInfo;
        var point   = title.indexOf('-');
        var title2  = title.substring(0, point);
        var content = title.substring(point + 1);
        createElement(parent, 'p', '-----------------------------------------------');
        createElement(parent, 'text', title2);
        createElement(parent, 'p', content, 'responseText');

        // Construct data will be displayed.
        if (title.substring(0, 6) === 'LAUNCH') {
            arrData = [
                'temporary_channel_id : ' + list.result[i].data[i2].temporary_channel_id,
            ];
        } else if (title.substring(0, 3) === 'N38') {
            arrData = [
                'request_close_channel_hash : ' + list.result[i].data[i2].request_close_channel_hash,
                'date : ' + list.result[i].data[i2].date,
            ];
        } else if (title.substring(0, 3) === 'N39') {
            arrData = [
                'The channel is closed.',
                'date : ' + list.result[i].data[i2].date,
            ];
        } else {
            arrData = [
                'channel_address : ' + list.result[i].data[i2].channel_address,
                'temporary_channel_id : ' + list.result[i].data[i2].temporary_channel_id,
                'create_at : ' + list.result[i].data[i2].create_at,
                'create_by : ' + list.result[i].data[i2].create_by,
                'accept_at : ' + list.result[i].data[i2].accept_at,
                'address_a : ' + list.result[i].data[i2].address_a,
                'address_b : ' + list.result[i].data[i2].address_b,
            ];
        }

        for (let i3 = 0; i3 < arrData.length; i3++) {
            var point   = arrData[i3].indexOf(':') + 1;
            var title   = arrData[i3].substring(0, point);
            var content = arrData[i3].substring(point);
            createElement(parent, 'text', title);
            createElement(parent, 'p', content, 'responseText');
        }
    }
}

// Display depositing btc record.
function btcRecord(parent, list, i) {

    var arrData;

    if (list.result[i].btc[0]) {
        createElement(parent, 'p', '-----------------------------------------------');
        createElement(parent, 'h3', 'DEPOSITING - BTC Record', 'responseText');

        for (let i2 = 0; i2 < list.result[i].btc.length; i2++) {
            createElement(parent, 'br');
            createElement(parent, 'text', 'NO. ' + (i2 + 1));

            var status;
            switch (list.result[i].btc[i2].msgType) {
                case enumMsgType.MsgType_Core_FundingBTC_2109:
                    status = 'Precharge (1009)';
                    break;
                case enumMsgType.MsgType_FundingCreate_SendBtcFundingCreated_340:
                    status = 'Noticed (-3400)';
                    break;
                case enumMsgType.MsgType_FundingSign_SendBtcSign_350:
                    status = 'Confirmed (-3500)';
                    break;
                default:
                    break;
            }

            createElement(parent, 'text', ' -- ' + status);
            createElement(parent, 'text', ' -- ' + list.result[i].btc[i2].date);
            createElement(parent, 'br');
            createElement(parent, 'p', '---------------------------------------------');

            arrData = [
                'from_address : ' + list.result[i].btc[i2].from_address,
                'amount : ' + list.result[i].btc[i2].amount,
                'txid : ' + list.result[i].btc[i2].txid,
                'hex : ' + list.result[i].btc[i2].hex,
            ];

            for (let i3 = 0; i3 < arrData.length; i3++) {
                var point   = arrData[i3].indexOf(':') + 1;
                var title   = arrData[i3].substring(0, point);
                var content = arrData[i3].substring(point);
                createElement(parent, 'text', title);
                createElement(parent, 'p', content, 'responseText');
            }
        }
    }
}

// Display depositing omni asset record.
function omniAssetRecord(parent, list, i) {

    var arrData;

    if (list.result[i].omniAsset[0]) {
        createElement(parent, 'p', '-----------------------------------------------');
        createElement(parent, 'h3', 'DEPOSITING - Omni Asset Record', 'responseText');

        for (let i2 = 0; i2 < list.result[i].omniAsset.length; i2++) {
            var status;
            switch (list.result[i].omniAsset[i2].msgType) {
                case enumMsgType.MsgType_Core_Omni_FundingAsset_2120:
                    status = 'Precharge (2001)';
                    break;
                case enumMsgType.MsgType_FundingCreate_SendAssetFundingCreated_34:
                    status = 'Noticed (-34)';
                    break;
                case enumMsgType.MsgType_FundingSign_SendAssetFundingSigned_35:
                    status = 'Confirmed (-35)';
                    break;
            }

            createElement(parent, 'text', ' -- ' + status);
            createElement(parent, 'text', ' -- ' + list.result[i].omniAsset[i2].date);
            createElement(parent, 'br');
            createElement(parent, 'p', '---------------------------------------------');

            arrData = [
                'from_address : ' + list.result[i].omniAsset[i2].from_address,
                'amount : ' + list.result[i].omniAsset[i2].amount,
                'property_id : ' + list.result[i].omniAsset[i2].property_id,
                'hex : ' + list.result[i].omniAsset[i2].hex,

                '(-34) Response : ----------------------',
                'channel_id : ' + list.result[i].omniAsset[i2].channel_id,
                'funding_omni_hex : ' + list.result[i].omniAsset[i2].funding_omni_hex,
                'c1a_rsmc_hex : ' + list.result[i].omniAsset[i2].c1a_rsmc_hex,
                'rsmc_temp_address_pub_key : ' + list.result[i].omniAsset[i2].rsmc_temp_address_pub_key,
                
                '(-35) Response : ----------------------',
                'approval : ' + list.result[i].omniAsset[i2].approval,
                'rd_hex : ' + list.result[i].omniAsset[i2].rd_hex,
                'rsmc_signed_hex : ' + list.result[i].omniAsset[i2].rsmc_signed_hex,
            ];

            for (let i3 = 0; i3 < arrData.length; i3++) {
                var point   = arrData[i3].indexOf(':') + 1;
                var title   = arrData[i3].substring(0, point);
                var content = arrData[i3].substring(point);
                createElement(parent, 'text', title);
                createElement(parent, 'p', content, 'responseText');
            }
        }
    }
}

// Display RSMC - transfer in channel.
function rsmcRecord(parent, list, i) {

    var arrData;

    if (list.result[i].transfer[0]) {
        createElement(parent, 'p', '-----------------------------------------------');
        createElement(parent, 'h3', 'RSMC - transfer in channel', 'responseText');

        for (let i2 = 0; i2 < list.result[i].transfer.length; i2++) {
            createElement(parent, 'br');
            createElement(parent, 'text', 'NO. ' + (i2 + 1));

            var status;
            switch (list.result[i].transfer[i2].msgType) {
                case enumMsgType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351:
                    status = 'Pre-transfer (-351)';
                    break;
                case enumMsgType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
                    status = 'Done transfer (-352)';
                    break;
            }

            createElement(parent, 'text', ' -- ' + status);
            createElement(parent, 'text', ' -- ' + list.result[i].transfer[i2].date);
            createElement(parent, 'br');
            createElement(parent, 'p', '---------------------------------------------');

            arrData = [
                'channelId : ' + list.result[i].transfer[i2].channelId,
                'amount : ' + list.result[i].transfer[i2].amount,
                'msgHash : ' + list.result[i].transfer[i2].msgHash,
                // 'currTempAddressPubKey : ' + list.result[i].transfer[i2].currTempAddressPubKey,
                // 'lastTempAddressPrivateKey : ' + list.result[i].transfer[i2].lastTempAddressPrivateKey,
                'rsmcHex : ' + list.result[i].transfer[i2].rsmcHex,
                'toOtherHex : ' + list.result[i].transfer[i2].toOtherHex,
            ];

            for (let i3 = 0; i3 < arrData.length; i3++) {
                var point   = arrData[i3].indexOf(':') + 1;
                var title   = arrData[i3].substring(0, point);
                var content = arrData[i3].substring(point);
                createElement(parent, 'text', title);
                createElement(parent, 'p', content, 'responseText');
            }
        }
    }
}

// Display HTLC - transfer in channel.
function htlcRecord(parent, list, i) {

    var arrData;

    if (list.result[i].htlc[0]) {
        createElement(parent, 'p', '-----------------------------------------------');
        createElement(parent, 'h3', 'HTLC - transfer in channel', 'responseText');

        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
            createElement(parent, 'br');
            createElement(parent, 'text', 'NO. ' + (i2 + 1));

            var status;
            switch (list.result[i].htlc[i2].msgType) {
                case enumMsgType.MsgType_HTLC_SendAddHTLC_40:
                    status = 'HTLC-Created (-40)';
                    break;
                case enumMsgType.MsgType_HTLC_SendAddHTLCSigned_41:
                    status = 'HTLC-Signed (-41)';
                    break;
                case enumMsgType.MsgType_HTLC_SendVerifyR_45:
                    status = 'Send R (-45)';
                    break;
                case enumMsgType.MsgType_HTLC_SendSignVerifyR_46:
                    status = 'Verify R (-46)';
                    break;
                case enumMsgType.MsgType_HTLC_SendRequestCloseCurrTx_49:
                    status = 'Request Close (-49)';
                    break;
                case enumMsgType.MsgType_HTLC_SendCloseSigned_50:
                    status = 'Closed (-50)';
                    break;
            }

            createElement(parent, 'text', ' -- ' + status);
            createElement(parent, 'text', ' -- ' + list.result[i].htlc[i2].date);
            createElement(parent, 'br');
            createElement(parent, 'p', '---------------------------------------------');

            switch (list.result[i].htlc[i2].msgType) {
                case enumMsgType.MsgType_HTLC_SendRequestCloseCurrTx_49:
                case enumMsgType.MsgType_HTLC_SendCloseSigned_50:
                    arrData = [
                        'channel_id : ' + list.result[i].htlc[i2].channel_id,
                        'create_at : ' + list.result[i].htlc[i2].create_at,
                        'create_by : ' + list.result[i].htlc[i2].create_by,
                        'curr_state : ' + list.result[i].htlc[i2].curr_state,
                        'request_hash : ' + list.result[i].htlc[i2].request_hash,
                    ];
                    break;

                default:
                    arrData = [
                        'channelId : ' + list.result[i].htlc[i2].channelId,
                        'amount : ' + list.result[i].htlc[i2].amount,
                        'htlcChannelPath : ' + list.result[i].htlc[i2].htlcChannelPath,
                        'htlcTxHex : ' + list.result[i].htlc[i2].htlcTxHex,
                        'msgHash : ' + list.result[i].htlc[i2].msgHash,
                        'rsmcTxHex : ' + list.result[i].htlc[i2].rsmcTxHex,
                        'toOtherHex : ' + list.result[i].htlc[i2].toOtherHex,

                        // 'h : ' + list.result[i].htlc[i2].h,
                        // 'r : ' + list.result[i].htlc[i2].r,
                        // 'request_hash : ' + list.result[i].htlc[i2].request_hash,
                        // 'property_id : ' + list.result[i].htlc[i2].property_id,
                        // 'memo : ' + list.result[i].htlc[i2].memo,
                        // 'curr_state : ' + list.result[i].htlc[i2].curr_state,
                        // 'sender : ' + list.result[i].htlc[i2].sender,
                        // 'approval : ' + list.result[i].htlc[i2].approval,
                    ];
                    break;
            }


            for (let i3 = 0; i3 < arrData.length; i3++) {
                var point   = arrData[i3].indexOf(':') + 1;
                var title   = arrData[i3].substring(0, point);
                var content = arrData[i3].substring(point);
                createElement(parent, 'text', title);
                createElement(parent, 'p', content, 'responseText');
            }
        }
    }
}

//----------------------------------------------------------------
// Functions of Common Util.

// create html elements
function createElement(parent, elementName, myInnerText, css, elementID) {

    let element = document.createElement(elementName);

    if (myInnerText) {
        element.innerText = myInnerText;
    }

    if (css) {
        element.setAttribute('class', css);
    }

    if (elementID) {
        element.id = elementID;
    }

    parent.append(element);
}

//
function displayUserDataInNewHtml(goWhere) {
    saveGoWhere(goWhere);
    window.open('userData.html', 'data', 'height=600, width=800, top=150, ' +
        'left=300, toolbar=no, menubar=no, scrollbars=no, resizable=no, ' +
        'location=no, status=no');
}

//
function historyCustomInNewHtml() {
    window.open('customMode.html');
}

// 
function openLogPage() {
    // Send params to new page
    let user_id = $("#logined").text();
    let params  = { "user_id": user_id };
    window["params"] = params;
    window.open('log.html');
}

// Show complete log of OBD messages in log page.
function showLog() {
    // Receive params to new page
    let receive = window.opener["params"];
    let user_id = receive["user_id"];
    $("#log_page_logined").text(user_id);

    console.log('Sent user_id = ' + user_id);

    // Read log data from IndexedDB
    openDBAndShowData(user_id);
}

//
function saveGoWhere(goWhere) {
    let data = {
        goWhere:   goWhere,
        isLogined: isLogined,
        userID:    $("#logined").text()
    }
    localStorage.setItem(itemGoWhere, JSON.stringify(data));
}

// Bitcoin Testnet Faucet
function openTestnetFaucet() {
    window.open('https://testnet-faucet.mempool.co/');
}

//
function jsonFormat(json) {

    json = json.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');

    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

//
function getTrackerData(getWhat, pageNum, pageSize) {

    let strURL = 'http://62.234.216.108:60060/api/common/' + getWhat + '?pageNum=' + 
                pageNum + '&pageSize=' + pageSize;

    $.ajax({
        url: strURL,
        type: "GET",
        success: function(result) {
            console.log(JSON.stringify(result));
            tableData(getWhat, result);
        },
        error: function(error) {
            console.log('ERROR IS : ' + JSON.stringify(error));
        }
    })
}

//
function tableData(getWhat, result) {
    console.info('getWhat = ' + getWhat);
    console.info('total count = ' + result.totalCount);

    removeTrackerDiv();

    // table
    let tracker_div = $("#tracker_div");
    let table = document.createElement('table');
    table.id = 'tracker';
    tracker_div.append(table);

    // head
    createElement(table, 'tr');
    createElement(table, 'th', 'NO', 'col_1_width');
    switch (getWhat) {
        case 'getObdNodes':
            createElement(table, 'th', 'online', 'col_2_width');
            createElement(table, 'th', 'node_id');
            createElement(table, 'th', 'p2p_address');
            createElement(table, 'th', 'login_ip', 'col_3_width');
            createElement(table, 'th', 'login_time', 'col_4_width');
            createElement(table, 'th', 'offline_time', 'col_4_width');
            break;

        case 'getUsers':
            createElement(table, 'th', 'online', 'col_2_width');
            createElement(table, 'th', 'obd_node_id');
            createElement(table, 'th', 'user_id');
            createElement(table, 'th', 'offline_time', 'col_4_width');
            break;
            
        case 'getChannels':
            // createElement(table, 'th', 'obd_node_a');
            // createElement(table, 'th', 'obd_node_b');
            createElement(table, 'th', 'channel_id');
            createElement(table, 'th', 'property_id', 'col_4_width');
            // createElement(table, 'th', 'curr_state', 'col_2_width');
            // createElement(table, 'th', 'user_a');
            // createElement(table, 'th', 'user_b');
            createElement(table, 'th', 'balance_a', 'col_4_width');
            createElement(table, 'th', 'balance_b', 'col_4_width');
            // createElement(table, 'th', 'create_time', 'col_4_width');
            break;
    }
    

    // row
    let iNum = result.totalCount - result.data[0].id;

    for (let i = 0; i < result.data.length; i++) {
        if (i % 2 != 0) {
            let tr2 = document.createElement('tr');
            tr2.setAttribute('class', 'alt');
            table.append(tr2);
            createElement(tr2, 'td', i + 1 + iNum);

            switch (getWhat) {
                case 'getObdNodes':
                    createElement(tr2, 'td', String(result.data[i].is_online));
                    createElement(tr2, 'td', result.data[i].node_id);
                    createElement(tr2, 'td', result.data[i].p2p_address);
                    createElement(tr2, 'td', result.data[i].latest_login_ip);
                    createElement(tr2, 'td', formatTime(result.data[i].latest_login_at));
                    createElement(tr2, 'td', formatTime(result.data[i].latest_offline_at));
                    break;
        
                case 'getUsers':
                    createElement(tr2, 'td', String(result.data[i].is_online));
                    createElement(tr2, 'td', result.data[i].obd_node_id);
                    createElement(tr2, 'td', result.data[i].user_id);
                    createElement(tr2, 'td', formatTime(result.data[i].offline_at));
                    break;
        
                case 'getChannels':
                    // createElement(tr2, 'td', result.data[i].obd_node_ida);
                    // createElement(tr2, 'td', result.data[i].obd_node_idb);
                    createElement(tr2, 'td', result.data[i].channel_id);
                    createElement(tr2, 'td', result.data[i].property_id);
                    // createElement(tr2, 'td', result.data[i].curr_state);
                    // createElement(tr2, 'td', result.data[i].peer_ida);
                    // createElement(tr2, 'td', result.data[i].peer_idb);
                    createElement(tr2, 'td', result.data[i].amount_a);
                    createElement(tr2, 'td', result.data[i].amount_b);
                    // createElement(tr2, 'td', result.data[i].create_at);
                    break;
            }

        } else {
            createElement(table, 'tr');
            createElement(table, 'td', i + 1 + iNum);

            switch (getWhat) {
                case 'getObdNodes':
                    createElement(table, 'td', String(result.data[i].is_online));
                    createElement(table, 'td', result.data[i].node_id);
                    createElement(table, 'td', result.data[i].p2p_address);
                    createElement(table, 'td', result.data[i].latest_login_ip);
                    createElement(table, 'td', formatTime(result.data[i].latest_login_at));
                    createElement(table, 'td', formatTime(result.data[i].latest_offline_at));
                    break;
        
                case 'getUsers':
                    createElement(table, 'td', String(result.data[i].is_online));
                    createElement(table, 'td', result.data[i].obd_node_id);
                    createElement(table, 'td', result.data[i].user_id);
                    createElement(table, 'td', formatTime(result.data[i].offline_at));
                    break;
        
                case 'getChannels':
                    // createElement(table, 'td', result.data[i].obd_node_ida);
                    // createElement(table, 'td', result.data[i].obd_node_idb);
                    createElement(table, 'td', result.data[i].channel_id);
                    createElement(table, 'td', result.data[i].property_id);
                    // createElement(table, 'td', result.data[i].curr_state);
                    // createElement(table, 'td', result.data[i].peer_ida);
                    // createElement(table, 'td', result.data[i].peer_idb);
                    createElement(table, 'td', result.data[i].amount_a);
                    createElement(table, 'td', result.data[i].amount_b);
                    // createElement(table, 'td', result.data[i].create_at);
                    break;
            }
        }
    }

    // total count
    let bottom_div = document.createElement('div');
    bottom_div.setAttribute('class', 'bottom_div');
    tracker_div.append(bottom_div);

    createElement(bottom_div, 'label', 'Total Count : ' + result.totalCount, 'left_margin');
    createElement(bottom_div, 'label', 'Page ' + result.pageNum + ' / ' + result.totalPage, 'left_margin');

    // previous page
    let butPrevious = document.createElement('button');
    butPrevious.setAttribute('getWhat', getWhat);
    butPrevious.setAttribute('pageNum', result.pageNum);
    // butPrevious.setAttribute('totalPage', result.totalPage);
    butPrevious.setAttribute('class', 'button button_small');
    butPrevious.setAttribute('onclick', 'previousPage(this)');
    butPrevious.innerText = 'Prev Page';
    bottom_div.append(butPrevious);

    if (result.pageNum === 1) {
        butPrevious.setAttribute('class', 'button_small disabled');
        butPrevious.setAttribute("disabled", "disabled");
    }

    // next page
    let butNext = document.createElement('button');
    butNext.setAttribute('getWhat', getWhat);
    butNext.setAttribute('pageNum', result.pageNum);
    // butNext.setAttribute('totalPage', result.totalPage);
    butNext.setAttribute('class', 'button button_small');
    butNext.setAttribute('onclick', 'nextPage(this)');
    butNext.innerText = 'Next Page';
    bottom_div.append(butNext);

    if (result.pageNum === result.totalPage) {
        butNext.setAttribute('class', 'button_small disabled');
        butNext.setAttribute("disabled", "disabled");
    }
}

//
function previousPage(obj) {
    let getWhat = obj.getAttribute("getWhat");
    let previousPage = Number(obj.getAttribute("pageNum")) - 1;
    console.info('previousPage = ' + previousPage);
    getTrackerData(getWhat, previousPage, 10);
}

//
function nextPage(obj) {
    let getWhat = obj.getAttribute("getWhat");
    let nextPage = Number(obj.getAttribute("pageNum")) + 1;
    console.info('nextPage = ' + nextPage);
    getTrackerData(getWhat, nextPage, 10);
}

//
function formatTime(time) {
    // console.info(time);
    if (time === '0001-01-01T00:00:00Z') {  // Null time
        return '';
    }

    return time.substring(0, 19).replace('T', ' ');
}

//
function autoMode(obj) {
    if (obj.checked) {
        isAutoMode = true;
    } else {
        isAutoMode = false;
    }
    console.info('CLICK - isAutoMode = ' + isAutoMode);
}

/**
 * MsgType_GetMnemonic_2004
 * This is a OBD JS API. Will be moved to obdapi.js file.
 */
function genMnemonic() {
    return btctool.generateMnemonic(128);
}

/**
 * MsgType_Mnemonic_CreateAddress_3000
 * genAddressFromMnemonic by local js library
 * This is a OBD JS API. Will be moved to obdapi.js file.
 */
function genAddressFromMnemonic() {
    if (!isLogined) { // Not logined
        alert('Please login first.');
        return '';
    }

    let newIndex = getNewAddrIndex();
    // console.info('mnemonicWithLogined = ' + mnemonicWithLogined);
    // console.info('addr index = ' + newIndex);

    // True: testnet  False: mainnet
    let result = btctool.generateWalletInfo(mnemonicWithLogined, newIndex, true);
    console.info('local addr data = ' + JSON.stringify(result));

    return result;
}

/**
 * MsgType_Mnemonic_GetAddressByIndex_3001
 * get Address Info by local js library
 * This is a OBD JS API. Will be moved to obdapi.js file.
 */
function getAddressInfo() {
    if (!isLogined) { // Not logined
        alert('Please login first.');
        return '';
    }

    var index = $("#index").val();
    console.info('index = ' + index);

    try {
        // True: testnet  False: mainnet
        var result = btctool.generateWalletInfo(mnemonicWithLogined, index, true);
        console.info('local addr data = ' + JSON.stringify(result));
    } catch (error) {
        alert('Please input a valid index of address.');
        return '';
    }

    if (!result.status) { // status = false
        alert('Please input a valid index of address.');
        return '';
    }

    return result;
}

/**
 * Open IndexedDB
 */
function openDB() {

    let request = window.indexedDB.open('log');
    
    request.onerror = function (e) {
        console.log('DB open error!');
    };

    request.onsuccess = function (e) {
        db = request.result;
        console.log('DB open success!');
    };

    // Create table and index
    request.onupgradeneeded = function (e) {
        db = e.target.result;

        let os1;
        if (!db.objectStoreNames.contains(tbGlobalMsg)) {
            os1 = db.createObjectStore(tbGlobalMsg, { autoIncrement: true });
            os1.createIndex('user_id', 'user_id', { unique: false });
        }

        let os2;
        if (!db.objectStoreNames.contains(tbFundingPrivkey)) {
            os2 = db.createObjectStore(tbFundingPrivkey, { autoIncrement: true });
            os2.createIndex('channel_id', 'channel_id', { unique: false });
        }
    }
}

/**
 * Open a new IndexedDB instance for log page.
 * And read data belong one user.
 */
function openDBAndShowData(user_id) {

    let request = window.indexedDB.open('log');
    
    request.onerror = function (e) {
        console.log('LOG PAGE DB open error!');
    };

    request.onsuccess = function (e) {
        console.log('LOG PAGE DB open success!');
        readData(request.result, user_id);
    };
}

/**
 * Add a record to table GlobalMsg
 */
function addData(user_id, msg) {

    let request = db.transaction([tbGlobalMsg], 'readwrite')
        .objectStore(tbGlobalMsg)
        .add({ user_id: user_id, msg: msg });
  
    request.onsuccess = function (e) {
        console.log('Data write success.');
    };
  
    request.onerror = function (e) {
        console.log('Data write false.');
    }
}

/**
 * Add a record to table Funding private key
 */
function addData2TbFundingPrivkey(user_id, channel_id, privkey) {

    let request = db.transaction([tbFundingPrivkey], 'readwrite')
        .objectStore(tbFundingPrivkey)
        .add({ user_id: user_id, channel_id: channel_id, privkey: privkey });
  
    request.onsuccess = function (e) {
        console.log('Data write success.');
    };
  
    request.onerror = function (e) {
        console.log('Data write false.');
    }
}

/**
 * Read data belong one user from IndexedDB
 */
function readData(logDB, user_id) {

    let showMsg     = '';
    let data        = [];
    let transaction = logDB.transaction([tbGlobalMsg], 'readonly');
    let store       = transaction.objectStore(tbGlobalMsg);
    let index       = store.index('user_id');
    let request     = index.get(user_id);
        request     = index.openCursor(user_id);

    request.onerror = function(e) {
        console.log('Read data false.');
    };

    request.onsuccess = function (e) {
        let result = e.target.result;
        if (result) {
            // console.log('msg: ' + result.value.msg);
            data.push(result.value.msg);
            result.continue();
        } else {
            console.log('No More Data.');
            for (let i = data.length - 1; i >= 0; i--) {
                showMsg += data[i] + '\n\n\n\n';
            }
            // console.log('showMsg data = ' + showMsg);
            $("#log").html(showMsg);
        }
    }
}

/**
 * Read data from table funding private key
 */
function readDataFromTbFPK(logDB, channel_id) {

    return new Promise((resolve, reject) => {

        let data        = [];
        let transaction = logDB.transaction([tbFundingPrivkey], 'readonly');
        let store       = transaction.objectStore(tbFundingPrivkey);
        let index       = store.index('channel_id');
        let request     = index.get(channel_id);
            request     = index.openCursor(channel_id);

        request.onerror = function(e) {
            console.log('Read data false.');
            reject('Read data false.');
        }

        request.onsuccess = function (e) {
            let result = e.target.result;
            if (result) {
                // console.log('user_id: ' + result.value.user_id);
                // console.log('privkey: ' + result.value.privkey);
                let value = {
                    user_id: result.value.user_id,
                    privkey: result.value.privkey
                };

                data.push(value);
                result.continue();
            } else {
                console.log('No More Data.');
                for (let i = 0; i < data.length; i++) {
                    if ($("#logined").text() === data[i].user_id) {
                        console.log('FINAL privkey: ' + data[i].privkey);
                        // return data[i].privkey;
                        resolve(data[i].privkey);
                    }
                }
            }
        }

    })
}

/**
 * Async read data from table funding private key
 */
async function getFPKByAsync(logDB, channel_id){
    let privkey = await readDataFromTbFPK(logDB, channel_id);
    return privkey;
}
