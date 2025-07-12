import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout/Layout';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { QuestionDetailPage } from './pages/QuestionDetailPage';
import { AskQuestionPage } from './pages/AskQuestionPage';
import { TagsPage } from './pages/TagsPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Auth routes without sidebar */}
            <Route path="/login" element={
              <Layout showSidebar={false}>
                <LoginPage />
              </Layout>
            } />
            <Route path="/signup" element={
              <Layout showSidebar={false}>
                <SignupPage />
              </Layout>
            } />
            
            {/* Main routes with sidebar */}
            <Route path="/" element={
              <Layout>
                <HomePage />
              </Layout>
            } />
            <Route path="/popular" element={
              <Layout>
                <HomePage sortBy="popular" />
              </Layout>
            } />
            <Route path="/recent" element={
              <Layout>
                <HomePage sortBy="recent" />
              </Layout>
            } />
            <Route path="/featured" element={
              <Layout>
                <HomePage sortBy="featured" />
              </Layout>
            } />
            <Route path="/questions/:id" element={
              <Layout>
                <QuestionDetailPage />
              </Layout>
            } />
            <Route path="/ask" element={
              <Layout>
                <AskQuestionPage />
              </Layout>
            } />
            <Route path="/tags" element={
              <Layout>
                <TagsPage />
              </Layout>
            } />
            <Route path="/tags/:tag" element={
              <Layout>
                <HomePage />
              </Layout>
            } />
            <Route path="/profile/:username" element={
              <Layout>
                <ProfilePage />
              </Layout>
            } />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;