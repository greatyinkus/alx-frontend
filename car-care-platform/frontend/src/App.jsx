import { Routes, Route } from 'react-router-dom';
import PublicLayout from './pages/public/PublicLayout';
import Home from './pages/public/Home';
import Services from './pages/public/Services';
import Locations from './pages/public/Locations';
import Reviews from './pages/public/Reviews';
import Contact from './pages/public/Contact';
import GiveFeedback from './pages/public/GiveFeedback';
import Login from './pages/auth/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ManagementLayout from './pages/management/ManagementLayout';
import Dashboard from './pages/management/Dashboard';
import FeedbackInbox from './pages/management/FeedbackInbox';
import FeedbackDetail from './pages/management/FeedbackDetail';
import Issues from './pages/management/Issues';
import IssueDetail from './pages/management/IssueDetail';
import ActivityFeed from './pages/management/ActivityFeed';
import ManagementHub from './pages/management/ManagementHub';
import Customers from './pages/management/Customers';
import LocationsAdmin from './pages/management/LocationsAdmin';
import ReviewsAdmin from './pages/management/ReviewsAdmin';
import ReportsPage from './pages/management/ReportsPage';
import NotificationsPage from './pages/management/NotificationsPage';
import Team from './pages/management/Team';
import Settings from './pages/management/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/feedback" element={<GiveFeedback />} />
      </Route>

      <Route path="/login" element={<Login />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <ManagementLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="feedback" element={<FeedbackInbox />} />
        <Route path="feedback/:id" element={<FeedbackDetail />} />
        <Route path="issues" element={<Issues />} />
        <Route path="issues/:id" element={<IssueDetail />} />
        <Route path="activity" element={<ActivityFeed />} />
        <Route path="management-hub" element={<ManagementHub />} />
        <Route path="customers" element={<Customers />} />
        <Route path="locations" element={<LocationsAdmin />} />
        <Route path="reviews" element={<ReviewsAdmin />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="team" element={<Team />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
