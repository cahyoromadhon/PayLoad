// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol"; 

contract PayLoadGateway {
    
    address public owner;           // Alamat Platform PayLoad
    uint256 public feeBasisPoints;

    event PaymentReceived(
        bytes32 indexed orderId,
        address indexed payer,
        uint256 totalAmount,
        uint256 platformFee,
        address indexed merchant,
        uint256 timestamp
    );

    event FeeUpdated(uint256 newFeeBasisPoints);

    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya Owner yang boleh akses");
        _;
    }

    constructor() {
        owner = msg.sender;
        feeBasisPoints = 250; // Default fee 2.5% (250 dari 10000)
    }

    function pay(bytes32 _orderId, address _merchant) external payable {
        require(msg.value > 0, "PayLoad: Payment must be > 0");
        require(_merchant != address(0), "PayLoad: Invalid merchant address");

        // 1. Hitung potongan fee platform
        uint256 platformShare = (msg.value * feeBasisPoints) / 10000;
        uint256 merchantShare = msg.value - platformShare;

        // 2. Transfer jatah Merchant (97.5%)
        (bool successMerchant, ) = _merchant.call{value: merchantShare}("");
        require(successMerchant, "PayLoad: Transfer to merchant failed");

        // 3. Transfer jatah Platform (2.5%) ke dompet kita (owner)
        if (platformShare > 0) {
            (bool successPlatform, ) = owner.call{value: platformShare}("");
            require(successPlatform, "PayLoad: Transfer to platform failed");
        }

        // 4. Emit event
        emit PaymentReceived(_orderId, msg.sender, msg.value, platformShare, _merchant, block.timestamp);
    }

    // Fungsi Admin: Update besaran fee
    function setFee(uint256 _newFeeBasisPoints) external onlyOwner {
        require(_newFeeBasisPoints <= 1000, "PayLoad: Fee too high (max 10%)");
        feeBasisPoints = _newFeeBasisPoints;
        emit FeeUpdated(_newFeeBasisPoints);
    }

    // Fungsi Admin: Ganti alamat owner penerima fee
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "PayLoad: Invalid address");
        owner = _newOwner;
    }
}