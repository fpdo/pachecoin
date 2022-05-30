const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");

module.exports = function (deployer) {
  deployer.deploy(Token);
};
