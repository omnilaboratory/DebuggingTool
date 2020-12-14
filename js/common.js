// var obdApi = new ObdApi();
var enumMsgType = new MessageType();

// testing code...
// const ecc = require('tiny-secp256k1');

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
const kOBDList = 'obd_list';

//
const kInvokeHistory = 'invoke_history';

//
const kGoWhere = 'go_where';

// the info save to local storage [ChannelList].
var channelInfo;

/**
 * The lastest channel
 */
var lastestChannel = '';

/**
 * a channel that had funding btc.
 */
var channelHadBtcData = '';

/**
 * timer for enable flash text.
 */
var timer1, timer2;


////////////////////////////////
// Functions are here

// FOR TESTING , WILL BE DELETED.
function testSignP2SH() {

    let txhex    = '0200000002922eb906431e0920ad1b40d1bbc877cc10a9e366d18f1a0eefe035ec877f49c800000000930000483045022100b10b4e4290426b72a40e0cdd70bded855331fbe4d4f6b7e4449b7dd019a0814d022017280b6e50bc9ae5b2b5c370593ea75ac58d34efed7e51fecfb3528a62af2daa0147522102212af74a0c82d640fdf32ac045a04b4f0d35bbb2245a6ab27babdfe7a2dfcbb021027a6f5270e8fb897f70b35f15bfb648deabbc5b92af2c2d023aaecea5fef0c6d952aee8030000922eb906431e0920ad1b40d1bbc877cc10a9e366d18f1a0eefe035ec877f49c802000000930000483045022100d617d51fd957fb3ad9a414cfe11ef0a20f3e0f38e491da09372ddde66cc62c9d0220650e127059386ca9395c4d362176cd2c94377bc6004f0793e0a93ff464e8bd4f0147522102212af74a0c82d640fdf32ac045a04b4f0d35bbb2245a6ab27babdfe7a2dfcbb021027a6f5270e8fb897f70b35f15bfb648deabbc5b92af2c2d023aaecea5fef0c6d952aee80300000326140000000000001976a9140b060fcf9c573c6290c1e5a9de315b8eda2c3a5388ac0000000000000000166a146f6d6e6900000000000000890000000005f5e10022020000000000001976a9140b060fcf9c573c6290c1e5a9de315b8eda2c3a5388ac00000000';
    let pubkey_1 = '020cbd54b5d0cd602a161beb99fe1a8f2ed9aaaf66eec054d26a617d7df67e9ae1';
    let pubkey_2 = '027a6f5270e8fb897f70b35f15bfb648deabbc5b92af2c2d023aaecea5fef0c6d9';

    const network = btctool.bitcoin.networks.testnet;
    const tx      = btctool.bitcoin.Transaction.fromHex(txhex);
    const txb     = btctool.bitcoin.TransactionBuilder.fromTransaction(tx, network);
    const pubkeys = [pubkey_1, pubkey_2].map(hex => btctool.buffer.Buffer.from(hex, 'hex'));
    const p2ms    = btctool.bitcoin.payments.p2ms({ m: 2, pubkeys, network: network });
    const p2sh    = btctool.bitcoin.payments.p2sh({ redeem: p2ms,  network: network });

    // const wifs = [
    //     'cSFJQshaUe7wJxAuNSib1HjNQSpLRq7z7eCqrRueo2eB4otAitng',
    //     'cSZyhSTKfXFLY42t9oBrrgxs2DQdoMsJu44inLk4ToNhFNLr9QWP',
    // ].map((wif) => btctool.bitcoin.ECPair.fromWIF(wif, network));

    // testing
    let alicePrivkey = 'cSFJQshaUe7wJxAuNSib1HjNQSpLRq7z7eCqrRueo2eB4otAitng';
    let bobPrivkey   = 'cPRPRKNr7iwSCJ5d44x5kzc2xbLmsxxwRqsePrmakrrZAWRf9hkf';
    const key        = btctool.bitcoin.ECPair.fromWIF(bobPrivkey, network);

    // change to satoshi
    amount = 9248;

    // Alice sign the transaction first
    // txb.sign(0, wifs[0], p2sh.redeem.output, undefined, amount, undefined);
    txb.sign(0, key, p2sh.redeem.output, undefined, amount, undefined);
    let aliceHex = txb.buildIncomplete().toHex();
    console.info('aliceHex => ' + aliceHex);

    //----------------------------
    // Bob sign the transaction
    // txb.sign(0, wifs[1], p2sh.redeem.output, undefined, amount, undefined);
    // // txb.sign(0, key, p2sh.redeem.output, undefined, amount, undefined);
    // let toHex = txb.build().toHex();
    // console.info('testSignP2SH - toHex = ' + toHex);
}

/**
 * 
 */
async function sdkLogIn() {

    // testSignP2SH();
    // return;

    // If already logined, then return.
    if (isLogined) return;

    let mnemonic = $("#mnemonic").val();
    let e = await logIn(mnemonic);
    
    // Register event needed for listening.
    registerEvent(true);

    // a new loginning.
    mnemonicWithLogined = mnemonic;
    saveMnemonicWithLogined(mnemonicWithLogined);
    $("#logined").text(e.userPeerId);
    isLogined = true;

    displaySentMessage102001(mnemonic);
    await displayMyChannelListAtTopRight(kPageSize, kPageIndex);
    afterLogin();
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
    saveGlobalMsg($("#logined").text(), newMsg);

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
        // console.info('-102003 connectP2PPeer = ' + JSON.stringify(e));
        createOBDResponseDiv(e, msgType);
    });
}

// -100032 openChannel API at local.
async function sdkOpenChannel() {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();

    let info                  = new OpenChannelInfo();
    info.funding_pubkey       = $("#funding_pubkey").val();
    info.is_private           = $("#checkbox_n32").prop("checked");
    info.funder_address_index = Number(getIndexFromPubKey(info.funding_pubkey));

    displaySentMessage100032(nodeID, userID, info);
    let e = await openChannel($("#logined").text(), nodeID, userID, info);
    afterOpenChannel(e);
}

// -100033 accept Channel API at local.
async function sdkAcceptChannel() {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();

    let info                  = new AcceptChannelInfo();
    info.temporary_channel_id = $("#temporary_channel_id").val();
    info.funding_pubkey       = $("#funding_pubkey").val();
    info.approval             = $("#checkbox_n33").prop("checked");
    info.fundee_address_index = Number(getIndexFromPubKey(info.funding_pubkey));

    displaySentMessage100033(nodeID, userID, info);
    let e = await acceptChannel($("#logined").text(), nodeID, userID, info);
    afterAcceptChannel(e);
    displayMyChannelListAtTopRight(kPageSize, kPageIndex);
}

/** 
 * -100045 forwardR API at local.
 */
async function sdkForwardR() {

    let nodeID      = $("#recipient_node_peer_id").val();
    let userID      = $("#recipient_user_peer_id").val();

    let info        = new ForwardRInfo();
    info.channel_id = $("#channel_id").val();
    info.r          = $("#r").val();

    displaySentMessage100045(nodeID, userID, info);

    let myUserID = $("#logined").text();
    let isFunder = await getIsFunder(myUserID, info.channel_id);
    let resp     = await forwardR(myUserID, nodeID, userID, info, isFunder);

    displaySentMessage100106(nodeID, userID, resp);
    afterForwardR();
}

/** 
 * -100046 signR API at local.
 */
async function sdkSignR() {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                               = new SignRInfo();
    info.channel_id                        = $("#channel_id").val();
    info.c3b_htlc_herd_complete_signed_hex = $("#c3b_htlc_herd_complete_signed_hex").val();
    info.c3b_htlc_hebr_partial_signed_hex  = $("#c3b_htlc_hebr_partial_signed_hex").val();

    displaySentMessage100046(nodeID, userID, info);

    let myUserID = $("#logined").text();
    let isFunder = await getIsFunder(myUserID, info.channel_id);
    await signR(myUserID, nodeID, userID, info, isFunder);

    afterSignR();
}

/** 
 * -100049 closeHTLC API at local.
 */
async function sdkCloseHTLC() {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                                         = new CloseHtlcTxInfo();
    info.channel_id                                  = $("#channel_id").val();
    info.last_rsmc_temp_address_private_key          = $("#last_rsmc_temp_address_private_key").val();
    info.last_htlc_temp_address_private_key          = $("#last_htlc_temp_address_private_key").val();
    info.last_htlc_temp_address_for_htnx_private_key = $("#last_htlc_temp_address_for_htnx_private_key").val();
    info.curr_temp_address_pub_key                   = $("#curr_temp_address_pub_key").val();
    info.curr_temp_address_index                     = Number(getIndexFromPubKey(info.curr_temp_address_pub_key));

    displaySentMessage100049(nodeID, userID, info);

    let myUserID = $("#logined").text();
    let isFunder = await getIsFunder(myUserID, info.channel_id);
    let resp     = await closeHTLC(myUserID, nodeID, userID, info, isFunder);

    displaySentMessage100110(nodeID, userID, resp);
    afterCloseHTLC();
}

/** 
 * -100050 closeHTLCSigned API at local.
 */
async function sdkCloseHTLCSigned() {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                                         = new CloseHtlcTxInfoSigned();
    info.msg_hash                                    = $("#msg_hash").val();
    info.last_rsmc_temp_address_private_key          = $("#last_rsmc_temp_address_private_key").val();
    info.last_htlc_temp_address_private_key          = $("#last_htlc_temp_address_private_key").val();
    info.last_htlc_temp_address_for_htnx_private_key = $("#last_htlc_temp_address_for_htnx_private_key").val();
    info.curr_temp_address_pub_key                   = $("#curr_temp_address_pub_key").val();
    info.c4a_rsmc_complete_signed_hex                = $("#c4a_rsmc_complete_signed_hex").val();
    info.c4a_counterparty_complete_signed_hex        = $("#c4a_counterparty_complete_signed_hex").val();
    info.curr_temp_address_index                     = Number(getIndexFromPubKey(info.curr_temp_address_pub_key));

    displaySentMessage100050(nodeID, userID, info);

    let myUserID = $("#logined").text();
    let isFunder = await getIsFunder(myUserID, $("#curr_channel_id").text());
    let resp     = await closeHTLCSigned(myUserID, nodeID, userID, info, isFunder);

    displaySentMessage100111(nodeID, userID, resp);
}

/** 
 * -100080 atomicSwap API at local.
 */
async function sdkAtomicSwap() {

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

    displaySentMessage100080(nodeID, userID, info);

    let myUserID = $("#logined").text();
    let isFunder = await getIsFunder(myUserID, $("#curr_channel_id").text());
    await atomicSwap(myUserID, nodeID, userID, info, isFunder);

    afterAtomicSwap();
}

/** 
 * -100081 atomicSwapAccepted API at local.
 */
async function sdkAcceptSwap() {

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

    displaySentMessage100081(nodeID, userID, info);

    let myUserID = $("#logined").text();
    let isFunder = await getIsFunder(myUserID, $("#curr_channel_id").text());
    await acceptSwap(myUserID, nodeID, userID, info, isFunder);

    afterAcceptSwap();
}

/** 
 * -100038 closeChannel API at local.
 */
async function sdkCloseChannel() {

    let nodeID     = $("#recipient_node_peer_id").val();
    let userID     = $("#recipient_user_peer_id").val();
    let channel_id = $("#channel_id").val();

    displaySentMessage100038(nodeID, userID, channel_id);
    
    let myUserID = $("#logined").text();
    let isFunder = await getIsFunder(myUserID, channel_id);
    await closeChannel(myUserID, nodeID, userID, channel_id, isFunder);

    afterCloseChannel();
}

/** 
 * -100039 closeChannelSigned API at local.
 */
async function sdkCloseChannelSigned() {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                        = new CloseChannelSign();
    info.channel_id                 = $("#channel_id").val();
    info.request_close_channel_hash = $("#request_close_channel_hash").val();
    info.approval                   = $("#checkbox_n39").prop("checked");

    displaySentMessage100039(nodeID, userID, info);

    let myUserID = $("#logined").text();
    let isFunder = await getIsFunder(myUserID, info.channel_id);
    await closeChannelSigned(myUserID, nodeID, userID, info, isFunder);

    afterCloseChannelSigned();
}

/** 
 * MsgType_Core_Omni_Getbalance_2112
 * getAllBalancesForAddress API at local.
 */
function sdkGetAllBalancesForAddress() {
    let address = $("#address").val();
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

    issueFixedAmount(info);
    displaySentMessage102113(info);
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

    issueManagedAmout(info);
    displaySentMessage102114(info);
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

    sendGrant(info);
    displaySentMessage102115(info);
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

    sendRevoke(info);
    displaySentMessage102116(info);
}

/** 
 * -102117 listProperties API at local.
 */
function sdkListProperties() {
    listProperties();
}

/** 
 * -102118 getTransaction API at local.
 */
function sdkGetTransaction() {
    let txid = $("#txid").val();
    getTransaction(txid);
}

/** 
 * -102119 getProperty API at local.
 */
function sdkGetProperty() {
    let propertyId = $("#PropertyID").val();
    getProperty(propertyId);
}

/** 
 * -103154 GetChannelDetailFromChannelID API at local.
 */
function sdkGetChannelDetailFromChannelID() {
    let channel_id = $("#channel_id").val();
    getChannelDetailFromChannelID(channel_id);
}

/** 
 * -103155 getChannelDetailFromDatabaseID API at local.
 */
function sdkGetChannelDetailFromDatabaseID() {
    let id = $("#id").val();
    getChannelDetailFromDatabaseID(id);
}

/** 
 * -103150 getMyChannels API at local.
 */
function sdkGetMyChannels() {
    getMyChannels();
}

/** 
 * -103200 GetAllCommitmentTransactions API at local.
 */
function sdkGetAllCommitmentTransactions() {
    let channel_id = $("#channel_id").val();
    getAllCommitmentTransactions(channel_id);
}

/** 
 * -103203 getLatestCommitmentTransaction API at local.
 */
function sdkGetLatestCommitmentTransaction() {
    let channel_id = $("#channel_id").val();
    getLatestCommitmentTransaction(channel_id);    
}

/** 
 * -103204 getLatestRevockableDeliveryTransaction API at local.
 */
function sdkGetLatestRevockableDeliveryTransaction() {
    let channel_id = $("#channel_id").val();
    getLatestRevockableDeliveryTransaction(channel_id);    
}

/** 
 * -103205 getLatestBreachRemedyTransaction API at local.
 */
function sdkGetLatestBreachRemedyTransaction() {
    let channel_id = $("#channel_id").val();
    getLatestBreachRemedyTransaction(channel_id);    
}

/** 
 * -103207 getAllRevockableDeliveryTransactions API at local.
 */
function sdkGetAllRevockableDeliveryTransactions() {
    let channel_id = $("#channel_id").val();
    getAllRevockableDeliveryTransactions(channel_id);    
}

/** 
 * -103208 getAllBRTx API at local.
 */
function sdkGetAllBreachRemedyTransactions() {
    let channel_id = $("#channel_id").val();
    getAllBreachRemedyTransactions(channel_id); 
}

// -100340 BTC Funding Created API at local.
async function sdkBitcoinFundingCreated() {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                  = new FundingBtcCreated();
    info.temporary_channel_id = $("#temporary_channel_id").val();
    info.funding_tx_hex       = $("#funding_tx_hex").val();

    displaySentMessage100340(nodeID, userID, info);
    let resp = await bitcoinFundingCreated($("#logined").text(), nodeID, userID, info);
    if (resp != true) {
        displaySentMessage100341(nodeID, userID, resp);
    }
    afterBitcoinFundingCreated();
}

