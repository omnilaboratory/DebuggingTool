var obdApi = new ObdApi();
var enumMsgType = new MessageType();

// Save connection status.
var isConnectToOBD = false;

// Save userID already logined.
var userID;

//
function onClickSend(objSelf) {
    //为了测试
    // var msgType = parseInt($('#msgType').val());
    // console.info('msgType = ' + msgType);

    // normal code.
    var msgType = Number(objSelf.getAttribute('type_id'));
    console.info('type_id = ' + msgType);

    switch (msgType) {
        // Util APIs.
        case enumMsgType.MsgType_Core_GetNewAddress_1001:
            obdApi.getNewAddress(function(e) {
                console.info('OBD Response = ' + e);
                createOBDResponseDiv(e);
            });
            break;
        case enumMsgType.MsgType_Mnemonic_CreateAddress_N200:
            obdApi.getNewAddressWithMnemonic(function(e) {
                console.info('OBD Response = ' + e);
                createOBDResponseDiv(e, msgType);
            });
            break;

        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_201:

            var index = $("#index").val();
            console.info('index = ' + index);

            if (index === '') {
                alert('Please input a valid index of address.');
                return;
            }

            obdApi.getAddressInfo(index, function(e) {
                console.info('OBD Response = ' + e);
                createOBDResponseDiv(e, msgType);
            });
            break;

        // APIs for debugging.
        case enumMsgType.MsgType_UserLogin_1:

            var mnemonic = $("#mnemonic").val();
            console.info('mnemonic = ' + mnemonic);

            if (mnemonic === '') {
                alert('Please input a valid mnemonic.');
                return;
            }

            obdApi.logIn(mnemonic, function(e) {
                console.info('OBD Response = ' + e);
                createOBDResponseDiv(e, msgType);
            });
            break;

        case enumMsgType.MsgType_UserLogout_2:
            obdApi.logout();
            break;

        case enumMsgType.MsgType_GetMnemonic_101:
            obdApi.signUp(function(e) {
                console.info('OBD Response = ' + e);
                createOBDResponseDiv(e);
            });
            break;

        case enumMsgType.MsgType_Core_FundingBTC_1009:
            let info = new BtcFundingInfo();
            obdApi.fundingBTC(info);
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

// getUserDataList
function getUserDataList() {

    var api_id, description, apiItem, p;
    var jsonFile = "json/user_data_list.json";

    // dynamic create api_list div.
    $.getJSON(jsonFile, function(result) {
        // get [user_data_list] div
        var apiList = $("#user_data_list");

        for (let index = 0; index < result.data.length; index++) {
            api_id = result.data[index].id;
            description = result.data[index].description;

            // create [a] element
            apiItem = document.createElement('a');
            apiItem.id = api_id;
            apiItem.href = '#';
            apiItem.setAttribute('description', description);
            apiItem.setAttribute('onclick', 'displayUserData(this)');
            apiItem.innerText = api_id;
            apiList.append(apiItem);

            p = document.createElement('p');
            apiList.append(p);
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

// createLeftSideMenu
function createLeftSideMenu(jsonFile, divName) {

    var api_id, type_id, description, apiItem, p;

    // dynamic create api_list div.
    $.getJSON(jsonFile, function(result) {
        // get [api_list] div
        var apiList = $(divName);

        for (let index = 0; index < result.data.length; index++) {
            api_id = result.data[index].id;
            type_id = result.data[index].type_id;
            description = result.data[index].description;

            // create [a] element
            apiItem = document.createElement('a');
            apiItem.id = api_id;
            apiItem.href = '#';
            apiItem.setAttribute('type_id', type_id);
            apiItem.setAttribute('description', description);
            apiItem.setAttribute('onclick', 'callAPI(this)');
            apiItem.innerText = api_id;
            apiList.append(apiItem);

            p = document.createElement('p');
            apiList.append(p);
        }
    });
}

// Invoke a api, show content. Dynamic create content div area.
function callAPI(obj) {
    removeNameReqDiv();
    createApiNameDiv(obj);
    createRequestDiv(obj);
    createInputParamDiv(obj, 'json/util_list.json');
    createInputParamDiv(obj, 'json/api_list.json');
    createInvokeAPIButton(obj);
}

// create 
function createApiNameDiv(obj) {

    // get [content] div
    var content_div = $("#name_req_div");

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
    var content_div = $("#name_req_div");

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
    /*
    var p = document.createElement('p');
    content_div.append(p);

    var input_title = document.createElement('text');
    input_title.setAttribute('style', 'color:gray');
    input_title.innerText = '测试用：输入消息编号：';
    content_div.append(input_title);

    // create [input] element - for GuoJun testing.
    var input_msgType = document.createElement('input');
    input_msgType.id = 'msgType';
    // input_msgType.setAttribute('type', 'text');
    // input_msgType.setAttribute('name', '');
    content_div.append(input_msgType);
    */
    //-------------------------------

}

// dynamic create input parameters div area.
function createInputParamDiv(obj, jsonFile) {

    $.getJSON(jsonFile, function(result) {
        // get [content] div
        var content_div = $("#name_req_div");

        // get JS function name.
        var js_func = obj.getAttribute("id");

        for (let index = 0; index < result.data.length; index++) {
            // id = js_func, is JS function name.
            if (js_func === result.data[index].id) {
                var arrParams = result.data[index].parameters;
                // console.info('arrParams = ' + arrParams.length);

                // No parameter.
                if (arrParams.length === 0) {
                    break;
                }

                // create [title] element
                var top_title = document.createElement('p');
                top_title.innerText = 'Input Parameters:';
                content_div.append(top_title);

                // Parameters
                createParamOfAPI(arrParams, content_div);
            }
        }
    });
}

// create parameter of each API.
function createParamOfAPI(arrParams, content_div) {

    var param_title, input_box;

    // get [content] div
    // var content_div = $("#content");

    for (let index = 0; index < arrParams.length; index++) {
        // create [param_title] element
        param_title = document.createElement('text');
        param_title.setAttribute('style', 'color:gray');
        param_title.innerText = arrParams[index].name + ' : ';
        content_div.append(param_title);

        // create [input box of param] element
        input_box = document.createElement('input');
        input_box.id = arrParams[index].name;
        content_div.append(input_box);

        createButtonOfParam(arrParams, index, content_div);
    }
}

// create button of parameter
function createButtonOfParam(arrParams, index, content_div) {

    var innerText, invokeFunc;
    var arrButtons = arrParams[index].buttons;

    // get [content] div
    // var content_div = $("#content");

    for (let index = 0; index < arrButtons.length; index++) {
        innerText = arrButtons[index].innerText;
        invokeFunc = arrButtons[index].onclick;

        // create [button] element
        var button = document.createElement('button');
        button.setAttribute('onclick', invokeFunc);
        button.innerText = innerText;
        content_div.append(button);
    }
}

// 
function createInvokeAPIButton(obj) {
    // get [content] div
    var content_div = $("#name_req_div");

    // console.info('send is = '+$("#send_button").val());

    var p = document.createElement('p');
    content_div.append(p);

    // create [Send button] element
    var button = document.createElement('button');
    // button.id = 'send_button';
    button.setAttribute('type_id', obj.getAttribute("type_id"));
    button.setAttribute('onclick', 'onClickSend(this)');
    button.innerText = 'Invoke API';
    content_div.append(button);
    // if ($("#send_button").val() == undefined) {
    // }
}

//----------------------------------------------------------------
// For test to show Connect to OBD html page.
function connectNode() {
    removeNameReqDiv();
    createConnectNodeDiv();
}

// remove name and request Div
function removeNameReqDiv() {

    // var parent = document.getElementById('content');
    // var children_amount = parent.children.length;
    // // console.log('content div children = ' + children_amount);

    // if (children_amount != 0) {
    //     for (let index = children_amount - 1; index >= 0; index--) {
    //         // console.log('index = ' + index);
    //         parent.removeChild(parent.children[index]);
    //     }
    // }

    $("#name_req_div").remove();

    // get [content] div
    var content_div = $("#content");

    var name_req_div = document.createElement('div');
    name_req_div.id = "name_req_div";
    content_div.append(name_req_div);
}

// create ConnectNodeDiv
function createConnectNodeDiv() {

    // get [content] div
    var content_div = $("#name_req_div");

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
    button.id = 'button_connect';
    button.setAttribute('onclick', 'connectToServer()');
    button.innerText = 'Connect';
    content_div.append(button);

    // already connected
    if (isConnectToOBD === true) {
        // get [button_connect] div
        var button_connect = $("#button_connect");
        button_connect.text("Disconnect");
        button_connect.attr("disabled", "disabled");

        // create [status] element
        var title = document.createElement('h3');
        title.innerText = 'Already connected.';
        content_div.append(title);
    }
}

// 
function connectToServer() {
    // get [node_url] input box value.
    var node_url = $("#node_url").val();
    console.info('node url = ' + node_url);

    if (node_url.trim().length === 0) {
        alert('Please input Node URL.');
        return;
    }

    obdApi.connectToServer(node_url, function(response) {
        console.info('OBD Response = ' + response);
        // Create OBD Response div area.
        createOBDResponseDiv(response);
        isConnectToOBD = true; // already connected.
        
        // Change the [button_connect] status.
        // get [button_connect] div
        var button_connect = $("#button_connect");
        // $("#button_connect").text("Disconnect");
        button_connect.text("Disconnect");
        button_connect.attr("disabled", "disabled");
    });
}

// createOBDResponseDiv 
function createOBDResponseDiv(response, msgType) {

    $("#obd_response_div").remove();

    // get [content] div
    var content_div = $("#name_req_div");

    var obd_response_div = document.createElement('div');
    obd_response_div.id = "obd_response_div";
    content_div.append(obd_response_div);

    // create [title] element
    var title = document.createElement('h2');
    title.innerText = 'OBD Response';
    obd_response_div.append(title);

    switch (msgType) {
        case enumMsgType.MsgType_Core_GetNewAddress_1001:
            break;
        case enumMsgType.MsgType_Mnemonic_CreateAddress_N200:
            parseDataN200(response);
            saveAddrData(response);
            break;
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_201:
            parseDataN200(response);
            break;
        case enumMsgType.MsgType_UserLogin_1:
            userID = response.substring(0, response.indexOf(' '));
            showDefault(response);
            break;
        default:
            showDefault(response);
            break;
    }
}

function showDefault(response) {
    // create [result] element
    var result = document.createElement('p');
    result.innerText = response;
    obd_response_div.append(result);
}

//----------------------------------------------------------------
// Functions of processing each response from invoke APIs.

// parseDataN200 - getNewAddressWithMnemonic
function parseDataN200(response) {
    // console.log('response wif = ' + response.wif);
    
    var arrData = [
        'ADDRESS : ' + response.address,
        'INDEX : '   + response.index,
        'PUB_KEY : ' + response.pub_key,
        'WIF : '     + response.wif
    ];

    var item;
    for (let index = 0; index < arrData.length; index++) {
        item = document.createElement('text');
        item.innerText = arrData[index];
        obd_response_div.append(item);
        createHtmlElement(obd_response_div, 'p');
    }

    /*
    // create [address] element
    var address = document.createElement('text');
    address.innerText = 'ADDRESS : ' + response.address;
    obd_response_div.append(address);
    
    createPElement();
    
    // create [index] element
    var index = document.createElement('text');
    index.innerText = 'INDEX : ' + response.index;
    obd_response_div.append(index);
    
    createPElement();
    
    // create [pub_key] element
    var pub_key = document.createElement('text');
    pub_key.innerText = 'PUB_KEY : ' + response.pub_key;
    obd_response_div.append(pub_key);
    
    createPElement();
    
    // create [wif] element
    var wif = document.createElement('text');
    wif.innerText = 'WIF : ' + response.wif;
    obd_response_div.append(wif);
    */
}

// Address data generated with mnemonic save to local storage.
function saveAddrData(response) {

    var addr = JSON.parse(localStorage.getItem('addr'));
    // console.info('localStorage KEY  = ' + addr);

    // Add new
    if (addr) {
        // console.info('HAS DATA');
        let new_data = {
            address: response.address,
            index:   response.index,
            pub_key: response.pub_key,
            wif:     response.wif
        }
        addr.data.push(new_data);
        window.localStorage.setItem('addr', JSON.stringify(addr));

    } else {
        // console.info('FIRST DATA');
        let data = {
            userID: userID,
            data: [
                {
                    address: response.address,
                    index:   response.index,
                    pub_key: response.pub_key,
                    wif:     response.wif
                }
            ]
        }
        window.localStorage.setItem('addr', JSON.stringify(data));
    }
}

//----------------------------------------------------------------
// Functions of buttons.
function invokeSignUp() {
    console.log('invokeSignUp func invoked!');
    callAPI(signUp);
}

// Generate new mnemonic words.
function autoCreateMnemonic() {
    console.log('getMnemonic func invoked!');
    obdApi.signUp(function(e) {
        console.info('OBD Response = ' + e);
        $("#mnemonic").val(e);
        // $("#mnemonic").attr("value", e);
    });
}

//----------------------------------------------------------------
// Functions of displayUserData.
function displayUserData(obj) {
    removeNameReqDiv();
    createApiNameDiv(obj);
    addrData();
}

//
function addrData() {

    var arrData, item;
    var addr = JSON.parse(localStorage.getItem('addr'));
    // console.info('localStorage KEY  = ' + addr);

    // get [name_req_div] div
    var parent = $("#name_req_div");

    // If has data
    if (addr) {
        // userID
        createHtmlElement(parent, 'text', addr.userID);
        createHtmlElement(parent, 'p');

        // title
        createHtmlElement(parent, 'h2', 'Address List');
        createHtmlElement(parent, 'p');

        for (let index = 0; index < addr.data.length; index++) {
            arrData = [
                'ADDRESS : ' + addr.data[index].address,
                'INDEX : '   + addr.data[index].index,
                'PUB_KEY : ' + addr.data[index].pub_key,
                'WIF : '     + addr.data[index].wif
            ];
        
            // Display list NO.
            createHtmlElement(parent, 'h4', 'NO. ' + (index + 1));
            createHtmlElement(parent, 'p');

            for (let index = 0; index < arrData.length; index++) {
                createHtmlElement(parent, 'text', arrData[index]);
                createHtmlElement(parent, 'br');
            }
        }
    }
}

//----------------------------------------------------------------
// Functions of Common Util.

// create html elements
function createHtmlElement(parent, elementName, myInnerText) {
    var element = document.createElement(elementName);
    if (myInnerText) {
        element.innerText = myInnerText;
    }
    parent.append(element);
}