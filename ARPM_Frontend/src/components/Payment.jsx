import React, { useState } from "react";

function Payment() {
  const [amount, setAmount] = useState("");

  const handlePayment = async () => {
    if (!amount) {
      alert("Enter amount");
      return;
    }

    const res = await fetch("http://localhost:8000/payments/create-order",
     {
          method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount })
    });

    const data = await res.json();

    const options = {
      key: "rzp_test_SaI21dU4t6KVsw",
      amount: data.amount,
      currency: "INR",
      order_id: data.id,

      handler: function (response) {
        alert("Payment Successful");
        console.log(response);
      },
      method: {
    upi: true
  }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Payment</h2>

      <input
        type="number"
        placeholder="Enter Amount"
        onChange={(e) => setAmount(e.target.value)}
      />

      <br /><br />

      <button onClick={handlePayment}>Pay Now</button>
    </div>
  );
}

export default Payment;