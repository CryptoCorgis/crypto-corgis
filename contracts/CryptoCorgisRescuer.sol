//SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/Math.sol";

import "./interfaces/Breeder.sol";

contract CryptoCorgisRescuer is Ownable {
  using SafeMath for uint256;

  address payable public treasuryAddress;
  address public breederAddress;
  uint256 public discountPerBlockEth;
  uint256 public floorPriceEth;

  constructor(
    address payable _treasuryAddress,
    address _breederAddress,
    uint256 _discountPerBlockEth,
    uint256 _floorPriceEth
  ) {
    treasuryAddress = _treasuryAddress;
    breederAddress = _breederAddress;
    discountPerBlockEth = _discountPerBlockEth;
    floorPriceEth = _floorPriceEth;
  }

  receive() external payable {}

  function setDiscountPerBlock(uint256 _discountPerBlockEth) public onlyOwner {
    discountPerBlockEth = _discountPerBlockEth;
  }

  function setFloorPrice(uint256 _floorPriceEth) public onlyOwner {
    floorPriceEth = _floorPriceEth;
  }

  function returnFunds() public onlyOwner {
    treasuryAddress.transfer(address(this).balance);
  }

  function rescueCorgi(uint256 _blockNumber, bytes calldata _data) public payable {
    uint256 fullPrice = Breeder(breederAddress).priceForCorgi(Breeder(breederAddress).corgisMinted() + 1);
    uint256 discountEth = block.number.sub(_blockNumber).mul(discountPerBlockEth);
    (bool _, uint256 discountedPriceEth) = fullPrice.trySub(discountEth);
    uint256 finalPrice = Math.max(discountedPriceEth, floorPriceEth);
    require(msg.value >= finalPrice, "CryptoCorgisRescuer: Insufficient funds to rescue a Crypto Corgi.");
    msg.sender.transfer(msg.value.sub(finalPrice));
    Breeder(breederAddress).mint{ value: fullPrice }(_blockNumber, msg.sender, 1, msg.sender, _data);
  }
}
