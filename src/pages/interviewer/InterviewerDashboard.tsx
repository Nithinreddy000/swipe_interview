import { useState, useMemo, useCallback, useEffect } from 'react'
import { 
  Card, 
  Input, 
  Space, 
  Tag, 
  Tooltip,
  Select,
  Row,
  Col,
  Statistic,
  Switch,
  Button,
  Modal
} from 'antd'
import { 
  SearchOutlined, 
  EyeOutlined,
  UserOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  TableOutlined,
  AppstoreOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store/index'
import { setSearchTerm, setSortBy, setSortOrder, setSelectedCandidate } from '@/store/slices/uiSlice'
import { Candidate } from '@/types/index'
import VirtualizedTable from '@/components/ui/VirtualizedTable'
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch'

const { Search } = Input
const { Option } = Select

const InterviewerDashboard = () => {
  const dispatch = useDispatch()
  const { candidates } = useSelector((state: RootState) => state.candidates)
  const { interviews } = useSelector((state: RootState) => state.interviews)
  const { sortBy, sortOrder } = useSelector((state: RootState) => state.ui)
  
  // Debug logging to understand data availability
  console.log('Dashboard - Candidates:', candidates)
  console.log('Dashboard - Interviews:', interviews)
  console.log('Dashboard - Total candidates:', candidates.length)
  console.log('Dashboard - Total interviews:', interviews.length)
  
  const [useVirtualization, setUseVirtualization] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  
  const { candidates: searchResults, searchStats, updateSearch } = useOptimizedSearch()

  // Data cleanup and consistency checks
  const cleanupOrphanedData = useCallback(() => {
    console.log('Running data cleanup...')
    
    // Find orphaned interviews (interviews without corresponding candidates)
    const candidateIds = candidates.map(c => c.id)
    const orphanedInterviews = interviews.filter(i => !candidateIds.includes(i.candidateId))
    
    if (orphanedInterviews.length > 0) {
      console.warn(`Found ${orphanedInterviews.length} orphaned interviews:`, orphanedInterviews.map(i => i.id))
    }
    
    // Find candidates without interviews
    const interviewCandidateIds = interviews.map(i => i.candidateId)
    const candidatesWithoutInterviews = candidates.filter(c => 
      !interviewCandidateIds.includes(c.id) && 
      (!c.interviewId || !interviews.find(i => i.id === c.interviewId))
    )
    
    if (candidatesWithoutInterviews.length > 0) {
      console.warn(`Found ${candidatesWithoutInterviews.length} candidates without interviews:`, 
        candidatesWithoutInterviews.map(c => ({ id: c.id, name: c.name, status: c.interviewStatus }))
      )
    }
    
    // Log data consistency report
    console.log('Data Consistency Report:')
    console.log('- Total candidates:', candidates.length)
    console.log('- Total interviews:', interviews.length)
    console.log('- Orphaned interviews:', orphanedInterviews.length)
    console.log('- Candidates without interviews:', candidatesWithoutInterviews.length)
    console.log('- Completed interviews:', interviews.filter(i => i.status === 'completed').length)
    console.log('- In-progress interviews:', interviews.filter(i => i.status === 'in-progress').length)
    
  }, [candidates, interviews])

  // Force component to re-render when data changes
  useEffect(() => {
    console.log('Dashboard data updated - Candidates:', candidates.length, 'Interviews:', interviews.length)
    
    // Run data cleanup checks
    cleanupOrphanedData()
    
    // Update search results when candidates change
    if (candidates.length > 0) {
      updateSearch('', candidates)
    }
  }, [candidates, interviews, cleanupOrphanedData])

  const handleSortChange = useCallback((value: 'name' | 'score' | 'date') => {
    dispatch(setSortBy(value))
  }, [dispatch])

  const handleOrderChange = useCallback((value: 'asc' | 'desc') => {
    dispatch(setSortOrder(value))
  }, [dispatch])

  const handleViewDetails = useCallback((candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId)
    if (candidate) {
      setSelectedCandidate(candidate)
      setIsDetailModalVisible(true)
    }
  }, [candidates])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green'
      case 'in-progress': return 'blue'
      case 'rejected': return 'red'
      default: return 'default'
    }
  }

  const sortedCandidates = useMemo(() => {
    const sorted = [...candidates].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'score':
          comparison = (a.score || 0) - (b.score || 0)
          break
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        default:
          comparison = 0
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }, [candidates, sortBy, sortOrder])

  const completedInterviews = interviews.filter(i => i.status === 'completed').length
  const totalCandidates = candidates.length
  const averageScore = candidates.length > 0 
    ? candidates.reduce((sum, c) => sum + (c.score || 0), 0) / candidates.length 
    : 0

  const getCandidateInterview = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId)
    
    console.log(`Looking for interview for candidate ${candidateId}:`)
    console.log('- Candidate:', candidate)
    console.log('- Candidate interviewId:', candidate?.interviewId)
    
    // Strategy 1: Find by candidateId in interview
    let interview = interviews.find(i => i.candidateId === candidateId)
    if (interview) {
      console.log('- Found interview by candidateId:', interview.id)
      return interview
    }
    
    // Strategy 2: Find by interview ID stored in candidate  
    if (candidate?.interviewId) {
      interview = interviews.find(i => i.id === candidate.interviewId)
      if (interview) {
        console.log('- Found interview by stored interviewId:', interview.id)
        return interview
      }
    }
    
    // Strategy 3: Find the most recent interview for any candidate with same name/email
    if (candidate) {
      interview = interviews
        .filter(i => {
          // Find interviews that might belong to this candidate by matching name patterns
          const candidatesByName = candidates.filter(c => 
            c.name === candidate.name || 
            c.email === candidate.email
          )
          return candidatesByName.some(c => i.candidateId === c.id)
        })
        .sort((a, b) => new Date(b.startTime || '').getTime() - new Date(a.startTime || '').getTime())[0]
      
      if (interview) {
        console.log('- Found interview by name/email match:', interview.id)
        return interview
      }
    }
    
    // Strategy 4: Find any completed interview with answers (last resort)
    interview = interviews
      .filter(i => i.status === 'completed' && i.answers.length > 0)
      .sort((a, b) => new Date(b.startTime || '').getTime() - new Date(a.startTime || '').getTime())[0]
    
    if (interview) {
      console.log('- Found interview by completion status (fallback):', interview.id)
    } else {
      console.log('- No interview found for candidate')
    }
    
    return interview
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
        <Col span={6}>
            <Statistic 
              title="Total Candidates"
              value={totalCandidates}
              prefix={<UserOutlined />}
            />
        </Col>
        <Col span={6}>
            <Statistic 
              title="Completed Interviews" 
              value={completedInterviews}
              prefix={<TrophyOutlined />} 
            />
        </Col>
        <Col span={6}>
            <Statistic 
              title="Average Score"
              value={Math.round(averageScore * 100)}
              suffix="%"
              prefix={<TrophyOutlined />}
            />
        </Col>
        <Col span={6}>
            <Statistic 
              title="Active Interviews"
              value={interviews.filter(i => i.status === 'in-progress').length}
              prefix={<ClockCircleOutlined />}
            />
        </Col>
      </Row>
      </Card>

      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Space>
            <Search
              placeholder="Search candidates..."
              allowClear
              style={{ width: 300 }}
              onChange={(e) => {
                const value = e.target.value
                dispatch(setSearchTerm(value))
                updateSearch(value, candidates)
              }}
              prefix={<SearchOutlined />}
            />
            
            <Select
              value={sortBy}
              onChange={handleSortChange}
              style={{ width: 120 }}
            >
              <Option value="name">Name</Option>
              <Option value="score">Score</Option>
              <Option value="date">Date</Option>
            </Select>
            <Select
              value={sortOrder}
              onChange={handleOrderChange}
              style={{ width: 100 }}
            >
              <Option value="asc">Asc</Option>
              <Option value="desc">Desc</Option>
            </Select>
          </Space>
          
          <Space>
            <Button
              onClick={() => {
                console.log('Manual refresh triggered')
                window.location.reload()
              }}
              type="default"
            >
              Refresh Data
            </Button>
            <Button
              onClick={() => {
                console.log('Manual data cleanup triggered')
                cleanupOrphanedData()
              }}
              type="default"
            >
              Check Data
            </Button>
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to clear all interview data? This cannot be undone.')) {
                  localStorage.clear()
                  window.location.reload()
                }
              }}
              type="default"
              danger
            >
              Reset All Data
            </Button>
            <Tooltip title="Toggle between virtual scrolling and traditional table">
              <Switch
                checkedChildren={<AppstoreOutlined />}
                unCheckedChildren={<TableOutlined />}
                checked={useVirtualization}
                onChange={setUseVirtualization}
              />
            </Tooltip>
          </Space>
        </Space>

        {candidates.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '40px' }}>
            <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              No candidates yet. Candidates will appear here after they upload their resumes and start interviews.
            </div>
            <div style={{ marginTop: '16px', color: 'rgba(0, 0, 0, 0.45)' }}>
              <strong>How it works:</strong>
              <br />
              1. Candidates go to the "Interview Session" tab
              <br />
              2. They upload their resume (PDF/DOCX)
              <br />
              3. Complete the interview process
              <br />
              4. Their results appear here automatically
            </div>
          </Card>
        ) : (
          <>
        {useVirtualization ? (
          <VirtualizedTable
            data={searchResults}
            onViewDetails={handleViewDetails}
                onStartInterview={() => {}} // Remove start interview functionality
          />
        ) : (
          <div style={{ maxHeight: '600px', overflow: 'auto' }}>
            {searchResults.map(candidate => (
              <Card key={candidate.id} style={{ marginBottom: '8px' }} size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{candidate.name}</div>
                    <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{candidate.position}</div>
                        <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px' }}>
                          Score: {candidate.score ? `${Math.round(candidate.score * 100)}%` : 'N/A'}
                        </div>
                  </div>
                  <Space>
                        <Tooltip title="View Interview Details">
                    <Button 
                            icon={<EyeOutlined />} 
                            onClick={() => handleViewDetails(candidate.id)}
                          />
                        </Tooltip>
                        <Tag color={getStatusColor(candidate.interviewStatus)}>
                          {candidate.interviewStatus.toUpperCase()}
                        </Tag>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
            )}
          </>
        )}
      </Card>

      {/* Candidate Detail Modal */}
      <Modal
        title={`Interview Details - ${selectedCandidate?.name}`}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedCandidate && (
          <div>
            <Card style={{ marginBottom: '16px' }}>
              <h4>Candidate Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong>Name:</strong> {selectedCandidate.name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedCandidate.email}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedCandidate.phone}
                </div>
                <div>
                  <strong>Position:</strong> {selectedCandidate.position}
                </div>
                <div>
                  <strong>Experience:</strong> {selectedCandidate.experience}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <Tag color={getStatusColor(selectedCandidate.interviewStatus)} style={{ marginLeft: '8px' }}>
                    {selectedCandidate.interviewStatus.toUpperCase()}
                  </Tag>
                </div>
              </div>
            </Card>

            {(() => {
              const interview = getCandidateInterview(selectedCandidate.id)
              console.log(`Displaying details for candidate ${selectedCandidate.id}:`, {
                candidate: selectedCandidate,
                interview: interview,
                interviewId: selectedCandidate.interviewId,
                allInterviews: interviews.map(i => ({ id: i.id, candidateId: i.candidateId, status: i.status, answerCount: i.answers.length }))
              })
              
              if (!interview) {
                return (
                  <Card>
                    <div style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.45)' }}>
                      No interview data available yet.
                      <div style={{ fontSize: '12px', marginTop: '8px' }}>
                        Candidate ID: {selectedCandidate.id}<br/>
                        Interview ID: {selectedCandidate.interviewId || 'Not set'}<br/>
                        Status: {selectedCandidate.interviewStatus}
                      </div>
                    </div>
                  </Card>
                )
              }

              return (
                <Card>
                  <h4>Interview Results</h4>
                  <div style={{ marginBottom: '16px' }}>
                    <strong>Overall Score:</strong> {selectedCandidate.score ? `${Math.round(selectedCandidate.score * 100)}%` : 'N/A'}
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <strong>Interview Status:</strong> 
                    <Tag color={getStatusColor(interview.status)} style={{ marginLeft: '8px' }}>
                      {interview.status.toUpperCase()}
                    </Tag>
                  </div>

                  {interview.answers.length > 0 && (
                    <div>
                      <h5>Questions & Answers:</h5>
                      {interview.questions.map((question, index) => {
                        const answer = interview.answers.find(a => a.questionId === question.id)
                        return (
                          <Card key={question.id} size="small" style={{ marginBottom: '12px' }}>
                            <div style={{ marginBottom: '8px' }}>
                              <strong>Q{index + 1} ({question.difficulty.toUpperCase()}):</strong> {question.text}
                            </div>
                            {answer && (
                              <div>
                                <strong>Answer:</strong> {answer.text}
                                {answer.score && (
                                  <div style={{ marginTop: '8px' }}>
                                    <Tag color="blue">Score: {Math.round(answer.score * 100)}%</Tag>
                                    {answer.feedback && (
                                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(0, 0, 0, 0.65)' }}>
                                        <strong>Feedback:</strong> {answer.feedback}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </Card>
              )
            })()}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default InterviewerDashboard