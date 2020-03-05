class Message {
  type: number;
  data: Object = new Object();
  recipient_peer_id: string = "";
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
  amount: number = 0;
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
  last_temp_private_key: string = "";
  request_commitment_hash: string = "";
  channel_address_private_key: string = "";
  approval: boolean = false;
}

class HtlcHInfo {
  property_id: number = 0;
  amount: number = 0;
  recipient_peer_id: string = "";
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
  curr_htlc_temp_address_he1b_ofh_pub_key: string = "";
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
  curr_htlc_temp_address_for_hed1a_ofh_pub_key: string = "";
}

class HtlcSendRInfo {
  request_hash: string = "";
  r: string = "";
  channel_address_private_key: string = "";
  curr_htlc_temp_address_he1b_ofh_private_key: string = "";
  curr_htlc_temp_address_for_he1b_pub_key: string = "";
  curr_htlc_temp_address_for_he1b_private_key: string = "";
}

class HtlcVerifyRInfo {
  request_hash: string = "";
  r: string = "";
  channel_address_private_key: string = "";
  curr_htlc_temp_address_for_hed1a_ofh_private_key: string = "";
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
  request_close_htlc_hash: string = "";
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

class MessageType {
  MsgType_Error_0 = 0;
  MsgType_UserLogin_1 = 1;
  MsgType_UserLogout_2 = 2;

  MsgType_Core_GetNewAddress_1001 = 1001;
  MsgType_Core_GetMiningInfo_1002 = 1002;
  MsgType_Core_GetNetworkInfo_1003 = 1003;
  MsgType_Core_SignMessageWithPrivKey_1004 = 1004;
  MsgType_Core_VerifyMessage_1005 = 1005;
  MsgType_Core_DumpPrivKey_1006 = 1006;
  MsgType_Core_ListUnspent_1007 = 1007;
  MsgType_Core_BalanceByAddress_1008 = 1008;
  MsgType_Core_FundingBTC_1009 = 1009;
  MsgType_Core_BtcCreateMultiSig_1010 = 1010;
  MsgType_Core_Btc_ImportPrivKey_1011 = 1011;
  MsgType_Core_Omni_Getbalance_1200 = 1200;
  MsgType_Core_Omni_CreateNewTokenFixed_1201 = 1201;
  MsgType_Core_Omni_CreateNewTokenManaged_1202 = 1202;
  MsgType_Core_Omni_GrantNewUnitsOfManagedToken_1203 = 1203;
  MsgType_Core_Omni_RevokeUnitsOfManagedToken_1204 = 1204;
  MsgType_Core_Omni_ListProperties_1205 = 1205;
  MsgType_Core_Omni_GetTransaction_1206 = 1206;

  MsgType_Core_Omni_FundingAsset_2001 = 2001;

  MsgType_GetMnemonic_101 = 101;
  MsgType_Mnemonic_CreateAddress_N200 = -200;
  MsgType_Mnemonic_GetAddressByIndex_201 = -201;

  MsgType_ChannelOpen_N32 = -32;
  MsgType_ChannelOpen_ItemByTempId_N3201 = -3201;
  MsgType_ChannelOpen_AllItem_N3202 = -3202;
  MsgType_ChannelOpen_Count_N3203 = -3203;
  MsgType_ChannelOpen_DelItemByTempId_N3204 = -3204;
  MsgType_ForceCloseChannel_N3205 = -3205;
  MsgType_GetChannelInfoByChanId_N3206 = -3206;
  MsgType_GetChannelInfoByChanId_N3207 = -3207;

  MsgType_ChannelAccept_N33 = -33;

  MsgType_FundingCreate_AssetFundingCreated_N34 = -34;
  MsgType_FundingCreate_BtcCreate_N3400 = -3400;
  MsgType_FundingCreate_ItemByTempId_N3401 = -3401;
  MsgType_FundingCreate_ItemById_N3402 = -3402;
  MsgType_FundingCreate_ALlItem_N3403 = -3403;
  MsgType_FundingCreate_Count_N3404 = -3404;
  MsgType_FundingCreate_DelById_N3405 = -3405;

  MsgType_FundingSign_AssetFundingSigned_N35 = -35;
  MsgType_FundingSign_BtcSign_N3500 = -3500;

  MsgType_CommitmentTx_CommitmentTransactionCreated_N351 = -351;
  MsgType_CommitmentTx_ItemsByChanId_N35101 = -35101;
  MsgType_CommitmentTx_ItemById_N35102 = -35102;
  MsgType_CommitmentTx_Count_N35103 = -35103;
  MsgType_CommitmentTx_LatestCommitmentTxByChanId_N35104 = -35104;
  MsgType_CommitmentTx_LatestRDByChanId_N35105 = -35105;
  MsgType_CommitmentTx_LatestBRByChanId_N35106 = -35106;
  MsgType_SendBreachRemedyTransaction_N35107 = -35107;
  MsgType_CommitmentTx_AllRDByChanId_N35108 = -35108;
  MsgType_CommitmentTx_AllBRByChanId_N35109 = -35109;
  MsgType_CommitmentTx_GetBroadcastCommitmentTx_N35110 = -35110;
  MsgType_CommitmentTx_GetBroadcastRDTx_N35111 = -35111;
  MsgType_CommitmentTx_GetBroadcastBRTx_N35112 = -35112;

  MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352 = -352;
  MsgType_CommitmentTxSigned_ItemByChanId_N35201 = -35201;
  MsgType_CommitmentTxSigned_ItemById_N35202 = -35202;
  MsgType_CommitmentTxSigned_Count_N35203 = -35203;

  MsgType_GetBalanceRequest_N353 = -353;
  MsgType_GetBalanceRespond_N354 = -354;

  MsgType_CloseChannelRequest_N38 = -38;
  MsgType_CloseChannelSign_N39 = -39;

  MsgType_HTLC_Invoice_N4003 = -4003;
  MsgType_HTLC_AddHTLC_N40 = -40;
  MsgType_HTLC_CreatedRAndHInfoList_N4001 = -4001;
  MsgType_HTLC_CreatedRAndHInfoItem_N4002 = -4002;
  MsgType_HTLC_AddHTLCSigned_N41 = -41;
  MsgType_HTLC_SignedRAndHInfoList_N4101 = -4101;
  MsgType_HTLC_SignedRAndHInfoItem_N4102 = -4102;
  MsgType_HTLC_GetRFromLCommitTx_N4103 = -4103;
  MsgType_HTLC_GetPathInfoByH_N4104 = -4104;
  MsgType_HTLC_GetRInfoByHOfOwner_N4105 = -4105;
  MsgType_HTLC_FindPathAndSendH_N42 = -42;
  MsgType_HTLC_SendH_N43 = -43;
  MsgType_HTLC_SignGetH_N44 = -44;
  MsgType_HTLC_CreateCommitmentTx_N45 = -45;
  MsgType_HTLC_SendR_N46 = -46;
  MsgType_HTLC_VerifyR_N47 = -47;
  MsgType_HTLC_RequestCloseCurrTx_N48 = -48;
  MsgType_HTLC_CloseSigned_N49 = -49;
  MsgType_HTLC_RequestCloseChannel_N50 = -50;
  MsgType_HTLC_CloseChannelSigned_N51 = -51;
}
