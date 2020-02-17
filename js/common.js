function onClickSend(param) {
    type_id = '';
    /* if ($("#type_id") != null) {
        type_id = $("#type_id").html().toString().replace(' ', '');
        type_id = type_id.substring(type_id.indexOf('(') + 1, type_id.indexOf(')'));
    } */

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

    switch (msgType) {
        case ApiType.MsgType_UserLogin_1:
            if (isLogin == false) {
                userLoginInfo.mnemonic = "unfold tortoise zoo hand sausage project boring corn test same elevator mansion bargain coffee brick tilt forum purpose hundred embody weapon ripple when narrow"
                api.logIn(userLoginInfo);
                break;
            }
        case ApiType.MsgType_GetMnemonic_101:
            api.getMnemonic();
            break;
        case ApiType.MsgType_Core_GetNewAddress_1001:
            api.getNewAddressFromOmniCore()
            break;
        case ApiType.MsgType_Core_FundingBTC_1009:
            btcFundingInfo.from_address = "bf88561781fe4f0c066fcc74d218f1bbe4bcc3d1f589adbe07b1fb392873ed56";
            btcFundingInfo.from_address_private_key = "39e8b1f3e7aec51a368d70eac6d47195099e55c6963d38bcd729b22190dcdae0";
            btcFundingInfo.to_address = "39e8b1f3e7aec51a368d70eac6d47195099e55c6963d38bcd729b22190dcdae0";
            btcFundingInfo.amount = 0.0001;
            btcFundingInfo.miner_fee = 0.00001;

            api.fundingBTC(btcFundingInfo)
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

            api.openChannel(openChannelInfo, recipient_peer_id)
            break;
        case ApiType.MsgType_ChannelAccept_N33:
            acceptChannelInfo.temporary_channel_id = "bf88561781fe4f0c066fcc74d218f1bbe4bcc3d1f589adbe07b1fb392873ed56";
            acceptChannelInfo.funding_pubkey = "39e8b1f3e7aec51a368d70eac6d47195099e55c6963d38bcd729b22190dcdae0";
            acceptChannelInfo.approval = true;

            api.channelAccept(acceptChannelInfo)
            break;
        default:
            alert(msgType + " type not exsit");
            return;

    }

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

// createLeftSideMenu
function createLeftSideMenu(jsonFile, divName) {

    var api_id, type_id, description, apiItem, p;
    let requestURL = jsonFile;

    // dynamic create api_list div.
    $.getJSON(requestURL, function(result) {
        // get [api_list] div
        var apiList = $(divName);

        for (let index = 0; index < result.data.length; index++) {
            api_id = result.data[index].id;
            type_id = result.data[index].type_id;
            api_name = result.data[index].id;
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

// Invoke a api, show content. Dynamic create content div area.
function callAPI(obj) {

    // First, delete children of 'content' div.
    deleteContentDiv();

    createApiNameDiv(obj);
    createRequestDiv(obj);
    createInputParamDiv(obj, 'json/util_list.json');
    createInputParamDiv(obj, 'json/api_list.json');
}

// create 
function createApiNameDiv(obj) {

    // get [content] div
    var content_div = $("#content");

    // create [api_name] element
    var api_name = document.createElement('h2');
    api_name.innerText = obj.innerHTML;
    content_div.append(api_name);

    // create [api_description] element
    var api_description = document.createElement('text');
    api_description.innerText = obj.getAttribute("description");
    content_div.append(api_description);
}

// create 
function createRequestDiv(obj) {

    // get [content] div
    var content_div = $("#content");

    // create [title] element
    var title = document.createElement('h2');
    title.innerText = 'Request';
    content_div.append(title);

    // create [func_title] element
    var func_title = document.createElement('text');
    // func_title.color = '#EEEEEE';
    func_title.setAttribute('style', 'color:gray');
    func_title.innerText = 'func: ';
    content_div.append(func_title);

    // create [func_name] element
    var func_name = document.createElement('text');
    func_name.innerText = obj.getAttribute("id");
    content_div.append(func_name);

    // create [type_id] element
    var value = " type ( " + obj.getAttribute("type_id") + " )";
    var type_id = document.createElement('text');
    type_id.setAttribute('style', 'color:gray');
    type_id.innerText = value;
    content_div.append(type_id);

    //-------------------------------
    // TEMP WILL BE DELETED - for GuoJun testing.
    var p = document.createElement('p');
    content_div.append(p);

    var input_title = document.createElement('text');
    input_title.setAttribute('style', 'color:gray');
    input_title.innerText = '输入消息编号：';
    content_div.append(input_title);

    // create [input] element - for GuoJun testing.
    var input_msgType = document.createElement('input');
    input_msgType.id = 'msgType';
    // input_msgType.setAttribute('type', 'text');
    // input_msgType.setAttribute('name', '');
    content_div.append(input_msgType);
    //-------------------------------

    // create [button] element
    var button = document.createElement('button');
    button.setAttribute('onclick', 'onClickSend(this)');
    button.innerText = 'Send';
    content_div.append(button);
}

// dynamic create input parameters div area.
function createInputParamDiv(obj, jsonFile) {

    // let requestURL = 'json/api_list.json';

    $.getJSON(jsonFile, function(result) {
        // get [content] div
        var input_para = $("#content");

        // get JS function name.
        var js_func = obj.getAttribute("id");

        for (let index = 0; index < result.data.length; index++) {
            // id = js_func, is JS function name.
            if (js_func == result.data[index].id) {
                var arrParams = result.data[index].parameters;
                // console.info('arrParams = ' + arrParams.length);

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

    // get [content] div
    var input_para = $("#content");

    for (let index = 0; index < arrParams.length; index++) {
        // create [param_title] element
        param_title = document.createElement('text');
        param_title.setAttribute('style', 'color:gray');
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

    // get [content] div
    var input_para = $("#content");

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

// create OBD Responses
function createOBDResponse() {

}


//----------------------------------------------------------------
// For test to show Connect to OBD html page.
function connectNode() {
    deleteContentDiv();
    createConnectNodeDiv();
}

// delete children of 'content' div
function deleteContentDiv() {

    var parent = document.getElementById('content');
    var children_amount = parent.children.length;
    // console.log('content div children = ' + children_amount);

    if (children_amount != 0) {
        for (let index = children_amount - 1; index >= 0; index--) {
            // console.log('index = ' + index);
            parent.removeChild(parent.children[index]);
        }
    }
}

// create ConnectNodeDiv
function createConnectNodeDiv() {

    // get [content] div
    var content_div = $("#content");

    // create [title] element
    var title = document.createElement('h2');
    title.innerText = 'OBD Node';
    content_div.append(title);

    // create [input title] element
    var input_title = document.createElement('text');
    input_title.setAttribute('style', 'color:gray');
    input_title.innerText = 'Node URL: ';
    content_div.append(input_title);

    // create [input] element
    var node_addr = document.createElement('input');
    node_addr.id = 'ConnectNode'
    content_div.append(node_addr);

    // create [button] element
    var button = document.createElement('button');
    button.setAttribute('onclick', '');
    button.innerText = 'Connect';
    content_div.append(button);
}
//----------------------------------------------------------------