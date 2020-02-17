function onClickSend(param) {
    type_id = $("#type_id").html().toString().replace(' ', '');
    type_id = type_id.substring(type_id.indexOf('(') + 1, type_id.indexOf(')'));
    msgType = 0;
    if (type_id != '') {
        msgType = parseInt(type_id);
    }
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


    let inputData = {};
    switch (msgType) {
        case ApiType.MsgType_UserLogin_1:
            /* TODO get the data from input data
             */
            api.SendLogin(inputData);
            break;
        case ApiType.MsgType_Core_GetNewAddress_1001:
            api.SendGetNewAddress();
            break;
        case ApiType.MsgType_Mnemonic_CreateAddress_N200:
            api.SendNewAddressOnLogin();
            break;
        default:
            console.info(apiName, "not exsit");
            break;
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