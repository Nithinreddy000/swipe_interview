import { useState, useCallback } from 'react'
import { Card, Button, Form, Input, Space, Progress, message } from 'antd'
import { InboxOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { useDropzone } from 'react-dropzone'
import { useDispatch } from 'react-redux'
import { addCandidate } from '@/store/slices/candidatesSlice'
import { processResumeWithDocumentAI } from '@/services/documentAI'
import { ResumeData } from '@/types/index'

const { TextArea } = Input

interface ResumeUploadProps {
  onComplete?: () => void
  onResumeProcessed?: (extracted: { 
    name: string; 
    email: string; 
    phone: string;
    skills: string[];
    position: string;
    experience: number;
    education: string;
    summary: string;
  }) => void
}

const ResumeUpload = ({ onComplete, onResumeProcessed }: ResumeUploadProps) => {
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<Partial<ResumeData> | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      message.error('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)
    setIsProcessing(true)
    setUploadProgress(0)

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 20
      })
    }, 200)

    try {
      console.log('Starting resume processing for file:', file.name)
      const resumeData = await processResumeWithDocumentAI(file)
      
      if (!resumeData || !resumeData.personalInfo) {
        throw new Error('Resume processing did not return valid data')
      }
      
      console.log('Resume data extracted:', resumeData)
      setExtractedData(resumeData)
      setUploadProgress(100)
      
      const formData = {
        name: resumeData.personalInfo?.name || '',
        email: resumeData.personalInfo?.email || '',
        phone: resumeData.personalInfo?.phone || '',
        skills: resumeData.skills?.join(', ') || '',
        experience: resumeData.experience?.[0]?.duration ? 
          parseInt(resumeData.experience[0].duration.match(/\d+/)?.[0] || '0') : 0,
        education: resumeData.education?.[0] ? 
          `${resumeData.education[0].degree} from ${resumeData.education[0].institution}` : '',
        summary: resumeData.summary || ''
      }

      console.log('Setting form data:', formData)
      form.setFieldsValue(formData)

      // Notify parent so it can advance to next step or collect missing fields
      onResumeProcessed && onResumeProcessed({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        skills: resumeData.skills || [],
        position: resumeData.experience?.[0]?.position || 'Full Stack Developer',
        experience: formData.experience,
        education: formData.education,
        summary: formData.summary
      })

      message.success('Resume processed successfully!')
      
    } catch (error) {
      console.error('Resume processing failed:', error)
      let errorMessage = 'Failed to process resume. Please fill the form manually.'
      
      if (error instanceof Error) {
        if (error.message.includes('No text could be extracted')) {
          errorMessage = 'Could not extract text from PDF. Please check if the file is text-based and not scanned.'
        } else if (error.message.includes('basic information')) {
          errorMessage = 'Could not find basic information in the resume. Please fill the form manually.'
        }
      }
      
      message.error(errorMessage)
      setShowManualForm(true)
    } finally {
      setIsProcessing(false)
      clearInterval(progressInterval)
      setUploadProgress(0)
    }
  }, [form, onResumeProcessed])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: isProcessing
  })

  const handleSubmit = async (values: any) => {
    try {
      const candidateData = {
        name: values.name,
        email: values.email,
        phone: values.phone || '',
        skills: values.skills ? values.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        experience: parseInt(values.experience) || 0,
        education: values.education || '',
        position: values.position || 'Full Stack Developer',
        interviewStatus: 'pending' as const,
        resumeText: extractedData?.summary || values.summary || '',
        resumeUrl: uploadedFile ? URL.createObjectURL(uploadedFile) : undefined
      }

      await dispatch(addCandidate(candidateData))

      // Let parent proceed to next step
      onResumeProcessed && onResumeProcessed({
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        skills: candidateData.skills,
        position: candidateData.position,
        experience: candidateData.experience,
        education: candidateData.education,
        summary: values.summary || extractedData?.summary || ''
      })

      message.success('Saved. Continue to interview.')
      onComplete && onComplete()
    } catch (error) {
      message.error('Failed to add candidate')
    }
  }

  const getMissingFields = () => {
    const values = form.getFieldsValue()
    const missing = []
    if (!values.name) missing.push('Name')
    if (!values.email) missing.push('Email')
    return missing
  }

  const missingFields = getMissingFields()

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {!extractedData && !showManualForm && (
          <Card>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <div style={{
                border: isDragActive ? '2px dashed #1890ff' : '2px dashed #d9d9d9',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                backgroundColor: isDragActive ? '#f0f9ff' : '#fafafa',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}>
                <Space direction="vertical" size="middle">
                  <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '20px' }}>
                      {isDragActive ? 'Drop your resume here' : 'Upload Resume'}
                    </h4>
                    <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                      Drag and drop your resume, or click to browse
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                    Supports PDF and DOCX files (max 10MB)
                  </div>
                </Space>
              </div>
            </div>

            {isProcessing && (
              <div style={{ marginTop: '20px' }}>
                <Progress 
                  percent={uploadProgress} 
                  status="active"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)', marginTop: '8px', display: 'block' }}>
                  Processing resume with AI... This may take a few seconds.
                </div>
              </div>
            )}
          </Card>
        )}

        {(extractedData || showManualForm) && (
          <Card title="Candidate Information" extra={
            <Button 
              type="link" 
              onClick={() => {
                setExtractedData(null)
                setShowManualForm(false)
                setUploadedFile(null)
                form.resetFields()
              }}
            >
              Upload Different Resume
            </Button>
          }>
            {missingFields.length > 0 && (
              <div style={{ 
                background: '#fff2f0', 
                border: '1px solid #ffccc7',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ color: '#faad14' }}>
                  <strong>Missing Information:</strong> Please provide {missingFields.join(', ')} to continue.
                </div>
              </div>
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              style={{ marginTop: '16px' }}
            >
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Please enter the candidate name' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Enter full name"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email address' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Enter email address"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Phone Number"
                name="phone"
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="Enter phone number (optional)"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Position Applied For"
                name="position"
                initialValue="Full Stack Developer"
              >
                <Input placeholder="e.g., Full Stack Developer" size="large" />
              </Form.Item>

              <Form.Item
                label="Skills"
                name="skills"
              >
                <Input 
                  placeholder="e.g., React, Node.js, TypeScript, MongoDB"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Years of Experience"
                name="experience"
              >
                <Input 
                  type="number" 
                  placeholder="Enter years of experience"
                  size="large"
                  min={0}
                  max={50}
                />
              </Form.Item>

              <Form.Item
                label="Education"
                name="education"
              >
                <Input 
                  placeholder="e.g., Bachelor's in Computer Science"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Summary/Additional Notes"
                name="summary"
              >
                <TextArea 
                  rows={4}
                  placeholder="Brief summary or additional information about the candidate"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    size="large"
                  >
                    Save & Continue
                  </Button>
                  <Button onClick={onComplete} size="large">
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        {!extractedData && !showManualForm && !isProcessing && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Or</div>
            <br />
            <Button 
              type="link" 
              onClick={() => setShowManualForm(true)}
              style={{ padding: 0, marginTop: '8px' }}
            >
              Fill candidate information manually
            </Button>
          </div>
        )}
      </Space>
    </div>
  )
}

export default ResumeUpload