var obdApi = new ObdApi();
var enumMsgType = new MessageType();

// Save connection status.
var isConnectToOBD = false;

// Save login status.
var isLogined = false;

// Save userID of a user already logined.
var userID;

// cssStyle
var cssStyle = 'color:gray';

// save OBD messages
var obdMessages = '';

// mnemonic using for login
var mnemonicWithLogined = '';

//
var inNewHtml = 'inNewHtml';

//
var saveTempCI = 'tempChannelInfo';

//
var saveAddr = 'addr';

//
var saveFriends = 'list_of_friends';

//
var saveMnemonic = 'mnemonic';

//
var saveGoWhere = 'go_where';

// the info save to local storage [tempChannelInfo].
var channelInfo;

// word wrap code.
// result.setAttribute('style', 'word-break: break-all;white-space: normal;');

// Get name of saveGoWhere variable.
function getSaveName() {
    return saveGoWhere;
}

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
        saveFriendsList(name);
        // Save Non-finalized channel information.
        saveTempChannelInfo(e);
        createOBDResponseDiv(e, msgType);
    });
}

// accept Channel API at local.
function acceptChannel(msgType) {

    var temp_cid = $("#temporary_channel_id").val();
    var pubkey   = $("#funding_pubkey").val();
    var approval = $("#checkbox_n33").prop("checked");

    // console.info('VALUE = ' + temp_cid + ' | ' + pubkey + ' | ' + approval);

    let info = new AcceptChannelInfo();
    info.temporary_channel_id = temp_cid;
    info.funding_pubkey = pubkey;
    info.approval = approval;

    // OBD API
    obdApi.acceptChannel(info, function(e) {
        console.info('acceptChannel - OBD Response = ' + JSON.stringify(e));
        // Save Non-finalized channel information.
        saveTempChannelInfo(e);
        createOBDResponseDiv(e, msgType);
    });
}

