var obdApi = new ObdApi();
var enumMsgType = new MessageType();

// Save connection status.
var isConnectToOBD = false;

// Save login status.
var isLogined = false;

// Save userID of a user already logined.
let userID;

// cssStyle
var cssStyle = 'color:gray';

// save OBD messages
var obdMessages = '';

// mnemonic using for login
var mnemonicWithLogined = '';

// getNewAddressWithMnemonic by local js library
function getNewAddressWithMnemonic() {
    if (!isLogined) { // Not logined
        alert('Please login first.');
        return '';
    }

    var newIndex = getNewAddrIndex();
    console.info('mnemonicWithLogined = ' + mnemonicWithLogined);
    console.info('addr index = ' + newIndex);
    
    // True: testnet  False: mainnet
    var result = btctool.generateWalletInfo(mnemonicWithLogined, newIndex, true);
    console.info('local addr data = ' + JSON.stringify(result));

    return result;
}

// getAddressInfo by local js library
function getAddressInfo(msgType) {
    if (!isLogined) { // Not logined
        alert('Please login first.');
        return '';
    }

    var index = $("#index").val();
    console.info('index = ' + index);

    if (index.trim() === '') {
        alert('Please input a valid index of address.');
        return '';
    }

    // True: testnet  False: mainnet
    var result = btctool.generateWalletInfo(mnemonicWithLogined, index, true);
    console.info('local addr data = ' + JSON.stringify(result));

    return result;
}

// Invoke each APIs.
function invokeAPIs(objSelf) {

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
            var result = getNewAddressWithMnemonic();
            if (result === '') return;
            saveAddrData(result);
            createOBDResponseDiv(result, msgType);
            break;
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_201:
            var result = getAddressInfo();
            if (result === '') return;
            createOBDResponseDiv(result, msgType);
            break;

        // APIs for debugging.
        case enumMsgType.MsgType_UserLogin_1:

            var mnemonic = $("#mnemonic").val();
            // console.info('mnemonic = ' + mnemonic);

            if (mnemonic === '') {
                alert('Please input a valid mnemonic.');
                return;
            }

            obdApi.logIn(mnemonic, function(e) {
                console.info('logIn - OBD Response = ' + e);
                // If already logined, then stop listening to OBD Response,
                // DO NOT update the userID.
                if (isLogined) {
                    createOBDResponseDiv(e, msgType);
                    return;
                }

                // Otherwise, a new loginning, update the userID.
                isLogined = true;
                mnemonicWithLogined = mnemonic;
                userID = e.substring(0, e.indexOf(' '));
                createOBDResponseDiv(e, msgType);
            });
            break;

        case enumMsgType.MsgType_UserLogout_2:
            obdApi.logout();
            break;

        case enumMsgType.MsgType_GetMnemonic_101:
            // Generate mnemonic by local js library.
            var mnemonic = btctool.generateMnemonic(128);
            saveMnemonicData(mnemonic);
            createOBDResponseDiv(mnemonic);

            // obdApi.signUp(function(e) {
            //     console.info('OBD Response = ' + e);
            //     saveMnemonicData(e);
            //     createOBDResponseDiv(e);
            // });
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

// 
function displayOBDMessages(content) {
    // console.info("broadcast info:", content);
    console.info("broadcast info:", JSON.stringify(content));

    switch (Number(content.type)) {
        case enumMsgType.MsgType_Error_0:
        case enumMsgType.MsgType_Core_GetNewAddress_1001:
        case enumMsgType.MsgType_Mnemonic_CreateAddress_N200:
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_201:
        case enumMsgType.MsgType_GetMnemonic_101:
            return;
        case enumMsgType.MsgType_UserLogin_1:
            saveUserIDLogined(content.from);
            break;
    }

    content = JSON.stringify(content.result);
    content = content.replace("\"","").replace("\"","");
    console.info("content = ", content);

    // Some case do not need displayed.
    if (content === 'already login' || content === 'undefined') return;

    obdMessages += content + '\n\n';
    $("#obd_messages").val(obdMessages);
}

// getUserDataList
function getUserDataList() {

    var api_id, description, apiItem;
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

            createHtmlElement(apiList, 'p');
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

    var api_id, type_id, description, apiItem;

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
            apiItem.setAttribute('onclick', 'displayAPIContent(this)');
            apiItem.innerText = api_id;
            apiList.append(apiItem);

            createHtmlElement(apiList, 'p');
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
    createInvokeAPIButton(obj);
}

// create 
function createApiNameDiv(obj) {

    // get [content] div
    var content_div = $("#name_req_div");

    // create [api_name] element
    createHtmlElement(content_div, 'h2', obj.innerHTML);

    // create [api_description] element
    createHtmlElement(content_div, 'text', obj.getAttribute("description"));
}

// create 
function createRequestDiv(obj) {

    // get [content] div
    var content_div = $("#name_req_div");

    // create [title] element
    createHtmlElement(content_div, 'h2', 'Request');

    // create [func_title] element
    createHtmlElement(content_div, 'text', 'func: ', cssStyle);

    // create [func_name] element: id = JS function name.
    createHtmlElement(content_div, 'text', obj.getAttribute("id"));

    // create [type_id] element
    var value = " type ( " + obj.getAttribute("type_id") + " )";
    createHtmlElement(content_div, 'text', value, cssStyle);

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
                createHtmlElement(content_div, 'p', 'Input Parameters:');

                // Parameters
                createParamOfAPI(arrParams, content_div);
            }
        }
    });
}

