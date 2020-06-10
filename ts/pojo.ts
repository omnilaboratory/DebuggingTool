class Message {
  type: number;
  data: Object = new Object();
  recipient_user_peer_id: string = "";
  recipient_node_peer_id: string = "";
}

class BtcFundingInfo {
  from_address: string = "";
  from_address_private_key: string = "";
  to_address: string = "";
  amount: number = 0.0;
  miner_fee: number = 0.0;
}

class FundingBtcCreated {
  temporary_channel_id: string = "";
  funding_tx_hex: string = "";
  channel_address_private_key: string = "";
}
class FundingBtcSigned {
  temporary_channel_id: string = "";
  funding_txid: string = "";
  channel_address_private_key: string = "";
  approval: boolean = false;
}

class OmniFundingAssetInfo {
  from_address: string = "";
  from_address_private_key: string = "";
  to_address: string = "";
  property_id: number = 0;
  amount: number = 0;
  miner_fee: number = 0.0;
}

class AcceptChannelInfo {
  temporary_channel_id: string = "";
  funding_pubkey: string = "";
  approval: boolean = false;
}

class ChannelFundingCreatedInfo {
  temporary_channel_id: string = "";
  funding_tx_hex: string = "";
  temp_address_pub_key: string = "";
  temp_address_private_key: string = "";
  channel_address_private_key: string = "";
}

class ChannelFundingSignedInfo {
  channel_id: string = "";
  fundee_channel_address_private_key: string = "";
  approval: boolean = false;
}

class CommitmentTx {
  channel_id: string = "";
  amount: number = 0;
  curr_temp_address_pub_key: string = "";
  curr_temp_address_private_key: string = "";
  channel_address_private_key: string = "";
  last_temp_address_private_key: string = "";
}

class CommitmentTxSigned {
  channel_id: string = "";
  curr_temp_address_pub_key: string = "";
  curr_temp_address_private_key: string = "";
  last_temp_address_private_key: string = "";
  request_commitment_hash: string = "";
  channel_address_private_key: string = "";
  approval: boolean = false;
}

class HtlcFindPathInfo {
  recipient_node_peer_id: string = "";
  recipient_user_peer_id: string = "";
  property_id: number = 0;
  amount: number = 0;
}

class HtlcCreatedInfo {
  recipient_user_peer_id: string = "";
  property_id: number = 0;
  amount: number = 0;
  memo: string = "";
  h: string = "";
  htlc_channel_path: string = "";
  channel_address_private_key: string = "";
  last_temp_address_private_key: string = "";
  curr_rsmc_temp_address_pub_key: string = "";
  curr_rsmc_temp_address_private_key: string = "";
  curr_htlc_temp_address_pub_key: string = "";
  curr_htlc_temp_address_private_key: string = "";
  curr_htlc_temp_address_for_ht1a_pub_key: string = "";
  curr_htlc_temp_address_for_ht1a_private_key: string = "";
}

class HtlcSignedInfo {
  request_hash: string = "";
  approval: boolean = false;
  channel_address_private_key: string = "";
  last_temp_address_private_key: string = "";
  curr_rsmc_temp_address_pub_key: string = "";
  curr_rsmc_temp_address_private_key: string = "";
  curr_htlc_temp_address_pub_key: string = "";
  curr_htlc_temp_address_private_key: string = "";
}

class HtlcHSignInfo {
  request_hash: string = "";
  property_id: number = 0;
  amount: number = 0;
  h: string = "";
  approval: boolean = false;
}

class SignGetHInfo {
  request_hash: string = "";
  channel_address_private_key: string = "";
  last_temp_address_private_key: string = "";
  curr_rsmc_temp_address_pub_key: string = "";
  curr_rsmc_temp_address_private_key: string = "";
  curr_htlc_temp_address_pub_key: string = "";
  curr_htlc_temp_address_private_key: string = "";
  approval: boolean = false;
}

class HtlcRequestOpen {
  request_hash: string = "";
  channel_address_private_key: string = "";
  last_temp_address_private_key: string = "";
  curr_rsmc_temp_address_pub_key: string = "";
  curr_rsmc_temp_address_private_key: string = "";
  curr_htlc_temp_address_pub_key: string = "";
  curr_htlc_temp_address_private_key: string = "";
  curr_htlc_temp_address_for_ht1a_pub_key: string = "";
  curr_htlc_temp_address_for_ht1a_private_key: string = "";
}

