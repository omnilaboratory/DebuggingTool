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
    var api_id, type_id, name;

    let requestURL = 'json/api_list.json';
    $.getJSON(requestURL, function(result) {
        // console.info(data);
        console.info(result.data[0].id);
        console.info(result.data[0].type_id);
        console.info(result.data[0].name);

        api_id  = result.data[0].id;
        type_id = result.data[0].type_id;
        name = result.data[0].name;
    });

    // dynamic create div. get div object
    apiList = $("#api_list").html();
    // var apiList = document.getElementById('api_list');
    console.info('apiList = ' + apiList);

    // create [title] element
    // var top_title = document.createElement('p');
    // top_title.id = 'top_title';
    // top_title.innerText = 'Input Parameters:';
    // input_para.appendChild(top_title);

    // create [a] element
    var apiItem = document.createElement('a');
    apiItem.id = api_id;
    apiItem.href = '#';
    apiItem.setAttribute('type_id', type_id);
    apiItem.setAttribute('onclick', 'callAPI(this)');
    apiItem.innerText = name;
    apiList.appendChild(apiItem);
}

// getAPIList() invoked when page refresh.
getAPIList();