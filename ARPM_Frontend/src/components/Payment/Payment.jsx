import React, { useState } from "react";
import TopNavBar from "../../layout/TopNavBar";
import SideNavBarInvestigator from "../Committee/SideNavBar/SideNavBar";

function Payment() {
  const [amount, setAmount] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handlePayment = async () => {
    if (!window.Razorpay) {
      alert("Razorpay SDK not loaded");
      return;
    }

    if (!amount) {
      alert("Enter amount");
      return;
    }

    const res = await fetch("http://localhost:8000/payments/create-order", {
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
        alert("✅ Payment Successful");
        console.log(response);
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div>
      <TopNavBar />

      <div className="min-h-screen flex bg-gray-100 pt-20">
        
        {/* Sidebar */}
        <SideNavBarInvestigator
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Main Content */}
        <div className={`flex flex-col flex-grow ${isSidebarOpen ? "ml-80" : "ml-16"}`}>
          
          <div className="p-8 max-w-5xl">

            {/* Page Title */}
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Project Budget Payment
            </h1>

            <p className="text-gray-500 mb-6">
              Committee is allocating budget to the selected project manager
            </p>

            {/* Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 border">

              {/* Info Box */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h2 className="text-purple-700 font-semibold text-lg">
                  Budget Allocation
                </h2>
                <p className="text-gray-600 mt-1">
                  The committee is sending the approved budget to the project manager 
                  for executing the research project.
                </p>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-700">
                  Enter Budget Amount (₹)
                </label>

                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition duration-200"
              >
                Send Budget 💳
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Payment;