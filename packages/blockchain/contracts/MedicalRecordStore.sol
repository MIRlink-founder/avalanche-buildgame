// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedicalRecordStore {
    event MedicalRecordStored(
        uint256 indexed medicalRecordId,
        bytes32 dataHash,
        bytes encryptedPayload
    );

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function storeRecord(
        uint256 medicalRecordId,
        bytes32 dataHash,
        bytes calldata encryptedPayload
    ) external onlyOwner {
        emit MedicalRecordStored(medicalRecordId, dataHash, encryptedPayload);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}