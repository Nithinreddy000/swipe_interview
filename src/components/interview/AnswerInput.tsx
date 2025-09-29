import { Input, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { createDebouncedFunction } from '@/utils/performance'

const { TextArea } = Input

interface AnswerInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  minRows?: number
  maxRows?: number
}

const AnswerInput = ({ 
  value, 
  onChange, 
  placeholder = "Type your answer here...",
  disabled = false,
  minRows = 6,
  maxRows = 15
}: AnswerInputProps) => {
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const textAreaRef = useRef<any>(null)
  
  const debouncedOnChange = createDebouncedFunction(onChange, 150)

  useEffect(() => {
    const words = value.trim() ? value.trim().split(/\s+/).length : 0
    setWordCount(words)
    setCharCount(value.length)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    debouncedOnChange(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault()
          break
        case 'y':
          e.preventDefault()
          break
        case 'a':
          break
        case 'c':
          break
        case 'v':
          break
        case 'x':
          break
        default:
          break
      }
    }
    
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const newValue = value.substring(0, start) + '    ' + value.substring(end)
      onChange(newValue)
      
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus()
          textAreaRef.current.setSelectionRange(start + 4, start + 4)
        }
      }, 0)
    }
  }

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>
          Your Answer:
        </div>
        <Space>
          <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
            {wordCount} words
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
            {charCount} characters
          </div>
        </Space>
      </div>

      <TextArea
        ref={textAreaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoSize={{ minRows, maxRows }}
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          resize: 'vertical',
          border: '2px solid #d9d9d9',
          borderRadius: '8px',
          padding: '12px',
          background: disabled ? '#f5f5f5' : 'white'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#40a9ff'
          e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d9d9d9'
          e.target.style.boxShadow = 'none'
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
          💡 Tip: Use Tab for indentation, Ctrl+Z/Y for undo/redo
        </div>
        
        {wordCount > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {wordCount < 10 && (
              <div style={{ fontSize: '12px', color: '#faad14' }}>
                Consider adding more detail
              </div>
            )}
            {wordCount > 500 && (
              <div style={{ fontSize: '12px', color: '#faad14' }}>
                Answer might be too long
              </div>
            )}
          </div>
        )}
      </div>
    </Space>
  )
}

export default AnswerInput