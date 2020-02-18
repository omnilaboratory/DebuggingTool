class ObdApi {

    private isConnectToOBD: boolean = false;
    private isLogin: boolean = false;

    private messageType  = new MessageType();

    private defaultAddress = "ws://127.0.0.1:60020/ws";
    private ws: WebSocket;


    public connectToServer(address: string) {
        if(this.isConnectToOBD){
            return;
        }

        if (address != null && address.length > 0) {
            this.defaultAddress = address;
        }
        try {
            this.ws = new WebSocket(this.defaultAddress);
            this.ws.onopen = () => {
                console.info("send ok");
                this.isConnectToOBD = true;
            }
            this.ws.onmessage = (e) => {
                let jsonData = JSON.parse(e.data);
                console.info("data from server", jsonData);
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
        }
        
    }

    private sendData(msg: Message) {
        if (this.isConnectToOBD == false) {
            alert("please try to connect obd again")
            return;
        }

        if (msg.type < 0 && this.isLogin == false) {
            alert("please login");
            return ;
        }

        console.info("send msg: ", msg);
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
    }

    /**
     * MsgType_UserLogin_1
     * params:
     * @param mnemonic:string
     */
    public login(mnemonic: string) {
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

        this.sendData(msg);
    }
    public onLogin(resultData: any) {
        this.isLogin = true;
    }

     /**
     * MsgType_UserLogout_2
     */
    public logout(){
        if(this.isLogin){
            let msg = new Message();
            msg.type = this.messageType.MsgType_UserLogout_2;
            this.sendData(msg);
        }
    }

    public onLogout(jsonData: any){
        this.isLogin = false;
    }


    /**
     * MsgType_GetMnemonic_101
     */
    public getMnemonic() {
        let msg = new Message();
        msg.type = this.messageType.MsgType_GetMnemonic_101
        this.sendData(msg)
    }
    public onGetMnemonic(jsonData: any) {

    }

    /**
     * MsgType_Core_GetNewAddress_1001
     */
    public getNewAddressFromOmniCore() {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_GetNewAddress_1001
        this.sendData(msg)
    }
    public onGetNewAddressFromOmniCore(jsonData: any) {

    }

    /**
     * MsgType_Core_FundingBTC_1009
     * @param  from_address:string = "";
     * @param  from_address_private_key:string= "";
     * @param  to_address: string ="";
     * @param  amount: number = 0.0;
     * @param  miner_fee: number = 0.00001
     */
    public fundingBTC(info: BtcFundingInfo) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_FundingBTC_1009;
        msg.data = info;
        this.sendData(msg)
    }
    public onFundingBTC(jsonData: any) {

    }

    /**
     * MsgType_Core_Omni_ListProperties_1205
     */
    public listProperties() {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_ListProperties_1205;
        this.sendData(msg)
    }
    public onListProperties(jsonData: any) {

    }

    /**
    * MsgType_Core_Omni_FundingAsset_2001
    * @param from_address:string = "";
    * @param from_address_private_key:string= "";
    * @param to_address:string = "";
    * @param property_id:number = 31;
    * @param amount:number = 0;
    * @param miner_fee:number = 0.0;
     */
    public fundingAssetOfOmni(info: OmniFundingAssetInfo) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Core_Omni_FundingAsset_2001;
        msg.data = info;
        this.sendData(msg)
    }
    public onFundingAssetOfOmni(jsonData: any) {

    }

    /**
     * MsgType_Mnemonic_CreateAddress_N200
     */
    public createAddressByMnemonic() {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_CreateAddress_N200;
        this.sendData(msg)
    }
    public onCreateAddressByMnemonic(jsonData: any) {

    }

    /**
     * MsgType_Mnemonic_GetAddressByIndex_201
     * @param index:number
     */
    public getAddressByIndexByMnemonic(index: number) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_201;
        msg.data = index;
        this.sendData(msg)
    }
    public onGetAddressByIndexByMnemonic(jsonData: any) {

    }

    /**
     * MsgType_ChannelOpen_N32
     * @param funding_pubkey 
     * @param recipient_peer_id 
     */
    public openChannel(funding_pubkey: string, recipient_peer_id: string) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelOpen_N32;
        msg.data["funding_pubkey"] = funding_pubkey;
        msg.recipient_peer_id = recipient_peer_id;
        this.sendData(msg)
    }
    public onOpenChannel(jsonData: any) {

    }

    /**
     * MsgType_ChannelAccept_N33
     * @param temporary_channel_id:string = "";
     * @param funding_pubkey:string = "";
     * @param approval:boolean = false;
     */
    public channelAccept(info: AcceptChannelInfo) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_ChannelAccept_N33;
        msg.data = info;
        this.sendData(msg)
    }
    public onChannelAccept(jsonData: any) {

    }

    /**
     * MsgType_FundingCreate_AssetFundingCreated_N34
     * @param temporary_channel_id:string =  "";
     * @param funding_tx_hex:string =  "";
     * @param temp_address_pub_key:string =  "";
     * @param temp_address_private_key:string =  "";
     * @param channel_address_private_key:string =  ""
     */
    public channelFundingCreated(info: ChannelFundingCreatedInfo) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingCreate_AssetFundingCreated_N34;
        msg.data = info;
        this.sendData(msg)
    }
    public onChannelFundingCreated(jsonData: any) {

    }

    /**
    * MsgType_FundingSign_AssetFundingSigned_N35
    * @param channel_id:string =  "";
    * @param fundee_channel_address_private_key:string =  "";
    * @param approval:boolean =  false;
    */
    public channelFundingSigned(info: ChannelFundingSignedInfo) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_FundingSign_AssetFundingSigned_N35;
        msg.data = info;
        this.sendData(msg)
    }
    public onChannelFundingSigned(jsonData: any) {

    }

    /**
     * MsgType_CommitmentTx_CommitmentTransactionCreated_N351
     * @param  channel_id: "";
     * @param  amount: 0;
     * @param  curr_temp_address_pub_key: "";
     * @param  curr_temp_address_private_key: "";
     * @param  channel_address_private_key: "";
     * @param  last_temp_address_private_key: "";
     */
    public commitmentTransactionCreated(info: CommitmentTx) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351;
        msg.data = info;
        this.sendData(msg)
    }
    public onCommitmentTransactionCreated(jsonData: any) {

    }

    /**
     * MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352
     * @param  channel_id: "";
     * @param  amount: 0;
     * @param  curr_temp_address_pub_key: "";
     * @param  curr_temp_address_private_key: "";
     * @param  channel_address_private_key: "";
     * @param  last_temp_address_private_key: "";
     */
    public revokeAndAcknowledgeCommitmentTransaction(info: CommitmentTxSigned) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352;
        msg.data = info;
        this.sendData(msg)
    }
    public onRevokeAndAcknowledgeCommitmentTransaction(jsonData: any) {

    }

    /**
    * MsgType_HTLC_Invoice_N4003
    * @param  channel_id: "";
    * @param  curr_temp_address_pub_key: "";
    * @param  curr_temp_address_private_key: "";
    * @param  last_temp_private_key: "";
    * @param  request_commitment_hash: "";
    * @param  channel_address_private_key: "";
    * @param  approval: false;
    */
    public htlcInvoice(info: HtlcHInfo) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_Invoice_N4003;
        msg.data = info;
        this.sendData(msg)
    }
    
    public onHtlcInvoice(jsonData: any) {

    }

    /**
     * MsgType_HTLC_AddHTLC_N40
     * @param  property_id: "";
     * @param  amount: 0;
     * @param  recipient_peer_id: "";
     */
    public addHtlc(info: HtlcHInfo) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLC_N40;
        msg.data = info;
        this.sendData(msg)
    }
    public onAddHtlc(jsonData: any) {

    }

    /**
     * MsgType_HTLC_AddHTLCSigned_N41
     * @param request_hash: "";
     * @param property_id: 0;
     * @param amount: 0;
     * @param h: "";
     * @param approval: false;
     */
    public addHtlcSigned(info: HtlcHSignInfo) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_AddHTLCSigned_N41;
        msg.data = info;
        this.sendData(msg)
    }
    public onAddHtlcSigned(jsonData: any) {

    }

    /**
     * MsgType_HTLC_FindPathAndSendH_N42
     * @param h:string
     */
    public htlcFindPathAndSendH(h: string) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_FindPathAndSendH_N42;
        msg.data["h"] = h;
        this.sendData(msg)
    }
    public onHtlcFindPathAndSendH(jsonData: any) {

    }

    /**
     * MsgType_HTLC_SendH_N43
     * @param h 
     * @param request_hash 
     */
    public htlcSendH(h: string, request_hash: string) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendH_N43;
        msg.data["h"] = h;
        msg.data["h_and_r_info_request_hash"] = request_hash;
        this.sendData(msg)
    }
    public onHtlcSendH(jsonData: any) {

    }

    /**
     * MsgType_HTLC_SignGetH_N44
     * @param request_hash: "";
     * @param approval: false;
     * @param channel_address_private_key: "";
     * @param last_temp_address_private_key: "";
     * @param curr_rsmc_temp_address_pub_key: "";
     * @param curr_rsmc_temp_address_private_key: "";
     * @param curr_htlc_temp_address_pub_key: "";
     * @param curr_htlc_temp_address_private_key: "";
     * @param curr_htlc_temp_address_he1b_ofh_pub_key: "";
     */
    public htlcSignGetH(info: SignGetHInfo) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SignGetH_N44;
        msg.data = info;
        this.sendData(msg)
    }
    public onHtlcSignGetH(jsonData: any) {

    }

    /**
     * MsgType_HTLC_CreateCommitmentTx_N45
     * @param request_hash: "";
     * @param channel_address_private_key: "";
     * @param last_temp_address_private_key: "";
     * @param curr_rsmc_temp_address_pub_key: "";
     * @param curr_rsmc_temp_address_private_key: "";
     * @param curr_htlc_temp_address_pub_key: "";
     * @param curr_htlc_temp_address_private_key: "";
     * @param curr_htlc_temp_address_for_ht1a_pub_key: "";
     * @param curr_htlc_temp_address_for_ht1a_private_key: "";
     * @param curr_htlc_temp_address_for_hed1a_ofh_pub_key: ""
     */
    public htlcCreateCommitmentTx(info: HtlcRequestOpen) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CreateCommitmentTx_N45;
        msg.data = info;
        this.sendData(msg)
    }
    public onHtlcCreateCommitmentTx(jsonData: any) {

    }

    /* ***************** backward R begin*****************/
    /**
     * MsgType_HTLC_SendR_N46
     * @param request_hash: "";
     * @param r: "";
     * @param channel_address_private_key: "";
     * @param curr_htlc_temp_address_he1b_ofh_private_key: "";
     * @param curr_htlc_temp_address_for_he1b_pub_key: "";
     * @param curr_htlc_temp_address_for_he1b_private_key: ""
     */
    public htlcSendR(info: HtlcSendRInfo) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_SendR_N46;
        msg.data = info;
        this.sendData(msg)
    }
    public onHtlcSendR(jsonData: any) {

    }

    /**
     * MsgType_HTLC_VerifyR_N47
     * @param request_hash: "";
     * @param r: "";
     * @param channel_address_private_key: "";
     * @param curr_htlc_temp_address_for_hed1a_ofh_private_key: ""
     */
    public htlcVerifyR(info: HtlcVerifyRInfo) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N47;
        msg.data = info;
        this.sendData(msg)
    }
    public onHtlcVerifyR(jsonData: any) {

    }
    /* ***************** backward R end*****************/

    /* ***************** close htlc tx begin*****************/
    /**
     * MsgType_HTLC_VerifyR_N47
     * @param channel_id: "";
     * @param channel_address_private_key: "";
     * @param last_rsmc_temp_address_private_key: "";
     * @param last_htlc_temp_address_private_key: "";
     * @param last_htlc_temp_address_for_htnx_private_key: "";
     * @param curr_rsmc_temp_address_pub_key: "";
     * @param curr_rsmc_temp_address_private_key: ""
     */
    public closeHtlcTx(info: CloseHtlcTxInfo) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_VerifyR_N47;
        msg.data = info;
        this.sendData(msg)
    }
    public onCloseHtlcTx(jsonData: any) {

    }

    /**
     * MsgType_HTLC_CloseSigned_N49
     * @param request_close_htlc_hash: "";
     * @param channel_address_private_key: "";
     * @param last_rsmc_temp_address_private_key: "";
     * @param last_htlc_temp_address_private_key: "";
     * @param last_htlc_temp_address_for_htnx_private_key: "";
     * @param curr_rsmc_temp_address_pub_key: "";
     * @param curr_rsmc_temp_address_private_key: ""
     */
    public closeHtlcTxSigned(info: CloseHtlcTxInfoSigned) {
        let msg = new Message();
        msg.type = this.messageType.MsgType_HTLC_CloseSigned_N49;
        msg.data = info;
        this.sendData(msg)
    }
    public onCloseHtlcTxSigned(jsonData: any) {

    }

    /* ***************** close htlc tx end*****************/
}
