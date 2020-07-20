// basic.js
// Basic Lightning Network Operations 


/**
 *  Type -100032 Protocol is used to request to create a channel with someone else(Bob).
 *  @param myUserID The user id of logged in
 *  @param nodeID peer id of the obd node where the fundee logged in.
 *  @param userID the user id of the fundee.
 *  @param pubkey public key of funder, who wish to deposite BTC and other tokens to the channel
 */
function openChannel(myUserID, nodeID, userID, pubkey) {
    obdApi.openChannel(nodeID, userID, pubkey, function(e) {
        console.info('SDK: -100032 openChannel = ' + JSON.stringify(e));

        // WILL BE UPDATED
        // saveChannelList(e);

        // Functions related to save and get data have be moved to SDK.
        saveCounterparties(myUserID, nodeID, userID);
        saveChannelID(e.temporary_channel_id);
        let privkey = getFundingPrivKeyFromPubKey(myUserID, pubkey);
        addDataInTable(myUserID, e.temporary_channel_id, privkey, tbFundingPrivKey);
    });
}

/**
 * Type -100033 Bob replies to accept, his OBD completes his message and 
 * routes it back to Alice's OBD. Then Alice sees the response of acceptance.
 * @param myUserID The user id of logged in
 * @param nodeID peer id of the obd node where the fundee logged in.
 * @param userID the user id of the fundee.
 * @param info 
 */
function acceptChannel(myUserID, nodeID, userID, info) {
    obdApi.acceptChannel(nodeID, userID, info, function(e) {
        console.info('SDK: -100033 acceptChannel = ' + JSON.stringify(e));
        // saveChannelList(e);

        // Functions related to save and get data have be moved to SDK.
        saveCounterparties(myUserID, nodeID, userID);
        saveChannelAddress(e.channel_address);
        let privkey = getFundingPrivKeyFromPubKey(myUserID, info.funding_pubkey);
        addDataInTable(myUserID, info.temporary_channel_id, privkey, tbFundingPrivKey);
    });
}
