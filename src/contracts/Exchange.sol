// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Token.sol';

contract Exchange {
  // Variables
  address public feeAccount; // the account that receives exchange fees
  uint256 public feePercent; // the fee to be charged in each transaction
  address constant ETHER = address(0); // stores Ether tokens in mapping with blank address
  mapping(address => mapping(address => uint256)) public tokens;

  // Internal EVM_REVERT string. Necessary to handle unmet require statements.
  string EVM_REVERT = 'VM Exception while processing transaction: revert.';

  // Events
  event Deposit(address _token, address _user, uint256 _amount, uint256 _balance);
  event Withdraw(address _token, address _user, uint256 _amount, uint256 _balance);

  constructor(address _feeAccount, uint256 _feePercent) {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }

  // Fallback - revert if Ether send to exchange
  fallback() external {
      revert();
  }

  function depositToken(address _token, uint256 _amount) public {
    // Don't allow Ether deposits
    require(_token != ETHER, EVM_REVERT);
    // Send tokens to this contract
    require(Token(_token).transferFrom(msg.sender, address(this), _amount), EVM_REVERT);
    
    // Manage deposit
    tokens[_token][msg.sender] += _amount;

    // Emit event
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function withdrawToken(address _token, uint256 _amount) public {
    require(_token != ETHER, EVM_REVERT);
    require(_amount <= tokens[_token][msg.sender], EVM_REVERT);
    require(Token(_token).transfer(msg.sender, _amount), EVM_REVERT);
    tokens[_token][msg.sender] -= _amount;
    emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function depositEther() payable public {
    tokens[ETHER][msg.sender] += msg.value;
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  function withdrawEther(uint256 _amount) public {
    require(_amount <= tokens[ETHER][msg.sender], EVM_REVERT);
    tokens[ETHER][msg.sender] -= _amount;
    payable(msg.sender).transfer(_amount);
    emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
  }

  function balanceOf(address _token, address _user) public view returns(uint256) {
    return tokens[_token][_user];
  } 

}