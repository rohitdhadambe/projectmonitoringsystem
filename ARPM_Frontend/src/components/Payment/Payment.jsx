import React, { useState, useEffect } from "react";
import TopNavBar from "../../layout/TopNavBar";
import SideNavBarInvestigator from "../../components/Committee/SideNavBar/SideNavBar";

function Payment() {
  const [amount, setAmount] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 🔥 Fetch Projects
  useEffect(() => {
    fetchProjects();
  }, []);

  // 🔥 Auto-fill amount when project is selected
  useEffect(() => {
    if (selectedProject) {
      const project = projects.find(p => p.id.toString() === selectedProject);
      if (project && project.total_budget) {
        setAmount(project.total_budget.toString());
      } else {
        setAmount("");
      }
    } else {
      setAmount("");
    }
  }, [selectedProject, projects]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("http://localhost:8000/projects/all");
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  const handlePayment = async () => {
    if (!window.Razorpay) {
      alert("Razorpay SDK not loaded");
      return;
    }

    if (!amount || !selectedProject) {
      alert("Please select a project with an approved budget");
      return;
    }

    const res = await fetch("http://localhost:8000/payments/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount,
        project_id: selectedProject // 🔥 send project id
      })
    });

    const data = await res.json();

    const options = {
      key: "rzp_test_SaI21dU4t6KVsw",
      amount: data.amount,
      currency: "INR",
      order_id: data.id,

      handler: function (response) {
        alert("✅ Budget Sent Successfully");
        console.log("Payment:", response);
        // Clear the form after successful payment
        setSelectedProject("");
        setAmount("");
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div>
      <TopNavBar />

      <div className="min-h-screen flex bg-gray-100 pt-20">
        
        <SideNavBarInvestigator
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <div className={`flex flex-col flex-grow ${isSidebarOpen ? "ml-80" : "ml-16"}`}>
          
          <div className="p-8 max-w-5xl">

            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Project Budget Payment
            </h1>

            <p className="text-gray-500 mb-6">
              Committee is allocating budget to the selected project manager
            </p>

            <div className="bg-white rounded-xl shadow-lg p-8 border">

              {/* Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h2 className="text-purple-700 font-semibold text-lg">
                  Budget Allocation
                </h2>
                <p className="text-gray-600 mt-1">
                  Select a project and send the approved budget to its manager.
                </p>
              </div>

              {/* 🔥 Project Dropdown */}
              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-700">
                  Select Project
                </label>

                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">-- Select Project --</option>

                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title} 
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-700">
                  Approved Budget Amount (₹) - Auto-filled from selected project
                </label>

                <input
                  type="number"
                  placeholder="Select a project to auto-fill budget"
                  value={amount}
                  readOnly
                  className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>

              {/* Button */}
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