class HtlcSendRInfo {
  channel_id: string = "";
  r: string = "";
  channel_address_private_key: string = "";
  curr_htlc_temp_address_for_he1b_pub_key: string = "";
  curr_htlc_temp_address_for_he1b_private_key: string = "";
}

class HtlcVerifyRInfo {
  channel_id: string = "";
  request_hash: string = "";
  r: string = "";
  channel_address_private_key: string = "";
}

class CloseHtlcTxInfo {
  channel_id: string = "";
  channel_address_private_key: string = "";
  last_rsmc_temp_address_private_key: string = "";
  last_htlc_temp_address_private_key: string = "";
  last_htlc_temp_address_for_htnx_private_key: string = "";
  curr_rsmc_temp_address_pub_key: string = "";
  curr_rsmc_temp_address_private_key: string = "";
}

class CloseHtlcTxInfoSigned {
  request_hash: string = "";
  channel_address_private_key: string = "";
  last_rsmc_temp_address_private_key: string = "";
  last_htlc_temp_address_private_key: string = "";
  last_htlc_temp_address_for_htnx_private_key: string = "";
  curr_rsmc_temp_address_pub_key: string = "";
  curr_rsmc_temp_address_private_key: string = "";
}

class OmniSendIssuanceManaged {
  from_address: string = "";
  name: string = "";
  ecosystem: number = 0;
  divisible_type: number = 0;
  data: string = "";
}

class OmniSendIssuanceFixed extends OmniSendIssuanceManaged {
  amount: number = 0;
}

class OmniSendGrant {
  from_address: string = "";
  property_id: number = 0;
  amount: number = 0;
  memo: string = "";
}
class OmniSendRevoke extends OmniSendGrant {}

class CloseChannelSign {
  channel_id: string = "";
  request_close_channel_hash: string = "";
  approval: boolean = false;
}

/**
 * -80
 */
class AtomicSwapRequest{
  channel_id_from: string = "";
  channel_id_to: string = "";
  recipient_user_peer_id: string = "";
  property_sent: number = 0;
  amount: number = 0;
  exchange_rate: number = 0;
  property_received: number = 0;
  transaction_id: string = "";
  time_locker: number = 0;
}

/**
 * -81
 */
class AtomicSwapAccepted extends AtomicSwapRequest {
  target_transaction_id: string = "";
}

class MessageType {
  MsgType_Error_0 = 0;

  MsgType_UserLogin_1 = -102001;
  MsgType_UserLogout_2 = -102002;
  MsgType_p2p_ConnectServer_3  = -102003;
  MsgType_GetMnemonic_101 = -102004;

  MsgType_Core_GetNewAddress_1001 = -102101;
  MsgType_Core_GetMiningInfo_1002 = -102102;
  MsgType_Core_GetNetworkInfo_1003 = -102103;
  MsgType_Core_SignMessageWithPrivKey_1004 = -102104;
  MsgType_Core_VerifyMessage_1005 = -102105;
  MsgType_Core_DumpPrivKey_1006 = -102106;
  MsgType_Core_ListUnspent_1007 = -102107;
  MsgType_Core_BalanceByAddress_1008 = -102108;
  MsgType_Core_FundingBTC_1009 = -102109;
  MsgType_Core_BtcCreateMultiSig_1010 = -102110;
  MsgType_Core_Btc_ImportPrivKey_1011 = -102111;
  MsgType_Core_Omni_Getbalance_1200 = -102112;
  MsgType_Core_Omni_CreateNewTokenFixed_1201 = -102113;
  MsgType_Core_Omni_CreateNewTokenManaged_1202 = -102114;
  MsgType_Core_Omni_GrantNewUnitsOfManagedToken_1203 = -102115;
  MsgType_Core_Omni_RevokeUnitsOfManagedToken_1204 = -102116;
  MsgType_Core_Omni_ListProperties_1205 = -102117;
  MsgType_Core_Omni_GetTransaction_1206 = -102118;
  // MsgType_Core_Omni_GetAssetName_1207 = -102119;
  MsgType_Core_Omni_GetProperty_2119  = -102119;
  MsgType_Core_Omni_FundingAsset_2001 = -102120;
  
  MsgType_Mnemonic_CreateAddress_N200 = -103000;
  MsgType_Mnemonic_GetAddressByIndex_201 = -103001;