// BTC Funding Created -3400 API at local.
function btcFundingCreated(msgType) {

    // OBD API
    obdApi.fundingBTC(info, function(e) {
        console.info('fundingBTC - OBD Response = ' + JSON.stringify(e));
        saveTempChannelInfo(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// funding BTC API at local.
function fundingBTC(msgType) {

    var from_address = $("#from_address").val();
    var from_address_private_key = $("#from_address_private_key").val();
    var to_address   = $("#to_address").val();
    var amount       = $("#amount").val();
    var miner_fee    = $("#miner_fee").val();

    let info = new BtcFundingInfo();
    info.from_address = from_address;
    info.from_address_private_key = from_address_private_key;
    info.to_address = to_address;
    info.amount     = Number(amount);
    info.miner_fee  = Number(miner_fee);

    // Get temporary_channel_id with channel_address.
    var tempChID;
    var list = JSON.parse(localStorage.getItem(saveTempCI));
    for (let i = 0; i < list.result.length; i++) {
        for (let i2 = 0; i2 < list.result[i].data.length; i2++) {
            if (to_address === list.result[i].data[i2].channel_address) {
                tempChID = list.result[i].data[i2].temporary_channel_id;
            }
        }
    }

    // OBD API
    obdApi.fundingBTC(info, function(e) {
        console.info('fundingBTC - OBD Response = ' + JSON.stringify(e));
        saveTempChannelInfo(e, tempChID, msgType);
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
            fundingBTC(msgType);
            break;
        case enumMsgType.MsgType_FundingCreate_BtcCreate_N3400:
            btcFundingCreated(msgType);
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
        case enumMsgType.MsgType_Core_BalanceByAddress_1008:
        case enumMsgType.MsgType_Core_FundingBTC_1009:
            return;
        case enumMsgType.MsgType_ChannelOpen_N32:
            content.result = 'LAUNCH - ' + content.from + 
                ' - launch an Open Channel request. ';
                // 'The [temporary_channel_id] is : ' + 
                // content.result.temporary_channel_id;
            break;
        case enumMsgType.MsgType_ChannelAccept_N33:
            if (content.result.curr_state === 20) {  // Accept
                content.result = 'ACCEPT - ' + content.from + 
                    ' - accept Open Channel request. ';
                    // 'The [temporary_channel_id] is : ' + 
                    // content.result.temporary_channel_id;
            } else if (content.result.curr_state === 30) { // Not Accept
                content.result = 'DECLINE - ' + content.from + 
                    ' - decline Open Channel request. ';
                    // 'The [temporary_channel_id] is : ' + 
                    // content.result.temporary_channel_id;
            }
            break;
    }

    content = JSON.stringify(content.result);
    content = content.replace("\"","").replace("\"","");
    console.info("OBD DIS - content = ", content);

    // the info save to local storage [tempChannelInfo].
    channelInfo = content;

    // Some case do not need displayed.
    if (content === 'already login' || content === 'undefined') return;

    obdMessages += content + '\n\n';
    $("#obd_messages").val(obdMessages);
}

// getUserDataList
function getUserDataList(goWhere) {

    var api_id, description, apiItem;
    var jsonFile = "json/user_data_list.json";

    // dynamic create api_list div.
    $.getJSON(jsonFile, function(result) {
        // get [user_data_list] div
        var apiList = $("#user_data_list");

        for (let i = 0; i < result.data.length; i++) {
            api_id = result.data[i].id;
            description = result.data[i].description;

            // create [a] element
            apiItem = document.createElement('a');
            apiItem.id = api_id;
            apiItem.href = '#';
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
            case 'Addresses':
                displayUserData(Addresses, inNewHtml);
                break;
            case 'Friends':
                displayUserData(Friends);
                break;
            case 'TempChannelInfo':
                displayUserData(TempChannelInfo, inNewHtml);
                break;
        }
    });
}

// getUtilList
function getUtilList() {
    var jsonFile = "json/util_list.json";
    var divName  = "#util_list";

    createLeftSideMenu(jsonFile, divName);
}

// getAPIList
function getAPIList() {
    var jsonFile = "json/api_list.json";
    var divName  = "#api_list";

    createLeftSideMenu(jsonFile, divName);
}

// createLeftSideMenu
function createLeftSideMenu(jsonFile, divName) {

    var api_id, type_id, description, apiItem;

    // dynamic create api_list div.
    $.getJSON(jsonFile, function(result) {
        // get [api_list] div
        var apiList = $(divName);

        for (let i = 0; i < result.data.length; i++) {
            api_id = result.data[i].id;
            type_id = result.data[i].type_id;
            description = result.data[i].description;

            // create [a] element
            apiItem = document.createElement('a');
            apiItem.id = api_id;
            apiItem.href = '#';
            apiItem.setAttribute('type_id', type_id);
            apiItem.setAttribute('description', description);
            apiItem.setAttribute('onclick', 'displayAPIContent(this)');
            apiItem.innerText = api_id;
            apiList.append(apiItem);

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
    createInvokeAPIButton(obj);
}

// create 
function createApiNameDiv(obj) {
    var content_div = $("#name_req_div");
    // create [api_name] element
    createElement(content_div, 'h2', obj.innerHTML);
    // create [api_description] element
    createElement(content_div, 'text', obj.getAttribute("description"));
}

// create 
function createRequestDiv(obj) {
    var content_div = $("#name_req_div");

    // create [title] element
    createElement(content_div, 'h2', 'Request');

    // create [func_title] element
    createElement(content_div, 'text', 'func: ', cssStyle);

    // create [func_name] element: id = JS function name.
    createElement(content_div, 'text', obj.getAttribute("id"));

    // create [type_id] element
    var value = " type ( " + obj.getAttribute("type_id") + " )";
    createElement(content_div, 'text', value, cssStyle);
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
                createElement(content_div, 'p', 'Input Parameters:');
                
                // Parameters
                createParamOfAPI(arrParams, content_div);
            }
        }
        
        // For AcceptChannel api.
        if (jsonFile === 'json/api_list.json') {
            var type_id = Number(obj.getAttribute("type_id"));

            if (type_id === enumMsgType.MsgType_ChannelAccept_N33) {
                // console.info('CHECKBOX');
                createElement(content_div, 'text', 'Approval ');
    
                var element = document.createElement('input');
                element.id   = 'checkbox_n33';
                element.type = 'checkbox';
                element.defaultChecked = true;
                element.setAttribute('onclick', 'clickApproval(this)');
                content_div.append(element);
            }

            if (type_id === enumMsgType.MsgType_FundingSign_BtcSign_N3500) {
                createElement(content_div, 'text', 'Approval ');
    
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
        createElement(content_div, 'text', arrParams[i].name + ' : ', cssStyle);

        // create [input box of param] element
        input_box = document.createElement('input');
        input_box.id = arrParams[i].name;
        content_div.append(input_box);

        createButtonOfParam(arrParams, i, content_div);
        createElement(content_div, 'p');
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

    createElement(content_div, 'p');

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
    $("#name_req_div").remove();
    var name_req_div = document.createElement('div');
    name_req_div.id  = "name_req_div";
    $("#content").append(name_req_div);
}

// create ConnectNodeDiv
function createConnectNodeDiv() {
    var content_div = $("#name_req_div");

    // create [title] element
    createElement(content_div, 'h2', 'OBD Node');

    // create [input title] element
    createElement(content_div, 'text', 'Node URL: ', cssStyle);

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
        createElement(content_div, 'h3', 'Already connected.');
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
    createElement(obd_response_div, 'h2', 'OBD Response');

    switch (msgType) {
        case enumMsgType.MsgType_Mnemonic_CreateAddress_N200:
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_201:
            parseDataN200(response);
            break;
        case enumMsgType.MsgType_ChannelOpen_N32:
            parseDataN32(response);
            break;
        case enumMsgType.MsgType_ChannelAccept_N33:
            parseDataN33(response);
            break;
        case enumMsgType.MsgType_Core_FundingBTC_1009:
            parseData1009(response);
            break;
        default:
            createElement(obd_response_div, 'p', response);
            break;
    }
}

//----------------------------------------------------------------
// Functions of processing each response from invoke APIs.

// parseData1009 - 
function parseData1009(response) {
    var arrData = [
        'HEX : ' + response.hex,
        'TXID : ' + response.txid,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// parseDataN200 - getNewAddressWithMnemonic
function parseDataN200(response) {
    var arrData = [
        'ADDRESS : ' + response.result.address,
        'INDEX : '   + response.result.index,
        'PUB_KEY : ' + response.result.pubkey,
        'WIF : '     + response.result.wif
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
        // createElement(obd_response_div, 'p');
    }
}

// processing -32 openChannel data.
function parseDataN32(response) {
    var arrData = [
        'chain_hash : ' + response.chain_hash,
        'channel_reserve_satoshis : ' + response.channel_reserve_satoshis,
        'delayed_payment_base_point : ' + response.delayed_payment_base_point,
        'dust_limit_satoshis : ' + response.dust_limit_satoshis,
        'fee_rate_per_kw : ' + response.fee_rate_per_kw,
        'funding_address : ' + response.funding_address,
        'funding_pubkey : ' + response.funding_pubkey,
        'funding_satoshis : ' + response.funding_satoshis,
        'htlc_base_point : ' + response.htlc_base_point,
        'htlc_minimum_msat : ' + response.htlc_minimum_msat,
        'max_accepted_htlcs : ' + response.max_accepted_htlcs,
        'max_htlc_value_in_flight_msat : ' + response.max_htlc_value_in_flight_msat,
        'payment_base_point : ' + response.payment_base_point,
        'push_msat : ' + response.push_msat,
        'revocation_base_point : ' + response.revocation_base_point,
        'temporary_channel_id : ' + response.temporary_channel_id,
        'to_self_delay : ' + response.to_self_delay,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// processing -33 Accept Channel data.
function parseDataN33(response) {
    // curr_state = 20 is accept open channel request.
    // curr_state = 30 is NOT accept open channel request.
    var arrData = [
        'accept_at : ' + response.accept_at,
        'address_a : ' + response.address_a,
        'address_b : ' + response.address_b,
        'chain_hash : ' + response.chain_hash,
        'channel_address : ' + response.channel_address,
        'channel_address_redeem_script : ' + response.channel_address_redeem_script,
        'channel_address_script_pub_key : ' + response.channel_address_script_pub_key,
        'channel_id : ' + response.channel_id,
        'channel_reserve_satoshis : ' + response.channel_reserve_satoshis,
        'close_at : ' + response.close_at,
        'create_at : ' + response.create_at,
        'create_by : ' + response.create_by,
        'curr_state : ' + response.curr_state,
        'delayed_payment_base_point : ' + response.delayed_payment_base_point,
        'dust_limit_satoshis : ' + response.dust_limit_satoshis,
        'fee_rate_per_kw : ' + response.fee_rate_per_kw,
        'funding_address : ' + response.funding_address,
        'funding_pubkey : ' + response.funding_pubkey,
        'funding_satoshis : ' + response.funding_satoshis,
        'htlc_base_point : ' + response.htlc_base_point,
        'htlc_minimum_msat : ' + response.htlc_minimum_msat,
        'id : ' + response.id,
        'max_accepted_htlcs : ' + response.max_accepted_htlcs,
        'max_htlc_value_in_flight_msat : ' + response.max_htlc_value_in_flight_msat,
        'payment_base_point : ' + response.payment_base_point,
        'peer_id_a : ' + response.peer_id_a,
        'peer_id_b : ' + response.peer_id_b,
        'pub_key_a : ' + response.pub_key_a,
        'pub_key_b : ' + response.pub_key_b,
        'push_msat : ' + response.push_msat,
        'revocation_base_point : ' + response.revocation_base_point,
        'temporary_channel_id : ' + response.temporary_channel_id,
        'to_self_delay : ' + response.to_self_delay,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// get a new index of address
function getNewAddrIndex() {

    var addr = JSON.parse(localStorage.getItem(saveAddr));
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
    
    var addr = JSON.parse(localStorage.getItem(saveAddr));
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
                localStorage.setItem(saveAddr, JSON.stringify(addr));
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
        localStorage.setItem(saveAddr, JSON.stringify(addr));

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
        localStorage.setItem(saveAddr, JSON.stringify(data));
    }
}

// Process data for saveTempChannelInfo func.
function getTempCIData(response) {

    var data = {
        channelInfo: channelInfo,
        create_at: response.create_at,
        create_by: response.create_by,
        accept_at: response.accept_at,
        address_a: response.address_a,
        address_b: response.address_b,
        channel_address: response.channel_address,
        temporary_channel_id: response.temporary_channel_id,
    }

    return data;
}

// Depositing btc record.
function getDepositBTCRecord(response, msgType) {
    var btc = {
        from_address: $("#from_address").val(),
        amount: $("#amount").val(),
        hex:  response.hex,
        txid: response.txid,
        date: new Date().toLocaleString(),
        msgType: msgType,
    }
    return btc;
}

// 
function dataConstruct(response, tempChID, msgType) {
    var data;
    if (msgType) {
        data = {
            temporary_channel_id: tempChID,
            userID: userID,
            data: [getTempCIData(response)],
            btc:  [getDepositBTCRecord(response, msgType)]
        }
    } else {
        data = {
            temporary_channel_id: tempChID,
            userID: userID,
            data: [getTempCIData(response)],
            btc: []
        }
    }

    return data;
}

// Non-finalized channel information.
function saveTempChannelInfo(response, param, msgType) {
    var tempChID;
    var list = JSON.parse(localStorage.getItem(saveTempCI));

    if (response.temporary_channel_id) {
        tempChID = response.temporary_channel_id;
    } else {
        tempChID = param;
    }

    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            if (tempChID === list.result[i].temporary_channel_id) {
                switch (msgType) {
                    case enumMsgType.MsgType_Core_FundingBTC_1009:
                        list.result[i].btc.push(getDepositBTCRecord(response, msgType));
                        break;
                    case enumMsgType.MsgType_FundingCreate_BtcCreate_N3400:
                        for (let i2 = 0; i2 < list.result[i].btc.length; i2++) {
                            if (response.funding_txid === list.result[i].btc[i2].txid) {
                                list.result[i].btc[i2].msgType = msgType;
                                list.result[i].btc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
                        for (let i2 = 0; i2 < list.result[i].btc.length; i2++) {
                            if ($("#funding_txid").val() === list.result[i].btc[i2].txid) {
                                list.result[i].btc[i2].msgType = msgType;
                                list.result[i].btc[i2].txid = response.txid;
                                list.result[i].btc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    default:
                        list.result[i].data.push(getTempCIData(response));
                        break;
                }

                localStorage.setItem(saveTempCI, JSON.stringify(list));
                return;
            }
        }

        // A new 
        list.result.push(dataConstruct(response, tempChID, msgType));
        localStorage.setItem(saveTempCI, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [dataConstruct(response, tempChID, msgType)]
        }
        localStorage.setItem(saveTempCI, JSON.stringify(data));
    }
}

// mnemonic words generated with signUp api save to local storage.
function saveMnemonicData(response) {

    var mnemonic = JSON.parse(localStorage.getItem(saveMnemonic));
    // console.info('localStorage KEY  = ' + addr);

    // If has data.
    if (mnemonic) {
        // console.info('HAS DATA');
        let new_data = {
            mnemonic: response,
        }
        mnemonic.result.push(new_data);
        localStorage.setItem(saveMnemonic, JSON.stringify(mnemonic));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                mnemonic: response
            }]
        }
        localStorage.setItem(saveMnemonic, JSON.stringify(data));
    }
}

// List of friends who have interacted
function saveFriendsList(name) {
    
    // var name = $("#recipient_peer_id").val();
    var list = JSON.parse(localStorage.getItem(saveFriends));

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
        localStorage.setItem(saveFriends, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                name: name
            }]
        }
        localStorage.setItem(saveFriends, JSON.stringify(data));
    }
}

//----------------------------------------------------------------
// Functions of buttons.

// 
function getBtcBalance(strAddr) {
    // console.info('strAddr = ' + strAddr);
    // OBD API
    obdApi.getBtcBalanceByAddress(strAddr, function(e) {
        console.info('getBtcBalance - OBD Response = ' + JSON.stringify(e));
        var result = JSON.stringify(e);
        result     = result.replace("\"","").replace("\"","");
        result     = 'BALANCE : ' + result + ' BTC ';
        $("#" + strAddr).text(result);
    });
}

// Generate new mnemonic words.
function autoCreateMnemonic() {
    // Generate mnemonic by local js library.
    var mnemonic = btctool.generateMnemonic(128);
    $("#mnemonic").val(mnemonic);
    saveMnemonicData(mnemonic);
}

// Generate a new pub key of an address.
function autoCreateFundingPubkey(param) {
    // Generate address by local js library.
    var result = getNewAddressWithMnemonic();
    if (result === '') return;

    switch (param) {
        case 0:
            $("#from_address").val(result.result.address);
            $("#from_address_private_key").val(result.result.wif);
            break;
        default:
            $("#funding_pubkey").val(result.result.pubkey);
            break;
    }

    saveAddrData(result);
}

// auto Calculation Miner Fee
function autoCalcMinerFee() {
    $("#miner_fee").val('0.00001');
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
        case 'Addresses':
            displayAddresses(param);
            break;
        case 'Friends':
            displayFriends();
            break;
        case 'TempChannelInfo':
            displayTempChannelInfo(param);
            break;
    }
}

//
function displayMnemonic() {
    // get [name_req_div] div
    var parent = $("#name_req_div");
    var mnemonic = JSON.parse(localStorage.getItem(saveMnemonic));
    // console.info('localStorage KEY  = ' + addr);

    // If has data
    if (mnemonic) {
        for (let i = 0; i < mnemonic.result.length; i++) {
            createElement(parent, 'h4', 'NO. ' + (i + 1));
            createElement(parent, 'text', mnemonic.result[i].mnemonic);
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createElement(parent, 'h3', 'NO DATA YET. YOU CAN CREATE ONE WITH [signUp].');
    }
}

//
function displayAddresses(param) {
    // get [name_req_div] div
    var parent = $("#name_req_div");

    // console.info('LOGINED userID = '+userID);
    
    if (param === inNewHtml) {
        var status = JSON.parse(localStorage.getItem(saveGoWhere));
        if (!status.isLogined) { // Not login.
            createElement(parent, 'text', 'NO USER LOGINED.');
            return;
        } else {
            userID = status.userID;
        }

    } else {
        if (!isLogined) { // Not login.
            createElement(parent, 'text', 'NO USER LOGINED.');
            return;
        }
    }

    var arrData;
    var addr = JSON.parse(localStorage.getItem(saveAddr));

    // If has data
    if (addr) {
        for (let i = 0; i < addr.result.length; i++) {
            if (userID === addr.result[i].userID) {
                createElement(parent, 'text', addr.result[i].userID);
                createElement(parent, 'h2', 'Address List');

                for (let i2 = 0; i2 < addr.result[i].data.length; i2++) {
                    createElement(parent, 'h4', 'NO. ' + (i2 + 1));
                    var strAddr = addr.result[i].data[i2].address;
                    createBalanceElement(parent, strAddr);

                    arrData = [
                        'ADDRESS : ' + addr.result[i].data[i2].address,
                        'INDEX : '   + addr.result[i].data[i2].index,
                        'PUB_KEY : ' + addr.result[i].data[i2].pubkey,
                        'WIF : '     + addr.result[i].data[i2].wif
                    ];

                    for (let i3 = 0; i3 < arrData.length; i3++) {
                        createElement(parent, 'text', arrData[i3]);
                        createElement(parent, 'br');
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
function createBalanceElement(parent, strAddr) {
    // create [text] element
    var title = document.createElement('text');
    title.id  = strAddr;
    title.innerText = 'BALANCE : ';
    parent.append(title);

    // create [button] element
    var button = document.createElement('button');
    button.innerText = 'Get Balance';
    var clickFunc = "getBtcBalance('" + strAddr + "')";
    button.setAttribute('onclick', clickFunc);
    parent.append(button);

    createElement(parent, 'br');
}

// List of friends who have interacted
function displayFriends() {
    // get [name_req_div] div
    var parent = $("#name_req_div");

    var list = JSON.parse(localStorage.getItem(saveFriends));

    // If has data
    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            // Display list NO.
            createElement(parent, 'h4', 'NO. ' + (i + 1));
            createElement(parent, 'text', list.result[i].name);
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createElement(parent, 'h3', 'NO DATA YET.');
    }
}

// displayTempChannelInfo
function displayTempChannelInfo(param) {
    // get [name_req_div] div
    var parent = $("#name_req_div");

    /*
    if (param === inNewHtml) {
        var status = JSON.parse(localStorage.getItem(saveGoWhere));
        if (!status.isLogined) { // Not login.
            createElement(parent, 'text', 'NO USER LOGINED.');
            return;
        } else {
            userID = status.userID;
        }
        
    } else {
        if (!isLogined) { // Not login.
            createElement(parent, 'text', 'NO USER LOGINED.');
            return;
        }
    }
    */

    var list = JSON.parse(localStorage.getItem(saveTempCI));

    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            createElement(parent, 'h4', 'NO. ' + (i + 1) + 
                ' - Temp Channel ID is: ' + list.result[i].temporary_channel_id);

            // Display channel info.
            partChannelInfo(parent, list, i)
            
            // Display depositing btc record.
            depositingBTCRecord(parent, list, i);
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createElement(parent, 'h3', 'NO DATA YET.');
    }
}

// Display channel info.
function partChannelInfo(parent, list, i) {

    var arrData;

    for (let i2 = 0; i2 < list.result[i].data.length; i2++) {
        var title = list.result[i].data[i2].channelInfo;
        createElement(parent, 'h5', '--> ' + title);
        
        // Construct data will be displayed.
        if (title.substring(0, 6) === 'LAUNCH') {
            arrData = [
                'temporary_channel_id : '   + list.result[i].data[i2].temporary_channel_id,
            ];
        } else {
            arrData = [
                'channel_address : ' + list.result[i].data[i2].channel_address,
                'temporary_channel_id : '   + list.result[i].data[i2].temporary_channel_id,
                'create_at : ' + list.result[i].data[i2].create_at,
                'create_by : '     + list.result[i].data[i2].create_by,
                'accept_at : '     + list.result[i].data[i2].accept_at,
                'address_a : '     + list.result[i].data[i2].address_a,
                'address_b : '     + list.result[i].data[i2].address_b,
            ];
        }

        for (let i3 = 0; i3 < arrData.length; i3++) {
            createElement(parent, 'text', arrData[i3]);
            createElement(parent, 'br');
        }
    }
}

// Display depositing btc record.
function depositingBTCRecord(parent, list, i) {

    var arrData;

    if (list.result[i].btc[0]) {
        createElement(parent, 'h5', '--> DEPOSITING - BTC Record');
        for (let i4 = 0; i4 < list.result[i].btc.length; i4++) {
            createElement(parent, 'br');
            createElement(parent, 'text', 'NO. ' + (i4 + 1));

            var status;
            switch (list.result[i].btc[i4].msgType) {
                case enumMsgType.MsgType_Core_FundingBTC_1009:
                    status = 'Precharge (1009)';
                    break;
                case enumMsgType.MsgType_FundingCreate_BtcCreate_N3400:
                    status = 'Noticed (-3400)';
                    break;
                case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
                    status = 'Confirmed (-3500)';
                    break;
                default:
                    break;
            }

            createElement(parent, 'text', ' -- ' + status);
            createElement(parent, 'text', ' -- ' + list.result[i].btc[i4].date);
            createElement(parent, 'br');
            createElement(parent, 'text', '---------------------------------------------');
            createElement(parent, 'br');

            arrData = [
                'from_address : '   + list.result[i].btc[i4].from_address,
                'amount : '   + list.result[i].btc[i4].amount,
                'txid : '   + list.result[i].btc[i4].txid,
                'hex : '   + list.result[i].btc[i4].hex,
            ];

            for (let i5 = 0; i5 < arrData.length; i5++) {
                createElement(parent, 'text', arrData[i5]);
                createElement(parent, 'br');
            }
        }
    }
}

// 
function displayNoData(parent) {
    // userID
    createElement(parent, 'text', userID);
    // title
    createElement(parent, 'h3', 'NO DATA YET.');
}

//----------------------------------------------------------------
// Functions of Common Util.

// create html elements
function createElement(parent, elementName, myInnerText, cssStyle) {

    var element = document.createElement(elementName);

    if (myInnerText) {
        element.innerText = myInnerText;
    }

    if (cssStyle) {
        element.setAttribute('style', cssStyle);
    }

    parent.append(element);
}

//
function displayUserDataInNewHtml(goWhere) {
    saveGoWhereData(goWhere);
    window.open('userData.html', 'data', 'height=600, width=800, top=150, ' + 
        'left=500, toolbar=no, menubar=no, scrollbars=no, resizable=no, ' + 
        'location=no, status=no');
}

//
function saveGoWhereData(goWhere) {
    let data = {
        goWhere:   goWhere,
        isLogined: isLogined,
        userID:    userID
    }
    localStorage.setItem(saveGoWhere, JSON.stringify(data));
}

// Bitcoin Testnet Faucet
function openTestnetFaucet() {
    window.open('https://testnet-faucet.mempool.co/');
}