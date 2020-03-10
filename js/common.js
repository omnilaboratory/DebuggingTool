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
var saveTempCI = 'ChannelCreation';

//
var saveAddr = 'addr';

//
var saveFriends = 'list_of_friends';

//
var saveMnemonic = 'mnemonic';

//
var saveGoWhere = 'go_where';

// the info save to local storage [ChannelCreation].
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
        saveChannelCreation(e);
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
        saveChannelCreation(e);
        createOBDResponseDiv(e, msgType);
    });
}

// BTC Funding Created -3400 API at local.
function btcFundingCreated(msgType) {

    var temp_cid = $("#temporary_channel_id").val();
    var privkey  = $("#channel_address_private_key").val();
    var tx_hex   = $("#funding_tx_hex").val();

    let info = new FundingBtcCreated();
    info.temporary_channel_id = temp_cid;
    info.channel_address_private_key = privkey;
    info.funding_tx_hex = tx_hex;

    // OBD API
    obdApi.btcFundingCreated(info, function(e) {
        console.info('btcFundingCreated - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, temp_cid, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// BTC Funding Signed -3500 API at local.
function btcFundingSigned(msgType) {

    var temp_cid = $("#temporary_channel_id").val();
    var privkey  = $("#channel_address_private_key").val();
    var tx_id    = $("#funding_txid").val();
    var approval = $("#checkbox_n3500").prop("checked");

    let info = new FundingBtcSigned();
    info.temporary_channel_id = temp_cid;
    info.channel_address_private_key = privkey;
    info.funding_txid = tx_id;
    info.approval = approval;

    // OBD API
    obdApi.btcFundingSigned(info, function(e) {
        console.info('btcFundingSigned - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, temp_cid, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// Omni Asset Funding Created -34 API at local.
function assetFundingCreated(msgType) {

    var temp_cid = $("#temporary_channel_id").val();
    var t_ad_pbk = $("#temp_address_pub_key").val();
    var t_ad_prk = $("#temp_address_private_key").val();
    var privkey  = $("#channel_address_private_key").val();
    var tx_hex   = $("#funding_tx_hex").val();

    let info = new ChannelFundingCreatedInfo();
    info.temporary_channel_id = temp_cid;
    info.temp_address_pub_key = t_ad_pbk;
    info.temp_address_private_key = t_ad_prk;
    info.channel_address_private_key = privkey;
    info.funding_tx_hex = tx_hex;

    // OBD API
    obdApi.channelFundingCreated(info, function(e) {
        console.info('N34 - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, temp_cid, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// Omni Asset Funding Signed -35 API at local.
function assetFundingSigned(msgType) {

    var channel_id = $("#channel_id").val();
    var privkey  = $("#fundee_channel_address_private_key").val();
    var approval = $("#checkbox_n35").prop("checked");

    let info = new ChannelFundingSignedInfo();
    info.channel_id = channel_id;
    info.fundee_channel_address_private_key = privkey;
    info.approval = approval;

    // OBD API
    obdApi.channelFundingSigned(info, function(e) {
        console.info('N35 - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, channel_id, msgType);
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
        saveChannelCreation(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// funding Omni Asset API at local.
function fundingAsset(msgType) {

    var from_address = $("#from_address").val();
    var from_address_private_key = $("#from_address_private_key").val();
    var to_address   = $("#to_address").val();
    var amount       = $("#amount").val();
    var property_id  = $("#property_id").val();

    let info = new OmniFundingAssetInfo();
    info.from_address = from_address;
    info.from_address_private_key = from_address_private_key;
    info.to_address = to_address;
    info.amount     = Number(amount);
    info.property_id  = Number(property_id);

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
    obdApi.fundingAssetOfOmni(info, function(e) {
        console.info('fundingAssetOfOmni - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// createInvoice API at local.
function createInvoice(msgType) {

    var property_id  = $("#property_id").val();
    var amount       = $("#amount").val();
    var recipient_peer_id  = $("#recipient_peer_id").val();

    let info = new HtlcHInfo();
    info.property_id  = Number(property_id);
    info.amount     = Number(amount);
    info.recipient_peer_id = recipient_peer_id;

    // OBD API
    obdApi.htlcInvoice(info, function(e) {
        console.info('createInvoice - OBD Response = ' + JSON.stringify(e));
        // saveChannelCreation(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// -42 htlcFindPathAndSendH API at local.
function htlcFindPathAndSendH(msgType) {

    var property_id  = $("#property_id").val();
    var amount       = $("#amount").val();
    var recipient_peer_id  = $("#recipient_peer_id").val();
    var h       = $("#h").val();
    var memo    = $("#memo").val();

    let info = new HtlcRequestFindPathAndSendH();
    info.property_id  = Number(property_id);
    info.amount     = Number(amount);
    info.recipient_peer_id = recipient_peer_id;
    info.h     = h;
    info.memo = memo;

    // OBD API
    obdApi.htlcFindPathAndSendH(info, function(e) {
        console.info('-42 htlcFindPathAndSendH - OBD Response = ' + JSON.stringify(e));
        // saveChannelCreation(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// add HTLC API at local.
function addHTLC(msgType) {

    var property_id  = $("#property_id").val();
    var amount       = $("#amount").val();
    var recipient_peer_id  = $("#recipient_peer_id").val();

    let info = new HtlcHInfo();
    info.property_id  = Number(property_id);
    info.amount     = Number(amount);
    info.recipient_peer_id = recipient_peer_id;

    // OBD API
    obdApi.addHtlc(info, function(e) {
        console.info('addHTLC - OBD Response = ' + JSON.stringify(e));
        // saveChannelCreation(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// Commitment Transaction Created -351 API at local.
function CTxCreated(msgType) {

    var channel_id = $("#channel_id").val();
    var amount = $("#amount").val();
    var curr_temp_address_pub_key = $("#curr_temp_address_pub_key").val();
    var curr_temp_address_private_key = $("#curr_temp_address_private_key").val();
    var channel_address_private_key  = $("#channel_address_private_key").val();
    var last_temp_address_private_key   = $("#last_temp_address_private_key").val();

    let info = new CommitmentTx();
    info.channel_id = channel_id;
    info.amount = Number(amount);
    info.curr_temp_address_pub_key = curr_temp_address_pub_key;
    info.curr_temp_address_private_key = curr_temp_address_private_key;
    info.channel_address_private_key = channel_address_private_key;
    info.last_temp_address_private_key = last_temp_address_private_key;

    // OBD API
    obdApi.commitmentTransactionCreated(info, function(e) {
        console.info('CTxCreated - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, channel_id, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// Revoke and Acknowledge Commitment Transaction -352 API at local.
function CTxSigned(msgType) {

    var channel_id = $("#channel_id").val();
    var curr_temp_address_pub_key = $("#curr_temp_address_pub_key").val();
    var curr_temp_address_private_key = $("#curr_temp_address_private_key").val();
    var channel_address_private_key  = $("#channel_address_private_key").val();
    var last_temp_address_private_key   = $("#last_temp_address_private_key").val();
    var request_commitment_hash   = $("#request_commitment_hash").val();
    var approval = $("#checkbox_n352").prop("checked");

    let info = new CommitmentTxSigned();
    info.channel_id = channel_id;
    info.curr_temp_address_pub_key = curr_temp_address_pub_key;
    info.curr_temp_address_private_key = curr_temp_address_private_key;
    info.channel_address_private_key = channel_address_private_key;
    info.last_temp_address_private_key = last_temp_address_private_key;
    info.request_commitment_hash = request_commitment_hash;
    info.approval = approval;

    // OBD API
    obdApi.revokeAndAcknowledgeCommitmentTransaction(info, function(e) {
        console.info('CTxSigned - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, channel_id, msgType);
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
        case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
            btcFundingSigned(msgType);
            break;
        case enumMsgType.MsgType_Core_Omni_FundingAsset_2001:
            fundingAsset(msgType);
            break;
        case enumMsgType.MsgType_FundingCreate_AssetFundingCreated_N34:
            assetFundingCreated(msgType);
            break;
        case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
            assetFundingSigned(msgType);
            break;
        case enumMsgType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
            CTxCreated(msgType);
            break;
        case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
            CTxSigned(msgType);
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
        case enumMsgType.MsgType_HTLC_Invoice_N4003:
            createInvoice(msgType);
            break;
        case enumMsgType.MsgType_HTLC_AddHTLC_N40:
            addHTLC(msgType);
            break;
        case enumMsgType.MsgType_HTLC_FindPathAndSendH_N42:
            htlcFindPathAndSendH(msgType);
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
        case enumMsgType.MsgType_Core_Omni_Getbalance_1200:
        case enumMsgType.MsgType_Core_Omni_FundingAsset_2001:
        case enumMsgType.MsgType_HTLC_Invoice_N4003:
            return;
        case enumMsgType.MsgType_ChannelOpen_N32:
            content.result = 'LAUNCH - ' + content.from + 
                ' - launch an Open Channel request. ';
                // 'The [temporary_channel_id] is : ' + 
                // content.result.temporary_channel_id;
            break;
        case enumMsgType.MsgType_ChannelAccept_N33:
            if (content.result.curr_state === 11) {  // Accept
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
        case enumMsgType.MsgType_FundingCreate_BtcCreate_N3400:
            content.result = 'Notification - ' + content.from + 
                ' - depositing BTC in Channel.';
            break;
        case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
            content.result = 'Reply - ' + content.from + 
                ' - depositing BTC message.';
            break;
        case enumMsgType.MsgType_FundingCreate_AssetFundingCreated_N34:
            content.result = 'Notification - ' + content.from + 
                ' - depositing Omni Asset in Channel.';
            break;
        case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
            content.result = 'Reply - ' + content.from + 
                ' - depositing Omni Asset message.';
            break;
        case enumMsgType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
            content.result = 'RSMC transfer - ' + content.from + 
                ' - launch a transfer.';
            break;
        case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
            content.result = 'RSMC transfer - ' + content.from + 
                ' - accept a transfer.';
            break;
    }

    content = JSON.stringify(content.result);
    content = content.replace("\"","").replace("\"","");
    console.info("OBD DIS - content = ", content);

    // the info save to local storage [ChannelCreation].
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
            case 'ChannelCreation':
                displayUserData(ChannelCreation, inNewHtml);
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
            apiItem.href = 'javascript:void(0);';
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

                createElement(content_div, 'p', 'Input Parameters:');
                // Parameters
                createParamOfAPI(arrParams, content_div);
            }
        }
        
        // display Approval Checkbox
        if (jsonFile === 'json/api_list.json') {
            var msgType = Number(obj.getAttribute("type_id"));
            switch (msgType) {
                case enumMsgType.MsgType_ChannelAccept_N33:
                case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
                case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
                case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
                    displayApprovalCheckbox(content_div, obj, msgType);
                    break;
            }
        }
    });
}

// display Approval Checkbox
function displayApprovalCheckbox(content_div, obj, msgType) {
    
    createElement(content_div, 'text', 'Approval ');
    var element = document.createElement('input');
    switch (msgType) {
        case enumMsgType.MsgType_ChannelAccept_N33:
            element.id   = 'checkbox_n33';
            break;
        case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
            element.id   = 'checkbox_n3500';
            break;
        case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
            element.id   = 'checkbox_n35';
            break;
        case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
            element.id   = 'checkbox_n352';
            break;
    }

    element.type = 'checkbox';
    element.defaultChecked = true;
    element.setAttribute('onclick', 'clickApproval(this)');
    content_div.append(element);
}

// 
function clickApproval(obj) {
    // console.info('clickApproval checked = ' + obj.checked);
    switch (obj.id) {
        case 'checkbox_n33':
            if (obj.checked) {
                $("#funding_pubkey").show();
                $("#funding_pubkeyGet").show();
                $("#funding_pubkeyAut").show();
            } else {
                $("#funding_pubkey").hide();
                $("#funding_pubkeyGet").hide();
                $("#funding_pubkeyAut").hide();
            }
            break;

        case 'checkbox_n3500':
            if (obj.checked) {
                $("#channel_address_private_key").show();
                $("#channel_address_private_keyGet").show();
                // $("#funding_txid").show();
                // $("#funding_txidGet").show();
            } else {
                $("#channel_address_private_key").hide();
                $("#channel_address_private_keyGet").hide();
                // $("#funding_txid").hide();
                // $("#funding_txidGet").hide();
            }
            break;

        case 'checkbox_n35':
            if (obj.checked) {
                $("#fundee_channel_address_private_key").show();
                $("#fundee_channel_address_private_keyGet").show();
            } else {
                $("#fundee_channel_address_private_key").hide();
                $("#fundee_channel_address_private_keyGet").hide();
            }
            break;

        case 'checkbox_n352':
            if (obj.checked) {
                $("#curr_temp_address_pub_key").show();
                $("#curr_temp_address_pub_keyGet").show();
                $("#curr_temp_address_private_key").show();
                $("#curr_temp_address_private_keyGet").show();
                $("#last_temp_address_private_key").show();
                $("#last_temp_address_private_keyGet").show();
                $("#channel_address_private_key").show();
                $("#channel_address_private_keyGet").show();
            } else {
                $("#curr_temp_address_pub_key").hide();
                $("#curr_temp_address_pub_keyGet").hide();
                $("#curr_temp_address_private_key").hide();
                $("#curr_temp_address_private_keyGet").hide();
                $("#last_temp_address_private_key").hide();
                $("#last_temp_address_private_keyGet").hide();
                $("#channel_address_private_key").hide();
                $("#channel_address_private_keyGet").hide();
            }
            break;
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
        case enumMsgType.MsgType_FundingCreate_BtcCreate_N3400:
            parseDataN3400(response);
            break;
        case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
            parseDataN3500(response);
            break;
        case enumMsgType.MsgType_Core_Omni_FundingAsset_2001:
            parseData2001(response);
            break;
        case enumMsgType.MsgType_FundingCreate_AssetFundingCreated_N34:
        case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
            parseDataN34N35(response);
            break;
        case enumMsgType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
            parseDataN351(response);
            break;
        case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
            parseDataN352(response);
            break;
        case enumMsgType.MsgType_HTLC_Invoice_N4003:
            parseDataN4003(response);
            break;
        case enumMsgType.MsgType_HTLC_AddHTLC_N40:
            parseDataN40(response);
            break;
        case enumMsgType.MsgType_HTLC_FindPathAndSendH_N42:
            parseDataN42(response);
            break;
        default:
            createElement(obd_response_div, 'p', response);
            break;
    }
}

//----------------------------------------------------------------
// Functions of processing each response from invoke APIs.

// parseDataN42 - 
function parseDataN42(response) {
    var arrData = [
        'h : ' + response.h,
        'request_hash : ' + response.request_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// parseDataN40 - 
function parseDataN40(response) {
    var arrData = [
        'recipient_peer_id : ' + response.recipient_peer_id,
        'amount : ' + response.amount,
        'property_id : ' + response.propertyId,
        'msg : ' + response.msg,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// parseDataN4003 - 
function parseDataN4003(response) {
    var arrData = [
        'recipient_peer_id : ' + response.recipient_peer_id,
        'amount : ' + response.amount,
        'property_id : ' + response.propertyId,
        'msg : ' + response.msg,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// parseDataN352 - 
function parseDataN352(response) {
    var arrData = [
        'channel_id : ' + response.channel_id,
        'property_id : ' + response.property_id,
        'amount_to_htlc : ' + response.amount_to_htlc,
        'amount_to_other : ' + response.amount_to_other,
        'amount_to_rsmc : ' + response.amount_to_rsmc,
        'create_at : ' + response.create_at,
        'create_by : ' + response.create_by,
        'curr_hash : ' + response.curr_hash,
        'curr_state : ' + response.curr_state,
        'htlc_h : ' + response.htlc_h,
        'htlc_multi_address : ' + response.htlc_multi_address,
        'htlc_multi_address_script_pub_key : ' + response.htlc_multi_address_script_pub_key,
        'htlc_r : ' + response.htlc_r,
        'htlc_redeem_script : ' + response.htlc_redeem_script,
        'htlc_sender : ' + response.htlc_sender,
        'htlc_temp_address_pub_key : ' + response.htlc_temp_address_pub_key,
        'htlc_tx_hash : ' + response.htlc_tx_hash,
        'htlc_txid : ' + response.htlc_txid,
        'id : ' + response.id,
        'input_amount : ' + response.input_amount,
        'input_txid : ' + response.input_txid,
        'input_vout : ' + response.input_vout,
        'last_commitment_tx_id : ' + response.last_commitment_tx_id,
        'last_edit_time : ' + response.last_edit_time,
        'last_hash : ' + response.last_hash,
        'owner : ' + response.owner,
        'peer_id_a : ' + response.peer_id_a,
        'peer_id_b : ' + response.peer_id_b,
        'rsmc_multi_address : ' + response.rsmc_multi_address,
        'rsmc_multi_address_script_pub_key : ' + response.rsmc_multi_address_script_pub_key,
        'rsmc_redeem_script : ' + response.rsmc_redeem_script,
        'rsmc_temp_address_pub_key : ' + response.rsmc_temp_address_pub_key,
        'rsmc_tx_hash : ' + response.rsmc_tx_hash,
        'rsmc_txid : ' + response.rsmc_txid,
        'send_at : ' + response.send_at,
        'sign_at : ' + response.sign_at,
        'to_other_tx_hash : ' + response.to_other_tx_hash,
        'to_other_txid : ' + response.to_other_txid,
        'tx_type : ' + response.tx_type,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// parseDataN351 - 
function parseDataN351(response) {
    var arrData = [
        'channel_id : ' + response.channel_id,
        'amount : ' + response.amount,
        'property_id : ' + response.property_id,
        'channel_address_private_key : ' + response.channel_address_private_key,
        'curr_temp_address_pub_key : ' + response.curr_temp_address_pub_key,
        'curr_temp_address_private_key : ' + response.curr_temp_address_private_key,
        'last_temp_address_private_key : ' + response.last_temp_address_private_key,
        'request_commitment_hash : ' + response.request_commitment_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// parseDataN34N35 - 
function parseDataN34N35(response) {
    var arrData = [
        'channel_id : ' + response.channel_id,
        'channel_info_id : ' + response.channel_info_id,
        'amount_a : ' + response.amount_a,
        'amount_b : ' + response.amount_b,
        'property_id : ' + response.property_id,
        'create_at : ' + response.create_at,
        'create_by : ' + response.create_by,
        'curr_state : ' + response.curr_state,
        'fundee_sign_at : ' + response.fundee_sign_at,
        'funder_address : ' + response.funder_address,
        'funder_pub_key_2_for_commitment : ' + response.funder_pub_key_2_for_commitment,
        'funding_output_index : ' + response.funding_output_index,
        'funding_tx_hex : ' + response.funding_tx_hex,
        'funding_txid : ' + response.funding_txid,
        'id : ' + response.id,
        'peer_id_a : ' + response.peer_id_a,
        'peer_id_b : ' + response.peer_id_b,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// parseDataN2001 - 
function parseData2001(response) {
    createElement(obd_response_div, 'p', response.hex);
}

// parseDataN3500 - 
function parseDataN3500(response) {
    var arrData = [
        'channel_id : ' + response.channel_id,
        'temporary_channel_id : ' + response.temporary_channel_id,
        'create_at : ' + response.create_at,
        'id : ' + response.id,
        'owner : ' + response.owner,
        'txid : ' + response.txid,
        'tx_hash : ' + response.tx_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// parseDataN3400 - 
function parseDataN3400(response) {
    var arrData = [
        'temporary_channel_id : ' + response.temporary_channel_id,
        'funding_txid : ' + response.funding_txid,
        'amount : ' + response.amount,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// parseData1009 - 
function parseData1009(response) {
    var arrData = [
        'hex : ' + response.hex,
        'txid : ' + response.txid,
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

// Record full flow channel data.
function channelData(response) {

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
function btcData(response, msgType) {
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

// transfer (RSMC) record.
function rsmcData(response, msgType) {
    var rsmcData = {
        channel_id: response.channel_id,
        amount: response.amount,
        property_id:  response.property_id,
        request_commitment_hash: response.request_commitment_hash,
        date: new Date().toLocaleString(),
        msgType: msgType,
        
        amount_to_htlc: '',
        amount_to_other: '',
        amount_to_rsmc: '',
        rsmc_multi_address: '',
        rsmc_txid: '',
        send_at: '',
        sign_at: '',
        to_other_txid: '',
    }

    return rsmcData;
}

//
function updateRsmcData(response, data, msgType) {
    data.msgType = msgType;
    data.date    = new Date().toLocaleString();
    data.amount_to_htlc = response.amount_to_htlc;
    data.amount_to_other = response.amount_to_other;
    data.amount_to_rsmc = response.amount_to_rsmc;
    data.rsmc_multi_address = response.rsmc_multi_address;
    data.rsmc_txid = response.rsmc_txid;
    data.send_at = response.send_at;
    data.sign_at = response.sign_at;
    data.to_other_txid = response.to_other_txid;
}

// Depositing omni assets record.
function omniAssetData(response, msgType) {
    var omniAsset = {
        from_address: $("#from_address").val(),
        amount: $("#amount").val(),
        property_id: $("#property_id").val(),
        hex:  response.hex,
        date: new Date().toLocaleString(),
        msgType: msgType,

        channel_id: '',
        amount_a: '',
        amount_b: '',
        peer_id_a: '',
        peer_id_b: '',
        create_at: '',
        create_by: '',
        curr_state: '',
        fundee_sign_at: '',
        funder_address: '',
        funder_pub_key_2_for_commitment: '',
        funding_output_index: '',
        funding_tx_hex: '',
        funding_txid: '',
    }

    return omniAsset;
}

// 
function dataConstruct(response, tempChID, msgType) {
    var data;
    if (msgType) {
        data = {
            temporary_channel_id: tempChID,
            userID: userID,
            data: [channelData(response)],
            btc:  [btcData(response, msgType)],
            omniAsset: [omniAssetData(response, msgType)],
            transfer: [],
            htlc: [],
        }
    } else {
        data = {
            temporary_channel_id: tempChID,
            userID: userID,
            data: [channelData(response)],
            btc: [],
            omniAsset: [],
            transfer: [],
            htlc: [],
        }
    }

    return data;
}

// Non-finalized channel information.
function saveChannelCreation(response, channelID, msgType) {
    var chID;
    var list = JSON.parse(localStorage.getItem(saveTempCI));

    if (response.temporary_channel_id) {
        chID = response.temporary_channel_id;
    } else {
        chID = channelID;
    }

    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            if (chID === list.result[i].temporary_channel_id) {
                switch (msgType) {
                    case enumMsgType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
                        list.result[i].transfer.push(rsmcData(response, msgType));
                        break;
                    case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
                        for (let i2 = 0; i2 < list.result[i].transfer.length; i2++) {
                            if ($("#request_commitment_hash").val() === list.result[i].transfer[i2].request_commitment_hash) {
                                updateRsmcData(response, list.result[i].transfer[i2], msgType);
                            }
                        }
                        break;
                    case enumMsgType.MsgType_Core_FundingBTC_1009:
                        list.result[i].btc.push(btcData(response, msgType));
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
                                // list.result[i].btc[i2].txid = response.txid;
                                // list.result[i].btc[i2].hex  = response.tx_hash;
                                list.result[i].btc[i2].msgType = msgType;
                                list.result[i].btc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    case enumMsgType.MsgType_Core_Omni_FundingAsset_2001:
                        list.result[i].omniAsset.push(omniAssetData(response, msgType));
                        break;
                    case enumMsgType.MsgType_FundingCreate_AssetFundingCreated_N34:
                        for (let i2 = 0; i2 < list.result[i].omniAsset.length; i2++) {
                            if ($("#funding_tx_hex").val() === list.result[i].omniAsset[i2].hex) {
                                list.result[i].temporary_channel_id = response.channel_id;
                                updateOmniAssetData(response, list.result[i].omniAsset[i2], msgType);
                            }
                        }
                        break;
                    case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
                        for (let i2 = 0; i2 < list.result[i].omniAsset.length; i2++) {
                            if ($("#channel_id").val() === list.result[i].omniAsset[i2].channel_id) {
                                updateOmniAssetData(response, list.result[i].omniAsset[i2], msgType);
                            }
                        }
                        break;
                    default:
                        list.result[i].data.push(channelData(response));
                        break;
                }

                localStorage.setItem(saveTempCI, JSON.stringify(list));
                return;
            }
        }

        // A new 
        list.result.push(dataConstruct(response, chID, msgType));
        localStorage.setItem(saveTempCI, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [dataConstruct(response, chID, msgType)]
        }
        localStorage.setItem(saveTempCI, JSON.stringify(data));
    }
}

//
function updateOmniAssetData(response, data, msgType) {
    data.msgType = msgType;
    data.date    = new Date().toLocaleString();
    data.channel_id = response.channel_id;
    data.amount_a = response.amount_a;
    data.amount_b = response.amount_b;
    data.peer_id_a = response.peer_id_a;
    data.peer_id_b = response.peer_id_b;
    data.create_at = response.create_at;
    data.create_by = response.create_by;
    data.curr_state = response.curr_state;
    data.fundee_sign_at = response.fundee_sign_at;
    data.funder_address = response.funder_address;
    data.funder_pub_key_2_for_commitment = response.funder_pub_key_2_for_commitment;
    data.funding_output_index = response.funding_output_index;
    data.funding_tx_hex = response.funding_tx_hex;
    data.funding_txid = response.funding_txid;
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

// get balance of btc and omni assets of an address.
function getBalance(strAddr) {
    // console.info('strAddr = ' + strAddr);

    var result;

    // OBD API
    obdApi.getBtcBalanceByAddress(strAddr, function(e) {
        console.info('getBtcBalance - OBD Response = ' + JSON.stringify(e));
        result = JSON.stringify(e);
        result = result.replace("\"","").replace("\"","");
        result = parseFloat(result);
        result = 'BALANCE : ' + result + ' BTC ';
        $("#" + strAddr).text(result);
    });

    // for omni assets
    obdApi.omniGetAllBalancesForAddress(strAddr, function(e) {
        console.info('omniGetAllBalancesForAddress - OBD Response = ' + JSON.stringify(e));
        
        if (e != "") {
            for (let i = 0; i < e.length; i++) {
                result += ' *** ' + parseFloat(e[i].balance) + ' ' + e[i].name + 
                    ' (Property ID: ' + e[i].propertyid + ')';
            }
            $("#" + strAddr).text(result);
        }
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
        case 'ChannelCreation':
            displayChannelCreation(param);
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
    var clickFunc = "getBalance('" + strAddr + "')";
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

// List of channel creation process records.
function displayChannelCreation(param) {
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
            // createElement(parent, 'h4', 'NO. ' + (i + 1) + 
            //     ' - Temp Channel ID is: ' + list.result[i].temporary_channel_id);
            createElement(parent, 'h4', 'NO. ' + (i + 1));
            
            // Display channel id in creation process.
            channelID(parent, list, i);

            // Display channel info.
            partChannelInfo(parent, list, i)
            
            // Display depositing btc record.
            btcRecord(parent, list, i);
            
            // Display depositing omni asset record.
            omniAssetRecord(parent, list, i);
            
            // Display RSMC - transfer in channel.
            rsmcRecord(parent, list, i);
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createElement(parent, 'h3', 'NO DATA YET.');
    }
}

// Display channel id in creation process.
function channelID(parent, list, i) {
    // var msgType;
    try {
        var msgType = list.result[i].omniAsset[0].msgType;
    } catch (error) {}

    if (msgType === enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35) {
        createElement(parent, 'h4', 'DONE - Channel ID : ' + 
            list.result[i].temporary_channel_id);
    } else {
        createElement(parent, 'h4', 'TEMP - Channel ID : ' + 
            list.result[i].temporary_channel_id);
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
function btcRecord(parent, list, i) {

    var arrData;

    if (list.result[i].btc[0]) {
        createElement(parent, 'h5', '--> DEPOSITING - BTC Record');
        for (let i2 = 0; i2 < list.result[i].btc.length; i2++) {
            createElement(parent, 'br');
            createElement(parent, 'text', 'NO. ' + (i2 + 1));

            var status;
            switch (list.result[i].btc[i2].msgType) {
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
            createElement(parent, 'text', ' -- ' + list.result[i].btc[i2].date);
            createElement(parent, 'br');
            createElement(parent, 'text', '---------------------------------------------');
            createElement(parent, 'br');

            arrData = [
                'from_address : '   + list.result[i].btc[i2].from_address,
                'amount : '   + list.result[i].btc[i2].amount,
                'txid : '   + list.result[i].btc[i2].txid,
                'hex : '   + list.result[i].btc[i2].hex,
            ];

            for (let i3 = 0; i3 < arrData.length; i3++) {
                createElement(parent, 'text', arrData[i3]);
                createElement(parent, 'br');
            }
        }
    }
}

// Display depositing omni asset record.
function omniAssetRecord(parent, list, i) {

    var arrData;

    if (list.result[i].omniAsset[0]) {
        createElement(parent, 'h5', '--> DEPOSITING - Omni Asset Record');
        for (let i2 = 0; i2 < list.result[i].omniAsset.length; i2++) {
            // createElement(parent, 'br');
            // createElement(parent, 'text', 'NO. ' + (i4 + 1));

            var status;
            switch (list.result[i].omniAsset[i2].msgType) {
                case enumMsgType.MsgType_Core_Omni_FundingAsset_2001:
                    status = 'Precharge (2001)';
                    break;
                case enumMsgType.MsgType_FundingCreate_AssetFundingCreated_N34:
                    status = 'Noticed (-34)';
                    break;
                case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
                    status = 'Confirmed (-35)';
                    break;
            }

            createElement(parent, 'text', ' -- ' + status);
            createElement(parent, 'text', ' -- ' + list.result[i].omniAsset[i2].date);
            createElement(parent, 'br');
            createElement(parent, 'text', '---------------------------------------------');
            createElement(parent, 'br');

            arrData = [
                'from_address : '   + list.result[i].omniAsset[i2].from_address,
                'amount : '   + list.result[i].omniAsset[i2].amount,
                'property_id : '   + list.result[i].omniAsset[i2].property_id,
                'hex : '   + list.result[i].omniAsset[i2].hex,

                '----------------------',
                'channel_id : '   + list.result[i].omniAsset[i2].channel_id,
                'amount_a : '   + list.result[i].omniAsset[i2].amount_a,
                'amount_b : '   + list.result[i].omniAsset[i2].amount_b,
                'peer_id_a : '   + list.result[i].omniAsset[i2].peer_id_a,
                'peer_id_b : '   + list.result[i].omniAsset[i2].peer_id_b,
                'create_at : '   + list.result[i].omniAsset[i2].create_at,
                'create_by : '   + list.result[i].omniAsset[i2].create_by,
                'curr_state : '   + list.result[i].omniAsset[i2].curr_state,
                'fundee_sign_at : '   + list.result[i].omniAsset[i2].fundee_sign_at,
                'funder_address : '   + list.result[i].omniAsset[i2].funder_address,
                'funder_pub_key_2_for_commitment : '   + list.result[i].omniAsset[i2].funder_pub_key_2_for_commitment,
                'funding_output_index : '   + list.result[i].omniAsset[i2].funding_output_index,
                'funding_tx_hex : '   + list.result[i].omniAsset[i2].funding_tx_hex,
                'funding_txid : '   + list.result[i].omniAsset[i2].funding_txid,
            ];

            for (let i3 = 0; i3 < arrData.length; i3++) {
                createElement(parent, 'text', arrData[i3]);
                createElement(parent, 'br');
            }
        }
    }
}

// Display RSMC - transfer in channel.
function rsmcRecord(parent, list, i) {

    var arrData;

    if (list.result[i].transfer[0]) {
        createElement(parent, 'h5', '--> RSMC - transfer in channel');
        for (let i2 = 0; i2 < list.result[i].transfer.length; i2++) {
            createElement(parent, 'br');
            createElement(parent, 'text', 'NO. ' + (i2 + 1));

            var status;
            switch (list.result[i].transfer[i2].msgType) {
                case enumMsgType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
                    status = 'Pre-transfer (-351)';
                    break;
                case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
                    status = 'Done transfer (-352)';
                    break;
            }

            createElement(parent, 'text', ' -- ' + status);
            createElement(parent, 'text', ' -- ' + list.result[i].transfer[i2].date);
            createElement(parent, 'br');
            createElement(parent, 'text', '---------------------------------------------');
            createElement(parent, 'br');

            arrData = [
                'channel_id : '   + list.result[i].transfer[i2].channel_id,
                'amount : '   + list.result[i].transfer[i2].amount,
                'property_id : '   + list.result[i].transfer[i2].property_id,
                'request_commitment_hash : '   + list.result[i].transfer[i2].request_commitment_hash,

                '----------------------',
                'amount_to_htlc : '   + list.result[i].transfer[i2].amount_to_htlc,
                'amount_to_other : '   + list.result[i].transfer[i2].amount_to_other,
                'amount_to_rsmc : '   + list.result[i].transfer[i2].amount_to_rsmc,
                'rsmc_multi_address : '   + list.result[i].transfer[i2].rsmc_multi_address,
                'rsmc_txid : '   + list.result[i].transfer[i2].rsmc_txid,
                'send_at : '   + list.result[i].transfer[i2].send_at,
                'sign_at : '   + list.result[i].transfer[i2].sign_at,
                'to_other_txid : '   + list.result[i].transfer[i2].to_other_txid,
            ];

            for (let i3 = 0; i3 < arrData.length; i3++) {
                createElement(parent, 'text', arrData[i3]);
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