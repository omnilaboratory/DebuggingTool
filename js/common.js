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