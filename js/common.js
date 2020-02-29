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

// word wrap code.
// result.setAttribute('style', 'word-break: break-all;white-space: normal;');


// getNewAddressWithMnemonic by local js library
function getNewAddressWithMnemonic() {
    if (!isLogined) { // Not logined
        alert('Please login first.');
        return '';
    }

    var newIndex = getNewAddrIndex();
    // console.info('mnemonicWithLogined = ' + mnemonicWithLogined);
    // console.info('addr index = ' + newIndex);
    
    // True: testnet  False: mainnet
    var result = btctool.generateWalletInfo(mnemonicWithLogined, newIndex, true);
    console.info('local addr data = ' + JSON.stringify(result));

    return result;
}

// get Address Info by local js library
function getAddressInfo() {
    if (!isLogined) { // Not logined
        alert('Please login first.');
        return '';
    }

    var index = $("#index").val();
    console.info('index = ' + index);

    try {
        // True: testnet  False: mainnet
        var result = btctool.generateWalletInfo(mnemonicWithLogined, index, true);
        console.info('local addr data = ' + JSON.stringify(result));
    } catch (error) {
        alert('Please input a valid index of address.');
        return '';
    }

    if (!result.status) {  // status = false
        alert('Please input a valid index of address.');
        return '';
    }

    return result;
}

// logIn API at local.
function logIn(msgType) {

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
        $("#logined").text(userID.substring(0, 10) + '...');
        createOBDResponseDiv(e, msgType);
    });
}

// openChannel API at local.
function openChannel(msgType) {

    var pubkey = $("#funding_pubkey").val();
    var name   = $("#recipient_peer_id").val();
    
    if (name.trim() === '' || pubkey.trim() === '') {
        alert('Please input complete data.');
        return;
    }

    // OBD API
    obdApi.openChannel(pubkey, name, function(e) {
        console.info('openChannel - OBD Response = ' + JSON.stringify(e));

        // Save List of friends who have interacted.
        saveFriends(name);
        createOBDResponseDiv(e, msgType);
    });
}

// accept Channel API at local.
function acceptChannel(msgType) {

    var temp_cid = $("#temporary_channel_id").val();
    var pubkey   = $("#funding_pubkey").val();
    var approval = $("#checkbox_n33").prop("checked");

    console.info('VALUE = ' + temp_cid + ' | ' + pubkey + ' | ' + approval);

    if (approval) {
        if (temp_cid.trim() === '' || pubkey.trim() === '') {
            alert('Please input complete data.');
            return;
        }
    }

    var info = {
        temporary_channel_id: temp_cid,
        funding_pubkey:       pubkey,
        approval:             approval
    }

    console.info('INFO = ' + JSON.stringify(info));

    // OBD API
    obdApi.acceptChannel(info, function(e) {
        console.info('acceptChannel - OBD Response = ' + JSON.stringify(e));
        createOBDResponseDiv(e, msgType);
    });
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
            logIn(msgType);
            break;
        case enumMsgType.MsgType_UserLogout_2:
            obdApi.logout();
            break;
        case enumMsgType.MsgType_GetMnemonic_101:
            // Generate mnemonic by local js library.
            // This is equal OBD api signUp.
            var mnemonic = btctool.generateMnemonic(128);
            saveMnemonicData(mnemonic);
            createOBDResponseDiv(mnemonic);
            break;
        case enumMsgType.MsgType_Core_FundingBTC_1009:
            let info = new BtcFundingInfo();
            obdApi.fundingBTC(info);
            break;
        case enumMsgType.MsgType_Core_Omni_GetTransaction_1206:
            txid = "c76710920860456dff2433197db79dd030f9b527e83a2e253f5bc6ab7d197e73";
            obdApi.getOmniTxByTxid(txid);
            break;
        // Open Channel request.
        case enumMsgType.MsgType_ChannelOpen_N32:
            openChannel(msgType);
            break;
        // Accept Channel request.
        case enumMsgType.MsgType_ChannelAccept_N33:
            acceptChannel(msgType);
            break;
        default:
            console.info(msgType + " do not exist");
            break;
    }
}

// 
function displayOBDMessages(content) {
    console.info("broadcast info:", JSON.stringify(content));

    switch (Number(content.type)) {
        case enumMsgType.MsgType_Error_0:
        case enumMsgType.MsgType_Core_GetNewAddress_1001:
        case enumMsgType.MsgType_Mnemonic_CreateAddress_N200:
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_201:
        case enumMsgType.MsgType_GetMnemonic_101:
            return;
        case enumMsgType.MsgType_ChannelOpen_N32:
            content.result = 'USER : ' + content.from + ' launch an Open Channel request.';
            break;
    }

    content = JSON.stringify(content.result);
    content = content.replace("\"","").replace("\"","");
    console.info("OBD DIS - content = ", content);

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
}

