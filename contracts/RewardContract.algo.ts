import { Contract } from '@algorandfoundation/tealscript';

/**
 * RewardContract - Decentralized Learning Reward Distribution
 *
 * This smart contract holds ASA tokens and automatically distributes them
 * when a validator approves a learner's submission.
 *
 * Key Features:
 * - Trustless: Code guarantees payment, not humans
 * - Transparent: All transactions on-chain
 * - Automated: Approval triggers instant reward
 */
class RewardContract extends Contract {
  /**
   * State Variables
   */

  // Address of the validator who can approve submissions
  validator = GlobalStateKey<Address>();

  // The ASA ID to distribute as rewards
  asaId = GlobalStateKey<uint64>();

  // Amount of ASA to give per approval (e.g., 100 tokens)
  rewardAmount = GlobalStateKey<uint64>();

  /**
   * Initialize the contract on deployment
   *
   * @param validator - Address that can approve submissions
   * @param asaId - The ASA token ID to distribute
   * @param rewardAmount - How many tokens per approval
   */
  createApplication(validator: Address, asaId: uint64, rewardAmount: uint64): void {
    this.validator.value = validator;
    this.asaId.value = asaId;
    this.rewardAmount.value = rewardAmount;
  }

  /**
   * Opt the contract into the ASA
   * Must be called once before the contract can receive ASA tokens
   *
   * Required because Algorand accounts must opt-in to receive any ASA
   */
  optInToAsa(): void {
    // Verify we're opting into the correct ASA
    assert(this.txn.assets[0] === AssetID.fromUint64(this.asaId.value));

    // Send 0 ASA to ourselves = opt-in
    sendAssetTransfer({
      assetReceiver: this.app.address,
      assetAmount: 0,
      xferAsset: AssetID.fromUint64(this.asaId.value),
    });
  }

  /**
   * Approve a learner's submission and automatically send reward
   *
   * Only the validator can call this method.
   * When called, the contract immediately transfers the reward amount
   * from its balance to the learner's address.
   *
   * @param learner - The learner's Algorand address to receive the reward
   */
  approveAndPay(learner: Address): void {
    // Security: Only validator can approve
    assert(this.txn.sender === this.validator.value);

    // Send ASA reward from contract to learner
    sendAssetTransfer({
      assetReceiver: learner,
      assetAmount: this.rewardAmount.value,
      xferAsset: AssetID.fromUint64(this.asaId.value),
    });
  }

  /**
   * Get the contract's current ASA balance (read-only)
   * Useful for checking how many rewards are left
   */
  @abi.readonly
  getBalance(): uint64 {
    return this.app.address.assetBalance(AssetID.fromUint64(this.asaId.value));
  }

  /**
   * Update the validator address (admin only)
   * Allows changing who can approve submissions
   *
   * @param newValidator - New validator address
   */
  updateValidator(newValidator: Address): void {
    // Only current validator can update
    assert(this.txn.sender === this.validator.value);
    this.validator.value = newValidator;
  }

  /**
   * Update the reward amount (admin only)
   * Allows changing how much each approval is worth
   *
   * @param newAmount - New reward amount in base units
   */
  updateRewardAmount(newAmount: uint64): void {
    // Only validator can update
    assert(this.txn.sender === this.validator.value);
    this.rewardAmount.value = newAmount;
  }
}

// Export the contract
export default RewardContract;
