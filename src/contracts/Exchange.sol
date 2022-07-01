// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Token.sol';

contract Exchange {
  // Variables
  address public feeAccount; // the account that receives exchange fees
  uint256 public feePercent; // the fee to be charged in each transaction
  address constant ETHER = address(0); // stores Ether tokens in mapping with blank address
  mapping(address => mapping(address => uint256)) public tokens;
  mapping(uint256 => _Order) public orders;
  uint256 public orderCount;
  mapping(uint256 => bool) public orderCancelled;
  mapping(uint256 => bool) public orderFilled;

  // Internal EVM_REVERT string. Necessary to handle unmet require statements.
  string EVM_REVERT = 'VM Exception while processing transaction: revert.';

  // Events
  event Deposit(address _token, address _user, uint256 _amount, uint256 _balance);
  event Withdraw(address _token, address _user, uint256 _amount, uint256 _balance);
  event Order(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);
  event Cancel(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);
  event Trade(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, address userFill, uint256 timestamp);

  // a way to model the order
  struct _Order {
    uint256 id;
    address user;
    address tokenGet;
    uint256 amountGet;
    address tokenGive;
    uint256 amountGive;
    uint256 timestamp;
  }

    struct _Cancel {
    uint256 id;
    address user;
    address tokenGet;
    uint256 amountGet;
    address tokenGive;
    uint256 amountGive;
    uint256 timestamp;
  }

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

  function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
    orderCount += 1;
    orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
  }

  function cancelOrder(uint256 _id) public {
    _Order storage _order = orders[_id];
    require(address(_order.user) == msg.sender, EVM_REVERT);
    require(_order.id == _id, EVM_REVERT);
    orderCancelled[_id] = true;
    emit Cancel(orderCount, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, _order.timestamp);

  }

  function fillOrder(uint256 _id) public {
    require(_id > 0 && _id <= orderCount, EVM_REVERT);
    require(!orderFilled[_id], EVM_REVERT);
    require(!orderCancelled[_id], EVM_REVERT);

    _Order storage _order = orders[_id];
    _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
    orderFilled[_order.id] = true;
  }

  function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
    uint256 _feeAmount = (_amountGive * feePercent) / 100;
    
    tokens[_tokenGet][msg.sender] -= (_amountGet + _feeAmount);
    tokens[_tokenGet][_user] += _amountGet;
    tokens[_tokenGet][feeAccount] += _feeAmount;
    tokens[_tokenGive][_user] -= _amountGive;
    tokens[_tokenGive][msg.sender] += _amountGive;
    emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, block.timestamp);
  }
}