// -100350 BTC Funding Signed API at local.
async function sdkBitcoinFundingSigned() {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                  = new FundingBtcSigned();
    info.temporary_channel_id = $("#temporary_channel_id").val();
    info.funding_txid         = $("#funding_txid").val();
    info.signed_miner_redeem_transaction_hex = $("#signed_miner_redeem_transaction_hex").val();
    info.approval             = $("#checkbox_n3500").prop("checked");

    displaySentMessage100350(nodeID, userID, info);
    await bitcoinFundingSigned($("#logined").text(), nodeID, userID, info);
    afterBitcoinFundingSigned(info.temporary_channel_id);
}

// -100034 Omni Asset Funding Created API at local.
async function sdkAssetFundingCreated() {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();
    let tempKey = $("#temp_address_private_key").val();

    let info                  = new AssetFundingCreatedInfo();
    info.temporary_channel_id = $("#temporary_channel_id").val();
    info.funding_tx_hex       = $("#funding_tx_hex").val();
    info.temp_address_pub_key = $("#temp_address_pub_key").val();
    info.temp_address_index   = Number(getIndexFromPubKey(info.temp_address_pub_key));

    displaySentMessage100034(nodeID, userID, info);
    let resp = await assetFundingCreated($("#logined").text(), nodeID, userID, info, tempKey);
    displaySentMessage101034(nodeID, userID, resp);
    afterAssetFundingCreated();
}

// -100035 Omni Asset Funding Signed API at local.
async function sdkAssetFundingSigned() {

    let nodeID = $("#recipient_node_peer_id").val();
    let userID = $("#recipient_user_peer_id").val();

    let info                   = new AssetFundingSignedInfo();
    info.temporary_channel_id  = $("#temporary_channel_id").val();
    info.signed_alice_rsmc_hex = $("#signed_alice_rsmc_hex").val();

    disableInvokeAPI();
    tipsOnTop('', kProcessing);

    displaySentMessage100035(nodeID, userID, info);
    let resp = await assetFundingSigned($("#logined").text(), nodeID, userID, info);
    displaySentMessage101035(nodeID, userID, resp.info1035);

    afterAssetFundingSigned(resp.resp1035);
    displayMyChannelListAtTopRight(kPageSize, kPageIndex);
}

// -102109 funding BTC API at local.
async function sdkFundingBitcoin() {

    let info          = new BtcFundingInfo();
    info.from_address = $("#from_address").val();
    info.to_address   = $("#to_address").val();
    info.amount       = Number($("#amount").val());
    info.miner_fee    = Number($("#miner_fee").val());

    displaySentMessage102109(info);
    await fundingBitcoin($("#logined").text(), info);
    afterFundingBitcoin();
}

//  -102120 funding Omni Asset API at local.
async function sdkFundingAsset() {

    let info          = new OmniFundingAssetInfo();
    info.from_address = $("#from_address").val();
    info.to_address   = $("#to_address").val();
    info.amount       = Number($("#amount").val());
    info.property_id  = Number($("#property_id").val());

    displaySentMessage102120(info);
    await fundingAsset($("#logined").text(), info);
    afterFundingAsset();
}

// -100402 create Invoice API at local.
function sdkAddInvoice() {

    let info         = new InvoiceInfo();
    info.property_id = Number($("#property_id").val());
    info.amount      = Number($("#amount").val());
    info.h           = $("#h").val();
    info.expiry_time = $("#expiry_time").val();
    info.description = $("#description").val();
    info.is_private  = $("#checkbox_n402").prop("checked");

    displaySentMessage100402(info);
    addInvoice(info, function(e) {
        // console.info('-100402 sdkAddInvoice = ' + JSON.stringify(e));
        makeQRCode(e);
    });
}

/**
 * automatically transfer asset to counterparty
 */
