// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {KYCRegistry} from "../src/KYCRegistry.sol";
import {PropertyShareToken} from "../src/PropertyShareToken.sol";
import {CertificateNFT} from "../src/CertificateNFT.sol";
import {Oracle} from "../src/Oracle.sol";
import {DexIntegrationHelper} from "../src/DexIntegrationHelper.sol";
import {NFTEscrow} from "../src/NFTEscrow.sol";

/**
 * @title Deploy
 * @dev Script de déploiement pour tous les contrats
 * @notice Déploie les contrats dans l'ordre : KYC Registry -> Tokens -> Oracle -> DEX Helper
 */
contract Deploy is Script {
    address public kycRegistry;
    address public fundToken;
    address public certificateNFT;
    address public oracle;
    address public escrowNFT;

    address public signer;

    function run() external {
        signer = vm.envAddress("ORACLE_SIGNER_ADDRESS");
        kycRegistry = vm.envAddress("KYC_CONTRACT_ADDRESS");
        fundToken = vm.envAddress("FUND_CONTRACT_ADDRESS");
        certificateNFT = vm.envAddress("CERTIFICATE_NFT_ADDRESS");
        oracle = vm.envAddress("ORACLE_CONTRACT_ADDRESS");
        escrowNFT = vm.envAddress("ESCROW_NFT_ADDRESS");

        vm.startBroadcast();

        if (kycRegistry == address(0)) {
            KYCRegistry kyc = new KYCRegistry();
            kycRegistry = address(kyc);

            kyc.addWhitelist(msg.sender);
        }

        if (fundToken == address(0)) {
            PropertyShareToken fund = new PropertyShareToken(
                "Property Share Token",
                "PST",
                kycRegistry
            );
            fundToken = address(fund);
        }

        if (certificateNFT == address(0)) {
            CertificateNFT cert = new CertificateNFT(
                "Property Certificate NFT",
                "PCNFT",
                kycRegistry
            );
            certificateNFT = address(cert);
        }

        if (oracle == address(0)) {
            Oracle oracleContract = new Oracle(signer);
            oracle = address(oracleContract);
        }

        if (escrowNFT == address(0)) {
            NFTEscrow escrow = new NFTEscrow(
                signer
            );
            escrowNFT = address(escrow);
        }

        // DexIntegrationHelper dex = new DexIntegrationHelper(uniswapRouter);
        // dexHelper = address(dex);

        vm.stopBroadcast();
    }
}
