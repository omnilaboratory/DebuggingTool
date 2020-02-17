function onClickSend(param) {
    type_id = $("#type_id").html().toString().replace(' ', '');
    type_id = type_id.substring(type_id.indexOf('(') + 1, type_id.indexOf(')'));

    msgType = 0;
    if (type_id != '') {
        msgType = parseInt(type_id);
    }


    //为了测试 begin
    tempType = parseInt($('#msgType').val());
    if (isNaN(tempType) == false) {
        msgType = tempType;
    }
    //为了测试 end
    console.info(msgType)
    if (msgType == 0) {
        api.connectToOBD();
        return;
    }

    if (isConnectToOBD == false) {
        alert("not connetToOBD");
        return;
    }


    if (msgType < 0 && isLogin == false) {
        alert("please login");
        return;
    }

    message.type = msgType;
    let inputData = {};
    message.data = inputData;

    switch (msgType) {
        case ApiType.MsgType_UserLogin_1:
            if (isLogin == false) {
                userLogin.mnemonic = "unfold tortoise zoo hand sausage project boring corn test same elevator mansion bargain coffee brick tilt forum purpose hundred embody weapon ripple when narrow"
                api.logIn(userLogin);
                break;
            } else { return; }
        case ApiType.MsgType_GetMnemonic_101:
            api.getMnemonic();
            break;
        case ApiType.MsgType_Core_GetNewAddress_1001:
            api.getNewAddressFromOmniCore()
            break;
        case ApiType.MsgType_Core_FundingBTC_1009:
            btcSendRequest.from_address = "bf88561781fe4f0c066fcc74d218f1bbe4bcc3d1f589adbe07b1fb392873ed56";
            btcSendRequest.from_address_private_key = "39e8b1f3e7aec51a368d70eac6d47195099e55c6963d38bcd729b22190dcdae0";
            btcSendRequest.to_address = "39e8b1f3e7aec51a368d70eac6d47195099e55c6963d38bcd729b22190dcdae0";
            btcSendRequest.amount = 0.0001;
            btcSendRequest.miner_fee = 0.00001;

            api.fundingBTC(btcSendRequest)
            break;
        case ApiType.MsgType_Core_Omni_ListProperties_1205:
            api.listProperties()
            break;
        case ApiType.MsgType_Mnemonic_CreateAddress_N200:
            api.createAddressByMnemonic()
            break;
        case ApiType.MsgType_Mnemonic_GetAddressByIndex_201:
            /* 获取index */
            api.getAddressByIndexByMnemonic(1)
            break;
        case ApiType.MsgType_ChannelOpen_N32:
            openChannelInfo.funding_pubkey = "03f1603966fc3986d7681a7bf7a1e6b8b44c6009939c28da21f065c1b991aeff12";
            recipient_peer_id = "39e8b1f3e7aec51a368d70eac6d47195099e55c6963d38bcd729b22190dcdae0";

            api.channelOpen(openChannelInfo, message)
            break;
        case ApiType.MsgType_ChannelAccept_N33:
            acceptChannelInfo.temporary_channel_id = "bf88561781fe4f0c066fcc74d218f1bbe4bcc3d1f589adbe07b1fb392873ed56";
            acceptChannelInfo.funding_pubkey = "39e8b1f3e7aec51a368d70eac6d47195099e55c6963d38bcd729b22190dcdae0";
            acceptChannelInfo.approval = true;

            api.channelAccept(acceptChannelInfo)
            break;
        default:
            console.info(apiName, "not exsit");
            return;

    }

}

// getAPIList
function getAPIList() {

    var api_id, type_id, api_name, description, apiItem, p;
    let requestURL = 'json/api_list.json';

    // dynamic create api_list div.
    $.getJSON(requestURL, function(result) {
        // get [api_list] div
        var apiList = $("#api_list");

        for (let index = 0; index < result.data.length; index++) {
            api_id = result.data[index].id;
            type_id = result.data[index].type_id;
            api_name = result.data[index].name;
            description = result.data[index].description;

            // create [a] element
            apiItem = document.createElement('a');
            apiItem.id = api_id;
            apiItem.href = '#';
            apiItem.setAttribute('type_id', type_id);
            apiItem.setAttribute('description', description);
            apiItem.setAttribute('onclick', 'callAPI(this)');
            apiItem.innerText = api_name;
            apiList.append(apiItem);

            p = document.createElement('p');
            apiList.append(p);
        }
    });
}

// Invoke a api, show content.
function callAPI(obj) {
    // 
    var api_name = obj.innerHTML;
    document.getElementById("api_name").innerHTML = api_name;

    // 
    var api_description = obj.getAttribute("description");
    document.getElementById("api_description").innerHTML = api_description;

    // id = js_func
    var js_func = obj.getAttribute("id");
    document.getElementById("js_func").innerHTML = js_func;

    //
    var type_id = "type ( " + obj.getAttribute("type_id") + " )";
    document.getElementById("type_id").innerHTML = type_id;

    // First, delete children of input_para div
    deleteInputParamDiv();

    // dynamic create input parameters div area.
    createInputParamDiv(js_func);
}

// delete children of input_para div
function deleteInputParamDiv() {

    var parent = document.getElementById('input_para');
    var children_amount = parent.children.length;
    console.log('children = ' + children_amount);

    if (children_amount != 0) {
        for (let index = children_amount - 1; index >= 0; index--) {
            // console.log('index = ' + index);
            parent.removeChild(parent.children[index]);
        }
    }
}

// dynamic create input parameters div area.
function createInputParamDiv(js_func) {

    let requestURL = 'json/api_list.json';

    $.getJSON(requestURL, function(result) {
        // get [input_para] div
        var input_para = $("#input_para");

        for (let index = 0; index < result.data.length; index++) {
            if (js_func == result.data[index].id) {
                var arrParams = result.data[index].parameters;
                console.info('arrParams = ' + arrParams.length);

                // No parameter.
                if (arrParams.length == 0) {
                    break;
                }

                // create [title] element
                var top_title = document.createElement('p');
                top_title.innerText = 'Input Parameters:';
                input_para.append(top_title);

                // Parameters
                createParamOfAPI(arrParams);
            }
        }
    });
}

// create parameter of each API.
function createParamOfAPI(arrParams) {

    var param_title, input_box;

    for (let index = 0; index < arrParams.length; index++) {
        // create [param_title] element
        param_title = document.createElement('b');
        param_title.innerText = arrParams[index].name + ' : ';
        input_para.append(param_title);

        // create [input box of param] element
        input_box = document.createElement('input');
        input_box.id = arrParams[index].input;
        input_para.append(input_box);

        createButtonOfParam(arrParams, index);
    }
}

// create button of parameter
function createButtonOfParam(arrParams, index) {

    var innerText, invokeFunc;
    var arrButtons = arrParams[index].buttons;

    for (let index = 0; index < arrButtons.length; index++) {
        innerText = arrButtons[index].innerText;
        invokeFunc = arrButtons[index].onclick;

        // create [button] element
        var button = document.createElement('button');
        button.setAttribute('onclick', invokeFunc);
        button.innerText = innerText;
        input_para.append(button);
    }
}