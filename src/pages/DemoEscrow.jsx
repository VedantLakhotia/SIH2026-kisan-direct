import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

const DemoEscrow = () => {
  const [order, setOrder] = useState(null);
  const [split, setSplit] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, ESCROW_HELD, IN_TRANSIT, SETTLED
  const [logs, setLogs] = useState([]);
  const [passbook, setPassbook] = useState([]);

  const addLog = (msg) => setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    try {
      addLog("Consumer initiating checkout for ₹280...");
      const { data } = await axios.post(`${API_BASE}/payment/create-order`, {
        amount: 280, farmerId: 1, driverId: 5, leadId: 3
      });
      addLog(`Order Created on Backend. Razorpay ID: ${data.razorpayOrderId}`);
      
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        addLog("Failed to load Razorpay SDK");
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: 280 * 100,
        currency: "INR",
        name: "KisanDirect",
        description: "Farm Fresh Produce",
        order_id: data.razorpayOrderId,
        handler: async function (response) {
          try {
            addLog("Razorpay modal success. Verifying signature on backend...");
            const verifyRes = await axios.post(`${API_BASE}/payment/verify-escrow`, {
              orderId: data.order.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            setOrder(data.order);
            setSplit(data.splitBreakdown);
            setStatus('ESCROW_HELD');
            addLog(`Signature Verified! ₹280 held in KisanSetu Escrow.`);
            setPassbook([{ id: 1, type: 'FARMER', amount: data.splitBreakdown.farmerAmount, status: 'Escrow Pending' }]);
          } catch (err) {
            addLog(`Verification Error: ${err.response?.data?.message || err.message}`);
          }
        },
        prefill: {
          name: "Test Consumer",
          email: "consumer@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#27ae60"
        }
      };

      addLog(`Initializing Razorpay with key: ${import.meta.env.VITE_RAZORPAY_KEY_ID ? 'LOADED' : 'MISSING'}`);
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
          addLog(`Payment Failed: ${response.error.description}`);
      });
      addLog(`Calling rzp.open()...`);
      rzp.open();
      addLog(`rzp.open() executed successfully.`);

    } catch (e) {
      addLog(`Error: ${e.message}`);
    }
  };

  const handleDriverPickup = async () => {
    try {
      addLog("Driver scanning QR at farm gate...");
      const { data } = await axios.post(`${API_BASE}/logistics/verify-pickup`, {
        orderId: order.id, crateQrCode: 'CRATE-1234', driverId: 5
      });
      setStatus('IN_TRANSIT');
      addLog(`Produce In-Transit | Farmer Paid ₹${data.farmerAmount}`);
      setPassbook(prev => prev.map(p => p.type === 'FARMER' ? { ...p, status: `Transferred via IMPS (Ref #mock)` } : p));
    } catch (e) {
      addLog(`Error: ${e.message}`);
    }
  };

  const handleLeadDelivery = async () => {
    try {
      addLog("Driver arrived at Society Hub. Lead confirming...");
      const { data } = await axios.post(`${API_BASE}/logistics/complete-delivery`, {
        orderId: order.id, societyHubId: 1, leadVerificationPin: '9999'
      });
      setStatus('SETTLED');
      addLog(`Trip Complete: Driver credited ₹${data.driverAmount} | Lead wallet credited ₹${data.leadAmount}`);
      
      setPassbook(prev => [
        ...prev,
        { id: 2, type: 'DRIVER', amount: data.driverAmount, status: 'Transferred via IMPS' },
        { id: 3, type: 'COMMUNITY_LEAD', amount: data.leadAmount, status: 'Transferred to Wallet' }
      ]);
    } catch (e) {
      addLog(`Error: ${e.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>KisanSetu Multi-Stakeholder Escrow Demo</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
        
        {/* Consumer Card */}
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', background: '#f9f9f9' }}>
          <h3>1. Consumer Checkout (/consumer/checkout)</h3>
          {!order ? (
            <>
              <p>Total Cart Value: <strong>₹280</strong></p>
              <details style={{ marginBottom: '15px', cursor: 'pointer' }}>
                <summary>View Transparent Price Split</summary>
                <ul style={{ color: '#555' }}>
                  <li>Farmer: ~75% (₹210)</li>
                  <li>Driver: ~9% (₹25)</li>
                  <li>Community Lead: ~9% (₹25)</li>
                  <li>Platform Fee: ~7% (₹20)</li>
                </ul>
              </details>
              <button onClick={handleCheckout} style={{ padding: '10px 20px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Pay ₹280 with Razorpay
              </button>
            </>
          ) : (
            <div style={{ background: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px' }}>
              <strong>Payment Success!</strong><br />
              ₹280 held in KisanSetu Escrow. Farmer will be paid upon morning pickup.
            </div>
          )}
        </div>

        {/* Driver Card */}
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', background: '#f9f9f9', opacity: status === 'IDLE' ? 0.5 : 1 }}>
          <h3>2. Driver Action Portal (/driver/trip)</h3>
          {status === 'ESCROW_HELD' ? (
            <button onClick={handleDriverPickup} style={{ padding: '10px 20px', background: '#f39c12', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Simulate Farm-Gate Pickup Scan
            </button>
          ) : status === 'IN_TRANSIT' || status === 'SETTLED' ? (
            <div style={{ background: '#d1ecf1', color: '#0c5460', padding: '10px', borderRadius: '5px' }}>
              Produce In-Transit | Farmer Paid ₹{split?.farmerAmount}
            </div>
          ) : (
            <p>Waiting for order...</p>
          )}
        </div>

        {/* Lead Card */}
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', background: '#f9f9f9', opacity: status !== 'IN_TRANSIT' && status !== 'SETTLED' ? 0.5 : 1 }}>
          <h3>3. Community Lead Portal (/lead/hub)</h3>
          {status === 'IN_TRANSIT' ? (
            <button onClick={handleLeadDelivery} style={{ padding: '10px 20px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Confirm Society Gate Drop & Settle
            </button>
          ) : status === 'SETTLED' ? (
            <div style={{ background: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px' }}>
              Trip Complete: Driver credited ₹{split?.driverAmount} | Lead wallet credited ₹{split?.leadAmount}
            </div>
          ) : (
            <p>Waiting for driver arrival...</p>
          )}
        </div>

        {/* Farmer Passbook */}
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', background: '#f9f9f9' }}>
          <h3>4. Farmer Earnings Passbook (/farmer/earnings)</h3>
          {passbook.length === 0 ? (
            <p>No recent transactions.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {passbook.map((entry, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px 0' }}>{entry.type}</td>
                    <td>₹{entry.amount}</td>
                    <td>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: '12px', fontSize: '12px',
                        background: entry.status.includes('Transferred') ? '#d4edda' : '#fff3cd',
                        color: entry.status.includes('Transferred') ? '#155724' : '#856404'
                      }}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#2c3e50', color: '#ecf0f1', borderRadius: '8px' }}>
        <h4>System Logs (Live)</h4>
        <div style={{ height: '150px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '14px' }}>
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    </div>
  );
};

export default DemoEscrow;