// dynamic create input parameters div area.
function createInputParamDiv(obj, jsonFile) {

    $.getJSON(jsonFile, function(result) {
        // get [content] div
        var content_div = $("#name_req_div");

        // get JS function name.
        var js_func = obj.getAttribute("id");

        for (let i = 0; i < result.data.length; i++) {
            // id = js_func, is JS function name.
            if (js_func === result.data[i].id) {
                var arrParams = result.data[i].parameters;
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
        
        // For AcceptChannel api.
        if (jsonFile === 'json/api_list.json') {
            var type_id = Number(obj.getAttribute("type_id"));
            if (type_id === enumMsgType.MsgType_ChannelAccept_N33) {
                // console.info('CHECKBOX');
                createHtmlElement(content_div, 'text', 'Approval ');
    
                var element = document.createElement('input');
                element.id   = 'checkbox_n33';
                element.type = 'checkbox';
                element.defaultChecked = true;
                element.setAttribute('onclick', 'clickApproval(this)');
                content_div.append(element);
            }
        }
    });
}

// 
function clickApproval(obj) {
    // console.info('clickApproval checked = ' + obj.checked);
    if (obj.checked) {
        $("#funding_pubkey").show();
        $("#funding_pubkeyGet").show();
        $("#funding_pubkeyAut").show();
    } else {
        $("#funding_pubkey").hide();
        $("#funding_pubkeyGet").hide();
        $("#funding_pubkeyAut").hide();
    }
}

// create parameter of each API.
function createParamOfAPI(arrParams, content_div) {

    var input_box;

    for (let i = 0; i < arrParams.length; i++) {
        // create [param_title] element
        createHtmlElement(content_div, 'text', arrParams[i].name + ' : ', cssStyle);

        // create [input box of param] element
        input_box = document.createElement('input');
        input_box.id = arrParams[i].name;
        content_div.append(input_box);

        createButtonOfParam(arrParams, i, content_div);
        createHtmlElement(content_div, 'p');
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
        // console.info('button.id = ' + button.id);
        button.innerText = innerText;
        button.setAttribute('onclick', invokeFunc);
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

        $("#status").text("Connected");
        isConnectToOBD = true; // already connected.
        createOBDResponseDiv(response);
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
        case enumMsgType.MsgType_ChannelOpen_N32:
            parseDataN32(response);
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
    var arrData = [
        'ADDRESS : ' + response.result.address,
        'INDEX : '   + response.result.index,
        'PUB_KEY : ' + response.result.pubkey,
        'WIF : '     + response.result.wif
    ];

    for (let i = 0; i < arrData.length; i++) {
        createHtmlElement(obd_response_div, 'text', arrData[i]);
        createHtmlElement(obd_response_div, 'p');
    }
}

// processing -32 openChannel data.
function parseDataN32(response) {
    var arrData = [
        'chain_hash : ' + response.chain_hash,
        'channel_reserve_satoshis : ' + response.channel_reserve_satoshis,
        'funding_address : ' + response.funding_address,
        'funding_pubkey : ' + response.funding_pubkey,
        'funding_satoshis : ' + response.funding_satoshis,
        'temporary_channel_id : ' + response.temporary_channel_id,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createHtmlElement(obd_response_div, 'text', arrData[i]);
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
                    address: response.result.address,
                    index:   response.result.index,
                    pubkey:  response.result.pubkey,
                    wif:     response.result.wif
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
                address: response.result.address,
                index:   response.result.index,
                pubkey:  response.result.pubkey,
                wif:     response.result.wif
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
                    address: response.result.address,
                    index:   response.result.index,
                    pubkey:  response.result.pubkey,
                    wif:     response.result.wif
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

// List of friends who have interacted
function saveFriends(name) {
    
    // var name = $("#recipient_peer_id").val();
    var list = JSON.parse(localStorage.getItem('list_of_friends'));

    // If has data.
    if (list) {
        // console.info('HAS DATA');
        for (let i = 0; i < list.result.length; i++) {
            if (list.result[i].name === name) return;
        }

        let new_data = {
            name: name,
        }
        list.result.push(new_data);
        window.localStorage.setItem('list_of_friends', JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                name: name
            }]
        }
        window.localStorage.setItem('list_of_friends', JSON.stringify(data));
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
    // Generate address by local js library.
    var result = getNewAddressWithMnemonic();
    if (result === '') return;
    $("#funding_pubkey").val(result.result.pubkey);
    saveAddrData(result);
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
        case 'Friends':
            displayFriends();
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
                        'INDEX : '   + addr.result[i].data[i2].index,
                        'PUB_KEY : ' + addr.result[i].data[i2].pubkey,
                        'WIF : '     + addr.result[i].data[i2].wif
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

// List of friends who have interacted
function displayFriends() {
    // get [name_req_div] div
    var parent = $("#name_req_div");

    var list = JSON.parse(localStorage.getItem('list_of_friends'));

    // If has data
    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            // Display list NO.
            createHtmlElement(parent, 'h4', 'NO. ' + (i + 1));
            createHtmlElement(parent, 'text', list.result[i].name);
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createHtmlElement(parent, 'h3', 'NO DATA YET.');
    }
}

// 
function displayNoData(parent) {
    // userID
    createHtmlElement(parent, 'text', userID);
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