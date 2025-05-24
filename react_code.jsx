import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [formData, setFormData] = useState({ upi_id: '', amount: '', time: '' });
  const [result, setResult] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await axios.post('http://localhost:5000/predict', formData);
    setResult(response.data.result);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>UPI Fraud Detection</h1>
      <form onSubmit={handleSubmit}>
        <label>UPI ID: <input name="upi_id" onChange={handleChange} /></label><br />
        <label>Amount: <input name="amount" type="number" onChange={handleChange} /></label><br />
        <label>Time (0-24): <input name="time" type="number" onChange={handleChange} /></label><br />
        <button type="submit">Check</button>
      </form>
      {result && <p style={{ marginTop: '1rem' }}>Prediction: {result}</p>}
    </div>
  );
}

export default App;
