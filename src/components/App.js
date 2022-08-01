import React, { Component } from 'react';
import './App.css';
import Navbar from './Navbar'
import Content from './Content'
import { loadWeb3, loadAccount, loadToken, loadExchange } from '../store/interactions'
import { contractsLoadedSelector } from '../store/selectors'
import { connect } from 'react-redux';

class App extends Component {
  componentDidMount() {
    this.loadBlockchainData(this.props.dispatch)
  }
  async loadBlockchainData(dispatch) {
    const web3 = await loadWeb3(dispatch)
    const networkId = await web3.eth.net.getId()
    await loadAccount(dispatch, web3)

    // Abi and Contract address from Token are needed to create the contract
    const token = await loadToken(dispatch, networkId, web3)
    if (!token) {
      window.alert('Token smart contract not detected in the current network')
    }

    const exchange = await loadExchange(dispatch, networkId, web3)
    if (!exchange) {
      window.alert('Exchange smart contract not dected in the current network')
    }
  }

  render() {
    return (
      <div>
        <Navbar />
        {this.props.contractsLoaded ? <Content /> : <div className='content'></div>}
      </div >
    );
  }
}

function mapStateToProps(state) {
  return {
    contractsLoaded: contractsLoadedSelector(state)
  }
}

export default connect(mapStateToProps)(App);
