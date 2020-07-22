class ObdApi {
  private isConnectToOBD: boolean = false;
  private isLogin: boolean = false;

  private messageType = new MessageType();
  private defaultAddress = "ws://127.0.0.1:60020/ws";
  private ws: WebSocket;

  private globalCallback: Function;

  private callbackMap: Map<number, Function> = new Map<number, Function>();


  /**
   * register event
   * @param msgType
   * @param callback
   */
  public registerEvent(msgType: number, callback: Function) {
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
  public removeEvent(msgType: number) {
    this.callbackMap.delete(msgType);
    console.info("----------> removeEvent");
  }

  /**
   * Send custom request
   * @param msg
   * @param type
   * @param callback
   */
  public sendJsonData(msg: string, type: number, callback: Function) {
    if (this.isConnectToOBD == false) {
      alert("please try to connect obd again");
      return;
    }

    if (this.isNotString(msg)) {
      alert("error request content.");
      return;
    }

    console.info(
      new Date(),
      "------send json msg------"
    );
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
  public connectToServer(
    address: string,
    callback: Function,
    globalCallback: Function
  ) {
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

    if (((msg.type <= -100000 && msg.type >= -102000) ||
         (msg.type <= -103000 && msg.type >= -104000)) && this.isLogin == false) {
      alert("please login");
      return;
    }

    console.info(
      new Date(),
      "----------------------------send msg------------------------------"
    );
    console.info(msg);
    if (callback != null) {
      this.callbackMap[msg.type] = callback;
    }
    this.ws.send(JSON.stringify(msg));
  }

  private getDataFromServer(jsonData: any) {
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
      let tempData: any = new Object();
      tempData.type = jsonData.type;
      tempData.result = jsonData.data;
      tempData.sender_peer_id = jsonData.sender_peer_id;
      tempData.recipient_user_peer_id = jsonData.recipient_user_peer_id;
      jsonData = tempData;
    }
    


    console.info(
      new Date(),
      "----------------------------get msg from server--------------------"
    );

    let fromId: string = jsonData.from;
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
      case this.messageType.MsgType_UserLogin_2001:
        this.userPeerId = toId
        this.onLogIn(resultData);
        break;
      case this.messageType.MsgType_UserLogout_2002:
        this.onLogout(resultData);
        break;
      // case this.messageType.MsgType_Core_GetNewAddress_2101:
      //   this.onGetNewAddressFromOmniCore(resultData);
      //   break;
      case this.messageType.MsgType_Core_FundingBTC_2109:
        this.onFundingBTC(resultData);
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
        this.onRevokeAndAcknowledgeCommitmentTransaction(resultData);
        break;
      case this.messageType.MsgType_HTLC_Invoice_402:
        this.onAddInvoice(resultData);
        break;
      case this.messageType.MsgType_HTLC_FindPath_401:
        this.onPayInvoice(resultData);
        break;
      case this.messageType.MsgType_HTLC_SendAddHTLC_40:
        this.onHtlcCreated(resultData);
        break;
      case this.messageType.MsgType_HTLC_SendAddHTLCSigned_41:
        this.onHtlcSigned(resultData);
        break;
      case this.messageType.MsgType_HTLC_SendVerifyR_45:
        this.onHtlcSendVerifyR(resultData);
        break;
      case this.messageType.MsgType_HTLC_SendSignVerifyR_46:
        this.onHtlcSendSignVerifyR(resultData);
        break;
      case this.messageType.MsgType_HTLC_SendRequestCloseCurrTx_49:
        this.onCloseHTLC(resultData);
        break;
      case this.messageType.MsgType_HTLC_SendCloseSigned_50:
        this.onCloseHTLCSigned(resultData);
        break;

      case this.messageType.MsgType_Core_Omni_GetTransaction_2118:
        this.onGetOmniTxByTxid(resultData);
        break;
      case this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_2113:
        this.onCreateNewTokenFixed(resultData);
        break;
    }
  }

  /**
   * MsgType_UserLogin_2001
   * @param mnemonic string
   * @param callback function
   */
  public logIn(mnemonic: string, callback: Function) {
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

  private userPeerId:string
  public onLogIn(resultData: any) {
    if (this.isLogin == false) {
      this.isLogin = true;
    }
  }

  /**
   * MsgType_UserLogout_2002
   * @param callback function
   */
  public logout(callback: Function) {
    if (this.isLogin) {
      let msg = new Message();
      msg.type = this.messageType.MsgType_UserLogout_2002;
      this.sendData(msg, callback);
    } else {
      alert("you have logout");
    }
  }
  public onLogout(jsonData: any) {
    this.isLogin = false;
  }

  /**
   * MsgType_p2p_ConnectPeer_2003
   * @param info P2PPeer
   * @param callback function
   */
  public connectPeer(info: P2PPeer, callback: Function) {

    if (this.isNotString(info.remote_node_address)) {
      alert("empty remote_node_address");
      return;
    }

    let msg  = new Message();
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
  public fundingBTC(info: BtcFundingInfo, callback: Function) {
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
    msg.type = this.messageType.MsgType_Core_FundingBTC_2109;
    msg.data = info;
    this.sendData(msg, callback);
  }
  public onFundingBTC(jsonData: any) {}

  /**
   * MsgType_FundingCreate_SendBtcFundingCreated_340
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  FundingBtcCreated
   * @param callback  Function
   */
  public btcFundingCreated(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: FundingBtcCreated,
    callback: Function
  ) {
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
    msg.type = this.messageType.MsgType_FundingCreate_SendBtcFundingCreated_340;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_FundingSign_SendBtcSign_350
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info FundingBtcSigned
   * @param callback  Function
   */
  public btcFundingSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: FundingBtcSigned,
    callback: Function
  ) {
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
  public listProperties(callback: Function) {
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_ListProperties_2117;
    this.sendData(msg, callback);
  }
  public onListProperties(jsonData: any) {}

  /**
   * MsgType_Core_Omni_FundingAsset_2120
   * @param info OmniFundingAssetInfo
   * @param callback function
   */
  public fundingAsset(info: OmniFundingAssetInfo, callback: Function) {
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
    msg.type = this.messageType.MsgType_Core_Omni_FundingAsset_2120;
    msg.data = info;
    this.sendData(msg, callback);
  }
  public onFundingAsset(jsonData: any) {}

  /**
   * MsgType_Mnemonic_CreateAddress_3000
   * @param callback function
   */
  public genAddressFromMnemonic(callback: Function) {
    let msg = new Message();
    msg.type = this.messageType.MsgType_Mnemonic_CreateAddress_3000;
    this.sendData(msg, callback);
  }
  public onGenAddressFromMnemonic(jsonData: any) {}

  /**
   * MsgType_Mnemonic_GetAddressByIndex_3001
   * @param index:number
   * @param callback function
   */
  public getAddressInfo(index: number, callback: Function) {
    if (index == null || index < 0) {
      alert("error index");
      return;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_3001;
    msg.data = index;
    this.sendData(msg, callback);
  }
  public onGetAddressInfo(jsonData: any) {}

  /**
   * MsgType_SendChannelOpen_32
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param funding_pubkey string
   * @param callback function
   */
  public openChannel(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    funding_pubkey: string,
    callback: Function
  ) {
    
    if (this.isNotString(recipient_node_peer_id)) {
      alert("error recipient_node_peer_id");
      return;
    }

    if (this.isNotString(recipient_user_peer_id)) {
      alert("error recipient_user_peer_id");
      return;
    }

    if (this.isNotString(funding_pubkey)) {
      alert("error funding_pubkey");
      return;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_SendChannelOpen_32;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.data["funding_pubkey"] = funding_pubkey;
    this.sendData(msg, callback);
  }
  public onOpenChannel(jsonData: any) {}

  /**
   * MsgType_SendChannelAccept_33
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AcceptChannelInfo
   * @param callback function
   */
  public acceptChannel(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AcceptChannelInfo,
    callback: Function
  ) {

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
  public onAcceptChannel(jsonData: any) {}

  /**
   * MsgType_FundingCreate_SendAssetFundingCreated_34
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AssetFundingCreatedInfo
   * @param callback function
   */
  public assetFundingCreated(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AssetFundingCreatedInfo,
    callback: Function
  ) {
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
    msg.type = this.messageType.MsgType_FundingCreate_SendAssetFundingCreated_34;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }
  public onAssetFundingCreated(jsonData: any) {}

  /**
   * MsgType_FundingSign_SendAssetFundingSigned_35
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AssetFundingSignedInfo
   * @param callback function
   */
  public assetFundingSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AssetFundingSignedInfo,
    callback: Function
  ) {
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
    // if (info.approval == null) {
    //   info.approval = false;
    // }
    // if (info.approval == true) {
    //   if (this.isNotString(info.fundee_channel_address_private_key)) {
    //     alert("empty fundee_channel_address_private_key");
    //     return;
    //   }
    // }

    let msg = new Message();
    msg.type = this.messageType.MsgType_FundingSign_SendAssetFundingSigned_35;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }
  public onAssetFundingSigned(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_SendCommitmentTransactionCreated_351
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info CommitmentTx
   * @param callback function
   */
  public commitmentTransactionCreated(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CommitmentTx,
    callback: Function
  ) {
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
    msg.type = this.messageType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }
  public onCommitmentTransactionCreated(jsonData: any) {}

  /**
   * MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info CommitmentTxSigned
   * @param callback function
   */
  public revokeAndAcknowledgeCommitmentTransaction(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CommitmentTxSigned,
    callback: Function
  ) {
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
    msg.type = this.messageType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }
  public onRevokeAndAcknowledgeCommitmentTransaction(jsonData: any) {}

  /**
   * MsgType_HTLC_Invoice_402
   * @param info InvoiceInfo
   * @param callback function
   */
  public addInvoice(info: InvoiceInfo, callback: Function) {

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

  public onAddInvoice(jsonData: any) {}

  /**
   * MsgType_HTLC_FindPath_401
   * @param info PayInvoiceInfo
   * @param callback function
   */
  public payInvoice(info: PayInvoiceInfo, callback: Function) {
    if (this.isNotString(info.invoice)) {
      alert("empty invoice");
      return;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_FindPath_401;
    msg.data = info;
    this.sendData(msg, callback);
  }
  public onPayInvoice(jsonData: any) {}

  /**
   * MsgType_HTLC_SendAddHTLC_40
   * @param recipient_node_peer_id string 
   * @param recipient_user_peer_id string 
   * @param info HtlcCreatedInfo
   * @param callback function
   */
  public htlcCreated(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: HtlcCreatedInfo, 
    callback: Function) {

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
  public onHtlcCreated(jsonData: any) {}

  /**
   * MsgType_HTLC_SendAddHTLCSigned_41
   * @param recipient_node_peer_id string 
   * @param recipient_user_peer_id string 
   * @param info HtlcSignedInfo
   * @param callback function
   */
  public htlcSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: HtlcSignedInfo, 
    callback: Function) {

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

    // if (info.approval == null) {
    //   info.approval = false;
    // }

    // if (info.approval == true) {
    //   if (this.isNotString(info.channel_address_private_key)) {
    //     alert("empty channel_address_private_key");
    //     return;
    //   }
    //   if (this.isNotString(info.last_temp_address_private_key)) {
    //     alert("empty last_temp_address_private_key");
    //     return;
    //   }
    //   if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
    //     alert("empty curr_rsmc_temp_address_pub_key");
    //     return;
    //   }
    //   if (this.isNotString(info.curr_rsmc_temp_address_private_key)) {
    //     alert("empty curr_rsmc_temp_address_private_key");
    //     return;
    //   }
    //   if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
    //     alert("empty curr_htlc_temp_address_pub_key");
    //     return;
    //   }
    //   if (this.isNotString(info.curr_htlc_temp_address_private_key)) {
    //     alert("empty curr_htlc_temp_address_private_key");
    //     return;
    //   }
    // }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendAddHTLCSigned_41;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    this.sendData(msg, callback);
  }
  public onHtlcSigned(jsonData: any) {}

  /* ***************** backward R begin*****************/
  /**
   * MsgType_HTLC_SendVerifyR_45
   * @param recipient_node_peer_id string 
   * @param recipient_user_peer_id string 
   * @param info htlcSendVerifyR
   * @param callback function
   */
  public htlcSendVerifyR(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: HtlcSendVerifyRInfo, 
    callback: Function) {

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
  public onHtlcSendVerifyR(jsonData: any) {}

  /**
   * MsgType_HTLC_SendSignVerifyR_46
   * @param recipient_node_peer_id string 
   * @param recipient_user_peer_id string
   * @param info HtlcSendSignVerifyRInfo
   * @param callback function
   */
  public htlcSendSignVerifyR(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: HtlcSendSignVerifyRInfo, 
    callback: Function) {

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
  public onHtlcSendSignVerifyR(jsonData: any) {}
  /* ***************** backward R end*****************/

  /* ***************** close htlc tx begin*****************/
  /**
   * MsgType_HTLC_SendRequestCloseCurrTx_49
   * @param recipient_node_peer_id string 
   * @param recipient_user_peer_id string
   * @param info CloseHtlcTxInfo
   * @param callback function
   * */
  public closeHTLC(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CloseHtlcTxInfo, 
    callback: Function) {

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
  public onCloseHTLC(jsonData: any) {}

  /**
   * MsgType_HTLC_SendCloseSigned_50
   * @param recipient_node_peer_id string 
   * @param recipient_user_peer_id string
   * @param info CloseHtlcTxInfoSigned
   * @param callback function
   */
  public closeHTLCSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CloseHtlcTxInfoSigned, 
    callback: Function) {

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
  public onCloseHTLCSigned(jsonData: any) {}

  /* ***************** close htlc tx end*****************/

  /* ********************* query data *************************** */
  /**
   * MsgType_Core_Omni_GetTransaction_2118
   * @param txid string
   * @param callback function
   */
  public getOmniTxByTxid(txid: string, callback: Function) {
    if (this.isNotString(txid)) {
      alert("empty txid");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_GetTransaction_2118;
    msg.data["txid"] = txid;
    this.sendData(msg, callback);
  }
  public onGetOmniTxByTxid(jsonData: any) {}

  /**
   * MsgType_Core_Omni_CreateNewTokenFixed_2113
   * @param info OmniSendIssuanceFixed
   * @param callback function
   */
  public createNewTokenFixed(info: OmniSendIssuanceFixed, callback: Function) {
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
  public onCreateNewTokenFixed(jsonData: any) {}

  /**
   * MsgType_Core_Omni_CreateNewTokenManaged_2114
   * @param info OmniSendIssuanceManaged
   * @param callback function
   */
  public createNewTokenManaged(
    info: OmniSendIssuanceManaged,
    callback: Function
  ) {
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
  public onCreateNewTokenManaged(jsonData: any) {}
  /**
   * MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115
   * @param info OmniSendGrant
   * @param callback function
   */
  public omniSendGrant(info: OmniSendGrant, callback: Function) {
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
  public onOmniSendGrant(jsonData: any) {}
  /**
   * MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116
   * @param info OmniSendRevoke
   * @param callback function
   */
  public omniSendRevoke(info: OmniSendRevoke, callback: Function) {
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
  public onOmniSendRevoke(jsonData: any) {}

  /**
   * MsgType_Core_Omni_Getbalance_2112
   * @param address string
   * @param callback function
   */
  public omniGetAllBalancesForAddress(address: string, callback: Function) {
    if (this.isNotString(address)) {
      alert("empty address");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_Getbalance_2112;
    msg.data["address"] = address;
    this.sendData(msg, callback);
  }
  public onOmniGetAllBalancesForAddress(jsonData: any) {}

  /**
   * MsgType_Core_Omni_GetProperty_2119
   * @param propertyId string
   * @param callback function
   */
  public omniGetAssetNameByID(propertyId: string, callback: Function) {
    if (this.isNotString(propertyId)) {
      alert("empty propertyId");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_GetProperty_2119;
    msg.data["propertyId"] = propertyId;
    this.sendData(msg, callback);
  }
  public onOmniGetAssetNameByID(jsonData: any) {}

  /**
   * MsgType_Core_BalanceByAddress_2108
   * @param address string
   * @param callback function
   */
  public getBtcBalanceByAddress(address: string, callback: Function) {
    if (this.isNotString(address)) {
      alert("empty address");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_BalanceByAddress_2108;
    msg.data["address"] = address;
    this.sendData(msg, callback);
  }
  public onGetBtcBalanceByAddress(jsonData: any) {}

  /**
   * MsgType_Core_Btc_ImportPrivKey_2111
   * @param privkey string
   * @param callback function
   */
  public importPrivKey(privkey: string, callback: Function) {
    if (this.isNotString(privkey)) {
      alert("empty privkey");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Btc_ImportPrivKey_2111;
    msg.data["privkey"] = privkey;
    this.sendData(msg, callback);
  }
  public onImportPrivKey(jsonData: any) {}

  /**
   * MsgType_HTLC_CreatedRAndHInfoList_N4001
   * @param callback function
   */
  public getHtlcCreatedRandHInfoList(callback: Function) {
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_CreatedRAndHInfoList_N4001;
    this.sendData(msg, callback);
  }
  public onGetHtlcCreatedRandHInfoList(jsonData: any) {}

  /**
   * MsgType_HTLC_SignedRAndHInfoList_N4101
   * @param callback function
   */
  public getHtlcSignedRandHInfoList(callback: Function) {
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_SignedRAndHInfoList_N4101;
    this.sendData(msg, callback);
  }
  public onGetHtlcSignedRandHInfoList(jsonData: any) {}

  /**
   * MsgType_HTLC_GetRFromLCommitTx_N4103
   * @param channel_id string
   * @param callback function
   */
  public getRFromCommitmentTx(channel_id: string, callback: Function) {
    if (this.isNotString(channel_id)) {
      alert("empty channel_id");
      return;
    }
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_GetRFromLCommitTx_N4103;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }
  public onGetRFromCommitmentTx(jsonData: any) {}

  /**
   * MsgType_HTLC_GetPathInfoByH_N4104
   * @param h string
   * @param callback function
   */
  public getPathInfoByH(h: string, callback: Function) {
    if (this.isNotString(h)) {
      alert("empty h");
      return;
    }
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_GetPathInfoByH_N4104;
    msg.data = h;
    this.sendData(msg, callback);
  }
  public onGetPathInfoByH(jsonData: any) {}
  /**
   * MsgType_HTLC_GetRInfoByHOfOwner_N4105
   * @param h string
   * @param callback function
   */
  public getRByHOfReceiver(h: string, callback: Function) {
    if (this.isNotString(h)) {
      alert("empty h");
      return;
    }
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_GetRInfoByHOfOwner_N4105;
    msg.data = h;
    this.sendData(msg, callback);
  }
  public onGetRByHOfReceiver(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203
   * @param channel_id string
   * @param callback function
   */
  public getLatestCommitmentTxByChannelId(
    channel_id: string,
    callback: Function
  ) {
    if (this.isNotString(channel_id)) {
      alert("empty channel_id");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }
  public onGetLatestCommitmentTxByChannelId(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_ItemsByChanId_3200
   * @param channel_id string
   * @param callback function
   */
  public getItemsByChannelId(channel_id: string, callback: Function) {
    if (this.isNotString(channel_id)) {
      alert("empty channel_id");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }
  public onGetItemsByChannelId(jsonData: any) {}

  /**
   * MsgType_ChannelOpen_AllItem_3150
   * @param callback function
   */
  public getAllChannels(callback: Function) {
    let msg = new Message();
    msg.type = this.messageType.MsgType_ChannelOpen_AllItem_3150;
    this.sendData(msg, callback);
  }
  public onGetAllChannels(jsonData: any) {}

  /**
   * MsgType_GetChannelInfoByChannelId_3154
   * @param id number
   * @param callback function
   */
  public getChannelById(id: number, callback: Function) {
    if (id == null || id <= 0) {
      alert("error id");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_GetChannelInfoByChannelId_3154;
    msg.data = id;
    this.sendData(msg, callback);
  }
  public onGetChannelById(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_AllBRByChanId_3208
   * @param channel_id string
   * @param callback function
   */
  public getAllBRTx(channel_id: string, callback: Function) {
    if (this.isNotString(channel_id)) {
      alert("empty channel_id");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_AllBRByChanId_3208;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }
  public onGetAllBrTx(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_ItemsByChanId_3200
   * @param channel_id string
   * @param callback function
   */
  public getAllCommitmentTx(channel_id: string, callback: Function) {
    if (this.isNotString(channel_id)) {
      alert("empty channel_id");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }
  public onGetAllCommitmentTx(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_LatestRDByChanId_3204
   * @param channel_id string
   * @param callback function
   */
  public getLatestCommitmentTx(channel_id: string, callback: Function) {
    if (this.isNotString(channel_id)) {
      alert("empty channel_id");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_LatestRDByChanId_3204;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }
  public onGetLatestCommitmentTx(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_LatestBRByChanId_3205
   * @param channel_id string
   * @param callback function
   */
  public getLatestBRTx(channel_id: string, callback: Function) {
    if (this.isNotString(channel_id)) {
      alert("empty channel_id");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_LatestBRByChanId_3205;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }
  public onGetLatestBRTx(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_AllRDByChanId_3207
   * @param channel_id string
   * @param callback function
   */
  public getAllRDTx(channel_id: string, callback: Function) {
    if (this.isNotString(channel_id)) {
      alert("empty channel_id");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_AllRDByChanId_3207;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }
  public onGetAllRDTx(jsonData: any) {}

  /**
   * MsgType_SendBreachRemedyTransaction_3206
   * @param channel_id string
   * @param callback function
   */
  public sendBreachRemedyTransaction(channel_id: string, callback: Function) {
    if (this.isNotString(channel_id)) {
      alert("empty channel_id");
      return;
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_SendBreachRemedyTransaction_3206;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }
  public onSendBreachRemedyTransaction(jsonData: any) {}

  /**
   * MsgType_SendCloseChannelRequest_38
   * @param recipient_node_peer_id string 
   * @param recipient_user_peer_id string
   * @param channel_id string
   * @param callback function
   */
  public closeChannel(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    channel_id: string, callback: Function) {

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
  public onCloseChannel(jsonData: any) {}

  /**
   * MsgType_SendCloseChannelSign_39
   * @param recipient_node_peer_id string 
   * @param recipient_user_peer_id string
   * @param info CloseChannelSign
   * @param callback function
   */
  public closeChannelSign(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CloseChannelSign, callback: Function) {

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
  public onCloseChannelSign(jsonData: any) {}

  /**
   * MsgType_Atomic_SendSwap_80
   * @param recipient_node_peer_id string 
   * @param recipient_user_peer_id string
   * @param info AtomicSwapRequest
   * @param callback function
   */
  public atomicSwap(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AtomicSwapRequest, callback: Function) {

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
  public atomicSwapAccepted(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AtomicSwapAccepted, callback: Function) {

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

  private isNotString(str: String): boolean {
    if (str == null) {
      return true;
    }
    if (str.trim().length == 0) {
      return true;
    }
    return false;
  }
}
