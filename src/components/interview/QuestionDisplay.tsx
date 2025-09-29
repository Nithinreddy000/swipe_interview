import { Card, Tag, Space } from 'antd'
import { CodeOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons'
import { Question } from '@/types/index'

interface QuestionDisplayProps {
  question: Question
}

const QuestionDisplay = ({ question }: QuestionDisplayProps) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'coding':
        return <CodeOutlined />
      case 'technical':
        return <MessageOutlined />
      case 'behavioral':
        return <UserOutlined />
      default:
        return <MessageOutlined />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'coding':
        return 'blue'
      case 'technical':
        return 'green'
      case 'behavioral':
        return 'purple'
      default:
        return 'default'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'green'
      case 'medium':
        return 'orange'
      case 'hard':
        return 'red'
      default:
        return 'default'
    }
  }

  return (
    <Card 
      style={{ 
        background: '#fafafa',
        border: '2px solid #e6f7ff',
        borderRadius: '12px'
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Tag 
              icon={getTypeIcon(question.type)} 
              color={getTypeColor(question.type)}
              style={{ fontSize: '14px', padding: '4px 12px' }}
            >
              {question.type.toUpperCase()}
            </Tag>
            <Tag 
              color={getDifficultyColor(question.difficulty)}
              style={{ fontSize: '14px', padding: '4px 12px' }}
            >
              {question.difficulty.toUpperCase()}
            </Tag>
            {question.category && (
              <Tag style={{ fontSize: '14px', padding: '4px 12px' }}>
                {question.category}
              </Tag>
            )}
          </Space>
          
          <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
            Time Limit: {Math.floor(question.timeLimit / 60)}:{(question.timeLimit % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: '16px', color: '#1890ff', fontSize: '20px' }}>
            Question:
          </h4>
          <Card 
            style={{ 
              background: 'white',
              border: '1px solid #d9d9d9',
              padding: '20px'
            }}
          >
            <div 
              style={{ 
                fontSize: '16px', 
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}
            >
              {question.text}
            </div>
          </Card>
        </div>

        {question.type === 'coding' && (
          <div style={{ 
            background: '#f0f2f5', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid #d9d9d9'
          }}>
            <h5 style={{ marginBottom: '8px', fontSize: '16px' }}>
              💡 Coding Tips:
            </h5>
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>Write clean, readable code</li>
              <li>Consider edge cases and error handling</li>
              <li>Explain your thought process</li>
              <li>Test your solution with examples</li>
            </ul>
          </div>
        )}

        {question.type === 'technical' && (
          <div style={{ 
            background: '#f6ffed', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid #b7eb8f'
          }}>
            <h5 style={{ marginBottom: '8px', fontSize: '16px' }}>
              🎯 Technical Answer Guidelines:
            </h5>
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>Provide specific examples</li>
              <li>Explain the reasoning behind your answer</li>
              <li>Mention relevant technologies or tools</li>
              <li>Discuss pros and cons if applicable</li>
            </ul>
          </div>
        )}

        {question.type === 'behavioral' && (
          <div style={{ 
            background: '#f9f0ff', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid #d3adf7'
          }}>
            <h5 style={{ marginBottom: '8px', fontSize: '16px' }}>
              🗣️ Behavioral Response Framework:
            </h5>
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li><strong>Situation:</strong> Describe the context</li>
              <li><strong>Task:</strong> Explain what needed to be done</li>
              <li><strong>Action:</strong> Detail the steps you took</li>
              <li><strong>Result:</strong> Share the outcome and learnings</li>
            </ul>
          </div>
        )}
      </Space>
    </Card>
  )
}

export default QuestionDisplay