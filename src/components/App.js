import React, { Component } from 'react';
import './App.css';
import Web3 from 'web3';
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'
import { loadWeb3, loadAccount, loadToken, loadExchange } from '../store/interactions';
import { connect } from 'react-redux'

class App extends Component {
  componentDidMount() {
    this.loadBlockchainData(this.props.dispatch)
  }
  async loadBlockchainData(dispatch) {
    const web3 = await loadWeb3(dispatch)
    // const network = await web3.eth.net.getNetworkType()
    const accounts = await loadAccount(dispatch, web3)

    // Abi and Contract address from Token are needed to create the contract
    const token = loadToken(dispatch, Token, web3)
    const exchange = loadExchange(dispatch, Exchange, web3)
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
          <a className="navbar-brand" href="/#">Navbar</a>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNavDropdown">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a className="nav-link" href="/#">Link 1</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/#">Link 2</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/#">Link 3</a>
              </li>
            </ul>
          </div>
        </nav>
        <div className="content">
          <div className="vertical-split">
            <div className="card bg-dark text-white">
              <div className="card-header">
                Card Title
              </div>
              <div className="card-body">
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="/#" className="card-link">Card link</a>
              </div>
            </div>
            <div className="card bg-dark text-white">
              <div className="card-header">
                Card Title
              </div>
              <div className="card-body">
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="/#" className="card-link">Card link</a>
              </div>
            </div>
          </div>
          <div className="vertical">
            <div className="card bg-dark text-white">
              <div className="card-header">
                Card Title
              </div>
              <div className="card-body">
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="/#" className="card-link">Card link</a>
              </div>
            </div>
          </div>
          <div className="vertical-split">
            <div className="card bg-dark text-white">
              <div className="card-header">
                Card Title
              </div>
              <div className="card-body">
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="/#" className="card-link">Card link</a>
              </div>
            </div>
            <div className="card bg-dark text-white">
              <div className="card-header">
                Card Title
              </div>
              <div className="card-body">
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="/#" className="card-link">Card link</a>
              </div>
            </div>
          </div>
          <div className="vertical">
            <div className="card bg-dark text-white">
              <div className="card-header">
                Card Title
              </div>
              <div className="card-body">
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="/#" className="card-link">Card link</a>
              </div>
            </div>
          </div>
        </div>
      </div >
    );
  }
}

function mapStateToProps(state) {
  return {
    // TODO: FILL ME
  }
}

export default connect(mapStateToProps)(App);