// create parameter of each API.
function createParamOfAPI(arrParams, content_div) {

    var input_box;

    for (let index = 0; index < arrParams.length; index++) {
        // create [param_title] element
        createHtmlElement(content_div, 'text', arrParams[index].name + ' : ', cssStyle);

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

    createHtmlElement(content_div, 'p');

    // create [Send button] element
    var button = document.createElement('button');
    // button.id = 'send_button';
    button.setAttribute('type_id', obj.getAttribute("type_id"));
    button.setAttribute('onclick', 'invokeAPIs(this)');
    button.innerText = 'Invoke API';
    content_div.append(button);
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
    createHtmlElement(content_div, 'h2', 'OBD Node');

    // create [input title] element
    createHtmlElement(content_div, 'text', 'Node URL: ', cssStyle);

    // create [input] element
    var node_url = document.createElement('input');
    node_url.id = 'node_url';
    node_url.style = 'width: 50%';
    node_url.placeholder = 'Please input Node URL.';
    node_url.value = 'ws://127.0.0.1:60020/ws';
    content_div.append(node_url);

    // create [button] element
    var button = document.createElement('button');
    button.id = 'button_connect';
    button.setAttribute('onclick', 'clickConnectButton()');
    button.innerText = 'Connect';
    content_div.append(button);

    // already connected
    if (isConnectToOBD === true) {
        changeConnectButtonStatus();
        createHtmlElement(content_div, 'h3', 'Already connected.');
    }
}

// 
function clickConnectButton() {
    // get [node_url] input box value.
    var node_url = $("#node_url").val();
    console.info('node url = ' + node_url);

    if (node_url.trim().length === 0) {
        alert('Please input Node URL.');
        return;
    }

    obdApi.connectToServer(node_url, function(response) {
        console.info('OBD Response = ' + response);
        createOBDResponseDiv(response);
        isConnectToOBD = true; // already connected.
        changeConnectButtonStatus();

    }, function(globalResponse) {
        displayOBDMessages(globalResponse);
    });
}

//
function changeConnectButtonStatus() {
    var button_connect = $("#button_connect");
    button_connect.text("Disconnect");
    button_connect.attr("disabled", "disabled");
}

// create OBD Response Div 
function createOBDResponseDiv(response, msgType) {

    $("#obd_response_div").remove();

    var obd_response_div = document.createElement('div');
    obd_response_div.id = "obd_response_div";
    $("#name_req_div").append(obd_response_div);

    // create [title] element
    createHtmlElement(obd_response_div, 'h2', 'OBD Response');

    switch (msgType) {
        case enumMsgType.MsgType_Mnemonic_CreateAddress_N200:
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_201:
            parseDataN200(response);
            break;
        default:
            createHtmlElement(obd_response_div, 'p', response);
            break;
    }
}

//----------------------------------------------------------------
// Functions of processing each response from invoke APIs.

// parseDataN200 - getNewAddressWithMnemonic
function parseDataN200(response) {
    // console.log('response wif = ' + response.wif);

    var arrData = [
        'ADDRESS : ' + response.address,
        'INDEX : ' + response.index,
        'PUB_KEY : ' + response.pubkey,
        'WIF : ' + response.wif
    ];

    for (let index = 0; index < arrData.length; index++) {
        createHtmlElement(obd_response_div, 'text', arrData[index]);
        createHtmlElement(obd_response_div, 'p');
    }
}

// get a new index of address
function getNewAddrIndex() {

    var addr = JSON.parse(localStorage.getItem('addr'));
    // console.info('localStorage KEY  = ' + addr);

    // If has data.
    if (addr) {
        // console.info('HAS DATA');
        for (let i = 0; i < addr.result.length; i++) {
            if (userID === addr.result[i].userID) {
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

// Address data generated with mnemonic save to local storage.
function saveAddrData(response) {
    
    var addr = JSON.parse(localStorage.getItem('addr'));
    // console.info('localStorage KEY  = ' + addr);

    // If has data.
    if (addr) {
        // console.info('HAS DATA');
        for (let i = 0; i < addr.result.length; i++) {
            if (userID === addr.result[i].userID) {
                // Add new dato to 
                let new_data = {
                    address: response.address,
                    index: response.index,
                    pubkey: response.pubkey,
                    wif: response.wif
                }
                addr.result[i].data.push(new_data);
                window.localStorage.setItem('addr', JSON.stringify(addr));
                return;
            }
        }

        // A new User ID.
        let new_data = {
            userID: userID,
            data: [{
                address: response.address,
                index: response.index,
                pubkey: response.pubkey,
                wif: response.wif
            }]
        }
        addr.result.push(new_data);
        window.localStorage.setItem('addr', JSON.stringify(addr));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                userID: userID,
                data: [{
                    address: response.address,
                    index: response.index,
                    pubkey: response.pubkey,
                    wif: response.wif
                }]
            }]
        }
        window.localStorage.setItem('addr', JSON.stringify(data));
    }
}

// mnemonic words generated with signUp api save to local storage.
function saveMnemonicData(response) {

    var mnemonic = JSON.parse(localStorage.getItem('mnemonic'));
    // console.info('localStorage KEY  = ' + addr);

    // If has data.
    if (mnemonic) {
        // console.info('HAS DATA');
        let new_data = {
            mnemonic: response,
        }
        mnemonic.result.push(new_data);
        window.localStorage.setItem('mnemonic', JSON.stringify(mnemonic));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                mnemonic: response
            }]
        }
        window.localStorage.setItem('mnemonic', JSON.stringify(data));
    }
}

