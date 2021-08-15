//SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.7.0;

interface Breeder {
  function corgisMinted() external returns (uint256);

  function priceForCorgi(uint256 _corgiNumber) external pure returns (uint256);

  function mint(
    uint256 _blockNumber,
    address _toAddress,
    uint256 _amount,
    address payable _refundAddress,
    bytes calldata _data
  ) external payable;
}
