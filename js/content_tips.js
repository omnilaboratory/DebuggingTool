// content_tips.js
// Const for Tips


/**
 * Tips for 
 */
const kTipsInit = 'You should connect to an OBD node first.';

/**
 * Tips for after connect to an OBD node
 */
const kTipsAfterConnectOBD = 'Next you could be log in.';

/**
 * Tips for 
 */
const kTipsAfterLogin = 'You have logged in. Next you can create a channel with openChannel api.';

/**
 * Tips for 
 */
const kTipsAfterOpenChannel = 'You request to open channel. Waiting for response from counterparty (acceptChannel) .';

/**
 * Tips for 
 */
const kTipsAfterAcceptChannel = 'You have accepted the request to open channel. Waiting for funding bitcoin from counterparty.';

/**
 * Tips for 
 */
const kTipsAfterFundingBitcoin = 'Funding bitcoin done and you should notify counterparty.';

/**
 * Tips for 
 */
const kTipsAfterBitcoinFundingCreated = 'Funding bitcoin notification sent. Waiting for response from counterparty (bitcoinFundingSigned) .';

/**
 * Tips for 
 */
const kTipsFirstAfterBitcoinFundingSigned = 'You have signed first bitcoin funding. Waiting for second funding bitcoin from counterparty.';

/**
 * Tips for 
 */
const kTipsSecondAfterBitcoinFundingSigned = 'You have signed second bitcoin funding. Waiting for third funding bitcoin from counterparty.';

/**
 * Tips for 
 */
const kTipsThirdAfterBitcoinFundingSigned = 'You have signed third bitcoin funding. Waiting for funding asset from counterparty.';

/**
 * Tips for 
 */
const kTipsAfterFundingAsset = 'Funding asset done and you should notify counterparty.';

/**
 * Tips for 
 */
const kTipsAfterAssetFundingCreated = 'Funding asset notification sent. Waiting for response from counterparty (assetFundingSigned) .';

/**
 * Tips for 
 */
const kTipsAfterAssetFundingSigned = 'You have signed asset funding. The channel has been created.';

/**
 * Tips for 
 */
const kTipsAfterCommitmentTransactionCreated = 'You have sent a RSMC transfer. Waiting for response from counterparty.';

/**
 * Tips for 
 */
const kTipsAfterCommitmentTransactionAccepted = 'You have accepted a RSMC transfer.';

/**
 * Tips for 
 */
const kTipsAfterAddHTLC = 'You have requested to add HTLC. Waiting for response from counterparty.';

/**
 * Tips for
 */
const kTipsAfterHTLCSigned = 'You have accepted the request to HTLC. Now, you should be forward R to counterparty.';

/**
 * Tips for 
 */
const kTipsAfterForwardR = 'You have forwarded R. Waiting for response from counterparty.';

/**
 * Tips for 
 */
const kTipsAfterSignR = 'You have signed the R. The HTLC has completed and you can request to close the HTLC.';

/**
 * Tips for 
 */
const kTipsAfterCloseHTLC = 'You have requested to close the HTLC. Waiting for response from counterparty.';

/**
 * Tips for 
 */
const kTipsAfterCloseHTLCSigned = 'You have confirmed to close the HTLC. Next you can continue to use the channel.';

/**
 * Tips for 
 */
const kTipsAfterCloseChannel = 'You request to close the channel. Waiting for response from counterparty.';

/**
 * Tips for 
 */
const kTipsAfterCloseChannelSigned = 'You have confirmed to close the channel. Now you can create a new channel with counterparty.';

/**
 * Tips for 
 */
const kTipsAfterAtomicSwap = 'You request to send an atomic swap. Waiting for response from counterparty.';

/**
 * Tips for 
 */
const kTipsAfterAcceptSwap = 'You have accepted atomic swap. Next you can continue to use the channel.';

/**
 * Tips for 
 */
const kTips110032 = 'You received a request to open a channel.';

/**
 * Tips for 
 */
const kTips110033 = 'Counterparty accepted to open channel, you should be start to funding bitcoin.';

/**
 * Tips for 
 */
const kTipsFirst110340 = 'You received a notification to confirm first funding bitcoin.';

/**
 * Tips for 
 */
const kTipsSecond110340 = 'You received a notification to confirm second funding bitcoin.';

/**
 * Tips for 
 */
const kTipsThird110340 = 'You received a notification to confirm third funding bitcoin.';

/**
 * Tips for 
 */
const kTipsFirst110350 = 'Counterparty confirmed funding bitcoin, you can start second funding bitcoin.';

/**
 * Tips for 
 */
