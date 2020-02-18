var ObdApi = (function () {
    function ObdApi() {
        this.isConnectToOBD = false;
        this.isLogin = false;
        this.messageType = new MessageType();
        this.defaultAddress = "ws://127.0.0.1:60020/ws";
    }
    ObdApi.prototype.connectToServer = function (address) {
        var _this = this;
        if (this.isConnectToOBD) {
            return;
        }
        if (address != null && address.length > 0) {
            this.defaultAddress = address;
        }
        try {
            this.ws = new WebSocket(this.defaultAddress);
            this.ws.onopen = function () {
                console.info("send ok");
                _this.isConnectToOBD = true;
            };
            this.ws.onmessage = function (e) {
                var jsonData = JSON.parse(e.data);
                console.info("data from server", jsonData);
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
        }
    };
    ObdApi.prototype.sendData = function (msg) {
        if (this.isConnectToOBD == false) {
            alert("please try to connect obd again");
            return;
        }
        if (msg.type < 0 && this.isLogin == false) {
            alert("please login");
            return;
        }
        console.info("send msg: ", msg);
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
        console.info("data:", resultData);
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
        }
    };
    /**
     * MsgType_UserLogin_1
     * @param mnemonic:string
     */
    ObdApi.prototype.login = function (mnemonic) {
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
        this.sendData(msg);
    };
    ObdApi.prototype.onLogin = function (resultData) {
        this.isLogin = true;
    };
    /**
    * MsgType_UserLogout_2
    */
    ObdApi.prototype.logout = function () {
        if (this.isLogin) {
            var msg = new Message();
            msg.type = this.messageType.MsgType_UserLogout_2;
            this.sendData(msg);
        }
    };
    ObdApi.prototype.onLogout = function (jsonData) {
        this.isLogin = false;
    };
    /**
     * MsgType_GetMnemonic_101
     */
    ObdApi.prototype.getMnemonic = function () {
        var msg = new Message();
        msg.type = this.messageType.MsgType_GetMnemonic_101;
        this.sendData(msg);
    };
    ObdApi.prototype.onGetMnemonic = function (jsonData) {
    };
    /**
     * MsgType_Core_GetNewAddress_1001
     */
    ObdApi.prototype.getNewAddressFromOmniCore = function () {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Core_GetNewAddress_1001;
        this.sendData(msg);
    };
    ObdApi.prototype.onGetNewAddressFromOmniCore = function (jsonData) {
    };
    /**
     * MsgType_Core_FundingBTC_1009
     * @param BtcFundingInfo
     */
    ObdApi.prototype.fundingBTC = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Core_FundingBTC_1009;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onFundingBTC = function (jsonData) {
    };
    /**
     * MsgType_Core_Omni_ListProperties_1205
     */
    ObdApi.prototype.listProperties = function () {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_ListProperties_1205;
        this.sendData(msg);
    };
    ObdApi.prototype.onListProperties = function (jsonData) {
    };
    /**
    * MsgType_Core_Omni_FundingAsset_2001
    * @param OmniFundingAssetInfo
     */
    ObdApi.prototype.fundingAssetOfOmni = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_FundingAsset_2001;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onFundingAssetOfOmni = function (jsonData) {
    };
    /**
     * MsgType_Mnemonic_CreateAddress_N200
     */
    ObdApi.prototype.createAddressByMnemonic = function () {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_CreateAddress_N200;
        this.sendData(msg);
    };
    ObdApi.prototype.onCreateAddressByMnemonic = function (jsonData) {
    };
    /**
     * MsgType_Mnemonic_GetAddressByIndex_201
     * @param index:number
     */
    ObdApi.prototype.getAddressByIndexByMnemonic = function (index) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_201;
        msg.data = index;
        this.sendData(msg);
    };
    ObdApi.prototype.onGetAddressByIndexByMnemonic = function (jsonData) {
    };
    /**
     * MsgType_ChannelOpen_N32
     * @param funding_pubkey
     * @param recipient_peer_id
     */
    ObdApi.prototype.openChannel = function (funding_pubkey, recipient_peer_id) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_ChannelOpen_N32;
        msg.data["funding_pubkey"] = funding_pubkey;
        msg.recipient_peer_id = recipient_peer_id;
        this.sendData(msg);
    };
    ObdApi.prototype.onOpenChannel = function (jsonData) {
    };
    /**
     * MsgType_ChannelAccept_N33
     * @param AcceptChannelInfo
     */
    ObdApi.prototype.channelAccept = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_ChannelAccept_N33;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onChannelAccept = function (jsonData) {
    };
    /**
     * MsgType_FundingCreate_AssetFundingCreated_N34
     * @param ChannelFundingCreatedInfo
     */
    ObdApi.prototype.channelFundingCreated = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_FundingCreate_AssetFundingCreated_N34;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onChannelFundingCreated = function (jsonData) {
    };
    /**
    * MsgType_FundingSign_AssetFundingSigned_N35
    * @param ChannelFundingSignedInfo
    */
    ObdApi.prototype.channelFundingSigned = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_FundingSign_AssetFundingSigned_N35;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onChannelFundingSigned = function (jsonData) {
    };
    /**
     * MsgType_CommitmentTx_CommitmentTransactionCreated_N351
     * @param CommitmentTx
     */
    ObdApi.prototype.commitmentTransactionCreated = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onCommitmentTransactionCreated = function (jsonData) {
    };
    /**
     * MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352
     * @param CommitmentTxSigned
     */
    ObdApi.prototype.revokeAndAcknowledgeCommitmentTransaction = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onRevokeAndAcknowledgeCommitmentTransaction = function (jsonData) {
    };
    /**
    * MsgType_HTLC_Invoice_N4003
    * @param HtlcHInfo
    */
    ObdApi.prototype.htlcInvoice = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_Invoice_N4003;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onHtlcInvoice = function (jsonData) {
    };
    /**
     * MsgType_HTLC_AddHTLC_N40
     * @param HtlcHInfo
     */
    ObdApi.prototype.addHtlc = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLC_N40;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onAddHtlc = function (jsonData) {
    };
    /**
     * MsgType_HTLC_AddHTLCSigned_N41
     * @param HtlcHSignInfo
     */
    ObdApi.prototype.addHtlcSigned = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLCSigned_N41;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onAddHtlcSigned = function (jsonData) {
    };
    /**
     * MsgType_HTLC_FindPathAndSendH_N42
     * @param h:string
     */
    ObdApi.prototype.htlcFindPathAndSendH = function (h) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_FindPathAndSendH_N42;
        msg.data["h"] = h;
        this.sendData(msg);
    };
    ObdApi.prototype.onHtlcFindPathAndSendH = function (jsonData) {
    };
    /**
     * MsgType_HTLC_SendH_N43
     * @param h
     * @param request_hash
     */
    ObdApi.prototype.htlcSendH = function (h, request_hash) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendH_N43;
        msg.data["h"] = h;
        msg.data["h_and_r_info_request_hash"] = request_hash;
        this.sendData(msg);
    };
    ObdApi.prototype.onHtlcSendH = function (jsonData) {
    };
    /**
     * MsgType_HTLC_SignGetH_N44
     * @param SignGetHInfo
     */
    ObdApi.prototype.htlcSignGetH = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SignGetH_N44;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onHtlcSignGetH = function (jsonData) {
    };
    /**
     * MsgType_HTLC_CreateCommitmentTx_N45
     * @param HtlcRequestOpen
     */
    ObdApi.prototype.htlcCreateCommitmentTx = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CreateCommitmentTx_N45;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onHtlcCreateCommitmentTx = function (jsonData) {
    };
    /* ***************** backward R begin*****************/
    /**
     * MsgType_HTLC_SendR_N46
     * @param HtlcSendRInfo
     */
    ObdApi.prototype.htlcSendR = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendR_N46;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onHtlcSendR = function (jsonData) {
    };
    /**
     * MsgType_HTLC_VerifyR_N47
     * @param HtlcVerifyRInfo
     */
    ObdApi.prototype.htlcVerifyR = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N47;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onHtlcVerifyR = function (jsonData) {
    };
    /* ***************** backward R end*****************/
    /* ***************** close htlc tx begin*****************/
    /**
     * MsgType_HTLC_VerifyR_N47
     * @param CloseHtlcTxInfo
     */
    ObdApi.prototype.closeHtlcTx = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N47;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onCloseHtlcTx = function (jsonData) {
    };
    /**
     * MsgType_HTLC_CloseSigned_N49
     * @param CloseHtlcTxInfoSigned
     */
    ObdApi.prototype.closeHtlcTxSigned = function (info) {
        var msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CloseSigned_N49;
        msg.data = info;
        this.sendData(msg);
    };
    ObdApi.prototype.onCloseHtlcTxSigned = function (jsonData) {
    };
    return ObdApi;
}());
