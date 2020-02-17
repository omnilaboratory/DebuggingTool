var wsAddress = "ws://127.0.0.1:60020/ws"
var ws;

var isConnectToOBD = false;
var api = {};

api.connectToOBD = function() {
    console.info("connectToOBD", isConnectToOBD)
    if (isConnectToOBD) {
        return;
    }
    ws = new WebSocket(wsAddress);
    ws.onopen = function() {
        //当WebSocket创建成功时，触发onopen事件
        ws.send("connect obd  at first time"); //将消息发送到服务端
        isConnectToOBD = true;
    }

    ws.onmessage = function(e) {　　 //当客户端收到服务端发来的消息时，触发onmessage事件，参数e.data包含server传递过来的数据
        jsonData = JSON.parse(e.data)
        console.info("get data from obd: ", jsonData);
        if (jsonData.status == false) {
            if (jsonData.type != ApiType.MsgType_Error_0) {
                alert(jsonData.result);
            }
            return;
        }
        resultData = jsonData.result;
        console.info("data:", resultData);
        switch (jsonData.type) {
            case ApiType.MsgType_UserLogin_1:
                api.onLogin(resultData);
                break;
            case ApiType.MsgType_GetMnemonic_101:
                api.onGetMnemonic(resultData);
                break;
            case ApiType.MsgType_Core_GetNewAddress_1001:
                api.onGetNewAddressFromOmniCore(resultData);
                break;
            case ApiType.MsgType_Core_FundingBTC_1009:
                api.onFundingBTC(resultData)
                break;
            case ApiType.MsgType_Core_Omni_ListProperties_1205:
                api.onListProperties(resultData);
                break;
            case ApiType.MsgType_Core_Omni_FundingAsset_2001:
                api.onFundingAssetOfOmni(resultData);
                break;



            case ApiType.MsgType_Mnemonic_CreateAddress_N200:
                api.onCreateAddressByMnemonic(resultData);
                break;
            case ApiType.MsgType_Mnemonic_GetAddressByIndex_201:
                api.onGetAddressByIndexByMnemonic(resultData);
                break;
            case ApiType.MsgType_ChannelOpen_N32:
                api.onOpenChannel(resultData)
                break;
            case ApiType.MsgType_ChannelAccept_N33:
                api.onChannelAccept(resultData)
                break;
            case ApiType.MsgType_FundingCreate_AssetFundingCreated_N34:
                api.onChannelFundingCreated(resultData)
                break;
            case ApiType.MsgType_FundingSign_AssetFundingSigned_N35:
                api.onChannelFundingSigned(resultData)
                break;
            case ApiType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
                api.onCommitmentTransactionCreated(resultData)
                break;
            case ApiType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
                api.onRevokeAndAcknowledgeCommitmentTransaction(resultData)
                break;
            case ApiType.MsgType_HTLC_Invoice_N4003:
                api.onInvoice(resultData)
                break;
            case ApiType.MsgType_HTLC_AddHTLC_N40:
                api.onAddHtlc(resultData)
                break;
            case ApiType.MsgType_HTLC_AddHTLCSigned_N41:
                api.onAddHtlcSigned(resultData)
                break;
            case ApiType.MsgType_HTLC_FindPathAndSendH_N42:
                api.onHtlcFindPathAndSendH(resultData)
                break;
            case ApiType.MsgType_HTLC_SendH_N43:
                api.onHtlcSendH(resultData)
                break;
            case ApiType.MsgType_HTLC_SignGetH_N44:
                api.onHtlcSignGetH(resultData)
                break;
            case ApiType.MsgType_HTLC_CreateCommitmentTx_N45:
                api.onHtlcCreateCommitmentTx(resultData)
                break;
            case ApiType.MsgType_HTLC_SendR_N46:
                api.onHtlcSendR(resultData)
                break;
            case ApiType.MsgType_HTLC_VerifyR_N47:
                api.onHtlcVerifyR(resultData)
                break;
            case ApiType.MsgType_HTLC_RequestCloseCurrTx_N48:
                api.onCloseHtlcTx(resultData)
                break;
            case ApiType.MsgType_HTLC_CloseSigned_N49:
                api.onCloseHtlcTxSigned(resultData)
                break;
            default:
                break;
        }
    }

    ws.sendData = function(msg) {
        if (isConnectToOBD == false) {
            alert("please try to connect obd again")
            return;
        }
        console.info("send msg: ", msg);
        ws.send(JSON.stringify(msg));
    }
    ws.onerror = function(event) {
        console.info(event.data)
    };
    ws.onclose = function(event) {
        console.info("websocket close");
        isConnectToOBD = false;
    };
}

