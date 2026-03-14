// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StealthKeyRegistry
 * @notice On-chain registry for stealth meta-addresses and ephemeral public keys.
 *         Employees register their stealth meta-keys here (or via ENS text records).
 *         HR publishes ephemeral public keys after each payroll run so employees
 *         can scan and derive their stealth spending keys.
 * @dev    Deployed on Base Sepolia / Base Mainnet.
 */
contract StealthKeyRegistry is Ownable {
    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────
    event StealthMetaKeyRegistered(
        address indexed registrant,
        bytes stealthMetaPublicKey
    );

    event EphemeralKeyPublished(
        address indexed publisher,
        uint256 indexed payrollRunId,
        bytes ephemeralPublicKey,
        address stealthAddress
    );

    event PayrollRunCreated(
        uint256 indexed payrollRunId,
        address indexed issuer,
        uint256 timestamp,
        uint256 recipientCount
    );

    // ──────────────────────────────────────────────
    // Storage
    // ──────────────────────────────────────────────

    /// @notice Mapping: employee address => compressed stealth meta public key
    mapping(address => bytes) public stealthMetaKeys;

    /// @notice Mapping: payroll run ID => array of ephemeral key entries
    mapping(uint256 => EphemeralKeyEntry[]) public payrollEphemeralKeys;

    /// @notice Counter for payroll run IDs
    uint256 public payrollRunCounter;

    /// @notice Authorized issuers (HR multisig addresses)
    mapping(address => bool) public authorizedIssuers;

    struct EphemeralKeyEntry {
        bytes ephemeralPublicKey;
        address stealthAddress;
        uint256 timestamp;
    }

    // ──��────────���──────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────

    modifier onlyAuthorizedIssuer() {
        require(
            authorizedIssuers[msg.sender] || msg.sender == owner(),
            "StealthKeyRegistry: caller is not an authorized issuer"
        );
        _;
    }

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    constructor() Ownable(msg.sender) {
        payrollRunCounter = 0;
    }

    // ──────────────────────────────────────────────
    // Admin Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Add an authorized issuer (e.g., HR multisig)
     * @param issuer The address to authorize
     */
    function addAuthorizedIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
    }

    /**
     * @notice Remove an authorized issuer
     * @param issuer The address to de-authorize
     */
    function removeAuthorizedIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
    }

    // ─────────────────────────────���───────��────────
    // Employee Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Register or update your stealth meta public key
     * @param stealthMetaPublicKey The compressed secp256k1 public key (33 bytes)
     */
    function registerStealthMetaKey(
        bytes calldata stealthMetaPublicKey
    ) external {
        require(
            stealthMetaPublicKey.length == 33,
            "StealthKeyRegistry: invalid key length (expected 33 bytes compressed)"
        );
        stealthMetaKeys[msg.sender] = stealthMetaPublicKey;
        emit StealthMetaKeyRegistered(msg.sender, stealthMetaPublicKey);
    }

    // ──────────────────────────────────────────────
    // HR / Issuer Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Publish a batch of ephemeral keys for a payroll run.
     *         Called by the HR dashboard after generating stealth addresses.
     * @param ephemeralPublicKeys Array of ephemeral public keys (one per employee)
     * @param stealthAddresses Array of corresponding stealth addresses
     * @return payrollRunId The ID assigned to this payroll run
     */
    function publishPayrollRun(
        bytes[] calldata ephemeralPublicKeys,
        address[] calldata stealthAddresses
    ) external onlyAuthorizedIssuer returns (uint256 payrollRunId) {
        require(
            ephemeralPublicKeys.length == stealthAddresses.length,
            "StealthKeyRegistry: array length mismatch"
        );
        require(
            ephemeralPublicKeys.length > 0,
            "StealthKeyRegistry: empty batch"
        );

        payrollRunId = payrollRunCounter++;

        for (uint256 i = 0; i < ephemeralPublicKeys.length; i++) {
            payrollEphemeralKeys[payrollRunId].push(
                EphemeralKeyEntry({
                    ephemeralPublicKey: ephemeralPublicKeys[i],
                    stealthAddress: stealthAddresses[i],
                    timestamp: block.timestamp
                })
            );

            emit EphemeralKeyPublished(
                msg.sender,
                payrollRunId,
                ephemeralPublicKeys[i],
                stealthAddresses[i]
            );
        }

        emit PayrollRunCreated(
            payrollRunId,
            msg.sender,
            block.timestamp,
            ephemeralPublicKeys.length
        );
    }

    // ──────────────────────────────────────────────
    // View Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Get the stealth meta key for an employee
     * @param employee The employee's main address
     * @return The compressed stealth meta public key
     */
    function getStealthMetaKey(
        address employee
    ) external view returns (bytes memory) {
        return stealthMetaKeys[employee];
    }

    /**
     * @notice Get the number of ephemeral key entries for a payroll run
     * @param payrollRunId The payroll run ID
     * @return The count of entries
     */
    function getPayrollRunEntryCount(
        uint256 payrollRunId
    ) external view returns (uint256) {
        return payrollEphemeralKeys[payrollRunId].length;
    }

    /**
     * @notice Get a specific ephemeral key entry from a payroll run
     * @param payrollRunId The payroll run ID
     * @param index The index within the run
     * @return ephemeralPublicKey The ephemeral public key bytes
     * @return stealthAddress The derived stealth address
     * @return timestamp When the entry was published
     */
    function getEphemeralKeyEntry(
        uint256 payrollRunId,
        uint256 index
    )
        external
        view
        returns (
            bytes memory ephemeralPublicKey,
            address stealthAddress,
            uint256 timestamp
        )
    {
        EphemeralKeyEntry storage entry = payrollEphemeralKeys[payrollRunId][
            index
        ];
        return (
            entry.ephemeralPublicKey,
            entry.stealthAddress,
            entry.timestamp
        );
    }
}
