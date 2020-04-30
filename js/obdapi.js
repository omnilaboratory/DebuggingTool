class ObdApi {
    constructor() {
        this.isConnectToOBD = false;
        this.isLogin = false;
        this.messageType = new MessageType();
        this.defaultAddress = "ws://127.0.0.1:60020/ws";
        this.callbackMap = new Map();
    }
    /**
     * register event
     * @param msgType
     * @param callback
     */
    registerEvent(msgType, callback) {
        if (callback == null) {
            console.info("callback function is null");
            return;
        }
        if (msgType == null) {
            callback("msgType is null");
            return;
        }
        this.callbackMap[msgType] = callback;
    }
    /**
     * remove event
     * @param msgType
     */
    removeEvent(msgType) {
        this.callbackMap.delete(msgType);
        console.info("----------> removeEvent");
    }
    /**
     * Send custom request
     * @param msg
     * @param type
     * @param callback
     */
    sendJsonData(msg, type, callback) {
        if (this.isConnectToOBD == false) {
            alert("please try to connect obd again");
            return;
        }
        if (this.isNotString(msg)) {
            alert("error request content.");
            return;
        }
        // if (msg.type < 0 && this.isLogin == false) {
        //   alert("please login");
        //   return;
        // }
        console.info(new Date(), "------send json msg------");
        console.info(msg);
        if (callback != null) {
            this.callbackMap[type] = callback;
        }
        this.ws.send(msg);
        // this.ws.send(JSON.stringify(msg));
    }
    /**
     * connectToServer
     * @param address string
     * @param callback function
     */
    connectToServer(address, callback, globalCallback) {
        if (this.isConnectToOBD == true) {
            console.info("already connect");
            if (callback) {
                callback("already connect");
            }
            return;
        }
        this.globalCallback = globalCallback;
        if (address != null && address.length > 0) {
            this.defaultAddress = address;
        }
        console.info("connect to " + this.defaultAddress);
        try {
            this.ws = new WebSocket(this.defaultAddress);
            this.ws.onopen = (e) => {
                console.info(e);
                console.info("connect success");
                if (callback != null) {
                    callback("connect success");
                }
                this.isConnectToOBD = true;
            };
            this.ws.onmessage = (e) => {
                let jsonData = JSON.parse(e.data);
                console.info(jsonData);
                this.getDataFromServer(jsonData);
            };
            this.ws.onclose = (e) => {
                console.info("ws close", e);
                this.isConnectToOBD = false;
                this.isLogin = false;
                alert("ws close");
            };
            this.ws.onerror = (e) => {
                console.info("ws error", e);
                alert("ws error");
            };
        }
        catch (error) {
            console.info(error);
            alert("can not connect to server");
            return;
        }
    }
    sendData(msg, callback) {
        if (this.isConnectToOBD == false) {
            alert("please try to connect obd again");
            return;
        }
        if (msg.type < 0 && this.isLogin == false) {
            alert("please login");
            return;
        }
        console.info(new Date(), "----------------------------send msg------------------------------");
        console.info(msg);
        if (callback != null) {
            this.callbackMap[msg.type] = callback;
        }
        this.ws.send(JSON.stringify(msg));
    }
    getDataFromServer(jsonData) {
        console.info(jsonData.data);
        if (jsonData.type == 0) {
            return;
        }
        let callback = this.callbackMap[jsonData.type];
        if (jsonData.status == false) {
            //omni error ,do not alert
            if (jsonData.type == this.messageType.MsgType_Core_Omni_Getbalance_1200) {
                if (callback != null) {
                    callback("");
                }
                return;
            }
            if (jsonData.type != this.messageType.MsgType_Error_0) {
                alert(jsonData.result);
            }
            return;
        }
        let resultData = jsonData.result;
        if (jsonData.type == this.messageType.MsgType_Error_0) {
            let tempData = new Object();
            tempData.type = jsonData.type;
            tempData.result = jsonData.data;
            tempData.sender_peer_id = jsonData.sender_peer_id;
            tempData.recipient_user_peer_id = jsonData.recipient_user_peer_id;
            jsonData = tempData;
        }
        if (this.globalCallback) {
            this.globalCallback(jsonData);
        }
        console.info(new Date(), "----------------------------get msg from server--------------------");
        let fromId = jsonData.from;
        let toId = jsonData.to;
        fromId = fromId.split("@")[0];
        toId = toId.split("@")[0];
        //如果是广播信息，或者是被推送的信息（比如alice推送给Bob的351）
        if (fromId != toId) {
            if (callback != null) {
                callback(resultData);
            }
            return;
        }
        //是自己的调用api的数据反馈
        if (callback != null) {
            callback(resultData);
        }
        switch (jsonData.type) {
            case this.messageType.MsgType_UserLogin_1:
                this.userPeerId = toId;
                this.onLogIn(resultData);
                break;
            case this.messageType.MsgType_UserLogout_2:
                this.onLogout(resultData);
                break;
            case this.messageType.MsgType_GetMnemonic_101:
                this.onSignUp(resultData);
                break;
            case this.messageType.MsgType_Core_GetNewAddress_1001:
                this.onGetNewAddressFromOmniCore(resultData);
                break;
            case this.messageType.MsgType_Core_FundingBTC_1009:
                this.onFundingBTC(resultData);
                break;
            case this.messageType.MsgType_Core_Omni_ListProperties_1205:
                this.onListProperties(resultData);
                break;
            case this.messageType.MsgType_Core_Omni_FundingAsset_2001:
                this.onFundingAssetOfOmni(resultData);
                break;
            case this.messageType.MsgType_Mnemonic_CreateAddress_N200:
                this.onCreateAddressByMnemonic(resultData);
                break;
            case this.messageType.MsgType_Mnemonic_GetAddressByIndex_201:
                this.onGetAddressInfo(resultData);
                break;
            case this.messageType.MsgType_ChannelOpen_N32:
                this.onOpenChannel(resultData);
                break;
            case this.messageType.MsgType_ChannelAccept_N33:
                this.onAcceptChannel(resultData);
                break;
            case this.messageType.MsgType_FundingCreate_AssetFundingCreated_N34:
                this.onChannelFundingCreated(resultData);
                break;
            case this.messageType.MsgType_FundingSign_AssetFundingSigned_N35:
                this.onChannelFundingSigned(resultData);
                break;
            case this.messageType
                .MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
                this.onCommitmentTransactionCreated(resultData);
                break;
            case this.messageType
                .MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
                this.onRevokeAndAcknowledgeCommitmentTransaction(resultData);
                break;
            case this.messageType.MsgType_HTLC_Invoice_N4003:
                this.onHtlcInvoice(resultData);
                break;
            case this.messageType.MsgType_HTLC_FindPath_N4001:
                this.onHtlcFindPath(resultData);
                break;
            case this.messageType.MsgType_HTLC_AddHTLC_N40:
                this.onHtlcCreated(resultData);
                break;
            case this.messageType.MsgType_HTLC_AddHTLCSigned_N41:
                this.onHtlcSigned(resultData);
                break;
            case this.messageType.MsgType_HTLC_SendR_N45:
                this.onHtlcSendR(resultData);
                break;
            case this.messageType.MsgType_HTLC_VerifyR_N46:
                this.onHtlcVerifyR(resultData);
                break;
            case this.messageType.MsgType_HTLC_RequestCloseCurrTx_N49:
                this.onCloseHTLC(resultData);
                break;
            case this.messageType.MsgType_HTLC_CloseSigned_N50:
                this.onCloseHTLCSigned(resultData);
                break;
            case this.messageType.MsgType_Core_Omni_GetTransaction_1206:
                this.onGetOmniTxByTxid(resultData);
                break;
            case this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_1201:
                this.onCreateNewTokenFixed(resultData);
                break;
        }
    }
    /**
     * MsgType_UserLogin_1
     * @param mnemonic:string
     * @param callback function
     */
    logIn(mnemonic, callback) {
        if (this.isLogin) {
            if (callback != null) {
                callback("already login");
            }
            return;
        }
        if (this.isNotString(mnemonic)) {
            alert("empty mnemonic");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_UserLogin_1;
        msg.data["mnemonic"] = mnemonic;
        this.sendData(msg, callback);
    }
    onLogIn(resultData) {
        if (this.isLogin == false) {
            this.isLogin = true;
        }
    }
    /**
     * MsgType_UserLogout_2
     * @param callback function
     */
    logout(callback) {
        if (this.isLogin) {
            let msg = new Message();
            msg.type = this.messageType.MsgType_UserLogout_2;
            this.sendData(msg, callback);
        }
        else {
            alert("you have logout");
        }
    }
    onLogout(jsonData) {
        this.isLogin = false;
    }
    /**
     * MsgType_p2p_ConnectServer_3
     * @param callback function
     */
    connectP2PNode(p2pAddress, callback) {
        if (this.isNotString(p2pAddress)) {
            alert("empty p2pAddress");
            return;
        }
        let msg = new Message();
        msg.data = p2pAddress;
        msg.type = this.messageType.MsgType_p2p_ConnectServer_3;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_GetMnemonic_101
     * @param callback function
     */
    signUp(callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_GetMnemonic_101;
        this.sendData(msg, callback);
    }
    onSignUp(jsonData) { }
    /**
     * MsgType_Core_GetNewAddress_1001
     * @param callback function
     */
    getNewAddress(callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_GetNewAddress_1001;
        this.sendData(msg, callback);
    }
    onGetNewAddressFromOmniCore(jsonData) { }
    /**
     * MsgType_Core_FundingBTC_1009
     * @param info BtcFundingInfo
     * @param callback function
     */
    fundingBTC(info, callback) {
        if (this.isNotString(info.from_address)) {
            alert("empty from_address");
            return;
        }
        if (this.isNotString(info.from_address_private_key)) {
            alert("empty from_address_private_key");
            return;
        }
        if (this.isNotString(info.to_address)) {
            alert("empty to_address");
            return;
        }
        if (info.amount == null || info.amount <= 0) {
            alert("wrong amount");
            return;
        }
        if (info.miner_fee == null || info.miner_fee <= 0) {
            info.miner_fee = 0;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_FundingBTC_1009;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onFundingBTC(jsonData) { }
    /**
     * MsgType_FundingCreate_BtcCreate_N3400
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info  FundingBtcCreated
     * @param callback  Function
     */
    btcFundingCreated(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.temporary_channel_id)) {
            alert("empty temporary_channel_id");
            return;
        }
        if (this.isNotString(info.funding_tx_hex)) {
            alert("empty funding_tx_hex");
            return;
        }
        if (this.isNotString(info.channel_address_private_key)) {
            alert("empty channel_address_private_key");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingCreate_BtcCreate_N3400;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_FundingSign_BtcSign_N3500
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info FundingBtcSigned
     * @param callback  Function
     */
    btcFundingSigned(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.temporary_channel_id)) {
            alert("empty temporary_channel_id");
            return;
        }
        if (this.isNotString(info.funding_txid)) {
            alert("empty funding_txid");
            return;
        }
        if (info.approval == true) {
            if (this.isNotString(info.channel_address_private_key)) {
                alert("empty channel_address_private_key");
                return;
            }
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingSign_BtcSign_N3500;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_Core_Omni_ListProperties_1205
     * @param callback function
     */
    listProperties(callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_ListProperties_1205;
        this.sendData(msg, callback);
    }
    onListProperties(jsonData) { }
    /**
     * MsgType_Core_Omni_FundingAsset_2001
     * @param info OmniFundingAssetInfo
     * @param callback function
     */
    fundingAssetOfOmni(info, callback) {
        if (this.isNotString(info.from_address)) {
            alert("empty from_address");
            return;
        }
        if (this.isNotString(info.from_address_private_key)) {
            alert("empty from_address_private_key");
            return;
        }
        if (this.isNotString(info.to_address)) {
            alert("empty to_address");
            return;
        }
        if (info.property_id == null || info.property_id <= 0) {
            alert("error property_id");
            return;
        }
        if (info.amount == null || info.amount <= 0) {
            alert("wrong amount");
            return;
        }
        if (info.miner_fee == null || info.miner_fee <= 0) {
            info.miner_fee = 0;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_FundingAsset_2001;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onFundingAssetOfOmni(jsonData) { }
    /**
     * MsgType_Mnemonic_CreateAddress_N200
     * @param callback function
     */
    getNewAddressWithMnemonic(callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_CreateAddress_N200;
        this.sendData(msg, callback);
    }
    onCreateAddressByMnemonic(jsonData) { }
    /**
     * MsgType_Mnemonic_GetAddressByIndex_201
     * @param index:number
     * @param callback function
     */
    getAddressInfo(index, callback) {
        if (index == null || index < 0) {
            alert("error index");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_201;
        msg.data = index;
        this.sendData(msg, callback);
    }
    onGetAddressInfo(jsonData) { }
    /**
     * MsgType_ChannelOpen_N32
     * @param funding_pubkey string
     * @param recipient_user_peer_id string
     * @param recipient_node_peer_id string
     * @param callback function
     */
    openChannel(funding_pubkey, recipient_user_peer_id, recipient_node_peer_id, callback) {
        if (this.isNotString(funding_pubkey)) {
            alert("error funding_pubkey");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelOpen_N32;
        msg.data["funding_pubkey"] = funding_pubkey;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onOpenChannel(jsonData) { }
    /**
     * MsgType_ChannelAccept_N33
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info AcceptChannelInfo
     * @param callback function
     */
    acceptChannel(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.temporary_channel_id)) {
            alert("empty temporary_channel_id");
            return;
        }
        if (info.approval == null) {
            info.approval = false;
        }
        if (info.approval == true) {
            if (this.isNotString(info.funding_pubkey)) {
                alert("empty funding_pubkey");
                return;
            }
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelAccept_N33;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onAcceptChannel(jsonData) { }
    /**
     * MsgType_FundingCreate_AssetFundingCreated_N34
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info ChannelFundingCreatedInfo
     * @param callback function
     */
    channelFundingCreated(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.temporary_channel_id)) {
            alert("empty temporary_channel_id");
            return;
        }
        if (this.isNotString(info.funding_tx_hex)) {
            alert("empty funding_tx_hex");
            return;
        }
        if (this.isNotString(info.temp_address_pub_key)) {
            alert("empty temp_address_pub_key");
            return;
        }
        if (this.isNotString(info.temp_address_private_key)) {
            alert("empty temp_address_private_key");
            return;
        }
        if (this.isNotString(info.channel_address_private_key)) {
            alert("empty channel_address_private_key");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingCreate_AssetFundingCreated_N34;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onChannelFundingCreated(jsonData) { }
    /**
     * MsgType_FundingSign_AssetFundingSigned_N35
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info ChannelFundingSignedInfo
     * @param callback function
     */
    channelFundingSigned(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.channel_id)) {
            alert("empty channel_id");
            return;
        }
        if (info.approval == null) {
            info.approval = false;
        }
        if (info.approval == true) {
            if (this.isNotString(info.fundee_channel_address_private_key)) {
                alert("empty fundee_channel_address_private_key");
                return;
            }
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingSign_AssetFundingSigned_N35;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onChannelFundingSigned(jsonData) { }
    /**
     * MsgType_CommitmentTx_CommitmentTransactionCreated_N351
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info CommitmentTx
     * @param callback function
     */
    commitmentTransactionCreated(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.channel_id)) {
            alert("empty channel_id");
            return;
        }
        if (this.isNotString(info.curr_temp_address_pub_key)) {
            alert("empty curr_temp_address_pub_key");
            return;
        }
        if (this.isNotString(info.curr_temp_address_private_key)) {
            alert("empty curr_temp_address_private_key");
            return;
        }
        if (this.isNotString(info.channel_address_private_key)) {
            alert("empty channel_address_private_key");
            return;
        }
        if (this.isNotString(info.last_temp_address_private_key)) {
            alert("empty last_temp_address_private_key");
            return;
        }
        if (info.amount == null || info.amount <= 0) {
            alert("wrong amount");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCommitmentTransactionCreated(jsonData) { }
    /**
     * MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info CommitmentTxSigned
     * @param callback function
     */
    revokeAndAcknowledgeCommitmentTransaction(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.channel_id)) {
            alert("empty channel_id");
            return;
        }
        if (this.isNotString(info.request_commitment_hash)) {
            alert("empty request_commitment_hash");
            return;
        }
        if (info.approval == null) {
            info.approval = false;
        }
        if (info.approval == true) {
            if (this.isNotString(info.curr_temp_address_pub_key)) {
                alert("empty curr_temp_address_pub_key");
                return;
            }
            if (this.isNotString(info.curr_temp_address_private_key)) {
                alert("empty curr_temp_address_private_key");
                return;
            }
            if (this.isNotString(info.channel_address_private_key)) {
                alert("empty channel_address_private_key");
                return;
            }
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onRevokeAndAcknowledgeCommitmentTransaction(jsonData) { }
    /**
     * MsgType_HTLC_Invoice_N4003
     * @param info HtlcFindPathInfo
     * @param callback function
     */
    htlcInvoice(info, callback) {
        if (this.isNotString(info.recipient_user_peer_id)) {
            alert("empty recipient_user_peer_id");
            return;
        }
        if (info.property_id == null || info.property_id <= 0) {
            alert("empty property_id");
            return;
        }
        if (info.amount == null || info.amount <= 0) {
            alert("wrong amount");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_Invoice_N4003;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onHtlcInvoice(jsonData) { }
    /**
     * MsgType_HTLC_FindPath_N4001
     * @param info HtlcHInfo
     * @param callback function
     */
    htlcFindPath(info, callback) {
        if (this.isNotString(info.recipient_node_peer_id)) {
            alert("empty recipient_node_peer_id");
            return;
        }
        if (this.isNotString(info.recipient_user_peer_id)) {
            alert("empty recipient_user_peer_id");
            return;
        }
        if (info.property_id == null || info.property_id <= 0) {
            alert("empty property_id");
            return;
        }
        if (info.amount == null || info.amount <= 0) {
            alert("wrong amount");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_FindPath_N4001;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onHtlcFindPath(jsonData) { }
    /**
     * MsgType_HTLC_AddHTLC_N40
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info HtlcCreatedInfo
     * @param callback function
     */
    htlcCreated(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.h)) {
            alert("empty h");
            return;
        }
        if (info.property_id <= 0) {
            alert("wrong property_id");
            return;
        }
        if (info.amount <= 0) {
            alert("wrong amount");
            return;
        }
        if (this.isNotString(info.memo)) {
            info.memo = "";
        }
        if (this.isNotString(info.htlc_channel_path)) {
            alert("empty htlc_channel_path");
            return;
        }
        if (this.isNotString(info.channel_address_private_key)) {
            alert("empty channel_address_private_key");
            return;
        }
        if (this.isNotString(info.last_temp_address_private_key)) {
            alert("empty last_temp_address_private_key");
            return;
        }
        if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
            alert("empty curr_rsmc_temp_address_pub_key");
            return;
        }
        if (this.isNotString(info.curr_rsmc_temp_address_private_key)) {
            alert("empty curr_rsmc_temp_address_private_key");
            return;
        }
        if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
            alert("empty curr_htlc_temp_address_pub_key");
            return;
        }
        if (this.isNotString(info.curr_htlc_temp_address_private_key)) {
            alert("empty curr_htlc_temp_address_private_key");
            return;
        }
        if (this.isNotString(info.curr_htlc_temp_address_for_ht1a_pub_key)) {
            alert("empty curr_htlc_temp_address_for_ht1a_pub_key");
            return;
        }
        if (this.isNotString(info.curr_htlc_temp_address_for_ht1a_private_key)) {
            alert("empty curr_htlc_temp_address_for_ht1a_private_key");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLC_N40;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onHtlcCreated(jsonData) { }
    /**
     * MsgType_HTLC_AddHTLCSigned_N41
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info HtlcSignedInfo
     * @param callback function
     */
    htlcSigned(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.request_hash)) {
            alert("empty request_hash");
            return;
        }
        if (info.approval == null) {
            info.approval = false;
        }
        if (info.approval == true) {
            if (this.isNotString(info.channel_address_private_key)) {
                alert("empty channel_address_private_key");
                return;
            }
            if (this.isNotString(info.last_temp_address_private_key)) {
                alert("empty last_temp_address_private_key");
                return;
            }
            if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
                alert("empty curr_rsmc_temp_address_pub_key");
                return;
            }
            if (this.isNotString(info.curr_rsmc_temp_address_private_key)) {
                alert("empty curr_rsmc_temp_address_private_key");
                return;
            }
            if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
                alert("empty curr_htlc_temp_address_pub_key");
                return;
            }
            if (this.isNotString(info.curr_htlc_temp_address_private_key)) {
                alert("empty curr_htlc_temp_address_private_key");
                return;
            }
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLCSigned_N41;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onHtlcSigned(jsonData) { }
    /* ***************** backward R begin*****************/
    /**
     * MsgType_HTLC_SendR_N45
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info HtlcSendRInfo
     * @param callback function
     */
    htlcSendR(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.channel_id)) {
            alert("empty channel_id");
            return;
        }
        if (this.isNotString(info.r)) {
            alert("empty r");
            return;
        }
        if (this.isNotString(info.channel_address_private_key)) {
            alert("empty channel_address_private_key");
            return;
        }
        if (this.isNotString(info.curr_htlc_temp_address_for_he1b_pub_key)) {
            alert("empty curr_htlc_temp_address_for_he1b_pub_key");
            return;
        }
        if (this.isNotString(info.curr_htlc_temp_address_for_he1b_private_key)) {
            alert("empty curr_htlc_temp_address_for_he1b_private_key");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendR_N45;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onHtlcSendR(jsonData) { }
    /**
     * MsgType_HTLC_VerifyR_N46
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info HtlcVerifyRInfo
     * @param callback function
     */
    htlcVerifyR(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.channel_id)) {
            alert("empty channel_id");
            return;
        }
        if (this.isNotString(info.request_hash)) {
            alert("empty request_hash");
            return;
        }
        if (this.isNotString(info.r)) {
            alert("empty r");
            return;
        }
        if (this.isNotString(info.channel_address_private_key)) {
            alert("empty channel_address_private_key");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N46;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onHtlcVerifyR(jsonData) { }
    /* ***************** backward R end*****************/
    /* ***************** close htlc tx begin*****************/
    /**
     * MsgType_HTLC_RequestCloseCurrTx_N49
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info CloseHtlcTxInfo
     * @param callback function
     * */
    closeHTLC(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.channel_id)) {
            alert("empty channel_id");
            return;
        }
        if (this.isNotString(info.channel_address_private_key)) {
            alert("empty channel_address_private_key");
            return;
        }
        if (this.isNotString(info.last_rsmc_temp_address_private_key)) {
            alert("empty last_rsmc_temp_address_private_key");
            return;
        }
        if (this.isNotString(info.last_htlc_temp_address_private_key)) {
            alert("empty last_htlc_temp_address_private_key");
            return;
        }
        if (this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)) {
            alert("empty last_htlc_temp_address_private_key");
            return;
        }
        if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
            alert("empty curr_rsmc_temp_address_pub_key");
            return;
        }
        if (this.isNotString(info.curr_rsmc_temp_address_private_key)) {
            alert("empty curr_rsmc_temp_address_private_key");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_RequestCloseCurrTx_N49;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onCloseHTLC(jsonData) { }
    /**
     * MsgType_HTLC_CloseSigned_N50
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info CloseHtlcTxInfoSigned
     * @param callback function
     */
    closeHTLCSigned(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.request_hash)) {
            alert("empty request_close_htlc_hash");
            return;
        }
        if (this.isNotString(info.channel_address_private_key)) {
            alert("empty channel_address_private_key");
            return;
        }
        if (this.isNotString(info.last_rsmc_temp_address_private_key)) {
            alert("empty last_rsmc_temp_address_private_key");
            return;
        }
        if (this.isNotString(info.last_htlc_temp_address_private_key)) {
            alert("empty last_htlc_temp_address_private_key");
            return;
        }
        if (this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)) {
            alert("empty last_htlc_temp_address_for_htnx_private_key");
            return;
        }
        if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
            alert("empty curr_rsmc_temp_address_pub_key");
            return;
        }
        if (this.isNotString(info.curr_rsmc_temp_address_private_key)) {
            alert("empty curr_rsmc_temp_address_private_key");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CloseSigned_N50;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCloseHTLCSigned(jsonData) { }
    /* ***************** close htlc tx end*****************/
    /* ********************* query data *************************** */
    /**
     * MsgType_Core_Omni_GetTransaction_1206
     * @param txid string
     * @param callback function
     */
    getOmniTxByTxid(txid, callback) {
        if (this.isNotString(txid)) {
            alert("empty txid");
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_GetTransaction_1206;
        msg.data["txid"] = txid;
        this.sendData(msg, callback);
    }
    onGetOmniTxByTxid(jsonData) { }
    /**
     * MsgType_Core_Omni_CreateNewTokenFixed_1201
     * @param info OmniSendIssuanceFixed
     * @param callback function
     */
    createNewTokenFixed(info, callback) {
        if (this.isNotString(info.from_address)) {
            alert("empty from_address");
            return;
        }
        if (this.isNotString(info.name)) {
            alert("empty name");
            return;
        }
        if (info.ecosystem == null) {
            alert("empty ecosystem");
            return;
        }
        if (info.divisible_type == null) {
            alert("empty divisible_type");
            return;
        }
        if (info.amount == null || info.amount <= 1) {
            alert("wrong amount");
            return;
        }
        if (this.isNotString(info.data)) {
            info.data = "";
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_1201;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCreateNewTokenFixed(jsonData) { }
    /**
     * MsgType_Core_Omni_CreateNewTokenManaged_1202
     * @param info OmniSendIssuanceManaged
     * @param callback function
     */
    createNewTokenManaged(info, callback) {
        if (this.isNotString(info.from_address)) {
            alert("empty from_address");
            return;
        }
        if (this.isNotString(info.name)) {
            alert("empty name");
            return;
        }
        if (info.ecosystem == null) {
            alert("empty ecosystem");
            return;
        }
        if (info.divisible_type == null) {
            alert("empty divisible_type");
            return;
        }
        if (this.isNotString(info.data)) {
            info.data = "";
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenManaged_1202;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCreateNewTokenManaged(jsonData) { }
    /**
     * MsgType_Core_Omni_GrantNewUnitsOfManagedToken_1203
     * @param info OmniSendGrant
     * @param callback function
     */
    omniSendGrant(info, callback) {
        if (this.isNotString(info.from_address)) {
            alert("empty from_address");
            return;
        }
        if (info.property_id == null || info.property_id < 1) {
            alert("empty property_id");
            return;
        }
        if (info.amount == null || info.amount <= 1) {
            alert("wrong amount");
            return;
        }
        if (this.isNotString(info.memo)) {
            info.memo = "";
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_GrantNewUnitsOfManagedToken_1203;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onOmniSendGrant(jsonData) { }
    /**
     * MsgType_Core_Omni_RevokeUnitsOfManagedToken_1204
     * @param info OmniSendRevoke
     * @param callback function
     */
    omniSendRevoke(info, callback) {
        if (this.isNotString(info.from_address)) {
            alert("empty from_address");
            return;
        }
        if (info.property_id == null || info.property_id < 1) {
            alert("empty property_id");
            return;
        }
        if (info.amount == null || info.amount <= 1) {
            alert("wrong amount");
            return;
        }
        if (this.isNotString(info.memo)) {
            info.memo = "";
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_RevokeUnitsOfManagedToken_1204;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onOmniSendRevoke(jsonData) { }
    /**
     * MsgType_Core_Omni_Getbalance_1200
     * @param address string
     * @param callback function
     */
    omniGetAllBalancesForAddress(address, callback) {
        if (this.isNotString(address)) {
            alert("empty address");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_Getbalance_1200;
        msg.data["address"] = address;
        this.sendData(msg, callback);
    }
    onOmniGetAllBalancesForAddress(jsonData) { }
    /**
     * MsgType_Core_Omni_GetAssetName_1207
     * @param propertyId string
     * @param callback function
     */
    omniGetAssetNameByID(propertyId, callback) {
        if (this.isNotString(propertyId)) {
            alert("empty propertyId");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_GetAssetName_1207;
        msg.data["propertyId"] = propertyId;
        this.sendData(msg, callback);
    }
    onOmniGetAssetNameByID(jsonData) { }
    /**
     * MsgType_Core_BalanceByAddress_1008
     * @param address string
     * @param callback function
     */
    getBtcBalanceByAddress(address, callback) {
        if (this.isNotString(address)) {
            alert("empty address");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_BalanceByAddress_1008;
        msg.data["address"] = address;
        this.sendData(msg, callback);
    }
    onGetBtcBalanceByAddress(jsonData) { }
    /**
     * MsgType_Core_Btc_ImportPrivKey_1011
     * @param privkey string
     * @param callback function
     */
    importPrivKey(privkey, callback) {
        if (this.isNotString(privkey)) {
            alert("empty privkey");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Btc_ImportPrivKey_1011;
        msg.data["privkey"] = privkey;
        this.sendData(msg, callback);
    }
    onImportPrivKey(jsonData) { }
    /**
     * MsgType_HTLC_CreatedRAndHInfoList_N4001
     * @param callback function
     */
    getHtlcCreatedRandHInfoList(callback) {
        let msg = new Message();
        // msg.type = this.messageType.MsgType_HTLC_CreatedRAndHInfoList_N4001;
        this.sendData(msg, callback);
    }
    onGetHtlcCreatedRandHInfoList(jsonData) { }
    /**
     * MsgType_HTLC_SignedRAndHInfoList_N4101
     * @param callback function
     */
    getHtlcSignedRandHInfoList(callback) {
        let msg = new Message();
        // msg.type = this.messageType.MsgType_HTLC_SignedRAndHInfoList_N4101;
        this.sendData(msg, callback);
    }
    onGetHtlcSignedRandHInfoList(jsonData) { }
    /**
     * MsgType_HTLC_GetRFromLCommitTx_N4103
     * @param channel_id string
     * @param callback function
     */
    getRFromCommitmentTx(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        // msg.type = this.messageType.MsgType_HTLC_GetRFromLCommitTx_N4103;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetRFromCommitmentTx(jsonData) { }
    /**
     * MsgType_HTLC_GetPathInfoByH_N4104
     * @param h string
     * @param callback function
     */
    getPathInfoByH(h, callback) {
        if (this.isNotString(h)) {
            alert("empty h");
            return;
        }
        let msg = new Message();
        // msg.type = this.messageType.MsgType_HTLC_GetPathInfoByH_N4104;
        msg.data = h;
        this.sendData(msg, callback);
    }
    onGetPathInfoByH(jsonData) { }
    /**
     * MsgType_HTLC_GetRInfoByHOfOwner_N4105
     * @param h string
     * @param callback function
     */
    getRByHOfReceiver(h, callback) {
        if (this.isNotString(h)) {
            alert("empty h");
            return;
        }
        let msg = new Message();
        // msg.type = this.messageType.MsgType_HTLC_GetRInfoByHOfOwner_N4105;
        msg.data = h;
        this.sendData(msg, callback);
    }
    onGetRByHOfReceiver(jsonData) { }
    /**
     * MsgType_CommitmentTx_LatestCommitmentTxByChanId_N35104
     * @param channel_id string
     * @param callback function
     */
    getLatestCommitmentTxByChannelId(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_N35104;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetLatestCommitmentTxByChannelId(jsonData) { }
    /**
     * MsgType_CommitmentTx_ItemsByChanId_N35101
     * @param channel_id string
     * @param callback function
     */
    getItemsByChannelId(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_N35101;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetItemsByChannelId(jsonData) { }
    /**
     * MsgType_ChannelOpen_AllItem_N3202
     * @param callback function
     */
    getAllChannels(callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelOpen_AllItem_N3202;
        this.sendData(msg, callback);
    }
    onGetAllChannels(jsonData) { }
    /**
     * MsgType_GetChannelInfoByChanId_N3207
     * @param id number
     * @param callback function
     */
    getChannelById(id, callback) {
        if (id == null || id <= 0) {
            alert("error id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_GetChannelInfoByChanId_N3207;
        msg.data = id;
        this.sendData(msg, callback);
    }
    onGetChannelById(jsonData) { }
    /**
     * MsgType_CommitmentTx_AllBRByChanId_N35109
     * @param channel_id string
     * @param callback function
     */
    getAllBRTx(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_AllBRByChanId_N35109;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetAllBrTx(jsonData) { }
    /**
     * MsgType_CommitmentTx_ItemsByChanId_N35101
     * @param channel_id string
     * @param callback function
     */
    getAllCommitmentTx(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_N35101;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetAllCommitmentTx(jsonData) { }
    /**
     * MsgType_CommitmentTx_LatestRDByChanId_N35105
     * @param channel_id string
     * @param callback function
     */
    getLatestCommitmentTx(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestRDByChanId_N35105;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetLatestCommitmentTx(jsonData) { }
    /**
     * MsgType_CommitmentTx_LatestBRByChanId_N35106
     * @param channel_id string
     * @param callback function
     */
    getLatestBRTx(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestBRByChanId_N35106;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetLatestBRTx(jsonData) { }
    /**
     * MsgType_CommitmentTx_AllRDByChanId_N35108
     * @param channel_id string
     * @param callback function
     */
    getAllRDTx(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_AllRDByChanId_N35108;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetAllRDTx(jsonData) { }
    /**
     * MsgType_SendBreachRemedyTransaction_N35107
     * @param channel_id string
     * @param callback function
     */
    sendBreachRemedyTransaction(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_SendBreachRemedyTransaction_N35107;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onSendBreachRemedyTransaction(jsonData) { }
    /**
     * MsgType_CloseChannelRequest_N38
     * @param channel_id string
     * @param callback function
     */
    closeChannel(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CloseChannelRequest_N38;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onCloseChannel(jsonData) { }
    /**
     * MsgType_CloseChannelSign_N39
     * @param info CloseChannelSign
     * @param callback function
     */
    closeChannelSign(info, callback) {
        if (this.isNotString(info.channel_id)) {
            alert("empty channel_id");
            return;
        }
        if (this.isNotString(info.request_close_channel_hash)) {
            alert("empty request_close_channel_hash");
            return;
        }
        if (info.approval == null) {
            info.approval = false;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CloseChannelSign_N39;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCloseChannelSign(jsonData) { }
    /**
     * MsgType_Atomic_Swap_N80
     * @param info AtomicSwapRequest
     * @param callback function
     */
    atomicSwap(info, callback) {
        if (this.isNotString(info.channel_id_from)) {
            alert("empty channel_id_from");
            return;
        }
        if (this.isNotString(info.channel_id_to)) {
            alert("empty channel_id_to");
            return;
        }
        if (this.isNotString(info.recipient_user_peer_id)) {
            alert("empty recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.transaction_id)) {
            alert("empty transaction_id");
            return;
        }
        if (info.property_sent <= 0) {
            alert("wrong property_sent");
            return;
        }
        if (info.amount <= 0) {
            alert("wrong amount");
            return;
        }
        if (info.exchange_rate <= 0) {
            alert("wrong exchange_rate");
            return;
        }
        if (info.property_received <= 0) {
            alert("wrong property_received");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Atomic_Swap_N80;
        msg.data = info;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_Atomic_Swap_Accept_N81
     * @param info AtomicSwapAccepted
     * @param callback function
     */
    atomicSwapAccepted(info, callback) {
        if (this.isNotString(info.channel_id_from)) {
            alert("empty channel_id_from");
            return;
        }
        if (this.isNotString(info.channel_id_to)) {
            alert("empty channel_id_to");
            return;
        }
        if (this.isNotString(info.recipient_user_peer_id)) {
            alert("empty recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.transaction_id)) {
            alert("empty transaction_id");
            return;
        }
        if (this.isNotString(info.target_transaction_id)) {
            alert("empty target_transaction_id");
            return;
        }
        if (info.property_sent <= 0) {
            alert("wrong property_sent");
            return;
        }
        if (info.amount <= 0) {
            alert("wrong amount");
            return;
        }
        if (info.exchange_rate <= 0) {
            alert("wrong exchange_rate");
            return;
        }
        if (info.property_received <= 0) {
            alert("wrong property_received");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Atomic_Swap_Accept_N81;
        msg.data = info;
        this.sendData(msg, callback);
    }
    isNotString(str) {
        if (str == null) {
            return true;
        }
        if (str.trim().length == 0) {
            return true;
        }
        return false;
    }
}