/* MsgType_UserLogin_1  */
var isLogin = false;

var userLoginInfo = {
    mnemonic: ""
}
api.logIn = function(userLoginInfo) {
    message.type = ApiType.MsgType_UserLogin_1
    message.data = userLoginInfo
    ws.sendData(message)
}
api.onLogin = function(jsonData) {
    isLogin = true;
}

/* MsgType_GetMnemonic_101 */
api.getMnemonic = function() {
    message.type = ApiType.MsgType_GetMnemonic_101
    ws.sendData(message)
}
api.onGetMnemonic = function(jsonData) {}

/* MsgType_Core_GetNewAddress_1001 */
api.getNewAddressFromOmniCore = function() {
    message.type = ApiType.MsgType_Core_GetNewAddress_1001
    ws.sendData(message)
}
api.onGetNewAddressFromOmniCore = function(jsonData) {}

/* MsgType_Core_FundingBTC_1009 */
var btcFundingInfo = {
    from_address: "",
    from_address_private_key: "",
    to_address: "",
    amount: 0,
    miner_fee: 0.00001
}
api.fundingBTC = function(btcFundingInfo) {
    message.type = ApiType.MsgType_Core_FundingBTC_1009
    message.data = btcFundingInfo
    ws.sendData(message);
}
api.onFundingBTC = function(jsonData) {}

/* MsgType_Core_Omni_ListProperties_1205 */
api.listProperties = function() {
    message.type = ApiType.MsgType_Core_Omni_ListProperties_1205
    ws.sendData(message)
}
api.onListProperties = function(jsonData) {}

/* MsgType_Core_Omni_FundingAsset_2001 */
var omniFundingAssetInfo = {
    from_address: "",
    from_address_private_key: "",
    to_address: "",
    property_id: 31,
    amount: 0,
    miner_fee: 0.00001
}
api.fundingAssetOfOmni = function(omniFundingAssetInfo) {
    message.type = ApiType.MsgType_Core_Omni_FundingAsset_2001
    message.data = omniFundingAssetInfo
    ws.sendData(message)
}
api.onFundingAssetOfOmni = function(jsonData) {}



/* MsgType_Mnemonic_CreateAddress_N200 */
api.createAddressByMnemonic = function() {
    message.type = ApiType.MsgType_Mnemonic_CreateAddress_N200
    ws.sendData(message)
}
api.onCreateAddressByMnemonic = function(jsonData) {}

/* MsgType_Mnemonic_GetAddressByIndex_201 */
api.getAddressByIndexByMnemonic = function(index) {
    message.type = ApiType.MsgType_Mnemonic_GetAddressByIndex_201
    message.data = index
    ws.sendData(message)
}
api.onGetAddressByIndexByMnemonic = function(jsonData) {}

/* MsgType_ChannelOpen_N32 */
var openChannelInfo = {
    funding_pubkey: "",
}
api.openChannel = function(openChannelInfo, recipient_peer_id) {
    message.type = ApiType.MsgType_ChannelOpen_N32
    message.data = openChannelInfo
    message.recipient_peer_id = recipient_peer_id
    ws.sendData(message)
}
api.onOpenChannel = function(jsonData) {}

/* MsgType_ChannelAccept_N33 */
var acceptChannelInfo = {
    temporary_channel_id: "",
    funding_pubkey: "",
    approval: false,
}
api.channelAccept = function(acceptChannelInfo) {
    message.type = ApiType.MsgType_ChannelAccept_N33
    message.data = acceptChannelInfo
    ws.sendData(message)
}
api.onChannelAccept = function(jsonData) {}

