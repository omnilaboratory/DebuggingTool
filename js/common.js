// var obdApi = new ObdApi();
var enumMsgType = new MessageType();

// Save connection status.
var isConnectToOBD = false;

// Save login status.
var isLogined = false;

// save OBD messages
var obdMessages = '';
var arrObdMsg = [];

// mnemonic using for login
var mnemonicWithLogined = '';

//
const kNewHtml = 'new_html';

//
const kChannelList = 'channel_list';

//
const kOBDList = 'obd_list';

//
const kInvokeHistory = 'invoke_history';

//
const kGoWhere = 'go_where';

// the info save to local storage [ChannelList].
var channelInfo;

/**
 * open / close auto mode.
 */
// var isAutoMode = false;

// Get name of saveGoWhere variable.
// function getSaveName() {
//     return kGoWhere;
// }

// -102001 logIn.
function sdkLogIn() {

    let mnemonic = $("#mnemonic").val();

    // SDK API
    logIn(mnemonic, function(e) {
        console.info('SDK: -102001 logIn = ' + JSON.stringify(e));

        // SDK API: Register event needed for listening.
        registerEvent(true);

        // If already logined, then return.
        if (isLogined) {
            console.info('-102001 isLogined = ' + isLogined);
            return;
        }

        // a new loginning.
        mnemonicWithLogined = mnemonic;
        $("#logined").text(e.userPeerId);
        isLogined = true;

        // SDK API: Save mnemonic
        saveMnemonic(e.userPeerId, mnemonic);

        displaySentMessage102001(mnemonic);
    });
}

/**
 * Display the sent message in the message box and save it to the log file
 * @param msgSend Sent message
 */
function displaySentMessage(msgSend) {

    let msgTime = new Date().toLocaleString();
    msgSend     = JSON.stringify(msgSend, null, 2);
    msgSend     = jsonFormat(msgSend);

    let newMsg = '------------------------------------';
    newMsg += '\n\n' + 'Sent -  ' + msgTime;
    newMsg += '\n\n' + '------------------------------------';
    newMsg += '\n\n' + msgSend;
    addData($("#logined").text(), newMsg);

    // Add sent message in messages box at right side
    arrObdMsg.push('\n');
    arrObdMsg.push(newMsg);

    let showMsg = '';
    for (let i = arrObdMsg.length - 1; i >= 0; i--) {
        showMsg += arrObdMsg[i] + '\n\n';
    }
    
    $("#obd_messages").html(showMsg);
}

// -102003 sdkConnectP2PPeer API at local.
function sdkConnectP2PPeer(msgType) {
    
    let info                 = new P2PPeer();
    info.remote_node_address = $("#remote_node_address").val();

    // SDK API
    connectPeer(info, function(e) {
        console.info('-102003 connectP2PPeer = ' + JSON.stringify(e));
        createOBDResponseDiv(e, msgType);
    });
}

// -100032 openChannel API at local.
function sdkOpenChannel() {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();

    let info            = new OpenChannelInfo();
    info.funding_pubkey = $("#funding_pubkey").val();
    info.is_private     = $("#checkbox_n32").prop("checked");

    // SDK API
    openChannel($("#logined").text(), nodeID, userID, info);
    displaySentMessage100032(nodeID, userID, info);
}

// -100033 accept Channel API at local.
function sdkAcceptChannel() {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();

    let info                  = new AcceptChannelInfo();
    info.temporary_channel_id = $("#temporary_channel_id").val();
    info.funding_pubkey       = $("#funding_pubkey").val();
    info.approval             = $("#checkbox_n33").prop("checked");

    // SDK API
    acceptChannel($("#logined").text(), nodeID, userID, info);
    displaySentMessage100033(nodeID, userID, info);
}

/** 
 * -100045 forwardR API at local.
 */
function sdkForwardR() {

    let nodeID      = $("#recipient_node_peer_id").val();
    let userID      = $("#recipient_user_peer_id").val();

    let info        = new ForwardRInfo();
    info.channel_id = $("#channel_id").val();
    info.r          = $("#r").val();
    info.channel_address_private_key                 = $("#channel_address_private_key").val();
    info.curr_htlc_temp_address_for_he1b_pub_key     = $("#curr_htlc_temp_address_for_he1b_pub_key").val();
    info.curr_htlc_temp_address_for_he1b_private_key = $("#curr_htlc_temp_address_for_he1b_private_key").val();

    // SDK API
    forwardR($("#logined").text(), nodeID, userID, info);
    displaySentMessage100045(nodeID, userID, info);
}

/** 
 * -100046 signR API at local.
 */
function sdkSignR() {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                         = new SignRInfo();
    info.channel_id                  = $("#channel_id").val();
    info.r                           = $("#r").val();
    info.msg_hash                    = $("#msg_hash").val();
    info.channel_address_private_key = $("#channel_address_private_key").val();

    // SDK API
    signR(nodeID, userID, info);
    displaySentMessage100046(nodeID, userID, info);
}

/** 
 * -100049 closeHTLC API at local.
 */
function sdkCloseHTLC() {

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

    // SDK API
    closeHTLC($("#logined").text(), nodeID, userID, info);
    displaySentMessage100049(nodeID, userID, info);
}

/** 
 * -100050 closeHTLCSigned API at local.
 */
function sdkCloseHTLCSigned() {

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

    // SDK API
    closeHTLCSigned($("#logined").text(), nodeID, userID, info);
    displaySentMessage100050(nodeID, userID, info);
}

/** 
 * -100080 atomicSwap API at local.
 */
function sdkAtomicSwap() {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();

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

    // SDK API
    atomicSwap(nodeID, userID, info);
    displaySentMessage100080(nodeID, userID, info);
}

/** 
 * -100081 atomicSwapAccepted API at local.
 */
function sdkAcceptSwap() {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();

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

    // SDK API
    acceptSwap(nodeID, userID, info);
    displaySentMessage100081(nodeID, userID, info);
}

/** 
 * -100038 closeChannel API at local.
 */
function sdkCloseChannel() {

    let nodeID     = $("#recipient_node_peer_id").val();
    let userID     = $("#recipient_user_peer_id").val();
    let channel_id = $("#channel_id").val();

    // OBD API
    closeChannel(nodeID, userID, channel_id);
    displaySentMessage100038(nodeID, userID, channel_id);
}

/** 
 * -100039 closeChannelSigned API at local.
 */
function sdkCloseChannelSigned() {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                        = new CloseChannelSign();
    info.channel_id                 = $("#channel_id").val();
    info.request_close_channel_hash = $("#request_close_channel_hash").val();
    info.approval                   = $("#checkbox_n39").prop("checked");

    // OBD API
    closeChannelSigned(nodeID, userID, info);
    displaySentMessage100039(nodeID, userID, info);
}

/** 
 * MsgType_Core_Omni_Getbalance_2112
 * getAllBalancesForAddress API at local.
 */
function sdkGetAllBalancesForAddress() {
    let address = $("#address").val();
    // SDK API
    getAllBalancesForAddress(address);
}

/** 
 * -102113 issueFixedAmount API at local.
 */
function sdkIssueFixedAmount() {

    let info            = new IssueFixedAmountInfo();
    info.from_address   = $("#from_address").val();
    info.name           = $("#name").val();
    info.ecosystem      = Number($("#ecosystem").val());
    info.divisible_type = Number($("#divisible_type").val());
    info.data           = $("#data").val();
    info.amount         = Number($("#amount").val());

    // SDK API
    issueFixedAmount(info);
}

/** 
 * -102114 issueManagedAmout API at local.
 */
function sdkIssueManagedAmout() {

    let info            = new IssueManagedAmoutInfo();
    info.from_address   = $("#from_address").val();
    info.name           = $("#name").val();
    info.ecosystem      = Number($("#ecosystem").val());
    info.divisible_type = Number($("#divisible_type").val());
    info.data           = $("#data").val();

    // SDK API
    issueManagedAmout(info);
}

/** 
 * -102115 sendGrant API at local.
 */
