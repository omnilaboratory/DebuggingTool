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
                api.OnLogin(resultData);
                break;
            case ApiType.MsgType_GetMnemonic_101:
                api.OnGetNewAddress(resultData);
                break;
            case ApiType.MsgType_Core_Omni_ListProperties_1205:
                api.OnListProperties(resultData);
                break;
            case ApiType.MsgType_Mnemonic_CreateAddress_N200:
                api.OnSendNewAddressOnLogin(resultData);
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

/* type 1 login  */
var isLogin = false;
api.SendLogin = function(e) {
    console.info(e)
    if (isLogin == false) {
        message.type = ApiType.MsgType_UserLogin_1
        data = {
            "mnemonic": "unfold tortoise zoo hand sausage project boring corn test same elevator mansion bargain coffee brick tilt forum purpose hundred embody weapon ripple when narrow"
        };
        message.data = data;
        ws.sendData(message)
    }
}
api.OnLogin = function(jsonData) {
    isLogin = true;
}

/* type 1205 */
api.SendListProperties = function() {
    message.type = ApiType.MsgType_Core_Omni_ListProperties_1205;
    ws.sendData(message);
}
api.OnListProperties = function(jsonData) {}

/* type 1001 get new address by omnicore */
api.SendGetNewAddress = function() {
    message.type = ApiType.MsgType_Core_GetNewAddress_1001;
    ws.sendData(message);
}
api.OnGetNewAddress = function(jsonData) {}

/* type -200 get new address by  mnemonic*/
api.SendNewAddressOnLogin = function() {
    message.type = ApiType.MsgType_Mnemonic_CreateAddress_N200;
    ws.sendData(message);
}
api.OnSendNewAddressOnLogin = function(jsonData) {}