  // 客户端调用的2位需要替换成4位
  // MsgType_FundingCreate_AssetFundingCreated_N34 = -34;
	MsgType_FundingCreate_SendAssetFundingCreated_34 = -100034;
	// MsgType_FundingCreate_AssetFundingCreated_34     MsgType = -34
	MsgType_FundingCreate_RecvAssetFundingCreated_34  = -110034;

  // 客户端调用的4位需要替换成新的4位
  // MsgType_FundingCreate_BtcCreate_N3400 = -103001;
  MsgType_FundingCreate_SendBtcFundingCreated_340  = -100340;
	// MsgType_FundingCreate_BtcFundingCreated_340     MsgType = -340
	MsgType_FundingCreate_RecvBtcFundingCreated_340  = -110340;
  
  // MsgType_FundingCreate_ALlItem_N3403 = -103001;
  //Omni充值列表
  MsgType_FundingCreate_Asset_AllItem_3100 = -103100;

  // MsgType_FundingCreate_ItemById_N3402 = -103001;
	//Omni充值根据id获取充值详情
	MsgType_FundingCreate_Asset_ItemById_3101 = -103101;

  // MsgType_FundingCreate_ItemByTempId_N3401 = -103001;
  //Omni充值根据通道id获取充值详情
  MsgType_FundingCreate_Asset_ItemByChannelId_3102 = -103102;
  
  // MsgType_FundingCreate_Count_N3404 = -103001;
	//Omni充值充值总次数
  MsgType_FundingCreate_Asset_Count_3103 = -103103;

  MsgType_FundingCreate_DelById_N3405 = -103001;

  // MsgType_FundingSign_AssetFundingSigned_N35 = -35;
	MsgType_FundingSign_SendAssetFundingSigned_35  = -100035;
	// MsgType_FundingSign_AssetFundingSigned_35     MsgType = -35
  MsgType_FundingSign_RecvAssetFundingSigned_35  = -110035;
  
  // MsgType_FundingSign_BtcSign_N3500 = -3500;
  MsgType_FundingSign_SendBtcSign_350  = -100350;
	// MsgType_FundingSign_BtcSign_350     MsgType = -350
	MsgType_FundingSign_RecvBtcSign_350  = -110350;

  // MsgType_ChannelOpen_N32 = -32;
	MsgType_SendChannelOpen_32  = -100032;
	// MsgType_ChannelOpen_32     MsgType = -32
	MsgType_RecvChannelOpen_32  = -110032;
  
  // 放弃了？
  // MsgType_ForceCloseChannel_N3205 = -3205;

  // MsgType_ChannelOpen_AllItem_N3202 = -3202;
  MsgType_ChannelOpen_AllItem_3150          = -103150;
  
  // MsgType_ChannelOpen_ItemByTempId_N3201 = -3201;
  MsgType_ChannelOpen_ItemByTempId_3151     = -103151;
  
  // MsgType_ChannelOpen_Count_N3203 = -3203;
  MsgType_ChannelOpen_Count_3152            = -103152;
  
  // MsgType_ChannelOpen_DelItemByTempId_N3204 = -3204;
  MsgType_ChannelOpen_DelItemByTempId_3153  = -103153;
  
  // MsgType_GetChannelInfoByChanId_N3206 = -3206;
  // MsgType_GetChannelInfoByChanId_N3207 = -3207;
	MsgType_GetChannelInfoByChanId_3154       = -103154;
  MsgType_GetChannelInfoByChanId_3155       = -103155;
  
  // MsgType_ChannelAccept_N33 = -33;
	MsgType_SendChannelAccept_33  = -100033;
	// MsgType_ChannelAccept_33     MsgType = -33
	MsgType_RecvChannelAccept_33  = -110033;
  
  // MsgType_CommitmentTx_CommitmentTransactionCreated_N351 = -351;
  MsgType_CommitmentTx_SendCommitmentTransactionCreated_351           = -100351;
	// MsgType_CommitmentTx_CommitmentTransactionCreated_351       MsgType = -351
	MsgType_CommitmentTx_RecvCommitmentTransactionCreated_351          = -110351;
  
  // 已经放弃了？
  // MsgType_CommitmentTx_GetBroadcastCommitmentTx_N35110 = -35110;
  // MsgType_CommitmentTx_GetBroadcastRDTx_N35111 = -35111;
  // MsgType_CommitmentTx_GetBroadcastBRTx_N35112 = -35112;

