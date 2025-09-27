function parseDate(d) {
    const dt = new Date(d);
    if (!isNaN(dt)) return dt;
    return new Date(d.replace(' ', 'T'));
  }
  
  const fileInput = document.getElementById('file');
  const sampleBtn = document.getElementById('sampleBtn');
  
  let rawRows = [];
  let pieChart, lineChart, barChart, histChart;
  
  sampleBtn.addEventListener('click', () => {
    const csv = `Transaction ID,Timestamp,Sender Name,Sender UPI ID,Receiver Name,Receiver UPI ID,Amount (INR),Status
  4d3db980-46cd-4158-a812-dcb77055d0d2,2024-06-22 04:06:38,Tiya Mall,4161803452@okaxis,Mohanlal Golla,7776849307@okybl,3907.34,FAILED
  099ee548-2fc1-4811-bf92-559c467ca792,2024-06-19 06:04:49,Mohanlal Bakshi,8908837379@okaxis,Mehul Sankaran,7683454560@okaxis,8404.55,SUCCESS`;
    loadCSVString(csv);
  });
  
  fileInput.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    Papa.parse(f, { header: true, skipEmptyLines: true, complete: res => loadCSVRows(res.data) });
  });
  
  function loadCSVString(csv) {
    const res = Papa.parse(csv, { header: true, skipEmptyLines: true });
    loadCSVRows(res.data);
  }
  
  function loadCSVRows(rows) {
    rawRows = rows.map(r => ({
      id: r['Transaction ID'],
      ts: parseDate(r['Timestamp']),
      sender: r['Sender Name'],
      sender_id: r['Sender UPI ID'],
      receiver: r['Receiver Name'],
      receiver_id: r['Receiver UPI ID'],
      amount: parseFloat(r['Amount (INR)'] || r['Amount']) || 0,
      status: (r['Status'] || '').toUpperCase()
    }));
  
    document.getElementById('totalCount').innerText = rawRows.length;
    const totalAmt = rawRows.reduce((s, r) => s + r.amount, 0);
    document.getElementById('totalAmt').innerText = totalAmt.toLocaleString('en-IN');
  
    const statusCounts = rawRows.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    document.getElementById('statusSplit').innerText =
      (statusCounts['SUCCESS'] || 0) + ' / ' + (statusCounts['FAILED'] || 0);
  
    // Receiver aggregates
    const recAgg = {};
    rawRows.forEach(r => {
      const key = r.receiver + '|' + r.receiver_id;
      recAgg[key] = (recAgg[key] || 0) + r.amount;
    });
    const recArr = Object.entries(recAgg).map(([k, v]) => {
      const [name, id] = k.split('|');
      return { name, id, amt: v };
    }).sort((a, b) => b.amt - a.amt);
  
    document.getElementById('highestRec').innerText = recArr[0]
      ? `${recArr[0].name} (${recArr[0].id}) ₹${recArr[0].amt.toFixed(2)}` : '—';
    document.getElementById('lowestRec').innerText = recArr[recArr.length - 1]
      ? `${recArr[recArr.length - 1].name} (${recArr[recArr.length - 1].id}) ₹${recArr[recArr.length - 1].amt.toFixed(2)}` : '—';
  
    // Day-wise totals
    const dayAgg = {};
    rawRows.forEach(r => {
      const d = r.ts.toISOString().slice(0, 10);
      dayAgg[d] = (dayAgg[d] || 0) + r.amount;
    });
    const dayArr = Object.entries(dayAgg).map(([d, a]) => ({ d, a })).sort((x, y) => new Date(x.d) - new Date(y.d));
  
    // Top 20 senders
    const sendAgg = {};
    rawRows.forEach(r => {
      const key = r.sender + '|' + r.sender_id;
      sendAgg[key] = (sendAgg[key] || 0) + r.amount;
    });
    const top20 = Object.entries(sendAgg).map(([k, v]) => {
      const [name, id] = k.split('|');
      return { name, id, amt: v };
    }).sort((a, b) => b.amt - a.amt).slice(0, 20);
  
    // Histogram
    const amounts = rawRows.map(r => r.amount).filter(a => !isNaN(a));
    const bins = 20;
    const minA = Math.min(...amounts), maxA = Math.max(...amounts);
    const width = (maxA - minA) / bins;
    const hist = new Array(bins).fill(0);
    amounts.forEach(v => {
      const idx = Math.min(bins - 1, Math.floor((v - minA) / width));
      hist[idx]++;
    });
    const histLabels = Array.from({ length: bins }, (_, i) =>
      (minA + i * width).toFixed(0) + '–' + (minA + (i + 1) * width).toFixed(0)
    );
  
    // Charts
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(document.getElementById('pieStatus'), {
      type: 'pie',
      data: { labels: Object.keys(statusCounts), datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#3b82f6', '#ef4444'] }] },
      options: { plugins: { legend: { position: 'bottom' } } }
    });
  
    if (lineChart) lineChart.destroy();
    lineChart = new Chart(document.getElementById('lineDaily'), {
      type: 'line',
      data: { labels: dayArr.map(x => x.d), datasets: [{ label: 'Total ₹ per day', data: dayArr.map(x => x.a), fill: true, tension: 0.2, borderWidth: 2 }] },
      options: { plugins: { legend: { display: false } } }
    });
  
    if (barChart) barChart.destroy();
    barChart = new Chart(document.getElementById('barTopSenders'), {
      type: 'bar',
      data: { labels: top20.map(t => t.name), datasets: [{ label: 'Total Amount', data: top20.map(t => t.amt), borderRadius: 6 }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
    });
  
    if (histChart) histChart.destroy();
    histChart = new Chart(document.getElementById('histAmount'), {
      type: 'bar',
      data: { labels: histLabels, datasets: [{ label: 'Count', data: hist }] },
      options: { plugins: { legend: { display: false } }, scales: { x: { display: false } } }
    });
  
    // Table
    const table = document.getElementById('dataTable');
    const thead = table.querySelector('thead'); const tbody = table.querySelector('tbody');
    thead.innerHTML = ''; tbody.innerHTML = '';
    if (rawRows.length > 0) {
      const cols = ['id', 'ts', 'sender', 'sender_id', 'receiver', 'receiver_id', 'amount', 'status'];
      const tr = document.createElement('tr');
      cols.forEach(c => { const th = document.createElement('th'); th.innerText = c; tr.appendChild(th); });
      thead.appendChild(tr);
      rawRows.slice(0, 200).forEach(r => {
        const tr2 = document.createElement('tr');
        cols.forEach(c => {
          const td = document.createElement('td');
          td.innerText = (c === 'ts') ? r.ts.toISOString().replace('T', ' ').replace('Z', '') : (r[c] || '');
          tr2.appendChild(td);
        });
        tbody.appendChild(tr2);
      });
    }
  }
  