/* MsgType_FundingCreate_AssetFundingCreated_N34 */
var channelFundingCreatedInfo = {
    temporary_channel_id: "",
    funding_tx_hex: "",
    temp_address_pub_key: "",
    temp_address_private_key: "",
    channel_address_private_key: ""
}
api.channelFundingCreated = function(channelFundingCreatedInfo) {
    message.type = ApiType.MsgType_FundingCreate_AssetFundingCreated_N34
    message.data = channelFundingCreatedInfo
    ws.sendData(message)
}
api.onChannelFundingCreated = function(jsonData) {}

/* MsgType_FundingSign_AssetFundingSigned_N35 */
var channelFundingSignedInfo = {
    channel_id: "",
    fundee_channel_address_private_key: "",
    approval: false
}
api.channelFundingSigned = function(channelFundingSignedInfo) {
    message.type = ApiType.MsgType_FundingSign_AssetFundingSigned_N35
    message.data = channelFundingSignedInfo
    ws.sendData(message)
}
api.onChannelFundingSigned = function(jsonData) {}

/* MsgType_CommitmentTx_CommitmentTransactionCreated_N351 */
var commitmentTx = {
    channel_id: "",
    amount: 0,
    curr_temp_address_pub_key: "",
    curr_temp_address_private_key: "",
    channel_address_private_key: "",
    last_temp_address_private_key: "",
}
api.commitmentTransactionCreated = function(commitmentTx) {
    message.type = ApiType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351
    message.data = commitmentTx
    ws.sendData(message)
}
api.onCommitmentTransactionCreated = function(jsonData) {}

/* MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352 */
var commitmentTxSigned = {
    channel_id: "",
    curr_temp_address_pub_key: "",
    curr_temp_address_private_key: "",
    last_temp_private_key: "",
    request_commitment_hash: "",
    channel_address_private_key: "",
    approval: false,
}
api.revokeAndAcknowledgeCommitmentTransaction = function(commitmentTxSigned) {
    message.type = ApiType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352
    message.data = commitmentTxSigned
    ws.sendData(message)
}
api.onRevokeAndAcknowledgeCommitmentTransaction = function(jsonData) {}

/* MsgType_HTLC_Invoice_N4003 */
var htlcHInfo = {
    property_id: "",
    amount: 0,
    recipient_peer_id: "",
}
api.invoice = function(htlcHInfo) {
    message.type = ApiType.MsgType_HTLC_Invoice_N4003
    message.data = htlcHInfo
    ws.sendData(message)
}
api.onInvoice = function(jsonData) {}

/* MsgType_HTLC_AddHTLC_N40  */
api.addHtlc = function(htlcHInfo) {
    message.type = ApiType.MsgType_HTLC_AddHTLC_N40
    message.data = htlcHInfo
    ws.sendData(message)
}
api.onAddHtlc = function(jsonData) {}


/* MsgType_HTLC_AddHTLCSigned_N41 */
var htlcHSignInfo = {
    request_hash: "",
    property_id: 0,
    amount: 0,
    h: "",
    approval: false,
}
api.addHtlcSigned = function(htlcHSignInfo) {
    message.type = ApiType.MsgType_HTLC_AddHTLCSigned_N41
    message.data = htlcHSignInfo
    ws.sendData(message)
}
api.onAddHtlcSigned = function(jsonData) {}

/* MsgType_HTLC_FindPathAndSendH_N42 */
var findPathAndSendHInfo = {
    h: "",
}
api.htlcFindPathAndSendH = function(findPathAndSendHInfo) {
    message.type = ApiType.MsgType_HTLC_FindPathAndSendH_N42
    message.data = findPathAndSendHInfo
    ws.sendData(message)
}
api.onHtlcFindPathAndSendH = function(jsonData) {}

/* MsgType_HTLC_SendH_N43 */
var htlcSendHInfo = {
    h: "",
    h_and_r_info_request_hash: "",
}
api.htlcSendH = function(htlcSendHInfo) {
    message.type = ApiType.MsgType_HTLC_SendH_N43
    message.data = htlcSendHInfo
    ws.sendData(message)
}
api.onHtlcSendH = function(jsonData) {}

