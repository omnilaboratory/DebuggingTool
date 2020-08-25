// contracts.js
// Contracts for Omni BOLT

/**
 * Type -80 message notifies the counterparty an atomic swap is created. 
 * The background and process of atomic swap can be found here in chapter 5 
 * of the OmniBOLT specification,
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function atomicSwap(nodeID, userID, info) {
    return new Promise((resolve, reject) => {
        obdApi.atomicSwap(nodeID, userID, info, function(e) {
            console.info('SDK: -100080 atomicSwap = ' + JSON.stringify(e));
            resolve(true);
        });
    })
}

/**
 * Type -81 Protocol accepts or rejects a swap.
 * 
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function acceptSwap(nodeID, userID, info) {
    return new Promise((resolve, reject) => {
        obdApi.atomicSwapAccepted(nodeID, userID, info, function(e) {
            console.info('SDK: -100081 atomicSwapAccepted = ' + JSON.stringify(e));
            resolve(true);
        });
    })
}