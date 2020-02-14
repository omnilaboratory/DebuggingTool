function onClickSend(param) {
    apiName = $("#api_name").html()
    console.info(apiName)
    if (apiName == 'api_name') {
        api.connectToOBD();
        return;
    }
    if (isConnectToOBD == false) {
        alert("not connetToOBD");
        return;
    }
    let inputData = {};
    switch (apiName) {
        case 'LogIn':
            /* TODO get the data from input data
             */
            api.SendLogin(inputData);
            break;
        case 'NewAddress':
            api.SendGetNewAddress();
            break;
        case 'NewAddressWithMnemonic':
            api.SendNewAddressOnLogin();
            break;
        default:
            console.info(apiName, "not exsit");
            break;
    }
}

// getAPIList
function getAPIList() {
    //
    var api_id, type_id, api_name, description;
    let requestURL = 'json/api_list.json';

    // dynamic create api_list div.
    $.getJSON(requestURL, function (result) {
        // get [api_list] div
        apiList = $("#api_list");

        for (let index = 0; index < result.data.length; index++) {
            api_id   = result.data[index].id;
            type_id  = result.data[index].type_id;
            api_name = result.data[index].name;
            description = result.data[index].description;

            // create [a] element
            var apiItem = document.createElement('a');
            apiItem.id = api_id;
            apiItem.href = '#';
            apiItem.setAttribute('type_id', type_id);
            apiItem.setAttribute('description', description);
            apiItem.setAttribute('onclick', 'callAPI(this)');
            apiItem.innerText = api_name;
            apiList.append(apiItem);
    
            var p = document.createElement('p');
            apiList.append(p);
        }
    });
}

//
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
    var parent = document.getElementById('input_para');
    var children_amount = parent.children.length;
    console.log('children = ' + children_amount);

    if (children_amount != 0) {
        for (let index = children_amount - 1; index >= 0; index--) {
            // console.log('index = ' + index);
            parent.removeChild(parent.children[index]);
        }
    }

    // dynamic create input parameters div area.
    let requestURL = 'json/api_list.json';
    $.getJSON(requestURL, function (result) {
        // get [input_para] div
        input_para = $("#input_para");

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
                top_title.id = 'top_title';
                top_title.innerText = 'Input Parameters:';
                input_para.append(top_title);
    
                // Parameters
                for (let index = 0; index < arrParams.length; index++) {
                    // create [param_title] element
                    var param_title = document.createElement('b');
                    param_title.innerText = arrParams[index].name + ' : ';
                    input_para.append(param_title);
    
                    // create [input_box] element
                    var input_box = document.createElement('input');
                    input_box.id = arrParams[index].input;
                    input_para.append(input_box);
    
                    // create buttons
                    var arrButtons = arrParams[index].buttons;
    
                    for (let index = 0; index < arrButtons.length; index++) {
                        innerText  = arrButtons[index].innerText;
                        invokeFunc = arrButtons[index].onclick;

                        // create [button] element
                        var button_get_it = document.createElement('button');
                        button_get_it.setAttribute('onclick', invokeFunc);
                        button_get_it.innerText = innerText;
                        input_para.append(button_get_it);
                    }
                }
            }
        }
    });
}