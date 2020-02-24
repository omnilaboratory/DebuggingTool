class ObdApi {
    private isConnectToOBD: boolean = false;
    private isLogin: boolean = false;

    private messageType = new MessageType();
    private defaultAddress = "ws://127.0.0.1:60020/ws";
    private ws: WebSocket;

    private globalCallback: Function;

    private callbackMap: Map<number, Function> = new Map<number, Function>();

    /**
     * connectToServer
     * @param address string
     * @param callback function
     */
    public connectToServer(address: string, callback: Function, globalCallback: Function) {
        if (this.isConnectToOBD == true) {
            console.info("already connect");
            if(callback){
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
            this.ws.onopen = () => {
                console.info("connect success");
                if (callback != null) {
                    callback("connect success");
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
            }

            this.ws.onerror = (e) => {
                console.info("ws error", e);
                alert("ws error");
            }
        } catch (error) {
            console.info(error);
            alert("can not connect to server");
            return;
        }
    }
    private sendData(msg: Message, callback: Function) {
        if (this.isConnectToOBD == false) {
            alert("please try to connect obd again");
            return;
        }

        if (msg.type < 0 && this.isLogin == false) {
            alert("please login");
            return;
        }

        console.info(new Date(),
            "----------------------------send msg------------------------------"
        );
        console.info(msg);
        if (callback != null) {
            this.callbackMap[msg.type] = callback;
        }
        this.ws.send(JSON.stringify(msg));
    }

    private getDataFromServer(jsonData: any) {
        if (jsonData.status == false) {
            if (jsonData.type != this.messageType.MsgType_Error_0) {
                alert(jsonData.result);
            }
            return;
        }

        let resultData = jsonData.result;
        if(this.globalCallback){
            this.globalCallback(resultData);
        }

        console.info(new Date(),
            "----------------------------get msg from server--------------------"
        );

        let callback = this.callbackMap[jsonData.type];
        if (callback != null) {
            this.callbackMap.delete(jsonData.type);
            if(jsonData.type==this.messageType.MsgType_UserLogin_1){
                resultData = jsonData.from+" "+jsonData.result;
                if(jsonData.from==jsonData.to){
                    callback(resultData);
                }
            }else{
                callback(resultData);
            }
            
        }

        switch (jsonData.type) {
            case this.messageType.MsgType_UserLogin_1:
                if(jsonData.from==jsonData.to){
                    this.onLogIn(resultData);
                }
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
    public logIn(mnemonic: string, callback: Function) {
        if (this.isLogin) {
            if(callback!=null){
                callback("already login")
            }
            return;
        }

        if(this.isNotString(mnemonic)){
            alert("empty mnemonic");
            return;
        }


        let msg = new Message();
        msg.type = this.messageType.MsgType_UserLogin_1;
        msg.data["mnemonic"] = mnemonic;
        this.sendData(msg, callback);
    }
    public onLogIn(resultData: any) {
        if (this.isLogin==false) {
            this.isLogin = true;
        }
    }

    /**
     * MsgType_UserLogout_2
     * @param callback function
     */
    public logout(callback: Function) {
        if (this.isLogin) {
            let msg = new Message();
            msg.type = this.messageType.MsgType_UserLogout_2;
            this.sendData(msg, callback);
        }else{
            alert("you have logout");
        }
    }
    public onLogout(jsonData: any) {
        this.isLogin = false;
    }

    /**
     * MsgType_GetMnemonic_101
     * @param callback function
     */
    public signUp(callback: Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_GetMnemonic_101;
        this.sendData(msg, callback);
    }
    public onSignUp(jsonData: any) { }

    /**
     * MsgType_Core_GetNewAddress_1001
     * @param callback function
     */
    public getNewAddress(callback: Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_GetNewAddress_1001;
        this.sendData(msg, callback);
    }
    public onGetNewAddressFromOmniCore(jsonData: any) { }

    /**
     * MsgType_Core_FundingBTC_1009
     * @param info BtcFundingInfo
     * @param callback function
     */
    public fundingBTC(info: BtcFundingInfo, callback: Function) {
        if(this.isNotString(info.from_address)){
            alert("empty from_address");
            return;
        }
        if(this.isNotString(info.from_address_private_key)){
            alert("empty from_address_private_key");
            return;
        }
        if(this.isNotString(info.to_address)){
            alert("empty to_address");
            return;
        }
        if(info.amount==null||info.amount<=0){
            alert("wrong amount");
            return;
        }
        if(info.miner_fee==null||info.miner_fee<=0){
            info.miner_fee = 0;
        }

        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_FundingBTC_1009;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onFundingBTC(jsonData: any) { }

    /**
     * MsgType_Core_Omni_ListProperties_1205
     * @param callback function
     */
    public listProperties(callback: Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_ListProperties_1205;
        this.sendData(msg, callback);
    }
    public onListProperties(jsonData: any) { }

    /**
     * MsgType_Core_Omni_FundingAsset_2001
     * @param info OmniFundingAssetInfo
     * @param callback function
     */
    public fundingAssetOfOmni(info: OmniFundingAssetInfo, callback: Function) {

        if(this.isNotString(info.from_address)){
            alert("empty from_address");
            return;
        }
        if(this.isNotString(info.from_address_private_key)){
            alert("empty from_address_private_key");
            return;
        }
        if(this.isNotString(info.to_address)){
            alert("empty to_address");
            return;
        }
        if(info.property_id==null||info.property_id<=0){
            alert("error property_id");
            return;
        }

        if(info.amount==null||info.amount<=0){
            alert("wrong amount");
            return;
        }
        if(info.miner_fee==null||info.miner_fee<=0){
            info.miner_fee = 0;
        }


        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_FundingAsset_2001;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onFundingAssetOfOmni(jsonData: any) { }

    /**
     * MsgType_Mnemonic_CreateAddress_N200
     * @param callback function
     */
    public getNewAddressWithMnemonic(callback: Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_CreateAddress_N200;
        this.sendData(msg, callback);
    }
    public onCreateAddressByMnemonic(jsonData: any) { }

    /**
     * MsgType_Mnemonic_GetAddressByIndex_201
     * @param index:number
     * @param callback function
     */
    public getAddressInfo(index: number, callback: Function) {
        if(index==null||index<0){
            alert("error index");
            return;
        }
        
        let msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_201;
        msg.data = index;
        this.sendData(msg, callback);
    }
    public onGetAddressInfo(jsonData: any) { }

    /**
     * MsgType_ChannelOpen_N32
     * @param funding_pubkey string
     * @param recipient_peer_id string
     * @param callback function
     */
    public openChannel(
        funding_pubkey: string,
        recipient_peer_id: string,
        callback: Function
    ) {

        if(this.isNotString(funding_pubkey)){
            alert("error funding_pubkey");
            return;
        }

        if(this.isNotString(recipient_peer_id)){
            alert("error recipient_peer_id");
            return;
        }

        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelOpen_N32;
        msg.data["funding_pubkey"] = funding_pubkey;
        msg.recipient_peer_id = recipient_peer_id;
        this.sendData(msg, callback);
    }
    public onOpenChannel(jsonData: any) { }

    /**
     * MsgType_ChannelAccept_N33
     * @param info AcceptChannelInfo
     * @param callback function
     */
    public channelAccept(info: AcceptChannelInfo, callback: Function) {

        if(this.isNotString(info.temporary_channel_id)){
            alert("empty temporary_channel_id");
            return;
        }
        if(this.isNotString(info.funding_pubkey)){
            alert("empty funding_pubkey");
            return;
        }
        if(info.approval==null){
            alert("empty approval");
            return;
        }


        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelAccept_N33;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onChannelAccept(jsonData: any) { }

    /**
     * MsgType_FundingCreate_AssetFundingCreated_N34
     * @param info ChannelFundingCreatedInfo
     * @param callback function
     */
    public channelFundingCreated(
        info: ChannelFundingCreatedInfo,
        callback: Function
    ) {
        if(this.isNotString(info.temporary_channel_id)){
            alert("empty temporary_channel_id");
            return;
        }
        if(this.isNotString(info.funding_tx_hex)){
            alert("empty funding_tx_hex");
            return;
        }
        if(this.isNotString(info.temp_address_pub_key)){
            alert("empty temp_address_pub_key");
            return;
        }
        if(this.isNotString(info.temp_address_private_key)){
            alert("empty temp_address_private_key");
            return;
        }
        if(this.isNotString(info.channel_address_private_key)){
            alert("empty channel_address_private_key");
            return;
        }

        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingCreate_AssetFundingCreated_N34;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onChannelFundingCreated(jsonData: any) { }

    /**
     * MsgType_FundingSign_AssetFundingSigned_N35
     * @param info ChannelFundingSignedInfo
     * @param callback function
     */
    public channelFundingSigned(
        info: ChannelFundingSignedInfo,
        callback: Function
    ) {

        if(this.isNotString(info.channel_id)){
            alert("empty channel_id");
            return;
        }
        if(this.isNotString(info.fundee_channel_address_private_key)){
            alert("empty fundee_channel_address_private_key");
            return;
        }
        if(info.approval==null){
            alert("empty approval");
            return;
        }

        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingSign_AssetFundingSigned_N35;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onChannelFundingSigned(jsonData: any) { }

    /**
     * MsgType_CommitmentTx_CommitmentTransactionCreated_N351
     * @param info CommitmentTx
     * @param callback function
     */
    public commitmentTransactionCreated(info: CommitmentTx, callback: Function) {
        if(this.isNotString(info.channel_id)){
            alert("empty channel_id");
            return;
        }
        if(this.isNotString(info.curr_temp_address_pub_key)){
            alert("empty curr_temp_address_pub_key");
            return;
        }
        if(this.isNotString(info.curr_temp_address_private_key)){
            alert("empty curr_temp_address_private_key");
            return;
        }
        if(this.isNotString(info.channel_address_private_key)){
            alert("empty channel_address_private_key");
            return;
        }
        if(this.isNotString(info.last_temp_address_private_key)){
            alert("empty last_temp_address_private_key");
            return;
        }
        if(info.amount==null||info.amount<=0){
            alert("wrong amount");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onCommitmentTransactionCreated(jsonData: any) { }

    /**
     * MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352
     * @param info CommitmentTxSigned
     * @param callback function
     */
    public revokeAndAcknowledgeCommitmentTransaction(
        info: CommitmentTxSigned,
        callback: Function
    ) {

        if(this.isNotString(info.channel_id)){
            alert("empty channel_id");
            return;
        }
        if(this.isNotString(info.curr_temp_address_pub_key)){
            alert("empty curr_temp_address_pub_key");
            return;
        }
        if(this.isNotString(info.curr_temp_address_private_key)){
            alert("empty curr_temp_address_private_key");
            return;
        }
        if(this.isNotString(info.last_temp_private_key)){
            alert("empty last_temp_private_key");
            return;
        }
        if(this.isNotString(info.request_commitment_hash)){
            alert("empty request_commitment_hash");
            return;
        }
        if(this.isNotString(info.channel_address_private_key)){
            alert("empty channel_address_private_key");
            return;
        }
        if(info.approval==null){
            alert("empty approval");
            return;
        }

        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onRevokeAndAcknowledgeCommitmentTransaction(jsonData: any) { }

    /**
     * MsgType_HTLC_Invoice_N4003
     * @param info HtlcHInfo 
     * @param callback function
     */
    public htlcInvoice(info: HtlcHInfo, callback: Function) {
        if(this.isNotString(info.recipient_peer_id)){
            alert("empty recipient_peer_id");
            return;
        }
        if(info.property_id==null||info.property_id<=0){
            alert("empty property_id");
            return;
        }
        if(info.amount==null||info.amount<=0){
            alert("wrong amount");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_Invoice_N4003;
        msg.data = info;
        this.sendData(msg, callback);
    }

    public onHtlcInvoice(jsonData: any) { }

    /**
     * MsgType_HTLC_AddHTLC_N40
     * @param info HtlcHInfo
     * @param callback function
     */
    public addHtlc(info: HtlcHInfo, callback: Function) {
        if(this.isNotString(info.recipient_peer_id)){
            alert("empty recipient_peer_id");
            return;
        }
        if(info.property_id==null||info.property_id<=0){
            alert("empty property_id");
            return;
        }
        if(info.amount==null||info.amount<=0){
            alert("wrong amount");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLC_N40;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onAddHtlc(jsonData: any) { }

    /**
     * MsgType_HTLC_AddHTLCSigned_N41
     * @param info HtlcHSignInfo
     * @param callback function
     */
    public addHtlcSigned(info: HtlcHSignInfo, callback: Function) {
        if(this.isNotString(info.request_hash)){
            alert("empty request_hash");
            return;
        }
        if(this.isNotString(info.h)){
            alert("empty h");
            return;
        }
        if(info.property_id==null||info.property_id<=0){
            alert("empty property_id");
            return;
        }
        if(info.amount==null||info.amount<=0){
            alert("wrong amount");
            return;
        }
        if(info.approval==null){
            alert("wrong approval");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLCSigned_N41;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onAddHtlcSigned(jsonData: any) { }

    /**
     * MsgType_HTLC_FindPathAndSendH_N42
     * @param h string
     * @param callback function
     */
    public htlcFindPathAndSendH(h: string, callback: Function) {
        if(this.isNotString(h)){
            alert("empty h");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_FindPathAndSendH_N42;
        msg.data["h"] = h;
        this.sendData(msg, callback);
    }
    public onHtlcFindPathAndSendH(jsonData: any) { }

    /**
     * MsgType_HTLC_SendH_N43
     * @param h string
     * @param request_hash string
     * @param callback function
     */
    public htlcSendH(h: string, request_hash: string, callback: Function) {
        if(this.isNotString(h)){
            alert("empty h");
            return;
        }
        if(this.isNotString(request_hash)){
            alert("empty request_hash");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendH_N43;
        msg.data["h"] = h;
        msg.data["h_and_r_info_request_hash"] = request_hash;
        this.sendData(msg, callback);
    }
    public onHtlcSendH(jsonData: any) { }

    /**
     * MsgType_HTLC_SignGetH_N44
     * @param info SignGetHInfo
     * @param callback function
     */
    public htlcSignGetH(info: SignGetHInfo, callback: Function) {
        if(this.isNotString(info.request_hash)){
            alert("empty request_hash");
            return;
        }
        if(this.isNotString(info.channel_address_private_key)){
            alert("empty channel_address_private_key");
            return;
        }
        if(this.isNotString(info.last_temp_address_private_key)){
            alert("empty last_temp_address_private_key");
            return;
        }
        if(this.isNotString(info.curr_rsmc_temp_address_pub_key)){
            alert("empty curr_rsmc_temp_address_pub_key");
            return;
        }
        if(this.isNotString(info.curr_rsmc_temp_address_private_key)){
            alert("empty curr_rsmc_temp_address_private_key");
            return;
        }
        if(this.isNotString(info.curr_htlc_temp_address_pub_key)){
            alert("empty curr_htlc_temp_address_pub_key");
            return;
        }
        if(this.isNotString(info.curr_htlc_temp_address_private_key)){
            alert("empty curr_htlc_temp_address_private_key");
            return;
        }
        if(this.isNotString(info.curr_htlc_temp_address_he1b_ofh_pub_key)){
            alert("empty curr_htlc_temp_address_he1b_ofh_pub_key");
            return;
        }
        if(info.approval==null){
            alert("empty approval");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SignGetH_N44;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onHtlcSignGetH(jsonData: any) { }

    /**
     * MsgType_HTLC_CreateCommitmentTx_N45
     * @param info HtlcRequestOpen
     * @param callback function
     */
    public htlcCreateCommitmentTx(info: HtlcRequestOpen, callback: Function) {

        if(this.isNotString(info.request_hash)){
            alert("empty request_hash");
            return;
        }
        if(this.isNotString(info.channel_address_private_key)){
            alert("empty channel_address_private_key");
            return;
        }
        if(this.isNotString(info.last_temp_address_private_key)){
            alert("empty last_temp_address_private_key");
            return;
        }
        if(this.isNotString(info.curr_rsmc_temp_address_pub_key)){
            alert("empty curr_rsmc_temp_address_pub_key");
            return;
        }
        if(this.isNotString(info.curr_rsmc_temp_address_private_key)){
            alert("empty curr_rsmc_temp_address_private_key");
            return;
        }
        if(this.isNotString(info.curr_htlc_temp_address_pub_key)){
            alert("empty curr_htlc_temp_address_pub_key");
            return;
        }
        if(this.isNotString(info.curr_htlc_temp_address_private_key)){
            alert("empty curr_htlc_temp_address_private_key");
            return;
        }
        if(this.isNotString(info.curr_htlc_temp_address_for_ht1a_pub_key)){
            alert("empty curr_htlc_temp_address_for_ht1a_pub_key");
            return;
        }
        if(this.isNotString(info.curr_htlc_temp_address_for_ht1a_private_key)){
            alert("empty curr_htlc_temp_address_for_ht1a_private_key");
            return;
        }
        if(this.isNotString(info.curr_htlc_temp_address_for_hed1a_ofh_pub_key)){
            alert("empty curr_htlc_temp_address_for_hed1a_ofh_pub_key");
            return;
        }


        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CreateCommitmentTx_N45;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onHtlcCreateCommitmentTx(jsonData: any) { }

    /* ***************** backward R begin*****************/
    /**
     * MsgType_HTLC_SendR_N46
     * @param info HtlcSendRInfo
     * @param callback function
     */
    public htlcSendR(info: HtlcSendRInfo, callback: Function) {
        if(this.isNotString(info.request_hash)){
            alert("empty request_hash");
            return;
        }
        if(this.isNotString(info.r)){
            alert("empty r");
            return;
        }
        if(this.isNotString(info.channel_address_private_key)){
            alert("empty channel_address_private_keycurr_htlc_temp_address_he1b_ofh_private_key");
            return;
        }
        if(this.isNotString(info.curr_htlc_temp_address_he1b_ofh_private_key)){
            alert("empty curr_htlc_temp_address_he1b_ofh_private_key");
            return;
        }
        if(this.isNotString(info.curr_htlc_temp_address_for_he1b_pub_key)){
            alert("empty curr_htlc_temp_address_for_he1b_pub_key");
            return;
        }
        if(this.isNotString(info.curr_htlc_temp_address_for_he1b_private_key)){
            alert("empty curr_htlc_temp_address_for_he1b_private_key");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendR_N46;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onHtlcSendR(jsonData: any) { }

    /**
     * MsgType_HTLC_VerifyR_N47
     * @param info HtlcVerifyRInfo
     * @param callback function
     */
    public htlcVerifyR(info: HtlcVerifyRInfo, callback: Function) {
        if(this.isNotString(info.request_hash)){
            alert("empty request_hash");
            return;
        }
        if(this.isNotString(info.r)){
            alert("empty r");
            return;
        }
        if(this.isNotString(info.channel_address_private_key)){
            alert("empty channel_address_private_key");
            return;
        }
        if(this.isNotString(info.curr_htlc_temp_address_for_hed1a_ofh_private_key)){
            alert("empty curr_htlc_temp_address_for_hed1a_ofh_private_key");
            return;
        }

        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N47;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onHtlcVerifyR(jsonData: any) { }
    /* ***************** backward R end*****************/

    /* ***************** close htlc tx begin*****************/
    /**
     * MsgType_HTLC_VerifyR_N47
     * @param info CloseHtlcTxInfo
     * @param callback function
     * */
    public closeHtlcTx(info: CloseHtlcTxInfo, callback: Function) {

        if(this.isNotString(info.channel_id)){
            alert("empty channel_id");
            return;
        }
        if(this.isNotString(info.channel_address_private_key)){
            alert("empty channel_address_private_key");
            return;
        }
        if(this.isNotString(info.last_rsmc_temp_address_private_key)){
            alert("empty last_rsmc_temp_address_private_key");
            return;
        }
        if(this.isNotString(info.last_htlc_temp_address_private_key)){
            alert("empty last_htlc_temp_address_private_key");
            return;
        }
        if(this.isNotString(info.curr_rsmc_temp_address_pub_key)){
            alert("empty curr_rsmc_temp_address_pub_key");
            return;
        }
        if(this.isNotString(info.curr_rsmc_temp_address_private_key)){
            alert("empty curr_rsmc_temp_address_private_key");
            return;
        }

        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N47;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onCloseHtlcTx(jsonData: any) { }

    /**
     * MsgType_HTLC_CloseSigned_N49
     * @param info CloseHtlcTxInfoSigned
     * @param callback function
     */
    public closeHtlcTxSigned(info: CloseHtlcTxInfoSigned, callback: Function) {
        if(this.isNotString(info.request_close_htlc_hash)){
            alert("empty request_close_htlc_hash");
            return;
        }
        if(this.isNotString(info.channel_address_private_key)){
            alert("empty channel_address_private_key");
            return;
        }
        if(this.isNotString(info.last_rsmc_temp_address_private_key)){
            alert("empty last_rsmc_temp_address_private_key");
            return;
        }
        if(this.isNotString(info.last_htlc_temp_address_private_key)){
            alert("empty last_htlc_temp_address_private_key");
            return;
        }
        if(this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)){
            alert("empty last_htlc_temp_address_for_htnx_private_key");
            return;
        }
        if(this.isNotString(info.curr_rsmc_temp_address_pub_key)){
            alert("empty curr_rsmc_temp_address_pub_key");
            return;
        }
        if(this.isNotString(info.curr_rsmc_temp_address_private_key)){
            alert("empty curr_rsmc_temp_address_private_key");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CloseSigned_N49;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onCloseHtlcTxSigned(jsonData: any) { }

    /* ***************** close htlc tx end*****************/

    /* ********************* query data *************************** */
    /**
     * MsgType_Core_Omni_GetTransaction_1206
     * @param txid string
     * @param callback function
     */
    public getOmniTxByTxid(txid: string, callback: Function) {
        if (this.isNotString(txid)) {
            alert("empty txid");
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_GetTransaction_1206;
        msg.data["txid"] = txid;
        this.sendData(msg, callback);
    }
    public onGetOmniTxByTxid(jsonData: any) { }

    /**
     * MsgType_Core_Omni_CreateNewTokenFixed_1201
     * @param info OmniSendIssuanceFixed
     * @param callback function
     */
    public createNewTokenFixed(info: OmniSendIssuanceFixed, callback: Function) {
        if(this.isNotString(info.from_address)){
            alert("empty from_address");
            return;
        }
        if(this.isNotString(info.name)){
            alert("empty name");
            return;
        }
        if(info.ecosystem==null){
            alert("empty ecosystem");
            return;
        }
        if(info.divisible_type==null){
            alert("empty divisible_type");
            return;
        }
        if(info.amount==null||info.amount<=1){
            alert("wrong amount");
            return;
        }
        if(this.isNotString(info.data)){
            info.data = "";
        }

        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_1201;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onCreateNewTokenFixed(jsonData: any) { }

    /**
     * MsgType_Core_Omni_CreateNewTokenManaged_1202
     * @param info OmniSendIssuanceManaged
     * @param callback function
     */
    public createNewTokenManaged(
        info: OmniSendIssuanceManaged,
        callback: Function
    ) {

        if(this.isNotString(info.from_address)){
            alert("empty from_address");
            return;
        }
        if(this.isNotString(info.name)){
            alert("empty name");
            return;
        }
        if(info.ecosystem==null){
            alert("empty ecosystem");
            return;
        }
        if(info.divisible_type==null){
            alert("empty divisible_type");
            return;
        }
        if(this.isNotString(info.data)){
            info.data = "";
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenManaged_1202;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onCreateNewTokenManaged(jsonData: any) { }
    /**
     * MsgType_Core_Omni_GrantNewUnitsOfManagedToken_1203
     * @param info OmniSendGrant
     * @param callback function
     */
    public omniSendGrant(info: OmniSendGrant, callback: Function) {

        if(this.isNotString(info.from_address)){
            alert("empty from_address");
            return;
        }
        if(info.property_id==null||info.property_id<1){
            alert("empty property_id");
            return;
        }
        if(info.amount==null||info.amount<=1){
            alert("wrong amount");
            return;
        }
        if(this.isNotString(info.memo)){
            info.memo = "";
        }

        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_GrantNewUnitsOfManagedToken_1203;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onOmniSendGrant(jsonData: any) { }
    /**
     * MsgType_Core_Omni_RevokeUnitsOfManagedToken_1204
     * @param info OmniSendRevoke
     * @param callback function
     */
    public omniSendRevoke(info: OmniSendRevoke, callback: Function) {
        if(this.isNotString(info.from_address)){
            alert("empty from_address");
            return;
        }
        if(info.property_id==null||info.property_id<1){
            alert("empty property_id");
            return;
        }
        if(info.amount==null||info.amount<=1){
            alert("wrong amount");
            return;
        }
        if(this.isNotString(info.memo)){
            info.memo = "";
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_RevokeUnitsOfManagedToken_1204;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onOmniSendRevoke(jsonData: any) { }

    /**
     * MsgType_Core_Omni_Getbalance_1200
     * @param address string
     * @param callback function
     */
    public omniGetAllBalancesForAddress(address: string, callback: Function) {
        if(this.isNotString(address)){
            alert("empty address");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_Getbalance_1200;
        msg.data["address"] = address;
        this.sendData(msg, callback);
    }
    public onOmniGetAllBalancesForAddress(jsonData: any) { }

    /**
     * MsgType_Core_BalanceByAddress_1008
     * @param address string
     * @param callback function
     */
    public getBtcBalanceByAddress(address: string, callback: Function) {
        if(this.isNotString(address)){
            alert("empty address");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_BalanceByAddress_1008;
        msg.data["address"] = address;
        this.sendData(msg, callback);
    }
    public onGetBtcBalanceByAddress(jsonData: any) { }

    /**
     * MsgType_Core_Btc_ImportPrivKey_1011
     * @param privkey string
     * @param callback function
     */
    public importPrivKey(privkey: string, callback: Function) {
        if(this.isNotString(privkey)){
            alert("empty privkey");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Btc_ImportPrivKey_1011;
        msg.data["privkey"] = privkey;
        this.sendData(msg, callback);
    }
    public onImportPrivKey(jsonData: any) { }

    /**
     * MsgType_HTLC_CreatedRAndHInfoList_N4001
     * @param callback function
     */
    public getHtlcCreatedRandHInfoList(callback: Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CreatedRAndHInfoList_N4001;
        this.sendData(msg, callback);
    }
    public onGetHtlcCreatedRandHInfoList(jsonData: any) { }

    /**
     * MsgType_HTLC_SignedRAndHInfoList_N4101
     * @param callback function
     */
    public getHtlcSignedRandHInfoList(callback: Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SignedRAndHInfoList_N4101;
        this.sendData(msg, callback);
    }
    public onGetHtlcSignedRandHInfoList(jsonData: any) { }

    /**
     * MsgType_HTLC_GetRFromLCommitTx_N4103
     * @param channel_id string 
     * @param callback function
     */
    public getRFromCommitmentTx(channel_id: string, callback: Function) {
        if(this.isNotString(channel_id)){
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_GetRFromLCommitTx_N4103;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    public onGetRFromCommitmentTx(jsonData: any) { }

    /**
     * MsgType_HTLC_GetPathInfoByH_N4104
     * @param h string
     * @param callback function
     */
    public getPathInfoByH(h: string, callback: Function) {
        if(this.isNotString(h)){
            alert("empty h");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_GetPathInfoByH_N4104;
        msg.data = h;
        this.sendData(msg, callback);
    }
    public onGetPathInfoByH(jsonData: any) { }
    /**
     * MsgType_HTLC_GetRInfoByHOfOwner_N4105
     * @param h string
     * @param callback function
     */
    public getRByHOfReceiver(h: string, callback: Function) {
        if(this.isNotString(h)){
            alert("empty h");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_GetRInfoByHOfOwner_N4105;
        msg.data = h;
        this.sendData(msg, callback);
    }
    public onGetRByHOfReceiver(jsonData: any) { }

    /**
     * MsgType_CommitmentTx_LatestCommitmentTxByChanId_N35104
     * @param channel_id string 
     * @param callback function
     */
    public getLatestCommitmentTxByChannelId(
        channel_id: string,
        callback: Function
    ) {
        if(this.isNotString(channel_id)){
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_N35104;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    public onGetLatestCommitmentTxByChannelId(jsonData: any) { }

    /**
     * MsgType_CommitmentTx_ItemsByChanId_N35101
     * @param channel_id string 
     * @param callback function
     */
    public getItemsByChannelId(channel_id: string, callback: Function) {
        if(this.isNotString(channel_id)){
            alert("empty channel_id");
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_N35101;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    public onGetItemsByChannelId(jsonData: any) { }

    /**
     * MsgType_ChannelOpen_AllItem_N3202
     * @param callback function
     */
    public getAllChannels(callback: Function) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelOpen_AllItem_N3202;
        this.sendData(msg, callback);
    }
    public onGetAllChannels(jsonData: any) { }

    /**
     * MsgType_GetChannelInfoByChanId_N3207
     * @param id number
     * @param callback function
     */
    public getChannelById(id:number, callback: Function) {
        if(id==null||id<=0){
            alert('error id');
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_GetChannelInfoByChanId_N3207;
        msg.data = id;
        this.sendData(msg, callback);
    }
    public onGetChannelById(jsonData: any) { }

    /**
     * MsgType_CommitmentTx_AllBRByChanId_N35109
     * @param channel_id string  
     * @param callback function
     */
    public getAllBRTx(channel_id:string, callback: Function) {
        if(this.isNotString(channel_id)){
            alert('empty channel_id');
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_AllBRByChanId_N35109;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    public onGetAllBrTx(jsonData: any) { }

    /**
     * MsgType_CommitmentTx_ItemsByChanId_N35101
     * @param channel_id string  
     * @param callback function
     */
    public getAllCommitmentTx(channel_id:string, callback: Function) {
        if(this.isNotString(channel_id)){
            alert('empty channel_id');
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_N35101;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    public onGetAllCommitmentTx(jsonData: any) { }

    /**
     * MsgType_CommitmentTx_LatestRDByChanId_N35105
     * @param channel_id string  
     * @param callback function
     */
    public getLatestCommitmentTx(channel_id:string, callback: Function) {
        if(this.isNotString(channel_id)){
            alert('empty channel_id');
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestRDByChanId_N35105;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    public onGetLatestCommitmentTx(jsonData: any) { }

    /**
     * MsgType_CommitmentTx_LatestBRByChanId_N35106
     * @param channel_id string  
     * @param callback function
     */
    public getLatestBRTx(channel_id:string, callback: Function) {
        if(this.isNotString(channel_id)){
            alert('empty channel_id');
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestBRByChanId_N35106;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    public onGetLatestBRTx(jsonData: any) { }

    /**
     * MsgType_CommitmentTx_AllRDByChanId_N35108
     * @param channel_id string 
     * @param callback function
     */
    public getAllRDTx(channel_id:string, callback: Function) {
        if(this.isNotString(channel_id)){
            alert('empty channel_id');
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_AllRDByChanId_N35108;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    public onGetAllRDTx(jsonData: any) { }

    /**
     * MsgType_SendBreachRemedyTransaction_N35107
     * @param channel_id string 
     * @param callback function
     */
    public sendBreachRemedyTransaction(channel_id:string, callback: Function) {
        if(this.isNotString(channel_id)){
            alert('empty channel_id');
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_SendBreachRemedyTransaction_N35107;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    public onSendBreachRemedyTransaction(jsonData: any) { }

    /**
     * MsgType_CloseChannelRequest_N38
     * @param channel_id string 
     * @param callback function
     */
    public closeChannel(channel_id:string, callback: Function) {
        if(this.isNotString(channel_id)){
            alert('empty channel_id');
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CloseChannelRequest_N38;
        msg.data["channel_id"] = channel_id;
        this.sendData(msg, callback);
    }
    public onCloseChannel(jsonData: any) { }

    /**
     * MsgType_CloseChannelSign_N39
     * @param info CloseChannelSign 
     * @param callback function
     */
    public closeChannelSign(info:CloseChannelSign, callback: Function) {
        if(this.isNotString(info.channel_id)){
            alert('empty channel_id');
            return;
        }
        if(this.isNotString(info.request_close_channel_hash)){
            alert('empty request_close_channel_hash');
            return;
        }
        if(info.approval==null){
            alert('empty approval');
            return;
        }
        let msg = new Message();
        msg.type = this.messageType.MsgType_CloseChannelSign_N39;
        msg.data = info;
        this.sendData(msg, callback);
    }
    public onCloseChannelSign(jsonData: any) { }


    private isString(str:String):boolean{
        if(str==null){
            return false;
        }
        if(str.trim().length==0){
            return false;
        }
        return true;
    }
    private isNotString(str:String):boolean{
        if(str==null){
            return true;
        }
        if(str.trim().length==0){
            return true;
        }
        return false;
    }
}