// save User ID already Logined 
function saveUserIDLogined(response) {

    var userIDs = JSON.parse(localStorage.getItem('user_id_logined'));
    // console.info('localStorage KEY  = ' + addr);

    // If has data.
    if (userIDs) {
        // console.info('HAS DATA');
        let new_data = {
            userID: response,
        }
        userIDs.result.push(new_data);
        window.localStorage.setItem('user_id_logined', JSON.stringify(userIDs));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                userID: response
            }]
        }
        window.localStorage.setItem('user_id_logined', JSON.stringify(data));
    }
}

//----------------------------------------------------------------
// Functions of buttons.

// Generate new mnemonic words.
function autoCreateMnemonic() {
    // Generate mnemonic by local js library.
    var mnemonic = btctool.generateMnemonic(128);
    $("#mnemonic").val(mnemonic);
    saveMnemonicData(mnemonic);
}

// Generate a new pub key of an address.
function autoCreateFundingPubkey() {
    var result = getNewAddressWithMnemonic();
    if (result === '') return;
    $("#funding_pubkey").val(result.pubkey);
    saveAddrData(result);

    // obdApi.getNewAddressWithMnemonic(function(e) {
    //     console.info('OBD Response pubkey = ' + e.pubkey);
    //     $("#funding_pubkey").val(e.pubkey);
    //     saveAddrData(e);
    // });
}

