var bitcoin = require('bitcoinjs-lib')
var bip39 = require('bip39')
const bip32 = require('bip32')


function generateMnemonic(size = 128) {
    return bip39.generateMnemonic(size);
}

function validateMnemonic(mnemonic) {
    return bip39.validateMnemonic(mnemonic);
}

function generateWalletInfo(mnemonic, index, isTestNet = false) {
    let retNode = new Object();

    if (validateMnemonic(mnemonic) == false) {
        retNode.status = false;
        retNode.msg = "error mnemonic: " + mnemonic;
        return retNode;
    }
    if (index == null || index < 0) {
        retNode.status = false;
        retNode.msg = "error index " + index;
        return retNode;
    }
    let seedHex = bip39.mnemonicToSeedSync(mnemonic, "");
    let root = bip32.fromSeed(seedHex);
    let child0 = root.derivePath("m/44'/0'/0'/0/" + index);
    let network = bitcoin.networks.bitcoin;
    networkName = "bitcoin"
    if (isTestNet) {
        child0 = root.derivePath("m/44'/1'/0'/0/" + index);
        network = bitcoin.networks.testnet;
        networkName = "testnet"
    }
    let keyPair = bitcoin.ECPair.fromPrivateKey(child0.privateKey, {
        compressed: true,
        network: network
    });

    let walletAddress = bitcoin.payments.p2pkh({
        pubkey: child0.publicKey,
        network
    }).address;
    retNode.status = true;
    retNode.msg = "success";
    retNode.result = { "index": index, "address": walletAddress, "pubkey": child0.publicKey.toString("hex"), "wif": keyPair.toWIF(), "network": networkName }
    return retNode
}

module.exports = {
    bitcoin,
    bip39,
    bip32,
    generateMnemonic,
    validateMnemonic,
    generateWalletInfo
}