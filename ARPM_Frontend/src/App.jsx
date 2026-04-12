import { Routes, Route } from "react-router-dom"

import Login from "./components/Login/login"
import Landing from "./components/Landing/Home"
import ProtectedRoute from "./components/ProtectedRoute"
import Home from "./components/Researcher/Home/Home"
import ProposalPage from "./components/Researcher/Proposal/Main/ProposalPage"
import CreateProposal from "./components/Researcher/Proposal/CreatePraposal/CreateProposal"
import ProposalDetailsPage from "./components/Researcher/Proposal/Proposal Details/ProposalDetailsPage"
import PMProposalPage from "./components/PM/Proposal/Main/ProposalPage"
import PMProposalDetailsPage from "./components/PM/Proposal/Proposal Details/ProposalDetailsPage"
import PMHome from "./components/PM/Home/Home"
import ReviewerHome from "./components/Reviewer/Home/Home"
import ReviewerProposalPage from "./components/Reviewer/Proposal/Main/ProposalPage"
import ReviewerProposalDetailsPage from "./components/Reviewer/Proposal/Proposal Details/ProposalDetailsPage"
import CommitteeHome from "./components/Committee/Home/Home"
import CommitteeProposalPage from "./components/Committee/Proposal/Main/ProposalPage"
import CommitteeProposalDetailsPage from "./components/Committee/Proposal/Proposal Details/ProposalDetailsPage"
import CreateProjectPage from "./components/PM/Project/Main/CreateProjectModal"
import CommitteeProjectDetailPage from "./components/Committee/Project/ProjectDetail/CommitteeProjectDetailPage"
import ProjectDetailPage from "./components/PM/Project/ProjectDetail/Projectdetailpage"
import ResearcherProjectDetailPage from "./components/Researcher/Project/ProjectDetail/ResearcherProjectDetailPage"
import Communication from "./components/Communication/Communication";
import DashboardPM from "./components/PM/Dashboard/dashboard"
import Dashboardcommittee from "./components/Committee/Dashboard/dashboard"
import Dashboardresearcher from "./components/Researcher/Dashboard/dashboard"
import Dashboardreviewer from "./components/Reviewer/Dashboard/dashboard" 
import Payment from "./components/Payment"




export default function App() {

  return (
    <Routes>


      <Route path="/payment" element={<Payment />} />
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />







      <Route
        path="/researcher/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/researcher/proposals"
        element={
          <ProtectedRoute>
            <ProposalPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/researcher/create/proposal"
        element={
          <ProtectedRoute>
            <CreateProposal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/researcher/proposals/:id"
        element={
          <ProtectedRoute>
            <ProposalDetailsPage />
          </ProtectedRoute>
        }
      />


      <Route
        path="/manager/home"
        element={
          <ProtectedRoute>
            <PMHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/projects/create"
        element={
          <ProtectedRoute>
            <CreateProjectPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/project/:id"
        element={
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        }
      />



      <Route
        path="/manager/proposals"
        element={
          <ProtectedRoute>
            <PMProposalPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/proposals/:id"
        element={
          <ProtectedRoute>
            <PMProposalDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer/home"
        element={
          <ProtectedRoute>
            <ReviewerHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reviewer/proposals"
        element={
          <ProtectedRoute>
            <ReviewerProposalPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reviewer/proposals/:id"
        element={
          <ProtectedRoute>
            <ReviewerProposalDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/committee/home"
        element={
          <ProtectedRoute>
            <CommitteeHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/committee/proposals"
        element={
          <ProtectedRoute>
            <CommitteeProposalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/committee/proposals/:id"
        element={
          <ProtectedRoute>
            <CommitteeProposalDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/committee/projects"
        element={
          <ProtectedRoute>
            <CommitteeHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/committee/project/:id"
        element={
          <ProtectedRoute>
            <CommitteeProjectDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher/project/:id"
        element={
          <ProtectedRoute>
            <ResearcherProjectDetailPage />
          </ProtectedRoute>
        }
      />

        <Route 
        path="/communication"
        element={
          <ProtectedRoute>
            <Communication />
          </ProtectedRoute>
        }
      />

       <Route 
        path="/manager/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPM/>
          </ProtectedRoute>
        }
      />

        <Route
        path="/committee/dashboard"
        element={
          <ProtectedRoute>
            <Dashboardcommittee />
          </ProtectedRoute>
        }
      />

      <Route
        path="/researcher/dashboard"
        element={
          <ProtectedRoute>
            <Dashboardresearcher />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reviewer/dashboard"
        element={
          <ProtectedRoute>
            <Dashboardreviewer />
          </ProtectedRoute>
        }
      />


    </Routes>
  )
}