async function payInvoice() {

    let myUserID   = $("#logined").text();
    let channel_id = $("#curr_channel_id").text();

    // Step 1: HTLCFindPath
    let info     = new HTLCFindPathInfo();
    info.invoice = $("#invoice").val();
    
    displaySentMessage100401(info, true);
    let e    = await HTLCFindPath(info);
    let path = e.routing_packet.split(',');
    if (channel_id != path[0]) {
        // Using new channel to process htlc.
        $("#curr_channel_id").text(path[0]);
        channel_id = path[0];
    }
    
    disableInvokeAPI();
    tipsOnTop('', kPayInvoice);
    savePayInvoiceCase('Yes');

    // Step 2: addHTLC
    let resp = await payInvoiceStep2(e, myUserID, channel_id);
    displaySentMessage100040(resp.nodeID, resp.userID, resp.info40, resp.privkey);
    displaySentMessage100100(resp.nodeID, resp.userID, resp.info100);
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

// -100040 addHTLC API at local.
async function sdkAddHTLC() {

    let nodeID  = $("#recipient_node_peer_id").val();
    let userID  = $("#recipient_user_peer_id").val();

    let info                                     = new addHTLCInfo();
    info.recipient_user_peer_id                  = userID;
    // info.property_id                          = Number($("#property_id").val());
    info.amount                                  = Number($("#amount").val());
    info.amount_to_payee                         = Number(getHTLCPathData().amount);
    info.memo                                    = $("#memo").val();
    info.h                                       = $("#h").val();
    info.routing_packet                          = $("#routing_packet").val();
    info.cltv_expiry                             = Number($("#cltv_expiry").val());
    info.curr_rsmc_temp_address_pub_key          = $("#curr_rsmc_temp_address_pub_key").val();
    info.curr_htlc_temp_address_pub_key          = $("#curr_htlc_temp_address_pub_key").val();
    info.curr_htlc_temp_address_for_ht1a_pub_key = $("#curr_htlc_temp_address_for_ht1a_pub_key").val();
    info.last_temp_address_private_key           = $("#last_temp_address_private_key").val();
    
    // Save address index to OBD and can get private key back if lose it.
    info.curr_rsmc_temp_address_index          = Number(getIndexFromPubKey(info.curr_rsmc_temp_address_pub_key));
    info.curr_htlc_temp_address_index          = Number(getIndexFromPubKey(info.curr_htlc_temp_address_pub_key));
    info.curr_htlc_temp_address_for_ht1a_index = Number(getIndexFromPubKey(info.curr_htlc_temp_address_for_ht1a_pub_key));

    displaySentMessage100040(nodeID, userID, info);

    let myUserID = $("#logined").text();
    let isFunder = await getIsFunder(myUserID, $("#curr_channel_id").text());
    let resp     = await addHTLC(myUserID, nodeID, userID, info, isFunder);
    displaySentMessage100100(nodeID, userID, resp);
    afterAddHTLC();
}

// -100041 htlcSigned API at local.
async function sdkHTLCSigned() {

    let myUserID = $("#logined").text();
    let nodeID   = $("#recipient_node_peer_id").val();
    let userID   = $("#recipient_user_peer_id").val();

    let info                                  = new HtlcSignedInfo();
    info.payer_commitment_tx_hash             = $("#payer_commitment_tx_hash").val();
    info.curr_rsmc_temp_address_pub_key       = $("#curr_rsmc_temp_address_pub_key").val();
    info.curr_htlc_temp_address_pub_key       = $("#curr_htlc_temp_address_pub_key").val();
    info.last_temp_address_private_key        = $("#last_temp_address_private_key").val();
    info.c3a_complete_signed_rsmc_hex         = $("#c3a_complete_signed_rsmc_hex").val();
    info.c3a_complete_signed_counterparty_hex = $("#c3a_complete_signed_counterparty_hex").val();
    info.c3a_complete_signed_htlc_hex         = $("#c3a_complete_signed_htlc_hex").val();

    // Save address index to OBD and can get private key back if lose it.
    info.curr_rsmc_temp_address_index = Number(getIndexFromPubKey(info.curr_rsmc_temp_address_pub_key));
    info.curr_htlc_temp_address_index = Number(getIndexFromPubKey(info.curr_htlc_temp_address_pub_key));

    displaySentMessage100041(nodeID, userID, info);
    let resp = await HTLCSigned(myUserID, nodeID, userID, info);
    displaySentMessage100101(nodeID, userID, resp);
}

// -100401 
async function sdkHTLCFindPath() {

    let info     = new HTLCFindPathInfo();
    let isInvPay = Boolean($("#n401_InvPay").prop("checked"));

    // Invoice Payment is true
    if (isInvPay === true) {
        info.invoice = $("#invoice").val();
    } else {
        info.recipient_node_peer_id = $("#recipient_node_peer_id").val();
        info.recipient_user_peer_id = $("#recipient_user_peer_id").val();
        info.property_id            = Number($("#property_id").val());
        info.amount                 = Number($("#amount").val());
        info.h                      = $("#h").val();
        info.expiry_time            = $("#expiry_time").val();
        info.description            = $("#description").val();
        info.is_private             = $("#checkbox_n401").prop("checked");
    }

    displaySentMessage100401(info, isInvPay);
    let e = await HTLCFindPath(info);

    let arrRouting = e.routing_packet.split(',');
    let get_new_id = arrRouting[0];
    let channel_id = $("#curr_channel_id").text();

    if (channel_id != get_new_id) {
        let resp = confirm(k100401);
        if (resp === true) { // clicked OK buttoin
            $("#curr_channel_id").text(get_new_id);
            afterHTLCFindPath();
        } else {
            tipsOnTop('', k100401_ClickCancel);
        }
    } else {
        afterHTLCFindPath();
    }
}

// -100351 Commitment Transaction Created API at local.
async function sdkCommitmentTransactionCreated() {

    let myUserID = $("#logined").text();
    let nodeID   = $("#recipient_node_peer_id").val();
    let userID   = $("#recipient_user_peer_id").val();
    let tempKey  = $("#curr_temp_address_private_key").val();

    let info                           = new CommitmentTx();
    info.channel_id                    = $("#channel_id").val();
    info.amount                        = Number($("#amount").val());
    info.curr_temp_address_pub_key     = $("#curr_temp_address_pub_key").val();
    info.last_temp_address_private_key = $("#last_temp_address_private_key").val();
    info.curr_temp_address_index       = Number(getIndexFromPubKey(info.curr_temp_address_pub_key));
    
    displaySentMessage100351(nodeID, userID, info);

    let isFunder = await getIsFunder(myUserID, info.channel_id);
    let resp     = await commitmentTransactionCreated(myUserID, nodeID, userID, 
        info, isFunder, tempKey);

    displaySentMessage100360(nodeID, userID, resp);
    afterCommitmentTransactionCreated();
}

// -100352 Revoke and Acknowledge Commitment Transaction API at local.
async function sdkCommitmentTransactionAccepted() {

    let myUserID = $("#logined").text();
    let nodeID   = $("#recipient_node_peer_id").val();
    let userID   = $("#recipient_user_peer_id").val();
    let tempKey  = $("#curr_temp_address_private_key").val();

    let info                           = new CommitmentTxSigned();
    info.channel_id                    = $("#channel_id").val();
    info.msg_hash                      = $("#msg_hash").val();
    info.c2a_rsmc_signed_hex           = $("#c2a_rsmc_signed_hex").val();
    info.c2a_counterparty_signed_hex   = $("#c2a_counterparty_signed_hex").val();
    info.curr_temp_address_pub_key     = $("#curr_temp_address_pub_key").val();
    info.last_temp_address_private_key = $("#last_temp_address_private_key").val();
    info.approval                      = $("#checkbox_n352").prop("checked");
    info.curr_temp_address_index       = Number(getIndexFromPubKey(info.curr_temp_address_pub_key));
    
    displaySentMessage100352(nodeID, userID, info);

    let isFunder = await getIsFunder(myUserID, info.channel_id);
    let resp     = await commitmentTransactionAccepted(myUserID, nodeID, userID, 
        info, isFunder, tempKey);

    displaySentMessage100361(nodeID, userID, resp);
}

// Invoke each APIs.
function invokeAPIs(obj) {

    let msgType = Number(obj.getAttribute('type_id'));
    // console.info('type_id = ' + msgType);

    switch (msgType) {
        case -10: // payInvoice is a local solution.
            payInvoice();
            break;
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
            sdkGetMyChannels();
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
            sdkHTLCFindPath();
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
            // console.info(msgType + " do not exist");
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
    // console.info("broadcast info:", JSON.stringify(content));

    // For Save all broadcast info to IndexedDB
    let user_id = $("#logined").text();
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
    saveGlobalMsg(user_id, newMsg);

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
    let jsonFile = "json/util_list.json";
    let divName  = "#util_list";

    createLeftSideMenu(jsonFile, divName);
}

// getAPIList
function getAPIList() {
    let jsonFile = "json/api_list.json";
    let divName  = "#api_list";

    createLeftSideMenu(jsonFile, divName);
}

// 
function getManageAssetList() {
    let jsonFile = "json/manage_asset.json";
    let divName  = "#manage_assets_list";

    createLeftSideMenu(jsonFile, divName);
}

/**
 * 
 * @param jsonFile 
 * @param divName 
 */
function createLeftSideMenu(jsonFile, divName) {

    let apiItem, menuDiv;

    // dynamic create api_list div.
    $.getJSON(jsonFile, function(result) {
        // get [api_list] div
        let apiList = $(divName);

        for (let i = 0; i < result.data.length; i++) {
            menuDiv = document.createElement('div');
            apiItem = document.createElement('a');

            apiItem.id   = result.data[i].id;
            apiItem.href = '#';
            // apiItem.href = 'javascript:void(0);';
            apiItem.setAttribute('class', 'url');
            apiItem.setAttribute('type_id', result.data[i].type_id);
            apiItem.setAttribute('description', result.data[i].description);
            apiItem.setAttribute('onclick', 'displayAPIContent(this)');
            apiItem.innerText = result.data[i].id;

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
    createElement(newDiv, 'text', obj.getAttribute("id"), 'funcText', 'api_name');

    // create [type_id] element
    let value = " type ( " + obj.getAttribute("type_id") + " )";
    createElement(newDiv, 'text', value);

    // create [Invoke API] element
    let button = document.createElement('button');
    button.id  = 'invoke_api';
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
                autoFillValue(obj);
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
                case enumMsgType.MsgType_HTLC_Invoice_402:
                    displayApprovalCheckbox(newDiv, msgType);
                    content_div.append(newDiv);
                    break;
            }
        }
    });
}

//
async function fillCounterparty(myUserID, channel_id) {
    let result = await getCounterparty(myUserID, channel_id);
    if (result === '') return;
    $("#recipient_node_peer_id").val(result.toNodeID);
    $("#recipient_user_peer_id").val(result.toUserID);
}

/**
 * Auto fill h, routing packet, cltv expiry
 */
function fillHTLCPathData() {
    let data = getHTLCPathData();
    // $("#property_id").val(data.property_id);

    // Plus should pay htlc fee
    let payFee = getPayHtlcFee();
    let amount = Number(data.amount) + Number(payFee);
    $("#amount").val(amount);

    // let fee_in_amount = 'Fee in the amount is: ' + payFee;
    //     fee_in_amount = '  Fee rate is: ' + getHtlcFeeRate();
    $("#fee_in_amount").val(payFee);
    $("#fee_rate").val(getHtlcFeeRate());

    console.info('fillHTLCPathData payFee = ' + payFee);
    console.info('fillHTLCPathData total amount = ' + amount);

    $("#memo").val(data.memo);
    $("#h").val(data.h);
    // let arrRouting = data.routing_packet.split(',');
    $("#routing_packet").val(data.routing_packet);
    $("#cltv_expiry").val(data.min_cltv_expiry);
}

/**
 * 
 * @param {*} myUserID 
 * @param {*} channel_id 
 */
async function fillChannelIDAndFundingPrivKey(myUserID, channel_id) {
    let fundingPrivKey = await getFundingPrivKey(myUserID, channel_id);
    $("#channel_address_private_key").val(fundingPrivKey);
    $("#channel_id").val(channel_id);
}

/**
 * 
 * @param {*} myUserID 
 * @param {*} channel_id 
 */
function fillChannelFundingLastTempKeys(myUserID, channel_id) {
    fillChannelIDAndFundingPrivKey(myUserID, channel_id);
    let tempPrivKey = getTempPrivKey(myUserID, kTempPrivKey, channel_id);
    $("#last_temp_address_private_key").val(tempPrivKey);
}

//
async function fillTempChannelIDAndFundingPrivKey(myUserID, channel_id) {

    $("#temporary_channel_id").val(channel_id);
    let fundingPrivKey = await getFundingPrivKey(myUserID, channel_id);
    $("#channel_address_private_key").val(fundingPrivKey);
}

//
function fillTempAddrKey() {
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;
    $("#temp_address_pub_key").val(result.result.pubkey);
    $("#temp_address_private_key").val(result.result.wif);
    saveAddress($("#logined").text(), result);
}

//
function fillCurrTempAddrKey() {
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;
    $("#curr_temp_address_pub_key").val(result.result.pubkey);
    $("#curr_temp_address_private_key").val(result.result.wif);
    saveAddress($("#logined").text(), result);
}

//
function fillCurrRsmcTempKey() {
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;
    $("#curr_rsmc_temp_address_pub_key").val(result.result.pubkey);
    $("#curr_rsmc_temp_address_private_key").val(result.result.wif);
    saveAddress($("#logined").text(), result);
}

//
function fillCurrHtlcTempKey() {
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;
    $("#curr_htlc_temp_address_pub_key").val(result.result.pubkey);
    $("#curr_htlc_temp_address_private_key").val(result.result.wif);
    saveAddress($("#logined").text(), result);
}

//
function fillCurrHtlcHe1bTempKey() {
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;
    $("#curr_htlc_temp_address_for_he1b_pub_key").val(result.result.pubkey);
    $("#curr_htlc_temp_address_for_he1b_private_key").val(result.result.wif);
    saveAddress($("#logined").text(), result);
}

//
function fillCurrHtlcHt1aTempKey() {
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;
    $("#curr_htlc_temp_address_for_ht1a_pub_key").val(result.result.pubkey);
    $("#curr_htlc_temp_address_for_ht1a_private_key").val(result.result.wif);
    saveAddress($("#logined").text(), result);
}

//
async function fillFundingBtcData(myUserID, channel_id, status) {

    let result = await getFundingBtcData(myUserID, channel_id);
    $("#from_address").val(result.from_address);
    $("#from_address_private_key").val(result.from_address_private_key);
    // auto fill amount
    autoCalcAmount();
    // $("#amount").val(result.amount);
    $("#miner_fee").val(result.miner_fee);
    
    if (status != kStatusAcceptChannel) {
        $("#to_address").val(await getChannelAddr(channel_id));
    }
}

//
async function fillFundingAssetData(myUserID, channel_id) {

    let result = await getFundingBtcData(myUserID, channel_id);
    $("#from_address").val(result.from_address);
    $("#from_address_private_key").val(result.from_address_private_key);
    $("#to_address").val(await getChannelAddr(channel_id));
}

/**
 * 
 * @param {*} status 
 * @param {*} isFunder 
 * @param {*} myUserID 
 * @param {*} channel_id 
 */
async function changeInvokeAPIEnable(status, isFunder, myUserID, channel_id) {

    let data, date;
    let api_name = $("#api_name").text();
    // console.info('changeInvokeAPIEnable api_name = ' + api_name);

    switch (api_name) {
        case 'logIn':
            if (isLogined) { // loged in
                disableInvokeAPI();
            }
            break;
        case 'connectP2PPeer':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
            }
            break;
        case 'openChannel':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
            }

            // Data of lastest channel
            fillCounterparty(myUserID, lastestChannel);
            break;

        case 'acceptChannel':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusOpenChannel) {
                // Only channel status is openChannel, the Invoke API button is enable.
                disableInvokeAPI();
                break;
            }

            if (isFunder === true) { // Is Alice
                disableInvokeAPI();
            } else if (isFunder === false) { // Is Bob
                enableInvokeAPI();
                fillCounterparty(myUserID, channel_id);
                $("#temporary_channel_id").val(channel_id);
            }
            break;

        case 'fundingBitcoin':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusAcceptChannel && 
                       status != kStatusFirstBitcoinFundingSigned &&
                       status != kStatusSecondBitcoinFundingSigned   ) {
                disableInvokeAPI();
                break;
            }

            if (isFunder === false) { // Is Bob
                disableInvokeAPI();
            } else if (isFunder === true) { // Is Alice
                enableInvokeAPI();
                if (status === kStatusAcceptChannel) { // First fundingBitcoin
                    fillFundingBtcData(myUserID, channelHadBtcData, status);
                    $("#to_address").val(await getChannelAddr(channel_id));
                } else {
                    fillFundingBtcData(myUserID, channel_id);
                }
            }
            break;

        case 'bitcoinFundingCreated':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusFirstFundingBitcoin && 
                       status != kStatusSecondFundingBitcoin &&
                       status != kStatusThirdFundingBitcoin   ) {
                disableInvokeAPI();
                break;
            }

            if (isFunder === false) { // Is Bob
                disableInvokeAPI();
            } else if (isFunder === true) { // Is Alice
                enableInvokeAPI();
                fillCounterparty(myUserID, channel_id);
                fillTempChannelIDAndFundingPrivKey(myUserID, channel_id);
                data = await getTempData(myUserID, channel_id);
                $("#funding_tx_hex").val(data);
            }
            break;

        case 'bitcoinFundingSigned':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusFirstBitcoinFundingCreated && 
                       status != kStatusSecondBitcoinFundingCreated &&
                       status != kStatusThirdBitcoinFundingCreated   ) {
                disableInvokeAPI();
                break;
            }

            if (isFunder === true) { // Is Alice
                disableInvokeAPI();
            } else if (isFunder === false) { // Is Bob
                enableInvokeAPI();
                fillCounterparty(myUserID, channel_id);
                fillTempChannelIDAndFundingPrivKey(myUserID, channel_id);
                data = await getTempData(myUserID, channel_id);
                $("#funding_txid").val(data);
                data = await getSignedHex(myUserID, channel_id, kTbSignedHex);
                $("#signed_miner_redeem_transaction_hex").val(data);
            }
            break;

        case 'fundingAsset':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusThirdBitcoinFundingSigned) {
                // Only channel status is funding bitcoin completed, 
                // the Invoke API button is enable.
                disableInvokeAPI();
                break;
            }

            if (isFunder === false) { // Is Bob
                disableInvokeAPI();
            } else if (isFunder === true) { // Is Alice
                enableInvokeAPI();
                fillFundingAssetData(myUserID, channel_id);
            }
            break;

        case 'assetFundingCreated':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusFundingAsset) {
                disableInvokeAPI();
                break;
            }

            if (isFunder === false) { // Is Bob
                disableInvokeAPI();
            } else if (isFunder === true) { // Is Alice
                enableInvokeAPI();
                fillCounterparty(myUserID, channel_id);
                fillTempChannelIDAndFundingPrivKey(myUserID, channel_id);
                fillTempAddrKey();
                data = await getTempData(myUserID, channel_id);
                $("#funding_tx_hex").val(data);
            }
            break;

        case 'assetFundingSigned':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusAssetFundingCreated) {
                disableInvokeAPI();
                break;
            }

            if (isFunder === true) { // Is Alice
                disableInvokeAPI();
            } else if (isFunder === false) { // Is Bob
                enableInvokeAPI();
                fillCounterparty(myUserID, channel_id);
                fillTempChannelIDAndFundingPrivKey(myUserID, channel_id);
                data = await getSignedHex(myUserID, channel_id, kTbSignedHex);
                $("#signed_alice_rsmc_hex").val(data);
            }
            break;

        case 'commitmentTransactionCreated':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status < kStatusAssetFundingSigned) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);
            fillChannelFundingLastTempKeys(myUserID, channel_id);
            fillCurrTempAddrKey();
            break;

        case 'commitmentTransactionAccepted':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusCommitmentTransactionCreated) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);
            fillChannelFundingLastTempKeys(myUserID, channel_id);
            fillCurrTempAddrKey();

            data = await getTempData(myUserID, channel_id);
            $("#msg_hash").val(data);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexRR110351);
            $("#c2a_rsmc_signed_hex").val(data);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexCR110351);
            $("#c2a_counterparty_signed_hex").val(data);
            break;

        case 'addInvoice':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
            } else {
                enableInvokeAPI();

                date = new Date();
                date = date.setDate(date.getDate() + 1);
                date = new Date(date).toJSON().substr(0, 10).replace('T', ' ');
                $("#expiry_time").val(date);
                $("#expiry_time").attr("type", "date");
            }
            break;

        case 'payInvoice':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
            } else if (status < kStatusAssetFundingSigned) {
                disableInvokeAPI();
            }
            break;

        case 'HTLCFindPath':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status < kStatusAssetFundingSigned) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);

            date = new Date();
            date = date.setDate(date.getDate() + 1);
            date = new Date(date).toJSON().substr(0, 10).replace('T', ' ');
            $("#expiry_time").val(date);
            $("#expiry_time").attr("type", "date");

            break;

        case 'addHTLC':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status < kStatusAssetFundingSigned) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);
            fillHTLCPathData();
            fillChannelFundingLastTempKeys(myUserID, channel_id);
            fillCurrRsmcTempKey();
            fillCurrHtlcTempKey();
            fillCurrHtlcHt1aTempKey();

            break;

        case 'HTLCSigned':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusAddHTLC) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);
            fillChannelFundingLastTempKeys(myUserID, channel_id);
            fillCurrRsmcTempKey();
            fillCurrHtlcTempKey();

            data = await getTempData(myUserID, channel_id);
            $("#payer_commitment_tx_hash").val(data);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexCR110040);
            $("#c3a_complete_signed_counterparty_hex").val(data);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexHR110040);
            $("#c3a_complete_signed_htlc_hex").val(data);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexRR110040);
            $("#c3a_complete_signed_rsmc_hex").val(data);

            break;

        case 'forwardR':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusHTLCSigned) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);
            fillChannelIDAndFundingPrivKey(myUserID, channel_id);
            fillCurrHtlcHe1bTempKey();
            data = getPrivKeyFromPubKey(myUserID, getInvoiceH());
            $("#r").val(data);
            break;

        case 'signR':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusForwardR) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);
            fillChannelIDAndFundingPrivKey(myUserID, channel_id);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexBR110045);
            $("#c3b_htlc_hebr_partial_signed_hex").val(data);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexRD110045);
            $("#c3b_htlc_herd_complete_signed_hex").val(data);

            break;

        case 'closeHTLC':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusSignR) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);
            fillChannelIDAndFundingPrivKey(myUserID, channel_id);
            fillThreeLastPrivKey(myUserID, channel_id);
            fillCurrTempAddrKey();

            break;

        case 'closeHTLCSigned':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusCloseHTLC) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);
            fillChannelIDAndFundingPrivKey(myUserID, channel_id);
            fillThreeLastPrivKey(myUserID, channel_id);
            fillCurrTempAddrKey();

            data = await getTempData(myUserID, channel_id);
            $("#msg_hash").val(data);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexCR110040);
            $("#c4a_counterparty_complete_signed_hex").val(data);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexHR110040);
            $("#c4a_rsmc_complete_signed_hex").val(data);

            break;

        case 'closeChannel':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status < kStatusAssetFundingSigned) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);
            $("#channel_id").val(channel_id);
            break;

        case 'closeChannelSigned':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusCloseChannel) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);
            $("#channel_id").val(channel_id);
            data = await getTempData(myUserID, channel_id);
            $("#request_close_channel_hash").val(data);
            break;

        case 'atomicSwap':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status < kStatusAssetFundingSigned) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);
            $("#channel_id_from").val(channel_id);
            break;

        case 'acceptSwap':
            if (!isLogined) { // Not loged in
                disableInvokeAPI();
                break;
            } else if (status != kStatusAtomicSwap) {
                disableInvokeAPI();
                break;
            }

            enableInvokeAPI();
            fillCounterparty(myUserID, channel_id);
            $("#channel_id_from").val(channel_id);
            break;
        default:
            break;
    }
}

/**
 * 
 */
function fillThreeLastPrivKey(myUserID, channel_id) {
    let privkey_1 = getTempPrivKey(myUserID, kRsmcTempPrivKey, channel_id);
    $("#last_rsmc_temp_address_private_key").val(privkey_1);

    let privkey_2 = getTempPrivKey(myUserID, kHtlcTempPrivKey, channel_id);
    $("#last_htlc_temp_address_private_key").val(privkey_2);

    let privkey_3 = getTempPrivKey(myUserID, kHtlcHtnxTempPrivKey, channel_id);
    $("#last_htlc_temp_address_for_htnx_private_key").val(privkey_3);
}

/**
 * 
 * @param obj 
 */
async function autoFillValue(obj) {

    // get channel status
    let myUserID   = $("#logined").text();
    let channel_id = $("#curr_channel_id").text();
    let isFunder   = await getIsFunder(myUserID, channel_id);
    let status     = await getChannelStatus(channel_id, isFunder);

    changeInvokeAPIEnable(status, isFunder, myUserID, channel_id);
}

// display Approval Checkbox
function displayApprovalCheckbox(content_div, msgType) {

    if (msgType === enumMsgType.MsgType_SendChannelOpen_32 || 
        msgType === enumMsgType.MsgType_HTLC_FindPath_401  || 
        msgType === enumMsgType.MsgType_HTLC_Invoice_402) {
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
        case enumMsgType.MsgType_HTLC_Invoice_402:
            element.id = 'checkbox_n402';
            break;
    }

    element.type = 'checkbox';

    if (msgType === enumMsgType.MsgType_SendChannelOpen_32 || 
        msgType === enumMsgType.MsgType_HTLC_FindPath_401  || 
        msgType === enumMsgType.MsgType_HTLC_Invoice_402) {
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
    $("#recipient_node_peer_id").hide();
    $("#recipient_node_peer_idCou").hide();
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
        $("#recipient_node_peer_id").show();
        $("#recipient_node_peer_idCou").show();
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
                // $("#channel_address_private_key").show();
                // $("#channel_address_private_keyDis").show();
                // $("#funding_txid").show();
                // $("#funding_txidGet").show();
            } else {
                // $("#channel_address_private_key").hide();
                // $("#channel_address_private_keyDis").hide();
                // $("#funding_txid").hide();
                // $("#funding_txidGet").hide();
            }
            break;

        // case 'checkbox_n35':
        //     if (obj.checked) {
        //         $("#channel_address_private_key").show();
        //         $("#channel_address_private_keyDis").show();
        //     } else {
        //         $("#channel_address_private_key").hide();
        //         $("#channel_address_private_keyDis").hide();
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
                // $("#channel_address_private_key").show();
                // $("#channel_address_private_keyDis").show();
            } else {
                $("#curr_temp_address_pub_key").hide();
                $("#curr_temp_address_pub_keySel").hide();
                $("#curr_temp_address_private_key").hide();
                $("#curr_temp_address_private_keySel").hide();
                $("#last_temp_address_private_key").hide();
                $("#last_temp_address_private_keyDis").hide();
                // $("#channel_address_private_key").hide();
                // $("#channel_address_private_keyDis").hide();
            }
            break;

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

    let input_box, parent, div_other;
    
    for (let i = 0; i < arrParams.length; i++) {
        
        parent = document.createElement('div');
        parent.setAttribute('class', 'parent_div');

        // Show tooltip.
        if (arrParams[i].help) {
            showTooltip(arrParams[i].help, parent, arrParams[i].imgPath);
        }

        div_other = document.createElement('div');

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

        // disable the parameter.
        if (arrParams[i].disable) {
            input_box.setAttribute('class', 'input disabled');
            input_box.setAttribute('disabled', 'disabled');
        }

        div_other.append(input_box);
        createButtonOfParam(arrParams, i, div_other);
        createElement(div_other, 'p');
        parent.append(div_other);
        content_div.append(parent);
    }

    //
    if (arrParams[0].name === 'remote_node_address') {
        createElement(div_other, 'h4', 'Example:');
        createElement(div_other, 'text', '/ip4/62.234.216.108/tcp/4001/' + 
            'p2p/QmVEoTmyofsbEnsoFwQXHngafECHJuVfEgGyb2bZtyiont', 'responseText');
    }
}