function sdkSendGrant() {

    let info          = new OmniSendGrant();
    info.from_address = $("#from_address").val();
    info.property_id  = Number($("#property_id").val());
    info.amount       = Number($("#amount").val());
    info.memo         = $("#memo").val();

    // SDK API
    sendGrant(info);
}

/** 
 * -102116 sendRevoke API at local.
 */
function sdkSendRevoke() {

    let info          = new OmniSendRevoke();
    info.from_address = $("#from_address").val();
    info.property_id  = Number($("#property_id").val());
    info.amount       = Number($("#amount").val());
    info.memo         = $("#memo").val();

    // SDK API
    sendRevoke(info);
}

/** 
 * -102117 listProperties API at local.
 */
function sdkListProperties() {
    // SDK API
    listProperties();
}

/** 
 * -102118 getTransaction API at local.
 */
function sdkGetTransaction() {
    let txid = $("#txid").val();
    // SDK API
    getTransaction(txid);
}

/** 
 * -102119 getProperty API at local.
 */
function sdkGetProperty() {
    let propertyId = $("#PropertyID").val();
    // SDK API
    getProperty(propertyId);
}

/** 
 * -103154 GetChannelDetailFromChannelID API at local.
 */
function sdkGetChannelDetailFromChannelID() {
    let channel_id = $("#channel_id").val();
    // SDK API
    getChannelDetailFromChannelID(channel_id);
}

/** 
 * -103155 getChannelDetailFromDatabaseID API at local.
 */
function sdkGetChannelDetailFromDatabaseID() {
    let id = $("#id").val();
    // SDK API
    getChannelDetailFromDatabaseID(id);
}

/** 
 * -103150 getAllChannels API at local.
 */
function sdkGetAllChannels() {
    // SDK API
    getAllChannels();
}

/** 
 * -103200 GetAllCommitmentTransactions API at local.
 */
function sdkGetAllCommitmentTransactions() {
    let channel_id = $("#channel_id").val();
    // SDK API
    getAllCommitmentTransactions(channel_id);
}

/** 
 * -103203 getLatestCommitmentTransaction API at local.
 */
function sdkGetLatestCommitmentTransaction() {
    let channel_id = $("#channel_id").val();
    // SDK API
    getLatestCommitmentTransaction(channel_id);    
}

/** 
 * -103204 getLatestRevockableDeliveryTransaction API at local.
 */
function sdkGetLatestRevockableDeliveryTransaction() {
    let channel_id = $("#channel_id").val();
    // SDK API
    getLatestRevockableDeliveryTransaction(channel_id);    
}

/** 
 * -103205 getLatestBreachRemedyTransaction API at local.
 */
function sdkGetLatestBreachRemedyTransaction() {
    let channel_id = $("#channel_id").val();
    // SDK API
    getLatestBreachRemedyTransaction(channel_id);    
}

/** 
 * -103207 getAllRevockableDeliveryTransactions API at local.
 */
function sdkGetAllRevockableDeliveryTransactions() {
    let channel_id = $("#channel_id").val();
    // SDK API
    getAllRevockableDeliveryTransactions(channel_id);    
}

/** 
 * -103208 getAllBRTx API at local.
 */
function sdkGetAllBreachRemedyTransactions() {
    let channel_id = $("#channel_id").val();
    // SDK API
    getAllBreachRemedyTransactions(channel_id); 
}

// -100340 BTC Funding Created API at local.
function sdkBitcoinFundingCreated() {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                         = new FundingBtcCreated();
    info.temporary_channel_id        = $("#temporary_channel_id").val();
    info.channel_address_private_key = $("#channel_address_private_key").val();
    info.funding_tx_hex              = $("#funding_tx_hex").val();

    // SDK API
    bitcoinFundingCreated(nodeID, userID, info);
    displaySentMessage100340(nodeID, userID, info);
}

// -100350 BTC Funding Signed API at local.
function sdkBitcoinFundingSigned() {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                         = new FundingBtcSigned();
    info.temporary_channel_id        = $("#temporary_channel_id").val();
    info.channel_address_private_key = $("#channel_address_private_key").val();
    info.funding_txid                = $("#funding_txid").val();
    info.approval                    = $("#checkbox_n3500").prop("checked");

    // SDK API
    bitcoinFundingSigned(nodeID, userID, info);
    displaySentMessage100350(nodeID, userID, info);
}

// -100034 Omni Asset Funding Created API at local.
function sdkAssetFundingCreated() {

    let nodeID   = $("#recipient_node_peer_id").val();
    let userID   = $("#recipient_user_peer_id").val();

    let info                         = new AssetFundingCreatedInfo();
    info.temporary_channel_id        = $("#temporary_channel_id").val();
    info.temp_address_pub_key        = $("#temp_address_pub_key").val();
    info.temp_address_private_key    = $("#temp_address_private_key").val();
    info.channel_address_private_key = $("#channel_address_private_key").val();
    info.funding_tx_hex              = $("#funding_tx_hex").val();

    // SDK API
    assetFundingCreated($("#logined").text(), nodeID, userID, info);
    displaySentMessage100034(nodeID, userID, info);
}

// -100035 Omni Asset Funding Signed API at local.
function sdkAssetFundingSigned() {

    let nodeID    = $("#recipient_node_peer_id").val();
    let userID    = $("#recipient_user_peer_id").val();
    let temp_cid  = $("#temporary_channel_id").val();
    let privkey   = $("#fundee_channel_address_private_key").val();
    // let approval   = $("#checkbox_n35").prop("checked");

    let info                                = new AssetFundingSignedInfo();
    info.temporary_channel_id               = temp_cid;
    info.fundee_channel_address_private_key = privkey;
    // info.approval = approval;

    // SDK API
    assetFundingSigned($("#logined").text(), nodeID, userID, info);
    displaySentMessage100035(nodeID, userID, info);
}

// -102109 funding BTC API at local.
function sdkFundingBitcoin() {

    let info                      = new BtcFundingInfo();
    info.from_address             = $("#from_address").val();
    info.from_address_private_key = $("#from_address_private_key").val();
    info.to_address               = $("#to_address").val();
    info.amount                   = Number($("#amount").val());
    info.miner_fee                = Number($("#miner_fee").val());

    // SDK API
    fundingBitcoin($("#logined").text(), info);
    displaySentMessage102109(info);
}

//  -102120 funding Omni Asset API at local.
function sdkFundingAsset() {

    let info                      = new OmniFundingAssetInfo();
    info.from_address             = $("#from_address").val();
    info.from_address_private_key = $("#from_address_private_key").val();
    info.to_address               = $("#to_address").val();
    info.amount                   = Number($("#amount").val());
    info.property_id              = Number($("#property_id").val());

    // SDK API
    fundingAsset(info);
    displaySentMessage102120(info);
}

// -100402 create Invoice API at local.
function sdkAddInvoice() {

    let info         = new InvoiceInfo();
    info.property_id = Number($("#property_id").val());
    info.amount      = Number($("#amount").val());
    info.h           = $("#h").val();
    info.expiry_time = $("#expiry_time").val();
    info.description = $("#description").val();

    // SDK API
    addInvoice(info, function(e) {
        console.info('-100402 sdkAddInvoice = ' + JSON.stringify(e));
        displaySentMessage100402(info);
        makeQRCode(e);
    });
}

/**
 * Make QR code of a invoice
 * @param e OBD response result
 */
function makeQRCode(e) {

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
}

// -100040 Old name htlcCreated API at local.
function sdkAddHTLC() {

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

    // SDK API
    addHTLC($("#logined").text(), nodeID, userID, info);
    displaySentMessage100040(nodeID, userID, info);
}

// -100041 htlcSigned API at local.
function sdkHTLCSigned() {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();

    let info                                = new HtlcSignedInfo();
    info.payer_commitment_tx_hash           = $("#payer_commitment_tx_hash").val();
    info.channel_address_private_key        = $("#channel_address_private_key").val();
    info.last_temp_address_private_key      = $("#last_temp_address_private_key").val();
    info.curr_rsmc_temp_address_pub_key     = $("#curr_rsmc_temp_address_pub_key").val();
    info.curr_rsmc_temp_address_private_key = $("#curr_rsmc_temp_address_private_key").val();
    info.curr_htlc_temp_address_pub_key     = $("#curr_htlc_temp_address_pub_key").val();
    info.curr_htlc_temp_address_private_key = $("#curr_htlc_temp_address_private_key").val();

    // SDK API
    HTLCSigned($("#logined").text(), nodeID, userID, info);
    displaySentMessage100041(nodeID, userID, info);
}

