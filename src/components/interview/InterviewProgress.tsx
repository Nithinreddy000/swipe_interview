import { Card, Progress, Steps, Typography, Space, Tag } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, PlayCircleOutlined } from '@ant-design/icons'

const { Text, Title } = Typography
const { Step } = Steps

interface InterviewProgressProps {
  current: number
  total: number
  progress: number
  timeSpent?: number
  estimatedTimeRemaining?: number
}

const InterviewProgress = ({ 
  current, 
  total, 
  progress,
  timeSpent = 0,
  estimatedTimeRemaining = 0
}: InterviewProgressProps) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressStatus = () => {
    if (progress === 100) return 'success'
    if (progress > 0) return 'active'
    return 'normal'
  }

  const generateSteps = () => {
    const steps = []
    for (let i = 1; i <= total; i++) {
      let status: 'wait' | 'process' | 'finish' = 'wait'
      let icon = <ClockCircleOutlined />
      
      if (i < current) {
        status = 'finish'
        icon = <CheckCircleOutlined />
      } else if (i === current) {
        status = 'process'
        icon = <PlayCircleOutlined />
      }

      const difficulty = i <= 2 ? 'Easy' : i <= 4 ? 'Medium' : 'Hard'
      const timeLimit = i <= 2 ? '20s' : i <= 4 ? '60s' : '120s'
      
      steps.push(
        <Step
          key={i}
          status={status}
          icon={icon}
          title={`Q${i}`}
          description={
            <Space direction="vertical" size={0}>
              <div style={{ fontSize: '12px', color: 'inherit' }}>{difficulty}</div>
              <div style={{ fontSize: '10px', color: 'rgba(0, 0, 0, 0.45)' }}>{timeLimit}</div>
            </Space>
          }
        />
      )
    }
    return steps
  }

  return (
    <Card 
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '12px',
        color: 'white'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ color: 'white', margin: 0 }}>
              Interview Progress
            </Title>
            <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Question {current} of {total}
            </div>
          </div>
          
          <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
            {timeSpent > 0 && (
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                Time Spent: {formatTime(timeSpent)}
              </div>
            )}
            {estimatedTimeRemaining > 0 && (
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                Est. Remaining: {formatTime(estimatedTimeRemaining)}
              </div>
            )}
          </Space>
        </div>

        <Progress
          percent={progress}
          status={getProgressStatus()}
          strokeColor={{
            '0%': '#fff',
            '100%': '#95de64',
          }}
          trailColor="rgba(255, 255, 255, 0.3)"
          strokeWidth={8}
          showInfo={false}
        />

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '16px', 
          borderRadius: '8px',
          backdropFilter: 'blur(10px)'
        }}>
          <Steps 
            current={current - 1} 
            size="small"
            style={{
              filter: 'invert(1)',
            }}
          >
            {generateSteps()}
          </Steps>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Tag color="green">Easy (Q1-2)</Tag>
            <Tag color="orange">Medium (Q3-4)</Tag>
            <Tag color="red">Hard (Q5-6)</Tag>
          </Space>
          
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
            {Math.round(progress)}% Complete
          </Text>
        </div>
      </Space>
    </Card>
  )
}

export default InterviewProgress