// create button of parameter
function createButtonOfParam(arrParams, index, content_div) {

    let innerText, invokeFunc;
    let arrButtons = arrParams[index].buttons;

    for (let i = 0; i < arrButtons.length; i++) {
        innerText = arrButtons[i].innerText;
        invokeFunc = arrButtons[i].onclick;

        // create [button] element
        let button = document.createElement('button');
        button.id = arrParams[index].name + innerText.substring(0, 3);
        button.innerText = innerText;
        button.setAttribute('class', 'button button_small');
        button.setAttribute('onclick', invokeFunc);
        content_div.append(button);
    }
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
    scrollTo(0,0); // back to top
}

// remove name and request Div
function removeNameReqDiv() {
    $("#name_req_div").empty();
    // $("#tracker_div").empty();
    // $("#name_req_div").remove();
    // $("#tracker_div").remove();
    // var name_req_div = document.createElement('div');
    // name_req_div.id = "name_req_div";
    // $("#content").append(name_req_div);
}

// 
function removeInvokeHistoryDiv() {
    $("#invoke_history").remove();
    var div = document.createElement('div');
    div.id = "invoke_history";
    $("#menu").append(div);
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
        // console.info('SDK: sdkConnect2OBD = ' + response);

        $("#status").text("Connected");
        $("#status_tooltip").text("Connected to " + nodeAddress);
        isConnectToOBD = true; // already connected.

        createOBDResponseDiv(response, 'connect_node_resp');
        changeConnectButtonStatus();
        saveOBDConnectHistory(nodeAddress);
        $("#history_div").remove();

        tipsOnTop('', kTipsAfterConnectOBD, 'Log In', 'logIn');

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
        // console.info('sdkConnect2OBDInCustomMode = ' + response);
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
    let button = $("#button_connect");
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
        // console.info('getBtcBalance - OBD Response = ' + JSON.stringify(e));
        result = JSON.stringify(e);
        result = result.replace("\"", "").replace("\"", "");
        result = parseFloat(result);
        result = 'Balance : ' + result + ' BTC ';
        $("#" + strAddr).text(result);
    });

    // for omni assets
    obdApi.getAllBalancesForAddress(strAddr, function(e) {
        // console.info('-102112 getAllBalancesForAddress = ' + JSON.stringify(e));

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
function autoCreateAddress(param) {
    // Generate address by local js library.
    let result = sdkGenAddressFromMnemonic();
    if (result === '') return;

    switch (param) {
        case -100402:
            $("#h").val(result.result.pubkey);
            break;
        case -102109:
        case -102120:
            $("#from_address").val(result.result.address);
            // $("#from_address_private_key").val(result.result.wif);
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
        // console.info('SDK: -102006 getAmountOfRechargeBTC = ' + JSON.stringify(e));
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
            displayMyChannelList(5, 1);
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
    let parent = $("#name_req_div");
    let newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    //
    let strAddr = 'n4j37pAMNsjkTs6roKof3TGNvmPh16fvpS';
    obdApi.getAllBalancesForAddress(strAddr, function(e) {
        // console.info('-102112 displayOmniFaucet = ' + JSON.stringify(e));

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
async function displayCounterparties(param) {

    let arrData, point, title, content;;
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

    //
    let data = await getAllCounterpartyFromUserID(userID);
    if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
            createElement(newDiv, 'h3', 'NO. ' + (i + 1), 'responseText');
            arrData = [
                'NodePeerID : ' + data[i].toNodeID,
                'UserPeerID : ' + data[i].toUserID,
            ];

            for (let j = 0; j < arrData.length; j++) {
                point   = arrData[j].indexOf(':') + 1;
                title   = arrData[j].substring(0, point);
                content = arrData[j].substring(point);
                createElement(newDiv, 'text', title);
                createElement(newDiv, 'text', content, 'responseText');
                createElement(newDiv, 'p');
            }
        }

        parent.append(newDiv);
    } else {
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
        // console.info('sendCustomRequest - OBD Response = ' + JSON.stringify(e));
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
async function showLog() {
    // Receive params to new page
    let receive = window.opener["params"];
    let user_id = receive["user_id"];
    $("#log_page_logined").text(user_id);

    // console.log('Sent user_id = ' + user_id);

    await openDBInNewHtml();
    getGlobalMsg(user_id);
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
            // console.log(JSON.stringify(result));
            tableData(getWhat, result);
        },
        error: function(error) {
            // console.log('ERROR IS : ' + JSON.stringify(error));
        }
    })
}

//
function tableData(getWhat, result) {
    // console.info('getWhat = ' + getWhat);
    // console.info('total count = ' + result.totalCount);

    removeNameReqDiv();

    // table
    let tracker_div = $("#name_req_div");
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

    createElement(bottom_div, 'label', 'Total Count : ' + result.totalCount, 'margin_right');
    createElement(bottom_div, 'label', 'Page ' + result.pageNum + ' / ' + result.totalPage, 'margin_right');

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
    // console.info('previousPage = ' + previousPage);
    getTrackerData(getWhat, previousPage, 10);
}

//
function nextPage(obj) {
    let getWhat = obj.getAttribute("getWhat");
    let nextPage = Number(obj.getAttribute("pageNum")) + 1;
    // console.info('nextPage = ' + nextPage);
    getTrackerData(getWhat, nextPage, 10);
}

//
function previousPageForChannelList(obj) {
    let previousPage = Number(obj.getAttribute("pageNum")) - 1;
    displayMyChannelList(5, previousPage);
}

//
function nextPageForChannelList(obj) {
    let nextPage = Number(obj.getAttribute("pageNum")) + 1;
    displayMyChannelList(5, nextPage);
}

//
function previousPageForChannelListAtTopRight(obj) {
    let previousPage = Number(obj.getAttribute("pageNum")) - 1;
    displayMyChannelListAtTopRight(kPageSize, previousPage);
}

//
function nextPageForChannelListAtTopRight(obj) {
    let nextPage = Number(obj.getAttribute("pageNum")) + 1;
    displayMyChannelListAtTopRight(kPageSize, nextPage);
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
        saveAutoPilot('Yes');
    } else {
        saveAutoPilot('No');
    }
}

/**
 * MsgType_GetMnemonic_2004
 * This is a OBD JS API. Will be moved to obdapi.js file.
 */
function sdkGenMnemonic() {
    return genMnemonic();
}

/**
 * MsgType_Mnemonic_CreateAddress_3000
 * genAddressFromMnemonic by local js library
 */
function sdkGenAddressFromMnemonic() {
    if (!isLogined) { // Not logined
        alert('Please login first.');
        return '';
    }

    let index = getNewAddrIndex($("#logined").text());
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

    let index  = $("#index").val();
    let result = getAddressInfo(mnemonicWithLogined, index, true);
    if (result === '') return;
    createOBDResponseDiv(result, msgType);
}

/**
 * Open a new IndexedDB instance for new page.
 */
function openDBInNewHtml() {

    return new Promise((resolve, reject) => {
        let request = window.indexedDB.open('data');
        
        request.onerror = function (e) {
            // console.log('NEW PAGE DB open error!');
        };
    
        request.onsuccess = function (e) {
            // console.log('NEW PAGE DB open success!');
            db = request.result;
            resolve();
        };
    })
}

/**
 * Add a record to table GlobalMsg
 */
function saveGlobalMsg(user_id, msg) {

    let request = db.transaction([kTbGlobalMsg], 'readwrite')
        .objectStore(kTbGlobalMsg)
        .add({ user_id: user_id, msg: msg });
  
    request.onsuccess = function (e) {
        // console.log('Data write success.');
    };
  
    request.onerror = function (e) {
        // console.log('Data write false.');
    }
}

/**
 * Read data belong one user from IndexedDB
 */
function getGlobalMsg(user_id) {

    let showMsg     = '';
    let data        = [];
    let transaction = db.transaction([kTbGlobalMsg], 'readonly');
    let store       = transaction.objectStore(kTbGlobalMsg);
    let index       = store.index('user_id');
    let request     = index.get(user_id);
        request     = index.openCursor(user_id);

    request.onerror = function(e) {
        // console.log('Read data false.');
    };

    request.onsuccess = function (e) {
        let result = e.target.result;
        if (result) {
            // console.log('msg: ' + result.value.msg);
            data.push(result.value.msg);
            result.continue();
        } else {
            // console.log('global msg No More Data.');
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
 * @param privkey  channel_address_private_key
 */
function displaySentMessage100350(nodeID, userID, info, privkey) {

    if (privkey) {
    } else {
        privkey = $("#channel_address_private_key").val();
    }

    let msgSend = {
        type: -100350,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            temporary_channel_id:                info.temporary_channel_id,
            channel_address_private_key:         privkey,
            funding_txid:                        info.funding_txid,
            signed_miner_redeem_transaction_hex: info.signed_miner_redeem_transaction_hex,
            approval:                            info.approval,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100035 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID 
 * @param info 
 * @param privkey channel_address_private_key
 */
function displaySentMessage100035(nodeID, userID, info, privkey) {

    if (privkey) {
    } else {
        privkey = $("#channel_address_private_key").val();
    }

    let msgSend = {
        type: -100035,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            temporary_channel_id:        info.temporary_channel_id,
            signed_alice_rsmc_hex:       info.signed_alice_rsmc_hex,
            channel_address_private_key: privkey,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100352 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID 
 * @param info 
 * @param privkey  channel_address_private_key
 */
function displaySentMessage100352(nodeID, userID, info, privkey) {

    if (privkey) {
    } else {
        privkey = $("#channel_address_private_key").val();
    }

    let msgSend = {
        type: -100352,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                    info.channel_id,
            msg_hash:                      info.msg_hash,
            c2a_rsmc_signed_hex:           info.c2a_rsmc_signed_hex,
            c2a_counterparty_signed_hex:   info.c2a_counterparty_signed_hex,
            channel_address_private_key:   privkey,
            curr_temp_address_pub_key:     info.curr_temp_address_pub_key,
            curr_temp_address_private_key: getPrivKeyFromPubKey($("#logined").text(), 
                                    info.curr_temp_address_pub_key),
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
 * @param privkey  channel_address_private_key
 */
function displaySentMessage100041(nodeID, userID, info, privkey) {

    if (privkey) {
    } else {
        privkey = $("#channel_address_private_key").val();
    }

    let msgSend = {
        type: -100041,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            payer_commitment_tx_hash:             info.payer_commitment_tx_hash,
            c3a_complete_signed_rsmc_hex:         info.c3a_complete_signed_rsmc_hex,
            c3a_complete_signed_counterparty_hex: info.c3a_complete_signed_counterparty_hex,
            c3a_complete_signed_htlc_hex:         info.c3a_complete_signed_htlc_hex,
            channel_address_private_key:        privkey,
            curr_rsmc_temp_address_pub_key:     info.curr_rsmc_temp_address_pub_key,
            curr_rsmc_temp_address_private_key: getPrivKeyFromPubKey($("#logined").text(), 
                                        info.curr_rsmc_temp_address_pub_key),
            curr_htlc_temp_address_pub_key:     info.curr_htlc_temp_address_pub_key,
            curr_htlc_temp_address_private_key: getPrivKeyFromPubKey($("#logined").text(), 
                                        info.curr_htlc_temp_address_pub_key),
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
            channel_id:                        info.channel_id,
            c3b_htlc_herd_complete_signed_hex: info.c3b_htlc_herd_complete_signed_hex,
            c3b_htlc_hebr_partial_signed_hex:  info.c3b_htlc_hebr_partial_signed_hex,
            // msg_hash:                    info.msg_hash,
            // r:                           info.r,
            // channel_address_private_key: info.channel_address_private_key,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100050 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID 
 * @param info 
 * @param privkey  channel_address_private_key
 */
function displaySentMessage100050(nodeID, userID, info, privkey) {

    if (privkey) {
    } else {
        privkey = $("#channel_address_private_key").val();
    }

    let msgSend = {
        type: -100050,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            msg_hash:                                    info.msg_hash,
            channel_address_private_key:                 privkey,
            last_rsmc_temp_address_private_key:          info.last_rsmc_temp_address_private_key,
            last_htlc_temp_address_private_key:          info.last_htlc_temp_address_private_key,
            last_htlc_temp_address_for_htnx_private_key: info.last_htlc_temp_address_for_htnx_private_key,
            curr_temp_address_pub_key:                   info.curr_temp_address_pub_key,
            curr_temp_address_private_key:               getPrivKeyFromPubKey($("#logined").text(), 
                    info.curr_temp_address_pub_key),
            c4a_rsmc_complete_signed_hex:                info.c4a_rsmc_complete_signed_hex,
            c4a_counterparty_complete_signed_hex:        info.c4a_counterparty_complete_signed_hex,
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
            from_address_private_key: $("#from_address_private_key").val(),
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
            from_address_private_key: $("#from_address_private_key").val(),
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
            channel_address_private_key: $("#channel_address_private_key").val(),
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
            temp_address_private_key:    $("#temp_address_private_key").val(),
            channel_address_private_key: $("#channel_address_private_key").val(),
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
            channel_address_private_key:   $("#channel_address_private_key").val(),
            curr_temp_address_pub_key:     info.curr_temp_address_pub_key,
            curr_temp_address_private_key: $("#curr_temp_address_private_key").val(),
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
 * @param privkey  channel_address_private_key
 */
function displaySentMessage100040(nodeID, userID, info, privkey) {

    if (privkey) {
    } else {
        privkey = $("#channel_address_private_key").val();
    }

    let msgSend = {
        type: -100040,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            recipient_user_peer_id: info.recipient_user_peer_id,
            // property_id: info.property_id,
            amount: info.amount,
            memo: info.memo,
            h: info.h,
            routing_packet: info.routing_packet,
            channel_address_private_key: privkey,
            curr_rsmc_temp_address_pub_key: info.curr_rsmc_temp_address_pub_key,
            curr_rsmc_temp_address_private_key: getPrivKeyFromPubKey($("#logined").text(), 
                info.curr_rsmc_temp_address_pub_key),
            curr_htlc_temp_address_pub_key: info.curr_htlc_temp_address_pub_key,
            curr_htlc_temp_address_private_key: getPrivKeyFromPubKey($("#logined").text(), 
                info.curr_htlc_temp_address_pub_key),
            curr_htlc_temp_address_for_ht1a_pub_key: info.curr_htlc_temp_address_for_ht1a_pub_key,
            curr_htlc_temp_address_for_ht1a_private_key: getPrivKeyFromPubKey($("#logined").text(), 
                info.curr_htlc_temp_address_for_ht1a_pub_key),
            last_temp_address_private_key: info.last_temp_address_private_key,
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
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100049 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 * @param privkey  channel_address_private_key
 */
function displaySentMessage100049(nodeID, userID, info, privkey) {

    if (privkey) {
    } else {
        privkey = $("#channel_address_private_key").val();
    }

    let msgSend = {
        type: -100049,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                                  info.channel_id,
            channel_address_private_key:                 privkey,
            last_rsmc_temp_address_private_key:          info.last_rsmc_temp_address_private_key,
            last_htlc_temp_address_private_key:          info.last_htlc_temp_address_private_key,
            last_htlc_temp_address_for_htnx_private_key: info.last_htlc_temp_address_for_htnx_private_key,
            curr_temp_address_pub_key:                   info.curr_temp_address_pub_key,
            curr_temp_address_private_key:               getPrivKeyFromPubKey($("#logined").text(), 
                    info.curr_temp_address_pub_key),
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

/**
 * -102113 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage102113(info) {
    let msgSend = {
        type: -102113,
        data: {
            from_address:   info.from_address,
            name:           info.name,
            ecosystem:      info.ecosystem,
            divisible_type: info.divisible_type,
            data:           info.data,
            amount:         info.amount
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -102114 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage102114(info) {
    let msgSend = {
        type: -102114,
        data: {
            from_address:   info.from_address,
            name:           info.name,
            ecosystem:      info.ecosystem,
            divisible_type: info.divisible_type,
            data:           info.data,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -102115 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage102115(info) {
    let msgSend = {
        type: -102115,
        data: {
            from_address: info.from_address,
            property_id:  info.property_id,
            amount:       info.amount,
            memo:         info.memo,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -102116 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage102116(info) {
    let msgSend = {
        type: -102116,
        data: {
            from_address: info.from_address,
            property_id:  info.property_id,
            amount:       info.amount,
            memo:         info.memo,
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

    obdApi.sendAsset(info, function(e) {
        console.info('-102121 sendAsset = ' + JSON.stringify(e));
        $("#send_result").text('Send Result: Success! Txid is: ' + JSON.stringify(e));
    });
}

//  -102111 import an address to omni core
function importToOmniCore() {

    let address = $("#from_address").val();
    let privkey = getPrivKeyFromAddress(address);

    obdApi.importPrivKey(privkey, function(e) {
        console.info('-102111 importPrivKey = ' + JSON.stringify(e));
    });
}

/**
 * Register event needed for listening.
 * @param e 
 * @param netType true: testnet  false: mainnet
 */
async function register110032(e, netType) {
    let resp = await listening110032(e, netType);
    if (resp != true) {
        displaySentMessage100033(resp.nodeID, resp.userID, resp.info33);
        afterAcceptChannel(e);
        displayMyChannelListAtTopRight(kPageSize, kPageIndex);
    } else {
        listening110032ForGUITool(e);
    }
}

/**
 * Register event needed for listening.
 * @param e 
 */
async function register110340(e) {
    let resp = await listening110340(e);
    if (resp != true) {
        displaySentMessage100350(resp.nodeID, resp.userID, resp.info350, resp.privkey);
        afterBitcoinFundingSigned(e.temporary_channel_id);
    } else {
        listening110340ForGUITool(e);
    }
}

/**
 * Register event needed for listening.
 * @param e 
 */
async function register110034(e) {
    let resp = await listening110034(e);
    if (resp != true) {
        let nodeID = resp.nodeID;
        let userID = resp.userID;
        displaySentMessage100035(nodeID, userID, resp.info35, resp.privkey);
        displaySentMessage101035(nodeID, userID, resp.info1035);
        afterAssetFundingSigned(resp.resp1035);
        displayMyChannelListAtTopRight(kPageSize, kPageIndex);
    } else {
        listening110034ForGUITool(e);
    }
}

/**
 * Register event needed for listening.
 * @param e 
 */
async function register110035(e) {
    let resp = await listening110035(e);
    displaySentMessage101134(resp);
    listening110035ForGUITool(e);
}

/**
 * Register event needed for listening.
 * @param e 
 * @param netType true: testnet  false: mainnet
 */
async function register110351(e, netType) {
    disableInvokeAPI();
    tipsOnTop('', kProcessing);
    
    let resp  = await listening110351(e, netType);
    if (resp != true) {
        let nodeID = resp.nodeID;
        let userID = resp.userID;
        displaySentMessage100352(nodeID, userID, resp.info352);
        displaySentMessage100361(nodeID, userID, resp.info361);
    }
    listening110351ForGUITool(e);
}

/**
 * Register event needed for listening.
 * @param e 
 */
async function register110352(e) {
    let resp   = await listening110352(e);
    let nodeID = resp.nodeID;
    let userID = resp.userID;
    displaySentMessage100362(nodeID, userID, resp.info362);
    displaySentMessage100363(nodeID, userID, resp.info363);
    listening110352ForGUITool(e);
}

/**
 * Register event needed for listening.
 * @param e 
 */
async function register110353(e) {
    let resp = await listening110353(e);
    displaySentMessage100364(resp);
    afterCommitmentTransactionAccepted();
    displayMyChannelListAtTopRight(kPageSize, kPageIndex);
}

/**
 * Register event needed for listening.
 * @param e 
 * @param netType true: testnet  false: mainnet
 */
async function register110040(e, netType) {
    disableInvokeAPI();
    tipsOnTop('', kProcessing);
    
    let resp  = await listening110040(e, netType);
    if (resp != true) {
        let nodeID = resp.nodeID;
        let userID = resp.userID;
        displaySentMessage100041(nodeID, userID, resp.info41, resp.privkey);
        displaySentMessage100101(nodeID, userID, resp.info101);
    }
    listening110040ForGUITool(e);
}

/**
 * Register event needed for listening.
 * @param e 
 */
async function register110041(e) {
    let resp = await listening110041(e);
    displaySentMessage100102(resp.info102);
    displaySentMessage100103(resp.nodeID, resp.userID, resp.info103);
    listening110041ForGUITool(e);
}

/**
 * Register event needed for listening.
 * @param e 
 * @param netType true: testnet  false: mainnet
 */
async function register110042(e, netType) {
    let resp   = await listening110042(e, netType);
    let nodeID = resp.nodeID;
    let userID = resp.userID;

    displaySentMessage100104(resp.info104);
    displaySentMessage100105(nodeID, userID, resp.info105);

    // A multi-hop. Bob has NOT R. Bob is a middleman.
    if (resp.status === false) {
        // tipsOnTop('', kNotFoundR, 'Forward R', 'forwardR', 'Yes');
        tipsOnTop('', kNotFoundR);
        let data = resp.infoStep2;
        displaySentMessage100040(data.nodeID, data.userID, data.info40, data.privkey);
        displaySentMessage100100(data.nodeID, data.userID, data.info100);

    } else {
        displaySentMessage100045(nodeID, userID, resp.info45);
        displaySentMessage100106(nodeID, userID, resp.info106);
        afterForwardR();
    }
}

/**
 * Register event needed for listening.
 * @param e 
 */
async function register110045(e) {
    let resp  = await listening110045(e);
    if (resp != true) {
        let nodeID = resp.nodeID;
        let userID = resp.userID;
        displaySentMessage100046(nodeID, userID, resp.info46);
        displaySentMessage100049(nodeID, userID, resp.info49, resp.privkey);
        displaySentMessage100110(nodeID, userID, resp.info110);
    }
    listening110045ForGUITool(e);
}

/**
 * Register event needed for listening.
 * @param e 
 * @param netType true: testnet  false: mainnet
 */
async function register110049(e, netType) {
    let resp   = await listening110049(e, netType);
    let nodeID = resp.nodeID;
    let userID = resp.userID;
    displaySentMessage100050(nodeID, userID, resp.info50, resp.privkey);
    displaySentMessage100111(nodeID, userID, resp.info111);
    listening110049ForGUITool(e);
}

/**
 * Register event needed for listening.
 * @param e 
 */
async function register110050(e) {
    let resp = await listening110050(e);
    displaySentMessage100112(resp.info112);
    displaySentMessage100113(resp.nodeID, resp.userID, resp.info113);

    if (resp.status === false) { // A multi-hop
        displaySentMessage100045(resp.nodeID2, resp.userID2, resp.info45);
        displaySentMessage100106(resp.nodeID2, resp.userID2, resp.info106);
        tipsOnTop(e.channel_id, kMultiHopContinue);
    } else {
        tipsOnTop(e.channel_id, kTips110050);
    }

    displayMyChannelListAtTopRight(kPageSize, kPageIndex);
}

/**
 * Register event needed for listening.
 * @param e 
 */
async function register110051(e) {
    let resp = await listening110051(e);
    displaySentMessage100114(resp.info114);

    if (resp.status === false) { // A multi-hop
        displaySentMessage100045(resp.nodeID, resp.userID, resp.info45);
        displaySentMessage100106(resp.nodeID, resp.userID, resp.info106);
        tipsOnTop(e.channel_id, kMultiHopContinue);
    } else {
        afterCloseHTLCSigned(e);
    }

    displayMyChannelListAtTopRight(kPageSize, kPageIndex);
}

/**
 * Register event needed for listening.
 * @param netType true: testnet  false: mainnet
 */
function registerEvent(netType) {
    // auto response mode
    let msg_110032 = enumMsgType.MsgType_RecvChannelOpen_32;
    obdApi.registerEvent(msg_110032, function(e) {
        register110032(e, netType);
    });

    let msg_110033 = enumMsgType.MsgType_RecvChannelAccept_33;
    obdApi.registerEvent(msg_110033, function(e) {
        listening110033(e);
        listening110033ForGUITool(e);
    });

    // auto response mode
    let msg_110340 = enumMsgType.MsgType_FundingCreate_RecvBtcFundingCreated_340;
    obdApi.registerEvent(msg_110340, function(e) {
        register110340(e);
    });

    let msg_110350 = enumMsgType.MsgType_FundingSign_RecvBtcSign_350;
    obdApi.registerEvent(msg_110350, function(e) {
        listening110350(e);
        listening110350ForGUITool(e);
    });

    // auto response mode
    let msg_110034 = enumMsgType.MsgType_FundingCreate_RecvAssetFundingCreated_34;
    obdApi.registerEvent(msg_110034, function(e) {
        register110034(e);
    });

    // auto response mode
    let msg_110035 = enumMsgType.MsgType_FundingSign_RecvAssetFundingSigned_35;
    obdApi.registerEvent(msg_110035, function(e) {
        register110035(e);
    });

    // auto response mode
    let msg_110351 = enumMsgType.MsgType_CommitmentTx_RecvCommitmentTransactionCreated_351;
    obdApi.registerEvent(msg_110351, function(e) {
        register110351(e, netType);
    });

    // auto response mode
    let msg_110352 = enumMsgType.MsgType_CommitmentTxSigned_RecvRevokeAndAcknowledgeCommitmentTransaction_352;
    obdApi.registerEvent(msg_110352, function(e) {
        register110352(e);
    });

    // auto response mode
    let msg_110353 = enumMsgType.MsgType_ClientSign_BobC2b_Rd_353;
    obdApi.registerEvent(msg_110353, function(e) {
        register110353(e);
    });
    
    // auto response mode
    let msg_110040 = enumMsgType.MsgType_HTLC_RecvAddHTLC_40;
    obdApi.registerEvent(msg_110040, function(e) {
        register110040(e, netType);
    });
    
    // auto response mode
    let msg_110041 = enumMsgType.MsgType_HTLC_RecvAddHTLCSigned_41;
    obdApi.registerEvent(msg_110041, function(e) {
        register110041(e);
    });
    
    // auto response mode
    let msg_110042 = enumMsgType.MsgType_HTLC_BobSignC3bSubTx_42;
    obdApi.registerEvent(msg_110042, function(e) {
        register110042(e, netType);
    });
    
    // auto response mode
    let msg_110043 = enumMsgType.MsgType_HTLC_FinishTransferH_43;
    obdApi.registerEvent(msg_110043, function(e) {
        listening110043(e);
    });

    // auto response mode
    let msg_110045 = enumMsgType.MsgType_HTLC_RecvVerifyR_45;
    obdApi.registerEvent(msg_110045, function(e) {
        register110045(e);
    });

    let msg_110046 = enumMsgType.MsgType_HTLC_RecvSignVerifyR_46;
    obdApi.registerEvent(msg_110046, function(e) {
        listening110046(e);
        listening110046ForGUITool(e);
    });

    // auto response mode
    let msg_110049 = enumMsgType.MsgType_HTLC_RecvRequestCloseCurrTx_49;
    obdApi.registerEvent(msg_110049, function(e) {
        register110049(e, netType);
    });

    let msg_110050 = enumMsgType.MsgType_HTLC_RecvCloseSigned_50;
    obdApi.registerEvent(msg_110050, function(e) {
        register110050(e);
    });

    let msg_110051 = enumMsgType.MsgType_HTLC_Close_ClientSign_Bob_C4bSub_51;
    obdApi.registerEvent(msg_110051, function(e) {
        register110051(e);
    });

    // save request_close_channel_hash
    let msg_110038 = enumMsgType.MsgType_RecvCloseChannelRequest_38;
    obdApi.registerEvent(msg_110038, function(e) {
        listening110038(e);
        listening110038ForGUITool(e);
    });

    let msg_110039 = enumMsgType.MsgType_RecvCloseChannelSign_39;
    obdApi.registerEvent(msg_110039, function(e) {
        listening110039(e);
        listening110039ForGUITool(e);
    });

    let msg_110080 = enumMsgType.MsgType_Atomic_RecvSwap_80;
    obdApi.registerEvent(msg_110080, function(e) {
        listening110080(e);
        listening110080ForGUITool(e);
    });

    let msg_110081 = enumMsgType.MsgType_Atomic_RecvSwapAccept_81;
    obdApi.registerEvent(msg_110081, function(e) {
        listening110081(e);
        listening110081ForGUITool(e);
    });
}

/**
 * For GUI Tool. Display tips
 * @param e 
 */
function listening110032ForGUITool(e) {

    tipsOnTop(e.temporary_channel_id, kTips110032, 'Accept', 'acceptChannel', 'Yes');
    
    let api_name = $("#api_name").text();
    if (api_name === 'acceptChannel') {
        enableInvokeAPI();
        $("#recipient_node_peer_id").val(e.funder_node_address);
        $("#recipient_user_peer_id").val(e.funder_peer_id);
        $("#temporary_channel_id").val(e.temporary_channel_id);
    }
}

/**
 * For GUI Tool. Display tips
 */
function listening110033ForGUITool(e) {
    tipsOnTop(e.temporary_channel_id, kTips110033, 'Funding Bitcoin', 'fundingBitcoin', 'Yes');
    displayMyChannelListAtTopRight(kPageSize, kPageIndex);
}

/**
 * For GUI Tool
 * @param e 
 */
async function listening110340ForGUITool(e) {

    let isAutoMode = getAutoPilot();
    let channel_id = e.temporary_channel_id;
    let myUserID   = $("#logined").text();

    // auto mode is opening
    if (isAutoMode === 'Yes') {
        tipsOnTop(channel_id, kProcessing);
    } else { // auto mode is closed
        let status = await getChannelStatus(channel_id, false);
        // console.info('listening110340ForGUITool status = ' + status);
        switch (Number(status)) {
            case kStatusFirstBitcoinFundingCreated:
                tipsOnTop(channel_id, kTipsFirst110340, 'Confirm', 'bitcoinFundingSigned', 'Yes');
                break;
            case kStatusSecondBitcoinFundingCreated:
                tipsOnTop(channel_id, kTipsSecond110340, 'Confirm', 'bitcoinFundingSigned', 'Yes');
                break;
            case kStatusThirdBitcoinFundingCreated:
                tipsOnTop(channel_id, kTipsThird110340, 'Confirm', 'bitcoinFundingSigned', 'Yes');
                break;
        }
    
        let api_name = $("#api_name").text();
        if (api_name === 'bitcoinFundingSigned') {
            enableInvokeAPI();
            fillTempChannelIDAndFundingPrivKey(myUserID, channel_id);
    
            $("#recipient_node_peer_id").val(e.funder_node_address);
            $("#recipient_user_peer_id").val(e.funder_peer_id);
            $("#funding_txid").val(e.funding_txid);

            let data = await getSignedHex(myUserID, channel_id, kTbSignedHex);
            $("#signed_miner_redeem_transaction_hex").val(data);
        }
    }
}

/**
 * For GUI Tool
 * @param e
 */
async function listening110350ForGUITool(e) {
    let channel_id = e.temporary_channel_id;
    let status     = await getChannelStatus(channel_id, true);
    let api_name   = $("#api_name").text();
    // console.info('listening110350ForGUITool status = ' + status);

    switch (Number(status)) {
        case kStatusFirstBitcoinFundingCreated:
            tipsOnTop(channel_id, kTipsFirst110350, 'Funding Bitcoin', 'fundingBitcoin', 'Yes');
            if (api_name === 'fundingBitcoin') {
                enableInvokeAPI();
            }
            break;
        case kStatusSecondBitcoinFundingCreated:
            tipsOnTop(channel_id, kTipsSecond110350, 'Funding Bitcoin', 'fundingBitcoin', 'Yes');
            if (api_name === 'fundingBitcoin') {
                enableInvokeAPI();
            }
            break;
        case kStatusThirdFundingBitcoin:
        case kStatusThirdBitcoinFundingCreated:
            tipsOnTop(channel_id, kTipsThird110350, 'Funding Asset', 'fundingAsset', 'Yes');
            if (api_name === 'fundingAsset') {
                enableInvokeAPI();
            }
            break;
    }
}

/**
 * For GUI Tool
 */
async function listening110351ForGUITool(e) {

    let isAutoMode = getAutoPilot();

    // auto mode is opening
    if (isAutoMode === 'Yes') {
        tipsOnTop(e.channel_id, kProcessing);
    } else { // auto mode is closed
        let msg = kTips110351 + ' Transfer amount is : ' + e.amount;
        tipsOnTop(e.channel_id, msg, 'Confirm', 'commitmentTransactionAccepted', 'Yes');
    
        let myUserID   = $("#logined").text();
        let channel_id = e.channel_id;
        let api_name   = $("#api_name").text();

        if (api_name === 'commitmentTransactionAccepted') {
            enableInvokeAPI();
            fillCurrTempAddrKey();
            fillChannelFundingLastTempKeys(myUserID, channel_id);

            $("#recipient_node_peer_id").val(e.payer_node_address);
            $("#recipient_user_peer_id").val(e.payer_peer_id);
            $("#msg_hash").val(e.msg_hash);

            let data = await getSignedHex(myUserID, channel_id, kTbSignedHexRR110351);
            $("#c2a_rsmc_signed_hex").val(data);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexCR110351);
            $("#c2a_counterparty_signed_hex").val(data);
        }
    }
}

/**
 * For GUI Tool
 */
function listening110352ForGUITool(e) {
    tipsOnTop(e.channel_id, kTips110352, 'RSMC Transfer', 'commitmentTransactionCreated', 'Yes');
    displayMyChannelListAtTopRight(kPageSize, kPageIndex);

    let api_name = $("#api_name").text();
    if (api_name === 'commitmentTransactionCreated') {
        enableInvokeAPI();
        fillCounterparty($("#logined").text(), e.channel_id);
        fillChannelFundingLastTempKeys($("#logined").text(), e.channel_id);
        fillCurrTempAddrKey();
    }
}

/**
 * For GUI Tool. Display tips
 */
async function listening110034ForGUITool(e) {

    let isAutoMode = getAutoPilot();
    let channel_id = e.temporary_channel_id;

    // auto mode is opening
    if (isAutoMode === 'Yes') {
        tipsOnTop(channel_id, kProcessing);
    } else { // auto mode is closed
        tipsOnTop(channel_id, kTips110034, 'Confirm', 'assetFundingSigned', 'Yes');
    
        let api_name = $("#api_name").text();
        if (api_name === 'assetFundingSigned') {
            enableInvokeAPI();
            fillTempChannelIDAndFundingPrivKey($("#logined").text(), channel_id);
            $("#recipient_node_peer_id").val(e.funder_node_address);
            $("#recipient_user_peer_id").val(e.funder_peer_id);
            let data = await getSignedHex($("#logined").text(), channel_id, kTbSignedHex);
            $("#signed_alice_rsmc_hex").val(data);
        }
    }
}

/**
 * For GUI Tool. Display tips
 * @param e
 */
function listening110035ForGUITool(e) {
    tipsOnTop(e.channel_id, kTips110035, 'RSMC Transfer', 'commitmentTransactionCreated', 'Yes');
    displayMyChannelListAtTopRight(kPageSize, kPageIndex);
}

/**
 * For GUI Tool. Display tips
 */
async function listening110040ForGUITool(e) {

    let isInPayInvoice = getPayInvoiceCase();
    // In pay invoice case
    if (isInPayInvoice === 'Yes') {
        tipsOnTop(e.channel_id, kPayInvoice);
        return;
    }

    let isAutoMode = getAutoPilot();

    // auto mode is opening
    if (isAutoMode === 'Yes') {
        tipsOnTop(e.channel_id, kProcessing);
    } else { // auto mode is closed
        tipsOnTop(e.channel_id, kTips110040, 'Accept', 'HTLCSigned', 'Yes');
    
        let myUserID   = $("#logined").text();
        let channel_id = e.channel_id;
        let api_name   = $("#api_name").text();

        if (api_name === 'HTLCSigned') {
            enableInvokeAPI();
            fillChannelFundingLastTempKeys(myUserID, channel_id);
            fillCurrRsmcTempKey();
            fillCurrHtlcTempKey();
    
            $("#recipient_node_peer_id").val(e.payer_node_address);
            $("#recipient_user_peer_id").val(e.payer_peer_id);
            $("#payer_commitment_tx_hash").val(e.payer_commitment_tx_hash);

            let data = await getSignedHex(myUserID, channel_id, kTbSignedHexCR110040);
            $("#c3a_complete_signed_counterparty_hex").val(data);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexHR110040);
            $("#c3a_complete_signed_htlc_hex").val(data);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexRR110040);
            $("#c3a_complete_signed_rsmc_hex").val(data);
        }
    }
}

/**
 * For GUI Tool. Display tips
 */
function listening110041ForGUITool(e) {

    let isInPayInvoice = getPayInvoiceCase();
    // In pay invoice case
    if (isInPayInvoice === 'Yes') {
        tipsOnTop(e.channel_id, kPayInvoice);
        return;
    }

    tipsOnTop(e.channel_id, kTips110041);
}

/**
 * For GUI Tool. Display tips
 */
async function listening110045ForGUITool(e) {

    let isInPayInvoice = getPayInvoiceCase();
    // In pay invoice case
    if (isInPayInvoice === 'Yes') {
        tipsOnTop(e.channel_id, kPayInvoice);
        return;
    }

    let isAutoMode = getAutoPilot();

    // auto mode is opening
    if (isAutoMode === 'Yes') {
        tipsOnTop(e.channel_id, kProcessing);
    } else { // auto mode is closed
        tipsOnTop(e.channel_id, kTips110045, 'Sign R', 'signR', 'Yes');
    
        let myUserID   = $("#logined").text();
        let channel_id = e.channel_id;
        let api_name   = $("#api_name").text();

        if (api_name === 'signR') {
            enableInvokeAPI();
            fillChannelIDAndFundingPrivKey(myUserID, channel_id);
    
            $("#recipient_node_peer_id").val(e.payee_node_address);
            $("#recipient_user_peer_id").val(e.payee_peer_id);

            let data = await getSignedHex(myUserID, channel_id, kTbSignedHexBR110045);
            $("#c3b_htlc_hebr_partial_signed_hex").val(data);

            data = await getSignedHex(myUserID, channel_id, kTbSignedHexRD110045);
            $("#c3b_htlc_herd_complete_signed_hex").val(data);
        }
    }
}

/**
 * For GUI Tool. Display tips
 */
function listening110046ForGUITool(e) {
    tipsOnTop(e.channel_id, kTips110046, 'Close HTLC', 'closeHTLC');
}

/**
 * For GUI Tool. Display tips
 */
function listening110049ForGUITool(e) {
    disableInvokeAPI();
    let isInPayInvoice = getPayInvoiceCase();
    // In pay invoice case
    if (isInPayInvoice === 'Yes') {
        tipsOnTop(e.channel_id, kPayInvoice);
    } else {
        tipsOnTop(e.channel_id, kProcessing);
    }
}

/**
 * For GUI Tool. Display tips
 */
function listening110080ForGUITool(e) {

    tipsOnTop(e.channel_id, kTips110080, 'Accept', 'acceptSwap', 'Yes');

    let api_name = $("#api_name").text();
    if (api_name === 'acceptSwap') {
        enableInvokeAPI();
        fillCounterparty($("#logined").text(), e.channel_id);
        $("#channel_id_from").val(e.channel_id);
    }
}

/**
 * For GUI Tool. Display tips
 */
function listening110081ForGUITool(e) {
    tipsOnTop(e.channel_id, kTips110081);
}

/**
 * For GUI Tool. Display tips
 */
function listening110038ForGUITool(e) {

    tipsOnTop(e.channel_id, kTips110038, 'Accept', 'closeChannelSigned', 'Yes');

    let api_name = $("#api_name").text();
    if (api_name === 'closeChannelSigned') {
        enableInvokeAPI();
        fillCounterparty($("#logined").text(), e.channel_id);
        $("#channel_id").val(e.channel_id);
        $("#request_close_channel_hash").val(e.request_close_channel_hash);
    }
}

/**
 * For GUI Tool. Display tips
 */
function listening110039ForGUITool(e) {
    tipsOnTop(e.channel_id, kTips110039, 'Open Channel', 'openChannel');
}


//
function displayMyChannelList(page_size, page_index) {
    obdApi.getMyChannels(Number(page_size), Number(page_index), function(e) {
        // console.info('-103150 tableMyChannelList = ' + JSON.stringify(e));
        tableMyChannelList(e);
    });
}

function rowMyChannelList(e, i, tr) {

    if (e.data[i].channel_id === '') {
        createElement(tr, 'td', e.data[i].temporary_channel_id);
        createElement(tr, 'td', 'temp');
    } else {
        createElement(tr, 'td', e.data[i].channel_id);
        createElement(tr, 'td', 'normal');
    }

    createElement(tr, 'td', e.data[i].channel_address);
    createElement(tr, 'td', e.data[i].property_id);
    // createElement(tr, 'td', e.data[i].asset_amount);
    createElement(tr, 'td', e.data[i].balance_a);
    createElement(tr, 'td', e.data[i].balance_b);
    // createElement(tr, 'td', e.data[i].balance_htlc);
    // createElement(tr, 'td', e.data[i].btc_amount);

    // column for 'closed'
    if (e.data[i].curr_state === 21) { // channel is closed
        createElement(tr, 'td', 'Yes');
    } else {
        createElement(tr, 'td', 'No');
    }

    // if (e.data[i].channel_id === '') {  // is a temporary channel
    //     if (e.data[i].btc_funding_times === 0) {
    //         createElement(tr, 'td', '0');
    //     } else {
    //         createElement(tr, 'td', e.data[i].btc_funding_times);
    //     }
    // } else {
    //     createElement(tr, 'td', '3');
    // }

    // createElement(tr, 'td', e.data[i].is_private);

    if ( $("#logined").text() === e.data[i].peer_ida ) {
        createElement(tr, 'td', e.data[i].peer_idb);
    } else {
        createElement(tr, 'td', e.data[i].peer_ida);
    }

    // createElement(tr, 'td', e.data[i].create_at);
}

function tableMyChannelList(e) {
    
    // console.info('total count = ' + e.totalCount);

    removeNameReqDiv();

    // table
    let tracker_div = $("#name_req_div");
    let table = document.createElement('table');
    table.id = 'tracker';
    tracker_div.append(table);

    // head
    createElement(table, 'tr');
    createElement(table, 'th', 'NO', 'col_1_width');
    createElement(table, 'th', 'channel_id');
    createElement(table, 'th', 'status', 'col_3_width');
    createElement(table, 'th', 'channel_address');
    createElement(table, 'th', 'property_id', 'col_2_width');
    // createElement(table, 'th', 'asset_amount', 'col_4_width');
    createElement(table, 'th', 'balance_a', 'col_3_width');
    createElement(table, 'th', 'balance_b', 'col_3_width');
    // createElement(table, 'th', 'balance_htlc', 'col_4_width');
    // createElement(table, 'th', 'btc_amount', 'col_4_width');
    createElement(table, 'th', 'closed', 'col_3_width');
    // createElement(table, 'th', 'btc_funding_times', 'col_3_width');
    // createElement(table, 'th', 'is_private', 'col_4_width');
    // createElement(table, 'th', 'user_a', 'col_5_width');
    createElement(table, 'th', 'counterparty', 'col_5_width');
    // createElement(table, 'th', 'create_at', 'col_4_width');
    
    // row
    let iNum = (e.pageNum - 1) * 5;

    for (let i = 0; i < e.data.length; i++) {
        if (i % 2 != 0) {
            let tr = document.createElement('tr');
            tr.setAttribute('class', 'alt');
            table.append(tr);

            createElement(tr, 'td', i + 1 + iNum);
            rowMyChannelList(e, i, tr);
        } else {
            createElement(table, 'tr');
            createElement(table, 'td', i + 1 + iNum);
            rowMyChannelList(e, i, table);
        }
    }

    // total count
    let bottom_div = document.createElement('div');
    bottom_div.setAttribute('class', 'bottom_div');
    tracker_div.append(bottom_div);

    createElement(bottom_div, 'label', 'Total Count : ' + e.totalCount, 'margin_right');
    createElement(bottom_div, 'label', 'Page ' + e.pageNum + ' / ' + e.totalPage, 'margin_right');

    // previous page
    let butPrevious = document.createElement('button');
    butPrevious.setAttribute('pageNum', e.pageNum);
    butPrevious.setAttribute('class', 'button button_small');
    butPrevious.setAttribute('onclick', 'previousPageForChannelList(this)');
    butPrevious.innerText = 'Prev Page';
    bottom_div.append(butPrevious);

    if (e.pageNum === 1) {
        butPrevious.setAttribute('class', 'button_small disabled');
        butPrevious.setAttribute("disabled", "disabled");
    }

    // next page
    let butNext = document.createElement('button');
    butNext.setAttribute('pageNum', e.pageNum);
    butNext.setAttribute('class', 'button button_small');
    butNext.setAttribute('onclick', 'nextPageForChannelList(this)');
    butNext.innerText = 'Next Page';
    bottom_div.append(butNext);

    if (e.pageNum === e.totalPage) {
        butNext.setAttribute('class', 'button_small disabled');
        butNext.setAttribute("disabled", "disabled");
    }
}

/**
 *  Fix Show Top Div
 */
function fixShowTopDiv() {
    window.addEventListener('scroll', function() {
        let t = $('body, html').scrollTop();
        if (t > 0) {
            $('.header').addClass('header-active');
        } else {
            $('.header').removeClass('header-active');
        }
    })
}

//
function displayMyChannelListAtTopRight(page_size, page_index) {
    return new Promise((resolve, reject) => {
        obdApi.getMyChannels(Number(page_size), Number(page_index), function(e) {
            // console.info('-103150 tableMyChannelList = ' + JSON.stringify(e));
    
            if (e.totalCount === 0) {
                $("#div_channels").html("No Channel");
                lastestChannel = '';
                displayRefreshButton($("#div_channels"));
            } else {
                tableMyChannelListAtTopRight(e);

                // Get the lastest channel
                if (lastestChannel === '') {
                    if (e.data[0].channel_id === '') {
                        lastestChannel = e.data[0].temporary_channel_id;
                    } else {
                        lastestChannel = e.data[0].channel_id;
                    }

                    // get a channel that had funding btc.
                    for (let i = 0; i < e.data.length; i++) {
                        if (e.data[i].btc_funding_times > 0) {
                            channelHadBtcData = e.data[i].temporary_channel_id;
                            break;
                        }
                    }
                }
            }

            resolve();
        });
    })
}


function tableMyChannelListAtTopRight(e) {

    let div_channels = $("#div_channels");
    div_channels.html("");

    // table
    let table = document.createElement('table');
    table.id = 'tracker';
    div_channels.append(table);

    // head
    createElement(table, 'tr');
    createElement(table, 'th', 'NO', 'col_1_width');
    createElement(table, 'th', 'channel_id', 'col_6_width');
    createElement(table, 'th', 'status');
    // createElement(table, 'th', 'channel_address');
    // createElement(table, 'th', 'property_id', 'col_2_width');
    // createElement(table, 'th', 'asset_amount', 'col_4_width');
    createElement(table, 'th', 'balance');
    createElement(table, 'th', 'closed');
    // createElement(table, 'th', 'p_msg');
    // createElement(table, 'th', 'balance_b', 'col_3_width');
    // createElement(table, 'th', 'balance_htlc', 'col_4_width');
    // createElement(table, 'th', 'btc_amount', 'col_4_width');
    // createElement(table, 'th', 'btc_funding_times', 'col_3_width');
    // createElement(table, 'th', 'is_private', 'col_4_width');
    // createElement(table, 'th', 'user_a', 'col_5_width');
    // createElement(table, 'th', 'counterparty');
    // createElement(table, 'th', 'create_at', 'col_4_width');
    
    // row
    let iNum = (e.pageNum - 1) * 5;
    for (let i = 0; i < e.data.length; i++) {
        let tr = document.createElement('tr');
        tr.setAttribute('class', 'change_color');
        tr.setAttribute('onclick', 'getChannelIDFromTopRight(this)');

        if (e.data[i].channel_id === '') {
            tr.setAttribute('channel_id', e.data[i].temporary_channel_id);
        } else {
            tr.setAttribute('channel_id', e.data[i].channel_id);
        }

        table.append(tr);
        createElement(tr, 'td', i + 1 + iNum);
        rowMyChannelListAtTopRight(e, i, tr);
    }

    // total count
    let bottom_div = document.createElement('div');
    bottom_div.setAttribute('class', 'bottom_div');
    div_channels.append(bottom_div);

    createElement(bottom_div, 'label', 'Total Count : ' + e.totalCount, 'margin_right');
    createElement(bottom_div, 'label', 'Page ' + e.pageNum + ' / ' + e.totalPage, 'margin_right');

    createElement(bottom_div, 'br');
    createElement(bottom_div, 'br');

    // previous page
    let butPrevious = document.createElement('button');
    butPrevious.setAttribute('pageNum', e.pageNum);
    butPrevious.setAttribute('class', 'button button_small');
    butPrevious.setAttribute('onclick', 'previousPageForChannelListAtTopRight(this)');
    butPrevious.innerText = 'Prev Page';
    bottom_div.append(butPrevious);

    if (e.pageNum === 1) {
        butPrevious.setAttribute('class', 'button_small disabled');
        butPrevious.setAttribute("disabled", "disabled");
    }

    // next page
    let butNext = document.createElement('button');
    butNext.setAttribute('pageNum', e.pageNum);
    butNext.setAttribute('class', 'button button_small margin_right');
    butNext.setAttribute('onclick', 'nextPageForChannelListAtTopRight(this)');
    butNext.innerText = 'Next Page';
    bottom_div.append(butNext);

    if (e.pageNum === e.totalPage) {
        butNext.setAttribute('class', 'button_small disabled margin_right');
        butNext.setAttribute("disabled", "disabled");
    }

    // refresh button
    displayRefreshButton(bottom_div);
}

/**
 * 
 * @param bottom_div
 */
function displayRefreshButton(bottom_div) {
    let butRefresh = document.createElement('button');
    butRefresh.setAttribute('class', 'button button_small');
    butRefresh.setAttribute('onclick', 'displayMyChannelListAtTopRight(5, 1)');
    butRefresh.innerText = 'Refresh Data';
    bottom_div.append(butRefresh);
}

/**
 * 
 * @param {*} e 
 * @param {*} i 
 * @param {*} tr 
 */
function rowMyChannelListAtTopRight(e, i, tr) {

    if (e.data[i].channel_id === '') {
        createElement(tr, 'td', e.data[i].temporary_channel_id);
        createElement(tr, 'td', 'temp');
    } else {
        createElement(tr, 'td', e.data[i].channel_id);
        createElement(tr, 'td', 'normal');
    }

    // createElement(tr, 'td', e.data[i].channel_address);
    // createElement(tr, 'td', e.data[i].property_id);
    // createElement(tr, 'td', e.data[i].asset_amount);
    createElement(tr, 'td', e.data[i].balance_a);

    if (e.data[i].curr_state === 21) { // channel is closed
        createElement(tr, 'td', 'Yes');
    } else {
        createElement(tr, 'td', 'No');
    }

    // createElement(tr, 'td', '0');
    // createElement(tr, 'td', e.data[i].balance_b);
    // createElement(tr, 'td', e.data[i].balance_htlc);
    // createElement(tr, 'td', e.data[i].btc_amount);

    // if (e.data[i].channel_id === '') {  // is a temporary channel
    //     if (e.data[i].btc_funding_times === 0) {
    //         createElement(tr, 'td', '0');
    //     } else {
    //         createElement(tr, 'td', e.data[i].btc_funding_times);
    //     }
    // } else {
    //     createElement(tr, 'td', '3');
    // }

    // createElement(tr, 'td', e.data[i].is_private);

    // if ( $("#logined").text() === e.data[i].peer_ida ) {
    //     createElement(tr, 'td', e.data[i].peer_idb);
    // } else {
    //     createElement(tr, 'td', e.data[i].peer_ida);
    // }

    // createElement(tr, 'td', e.data[i].create_at);
}

/**
 * 
 */
function showWrapper() {
    $("#div_top").show();
}

/**
 * Show home page.
 */
function showHome() {
    
    $("#next_step").text(kTipsInit);
    buttonNextStep($("#button_next"), 'Connect OBD', 'displayConnectOBD()');

    let div_resp = document.createElement('div');
    div_resp.setAttribute('class', 'resp_area');

    createElement(div_resp, 'h2', 'This is home.');

    $("#name_req_div").append(div_resp);

    // back to top
    $('html,body').animate({ scrollTop:0 });
}

/**
 * 
 * @param butText 
 * @param funcClick
 */
function buttonNextStep(div, butText, funcClick) {

    let butNext = document.createElement('button');
    butNext.setAttribute('class', 'button button_small');
    butNext.setAttribute('onclick', funcClick);
    butNext.innerText = butText;
    div.append(butNext);
}

/**
 * 
 * @param apiName 
 */
function goNextStep(apiName) {

    $.getJSON('json/api_list.json', function(result) {
        for (let i = 0; i < result.data.length; i++) {
            // console.info('apiIndex = ' + i);
            if (result.data[i].id === apiName) {  // API name. Example: openChannel
                let apiItem = document.createElement('a');
                apiItem.id  = result.data[i].id;
                apiItem.setAttribute('type_id', result.data[i].type_id);
                apiItem.setAttribute('description', result.data[i].description);
                apiItem.setAttribute('onclick', 'displayAPIContent(this)');
                apiItem.innerText = result.data[i].id;
                displayAPIContent(apiItem);
                scrollTo(0,0); // back to top
                return;
            }
        }
    });
}

/**
 * 
 */
// function alreadyLogin() {

//     disableInvokeAPI();

//     let div_resp = document.createElement('div');
//     div_resp.setAttribute('class', 'resp_area');
//     createElement(div_resp, 'text', 'You have logged in.');
//     $("#name_req_div").append(div_resp);
// }

/**
 * 
 */
function disableInvokeAPI() {
    let butInvokeAPI = $("#invoke_api");
    butInvokeAPI.attr('class', 'button_big disabled');
    butInvokeAPI.attr("disabled", "disabled");
}

/**
 * 
 */
function enableInvokeAPI() {
    let butInvokeAPI = $("#invoke_api");
    butInvokeAPI.attr('class', 'button button_big');
    butInvokeAPI.attr("disabled", false);
}

/**
 * 
 */
function afterLogin() {

    disableInvokeAPI();
    tipsOnTop('No Channel', kTipsAfterLogin, 'Open Channel', 'openChannel');

    let div_resp = document.createElement('div');
    div_resp.setAttribute('class', 'resp_area');

    createElement(div_resp, 'text', kTipsAfterLogin);
    buttonNextStep(div_resp, 'Open Channel', "goNextStep('openChannel')");

    // If has existing channel then display the lastest one.
    if (lastestChannel != '') {
        createElement(div_resp, 'p', 'OR You can choose an existing channel');

        let item  = document.createElement('a');
        item.href = 'javascript:void(0);';
        item.setAttribute('onclick', 'clickLastestChannel()');
        item.innerText = lastestChannel;
        div_resp.append(item);
    }

    $("#name_req_div").append(div_resp);
}

/**
 * 
 */
function afterOpenChannel(e) {
    disableInvokeAPI();
    tipsOnTop(e.temporary_channel_id, kTipsAfterOpenChannel);
}

/**
 * 
 */
function afterAcceptChannel(e) {
    disableInvokeAPI();
    tipsOnTop(e.temporary_channel_id, kTipsAfterAcceptChannel);
}

/**
 * 
 */
function afterFundingBitcoin() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterFundingBitcoin, 'Notify Counterparty', 'bitcoinFundingCreated', 'Yes');
}

/**
 * 
 */
function afterBitcoinFundingCreated() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterBitcoinFundingCreated);
}

/**
 * 
 */
async function afterBitcoinFundingSigned(tempCID) {

    disableInvokeAPI();

    let status = await getChannelStatus(tempCID, false);
    // console.info('afterBitcoinFundingSigned status = ' + status);
    switch (Number(status)) {
        case kStatusFirstBitcoinFundingSigned:
            tipsOnTop('', kTipsFirstAfterBitcoinFundingSigned);
            break;
        case kStatusSecondBitcoinFundingSigned:
            tipsOnTop('', kTipsSecondAfterBitcoinFundingSigned);
            break;
        case kStatusThirdBitcoinFundingSigned:
            tipsOnTop('', kTipsThirdAfterBitcoinFundingSigned);
            break;
    }
}

/**
 * 
 */
function afterFundingAsset() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterFundingAsset, 'Notify Counterparty', 'assetFundingCreated', 'Yes');
}

/**
 * 
 */
function afterAssetFundingCreated() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterAssetFundingCreated);
}

/**
 * 
 */
function afterAssetFundingSigned(e) {
    disableInvokeAPI();
    tipsOnTop(e.channel_id, kTipsAfterAssetFundingSigned);
}

/**
 * 
 */
function afterCommitmentTransactionCreated() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterCommitmentTransactionCreated);
}

/**
 * 
 */
function afterCommitmentTransactionAccepted() {
    enableInvokeAPI();
    tipsOnTop('', kTipsAfterCommitmentTransactionAccepted, 'RSMC Transfer', 'commitmentTransactionCreated');
}

/**
 * 
 */
function afterHTLCFindPath() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterHTLCFindPath, 'Add HTLC', 'addHTLC', 'Yes');
}

/**
 * 
 */
function afterAddHTLC() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterAddHTLC);
}

/**
 * 
 */
function afterHTLCSigned() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterHTLCSigned, 'Forward R', 'forwardR');
}

