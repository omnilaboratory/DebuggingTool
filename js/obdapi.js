var ObdApi = (function () {
    function ObdApi() {
        this.isConnectToOBD = false;
        this.isLogin = false;
        this.messageType = new MessageType();
        this.defaultAddress = "ws://127.0.0.1:60020/ws";
        this.callbackMap = new Map();
    }
    ObdApi.prototype.connectToServer = function (address, callback) {
        var _this = this;
        if (this.isConnectToOBD == true) {
            console.info("already connect");
            return;
        }
        if (address != null && address.length > 0) {
            this.defaultAddress = address;
        }
        console.info("connect to " + this.defaultAddress);
        try {
            this.ws = new WebSocket(this.defaultAddress);
            this.ws.onopen = function () {
                console.info("connect succss");
                if (callback != null) {
                    callback("connect succss");
                }
                _this.isConnectToOBD = true;
            };
            this.ws.onmessage = function (e) {
                var jsonData = JSON.parse(e.data);
                console.info(jsonData);
                _this.getDataFromServer(jsonData);
            };
            this.ws.onclose = function (e) {
                console.info("ws close", e);
                _this.isConnectToOBD = false;
                _this.isLogin = false;
            };
            this.ws.onerror = function (e) {
                console.info("ws error", e);
            };
        }
        catch (error) {
            console.info(error);
            alert("can not connect to server");
            return;
        }
    };
    ObdApi.prototype.sendData = function (msg, callback) {
        if (this.isConnectToOBD == false) {
            alert("please try to connect obd again");
            return;
        }
        if (msg.type < 0 && this.isLogin == false) {
            alert("please login");
            return;
        }
        console.info("----------------------------send msg------------------------------");
        console.info(msg);
        if (callback != null) {
            this.callbackMap[msg.type] = callback;
        }
        this.ws.send(JSON.stringify(msg));
    };
    ObdApi.prototype.getDataFromServer = function (jsonData) {
        if (jsonData.status == false) {
            if (jsonData.type != this.messageType.MsgType_Error_0) {
                alert(jsonData.result);
            }
            return;
        }
        var resultData = jsonData.result;
        console.info("----------------------------get msg from server--------------------");
        var callback = this.callbackMap[jsonData.type];
        if (callback != null) {
            callback(resultData);
        }
        switch (jsonData.type) {
            case this.messageType.MsgType_UserLogin_1:
                this.onLogin(resultData);
                break;
            case this.messageType.MsgType_UserLogout_2:
                this.onLogout(resultData);
                break;
            case this.messageType.MsgType_GetMnemonic_101:
                this.onGetMnemonic(resultData);
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
                this.onGetAddressByIndexByMnemonic(resultData);
                break;
            case this.messageType.MsgType_ChannelOpen_N32:
                this.onOpenChannel(resultData);
                break;
            case this.messageType.MsgType_ChannelAccept_N33:
                this.onChannelAccept(resultData);
                break;
            case this.messageType.MsgType_FundingCreate_AssetFundingCreated_N34:
                this.onChannelFundingCreated(resultData);
                break;
            case this.messageType.MsgType_FundingSign_AssetFundingSigned_N35:
                this.onChannelFundingSigned(resultData);
                break;
            case this.messageType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
                this.onCommitmentTransactionCreated(resultData);
                break;
            case this.messageType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
                this.onRevokeAndAcknowledgeCommitmentTransaction(resultData);
                break;
            case this.messageType.MsgType_HTLC_Invoice_N4003:
                this.onHtlcInvoice(resultData);
                break;
            case this.messageType.MsgType_HTLC_AddHTLC_N40:
                this.onAddHtlc(resultData);
                break;
            case this.messageType.MsgType_HTLC_AddHTLCSigned_N41:
                this.onAddHtlcSigned(resultData);
                break;
            case this.messageType.MsgType_HTLC_FindPathAndSendH_N42:
                this.onHtlcFindPathAndSendH(resultData);
                break;
            case this.messageType.MsgType_HTLC_SendH_N43:
                this.onHtlcSendH(resultData);
                break;
            case this.messageType.MsgType_HTLC_SignGetH_N44:
                this.onHtlcSignGetH(resultData);
                break;
            case this.messageType.MsgType_HTLC_CreateCommitmentTx_N45:
                this.onHtlcCreateCommitmentTx(resultData);
                break;
            case this.messageType.MsgType_HTLC_SendR_N46:
                this.onHtlcSendR(resultData);
                break;
            case this.messageType.MsgType_HTLC_VerifyR_N47:
                this.onHtlcVerifyR(resultData);
                break;
            case this.messageType.MsgType_HTLC_RequestCloseCurrTx_N48:
                this.onCloseHtlcTx(resultData);
                break;
            case this.messageType.MsgType_HTLC_CloseSigned_N49:
                this.onCloseHtlcTxSigned(resultData);
                break;
            case this.messageType.MsgType_Core_Omni_GetTransaction_1206:
                this.onGetOmniTxByTxid(resultData);
                break;
            case this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_1201:
                this.onCreateNewProperty(resultData);
                break;
        }
    };
    /**
     * MsgType_UserLogin_1
     * @param mnemonic:string
     */
    ObdApi.prototype.login = function (mnemonic, callback) {
        if (this.isLogin) {
            return;
        }
        var msg = new Message();
        msg.type = this.messageType.MsgType_UserLogin_1;
        if (mnemonic != null && mnemonic.length > 0) {
            msg.data["mnemonic"] = mnemonic;
        }
        else {
            msg.data["mnemonic"] = "unfold tortoise zoo hand sausage project boring corn test same elevator mansion bargain coffee brick tilt forum purpose hundred embody weapon ripple when narrow";
        }
        if (callback != null) {
            this.callbackMap[msg.type] = callback;
        }
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onLogin = function (resultData) {
        this.isLogin = true;
    };
    /**
    * MsgType_UserLogout_2
    */
    ObdApi.prototype.logout = function (callback) {
        if (this.isLogin) {
            var msg = new Message();
            msg.type = this.messageType.MsgType_UserLogout_2;
            this.sendData(msg, callback);
        }
    };
    ObdApi.prototype.onLogout = function (jsonData) {
        this.isLogin = false;
    };
    /**
     * MsgType_GetMnemonic_101
     */
    ObdApi.prototype.getMnemonic = function (callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_GetMnemonic_101;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onGetMnemonic = function (jsonData) {
    };
    /**
     * MsgType_Core_GetNewAddress_1001
     */
    ObdApi.prototype.getNewAddressFromOmniCore = function (callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Core_GetNewAddress_1001;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onGetNewAddressFromOmniCore = function (jsonData) {
    };
    /**
     * MsgType_Core_FundingBTC_1009
     * @param BtcFundingInfo
     */
    ObdApi.prototype.fundingBTC = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Core_FundingBTC_1009;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onFundingBTC = function (jsonData) {
    };
    /**
     * MsgType_Core_Omni_ListProperties_1205
     */
    ObdApi.prototype.listProperties = function (callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_ListProperties_1205;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onListProperties = function (jsonData) {
    };
    /**
    * MsgType_Core_Omni_FundingAsset_2001
    * @param OmniFundingAssetInfo
     */
    ObdApi.prototype.fundingAssetOfOmni = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_FundingAsset_2001;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onFundingAssetOfOmni = function (jsonData) {
    };
    /**
     * MsgType_Mnemonic_CreateAddress_N200
     */
    ObdApi.prototype.createAddressByMnemonic = function (callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_CreateAddress_N200;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onCreateAddressByMnemonic = function (jsonData) {
    };
    /**
     * MsgType_Mnemonic_GetAddressByIndex_201
     * @param index:number
     */
    ObdApi.prototype.getAddressByIndexByMnemonic = function (index, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_201;
        msg.data = index;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onGetAddressByIndexByMnemonic = function (jsonData) {
    };
    /**
     * MsgType_ChannelOpen_N32
     * @param funding_pubkey
     * @param recipient_peer_id
     */
    ObdApi.prototype.openChannel = function (funding_pubkey, recipient_peer_id, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_ChannelOpen_N32;
        msg.data["funding_pubkey"] = funding_pubkey;
        msg.recipient_peer_id = recipient_peer_id;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onOpenChannel = function (jsonData) {
    };
    /**
     * MsgType_ChannelAccept_N33
     * @param AcceptChannelInfo
     */
    ObdApi.prototype.channelAccept = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_ChannelAccept_N33;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onChannelAccept = function (jsonData) {
    };
    /**
     * MsgType_FundingCreate_AssetFundingCreated_N34
     * @param ChannelFundingCreatedInfo
     */
    ObdApi.prototype.channelFundingCreated = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_FundingCreate_AssetFundingCreated_N34;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onChannelFundingCreated = function (jsonData) {
    };
    /**
    * MsgType_FundingSign_AssetFundingSigned_N35
    * @param ChannelFundingSignedInfo
    */
    ObdApi.prototype.channelFundingSigned = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_FundingSign_AssetFundingSigned_N35;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onChannelFundingSigned = function (jsonData) {
    };
    /**
     * MsgType_CommitmentTx_CommitmentTransactionCreated_N351
     * @param CommitmentTx
     */
    ObdApi.prototype.commitmentTransactionCreated = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onCommitmentTransactionCreated = function (jsonData) {
    };
    /**
     * MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352
     * @param CommitmentTxSigned
     */
    ObdApi.prototype.revokeAndAcknowledgeCommitmentTransaction = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onRevokeAndAcknowledgeCommitmentTransaction = function (jsonData) {
    };
    /**
    * MsgType_HTLC_Invoice_N4003
    * @param HtlcHInfo
    */
    ObdApi.prototype.htlcInvoice = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_Invoice_N4003;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onHtlcInvoice = function (jsonData) {
    };
    /**
     * MsgType_HTLC_AddHTLC_N40
     * @param HtlcHInfo
     */
    ObdApi.prototype.addHtlc = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLC_N40;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onAddHtlc = function (jsonData) {
    };
    /**
     * MsgType_HTLC_AddHTLCSigned_N41
     * @param HtlcHSignInfo
     */
    ObdApi.prototype.addHtlcSigned = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLCSigned_N41;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onAddHtlcSigned = function (jsonData) {
    };
    /**
     * MsgType_HTLC_FindPathAndSendH_N42
     * @param h:string
     */
    ObdApi.prototype.htlcFindPathAndSendH = function (h, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_FindPathAndSendH_N42;
        msg.data["h"] = h;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onHtlcFindPathAndSendH = function (jsonData) {
    };
    /**
     * MsgType_HTLC_SendH_N43
     * @param h
     * @param request_hash
     */
    ObdApi.prototype.htlcSendH = function (h, request_hash, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendH_N43;
        msg.data["h"] = h;
        msg.data["h_and_r_info_request_hash"] = request_hash;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onHtlcSendH = function (jsonData) {
    };
    /**
     * MsgType_HTLC_SignGetH_N44
     * @param SignGetHInfo
     */
    ObdApi.prototype.htlcSignGetH = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SignGetH_N44;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onHtlcSignGetH = function (jsonData) {
    };
    /**
     * MsgType_HTLC_CreateCommitmentTx_N45
     * @param HtlcRequestOpen
     */
    ObdApi.prototype.htlcCreateCommitmentTx = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CreateCommitmentTx_N45;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onHtlcCreateCommitmentTx = function (jsonData) {
    };
    /* ***************** backward R begin*****************/
    /**
     * MsgType_HTLC_SendR_N46
     * @param HtlcSendRInfo
     */
    ObdApi.prototype.htlcSendR = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendR_N46;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onHtlcSendR = function (jsonData) {
    };
    /**
     * MsgType_HTLC_VerifyR_N47
     * @param HtlcVerifyRInfo
     */
    ObdApi.prototype.htlcVerifyR = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N47;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onHtlcVerifyR = function (jsonData) {
    };
    /* ***************** backward R end*****************/
    /* ***************** close htlc tx begin*****************/
    /**
     * MsgType_HTLC_VerifyR_N47
     * @param CloseHtlcTxInfo
     */
    ObdApi.prototype.closeHtlcTx = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N47;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onCloseHtlcTx = function (jsonData) {
    };
    /**
     * MsgType_HTLC_CloseSigned_N49
     * @param CloseHtlcTxInfoSigned
     */
    ObdApi.prototype.closeHtlcTxSigned = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CloseSigned_N49;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onCloseHtlcTxSigned = function (jsonData) {
    };
    /* ***************** close htlc tx end*****************/
    /* ********************* query data *************************** */
    /**
     * MsgType_Core_Omni_GetTransaction_1206
     * @param txid
     */
    ObdApi.prototype.getOmniTxByTxid = function (txid, callback) {
        if (txid == null || txid.length == 0) {
            alert("empty txid");
        }
        var msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_GetTransaction_1206;
        msg.data["txid"] = txid;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onGetOmniTxByTxid = function (jsonData) {
    };
    /**
     * MsgType_Core_Omni_CreateNewTokenFixed_1201
     * @param OmniPropertyInfo
     */
    ObdApi.prototype.createNewProperty = function (info, callback) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_1201;
        msg.data = info;
        this.sendData(msg, callback);
    };
    ObdApi.prototype.onCreateNewProperty = function (jsonData) {
    };
    return ObdApi;
}());
