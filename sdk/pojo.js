class Message {
    constructor() {
        this.data = new Object();
        this.recipient_user_peer_id = "";
        this.recipient_node_peer_id = "";
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
class OpenChannelInfo {
    constructor() {
        this.funding_pubkey = "";
        this.is_private = false;
    }
}
class AcceptChannelInfo {
    constructor() {
        this.temporary_channel_id = "";
        this.funding_pubkey = "";
        this.approval = false;
    }
}
class AssetFundingCreatedInfo {
    constructor() {
        this.temporary_channel_id = "";
        this.funding_tx_hex = "";
        this.temp_address_pub_key = "";
        this.temp_address_private_key = "";
        this.channel_address_private_key = "";
    }
}
class AssetFundingSignedInfo {
    constructor() {
        this.temporary_channel_id = "";
        this.fundee_channel_address_private_key = "";
        // approval: boolean = false;
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
        this.last_temp_address_private_key = "";
        this.msg_hash = "";
        this.channel_address_private_key = "";
        this.approval = false;
    }
}
class InvoiceInfo {
    constructor() {
        this.property_id = 0;
        this.amount = 0;
        this.h = "";
        this.expiry_time = "";
        this.description = "";
    }
}
class PayInvoiceInfo extends InvoiceInfo {
    constructor() {
        super(...arguments);
        this.invoice = "";
        this.recipient_user_peer_id = "";
        this.is_private = false;
    }
}
class HtlcCreatedInfo {
    constructor() {
        this.recipient_user_peer_id = "";
        this.property_id = 0;
        this.amount = 0;
        this.memo = "";
        this.h = "";
        this.routing_packet = "";
        this.channel_address_private_key = "";
        this.last_temp_address_private_key = "";
        this.curr_rsmc_temp_address_pub_key = "";
        this.curr_rsmc_temp_address_private_key = "";
        this.curr_htlc_temp_address_pub_key = "";
        this.curr_htlc_temp_address_private_key = "";
        this.curr_htlc_temp_address_for_ht1a_pub_key = "";
        this.curr_htlc_temp_address_for_ht1a_private_key = "";
    }
}
class HtlcSignedInfo {
    constructor() {
        this.payer_commitment_tx_hash = "";
        // approval: boolean = false;
        this.channel_address_private_key = "";
        this.last_temp_address_private_key = "";
        this.curr_rsmc_temp_address_pub_key = "";
        this.curr_rsmc_temp_address_private_key = "";
        this.curr_htlc_temp_address_pub_key = "";
        this.curr_htlc_temp_address_private_key = "";
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
    }
}
class ForwardRInfo {
    constructor() {
        this.channel_id = "";
        this.r = "";
        this.channel_address_private_key = "";
        this.curr_htlc_temp_address_for_he1b_pub_key = "";
        this.curr_htlc_temp_address_for_he1b_private_key = "";
    }
}
class SignRInfo {
    constructor() {
        this.channel_id = "";
        this.msg_hash = "";
        this.r = "";
        this.channel_address_private_key = "";
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
        this.msg_hash = "";
        this.channel_address_private_key = "";
        this.last_rsmc_temp_address_private_key = "";
        this.last_htlc_temp_address_private_key = "";
        this.last_htlc_temp_address_for_htnx_private_key = "";
        this.curr_rsmc_temp_address_pub_key = "";
        this.curr_rsmc_temp_address_private_key = "";
    }
}
class IssueManagedAmoutInfo {
    constructor() {
        this.from_address = "";
        this.name = "";
        this.ecosystem = 0;
        this.divisible_type = 0;
        this.data = "";
    }
}
class IssueFixedAmountInfo extends IssueManagedAmoutInfo {
    constructor() {
        super(...arguments);
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
/**
 * -80
 */
class AtomicSwapRequest {
    constructor() {
        this.channel_id_from = "";
        this.channel_id_to = "";
        this.recipient_user_peer_id = "";
        this.property_sent = 0;
        this.amount = 0;
        this.exchange_rate = 0;
        this.property_received = 0;
        this.transaction_id = "";
        this.time_locker = 0;
    }
}
/**
 * -81
 */
class AtomicSwapAccepted extends AtomicSwapRequest {
    constructor() {
        super(...arguments);
        this.target_transaction_id = "";
    }
}
/**
 * MsgType_p2p_ConnectPeer_2003
 */
class P2PPeer {
    constructor() {
        this.remote_node_address = "";
    }
}
class MessageType {
    constructor() {
        this.MsgType_Error_0 = 0;
        this.MsgType_UserLogin_2001 = -102001;
        this.MsgType_UserLogout_2002 = -102002;
        this.MsgType_p2p_ConnectPeer_2003 = -102003;
        this.MsgType_GetMnemonic_2004 = -102004;
        this.MsgType_GetMiniBtcFundAmount_2006 = -102006;
        this.MsgType_Core_GetNewAddress_2101 = -102101;
        this.MsgType_Core_GetMiningInfo_2102 = -102102;
        this.MsgType_Core_GetNetworkInfo_2103 = -102103;
        this.MsgType_Core_SignMessageWithPrivKey_2104 = -102104;
        this.MsgType_Core_VerifyMessage_2105 = -102105;
        this.MsgType_Core_DumpPrivKey_2106 = -102106;
        this.MsgType_Core_ListUnspent_2107 = -102107;
        this.MsgType_Core_BalanceByAddress_2108 = -102108;
        this.MsgType_Core_FundingBTC_2109 = -102109;
        this.MsgType_Core_BtcCreateMultiSig_2110 = -102110;
        this.MsgType_Core_Btc_ImportPrivKey_2111 = -102111;
        this.MsgType_Core_Omni_Getbalance_2112 = -102112;
        this.MsgType_Core_Omni_CreateNewTokenFixed_2113 = -102113;
        this.MsgType_Core_Omni_CreateNewTokenManaged_2114 = -102114;
        this.MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115 = -102115;
        this.MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116 = -102116;
        this.MsgType_Core_Omni_ListProperties_2117 = -102117;
        this.MsgType_Core_Omni_GetTransaction_2118 = -102118;
        this.MsgType_Core_Omni_GetProperty_2119 = -102119;
        this.MsgType_Core_Omni_FundingAsset_2120 = -102120;
        this.MsgType_Mnemonic_CreateAddress_3000 = -103000;
        this.MsgType_Mnemonic_GetAddressByIndex_3001 = -103001;
        this.MsgType_FundingCreate_Asset_AllItem_3100 = -103100;
        this.MsgType_FundingCreate_Asset_ItemById_3101 = -103101;
        this.MsgType_FundingCreate_Asset_ItemByChannelId_3102 = -103102;
        this.MsgType_FundingCreate_Asset_Count_3103 = -103103;
        this.MsgType_SendChannelOpen_32 = -100032;
        this.MsgType_RecvChannelOpen_32 = -110032;
        this.MsgType_SendChannelAccept_33 = -100033;
        this.MsgType_RecvChannelAccept_33 = -110033;
        this.MsgType_FundingCreate_SendAssetFundingCreated_34 = -100034;
        this.MsgType_FundingCreate_RecvAssetFundingCreated_34 = -110034;
        this.MsgType_FundingSign_SendAssetFundingSigned_35 = -100035;
        this.MsgType_FundingSign_RecvAssetFundingSigned_35 = -110035;
        this.MsgType_FundingCreate_SendBtcFundingCreated_340 = -100340;
        this.MsgType_FundingCreate_RecvBtcFundingCreated_340 = -110340;
        this.MsgType_FundingSign_SendBtcSign_350 = -100350;
        this.MsgType_FundingSign_RecvBtcSign_350 = -110350;
        this.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351 = -100351;
        this.MsgType_CommitmentTx_RecvCommitmentTransactionCreated_351 = -110351;
        this.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352 = -100352;
        this.MsgType_CommitmentTxSigned_RecvRevokeAndAcknowledgeCommitmentTransaction_352 = -110352;
        this.MsgType_ChannelOpen_AllItem_3150 = -103150;
        this.MsgType_ChannelOpen_ItemByTempId_3151 = -103151;
        this.MsgType_ChannelOpen_Count_3152 = -103152;
        this.MsgType_ChannelOpen_DelItemByTempId_3153 = -103153;
        this.MsgType_GetChannelInfoByChannelId_3154 = -103154;
        this.MsgType_GetChannelInfoByDbId_3155 = -103155;
        this.MsgType_CheckChannelAddessExist_3156 = -103156;
        this.MsgType_CommitmentTx_ItemsByChanId_3200 = -103200;
        this.MsgType_CommitmentTx_ItemById_3201 = -103201;
        this.MsgType_CommitmentTx_Count_3202 = -103202;
        this.MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203 = -103203;
        this.MsgType_CommitmentTx_LatestRDByChanId_3204 = -103204;
        this.MsgType_CommitmentTx_LatestBRByChanId_3205 = -103205;
        this.MsgType_CommitmentTx_AllRDByChanId_3207 = -103207;
        this.MsgType_CommitmentTx_AllBRByChanId_3208 = -103208;
        this.MsgType_SendCloseChannelRequest_38 = -100038;
        this.MsgType_RecvCloseChannelRequest_38 = -110038;
        this.MsgType_SendCloseChannelSign_39 = -100039;
        this.MsgType_RecvCloseChannelSign_39 = -110039;
        this.MsgType_HTLC_FindPath_401 = -100401;
        this.MsgType_HTLC_Invoice_402 = -100402;
        this.MsgType_HTLC_SendAddHTLC_40 = -100040;
        this.MsgType_HTLC_RecvAddHTLC_40 = -110040;
        this.MsgType_HTLC_SendAddHTLCSigned_41 = -100041;
        this.MsgType_HTLC_RecvAddHTLCSigned_41 = -110041;
        this.MsgType_HTLC_SendVerifyR_45 = -100045;
        this.MsgType_HTLC_RecvVerifyR_45 = -110045;
        this.MsgType_HTLC_SendSignVerifyR_46 = -100046;
        this.MsgType_HTLC_RecvSignVerifyR_46 = -110046;
        this.MsgType_HTLC_SendRequestCloseCurrTx_49 = -100049;
        this.MsgType_HTLC_RecvRequestCloseCurrTx_49 = -110049;
        this.MsgType_HTLC_SendCloseSigned_50 = -100050;
        this.MsgType_HTLC_RecvCloseSigned_50 = -110050;
        this.MsgType_Atomic_SendSwap_80 = -100080;
        this.MsgType_Atomic_RecvSwap_80 = -110080;
        this.MsgType_Atomic_SendSwapAccept_81 = -100081;
        this.MsgType_Atomic_RecvSwapAccept_81 = -110081;
    }
}