/**
 * 
 */
function afterForwardR() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterForwardR);
}

/**
 * 
 */
function afterSignR() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterSignR, 'Close HTLC', 'closeHTLC');
}

/**
 * 
 */
function afterCloseHTLC() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterCloseHTLC);
}

/**
 * 
 */
function afterCloseHTLCSigned(e) {
    disableInvokeAPI();
    tipsOnTop(e.channel_id, kTipsAfterCloseHTLCSigned);
}

/**
 * 
 */
function afterCloseChannel() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterCloseChannel);
}

/**
 * 
 */
function afterCloseChannelSigned() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterCloseChannelSigned, 'Open Channel', 'openChannel');
}

/**
 * 
 */
function afterAtomicSwap() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterAtomicSwap);
}

/**
 * 
 */
function afterAcceptSwap() {
    disableInvokeAPI();
    tipsOnTop('', kTipsAfterAcceptSwap);
}

/**
 * Display tips on top
 * @param channelID 
 * @param tipsNextStep 
 * @param butText 
 * @param apiName 
 * @param flash Enable flash text
 */
function tipsOnTop(channelID, tipsNextStep, butText, apiName, flash) {

    if (channelID != '') {
        $("#curr_channel_id").text(channelID);
    }

    $("#next_step").text(tipsNextStep);
    $("#next_step").css("color", "black");
    clearTimeout(timer1);
    clearTimeout(timer2);
    if (flash) flashText();

    $("#button_next").empty();
    if (butText) {
        buttonNextStep($("#button_next"), butText, "goNextStep('" + apiName + "')");
    }
}

