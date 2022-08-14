// content_tips.js
// Const for Tips


/**
 * Tips for the fist time you open the page.
 */
const kTipsInit = 'You should firstly connect to an OBD node.';

/**
 * Tips for after connect to an OBD node
 */
const kTipsAfterConnectOBD = 'Next you need to log in.';

/**
 * Tips for openning a channel.
 */
const kTipsAfterLogin = 'You have logged in. Next you can create a channel with a remote peer using openChannel interface.';

/**
 * Tips for waiting for response.
 */
const kTipsAfterOpenChannel = 'You requested to open channel. Wait for response from your counterparty, who will accept using acceptChannel(...) .';

/**
 * Tips for waiting funding.
 */
const kTipsAfterAcceptChannel = 'You accepted the request to open a channel. Wait for funding bitcoin by your counterparty.';

/**
 * Tips for funding btc.
 */
const kTipsAfterFundingBitcoin = 'Funding bitcoin is finished successfully and you should notify your counterparty now.';

/**
 * Tips for 
 */
const kTipsAfterBitcoinFundingCreated = 'Funding bitcoin notification is sent. Wait for the response from your counterparty (bitcoinFundingSigned) .';

/**
 * Tips for 
 */
const kTipsFirstAfterBitcoinFundingSigned = 'You have signed the first bitcoin funding message. Wait for the second bitcoin funding message from your counterparty.';

/**
 * Tips for 
 */
const kTipsSecondAfterBitcoinFundingSigned = 'You have signed the second bitcoin funding message. Wait for the third bitcoin funding message from your counterparty.';

/**
 * Tips for 
 */
const kTipsThirdAfterBitcoinFundingSigned = 'You have signed the third bitcoin funding message. Wait for the asset funding message from your counterparty.';

/**
 * Tips for 
 */
const kTipsAfterFundingAsset = 'Funding asset is finished successfully and you should notify the counterparty now.';

/**
 * Tips for 
 */
const kTipsAfterAssetFundingCreated = 'Funding asset notification is sent. Wait for the response from your counterparty (assetFundingSigned) .';

/**
 * Tips for 
 */
const kTipsAfterAssetFundingSigned = 'You have signed asset funding message. The channel has been created and funded successfully.';

/**
 * Tips for 
 */
const kTipsAfterCommitmentTransactionCreated = 'You have sent a RSMC. Wait for the response from your counterparty.';

/**
 * Tips for 
 */
const kTipsAfterCommitmentTransactionAccepted = 'You have accepted a RSMC, check your balance and see the payment successfully recorded.';

/**
 * Tips for 
 */
const kTipsAfterHTLCFindPath = 'You found a HTLC payment path successfully, the next operation is AddHTLC.';

/**
 * Tips for 
 */
const kTipsAfterAddHTLC = 'You have requested to add HTLC. Wait for the response from your counterparty.';

/**
 * Tips for
 */
const kTipsAfterHTLCSigned = 'You have accepted the request to add an HTLC. Now, you should forward the secret key R to your counterparty.';

/**
 * Tips for 
 */
const kTipsAfterForwardR = 'You have forwarded R. Wait for the response from your counterparty.';

/**
 * Tips for 
 */
const kTipsAfterSignR = 'You have signed the R. This HTLC has completed and you can request to close it.';

/**
 * Tips for 
 */
const kTipsAfterCloseHTLC = 'You have requested to close the HTLC. Wait for response from counterparty.';

/**
 * Tips for 
 */
const kTipsAfterCloseHTLCSigned = 'You have confirmed to close the HTLC, and released the resource of this channel it occupied. The life cycle of this HTLC is over. The channel now is available for other operations.';

/**
 * Tips for 
 */
const kTipsAfterCloseChannel = 'You requested to close the channel. Wait for response from counterparty.';

/**
 * Tips for 
 */
const kTipsAfterCloseChannelSigned = 'You confirmed to close the channel. You may want to create a new channel with someone else.';