const kTipsSecond110350 = 'Counterparty confirmed funding bitcoin, you can start third funding bitcoin.';

/**
 * Tips for 
 */
const kTipsThird110350 = 'Counterparty confirmed funding bitcoin. Now, you should be funding asset.';

/**
 * Tips for 
 */
const kTips110034 = 'You received a notification to confirm funding asset.';

/**
 * Tips for 
 */
const kTips110035 = 'Counterparty confirmed funding asset. Now, the channel has been created.';

/**
 * Tips for 
 */
const kTips110351 = 'You received a notification to confirm the RSMC transfer.';

/**
 * Tips for 
 */
const kTips110352 = 'Counterparty confirmed the RSMC transfer.';

/**
 * Tips for 
 */
const kTips110040 = 'You received a request to add HTLC.';

/**
 * Tips for 
 */
const kTips110041 = 'Counterparty accepted the add HTLC. Waiting for forward R from counterparty.';

/**
 * Tips for 
 */
const kTips110045 = 'You received the R from counterparty and you can sign the R.';

/**
 * Tips for 
 */
const kTips110046 = 'Counterparty has signed the R. The HTLC has completed and you can request to close it.';

/**
 * Tips for 
 */
const kTips110049 = 'You received a request to close HTLC.';

/**
 * Tips for 
 */
const kTips110050 = 'Counterparty has accepted to close HTLC. Next you can continue to use the channel.';

/**
 * Tips for 
 */
const kTips110080 = 'You received a request to start an atomic swap';

/**
 * Tips for 
 */
const kTips110081 = 'Counterparty has accepted the atomic swap. Next you can continue to use the channel.';

/**
 * Tips for 
 */
const kTips110038 = 'You received a request to close the channel.';

/**
 * Tips for 
 */
const kTips110039 = 'Counterparty has accepted to close the channel. Next you can create a new channel.';

/**
 * Tips for 
 */
const kTipsNoLocalData = 'The channel you selected has no locally saved data.';

/**
 * Tips for 
 */
const kTips = '';


//----------------------------------------------------------------
// Status of a channel

/**
 * openChannel done
 */
const kStatusOpenChannel = 1;

/**
 * acceptChannel done
 */
const kStatusAcceptChannel = 2;

/**
 * first fundingBitcoin done
 */
const kStatusFirstFundingBitcoin = 3;

/**
 * first bitcoinFundingCreated done
 */
const kStatusFirstBitcoinFundingCreated = 4;

/**
 * first bitcoinFundingSigned done
 */
const kStatusFirstBitcoinFundingSigned = 5;

/**
 * second fundingBitcoin done
 */
const kStatusSecondFundingBitcoin = 6;

/**
 * second bitcoinFundingCreated done
 */
const kStatusSecondBitcoinFundingCreated = 7;

/**
 * second bitcoinFundingSigned done
 */
const kStatusSecondBitcoinFundingSigned = 8;

/**
 * third fundingBitcoin done
 */
const kStatusThirdFundingBitcoin = 9;

/**
 * third bitcoinFundingCreated done
 */
const kStatusThirdBitcoinFundingCreated = 10;

/**
 * third bitcoinFundingSigned done
 */
const kStatusThirdBitcoinFundingSigned = 11;

/**
 * fundingAsset done
 */
const kStatusFundingAsset = 12;

/**
 * assetFundingCreated done
 */
const kStatusAssetFundingCreated = 13;

/**
 * assetFundingSigned done
 */
const kStatusAssetFundingSigned = 14;

/**
 * commitmentTransactionCreated done
 */
const kStatusCommitmentTransactionCreated = 15;

/**
 * commitmentTransactionAccepted done
 */
const kStatusCommitmentTransactionAccepted = 16;

/**
 * payInvoice done
 */
const kStatusPayInvoice = 17;

/**
 * addHTLC done
 */
const kStatusAddHTLC = 18;

/**
 * HTLCSigned done
 */
const kStatusHTLCSigned = 19;

/**
 * forwardR done
 */
const kStatusForwardR = 20;

/**
 * signR done
 */
const kStatusSignR = 21;

/**
 * closeHTLC done
 */
const kStatusCloseHTLC = 22;

/**
 * closeHTLCSigned done
 */
const kStatusCloseHTLCSigned = 23;

/**
 * closeChannel done
 */
const kStatusCloseChannel = 24;

/**
 * closeChannelSigned done
 */
const kStatusCloseChannelSigned = 25;

/**
 * atomicSwap done
 */
const kStatusAtomicSwap = 26;

/**
 * acceptSwap done
 */
const kStatusAcceptSwap = 27;

/**
 * xxxx done
 */
const kStatus = 2;


