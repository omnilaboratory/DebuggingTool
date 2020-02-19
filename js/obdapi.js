class ObdApi {
    constructor() {
        this.isConnectToOBD = false;
        this.isLogin = false;
        this.messageType = new MessageType();
        this.defaultAddress = "ws://127.0.0.1:60020/ws";
        this.callbackMap = new Map();
    }
    /**
     * connectToServer
     * @param address string
     * @param callback function
     */
    connectToServer(address, callback) {
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
            this.ws.onopen = () => {
                console.info("connect succss");
                if (callback != null) {
                    callback("connect succss");
                }
                this.isConnectToOBD = true;
            };
            this.ws.onmessage = e => {
                let jsonData = JSON.parse(e.data);
                console.info(jsonData);
                this.getDataFromServer(jsonData);
            };
            this.ws.onclose = e => {
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
        console.info("----------------------------send msg------------------------------");
        console.info(msg);
        if (callback != null) {
            this.callbackMap[msg.type] = callback;
        }
        this.ws.send(JSON.stringify(msg));
    }
    getDataFromServer(jsonData) {
        if (jsonData.status == false) {
            if (jsonData.type != this.messageType.MsgType_Error_0) {
                alert(jsonData.result);
            }
            return;
        }
        let resultData = jsonData.result;
        console.info("----------------------------get msg from server--------------------");
        let callback = this.callbackMap[jsonData.type];
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
                this.onCreateNewTokenFixed(resultData);
                break;
        }
    }
    /**
     * MsgType_UserLogin_1
     * @param mnemonic:string
     * @param callback function
     */
    login(mnemonic, callback) {
        if (this.isLogin) {
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_UserLogin_1;
        if (mnemonic != null && mnemonic.length > 0) {
            msg.data["mnemonic"] = mnemonic;
        }
        else {
            msg.data["mnemonic"] =
                "unfold tortoise zoo hand sausage project boring corn test same elevator mansion bargain coffee brick tilt forum purpose hundred embody weapon ripple when narrow";
        }
        this.sendData(msg, callback);
    }
    onLogin(resultData) {
        this.isLogin = true;
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
    }
    onLogout(jsonData) {
        this.isLogin = false;
    }
    /**
     * MsgType_GetMnemonic_101
     * @param callback function
     */
    getMnemonic(callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_GetMnemonic_101;
        this.sendData(msg, callback);
    }
    onGetMnemonic(jsonData) { }
    /**
     * MsgType_Core_GetNewAddress_1001
     * @param callback function
     */
    getNewAddressFromOmniCore(callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_GetNewAddress_1001;
        this.sendData(msg, callback);
    }
    onGetNewAddressFromOmniCore(jsonData) { }
    /**
     * MsgType_Core_FundingBTC_1009
     * @param BtcFundingInfo
     * @param callback function
     */
    fundingBTC(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_FundingBTC_1009;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onFundingBTC(jsonData) { }
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
     * @param OmniFundingAssetInfo
     * @param callback function
     */
    fundingAssetOfOmni(info, callback) {
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
    createAddressByMnemonic(callback) {
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
    getAddressByIndexByMnemonic(index, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_201;
        msg.data = index;
        this.sendData(msg, callback);
    }
    onGetAddressByIndexByMnemonic(jsonData) { }
    /**
     * MsgType_ChannelOpen_N32
     * @param funding_pubkey string
     * @param recipient_peer_id string
     * @param callback function
     */
    openChannel(funding_pubkey, recipient_peer_id, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelOpen_N32;
        msg.data["funding_pubkey"] = funding_pubkey;
        msg.recipient_peer_id = recipient_peer_id;
        this.sendData(msg, callback);
    }
    onOpenChannel(jsonData) { }
    /**
     * MsgType_ChannelAccept_N33
     * @param AcceptChannelInfo
     * @param callback function
     */
    channelAccept(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelAccept_N33;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onChannelAccept(jsonData) { }
    /**
     * MsgType_FundingCreate_AssetFundingCreated_N34
     * @param ChannelFundingCreatedInfo
     * @param callback function
     */
    channelFundingCreated(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingCreate_AssetFundingCreated_N34;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onChannelFundingCreated(jsonData) { }
    /**
     * MsgType_FundingSign_AssetFundingSigned_N35
     * @param ChannelFundingSignedInfo
     * @param callback function
     */
    channelFundingSigned(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingSign_AssetFundingSigned_N35;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onChannelFundingSigned(jsonData) { }
    /**
     * MsgType_CommitmentTx_CommitmentTransactionCreated_N351
     * @param CommitmentTx
     * @param callback function
     */
    commitmentTransactionCreated(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCommitmentTransactionCreated(jsonData) { }
    /**
     * MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352
     * @param CommitmentTxSigned
     * @param callback function
     */
    revokeAndAcknowledgeCommitmentTransaction(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onRevokeAndAcknowledgeCommitmentTransaction(jsonData) { }
    /**
     * MsgType_HTLC_Invoice_N4003
     * @param HtlcHInfo
     * @param callback function
     */
    htlcInvoice(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_Invoice_N4003;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onHtlcInvoice(jsonData) { }
    /**
     * MsgType_HTLC_AddHTLC_N40
     * @param HtlcHInfo
     * @param callback function
     */
    addHtlc(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLC_N40;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onAddHtlc(jsonData) { }
    /**
     * MsgType_HTLC_AddHTLCSigned_N41
     * @param HtlcHSignInfo
     * @param callback function
     */
    addHtlcSigned(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLCSigned_N41;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onAddHtlcSigned(jsonData) { }
    /**
     * MsgType_HTLC_FindPathAndSendH_N42
     * @param h string
     * @param callback function
     */
    htlcFindPathAndSendH(h, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_FindPathAndSendH_N42;
        msg.data["h"] = h;
        this.sendData(msg, callback);
    }
    onHtlcFindPathAndSendH(jsonData) { }
    /**
     * MsgType_HTLC_SendH_N43
     * @param h string
     * @param request_hash string
     * @param callback function
     */
    htlcSendH(h, request_hash, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendH_N43;
        msg.data["h"] = h;
        msg.data["h_and_r_info_request_hash"] = request_hash;
        this.sendData(msg, callback);
    }
    onHtlcSendH(jsonData) { }
    /**
     * MsgType_HTLC_SignGetH_N44
     * @param SignGetHInfo
     * @param callback function
     */
    htlcSignGetH(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SignGetH_N44;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onHtlcSignGetH(jsonData) { }
    /**
     * MsgType_HTLC_CreateCommitmentTx_N45
     * @param HtlcRequestOpen
     * @param callback function
     */
    htlcCreateCommitmentTx(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CreateCommitmentTx_N45;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onHtlcCreateCommitmentTx(jsonData) { }
    /* ***************** backward R begin*****************/
    /**
     * MsgType_HTLC_SendR_N46
     * @param HtlcSendRInfo
     * @param callback function
     */
    htlcSendR(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendR_N46;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onHtlcSendR(jsonData) { }
    /**
     * MsgType_HTLC_VerifyR_N47
     * @param HtlcVerifyRInfo
     * @param callback function
     */
    htlcVerifyR(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N47;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onHtlcVerifyR(jsonData) { }
    /* ***************** backward R end*****************/
    /* ***************** close htlc tx begin*****************/
    /**
     * MsgType_HTLC_VerifyR_N47
     * @param CloseHtlcTxInfo
     * @param callback function
     * */
    closeHtlcTx(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N47;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCloseHtlcTx(jsonData) { }
    /**
     * MsgType_HTLC_CloseSigned_N49
     * @param CloseHtlcTxInfoSigned
     * @param callback function
     */
    closeHtlcTxSigned(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CloseSigned_N49;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCloseHtlcTxSigned(jsonData) { }
    /* ***************** close htlc tx end*****************/
    /* ********************* query data *************************** */
    /**
     * MsgType_Core_Omni_GetTransaction_1206
     * @param txid string
     * @param callback function
     */
    getOmniTxByTxid(txid, callback) {
        if (txid == null || txid.length == 0) {
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
     * @param OmniSendIssuanceFixed
     * @param callback function
     */
    createNewTokenFixed(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_1201;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCreateNewTokenFixed(jsonData) { }
    /**
     * MsgType_Core_Omni_CreateNewTokenManaged_1202
     * @param OmniSendIssuanceManaged
     * @param callback function
     */
    createNewTokenManaged(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenManaged_1202;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onCreateNewTokenManaged(jsonData) { }
    /**
     * MsgType_Core_Omni_GrantNewUnitsOfManagedToken_1203
     * @param OmniSendGrant
     * @param callback function
     */
    omniSendGrant(info, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_GrantNewUnitsOfManagedToken_1203;
        msg.data = info;
        this.sendData(msg, callback);
    }
    onOmniSendGrant(jsonData) { }
    /**
     * MsgType_Core_Omni_RevokeUnitsOfManagedToken_1204
     * @param OmniSendRevoke
     * @param callback function
     */
    omniSendRevoke(info, callback) {
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_Getbalance_1200;
        msg.data["address"] = address;
        this.sendData(msg, callback);
    }
    onOmniGetAllBalancesForAddress(jsonData) { }
    /**
     * MsgType_Core_BalanceByAddress_1008
     * @param address string
     * @param callback function
     */
    getBtcBalanceByAddress(address, callback) {
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
        msg.type = this.messageType.MsgType_HTLC_CreatedRAndHInfoList_N4001;
        this.sendData(msg, callback);
    }
    onGetHtlcCreatedRandHInfoList(jsonData) { }
    /**
     * MsgType_HTLC_SignedRAndHInfoList_N4101
     * @param callback function
     */
    getHtlcSignedRandHInfoList(callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SignedRAndHInfoList_N4101;
        this.sendData(msg, callback);
    }
    onGetHtlcSignedRandHInfoList(jsonData) { }
    /**
     * MsgType_HTLC_GetRFromLCommitTx_N4103
     * @param channel_id string
     * @param callback function
     */
    getRFromCommitmentTx(channel_id, callback) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_GetRFromLCommitTx_N4103;
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_GetPathInfoByH_N4104;
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_GetRInfoByHOfOwner_N4105;
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
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_AllRDByChanId_N35108;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    onGetAllRDTx(jsonData) { }
}
