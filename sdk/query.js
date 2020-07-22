// query.js
// Query functions

/**
 * Type -103200 Protocol is used to get a list of commitment transactions in one channel.
 * 
 * @param channel_id 
 */
function getAllCommitmentTransactions(channel_id) {
    obdApi.getItemsByChannelId(channel_id, function(e) {
        console.info('SDK: -103200 GetAllCommitmentTransactions = ' + JSON.stringify(e));
    });
}
