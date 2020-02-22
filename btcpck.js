var bitcoin = require('bitcoinjs-lib')
var bip39 = require('bip39')
const bip32 = require('bip32')


function generateMnemonic(size = 128) {
    return bip39.generateMnemonic(size);
}

function generateWalletInfo(mnemonic, index, isTestNet = false) {
    let seedHex = btctool.bip39.mnemonicToSeedSync(mnemonic, "");
    console.info('seed: ', seedHex);
    let root = btctool.bip32.fromSeed(seedHex);
    console.info(root);
    let child0 = root.derivePath("m/44'/0'/0'/0/" + index);
    let network = btctool.bitcoin.networks.bitcoin;
    networkName = "bitcoin"
    if (isTestNet) {
        child0 = root.derivePath("m/44'/1'/0'/0/" + index);
        network = btctool.bitcoin.networks.testnet;
        networkName = "testnet"
    }
    let keyPair = btctool.bitcoin.ECPair.fromPrivateKey(child0.privateKey, {
        compressed: true,
        network: network
    });

    let walletAddress = btctool.bitcoin.payments.p2pkh({
        pubkey: child0.publicKey,
        network
    }).address;
    return { "index": index, "address": walletAddress, "pubkey": child0.publicKey.toString("hex"), "wif": keyPair.toWIF(), "network": networkName };
}

function generateMnemonic() {
    return bip39.generateMnemonic(256);
}

module.exports = {
    bitcoin,
    bip39,
    bip32,
    generateMnemonic,
    generateWalletInfo
}