/* MsgType_HTLC_SignGetH_N44 */
var signGetHInfo = {
    request_hash: "",
    approval: false,
    channel_address_private_key: "",
    last_temp_address_private_key: "",
    curr_rsmc_temp_address_pub_key: "",
    curr_rsmc_temp_address_private_key: "",
    curr_htlc_temp_address_pub_key: "",
    curr_htlc_temp_address_private_key: "",
    curr_htlc_temp_address_he1b_ofh_pub_key: "",
}
api.htlcSignGetH = function(signGetHInfo) {
    message.type = ApiType.MsgType_HTLC_SignGetH_N44
    message.data = signGetHInfo
    ws.sendData(message)
}
api.onHtlcSignGetH = function(jsonData) {}

/* MsgType_HTLC_CreateCommitmentTx_N45 */
var htlcRequestOpen = {
    request_hash: "",
    channel_address_private_key: "",
    last_temp_address_private_key: "",
    curr_rsmc_temp_address_pub_key: "",
    curr_rsmc_temp_address_private_key: "",
    curr_htlc_temp_address_pub_key: "",
    curr_htlc_temp_address_private_key: "",
    curr_htlc_temp_address_for_ht1a_pub_key: "",
    curr_htlc_temp_address_for_ht1a_private_key: "",
    curr_htlc_temp_address_for_hed1a_ofh_pub_key: ""
}
api.htlcCreateCommitmentTx = function(htlcRequestOpen) {
    message.type = ApiType.MsgType_HTLC_CreateCommitmentTx_N45
    message.data = htlcRequestOpen
    ws.sendData(message)
}
api.onHtlcCreateCommitmentTx = function(jsonData) {}

/* MsgType_HTLC_SendR_N46 */
var htlcSendRInfo = {
    request_hash: "",
    r: "",
    channel_address_private_key: "",
    curr_htlc_temp_address_he1b_ofh_private_key: "",
    curr_htlc_temp_address_for_he1b_pub_key: "",
    curr_htlc_temp_address_for_he1b_private_key: ""
}
api.htlcSendR = function(htlcSendRInfo) {
    message.type = ApiType.MsgType_HTLC_SendR_N46
    message.data = htlcSendRInfo
    ws.sendData(message)
}
api.onHtlcSendR = function(jsonData) {}

/* MsgType_HTLC_VerifyR_N47 */
var htlcVerifyRInfo = {
    request_hash: "",
    r: "",
    channel_address_private_key: "",
    curr_htlc_temp_address_for_hed1a_ofh_private_key: ""
}
api.htlcVerifyR = function(htlcVerifyRInfo) {
    message.type = ApiType.MsgType_HTLC_VerifyR_N47
    message.data = htlcVerifyRInfo
    ws.sendData(message)
}
api.onHtlcVerifyR = function(jsonData) {}



/* MsgType_HTLC_RequestCloseCurrTx_N48 */
var closeHtlcTxInfo = {
    channel_id: "",
    channel_address_private_key: "",
    last_rsmc_temp_address_private_key: "",
    last_htlc_temp_address_private_key: "",
    last_htlc_temp_address_for_htnx_private_key: "",
    curr_rsmc_temp_address_pub_key: "",
    curr_rsmc_temp_address_private_key: ""
}
api.closeHtlcTx = function(closeHtlcTxInfo) {
    message.type = ApiType.MsgType_HTLC_RequestCloseCurrTx_N48
    message.data = closeHtlcTxInfo
    ws.sendData(message)
}
api.onCloseHtlcTx = function(jsonData) {}

/* MsgType_HTLC_CloseSigned_N49 */
var closeHtlcTxInfoSigned = {
    request_close_htlc_hash: "",
    channel_address_private_key: "",
    last_rsmc_temp_address_private_key: "",
    last_htlc_temp_address_private_key: "",
    last_htlc_temp_address_for_htnx_private_key: "",
    curr_rsmc_temp_address_pub_key: "",
    curr_rsmc_temp_address_private_key: ""
}
api.closeHtlcTxSigned = function(closeHtlcTxInfoSigned) {
    message.type = ApiType.MsgType_HTLC_CloseSigned_N49
    message.data = closeHtlcTxInfoSigned
    ws.sendData(message)
}
api.onCloseHtlcTxSigned = function(jsonData) {}