// -100401 Old name is HtlcFindPath API at local.
function sdkPayInvoice() {

    let info     = new PayInvoiceInfo();
    let isInvPay = Boolean($("#n401_InvPay").prop("checked"));

    // Invoice Payment is true
    if (isInvPay === true) {
        info.invoice = $("#invoice").val();
    } else {
        info.recipient_user_peer_id = $("#recipient_user_peer_id").val();
        info.property_id            = Number($("#property_id").val());
        info.amount                 = Number($("#amount").val());
        info.h                      = $("#h").val();
        info.expiry_time            = $("#expiry_time").val();
        info.description            = $("#description").val();
        info.is_private             = $("#checkbox_n401").prop("checked");
    }

    // SDK API
    payInvoice(info);
    displaySentMessage100401(info, isInvPay);
}

// -100351 Commitment Transaction Created API at local.
function sdkCommitmentTransactionCreated() {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();
    
    let info                           = new CommitmentTx();
    info.channel_id                    = $("#channel_id").val();
    info.amount                        = Number($("#amount").val());
    info.channel_address_private_key   = $("#channel_address_private_key").val();
    info.curr_temp_address_pub_key     = $("#curr_temp_address_pub_key").val();
    info.curr_temp_address_private_key = $("#curr_temp_address_private_key").val();
    info.last_temp_address_private_key = $("#last_temp_address_private_key").val();

    // SDK API
    commitmentTransactionCreated($("#logined").text(), nodeID, userID, info);
    displaySentMessage100351(nodeID, userID, info);
}

// -100352 Revoke and Acknowledge Commitment Transaction API at local.
function sdkCommitmentTransactionAccepted() {

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

    // SDK API
    commitmentTransactionAccepted($("#logined").text(), nodeID, userID, info);
    displaySentMessage100352(nodeID, userID, info);
}