/**
 * 
 */
function flashText() {
    $("#next_step").css("color", "black");
    // $("#next_step").css({"color":"black", "font-size":"100%"});
    timer1 = setTimeout("highlightColor()", 500);
}

/**
 * 
 */
function highlightColor() {
    $("#next_step").css("color", "red");
    // $("#next_step").css({"color":"red", "font-size":"105%"});
    timer2 = setTimeout("flashText()", 500);
}

/**
 * 
 */
function clickLastestChannel() {
    // console.info('lastestChannel is --> ' + lastestChannel);
    $("#curr_channel_id").text(lastestChannel);
    switchChannel($("#logined").text(), lastestChannel);
}

/**
 * 
 * @param obj 
 */
function getChannelIDFromTopRight(obj) {

    let sel_channel_id = obj.getAttribute('channel_id');
    // console.info('the channel_id is --> ' + sel_channel_id);

    $("#div_top").hide();
    $("#curr_channel_id").text(sel_channel_id);
    switchChannel($("#logined").text(), sel_channel_id);
}

/**
 * 
 * @param myUserID 
 * @param channel_id 
 */
async function switchChannel(myUserID, channel_id) {

    let isSender = getSenderRole();
    let isFunder = await getIsFunder(myUserID, channel_id);
    let status   = await getChannelStatus(channel_id, isFunder);
    
    changeInvokeAPIEnable(status, isFunder, myUserID, channel_id);

    switch (Number(status)) {
        case kStatusOpenChannel:
            if (isFunder === true) {
                tipsOnTop('', kTipsAfterOpenChannel);
            } else {
                tipsOnTop('', kTips110032, 'Accept', 'acceptChannel');
            }
            break;
        case kStatusAcceptChannel:
            if (isFunder === true) {
                tipsOnTop('', kTips110033, 'Funding Bitcoin', 'fundingBitcoin');
            } else {
                tipsOnTop('', kTipsAfterAcceptChannel);
            }
            break;
        case kStatusFirstFundingBitcoin:
        case kStatusSecondFundingBitcoin:
        case kStatusThirdFundingBitcoin:
            tipsOnTop('', kTipsAfterFundingBitcoin, 'Notify Counterparty', 'bitcoinFundingCreated');
            break;
        case kStatusFirstBitcoinFundingCreated:
            if (isFunder === true) {
                tipsOnTop('', kTipsAfterBitcoinFundingCreated);
            } else {
                tipsOnTop('', kTipsFirst110340, 'Confirm', 'bitcoinFundingSigned');
            }
            break;
        case kStatusFirstBitcoinFundingSigned:
            if (isFunder === true) {
                tipsOnTop('', kTipsFirst110350, 'Funding Bitcoin', 'fundingBitcoin');
            } else {
                tipsOnTop('', kTipsFirstAfterBitcoinFundingSigned);
            }
            break;
        case kStatusSecondBitcoinFundingCreated:
            if (isFunder === true) {
                tipsOnTop('', kTipsAfterBitcoinFundingCreated);
            } else {
                tipsOnTop('', kTipsSecond110340, 'Confirm', 'bitcoinFundingSigned');
            }
            break;
        case kStatusSecondBitcoinFundingSigned:
            if (isFunder === true) {
                tipsOnTop('', kTipsSecond110350, 'Funding Bitcoin', 'fundingBitcoin');
            } else {
                tipsOnTop('', kTipsSecondAfterBitcoinFundingSigned);
            }
            break;
        case kStatusThirdBitcoinFundingCreated:
            if (isFunder === true) {
                tipsOnTop('', kTipsAfterBitcoinFundingCreated);
            } else {
                tipsOnTop('', kTipsThird110340, 'Confirm', 'bitcoinFundingSigned');
            }
            break;
        case kStatusThirdBitcoinFundingSigned:
            if (isFunder === true) {
                tipsOnTop('', kTipsThird110350, 'Funding Asset', 'fundingAsset');
            } else {
                tipsOnTop('', kTipsThirdAfterBitcoinFundingSigned);
            }
            break;
        case kStatusFundingAsset:
            tipsOnTop('', kTipsAfterFundingAsset, 'Notify Counterparty', 'assetFundingCreated');
            break;
        case kStatusAssetFundingCreated:
            if (isFunder === true) {
                tipsOnTop('', kTipsAfterAssetFundingCreated);
            } else {
                tipsOnTop('', kTips110034, 'Confirm', 'assetFundingSigned');
            }
            break;
        case kStatusAssetFundingSigned:
            if (isFunder === true) {
                tipsOnTop('', kTips110035, 'RSMC Transfer', 'commitmentTransactionCreated');
            } else {
                tipsOnTop('', kTipsAfterAssetFundingSigned);
            }
            break;
        case kStatusCommitmentTransactionCreated:
            if (isSender === kIsSender) {
                tipsOnTop('', kTipsAfterCommitmentTransactionCreated);
            } else {
                tipsOnTop('', kTips110351, 'Confirm', 'commitmentTransactionAccepted');
            }
            break;
        case kStatusCommitmentTransactionAccepted:
            if (isSender === kIsSender) {
                tipsOnTop('', kTips110352, 'RSMC Transfer', 'commitmentTransactionCreated');
            } else {
                tipsOnTop('', kTipsAfterCommitmentTransactionAccepted, 'RSMC Transfer', 'commitmentTransactionCreated');
            }
            break;
        case kStatusPayInvoice: // WILL BE UPDATE
            if (isFunder === true) {
            } else {
            }
            break;
        case kStatusAddHTLC:
            if (isSender === kIsSender) {
                tipsOnTop('', kTipsAfterAddHTLC);
            } else {
                tipsOnTop('', kTips110040, 'Accept', 'HTLCSigned');
            }
            break;
        case kStatusHTLCSigned:
            if (isSender === kIsSender) {
                tipsOnTop('', kTips110041);
            } else {
                tipsOnTop('', kTipsAfterHTLCSigned, 'Forward R', 'forwardR');
            }
            break;
        case kStatusForwardR:
            if (isSender === kIsSender) {
                tipsOnTop('', kTips110045, 'Sign R', 'signR');
            } else {
                tipsOnTop('', kTipsAfterForwardR);
            }
            break;
        case kStatusSignR:
            if (isSender === kIsSender) {
                tipsOnTop('', kTipsAfterSignR, 'Close HTLC', 'closeHTLC');
            } else {
                tipsOnTop('', kTips110046, 'Close HTLC', 'closeHTLC');
            }
            break;
        case kStatusCloseHTLC:
            if (isSender === kIsSender) {
                tipsOnTop('', kTipsAfterCloseHTLC);
            } else {
                tipsOnTop('', kTips110049, 'Accept', 'closeHTLCSigned');
            }
            break;
        case kStatusCloseHTLCSigned:
            if (isSender === kIsSender) {
                tipsOnTop('', kTips110050);
            } else {
                tipsOnTop('', kTipsAfterCloseHTLCSigned);
            }
            break;
        case kStatusCloseChannel:
            if (isSender === kIsSender) {
                tipsOnTop('', kTipsAfterCloseChannel);
            } else {
                tipsOnTop('', kTips110038, 'Accept', 'closeChannelSigned');
            }
            break;
        case kStatusCloseChannelSigned:
            if (isSender === kIsSender) {
                tipsOnTop('', kTips110039, 'Open Channel', 'openChannel');
            } else {
                tipsOnTop('', kTipsAfterCloseChannelSigned, 'Open Channel', 'openChannel');
            }
            break;
        case kStatusAtomicSwap:
            if (isSender === kIsSender) {
                tipsOnTop('', kTipsAfterAtomicSwap);
            } else {
                tipsOnTop('', kTips110080, 'Accept', 'acceptSwap');
            }
            break;
        case kStatusAcceptSwap:
            if (isSender === kIsSender) {
                tipsOnTop('', kTips110081);
            } else {
                tipsOnTop('', kTipsAfterAcceptSwap);
            }
            break;
        default:
            tipsOnTop('', kTipsNoLocalData);
            break;
    }
}

