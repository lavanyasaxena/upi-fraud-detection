document.getElementById('fraudForm').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const upi_id = document.getElementById('upi_id').value;
    const amount = document.getElementById('amount').value;
    const time = document.getElementById('time').value;
  
    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ upi_id, amount, time })
    });
  
    const data = await response.json();
    document.getElementById('result').textContent = `Prediction: ${data.result}`;
  });
  
