// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Token {
  // Variables
  string public name = "PacheCoin";
  string public symbol = "PCH";
  uint256 public decimals = 18;
  uint256 public totalSupply;
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  // Internal EVM_REVERT string. Necessary to handle unmet require statements.
  string EVM_REVERT = 'VM Exception while processing transaction: revert.';
  
  // Events
  event Transfer(address indexed _from, address indexed _to, uint256 _value);
  event Approval(address indexed _owner, address indexed _spender, uint256 _value);
  
  constructor() {
    totalSupply = 1000000 * (10 ** decimals);
    balanceOf[msg.sender] = totalSupply;
  }

  // Send token
  function transfer(address _to, uint256 _value) public returns (bool success) {
    require(balanceOf[msg.sender] >= _value, EVM_REVERT);
    _transfer(msg.sender, _to, _value);
    return true;
  }

  // Transfers from
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
    require(balanceOf[_from] >= _value, EVM_REVERT);
    require(allowance[_from][msg.sender] >= _value, EVM_REVERT);
    allowance[_from][msg.sender] -= _value;
    _transfer(_from, _to, _value);
    return true;
  }

  // Approve tokens
  function approve(address _spender, uint256 _value) public returns (bool success) {
    require(_spender != address(0));
    allowance[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  // Internal transfer function
  function _transfer(address _from, address _to, uint256 _value) internal {
    require(_from != address(0));
    require(_to != address(0));
    balanceOf[_from] -= _value;
    balanceOf[_to] += _value;
    emit Transfer(_from, _to, _value);
  }
}
