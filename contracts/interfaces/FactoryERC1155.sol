//SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.7.0;

/**
 * This is a generic factory contract that can be used to mint tokens. The configuration
 * for minting is specified by an _optionId, which can be used to delineate various
 * ways of minting.
 *
 * https://docs.opensea.io/docs/2-custom-item-sale-contract
 */
interface FactoryERC1155 {
  /**
   * Returns the name of this factory.
   */
  function name() external view returns (string memory);

  /**
   * Returns the symbol for this factory.
   */
  function symbol() external view returns (string memory);

  /**
   * Number of options the factory supports.
   */
  function numOptions() external view returns (uint256);

  /**
   * @dev Returns whether the option ID can be minted. Can return false if the developer wishes to
   * restrict a total supply per option ID (or overall).
   */
  function canMint(uint256 _optionId, uint256 _amount) external view returns (bool);

  /**
   * Indicates that this is a factory contract. Ideally would use EIP 165 supportsInterface()
   */
  function supportsFactoryInterface() external view returns (bool);

  /**
   * Indicates the Wyvern schema name for assets in this lootbox, e.g. "ERC1155"
   */
  function factorySchemaName() external view returns (string memory);

  /**
   * @dev Mints asset(s) in accordance to a specific address with a particular "option". This should be
   * callable only by the contract owner or the owner's Wyvern Proxy (later universal login will solve this).
   * Options should also be delineated 0 - (numOptions() - 1) for convenient indexing.
   * @param _optionId the option id
   * @param _toAddress address of the future owner of the asset(s)
   * @param _amount amount of the option to mint
   * @param _data Extra data to pass during safeTransferFrom
   */
  function mint(
    uint256 _optionId,
    address _toAddress,
    uint256 _amount,
    bytes calldata _data
  ) external payable;
}
