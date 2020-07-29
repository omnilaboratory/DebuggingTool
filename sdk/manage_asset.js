// manage_asset.js
// Manage assets on Omni Layer platform

/**
 * Type -102113 Protocol is used to create new tokens with fixed amount supply.
 * @param info 
 */
function issueFixedAmount(info) {
    obdApi.issueFixedAmount(info, function(e) {
        console.info('SDK: -102113 issueFixedAmount = ' + JSON.stringify(e));
    });
}

/**
 * Type -102114 Protocol is used to create new tokens with manageable amount supply. 
 * 
 * NOTE: Record the txid returned by the OBD, and then you can use the 
 * getTransaction (type-102118) API to get the property ID of the 
 * manageable asset you issued. 
 * 
 * @param info 
 */
function issueManagedAmout(info) {
    obdApi.issueManagedAmout(info, function(e) {
        console.info('SDK: -102114 issueManagedAmout = ' + JSON.stringify(e));
    });
}

/**
 * Type -102115 Protocol is used to issue or grant new units of managed tokens.
 * @param info 
 */
function sendGrant(info) {
    obdApi.sendGrant(info, function(e) {
        console.info('SDK: -102115 sendGrant = ' + JSON.stringify(e));
    });
}

/**
 * Type -102116 Protocol is used to revoke units of managed tokens.
 * @param info 
 */
function sendRevoke(info) {
    obdApi.sendRevoke(info, function(e) {
        console.info('SDK: -102116 sendRevoke = ' + JSON.stringify(e));
    });
}