/**
 * Tips for 
 */
const kTipsAfterAtomicSwap = 'You requested to send an atomic swap. Wait for the response from your counterparty.';

/**
 * Tips for 
 */
const kTipsAfterAcceptSwap = 'You accepted an atomic swap. ';

/**
 * Tips for 
 */
const kTips110032 = 'You received a request to open a channel.';

/**
 * Tips for 
 */
const kTips110033 = 'Your counterparty accepted to open channel, you should start to fund bitcoin.';

/**
 * Tips for 
 */
const kTipsFirst110340 = 'You received a notification, please confirm the first bitcoin funding.';

/**
 * Tips for 
 */
const kTipsSecond110340 = 'You received a notification, please confirm the second bitcoin funding.';

/**
 * Tips for 
 */
const kTipsThird110340 = 'You received a notification, please confirm the third bitcoin funding.';

/**
 * Tips for 
 */
const kTipsFirst110350 = 'Counterparty confirmed bitcoin funding, you can start the second bitcoin funding.';

/**
 * Tips for 
 */
const kTipsSecond110350 = 'Counterparty confirmed funding bitcoin, you can start the third bitcoin funding.';

/**
 * Tips for 
 */
const kTipsThird110350 = 'Counterparty confirmed funding bitcoin. Now, you should fund asset.';

/**
 * Tips for 
 */
const kTips110034 = 'You received a notification, please confirm asset funding.';

/**
 * Tips for 
 */
const kTips110035 = 'Counterparty confirmed asset funding. Now, the channel has been successfully created and funded.';

/**
 * Tips for 
 */
const kTips110351 = 'You received a notification, please confirm the RSMC.';

/**
 * Tips for 
 */
const kTips110352 = 'Counterparty confirmed the RSMC. Your balance is changed. You can start another RSMC.';

/**
 * Tips for 
 */
const kTips110040 = 'You received a request to add HTLC.';

/**
 * Tips for 
 */
const kTips110041 = 'Counterparty accepted the HTLC. Wait for secret R from counterparty.';

/**
 * Tips for 
 */
const kTips110045 = 'You received the secret R from counterparty and you can sign the R.';

/**
 * Tips for 
 */
const kTips110046 = 'Counterparty has signed the R. The HTLC is completed and you can request to terminate it.';

/**
 * Tips for 
 */
const kTips110049 = 'You received a request to close current HTLC.';

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
const kTips110039 = 'Counterparty has accepted to close the channel. This channel is closed.';

/**
 * Tips for 
 */
const kTipsNoLocalData = 'The channel you selected has no locally stored data.';


//----------------------------------------------------------------
// Others

/**
 * The path found is not for the current channel, please change to another channel 
 */
const k100401 = 'The path found is not for the current channel, and will switch to another.';

/**
 * You did not confirm to switch the channel, the next operation may be wrong
 */
const k100401_ClickCancel = 'You did not confirm to switch the channel, the next operation may be wrong.';

/**
 * Pay Invoice is processing
 */
const kPayInvoice = 'Pay Invoice is processing ... Wait for response from counterparty.';

/**
 * Display Processing...
 */
const kProcessing = 'Processing...';

/**
 * Not Found the R
 */
const kNotFoundR = 'Multi-hop is processing...';

/**
 *  
 */
const kMultiHopContinue = 'Counterparty has accepted to close HTLC. Multi-hop continues ...';

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
const kStatusCloseChannelSigned = 0;

/**
 * atomicSwap done
 */
const kStatusAtomicSwap = 26;

/**
 * acceptSwap done
 */
const kStatusAcceptSwap = 27;

//----------------------------------------------------------------
// Const

/**
 * page_size
 */
const kPageSize = 5;

/**
 * page_index
 */
const kPageIndex = 1;

/**
 * 
 */
const kIsSender = '0';

/**
 * 
 */
const kIsReceiver = '1';
