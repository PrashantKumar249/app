import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { DashboardPage } from './pages/DashboardPage'
import { MistakesPage } from './pages/MistakesPage'
import { SessionPage } from './pages/SessionPage'
import { SessionResultsPage } from './pages/SessionResultsPage'
import { TopicDetailPage } from './pages/TopicDetailPage'
import { TopicsPage } from './pages/TopicsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/session/:sessionId"
          element={<SessionPage />}
        />
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/topics" element={<TopicsPage />} />
                <Route path="/topics/:id" element={<TopicDetailPage />} />
                <Route path="/session/:sessionId/results" element={<SessionResultsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/mistakes" element={<MistakesPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
