import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState(null);
  const [balance, setBalance] = useState(null);

  const handleSignUp = async () => {
    try {
      const response = await axios.post('http://localhost:3000/sign', { username, password });
      alert(`User created with ID: ${response.data.userId}`);
    } catch (error) {
      console.error(error);
      alert('Error during signup');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3000/login', { username, password });
      setToken(response.data.token);
      alert('Login successful');
    } catch (error) {
      console.error(error);
      alert('Error during login');
    }
  };

  const handleDeposit = async () => {
    try {
      const response = await axios.post('http://localhost:3000/deposit', { amount }, {
        headers: { Authorization: token }
      });
      setBalance(response.data.balance);
      alert(`Deposit successful, new balance: ${response.data.balance}`);
    } catch (error) {
      console.error(error);
      alert('Error during deposit');
    }
  };

  const handleWithdraw = async () => {
    try {
      const response = await axios.post('http://localhost:3000/withdraw', { amount:balance-amount }, {
        headers: { Authorization: token }
      });
      setBalance(response.data.balance);
      alert(`Withdrawal successful, new balance: ${response.data.balance}`);
    } catch (error) {
      console.error(error);
      alert('Error during withdrawal');
    }
  };

  return (
    <div className="App">
      <h1>Fintech Platform</h1>
      
      <div>
        <h2>Sign Up</h2>
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={handleSignUp}>Sign Up</button>
      </div>

      <div>
        <h2>Login</h2>
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={handleLogin}>Login</button>
      </div>

      {token && (
        <div>
          <h2>Account Actions</h2>
          <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
          <button onClick={handleDeposit}>Deposit</button>
          <button onClick={handleWithdraw}>Withdraw</button>
          {balance !== null && <p>Current Balance: {balance}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
