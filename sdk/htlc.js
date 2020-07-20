// var obdApi = new ObdApi();

/**
 *  connect to a remote counterparty's OBD server.
 *  @param info remote_node_address
 *  @param callback 
 */
function addInvoice(info, callback) {
    obdApi.addInvoice(info, callback);
}
