class Message {
    constructor() {
        this.data = new Object();
        this.recipient_peer_id = "";
    }
}
class BtcFundingInfo {
    constructor() {
        this.from_address = "";
        this.from_address_private_key = "";
        this.to_address = "";
        this.amount = 0.0;
        this.miner_fee = 0.0;
    }
}
class FundingBtcCreated {
    constructor() {
        this.temporary_channel_id = "";
        this.funding_tx_hex = "";
        this.channel_address_private_key = "";
    }
}
class FundingBtcSigned {
    constructor() {
        this.temporary_channel_id = "";
        this.funding_txid = "";
        this.channel_address_private_key = "";
        this.approval = false;
    }
}
class OmniFundingAssetInfo {
    constructor() {
        this.from_address = "";
        this.from_address_private_key = "";
        this.to_address = "";
        this.property_id = 0;
        this.amount = 0;
        this.miner_fee = 0.0;
    }
}
class AcceptChannelInfo {
    constructor() {
        this.temporary_channel_id = "";
        this.funding_pubkey = "";
        this.approval = false;
    }
}
class ChannelFundingCreatedInfo {
    constructor() {
        this.temporary_channel_id = "";
        this.funding_tx_hex = "";
        this.temp_address_pub_key = "";
        this.temp_address_private_key = "";
        this.channel_address_private_key = "";
    }
}
class ChannelFundingSignedInfo {
    constructor() {
        this.channel_id = "";
        this.fundee_channel_address_private_key = "";
        this.approval = false;
    }
}
class CommitmentTx {
    constructor() {
        this.channel_id = "";
        this.amount = 0;
        this.curr_temp_address_pub_key = "";
        this.curr_temp_address_private_key = "";
        this.channel_address_private_key = "";
        this.last_temp_address_private_key = "";
    }
}
class CommitmentTxSigned {
    constructor() {
        this.channel_id = "";
        this.curr_temp_address_pub_key = "";
        this.curr_temp_address_private_key = "";
        this.last_temp_private_key = "";
        this.request_commitment_hash = "";
        this.channel_address_private_key = "";
        this.approval = false;
    }
}
class HtlcHInfo {
    constructor() {
        this.property_id = 0;
        this.amount = 0;
        this.recipient_peer_id = "";
    }
}
class HtlcRequestFindPathAndSendH {
    constructor() {
        this.h = "";
        this.property_id = 0;
        this.amount = 0;
        this.recipient_peer_id = "";
        this.memo = "";
    }
}
class HtlcHSignInfo {
    constructor() {
        this.request_hash = "";
        this.property_id = 0;
        this.amount = 0;
        this.h = "";
        this.approval = false;
    }
}
class SignGetHInfo {
    constructor() {
        this.request_hash = "";
        this.channel_address_private_key = "";
        this.last_temp_address_private_key = "";
        this.curr_rsmc_temp_address_pub_key = "";
        this.curr_rsmc_temp_address_private_key = "";
        this.curr_htlc_temp_address_pub_key = "";
        this.curr_htlc_temp_address_private_key = "";
        this.curr_htlc_temp_address_he1b_ofh_pub_key = "";
        this.approval = false;
    }
}
class HtlcRequestOpen {
    constructor() {
        this.request_hash = "";
        this.channel_address_private_key = "";
        this.last_temp_address_private_key = "";
        this.curr_rsmc_temp_address_pub_key = "";
        this.curr_rsmc_temp_address_private_key = "";
        this.curr_htlc_temp_address_pub_key = "";
        this.curr_htlc_temp_address_private_key = "";
        this.curr_htlc_temp_address_for_ht1a_pub_key = "";
        this.curr_htlc_temp_address_for_ht1a_private_key = "";
        this.curr_htlc_temp_address_for_hed1a_ofh_pub_key = "";
    }
}
class HtlcSendRInfo {
    constructor() {
        this.request_hash = "";
        this.r = "";
        this.channel_address_private_key = "";
        this.curr_htlc_temp_address_he1b_ofh_private_key = "";
        this.curr_htlc_temp_address_for_he1b_pub_key = "";
        this.curr_htlc_temp_address_for_he1b_private_key = "";
    }
}
class HtlcVerifyRInfo {
    constructor() {
        this.request_hash = "";
        this.r = "";
        this.channel_address_private_key = "";
        this.curr_htlc_temp_address_for_hed1a_ofh_private_key = "";
    }
}
class CloseHtlcTxInfo {
    constructor() {
        this.channel_id = "";
        this.channel_address_private_key = "";
        this.last_rsmc_temp_address_private_key = "";
        this.last_htlc_temp_address_private_key = "";
        this.last_htlc_temp_address_for_htnx_private_key = "";
        this.curr_rsmc_temp_address_pub_key = "";
        this.curr_rsmc_temp_address_private_key = "";
    }
}
class CloseHtlcTxInfoSigned {
    constructor() {
        this.request_close_htlc_hash = "";
        this.channel_address_private_key = "";
        this.last_rsmc_temp_address_private_key = "";
        this.last_htlc_temp_address_private_key = "";
        this.last_htlc_temp_address_for_htnx_private_key = "";
        this.curr_rsmc_temp_address_pub_key = "";
        this.curr_rsmc_temp_address_private_key = "";
    }
}
class OmniSendIssuanceManaged {
    constructor() {
        this.from_address = "";
        this.name = "";
        this.ecosystem = 0;
        this.divisible_type = 0;
        this.data = "";
    }
}
class OmniSendIssuanceFixed extends OmniSendIssuanceManaged {
    constructor(...args) {
        super(...args);
        this.amount = 0;
    }
}
class OmniSendGrant {
    constructor() {
        this.from_address = "";
        this.property_id = 0;
        this.amount = 0;
        this.memo = "";
    }
}
class OmniSendRevoke extends OmniSendGrant {
}
class CloseChannelSign {
    constructor() {
        this.channel_id = "";
        this.request_close_channel_hash = "";
        this.approval = false;
    }
}
class MessageType {
    constructor() {
        this.MsgType_Error_0 = 0;
        this.MsgType_UserLogin_1 = 1;
        this.MsgType_UserLogout_2 = 2;
        this.MsgType_Core_GetNewAddress_1001 = 1001;
        this.MsgType_Core_GetMiningInfo_1002 = 1002;
        this.MsgType_Core_GetNetworkInfo_1003 = 1003;
        this.MsgType_Core_SignMessageWithPrivKey_1004 = 1004;
        this.MsgType_Core_VerifyMessage_1005 = 1005;
        this.MsgType_Core_DumpPrivKey_1006 = 1006;
        this.MsgType_Core_ListUnspent_1007 = 1007;
        this.MsgType_Core_BalanceByAddress_1008 = 1008;
        this.MsgType_Core_FundingBTC_1009 = 1009;
        this.MsgType_Core_BtcCreateMultiSig_1010 = 1010;
        this.MsgType_Core_Btc_ImportPrivKey_1011 = 1011;
        this.MsgType_Core_Omni_Getbalance_1200 = 1200;
        this.MsgType_Core_Omni_CreateNewTokenFixed_1201 = 1201;
        this.MsgType_Core_Omni_CreateNewTokenManaged_1202 = 1202;
        this.MsgType_Core_Omni_GrantNewUnitsOfManagedToken_1203 = 1203;
        this.MsgType_Core_Omni_RevokeUnitsOfManagedToken_1204 = 1204;
        this.MsgType_Core_Omni_ListProperties_1205 = 1205;
        this.MsgType_Core_Omni_GetTransaction_1206 = 1206;
        this.MsgType_Core_Omni_FundingAsset_2001 = 2001;
        this.MsgType_GetMnemonic_101 = 101;
        this.MsgType_Mnemonic_CreateAddress_N200 = -200;
        this.MsgType_Mnemonic_GetAddressByIndex_201 = -201;
        this.MsgType_ChannelOpen_N32 = -32;
        this.MsgType_ChannelOpen_ItemByTempId_N3201 = -3201;
        this.MsgType_ChannelOpen_AllItem_N3202 = -3202;
        this.MsgType_ChannelOpen_Count_N3203 = -3203;
        this.MsgType_ChannelOpen_DelItemByTempId_N3204 = -3204;
        this.MsgType_ForceCloseChannel_N3205 = -3205;
        this.MsgType_GetChannelInfoByChanId_N3206 = -3206;
        this.MsgType_GetChannelInfoByChanId_N3207 = -3207;
        this.MsgType_ChannelAccept_N33 = -33;
        this.MsgType_FundingCreate_AssetFundingCreated_N34 = -34;
        this.MsgType_FundingCreate_BtcCreate_N3400 = -3400;
        this.MsgType_FundingCreate_ItemByTempId_N3401 = -3401;
        this.MsgType_FundingCreate_ItemById_N3402 = -3402;
        this.MsgType_FundingCreate_ALlItem_N3403 = -3403;
        this.MsgType_FundingCreate_Count_N3404 = -3404;
        this.MsgType_FundingCreate_DelById_N3405 = -3405;
        this.MsgType_FundingSign_AssetFundingSigned_N35 = -35;
        this.MsgType_FundingSign_BtcSign_N3500 = -3500;
        this.MsgType_CommitmentTx_CommitmentTransactionCreated_N351 = -351;
        this.MsgType_CommitmentTx_ItemsByChanId_N35101 = -35101;
        this.MsgType_CommitmentTx_ItemById_N35102 = -35102;
        this.MsgType_CommitmentTx_Count_N35103 = -35103;
        this.MsgType_CommitmentTx_LatestCommitmentTxByChanId_N35104 = -35104;
        this.MsgType_CommitmentTx_LatestRDByChanId_N35105 = -35105;
        this.MsgType_CommitmentTx_LatestBRByChanId_N35106 = -35106;
        this.MsgType_SendBreachRemedyTransaction_N35107 = -35107;
        this.MsgType_CommitmentTx_AllRDByChanId_N35108 = -35108;
        this.MsgType_CommitmentTx_AllBRByChanId_N35109 = -35109;
        this.MsgType_CommitmentTx_GetBroadcastCommitmentTx_N35110 = -35110;
        this.MsgType_CommitmentTx_GetBroadcastRDTx_N35111 = -35111;
        this.MsgType_CommitmentTx_GetBroadcastBRTx_N35112 = -35112;
        this.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352 = -352;
        this.MsgType_CommitmentTxSigned_ItemByChanId_N35201 = -35201;
        this.MsgType_CommitmentTxSigned_ItemById_N35202 = -35202;
        this.MsgType_CommitmentTxSigned_Count_N35203 = -35203;
        this.MsgType_GetBalanceRequest_N353 = -353;
        this.MsgType_GetBalanceRespond_N354 = -354;
        this.MsgType_CloseChannelRequest_N38 = -38;
        this.MsgType_CloseChannelSign_N39 = -39;
        this.MsgType_HTLC_Invoice_N4003 = -4003;
        this.MsgType_HTLC_AddHTLC_N40 = -40;
        this.MsgType_HTLC_CreatedRAndHInfoList_N4001 = -4001;
        this.MsgType_HTLC_CreatedRAndHInfoItem_N4002 = -4002;
        this.MsgType_HTLC_SignedRAndHInfoList_N4101 = -4101;
        this.MsgType_HTLC_SignedRAndHInfoItem_N4102 = -4102;
        this.MsgType_HTLC_GetRFromLCommitTx_N4103 = -4103;
        this.MsgType_HTLC_GetPathInfoByH_N4104 = -4104;
        this.MsgType_HTLC_GetRInfoByHOfOwner_N4105 = -4105;
        this.MsgType_HTLC_FindPathAndSendH_N42 = -42;
        this.MsgType_HTLC_SendH_N43 = -43;
        this.MsgType_HTLC_SignGetH_N44 = -44;
        this.MsgType_HTLC_CreateCommitmentTx_N45 = -45;
        this.MsgType_HTLC_SendR_N46 = -46;
        this.MsgType_HTLC_VerifyR_N47 = -47;
        this.MsgType_HTLC_RequestCloseCurrTx_N48 = -48;
        this.MsgType_HTLC_CloseSigned_N49 = -49;
        this.MsgType_HTLC_RequestCloseChannel_N50 = -50;
        this.MsgType_HTLC_CloseChannelSigned_N51 = -51;
    }
}
