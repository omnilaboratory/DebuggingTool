// contracts.js
// Contracts for Omni BOLT

/**
 * Type -80 message notifies the counterparty an atomic swap is created. 
 * The background and process of atomic swap can be found here in chapter 5 
 * of the OmniBOLT specification,
 * 
 * @param myUserID  user id of currently loged in.
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 * @param isFunder 
 */
function atomicSwap(myUserID, nodeID, userID, info, isFunder) {
    return new Promise((resolve, reject) => {
        obdApi.atomicSwap(nodeID, userID, info, function(e) {
            console.info('SDK: -100080 atomicSwap = ' + JSON.stringify(e));
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusAtomicSwap);
            resolve(true);
        });
    })
}

/**
 * Type -81 Protocol accepts or rejects a swap.
 * 
 * @param myUserID  user id of currently loged in.
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 * @param isFunder
 */
function acceptSwap(myUserID, nodeID, userID, info, isFunder) {
    return new Promise((resolve, reject) => {
        obdApi.atomicSwapAccepted(nodeID, userID, info, function(e) {
            console.info('SDK: -100081 atomicSwapAccepted = ' + JSON.stringify(e));
            saveChannelStatus(myUserID, e.channel_id, isFunder, kStatusAcceptSwap);
            resolve(true);
        });
    })
}