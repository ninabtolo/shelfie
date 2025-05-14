import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import BookSearch from './components/BookSearch';
import BookDetail from './components/BookDetail';
import ReadHistory from './components/ReadHistory';
import Favorites from './components/Favorites';
import UserProfile from './components/UserProfile';
import LoginForm from './components/LoginForm';
import RecommendationChatPage from './pages/RecommendationChatPage';
import Followers from './components/Followers';
import Following from './components/Following';
import UserSearch from './components/UserSearch';
import ReadingList from './components/ReadingList';
import Notifications from './components/Notifications';
import './App.css';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {!user ? (
        // Public routes (unauthenticated)
        <Route path="*" element={<LoginForm />} />
      ) : (
        // Protected routes (authenticated)
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<BookSearch />} />
          <Route path="/books/:googleBookId" element={<BookDetail />} />
          <Route path="/history" element={<ReadHistory />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/recommendations/chat" element={<RecommendationChatPage />} />
          <Route path="/followers" element={<Followers />} />
          <Route path="/following" element={<Following />} />
          <Route path="/search-users" element={<UserSearch />} />
          <Route path="/reading-list" element={<ReadingList />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/search" replace />} />
        </Route>
      )}
    </Routes>
  );
}

export default App;
