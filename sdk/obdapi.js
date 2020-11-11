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
        console.info(new Date(), "------send json msg------");
        console.info(msg);
        if (callback != null) {
            this.callbackMap[type] = callback;
        }
        this.ws.send(msg);
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
        if (((msg.type <= -100000 && msg.type >= -102000) ||
            (msg.type <= -103000 && msg.type >= -104000)) && this.isLogin == false) {
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
        console.info(jsonData);
        if (this.globalCallback) {
            this.globalCallback(jsonData);
        }
        if (jsonData.type == 0) {
            return;
        }
        let callback = this.callbackMap[jsonData.type];
        if (jsonData.status == false) {
            //omni error ,do not alert
            if (jsonData.type == this.messageType.MsgType_Core_Omni_Getbalance_2112) {
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
        console.info(new Date(), "----------------------------get msg from server--------------------");
        let fromId = jsonData.from;
        let toId = jsonData.to;
        fromId = fromId.split("@")[0];
        toId = toId.split("@")[0];
        // This message is Alice send to Bob
        if (fromId != toId) {
            if (callback != null) {
                resultData["to_peer_id"] = toId;
                callback(resultData);
            }
            return;
        }
        // This message is send to myself
        if (callback != null) {
            callback(resultData);
        }
        switch (jsonData.type) {
            case this.messageType.MsgType_UserLogin_2001:
                this.userPeerId = toId;
                this.onLogIn(resultData);
                break;
            case this.messageType.MsgType_UserLogout_2002:
                this.onLogout(resultData);
                break;
            // case this.messageType.MsgType_Core_GetNewAddress_2101:
            //   this.onGetNewAddressFromOmniCore(resultData);
            //   break;
            case this.messageType.MsgType_Core_FundingBTC_2109:
                this.onFundingBitcoin(resultData);
                break;
            case this.messageType.MsgType_Core_Omni_ListProperties_2117:
                this.onListProperties(resultData);
                break;
            case this.messageType.MsgType_Core_Omni_FundingAsset_2120:
                this.onFundingAsset(resultData);
                break;
            case this.messageType.MsgType_Mnemonic_CreateAddress_3000:
                this.onGenAddressFromMnemonic(resultData);
                break;
            case this.messageType.MsgType_Mnemonic_GetAddressByIndex_3001:
                this.onGetAddressInfo(resultData);
                break;
            case this.messageType.MsgType_SendChannelOpen_32:
                this.onOpenChannel(resultData);
                break;
            case this.messageType.MsgType_SendChannelAccept_33:
                this.onAcceptChannel(resultData);
                break;
            case this.messageType.MsgType_FundingCreate_SendAssetFundingCreated_34:
                this.onAssetFundingCreated(resultData);
                break;
            case this.messageType.MsgType_FundingSign_SendAssetFundingSigned_35:
                this.onAssetFundingSigned(resultData);
                break;
            case this.messageType
                .MsgType_CommitmentTx_SendCommitmentTransactionCreated_351:
                this.onCommitmentTransactionCreated(resultData);
                break;
            case this.messageType
                .MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
                this.onCommitmentTransactionAccepted(resultData);
                break;
            case this.messageType.MsgType_HTLC_Invoice_402:
                this.onAddInvoice(resultData);
                break;
            case this.messageType.MsgType_HTLC_FindPath_401:
                this.onHTLCFindPath(resultData);
                break;
            case this.messageType.MsgType_HTLC_SendAddHTLC_40:
                this.onAddHTLC(resultData);
                break;
            case this.messageType.MsgType_HTLC_SendAddHTLCSigned_41:
                this.onHtlcSigned(resultData);
                break;
            case this.messageType.MsgType_HTLC_SendVerifyR_45:
                this.onForwardR(resultData);
                break;
            case this.messageType.MsgType_HTLC_SendSignVerifyR_46:
                this.onSignR(resultData);
                break;
            case this.messageType.MsgType_HTLC_SendRequestCloseCurrTx_49:
                this.onCloseHTLC(resultData);
                break;
            case this.messageType.MsgType_HTLC_SendCloseSigned_50:
                this.onCloseHTLCSigned(resultData);
                break;
            case this.messageType.MsgType_Core_Omni_GetTransaction_2118:
                this.onGetTransaction(resultData);
                break;
            case this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_2113:
                this.onIssueFixedAmount(resultData);
                break;
        }
    }
    /**
     * MsgType_UserLogin_2001
     * @param mnemonic string
     * @param callback function
     */
    logIn(mnemonic, callback) {
        if (this.isLogin) {
            if (callback != null) {
                callback("already logined");
                alert("You are already logged in!");
            }
            return;
        }
        if (this.isNotString(mnemonic)) {
            alert("empty mnemonic");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_UserLogin_2001;
        msg.data["mnemonic"] = mnemonic;
        this.sendData(msg, callback);
    }
    onLogIn(resultData) {
        if (this.isLogin == false) {
            this.isLogin = true;
        }
    }
    /**
     * MsgType_UserLogout_2002
     * @param callback function
     */
    logout(callback) {
        if (this.isLogin) {
            let msg = new Message();
            msg.type = this.messageType.MsgType_UserLogout_2002;
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
     * MsgType_p2p_ConnectPeer_2003
     * @param info P2PPeer
     * @param callback function
     */
    connectPeer(info, callback) {
        if (this.isNotString(info.remote_node_address)) {
            alert("empty remote_node_address");
            return;
        }
        let msg = new Message();
        msg.data = info;
        msg.type = this.messageType.MsgType_p2p_ConnectPeer_2003;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_Core_GetNewAddress_2101
     * @param callback function
     */
    // public getNewAddress(callback: Function) {
    //   let msg = new Message();
    //   msg.type = this.messageType.MsgType_Core_GetNewAddress_2101;
    //   this.sendData(msg, callback);
    // }
    // public onGetNewAddressFromOmniCore(jsonData: any) {}
    /**
     * MsgType_Core_FundingBTC_2109
     * @param info BtcFundingInfo
     * @param callback function
     */
    fundingBitcoin(info, callback) {
        if (this.isNotString(info.from_address)) {
            alert("empty from_address");
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
        msg.type = this.messageType.MsgType_Core_FundingBTC_2109;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onFundingBitcoin(jsonData) { }
    /**
     * MsgType_FundingCreate_SendBtcFundingCreated_340
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info  FundingBtcCreated
     * @param callback  Function
     */
    bitcoinFundingCreated(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingCreate_SendBtcFundingCreated_340;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_FundingCreate_BtcFundingMinerRDTxToClient_341
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param signed_hex  string
     * @param callback  Function
     */
    sendSignedHex100341(recipient_node_peer_id, recipient_user_peer_id, signed_hex, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingCreate_BtcFundingMinerRDTxToClient_341;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data["hex"] = signed_hex;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_FundingSign_SendBtcSign_350
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info FundingBtcSigned
     * @param callback  Function
     */
    bitcoinFundingSigned(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        if (this.isNotString(info.signed_miner_redeem_transaction_hex)) {
            alert("empty signed_miner_redeem_transaction_hex");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingSign_SendBtcSign_350;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_Core_Omni_ListProperties_2117
     * @param callback function
     */
    listProperties(callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_ListProperties_2117;
        this.sendData(msg, callback);
    }
    onListProperties(jsonData) { }
    /**
     * MsgType_Core_Omni_FundingAsset_2120
     * @param info OmniFundingAssetInfo
     * @param callback function
     */
    fundingAsset(info, callback) {
        if (this.isNotString(info.from_address)) {
            alert("empty from_address");
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
        msg.type = this.messageType.MsgType_Core_Omni_FundingAsset_2120;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onFundingAsset(jsonData) { }
    /**
     * MsgType_Core_Omni_Send_2121
     * @param info OmniSendAssetInfo
     * @param callback function
     */
    sendAsset(info, callback) {
        if (this.isNotString(info.from_address)) {
            alert("empty from_address");
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_Send_2121;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onSendAsset(jsonData) { }
    /**
     * MsgType_Mnemonic_CreateAddress_3000
     * @param callback function
     */
    genAddressFromMnemonic(callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_CreateAddress_3000;
        this.sendData(msg, callback);
    }
    onGenAddressFromMnemonic(jsonData) { }
    /**
     * MsgType_Mnemonic_GetAddressByIndex_3001
     * @param index:number
     * @param callback function
     */
    getAddressInfo(index, callback) {
        if (index == null || index < 0) {
            alert("error index");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_3001;
        msg.data = index;
        this.sendData(msg, callback);
    }
    onGetAddressInfo(jsonData) { }
    /**
     * MsgType_SendChannelOpen_32
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info OpenChannelInfo
     * @param callback function
     */
    openChannel(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(info.funding_pubkey)) {
            alert("error funding_pubkey");
            return;
        }
        if (info.is_private == null) {
            info.is_private = false;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_SendChannelOpen_32;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onOpenChannel(jsonData) { }
    /**
     * MsgType_SendChannelAccept_33
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
        msg.type = this.messageType.MsgType_SendChannelAccept_33;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onAcceptChannel(jsonData) { }
    /**
     * MsgType_CheckChannelAddessExist_3156
     * Parameters same to type 33
     *
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info AcceptChannelInfo
     * @param callback function
     */
    checkChannelAddessExist(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        msg.type = this.messageType.MsgType_CheckChannelAddessExist_3156;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCheckChannelAddessExist(jsonData) { }
    /**
     * MsgType_FundingCreate_SendAssetFundingCreated_34
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info AssetFundingCreatedInfo
     * @param callback function
     */
    assetFundingCreated(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingCreate_SendAssetFundingCreated_34;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onAssetFundingCreated(jsonData) { }
    /**
     * MsgType_ClientSign_AssetFunding_AliceSignC1a_1034
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param signed_hex  string
     * @param callback  Function
     */
    sendSignedHex101034(recipient_node_peer_id, recipient_user_peer_id, signed_hex, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_ClientSign_AssetFunding_AliceSignC1a_1034;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data["signed_c1a_hex"] = signed_hex;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_ClientSign_AssetFunding_AliceSignRD_1134
     * @param info      SignedInfo101134
     * @param callback  Function
     */
    sendSignedHex101134(info, callback) {
        if (this.isNotString(info.channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_ClientSign_AssetFunding_AliceSignRD_1134;
        msg.data = info;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_FundingSign_SendAssetFundingSigned_35
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info AssetFundingSignedInfo
     * @param callback function
     */
    assetFundingSigned(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        if (this.isNotString(info.signed_alice_rsmc_hex)) {
            alert("empty signed_alice_rsmc_hex");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingSign_SendAssetFundingSigned_35;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onAssetFundingSigned(jsonData) { }
    /**
     * MsgType_ClientSign_Duplex_AssetFunding_RdAndBr_1035
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info  SignedInfo101035
     * @param callback  Function
     */
    sendSignedHex101035(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_ClientSign_Duplex_AssetFunding_RdAndBr_1035;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_CommitmentTx_SendCommitmentTransactionCreated_351
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
        if (info.amount == null || info.amount <= 0) {
            alert("wrong amount");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCommitmentTransactionCreated(jsonData) { }
    /**
     * MsgType_ClientSign_CommitmentTx_AliceSignC2a_360
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info      SignedInfo100360
     * @param callback  Function
     */
    sendSignedHex100360(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_AliceSignC2a_360;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info CommitmentTxSigned
     * @param callback function
     */
    commitmentTransactionAccepted(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        if (this.isNotString(info.msg_hash)) {
            alert("empty msg_hash");
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
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCommitmentTransactionAccepted(jsonData) { }
    /**
     * MsgType_ClientSign_CommitmentTx_BobSignC2b_361
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info      SignedInfo100361
     * @param callback  Function
     */
    sendSignedHex100361(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_BobSignC2b_361;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_ClientSign_CommitmentTx_AliceSignC2b_362
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info      SignedInfo100362
     * @param callback  Function
     */
    sendSignedHex100362(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_AliceSignC2b_362;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_ClientSign_CommitmentTx_AliceSignC2b_Rd_363
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info      SignedInfo100363
     * @param callback  Function
     */
    sendSignedHex100363(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_AliceSignC2b_Rd_363;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_ClientSign_CommitmentTx_BobSignC2b_Rd_364
     * @param info      SignedInfo100364
     * @param callback  Function
     */
    sendSignedHex100364(info, callback) {
        if (this.isNotString(info.channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_BobSignC2b_Rd_364;
        msg.data = info;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_HTLC_Invoice_402
     * @param info InvoiceInfo
     * @param callback function
     */
    addInvoice(info, callback) {
        if (info.property_id == null || info.property_id <= 0) {
            alert("empty property_id");
            return;
        }
        if (info.amount == null || info.amount <= 0) {
            alert("wrong amount");
            return;
        }
        if (this.isNotString(info.h)) {
            alert("empty h");
            return;
        }
        if (this.isNotString(info.expiry_time)) {
            alert("empty expiry_time");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_Invoice_402;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onAddInvoice(jsonData) { }
    /**
     * MsgType_HTLC_FindPath_401
     * @param info HTLCFindPathInfo
     * @param callback function
     */
    HTLCFindPath(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_FindPath_401;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onHTLCFindPath(jsonData) { }
    /**
     * MsgType_HTLC_SendAddHTLC_40
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info addHTLCInfo
     * @param callback function
     */
    addHTLC(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        if (this.isNotString(info.routing_packet)) {
            alert("empty routing_packet");
            return;
        }
        if (info.cltv_expiry <= 0) {
            alert("wrong cltv_expiry");
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
        msg.type = this.messageType.MsgType_HTLC_SendAddHTLC_40;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onAddHTLC(jsonData) { }
    /**
     * MsgType_HTLC_SendAddHTLCSigned_41
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
        if (this.isNotString(info.payer_commitment_tx_hash)) {
            alert("empty payer_commitment_tx_hash");
            return;
        }
        if (this.isNotString(info.channel_address_private_key)) {
            alert("empty channel_address_private_key");
            return;
        }
        // if (this.isNotString(info.last_temp_address_private_key)) {
        //   alert("empty last_temp_address_private_key");
        //   return;
        // }
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendAddHTLCSigned_41;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onHtlcSigned(jsonData) { }
    /* ***************** backward R begin*****************/
    /**
     * MsgType_HTLC_SendVerifyR_45
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info ForwardRInfo
     * @param callback function
     */
    forwardR(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        msg.type = this.messageType.MsgType_HTLC_SendVerifyR_45;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onForwardR(jsonData) { }
    /**
     * MsgType_HTLC_SendSignVerifyR_46
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info SignRInfo
     * @param callback function
     */
    signR(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
        if (this.isNotString(info.msg_hash)) {
            alert("empty msg_hash");
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
        msg.type = this.messageType.MsgType_HTLC_SendSignVerifyR_46;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onSignR(jsonData) { }
    /* ***************** backward R end*****************/
    /* ***************** close htlc tx begin*****************/
    /**
     * MsgType_HTLC_SendRequestCloseCurrTx_49
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
        msg.type = this.messageType.MsgType_HTLC_SendRequestCloseCurrTx_49;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onCloseHTLC(jsonData) { }
    /**
     * MsgType_HTLC_SendCloseSigned_50
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
        if (this.isNotString(info.msg_hash)) {
            alert("empty msg_hash");
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
        msg.type = this.messageType.MsgType_HTLC_SendCloseSigned_50;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCloseHTLCSigned(jsonData) { }
    /* ***************** close htlc tx end*****************/
    /* ********************* query data *************************** */
    /**
     * MsgType_Core_Omni_GetTransaction_2118
     * @param txid string
     * @param callback function
     */
    getTransaction(txid, callback) {
        if (this.isNotString(txid)) {
            alert("empty txid");
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_GetTransaction_2118;
        msg.data["txid"] = txid;
        this.sendData(msg, callback);
    }
    onGetTransaction(jsonData) { }
    /**
     * MsgType_Core_Omni_CreateNewTokenFixed_2113
     * @param info IssueFixedAmountInfo
     * @param callback function
     */
    issueFixedAmount(info, callback) {
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
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_2113;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onIssueFixedAmount(jsonData) { }
    /**
     * MsgType_Core_Omni_CreateNewTokenManaged_2114
     * @param info IssueManagedAmoutInfo
     * @param callback function
     */
    issueManagedAmout(info, callback) {
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
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenManaged_2114;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onIssueManagedAmout(jsonData) { }
    /**
     * MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115
     * @param info OmniSendGrant
     * @param callback function
     */
    sendGrant(info, callback) {
        if (this.isNotString(info.from_address)) {
            alert("empty from_address");
            return;
        }
        if (info.property_id == null || info.property_id < 1) {
            alert("empty property_id");
            return;
        }
        if (info.amount == null || info.amount <= 0) {
            alert("wrong amount");
            return;
        }
        if (this.isNotString(info.memo)) {
            info.memo = "";
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onSendGrant(jsonData) { }
    /**
     * MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116
     * @param info OmniSendRevoke
     * @param callback function
     */
    sendRevoke(info, callback) {
        if (this.isNotString(info.from_address)) {
            alert("empty from_address");
            return;
        }
        if (info.property_id == null || info.property_id < 1) {
            alert("empty property_id");
            return;
        }
        if (info.amount == null || info.amount <= 0) {
            alert("wrong amount");
            return;
        }
        if (this.isNotString(info.memo)) {
            info.memo = "";
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onSendRevoke(jsonData) { }
    /**
     * MsgType_Core_Omni_Getbalance_2112
     * @param address string
     * @param callback function
     */
    getAllBalancesForAddress(address, callback) {
        if (this.isNotString(address)) {
            alert("empty address");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_Getbalance_2112;
        msg.data["address"] = address;
        this.sendData(msg, callback);
    }
    onGetAllBalancesForAddress(jsonData) { }
    /**
     * MsgType_Core_Omni_GetProperty_2119
     * @param propertyId string
     * @param callback function
     */
    getProperty(propertyId, callback) {
        if (this.isNotString(propertyId)) {
            alert("empty propertyId");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_GetProperty_2119;
        msg.data["propertyId"] = propertyId;
        this.sendData(msg, callback);
    }
    onGetProperty(jsonData) { }
    /**
     * MsgType_Core_BalanceByAddress_2108
     * @param address string
     * @param callback function
     */
    getBtcBalanceByAddress(address, callback) {
        if (this.isNotString(address)) {
            alert("empty address");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_BalanceByAddress_2108;
        msg.data["address"] = address;
        this.sendData(msg, callback);
    }
    onGetBtcBalanceByAddress(jsonData) { }
    /**
     * MsgType_Core_Btc_ImportPrivKey_2111
     * @param privkey string
     * @param callback function
     */
    importPrivKey(privkey, callback) {
        if (this.isNotString(privkey)) {
            alert("empty privkey");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Btc_ImportPrivKey_2111;
        msg.data["privkey"] = privkey;
        this.sendData(msg, callback);
    }
    onImportPrivKey(jsonData) { }
    /**
     * MsgType_HTLC_CreatedRAndHInfoList_N4001
     * @param callback function
     */
    getAddHTLCRandHInfoList(callback) {
        let msg = new Message();
        // msg.type = this.messageType.MsgType_HTLC_CreatedRAndHInfoList_N4001;
        this.sendData(msg, callback);
    }
    onGetAddHTLCRandHInfoList(jsonData) { }
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
     * MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203
     * @param channel_id string
     * @param callback function
     */
    getLatestCommitmentTransaction(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetLatestCommitmentTransaction(jsonData) { }
    /**
     * MsgType_CommitmentTx_ItemsByChanId_3200
     * @param channel_id string
     * @param callback function
     */
    getItemsByChannelId(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetItemsByChannelId(jsonData) { }
    /**
     * MsgType_ChannelOpen_AllItem_3150
     * @param page_size Number
     * @param page_index Number
     * @param callback function
     */
    getMyChannels(page_size, page_index, callback) {
        if (page_size == null || page_size <= 0) {
            page_size = 10;
        }
        if (page_index == null || page_index <= 0) {
            page_index = 1;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelOpen_AllItem_3150;
        msg.data["page_size"] = page_size;
        msg.data["page_index"] = page_index;
        this.sendData(msg, callback);
    }
    onGetMyChannels(jsonData) { }
    /**
     * MsgType_GetMiniBtcFundAmount_2006
     * @param callback function
     */
    getAmountOfRechargeBTC(callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_GetMiniBtcFundAmount_2006;
        this.sendData(msg, callback);
    }
    onGetAmountOfRechargeBTC(jsonData) { }
    /**
     * MsgType_GetChannelInfoByChannelId_3154
     * @param channel_id string
     * @param callback function
     */
    getChannelDetailFromChannelID(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_GetChannelInfoByChannelId_3154;
        msg.data = channel_id;
        // msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetChannelDetailFromChannelID(jsonData) { }
    /**
     * MsgType_GetChannelInfoByDbId_3155
     * @param id number
     * @param callback function
     */
    getChannelDetailFromDatabaseID(id, callback) {
        if (id == null || id <= 0) {
            alert("error id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_GetChannelInfoByDbId_3155;
        msg.data = id;
        this.sendData(msg, callback);
    }
    onGetChannelDetailFromDatabaseID(jsonData) { }
    /**
     * MsgType_CommitmentTx_AllBRByChanId_3208
     * @param channel_id string
     * @param callback function
     */
    getAllBreachRemedyTransactions(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_AllBRByChanId_3208;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetAllBreachRemedyTransactions(jsonData) { }
    /**
     * MsgType_CommitmentTx_ItemsByChanId_3200
     * @param channel_id string
     * @param callback function
     */
    getAllCommitmentTx(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetAllCommitmentTx(jsonData) { }
    /**
     * MsgType_CommitmentTx_LatestRDByChanId_3204
     * @param channel_id string
     * @param callback function
     */
    getLatestRevockableDeliveryTransaction(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestRDByChanId_3204;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetLatestRevockableDeliveryTransaction(jsonData) { }
    /**
     * MsgType_CommitmentTx_LatestBRByChanId_3205
     * @param channel_id string
     * @param callback function
     */
    getLatestBreachRemedyTransaction(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestBRByChanId_3205;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetLatestBreachRemedyTransaction(jsonData) { }
    /**
     * MsgType_CommitmentTx_SendSomeCommitmentById_3206
     * @param id number
     * @param callback function
     */
    sendSomeCommitmentById(id, callback) {
        if (id == null || id < 0) {
            alert("error id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_SendSomeCommitmentById_3206;
        msg.data = id;
        this.sendData(msg, callback);
    }
    onSendSomeCommitmentById(jsonData) { }
    /**
     * MsgType_CommitmentTx_AllRDByChanId_3207
     * @param channel_id string
     * @param callback function
     */
    getAllRevockableDeliveryTransactions(channel_id, callback) {
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_AllRDByChanId_3207;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetAllRevockableDeliveryTransactions(jsonData) { }
    /**
     * MsgType_SendCloseChannelRequest_38
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param channel_id string
     * @param callback function
     */
    closeChannel(recipient_node_peer_id, recipient_user_peer_id, channel_id, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
        if (this.isNotString(channel_id)) {
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_SendCloseChannelRequest_38;
        msg.data["channel_id"] = channel_id;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onCloseChannel(jsonData) { }
    /**
     * MsgType_SendCloseChannelSign_39
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info CloseChannelSign
     * @param callback function
     */
    closeChannelSigned(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
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
            if (this.isNotString(info.request_close_channel_hash)) {
                alert("empty request_close_channel_hash");
                return;
            }
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_SendCloseChannelSign_39;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    onCloseChannelSigned(jsonData) { }
    /**
     * MsgType_Atomic_SendSwap_80
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info AtomicSwapRequest
     * @param callback function
     */
    atomicSwap(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
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
        msg.type = this.messageType.MsgType_Atomic_SendSwap_80;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        this.sendData(msg, callback);
    }
    /**
     * MsgType_Atomic_SendSwapAccept_81
     * @param recipient_node_peer_id string
     * @param recipient_user_peer_id string
     * @param info AtomicSwapAccepted
     * @param callback function
     */
    atomicSwapAccepted(recipient_node_peer_id, recipient_user_peer_id, info, callback) {
        if (this.isNotString(recipient_node_peer_id)) {
            alert("error recipient_node_peer_id");
            return;
        }
        if (this.isNotString(recipient_user_peer_id)) {
            alert("error recipient_user_peer_id");
            return;
        }
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
        msg.type = this.messageType.MsgType_Atomic_SendSwapAccept_81;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
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