/**
 * -100341 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100341(nodeID, userID, info) {
    let msgSend = {
        type: -100341,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            signed_hex: info,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -101034 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage101034(nodeID, userID, info) {
    let msgSend = {
        type: -101034,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            signed_hex: info,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -101035 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage101035(nodeID, userID, info) {
    let msgSend = {
        type: -101035,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            temporary_channel_id: info.temporary_channel_id,
            br_signed_hex:        info.br_signed_hex,
            rd_signed_hex:        info.rd_signed_hex,
            br_id:                info.br_id,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -101134 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage101134(info) {
    let msgSend = {
        type: -101134,
        data: {
            channel_id:    info.channel_id,
            rd_signed_hex: info.rd_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100360 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100360(nodeID, userID, info) {
    let msgSend = {
        type: -100360,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:              info.channel_id,
            counterparty_signed_hex: info.counterparty_signed_hex,
            rsmc_signed_hex:         info.rsmc_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100361 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100361(nodeID, userID, info) {
    let msgSend = {
        type: -100361,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            c2b_rsmc_signed_hex:         info.c2b_rsmc_signed_hex,
            c2b_counterparty_signed_hex: info.c2b_counterparty_signed_hex,
            c2a_rd_signed_hex:           info.c2a_rd_signed_hex,
            c2a_br_signed_hex:           info.c2a_br_signed_hex,
            c2a_br_id:                   info.c2a_br_id,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100362 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100362(nodeID, userID, info) {
    let msgSend = {
        type: -100362,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                  info.channel_id,
            c2b_rsmc_signed_hex:         info.c2b_rsmc_signed_hex,
            c2b_counterparty_signed_hex: info.c2b_counterparty_signed_hex,
            c2a_rd_signed_hex:           info.c2a_rd_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100363 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100363(nodeID, userID, info) {
    let msgSend = {
        type: -100363,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:        info.channel_id,
            c2b_rd_signed_hex: info.c2b_rd_signed_hex,
            c2b_br_signed_hex: info.c2b_br_signed_hex,
            c2b_br_id:         info.c2b_br_id,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100364 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage100364(info) {
    let msgSend = {
        type: -100364,
        data: {
            channel_id:        info.channel_id,
            c2b_rd_signed_hex: info.c2b_rd_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100100 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100100(nodeID, userID, info) {
    let msgSend = {
        type: -100100,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                          info.channel_id,
            c3a_counterparty_partial_signed_hex: info.c3a_counterparty_partial_signed_hex,
            c3a_htlc_partial_signed_hex:         info.c3a_htlc_partial_signed_hex,
            c3a_rsmc_partial_signed_hex:         info.c3a_rsmc_partial_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100101 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100101(nodeID, userID, info) {
    let msgSend = {
        type: -100101,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                          info.channel_id,
            c3a_rsmc_rd_partial_signed_hex:      info.c3a_rsmc_rd_partial_signed_hex,
            c3a_rsmc_br_partial_signed_hex:      info.c3a_rsmc_br_partial_signed_hex,
            c3a_htlc_ht_partial_signed_hex:      info.c3a_htlc_ht_partial_signed_hex,
            c3a_htlc_hlock_partial_signed_hex:   info.c3a_htlc_hlock_partial_signed_hex,
            c3a_htlc_br_partial_signed_hex:      info.c3a_htlc_br_partial_signed_hex,
            c3b_rsmc_partial_signed_hex:         info.c3b_rsmc_partial_signed_hex,
            c3b_counterparty_partial_signed_hex: info.c3b_counterparty_partial_signed_hex,
            c3b_htlc_partial_signed_hex:         info.c3b_htlc_partial_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100102 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage100102(info) {
    let msgSend = {
        type: -100102,
        data: {
            channel_id:                           info.channel_id,
            c3a_rsmc_rd_complete_signed_hex:      info.c3a_rsmc_rd_complete_signed_hex,
            c3a_htlc_ht_complete_signed_hex:      info.c3a_htlc_ht_complete_signed_hex,
            c3a_htlc_hlock_complete_signed_hex:   info.c3a_htlc_hlock_complete_signed_hex,
            c3b_rsmc_complete_signed_hex:         info.c3b_rsmc_complete_signed_hex,
            c3b_counterparty_complete_signed_hex: info.c3b_counterparty_complete_signed_hex,
            c3b_htlc_complete_signed_hex:         info.c3b_htlc_complete_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100103 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100103(nodeID, userID, info) {
    let msgSend = {
        type: -100103,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                        info.channel_id,
            c3a_htlc_htrd_partial_signed_hex:  info.c3a_htlc_htrd_partial_signed_hex,
            c3b_rsmc_rd_partial_signed_hex:    info.c3b_rsmc_rd_partial_signed_hex,
            c3b_rsmc_br_partial_signed_hex:    info.c3b_rsmc_br_partial_signed_hex,
            c3b_htlc_htd_partial_signed_hex:   info.c3b_htlc_htd_partial_signed_hex,
            c3b_htlc_hlock_partial_signed_hex: info.c3b_htlc_hlock_partial_signed_hex,
            c3b_htlc_br_partial_signed_hex:    info.c3b_htlc_br_partial_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100102 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage100104(info) {
    let msgSend = {
        type: -100104,
        data: {
            channel_id:                            info.channel_id,
            curr_htlc_temp_address_for_he_pub_key: info.curr_htlc_temp_address_for_he_pub_key,
            curr_htlc_temp_address_for_he_index:   info.curr_htlc_temp_address_for_he_index,
            c3a_htlc_htrd_complete_signed_hex:     info.c3a_htlc_htrd_complete_signed_hex,
            c3a_htlc_htbr_partial_signed_hex:      info.c3a_htlc_htbr_partial_signed_hex,
            c3a_htlc_hed_partial_signed_hex:       info.c3a_htlc_hed_partial_signed_hex,
            c3b_rsmc_rd_complete_signed_hex:       info.c3b_rsmc_rd_complete_signed_hex,
            c3b_htlc_htd_complete_signed_hex:      info.c3b_htlc_htd_complete_signed_hex,
            c3b_htlc_hlock_complete_signed_hex:    info.c3b_htlc_hlock_complete_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100105 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100105(nodeID, userID, info) {
    let msgSend = {
        type: -100105,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                           info.channel_id,
            c3b_htlc_hlock_he_partial_signed_hex: info.c3b_htlc_hlock_he_partial_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100106 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100106(nodeID, userID, info) {
    let msgSend = {
        type: -100106,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                       info.channel_id,
            c3b_htlc_herd_partial_signed_hex: info.c3b_htlc_herd_partial_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100110 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100110(nodeID, userID, info) {
    let msgSend = {
        type: -100110,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                      info.channel_id,
            counterparty_partial_signed_hex: info.counterparty_partial_signed_hex,
            rsmc_partial_signed_hex:         info.rsmc_partial_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100111 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100111(nodeID, userID, info) {
    let msgSend = {
        type: -100111,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                  info.channel_id,
            c4a_rd_signed_hex:           info.c4a_rd_signed_hex,
            c4a_br_signed_hex:           info.c4a_br_signed_hex,
            c4a_br_id:                   info.c4a_br_id,
            c4b_rsmc_signed_hex:         info.c4b_rsmc_signed_hex,
            c4b_counterparty_signed_hex: info.c4b_counterparty_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100112 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage100112(info) {
    let msgSend = {
        type: -100112,
        data: {
            channel_id:                           info.channel_id,
            c4a_rd_complete_signed_hex:           info.c4a_rd_complete_signed_hex,
            c4b_rsmc_complete_signed_hex:         info.c4b_rsmc_complete_signed_hex,
            c4b_counterparty_complete_signed_hex: info.c4b_counterparty_complete_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100113 Display the sent message in the message box and save it to the log file
 * @param nodeID 
 * @param userID
 * @param info 
 */
function displaySentMessage100113(nodeID, userID, info) {
    let msgSend = {
        type: -100113,
        recipient_node_peer_id: nodeID,
        recipient_user_peer_id: userID,
        data: {
            channel_id:                info.channel_id,
            c4b_rd_partial_signed_hex: info.c4b_rd_partial_signed_hex,
            c4b_br_partial_signed_hex: info.c4b_br_partial_signed_hex,
            c4b_br_id:                 info.c4b_br_id,
        }
    }

    displaySentMessage(msgSend);
}

/**
 * -100114 Display the sent message in the message box and save it to the log file
 * @param info 
 */
function displaySentMessage100114(info) {
    let msgSend = {
        type: -100114,
        data: {
            channel_id:                 info.channel_id,
            c4b_rd_complete_signed_hex: info.c4b_rd_complete_signed_hex,
        }
    }

    displaySentMessage(msgSend);
}