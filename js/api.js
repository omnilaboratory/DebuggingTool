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
        ws.send("connect obd first"); //将消息发送到服务端
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
            default:
                break;
        }
    }

    ws.sendData = function(msg) {
        console.info("send msg: ", msg);
        ws.send(JSON.stringify(msg));
    }
    ws.onerror = function(event) {
        console.info(event.data)
    };
}

/* MsgType_UserLogin_1  */
var isLogin = false;
api.logIn = function(userLogin) {
    message.type = ApiType.MsgType_UserLogin_1
    message.data = userLogin
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
api.fundingBTC = function(btcSendRequest) {
    message.type = ApiType.MsgType_Core_FundingBTC_1009
    message.data = btcSendRequest
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
api.fundingAssetOfOmni = function(omniFundingAsset) {
    message.type = ApiType.MsgType_Core_Omni_FundingAsset_2001
    message.data = omniFundingAsset
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
api.openChannel = function(openChannelInfo, recipient_peer_id) {
    message.type = ApiType.MsgType_ChannelOpen_N32
    message.data = openChannelInfo
    message.recipient_peer_id = recipient_peer_id
    ws.sendData(message)
}
api.onOpenChannel = function(jsonData) {}

/* MsgType_ChannelAccept_N33 */
api.channelAccept = function(acceptChannelInfo) {
    message.type = ApiType.MsgType_ChannelAccept_N33
    message.data = acceptChannelInfo
    ws.sendData(message)
}
api.onChannelAccept = function(jsonData) {}

/* MsgType_FundingCreate_AssetFundingCreated_N34 */
api.channelFundingCreated = function(channelFundingCreated) {
    message.type = ApiType.MsgType_FundingCreate_AssetFundingCreated_N34
    message.data = channelFundingCreated
    ws.sendData(message)
}
api.onChannelFundingCreated = function(jsonData) {}

/* MsgType_FundingSign_AssetFundingSigned_N35 */
api.channelFundingSigned = function(channelFundingSign) {
    message.type = ApiType.MsgType_FundingSign_AssetFundingSigned_N35
    message.data = channelFundingCreated
    ws.sendData(message)
}
api.onChannelFundingSigned = function(jsonData) {}