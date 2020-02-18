var obdApi = new ObdApi();

function onClickSend(param) {

    //为了测试
    msgType = parseInt($('#msgType').val());
    let enumMsgType = new MessageType();
    switch (msgType) {
        case enumMsgType.MsgType_Error_0:
            obdApi.connectToServer("1111", function(e) {
                console.info(e);
            });
            break;
        case enumMsgType.MsgType_UserLogin_1:
            obdApi.login("", function(e) {
                console.info(e);
            });
            break;
        case enumMsgType.MsgType_UserLogout_2:
            obdApi.logout();
            break;
        case enumMsgType.MsgType_GetMnemonic_101:
            obdApi.getMnemonic(function(e) {
                console.info(e);
            });
            break;
        case enumMsgType.MsgType_Core_FundingBTC_1009:
            let info = new BtcFundingInfo();
            obdApi.fundingBTC(info);
            break;
        case enumMsgType.MsgType_Mnemonic_CreateAddress_N200:
            obdApi.createAddressByMnemonic();
            break;
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_201:
            obdApi.getAddressByIndexByMnemonic(1);
            break;
        case enumMsgType.MsgType_Core_Omni_GetTransaction_1206:
            txid = "c76710920860456dff2433197db79dd030f9b527e83a2e253f5bc6ab7d197e73";
            obdApi.getOmniTxByTxid(txid);
            break;
        default:
            console.info(msgType + " do not exist");
            break;
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
    func_title.setAttribute('style', 'color:gray');
    func_title.innerText = 'func: ';
    content_div.append(func_title);

    // create [func_name] element: id = JS function name.
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

    // create [Send button] element
    var button = document.createElement('button');
    button.setAttribute('js_func', obj.getAttribute("id"));
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
        input_box.id = arrParams[index].name;
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
    var node_url = document.createElement('input');
    node_url.id = 'node_url';
    node_url.style = 'width: 50%';
    // node_url.setAttribute('style', 'color:gray');
    node_url.placeholder = 'Please input Node URL.';
    node_url.value = 'ws://127.0.0.1:60020/ws';
    content_div.append(node_url);

    // create [button] element
    var button = document.createElement('button');
    button.setAttribute('onclick', 'connectToServer()');
    button.innerText = 'Connect';
    content_div.append(button);
}

// 
function connectToServer() {
    // get [node_url] input box value.
    var node_url = $("#node_url").val();
    console.info('node url = ' + node_url);
    
    if (node_url.trim().length == 0) {
        alert('Please input Node URL.');
        return;
    }
    
    var response;
    obdApi.connectToServer(node_url, response);
    console.info('response = ' + response);
}
//----------------------------------------------------------------