  // MsgType_CommitmentTx_ItemsByChanId_N35101 = -35101;
  MsgType_CommitmentTx_ItemsByChanId_3200               = -103200;
  
  // MsgType_CommitmentTx_ItemById_N35102 = -35102;
  MsgType_CommitmentTx_ItemById_3201                    = -103201;
  
  // MsgType_CommitmentTx_Count_N35103 = -35103;
  MsgType_CommitmentTx_Count_3202                       = -103202;
  
  // MsgType_CommitmentTx_LatestCommitmentTxByChanId_N35104 = -35104;
  MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203  = -103203;
  
  // MsgType_CommitmentTx_LatestRDByChanId_N35105 = -35105;
  MsgType_CommitmentTx_LatestRDByChanId_3204            = -103204;
  
  // MsgType_CommitmentTx_LatestBRByChanId_N35106 = -35106;
  MsgType_CommitmentTx_LatestBRByChanId_3205            = -103205;
  
  // MsgType_SendBreachRemedyTransaction_N35107 = -35107;
  MsgType_SendBreachRemedyTransaction_3206              = -103206;
  
  // MsgType_CommitmentTx_AllRDByChanId_N35108 = -35108;
  MsgType_CommitmentTx_AllRDByChanId_3207               = -103207;
  
  // MsgType_CommitmentTx_AllBRByChanId_N35109 = -35109;
  MsgType_CommitmentTx_AllBRByChanId_3208               = -103208;
  


  MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352 = -352;
  MsgType_CommitmentTxSigned_ItemByChanId_N35201 = -35201;
  MsgType_CommitmentTxSigned_ItemById_N35202 = -35202;
  MsgType_CommitmentTxSigned_Count_N35203 = -35203;

  MsgType_GetBalanceRequest_N353 = -353;
  MsgType_GetBalanceRespond_N354 = -354;

  MsgType_CloseChannelRequest_N38 = -38;
  MsgType_CloseChannelSign_N39 = -39;

  // MsgType_HTLC_Invoice_N4003 = -4003;
  // MsgType_HTLC_AddHTLC_N40 = -40;
  // MsgType_HTLC_CreatedRAndHInfoList_N4001 = -4001;
  // MsgType_HTLC_CreatedRAndHInfoItem_N4002 = -4002;
  // MsgType_HTLC_SignedRAndHInfoList_N4101 = -4101;
  // MsgType_HTLC_SignedRAndHInfoItem_N4102 = -4102;
  // MsgType_HTLC_GetRFromLCommitTx_N4103 = -4103;
  // MsgType_HTLC_GetPathInfoByH_N4104 = -4104;
  // MsgType_HTLC_GetRInfoByHOfOwner_N4105 = -4105;
  // MsgType_HTLC_FindPathAndSendH_N42 = -42;
  // MsgType_HTLC_SendH_N43 = -43;
  // MsgType_HTLC_SignGetH_N44 = -44;
  // MsgType_HTLC_CreateCommitmentTx_N45 = -45;
  // MsgType_HTLC_SendR_N46 = -46;
  // MsgType_HTLC_VerifyR_N47 = -47;
  // MsgType_HTLC_RequestCloseCurrTx_N48 = -48;
  // MsgType_HTLC_CloseSigned_N49 = -49;

  MsgType_HTLC_FindPath_N4001              = -4001;
  MsgType_HTLC_Invoice_N4003               = -4003;
  MsgType_HTLC_AddHTLC_N40                 = -40;
  MsgType_HTLC_AddHTLCSigned_N41           = -41;
  MsgType_HTLC_PayerSignC3b_N42            = -42;
  MsgType_HTLC_PayeeCreateHTRD1a_N43       = -43;
  MsgType_HTLC_PayerSignHTRD1a_N44         = -44;
  MsgType_HTLC_SendR_N45                   = -45;
  MsgType_HTLC_VerifyR_N46                 = -46;
  MsgType_HTLC_SendHerdHex_N47             = -47;
  MsgType_HTLC_SignHedHex_N48              = -48;
  MsgType_HTLC_RequestCloseCurrTx_N49      = -49;
  MsgType_HTLC_CloseSigned_N50             = -50;
  MsgType_HTLC_CloseHtlcRequestSignBR_N51  = -51;
  MsgType_HTLC_CloseHtlcUpdateCnb_N52      = -52;

  MsgType_Atomic_Swap_N80         = -80
	MsgType_Atomic_Swap_Accept_N81  = -81
}