// Invoke each APIs.
function invokeAPIs(obj) {

    let msgType = Number(obj.getAttribute('type_id'));
    console.info('type_id = ' + msgType);

    switch (msgType) {
        case enumMsgType.MsgType_Core_Omni_Getbalance_2112:
            sdkGetAllBalancesForAddress();
            break;
        case enumMsgType.MsgType_Core_Omni_CreateNewTokenFixed_2113:
            sdkIssueFixedAmount();
            break;
        case enumMsgType.MsgType_Core_Omni_CreateNewTokenManaged_2114:
            sdkIssueManagedAmout();
            break;
        case enumMsgType.MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115:
            sdkSendGrant();
            break;
        case enumMsgType.MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116:
            sdkSendRevoke();
            break;
        case enumMsgType.MsgType_Core_Omni_ListProperties_2117:
            sdkListProperties();
            break;
        case enumMsgType.MsgType_Core_Omni_GetTransaction_2118:
            sdkGetTransaction();
            break;
        case enumMsgType.MsgType_Core_Omni_GetProperty_2119:
            sdkGetProperty();
            break;
        case enumMsgType.MsgType_GetChannelInfoByChannelId_3154:
            sdkGetChannelDetailFromChannelID();
            break;
        case enumMsgType.MsgType_GetChannelInfoByDbId_3155:
            sdkGetChannelDetailFromDatabaseID();
            break;
        case enumMsgType.MsgType_ChannelOpen_AllItem_3150:
            sdkGetAllChannels();
            break;
        case enumMsgType.MsgType_CommitmentTx_ItemsByChanId_3200:
            sdkGetAllCommitmentTransactions();
            break;
        case enumMsgType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203:
            sdkGetLatestCommitmentTransaction();
            break;
        case enumMsgType.MsgType_CommitmentTx_LatestRDByChanId_3204:
            sdkGetLatestRevockableDeliveryTransaction();
            break;
        case enumMsgType.MsgType_CommitmentTx_LatestBRByChanId_3205:
            sdkGetLatestBreachRemedyTransaction();
            break;
        case enumMsgType.MsgType_CommitmentTx_AllRDByChanId_3207:
            sdkGetAllRevockableDeliveryTransactions();
            break;
        case enumMsgType.MsgType_CommitmentTx_AllBRByChanId_3208:
            sdkGetAllBreachRemedyTransactions();
            break;
        case enumMsgType.MsgType_Mnemonic_CreateAddress_3000:
            let result = sdkGenAddressFromMnemonic();
            if (result === '') return;
            saveAddress($("#logined").text(), result);
            createOBDResponseDiv(result, msgType);
            break;
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_3001:
            sdkGetAddressInfo(msgType);
            break;
        case enumMsgType.MsgType_UserLogin_2001:
            sdkLogIn();
            break;
        case enumMsgType.MsgType_UserLogout_2002:
            obdApi.logout();
            break;
        case enumMsgType.MsgType_GetMnemonic_2004:
            let mnemonic = sdkGenMnemonic();
            createOBDResponseDiv(mnemonic);
            break;
        case enumMsgType.MsgType_Core_FundingBTC_2109:
            sdkFundingBitcoin();
            break;
        case enumMsgType.MsgType_FundingCreate_SendBtcFundingCreated_340:
            sdkBitcoinFundingCreated();
            break;
        case enumMsgType.MsgType_FundingSign_SendBtcSign_350:
            sdkBitcoinFundingSigned();
            break;
        case enumMsgType.MsgType_Core_Omni_FundingAsset_2120:
            sdkFundingAsset();
            break;
        case enumMsgType.MsgType_FundingCreate_SendAssetFundingCreated_34:
            sdkAssetFundingCreated();
            break;
        case enumMsgType.MsgType_FundingSign_SendAssetFundingSigned_35:
            sdkAssetFundingSigned();
            break;
        case enumMsgType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351:
            sdkCommitmentTransactionCreated();
            break;
        case enumMsgType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
            sdkCommitmentTransactionAccepted();
            break;
        case enumMsgType.MsgType_Core_Omni_GetTransaction_2118:
            sdkGetTransaction();
            break;
        case enumMsgType.MsgType_SendChannelOpen_32:
            sdkOpenChannel();
            break;
        case enumMsgType.MsgType_SendChannelAccept_33:
            sdkAcceptChannel();
            break;
        case enumMsgType.MsgType_HTLC_Invoice_402:
            sdkAddInvoice();
            break;
        case enumMsgType.MsgType_HTLC_FindPath_401:
            sdkPayInvoice();
            break;
        case enumMsgType.MsgType_HTLC_SendAddHTLC_40:
            sdkAddHTLC();
            break;
        case enumMsgType.MsgType_HTLC_SendAddHTLCSigned_41:
            sdkHTLCSigned();
            break;
        case enumMsgType.MsgType_HTLC_SendVerifyR_45:
            sdkForwardR();
            break;
        case enumMsgType.MsgType_HTLC_SendSignVerifyR_46:
            sdkSignR();
            break;
        case enumMsgType.MsgType_HTLC_SendRequestCloseCurrTx_49:
            sdkCloseHTLC();
            break;
        case enumMsgType.MsgType_HTLC_SendCloseSigned_50:
            sdkCloseHTLCSigned();
            break;
        case enumMsgType.MsgType_SendCloseChannelRequest_38:
            sdkCloseChannel();
            break;
        case enumMsgType.MsgType_SendCloseChannelSign_39:
            sdkCloseChannelSigned();
            break;
        case enumMsgType.MsgType_Atomic_SendSwap_80:
            sdkAtomicSwap();
            break;
        case enumMsgType.MsgType_Atomic_SendSwapAccept_81:
            sdkAcceptSwap();
            break;
        case enumMsgType.MsgType_p2p_ConnectPeer_2003:
            sdkConnectP2PPeer(msgType);
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
        newMsg += '\n\n' + 'Received -  ' + msgHead;
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
    arrObdMsg.push('Received -  ' + msgHead);
    arrObdMsg.push('------------------------------------');

    // Show message in message box at right side.
    let showMsg = '';
    for (let i = arrObdMsg.length - 1; i >= 0; i--) {
        showMsg += arrObdMsg[i] + '\n\n';
    }
    
    $("#obd_messages").html(showMsg);
}

// 
function getUserDataList(goWhere) {

    let api_id, description, apiItem;
    let jsonFile = "json/user_data_list.json";

    // dynamic create api_list div.
    $.getJSON(jsonFile, function(result) {
        let apiList = $("#user_data_list");

        for (let i = 0; i < result.data.length; i++) {
            api_id = result.data[i].id;
            description = result.data[i].description;

            apiItem = document.createElement('a');
            apiItem.id = api_id;
            apiItem.href = '#';
            apiItem.setAttribute('class', 'url');
            apiItem.setAttribute('description', description);
            apiItem.setAttribute('onclick', 'displayUserData(this)');
            apiItem.innerText = api_id;

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
                displayUserData(MyAddresses, kNewHtml);
                break;
            case 'Counterparties':
                displayUserData(Counterparties, kNewHtml);
                break;
            case 'ChannelList':
                displayUserData(ChannelList, kNewHtml);
                break;
            case 'OmniFaucet':
                displayUserData(OmniFaucet, kNewHtml);
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
            apiItem.href = '#';
            // apiItem.href = 'javascript:void(0);';
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
    let content_div = $("#name_req_div");

    let newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // create [api_name] element
    let title = document.createElement('div');
    title.setAttribute('class', 'panelTitle');
    createElement(title, 'h2', obj.innerHTML);
    newDiv.append(title);

    // create [api_description] element
    createElement(newDiv, 'text', obj.getAttribute("description"), 'api_description');

    content_div.append(newDiv);
}

// create 
function createRequestDiv(obj) {
    let content_div = $("#name_req_div");

    let newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // create [title] element
    let title = document.createElement('div');
    title.setAttribute('class', 'panelTitle');
    createElement(title, 'h2', 'Request');
    newDiv.append(title);
    // createElement(content_div, 'h2', 'Request');

    // create [func_title] element
    createElement(newDiv, 'text', 'func: ');

    // create [func_name] element: id = JS function name.
    createElement(newDiv, 'text', obj.getAttribute("id"), 'funcText');

    // create [type_id] element
    let value = " type ( " + obj.getAttribute("type_id") + " )";
    createElement(newDiv, 'text', value);

    // create [Invoke API] element
    let button = document.createElement('button');
    button.setAttribute('type_id', obj.getAttribute("type_id"));
    button.setAttribute('class', 'button button_big');
    button.setAttribute('onclick', 'invokeAPIs(this)');
    button.innerText = 'Invoke API';
    newDiv.append(button);

    content_div.append(newDiv);
}

// dynamic create input parameters div area.
function createInputParamDiv(obj, jsonFile) {

    let arrParams, newDiv, title, msgType;

    $.getJSON(jsonFile, function(result) {
        // get [content] div
        let content_div = $("#name_req_div");

        // get JS function name.
        let js_func = obj.getAttribute("id");

        for (let i = 0; i < result.data.length; i++) {
            // id = js_func, is JS function name.
            if (js_func === result.data[i].id) {
                arrParams = result.data[i].parameters;
                // console.info('arrParams = ' + arrParams.length);

                // No parameter.
                if (arrParams.length === 0) {
                    break;
                }

                newDiv = document.createElement('div');
                newDiv.setAttribute('class', 'panelItem');

                title = document.createElement('div');
                title.setAttribute('class', 'panelTitle');
                createElement(title, 'h2', 'Input Parameters');
                newDiv.append(title);

                // display checkbox of invoice payment
                if (jsonFile === 'json/api_list.json') {
                    msgType = Number(obj.getAttribute("type_id"));
                    if (msgType === enumMsgType.MsgType_HTLC_FindPath_401) {
                        checkboxInvoicePayment(newDiv);
                        content_div.append(newDiv);
                    }
                }

                // Parameters
                createParamOfAPI(arrParams, newDiv);
                content_div.append(newDiv);
                autoFillValue(arrParams, obj);
            }
        }

        // display Approval Checkbox
        if (jsonFile === 'json/api_list.json') {
            msgType = Number(obj.getAttribute("type_id"));
            switch (msgType) {
                case enumMsgType.MsgType_HTLC_FindPath_401:
                    displayApprovalCheckbox(newDiv, msgType);
                    content_div.append(newDiv);
                    hide401Elements();
                    break;
                case enumMsgType.MsgType_SendChannelOpen_32:
                case enumMsgType.MsgType_SendChannelAccept_33:
                case enumMsgType.MsgType_FundingSign_SendBtcSign_350:
                // case enumMsgType.MsgType_FundingSign_SendAssetFundingSigned_35:
                case enumMsgType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
                case enumMsgType.MsgType_SendCloseChannelSign_39:
                // case enumMsgType.MsgType_HTLC_SendAddHTLCSigned_41:
                    displayApprovalCheckbox(newDiv, msgType);
                    content_div.append(newDiv);
                    break;
            }
        }
    });
}

//
function fillCounterparty() {
    let result = getCounterparty($("#logined").text());
    if (result === '') return;
    $("#recipient_node_peer_id").val(result.nodeID);
    $("#recipient_user_peer_id").val(result.userID);
}

/**
 * Auto fill h, routing packet, cltv expiry
 */
function fillH_RP_CE() {
    $("#h").val(getHtlcH());
    $("#routing_packet").val(getRoutingPacket());
    $("#cltv_expiry").val(getCltvExpiry());
}

//
async function fillChannelIDAndFundingPrivKey() {
    let channelID = getChannelID();
    $("#channel_id").val(channelID);

    let fundingPrivKey = await asyncGetFundingPrivKey(
        $("#logined").text(), db, channelID, kTbFundingPrivKey);
    $("#channel_address_private_key").val(fundingPrivKey);
}

//
function fillChannelFundingLastTempKeys() {
    fillChannelIDAndFundingPrivKey();
    let channel_id  = getChannelID();
    let tempPrivKey = getTempPrivKey($("#logined").text(), kTempPrivKey, channel_id);
    $("#last_temp_address_private_key").val(tempPrivKey);
}

//
async function fillTempChannelIDAndFundingPrivKey(msgType) {
    let channelID = getChannelID();
    $("#temporary_channel_id").val(channelID);

    let fundingPrivKey = await asyncGetFundingPrivKey(
        $("#logined").text(), db, channelID, kTbFundingPrivKey);

    if (msgType === 35) {
        $("#fundee_channel_address_private_key").val(fundingPrivKey);
    } else {
        $("#channel_address_private_key").val(fundingPrivKey);
    }
}

//
function fillTempAddrKey() {
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;
    $("#temp_address_pub_key").val(result.result.pubkey);
    $("#temp_address_private_key").val(result.result.wif);
    $("#temp_address_pub_key").attr("class", "input input_color");
    $("#temp_address_private_key").attr("class", "input input_color");
    saveAddress($("#logined").text(), result);
}

//
function fillCurrTempAddrKey() {
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;
    $("#curr_temp_address_pub_key").val(result.result.pubkey);
    $("#curr_temp_address_private_key").val(result.result.wif);
    $("#curr_temp_address_pub_key").attr("class", "input input_color");
    $("#curr_temp_address_private_key").attr("class", "input input_color");
    saveAddress($("#logined").text(), result);
}

//
function fillCurrRsmcTempKey() {
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;
    $("#curr_rsmc_temp_address_pub_key").val(result.result.pubkey);
    $("#curr_rsmc_temp_address_private_key").val(result.result.wif);
    $("#curr_rsmc_temp_address_pub_key").attr("class", "input input_color");
    $("#curr_rsmc_temp_address_private_key").attr("class", "input input_color");
    saveAddress($("#logined").text(), result);
}

//
function fillCurrHtlcTempKey() {
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;
    $("#curr_htlc_temp_address_pub_key").val(result.result.pubkey);
    $("#curr_htlc_temp_address_private_key").val(result.result.wif);
    $("#curr_htlc_temp_address_pub_key").attr("class", "input input_color");
    $("#curr_htlc_temp_address_private_key").attr("class", "input input_color");
    saveAddress($("#logined").text(), result);
}

//
function fillCurrHtlcHe1bTempKey() {
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;
    $("#curr_htlc_temp_address_for_he1b_pub_key").val(result.result.pubkey);
    $("#curr_htlc_temp_address_for_he1b_private_key").val(result.result.wif);
    $("#curr_htlc_temp_address_for_he1b_pub_key").attr("class", "input input_color");
    $("#curr_htlc_temp_address_for_he1b_private_key").attr("class", "input input_color");
    saveAddress($("#logined").text(), result);
}

//
function fillCurrHtlcHt1aTempKey() {
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;
    $("#curr_htlc_temp_address_for_ht1a_pub_key").val(result.result.pubkey);
    $("#curr_htlc_temp_address_for_ht1a_private_key").val(result.result.wif);
    $("#curr_htlc_temp_address_for_ht1a_pub_key").attr("class", "input input_color");
    $("#curr_htlc_temp_address_for_ht1a_private_key").attr("class", "input input_color");
    saveAddress($("#logined").text(), result);
}

//
function fillFundingBtcData() {
    let result = getFundingBtcData($("#logined").text());
    // console.info('AUTO FILL result ==>  ' + result);
    // if (result === '') return;
    $("#from_address").val(result.from_address);
    $("#from_address_private_key").val(result.from_address_private_key);
    $("#to_address").val(getChannelAddress());
    $("#amount").val(result.amount);
    $("#miner_fee").val(result.miner_fee);
}

//
function fillFundingAssetData() {
    let result = getFundingBtcData($("#logined").text());
    if (result === '') return;
    $("#from_address").val(result.from_address);
    $("#from_address_private_key").val(result.from_address_private_key);
    $("#to_address").val(getChannelAddress());
}

//
async function autoFillValue(arrParams, obj) {

    // Auto fill some values
    let msgType = Number(obj.getAttribute("type_id"));
    switch (msgType) {
        case enumMsgType.MsgType_HTLC_FindPath_401:
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
            $("#funding_tx_hex").val(getTempHash());
            fillTempAddrKey();
            break;

        case enumMsgType.MsgType_FundingSign_SendAssetFundingSigned_35:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            fillTempChannelIDAndFundingPrivKey(35);
            break;

        case enumMsgType.MsgType_SendCloseChannelRequest_38:
        case enumMsgType.MsgType_SendCloseChannelSign_39:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            $("#channel_id").val(getChannelID());
            if (msgType === enumMsgType.MsgType_SendCloseChannelSign_39) {
                $("#request_close_channel_hash").val(getTempHash());
            }
            break;

        case enumMsgType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351:
        case enumMsgType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            fillChannelFundingLastTempKeys();
            if (msgType === enumMsgType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352) {
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
            fillH_RP_CE();
            fillChannelFundingLastTempKeys();
            fillCurrRsmcTempKey();
            fillCurrHtlcTempKey();
            fillCurrHtlcHt1aTempKey();
            break;

        case enumMsgType.MsgType_HTLC_SendAddHTLCSigned_41:
            if (!isLogined) return;  // Not logined
            fillCounterparty();
            $("#payer_commitment_tx_hash").val(getTempHash());
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
            $("#msg_hash").val(getTempHash());
            $("#r").val(getForwardR());
            break;

        case enumMsgType.MsgType_HTLC_SendRequestCloseCurrTx_49:
        case enumMsgType.MsgType_HTLC_SendCloseSigned_50:
            if (!isLogined) return;  // Not logined
            fillCounterparty();

            if (msgType === enumMsgType.MsgType_HTLC_SendCloseSigned_50) {
                $("#msg_hash").val(getTempHash());
            }

            let channelID = getChannelID();
            $("#channel_id").val(channelID);

            let fundingPrivKey = await asyncGetFundingPrivKey(
                $("#logined").text(), db, channelID, kTbFundingPrivKey);
            $("#channel_address_private_key").val(fundingPrivKey);

            let privkey_1 = getTempPrivKey($("#logined").text(), kRsmcTempPrivKey, channelID);
            $("#last_rsmc_temp_address_private_key").val(privkey_1);

            let privkey_2 = getTempPrivKey($("#logined").text(), kHtlcTempPrivKey, channelID);
            $("#last_htlc_temp_address_private_key").val(privkey_2);

            let privkey_3 = getTempPrivKey($("#logined").text(), kHtlcHtnxTempPrivKey, channelID);
            $("#last_htlc_temp_address_for_htnx_private_key").val(privkey_3);

            fillCurrRsmcTempKey();
            break;
    }
}

// display Approval Checkbox
function displayApprovalCheckbox(content_div, msgType) {

    if (msgType === enumMsgType.MsgType_SendChannelOpen_32 || 
        msgType === enumMsgType.MsgType_HTLC_FindPath_401) {
        createElement(content_div, 'text', 'is_private ');
    } else {
        createElement(content_div, 'text', 'Approval ');
    }

    let element = document.createElement('input');

    switch (msgType) {
        case enumMsgType.MsgType_SendChannelOpen_32:
            element.id = 'checkbox_n32';
            break;
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
        case enumMsgType.MsgType_HTLC_FindPath_401:
            element.id = 'checkbox_n401';
            break;
    }

    element.type = 'checkbox';

    if (msgType === enumMsgType.MsgType_SendChannelOpen_32 || 
        msgType === enumMsgType.MsgType_HTLC_FindPath_401) {
        element.defaultChecked = false;
    } else {
        element.defaultChecked = true;
    }

    element.setAttribute('onclick', 'clickApproval(this)');
    content_div.append(element);
}

// 
function checkboxInvoicePayment(content_div) {

    createElement(content_div, 'text', 'Invoice Payment', 'invoice_payment');

    let element  = document.createElement('input');
    element.id   = 'n401_InvPay';
    element.type = 'checkbox';
    element.defaultChecked = true;
    element.setAttribute('onclick', 'clickInvoicePayment(this)');
    content_div.append(element);

    createElement(content_div, 'p');
}

//
function hide401Elements() {
    $("#invoice").show();
    $("#recipient_user_peer_id").hide();
    $("#recipient_user_peer_idCou").hide();
    $("#property_id").hide();
    $("#property_idDis").hide();
    $("#amount").hide();
    $("#h").hide();
    $("#hDis").hide();
    $("#expiry_time").hide();
    $("#description").hide();
    $("#checkbox_n401").hide();
}

// 
function clickInvoicePayment(obj) {
    if (obj.checked) {
        hide401Elements();
    } else {
        $("#invoice").hide();
        $("#recipient_user_peer_id").show();
        $("#recipient_user_peer_idCou").show();
        $("#property_id").show();
        $("#property_idDis").show();
        $("#amount").show();
        $("#h").show();
        $("#hDis").show();
        $("#expiry_time").show();
        $("#description").show();
        $("#checkbox_n401").show();
    }
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
    let div_help = document.createElement('div');
    div_help.setAttribute('class', 'wrapper');

    // let help = document.createElement('i');
    // help.setAttribute('class', 'btn_help fa fa-info-circle');
    // div_help.append(help);

    let help = document.createElement('img');
    help.setAttribute('class', 'btn_help');
    help.setAttribute('src', 'doc/tooltip/help.png');
    help.setAttribute('alt', 'help');
    div_help.append(help);

    let div_tooltip = document.createElement('div');
    div_tooltip.setAttribute('class', 'tooltip_help');

    let tooltip = document.createElement('label');
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
        button.setAttribute('onclick', 'sdkConnect2OBDInCustomMode()');
    } else {
        button.setAttribute('onclick', 'sdkConnect2OBD()');
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
function sdkConnect2OBD() {
    let nodeAddress = $("#NodeAddress").val();

    if (nodeAddress.trim().length === 0) {
        alert('Please input Node Address.');
        return;
    }

    // SDK API
    connectToServer(nodeAddress, function(response) {
        console.info('SDK: sdkConnect2OBD = ' + response);

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
function sdkConnect2OBDInCustomMode() {
    let nodeAddress = $("#NodeAddress").val();
    if (nodeAddress.trim().length === 0) {
        alert('Please input Node Address.');
        return;
    }

    // SDK API
    connectToServer(nodeAddress, function(response) {
        console.info('sdkConnect2OBDInCustomMode = ' + response);
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

    let newDiv = document.createElement('div');
    newDiv.id = "newDiv";
    newDiv.setAttribute('class', 'panelItem');

    let obd_response_div = document.createElement('div');
    obd_response_div.id = "obd_response_div";

    // create [title] element
    let title = document.createElement('div');
    title.setAttribute('class', 'panelTitle');
    createElement(title, 'h2', 'Messages');
    newDiv.append(title);

    newDiv.append(obd_response_div);
    $("#name_req_div").append(newDiv);

    switch (msgType) {
        case 'connect_node_resp':
            let msg = response + '. Please refresh the page if you want to connect again.';
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
    let arrData = [
        'Connect success.',
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i], 'responseText');
    }
}

// 
function parseData2001(response) {
    let arrData;
    if (isLogined) {
        arrData = [
            'Status : ' + response,
        ];
    }

    for (let i = 0; i < arrData.length; i++) {
        let point   = arrData[i].indexOf(':') + 1;
        let title   = arrData[i].substring(0, point);
        let content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// genAddressFromMnemonic
function parseData3000_3001(response) {
    let arrData = [
        'ADDRESS : ' + response.result.address,
        'INDEX : '   + response.result.index,
        'PUB_KEY : ' + response.result.pubkey,
        'PRIV_KEY : '     + response.result.wif
    ];

    for (let i = 0; i < arrData.length; i++) {
        let point   = arrData[i].indexOf(':') + 1;
        let title   = arrData[i].substring(0, point);
        let content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// Record full flow channel data.
function channelData(response) {
    let data = {
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
    let btc = {
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
    let data = {
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
    let data = {
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
    let omniAsset = {
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
    var list = JSON.parse(localStorage.getItem(kChannelList));

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

                localStorage.setItem(kChannelList, JSON.stringify(list));
                return;
            }
        }

        // A new 
        list.result.push(dataConstruct(response, chID, msgType));
        localStorage.setItem(kChannelList, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [dataConstruct(response, chID, msgType)]
        }
        localStorage.setItem(kChannelList, JSON.stringify(data));
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


// 
function getNewestConnOBD() {
    var nodeAddress;
    var list = JSON.parse(localStorage.getItem(kOBDList));
    // If has data
    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            if (list.result[i].newest === 'yes') {
                nodeAddress = list.result[i].name;
                return nodeAddress;
            }
        }
        return nodeAddress = 'ws://127.0.0.1:60020/wstest';
    } else { // NO LOCAL STORAGE DATA YET.
        return nodeAddress = 'ws://127.0.0.1:60020/wstest';
    }
}

// List of OBD node that have interacted
function saveOBDConnectHistory(name) {

    var list = JSON.parse(localStorage.getItem(kOBDList));

    // If has data.
    if (list) {
        // console.info('HAS DATA');
        for (let i = 0; i < list.result.length; i++) {
            list.result[i].newest = '';
        }

        for (let i = 0; i < list.result.length; i++) {
            if (list.result[i].name === name) {
                list.result[i].newest = 'yes';
                localStorage.setItem(kOBDList, JSON.stringify(list));
                return;
            }
        }

        let new_data = {
            name:  name,
            newest: 'yes'
        }
        list.result.push(new_data);
        localStorage.setItem(kOBDList, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                name:  name,
                newest: 'yes'
            }]
        }
        localStorage.setItem(kOBDList, JSON.stringify(data));
    }
}

// Save APIs invoked history in custom mode.
function saveInvokeHistory(name, content) {

    var list = JSON.parse(localStorage.getItem(kInvokeHistory));

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
        localStorage.setItem(kInvokeHistory, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                name:    name,
                content: content,
            }]
        }
        localStorage.setItem(kInvokeHistory, JSON.stringify(data));
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
    obdApi.getAllBalancesForAddress(strAddr, function(e) {
        console.info('-102112 getAllBalancesForAddress = ' + JSON.stringify(e));

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
    // SDK API
    let mnemonic = sdkGenMnemonic();
    $("#mnemonic").val(mnemonic);
}

// Generate a new pub key of an address.
function autoCreateFundingPubkey(param) {
    // Generate address by local js library.
    let result = sdkGenAddressFromMnemonic();
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

    saveAddress($("#logined").text(), result);
}

// auto calculation the miner fee
function autoCalcMinerFee() {
    $("#miner_fee").val('0.00001');
}

// auto calculation the amount of btc that needs to be recharged in the channel
function autoCalcAmount() {
    // SDK API
    getAmountOfRechargeBTC(function(e) {
        console.info('SDK: -102006 getAmountOfRechargeBTC = ' + JSON.stringify(e));
        let value = JSON.stringify(e);
        value = value.replace("\"", "").replace("\"", "");
        $("#amount").val(value);
    });
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
        case 'OmniFaucet':
            displayOmniFaucet(param);
            break;
    }
}

//
function displayMnemonic() {
    let parent   = $("#name_req_div");
    let mnemonic = JSON.parse(localStorage.getItem(kMnemonic));
    let newDiv   = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // If has data
    if (mnemonic) {
        for (let i = 0; i < mnemonic.result.length; i++) {
            createElement(newDiv, 'h4', 'NO. ' + (i + 1));
            createElement(newDiv, 'text', 'User ID:');
            createElement(newDiv, 'text', mnemonic.result[i].userID, 'responseText');
            createElement(newDiv, 'p');
            createElement(newDiv, 'text', 'Mnemonic:');
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

    if (param === kNewHtml) { // New page
        let status = JSON.parse(localStorage.getItem(kGoWhere));
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

    let arrData;
    let addr = getAddress();  // SDK API
    // let addr = JSON.parse(localStorage.getItem(itemAddr));

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
                        'Index : '   + addr.result[i].data[i2].index,
                        'PubKey : '  + addr.result[i].data[i2].pubkey,
                        'PrivKey : ' + addr.result[i].data[i2].wif
                    ];

                    for (let i3 = 0; i3 < arrData.length; i3++) {
                        let point   = arrData[i3].indexOf(':') + 1;
                        let title   = arrData[i3].substring(0, point);
                        let content = arrData[i3].substring(point);
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
function displayOmniFaucet(param) {
    // let userID = $("#logined").text();
    let parent = $("#name_req_div");
    let newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    //
    let strAddr = 'n4j37pAMNsjkTs6roKof3TGNvmPh16fvpS';
    obdApi.getAllBalancesForAddress(strAddr, function(e) {
        console.info('-102112 displayOmniFaucet = ' + JSON.stringify(e));

        if (e != "") {

            createElement(newDiv, 'h3', 'Omni Faucet Asset:');

            for (let i = 0; i < e.length; i++) {
                createElement(newDiv, 'text', 'Asset Name:');
                createElement(newDiv, 'text', e[i].name, 'responseText');
                createElement(newDiv, 'p');

                createElement(newDiv, 'text', 'Property ID:');
                createElement(newDiv, 'text', e[i].propertyid, 'responseText');
                createElement(newDiv, 'p');

                createElement(newDiv, 'text', 'Balance:');
                createElement(newDiv, 'text', parseFloat(e[i].balance), 'responseText');
                createElement(newDiv, 'p');
            }

            createElement(newDiv, 'p', '------------');
            createElement(newDiv, 'h3', 'Send Asset:');

            createElement(newDiv, 'text',  'To Address: ', 'param');
            createElement(newDiv, 'input', '', 'input', 'to_address');

            createElement(newDiv, 'p');

            createElement(newDiv, 'text',  'Amout: ', 'param');
            createElement(newDiv, 'input', '', 'input', 'amount');

            createElement(newDiv, 'p');

            let button = document.createElement('button');
            button.innerText = 'Send';
            let clickFunc = 'sendAsset()';
            button.setAttribute('class', 'button button_small');
            button.setAttribute('onclick', clickFunc);
            newDiv.append(button);
            parent.append(newDiv);

            createElement(newDiv, 'p', '------------');
            createElement(newDiv, 'h3', 'Send Result:', '', 'send_result');
        }
    });
}

//
function createBalanceElement(parent, strAddr) {
    // create [text] element
    let title = document.createElement('text');
    title.id = strAddr;
    title.innerText = 'Balance : ';
    parent.append(title);

    // create [button] element
    let button = document.createElement('button');
    button.innerText = 'Get Balance';
    let clickFunc = "getBalance('" + strAddr + "')";
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
    let list   = JSON.parse(localStorage.getItem(kCounterparties));
    let newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    if (param === kNewHtml) { // New page
        var status = JSON.parse(localStorage.getItem(kGoWhere));
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
    var list = JSON.parse(localStorage.getItem(kOBDList));

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
    var list   = JSON.parse(localStorage.getItem(kOBDList));

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
    var list   = JSON.parse(localStorage.getItem(kInvokeHistory));

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
    localStorage.removeItem(kInvokeHistory);
    historyInCustom();
}

// 
function clearConnectionHistory(obj) {
    localStorage.removeItem(kOBDList);
    historyInCustom();
}

// 
function deleteOneInvokeHistory(obj) {
    var list = JSON.parse(localStorage.getItem(kInvokeHistory));
    list.result.splice(obj.getAttribute("index"), 1);
    if (list.result.length === 0) { // no item
        localStorage.removeItem(kInvokeHistory);
    } else {
        localStorage.setItem(kInvokeHistory, JSON.stringify(list));
    }
    historyInCustom();
}

// 
function deleteOneConnectionHistory(obj) {
    var list = JSON.parse(localStorage.getItem(kOBDList));
    list.result.splice(obj.getAttribute("index"), 1);
    if (list.result.length === 0) { // no item
        localStorage.removeItem(kOBDList);
    } else {
        localStorage.setItem(kOBDList, JSON.stringify(list));
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

    var list = JSON.parse(localStorage.getItem(kChannelList));

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
    localStorage.setItem(kGoWhere, JSON.stringify(data));
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
        // isAutoMode = true;
        saveAutoPilot('Yes');
    } else {
        // isAutoMode = false;
        saveAutoPilot('No');
    }

    // TEMP TEST CODE
    let isAutoMode = getAutoPilot();
    console.info('CLICK - isAutoMode = ' + isAutoMode);
}

/**
 * MsgType_GetMnemonic_2004
 * This is a OBD JS API. Will be moved to obdapi.js file.
 */
function sdkGenMnemonic() {
    // return btctool.generateMnemonic(128);
    return genMnemonic();
    // return wallet.genMnemonic();
}

/**
 * MsgType_Mnemonic_CreateAddress_3000
 * genAddressFromMnemonic by local js library
 */
function sdkGenAddressFromMnemonic() {
    if (!isLogined) { // Not logined
        alert('Please login first.');
        return;
    }

    // SDK API
    let index = getNewAddrIndex($("#logined").text());
    // console.info('addr index = ' + newIndex);
    return genAddressFromMnemonic(mnemonicWithLogined, index, true);
}

/**
 * MsgType_Mnemonic_GetAddressByIndex_3001
 * get Address Info by local js library
 * @param msgType
 */
function sdkGetAddressInfo(msgType) {
    if (!isLogined) { // Not logined
        alert('Please login first.');
        return;
    }

    let index = $("#index").val();
    // console.info('index = ' + index);

    // SDK API
    let result = getAddressInfo(mnemonicWithLogined, index, true);
    if (result === '') return;
    createOBDResponseDiv(result, msgType);
}

/**
 * Open IndexedDB
 */
function openDB() {

    let request = window.indexedDB.open('data');
    
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
        if (!db.objectStoreNames.contains(kTbGlobalMsg)) {
            os1 = db.createObjectStore(kTbGlobalMsg, { autoIncrement: true });
            os1.createIndex('user_id', 'user_id', { unique: false });
        }

        let os2;
        if (!db.objectStoreNames.contains(kTbFundingPrivKey)) {
            os2 = db.createObjectStore(kTbFundingPrivKey, { autoIncrement: true });
            os2.createIndex('channel_id', 'channel_id', { unique: false });
        }

        // OLD RESOLUTION
        // let os3;
        // if (!db.objectStoreNames.contains(kTbTempPrivKey)) {
        //     os3 = db.createObjectStore(kTbTempPrivKey, { autoIncrement: true });
        //     os3.createIndex('channel_id', 'channel_id', { unique: false });
        // }
    }
}

/**
 * Open a new IndexedDB instance for log page.
 * And read data belong one user.
 */
function openDBAndShowData(user_id) {

    let request = window.indexedDB.open('data');
    
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

    let request = db.transaction([kTbGlobalMsg], 'readwrite')
        .objectStore(kTbGlobalMsg)
        .add({ user_id: user_id, msg: msg });
  
    request.onsuccess = function (e) {
        console.log('Data write success.');
    };
  
    request.onerror = function (e) {
        console.log('Data write false.');
    }
}


/**
 * Remove data from IndexedDB
 * @param channel_id Key value
 * @param tbName: Funding private key or Last temp private key
 */
function removeData(channel_id, tbName) {
    let request = db.transaction([tbName], 'readwrite')
        .objectStore(tbName)
        .delete(channel_id);

    request.onsuccess = function (event) {
        console.log('Data deleted successfully.');
    };
}

/**
 * Read data belong one user from IndexedDB
 */
function readData(dataDB, user_id) {

    let showMsg     = '';
    let data        = [];
    let transaction = dataDB.transaction([kTbGlobalMsg], 'readonly');
    let store       = transaction.objectStore(kTbGlobalMsg);
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
 * -100032 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID 
 * @param info 
 */
function displaySentMessage100032(nodeID, userID, info) {
    let msgSend = {
        type: -100032,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            funding_pubkey: info.funding_pubkey,
            is_private:     info.is_private
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100033 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID 
 * @param info 
 */
function displaySentMessage100033(nodeID, userID, info) {
    let msgSend = {
        type: -100033,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            temporary_channel_id: info.temporary_channel_id,
            funding_pubkey:       info.funding_pubkey,
            approval:             info.approval,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100350 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID 
 * @param info 
 */
function displaySentMessage100350(nodeID, userID, info) {
    let msgSend = {
        type: -100350,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            temporary_channel_id:        info.temporary_channel_id,
            channel_address_private_key: info.channel_address_private_key,
            funding_txid:                info.funding_txid,
            approval:                    info.approval,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100035 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID 
 * @param info 
 */
function displaySentMessage100035(nodeID, userID, info) {
    let msgSend = {
        type: -100035,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            temporary_channel_id:               info.temporary_channel_id,
            fundee_channel_address_private_key: info.fundee_channel_address_private_key,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100352 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID 
 * @param info 
 */
function displaySentMessage100352(nodeID, userID, info) {
    let msgSend = {
        type: -100352,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                    info.channel_id,
            msg_hash:                      info.msg_hash,
            channel_address_private_key:   info.channel_address_private_key,
            curr_temp_address_pub_key:     info.curr_temp_address_pub_key,
            curr_temp_address_private_key: info.curr_temp_address_private_key,
            last_temp_address_private_key: info.last_temp_address_private_key,
            approval:                      info.approval,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100041 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID 
 * @param info 
 */
function displaySentMessage100041(nodeID, userID, info) {
    let msgSend = {
        type: -100041,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            payer_commitment_tx_hash:           info.payer_commitment_tx_hash,
            channel_address_private_key:        info.channel_address_private_key,
            curr_rsmc_temp_address_pub_key:     info.curr_rsmc_temp_address_pub_key,
            curr_rsmc_temp_address_private_key: info.curr_rsmc_temp_address_private_key,
            curr_htlc_temp_address_pub_key:     info.curr_htlc_temp_address_pub_key,
            curr_htlc_temp_address_private_key: info.curr_htlc_temp_address_private_key,
            last_temp_address_private_key:      info.last_temp_address_private_key,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100046 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID 
 * @param info 
 */
function displaySentMessage100046(nodeID, userID, info) {
    let msgSend = {
        type: -100046,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                  info.channel_id,
            msg_hash:                    info.msg_hash,
            r:                           info.r,
            channel_address_private_key: info.channel_address_private_key,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100050 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID 
 * @param info 
 */
function displaySentMessage100050(nodeID, userID, info) {
    let msgSend = {
        type: -100050,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            msg_hash:                                    info.msg_hash,
            channel_address_private_key:                 info.channel_address_private_key,
            last_rsmc_temp_address_private_key:          info.last_rsmc_temp_address_private_key,
            last_htlc_temp_address_private_key:          info.last_htlc_temp_address_private_key,
            last_htlc_temp_address_for_htnx_private_key: info.last_htlc_temp_address_for_htnx_private_key,
            curr_rsmc_temp_address_pub_key:              info.curr_rsmc_temp_address_pub_key,
            curr_rsmc_temp_address_private_key:          info.curr_rsmc_temp_address_private_key,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -102001 Display the sent message in the message box and save it to the log file
 * @param mnemonic 
 */
function displaySentMessage102001(mnemonic) {
    let msgSend = {
        type: -102001,
        data: {
            mnemonic: mnemonic
        }
    }
    displaySentMessage(msgSend);
}

/**
 * -102109 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage102109(info) {
    let msgSend = {
        type: -102109,
        data: {
            from_address:             info.from_address,
            from_address_private_key: info.from_address_private_key,
            to_address:               info.to_address,
            amount:                   info.amount,
            miner_fee:                info.miner_fee,
        }
    }
    displaySentMessage(msgSend);
}

/**
 * -102120 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage102120(info) {
    let msgSend = {
        type: -102120,
        data: {
            from_address:             info.from_address,
            from_address_private_key: info.from_address_private_key,
            to_address:               info.to_address,
            amount:                   info.amount,
            property_id:              info.property_id,
        }
    }
    displaySentMessage(msgSend);
}

/**
 * -100340 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100340(nodeID, userID, info) {
    let msgSend = {
        type: -100340,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            temporary_channel_id:        info.temporary_channel_id,
            channel_address_private_key: info.channel_address_private_key,
            funding_tx_hex:              info.funding_tx_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100034 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100034(nodeID, userID, info) {
    let msgSend = {
        type: -100034,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            temporary_channel_id:        info.temporary_channel_id,
            temp_address_pub_key:        info.temp_address_pub_key,
            temp_address_private_key:    info.temp_address_private_key,
            channel_address_private_key: info.channel_address_private_key,
            funding_tx_hex:              info.funding_tx_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100351 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100351(nodeID, userID, info) {
    let msgSend = {
        type: -100351,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                    info.channel_id,
            amount:                        info.amount,
            channel_address_private_key:   info.channel_address_private_key,
            curr_temp_address_pub_key:     info.curr_temp_address_pub_key,
            curr_temp_address_private_key: info.curr_temp_address_private_key,
            last_temp_address_private_key: info.last_temp_address_private_key,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100402 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage100402(info) {
    let msgSend = {
        type: -100402,
        data: {
            property_id: info.property_id,
            amount:      info.amount,
            h:           info.h,
            expiry_time: info.expiry_time,
            description: info.description,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100401 Display the sent message in the message box and save it to the log file
 * @param info 
 * @param isInvPay 
 */
function displaySentMessage100401(info, isInvPay) {
    let msgSend;

    // Invoice Payment is true
    if (Boolean(isInvPay) === true) {
        msgSend = {
            type: -100401,
            data: {
                invoice: info.invoice
            }
        }
    } else {
        msgSend = {
            type: -100401,
            data: {
                recipient_user_peer_id: info.recipient_user_peer_id,
                property_id:            info.property_id,
                amount:                 info.amount,
                h:                      info.h,
                expiry_time:            info.expiry_time,
                description:            info.description,
                is_private:             info.is_private,
            }
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100040 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100040(nodeID, userID, info) {
    let msgSend = {
        type: -100040,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            recipient_user_peer_id: info.recipient_user_peer_id,
            property_id: info.property_id,
            amount: info.amount,
            memo: info.memo,
            h: info.h,
            routing_packet: info.routing_packet,
            channel_address_private_key: info.channel_address_private_key,
            last_temp_address_private_key: info.last_temp_address_private_key,
            curr_rsmc_temp_address_pub_key: info.curr_rsmc_temp_address_pub_key,
            curr_rsmc_temp_address_private_key: info.curr_rsmc_temp_address_private_key,
            curr_htlc_temp_address_pub_key: info.curr_htlc_temp_address_pub_key,
            curr_htlc_temp_address_private_key: info.curr_htlc_temp_address_private_key,
            curr_htlc_temp_address_for_ht1a_pub_key: info.curr_htlc_temp_address_for_ht1a_pub_key,
            curr_htlc_temp_address_for_ht1a_private_key: info.curr_htlc_temp_address_for_ht1a_private_key,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100045 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100045(nodeID, userID, info) {
    let msgSend = {
        type: -100045,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id: info.channel_id,
            r:          info.r,
            channel_address_private_key: info.channel_address_private_key,
            curr_htlc_temp_address_for_he1b_pub_key: info.curr_htlc_temp_address_for_he1b_pub_key,
            curr_htlc_temp_address_for_he1b_private_key: info.curr_htlc_temp_address_for_he1b_private_key,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100049 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100049(nodeID, userID, info) {
    let msgSend = {
        type: -100049,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id: info.channel_id,
            channel_address_private_key: info.channel_address_private_key,
            last_rsmc_temp_address_private_key: info.last_rsmc_temp_address_private_key,
            last_htlc_temp_address_private_key: info.last_htlc_temp_address_private_key,
            last_htlc_temp_address_for_htnx_private_key: info.last_htlc_temp_address_for_htnx_private_key,
            curr_rsmc_temp_address_pub_key: info.curr_rsmc_temp_address_pub_key,
            curr_rsmc_temp_address_private_key: info.curr_rsmc_temp_address_private_key,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100080 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100080(nodeID, userID, info) {
    let msgSend = {
        type: -100080,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id_from:        info.channel_id_from,
            channel_id_to:          info.channel_id_to,
            recipient_user_peer_id: info.recipient_user_peer_id,
            property_sent:          info.property_sent,
            amount:                 info.amount,
            exchange_rate:          info.exchange_rate,
            property_received:      info.property_received,
            transaction_id:         info.transaction_id,
            time_locker:            info.time_locker,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100081 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100081(nodeID, userID, info) {
    let msgSend = {
        type: -100081,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id_from:        info.channel_id_from,
            channel_id_to:          info.channel_id_to,
            recipient_user_peer_id: info.recipient_user_peer_id,
            property_sent:          info.property_sent,
            amount:                 info.amount,
            exchange_rate:          info.exchange_rate,
            property_received:      info.property_received,
            transaction_id:         info.transaction_id,
            target_transaction_id:  info.target_transaction_id,
            time_locker:            info.time_locker,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100038 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param channel_id 
 */
function displaySentMessage100038(nodeID, userID, channel_id) {
    let msgSend = {
        type: -100038,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        channel_id: channel_id,
    }

    displaySentMessage(msgSend);
}

/**
 * -100039 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100039(nodeID, userID, info) {
    let msgSend = {
        type: -100039,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                 info.channel_id,
            request_close_channel_hash: info.request_close_channel_hash,
            approval:                   info.approval,
        }
    }

    displaySentMessage(msgSend);
}

//  -102121 Invoke omni_send rpc command of omni core
function sendAsset() {

    let info           = new OmniSendAssetInfo();
    info.from_address  = 'n4j37pAMNsjkTs6roKof3TGNvmPh16fvpS';
    info.to_address    = $("#to_address").val();
    info.amount        = Number($("#amount").val());
    info.property_id   = Number('137');

    // console.info('-102121 to_address = ' + info.to_address);
    // console.info('-102121 amount = ' + info.amount);

    obdApi.sendAsset(info, function(e) {
        console.info('-102121 sendAsset = ' + JSON.stringify(e));
        $("#send_result").text('Send Result: Success! Txid is: ' + JSON.stringify(e));
    });
}