//----------------------------------------------------------------
// Functions of display User Data.
function displayUserData(obj) {
    removeNameReqDiv();
    createApiNameDiv(obj);

    switch (obj.id) {
        case 'MnemonicWords':
            // console.info('Mnemonic Words');
            displayMnemonic();
            break;
        case 'Addresses':
            displayAddresses();
            break;
        case 'User IDs':
            displayUserIDs();
            break;
        default:
            break;
    }
}

//
function displayMnemonic() {
    // get [name_req_div] div
    var parent = $("#name_req_div");
    var mnemonic = JSON.parse(localStorage.getItem('mnemonic'));
    // console.info('localStorage KEY  = ' + addr);

    // If has data
    if (mnemonic) {
        for (let i = 0; i < mnemonic.result.length; i++) {
            // Display list NO.
            createHtmlElement(parent, 'h4', 'NO. ' + (i + 1));
            // createHtmlElement(parent, 'p');
            createHtmlElement(parent, 'text', mnemonic.result[i].mnemonic);
            // createHtmlElement(parent, 'p');
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createHtmlElement(parent, 'h3', 'NO DATA YET. YOU CAN CREATE ONE WITH [signUp].');
    }
}

//
function displayAddresses() {
    // get [name_req_div] div
    var parent = $("#name_req_div");

    if (!isLogined) { // Not login.
        createHtmlElement(parent, 'text', 'NO USER LOGINED.');
        return;
    }

    var arrData;
    var addr = JSON.parse(localStorage.getItem('addr'));
    // console.info('localStorage KEY  = ' + addr);

    // If has data
    if (addr) {
        for (let i = 0; i < addr.result.length; i++) {
            if (userID === addr.result[i].userID) {
                // userID
                createHtmlElement(parent, 'text', addr.result[i].userID);
                // createHtmlElement(parent, 'p');

                // title
                createHtmlElement(parent, 'h2', 'Address List');
                // createHtmlElement(parent, 'p');

                for (let i2 = 0; i2 < addr.result[i].data.length; i2++) {
                    arrData = [
                        'ADDRESS : ' + addr.result[i].data[i2].address,
                        'INDEX : ' + addr.result[i].data[i2].index,
                        'PUB_KEY : ' + addr.result[i].data[i2].pubkey,
                        'WIF : ' + addr.result[i].data[i2].wif
                    ];

                    // Display list NO.
                    createHtmlElement(parent, 'h4', 'NO. ' + (i2 + 1));
                    // createHtmlElement(parent, 'p');

                    for (let i3 = 0; i3 < arrData.length; i3++) {
                        createHtmlElement(parent, 'text', arrData[i3]);
                        createHtmlElement(parent, 'br');
                    }
                }

                return;
            }
        }

        // The user has not create address yet.
        displayNoData(parent);

    } else { // NO LOCAL STORAGE DATA YET.
        displayNoData(parent);
    }
}

//
function displayUserIDs() {
    // get [name_req_div] div
    var parent = $("#name_req_div");

    if (!isLogined) { // Not login.
        createHtmlElement(parent, 'h4', 'NO USER LOGINED.');
        return;
    }

    for (let i = 0; i < userIDLogined.length; i++) {
        createHtmlElement(parent, 'h4', 'NO. ' + (i + 1));
        // createHtmlElement(parent, 'text', 'User ID : ', cssStyle);
        createHtmlElement(parent, 'text', userIDLogined[i]);
    }
}

// 
function displayNoData(parent) {
    // userID
    createHtmlElement(parent, 'text', userID);
    // createHtmlElement(parent, 'p');
    // title
    createHtmlElement(parent, 'h3', 'NO DATA YET.');
}

//----------------------------------------------------------------
// Functions of Common Util.

// create html elements
function createHtmlElement(parent, elementName, myInnerText, cssStyle) {

    var element = document.createElement(elementName);

    if (myInnerText) {
        element.innerText = myInnerText;
    }

    if (cssStyle) {
        element.setAttribute('style', cssStyle);
    }

    parent.append(element);
}