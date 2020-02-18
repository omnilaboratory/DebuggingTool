class ObdApi {

    private isConnectToOBD: boolean = false;
    private isLogin: boolean = false;

    private messageType  = new MessageType();
    private defaultAddress = "ws://127.0.0.1:60020/ws";
    private ws: WebSocket;

    private callbackMap :Map<number,Function> = new Map<number,Function>();

    public connectToServer(address: string,callback:Function) {
        if(this.isConnectToOBD==true){
            console.info("already connect");
            return ;
        }

        if (address != null && address.length > 0) {
            this.defaultAddress = address;
        }

        console.info("connect to "+this.defaultAddress);
        try {
            this.ws = new WebSocket(this.defaultAddress);
            this.ws.onopen = () => {
                console.info("connect succss");
                if(callback!=null){
                    callback("connect succss");
                }
                this.isConnectToOBD = true;
            }
            this.ws.onmessage = (e) => {
                let jsonData = JSON.parse(e.data);
                console.info(jsonData);
                this.getDataFromServer(jsonData)
            }
            this.ws.onclose = (e) => {
                console.info("ws close", e);
                this.isConnectToOBD = false;
                this.isLogin = false;
            }
            this.ws.onerror = (e) => {
                console.info("ws error", e);
            }
        } catch (error) {
            console.info(error);
            alert("can not connect to server");
            return ;
        }
        
    }
    private sendData(msg: Message,callback:Function) {
        if (this.isConnectToOBD == false) {
            alert("please try to connect obd again")
            return;
        }

        if (msg.type < 0 && this.isLogin == false) {
            alert("please login");
            return ;
        }
        
        console.info("----------------------------send msg------------------------------");
        console.info(msg);
        if(callback!=null){
            this.callbackMap[msg.type]=callback;
        }
        this.ws.send(JSON.stringify(msg))
    }

    private getDataFromServer(jsonData: any) {

        if (jsonData.status == false) {
            if (jsonData.type != this.messageType.MsgType_Error_0) {
                alert(jsonData.result);
            }
            return;
        }

        let resultData = jsonData.result;
        console.info("----------------------------get msg from server--------------------");

        let callback = this.callbackMap[jsonData.type];
        if(callback!=null){
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
    }

    /**
     * MsgType_UserLogin_1
     * @param mnemonic:string
     */
    public login(mnemonic: string,callback:Function) {
        if(this.isLogin){
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_UserLogin_1;
        if (mnemonic != null && mnemonic.length > 0) {
            msg.data["mnemonic"] = mnemonic;
        } else {
            msg.data["mnemonic"] = "unfold tortoise zoo hand sausage project boring corn test same elevator mansion bargain coffee brick tilt forum purpose hundred embody weapon ripple when narrow";
        }

        if(callback!=null){
            this.callbackMap[msg.type]=callback;
        }

        this.sendData(msg,callback);
    }
    public onLogin(resultData: any) {
        this.isLogin = true;
    }

     /**
     * MsgType_UserLogout_2
     */
    public logout(callback:Function){
        if(this.isLogin){
            let msg = new Message();
            msg.type = this.messageType.MsgType_UserLogout_2;
            this.sendData(msg,callback);
        }
    }
    public onLogout(jsonData: any){
        this.isLogin = false;
    }


    /**
     * MsgType_GetMnemonic_101
     */
    public getMnemonic(callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_GetMnemonic_101
        this.sendData(msg,callback);
    }
    public onGetMnemonic(jsonData: any) {

    }

    /**
     * MsgType_Core_GetNewAddress_1001
     */
    public getNewAddressFromOmniCore(callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_GetNewAddress_1001
        this.sendData(msg,callback);
    }
    public onGetNewAddressFromOmniCore(jsonData: any) {

    }

    /**
     * MsgType_Core_FundingBTC_1009
     * @param BtcFundingInfo
     */
    public fundingBTC(info: BtcFundingInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_FundingBTC_1009;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onFundingBTC(jsonData: any) {

    }

    /**
     * MsgType_Core_Omni_ListProperties_1205
     */
    public listProperties(callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_ListProperties_1205;
        this.sendData(msg,callback);
    }
    public onListProperties(jsonData: any) {

    }

    /**
    * MsgType_Core_Omni_FundingAsset_2001
    * @param OmniFundingAssetInfo
     */
    public fundingAssetOfOmni(info: OmniFundingAssetInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_FundingAsset_2001;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onFundingAssetOfOmni(jsonData: any) {

    }

    /**
     * MsgType_Mnemonic_CreateAddress_N200
     */
    public createAddressByMnemonic(callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_CreateAddress_N200;
        this.sendData(msg,callback);
    }
    public onCreateAddressByMnemonic(jsonData: any) {

    }

    /**
     * MsgType_Mnemonic_GetAddressByIndex_201
     * @param index:number
     */
    public getAddressByIndexByMnemonic(index: number,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_201;
        msg.data = index;
        this.sendData(msg,callback);
    }
    public onGetAddressByIndexByMnemonic(jsonData: any) {

    }

    /**
     * MsgType_ChannelOpen_N32
     * @param funding_pubkey 
     * @param recipient_peer_id 
     */
    public openChannel(funding_pubkey: string, recipient_peer_id: string,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelOpen_N32;
        msg.data["funding_pubkey"] = funding_pubkey;
        msg.recipient_peer_id = recipient_peer_id;
        this.sendData(msg,callback);
    }
    public onOpenChannel(jsonData: any) {

    }

    /**
     * MsgType_ChannelAccept_N33
     * @param AcceptChannelInfo
     */
    public channelAccept(info: AcceptChannelInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelAccept_N33;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onChannelAccept(jsonData: any) {

    }

    /**
     * MsgType_FundingCreate_AssetFundingCreated_N34
     * @param ChannelFundingCreatedInfo
     */
    public channelFundingCreated(info: ChannelFundingCreatedInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingCreate_AssetFundingCreated_N34;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onChannelFundingCreated(jsonData: any) {

    }

    /**
    * MsgType_FundingSign_AssetFundingSigned_N35
    * @param ChannelFundingSignedInfo
    */
    public channelFundingSigned(info: ChannelFundingSignedInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingSign_AssetFundingSigned_N35;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onChannelFundingSigned(jsonData: any) {

    }

    /**
     * MsgType_CommitmentTx_CommitmentTransactionCreated_N351
     * @param CommitmentTx
     */
    public commitmentTransactionCreated(info: CommitmentTx,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onCommitmentTransactionCreated(jsonData: any) {

    }

    /**
     * MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352
     * @param CommitmentTxSigned
     */
    public revokeAndAcknowledgeCommitmentTransaction(info: CommitmentTxSigned,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onRevokeAndAcknowledgeCommitmentTransaction(jsonData: any) {

    }

    /**
    * MsgType_HTLC_Invoice_N4003
    * @param HtlcHInfo
    */
    public htlcInvoice(info: HtlcHInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_Invoice_N4003;
        msg.data = info;
        this.sendData(msg,callback);
    }
    
    public onHtlcInvoice(jsonData: any) {

    }

    /**
     * MsgType_HTLC_AddHTLC_N40
     * @param HtlcHInfo
     */
    public addHtlc(info: HtlcHInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLC_N40;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onAddHtlc(jsonData: any) {

    }

    /**
     * MsgType_HTLC_AddHTLCSigned_N41
     * @param HtlcHSignInfo
     */
    public addHtlcSigned(info: HtlcHSignInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLCSigned_N41;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onAddHtlcSigned(jsonData: any) {

    }

    /**
     * MsgType_HTLC_FindPathAndSendH_N42
     * @param h:string
     */
    public htlcFindPathAndSendH(h: string,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_FindPathAndSendH_N42;
        msg.data["h"] = h;
        this.sendData(msg,callback);
    }
    public onHtlcFindPathAndSendH(jsonData: any) {

    }

    /**
     * MsgType_HTLC_SendH_N43
     * @param h 
     * @param request_hash 
     */
    public htlcSendH(h: string, request_hash: string,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendH_N43;
        msg.data["h"] = h;
        msg.data["h_and_r_info_request_hash"] = request_hash;
        this.sendData(msg,callback);
    }
    public onHtlcSendH(jsonData: any) {

    }

    /**
     * MsgType_HTLC_SignGetH_N44
     * @param SignGetHInfo
     */
    public htlcSignGetH(info: SignGetHInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SignGetH_N44;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onHtlcSignGetH(jsonData: any) {

    }

    /**
     * MsgType_HTLC_CreateCommitmentTx_N45
     * @param HtlcRequestOpen
     */
    public htlcCreateCommitmentTx(info: HtlcRequestOpen,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CreateCommitmentTx_N45;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onHtlcCreateCommitmentTx(jsonData: any) {

    }

    /* ***************** backward R begin*****************/
    /**
     * MsgType_HTLC_SendR_N46
     * @param HtlcSendRInfo
     */
    public htlcSendR(info: HtlcSendRInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendR_N46;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onHtlcSendR(jsonData: any) {

    }

    /**
     * MsgType_HTLC_VerifyR_N47
     * @param HtlcVerifyRInfo
     */
    public htlcVerifyR(info: HtlcVerifyRInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N47;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onHtlcVerifyR(jsonData: any) {

    }
    /* ***************** backward R end*****************/

    /* ***************** close htlc tx begin*****************/
    /**
     * MsgType_HTLC_VerifyR_N47
     * @param CloseHtlcTxInfo
     */
    public closeHtlcTx(info: CloseHtlcTxInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N47;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onCloseHtlcTx(jsonData: any) {

    }

    /**
     * MsgType_HTLC_CloseSigned_N49
     * @param CloseHtlcTxInfoSigned
     */
    public closeHtlcTxSigned(info: CloseHtlcTxInfoSigned,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CloseSigned_N49;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onCloseHtlcTxSigned(jsonData: any) {

    }

    /* ***************** close htlc tx end*****************/


    /* ********************* query data *************************** */
    /**
     * MsgType_Core_Omni_GetTransaction_1206
     * @param txid
     */
    public getOmniTxByTxid(txid:string,callback:Function) {
        if(txid==null||txid.length==0){
            alert("empty txid");
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_GetTransaction_1206;
        msg.data["txid"] = txid;
        this.sendData(msg,callback);
    }
    public onGetOmniTxByTxid(jsonData: any) {

    }

    /**
     * MsgType_Core_Omni_CreateNewTokenFixed_1201
     * @param OmniPropertyInfo
     */
    public createNewProperty(info:OmniPropertyInfo,callback:Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_1201;
        msg.data = info;
        this.sendData(msg,callback);
    }
    public onCreateNewProperty(jsonData: any) {

    }
}