import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import InterviewerDashboard from '@/pages/interviewer/InterviewerDashboard'
import IntervieweePage from '@/pages/interviewee/IntervieweePage'
import Navigation from '@/components/ui/Navigation'
import './App.css'

const { Header, Content } = Layout

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: 0 }}>
        <Navigation />
      </Header>
      <Content style={{ padding: '24px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/interviewer" replace />} />
          <Route path="/interviewer" element={<InterviewerDashboard />} />
          <Route path="/interviewee/:candidateId?" element={<IntervieweePage />} />
          <Route path="*" element={<Navigate to="/interviewer" replace />} />
        </Routes>
      </Content>
    </Layout>
  )
}

export default App
