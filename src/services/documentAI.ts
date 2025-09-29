import { ResumeData } from '@/types/index'




export async function processResumeWithDocumentAI(file: File): Promise<ResumeData> {
  try {
    console.log('Processing resume with Document AI...')
    
    // For now, use fallback extraction since proper JWT signing requires backend
    // In production, this would use proper authentication
    console.warn('Using fallback extraction - Document AI requires backend authentication')
    return await fallbackResumeExtraction(file)

    // Commented out for now - would need proper backend authentication
    /*
    const accessToken = await getAccessToken()
    const base64Content = await fileToBase64(file)
    
    const requestBody = {
      name: `projects/${DOCUMENT_AI_CONFIG.projectId}/locations/${DOCUMENT_AI_CONFIG.location}/processors/${DOCUMENT_AI_CONFIG.processorId}`,
      rawDocument: {
        content: base64Content,
        mimeType: file.type
      }
    }

    const response = await fetch(
      `https://documentai.googleapis.com/v1/projects/${DOCUMENT_AI_CONFIG.projectId}/locations/${DOCUMENT_AI_CONFIG.location}/processors/${DOCUMENT_AI_CONFIG.processorId}:process`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    )

    if (!response.ok) {
      throw new Error(`Document AI API error: ${response.status}`)
    }
          if (!response.ok) {
            throw new Error(`Token request failed: ${response.status}`)
          }
          const data = await response.json()
          return data.access_token
        } catch (error) {
          console.error('Failed to get access token:', error)
          throw error
        }
      }
      // Export utility functions for use and to avoid TS unused warnings
      export { extractFieldsFromDocumentAI, extractNameFromText, extractEmailFromText, extractPhoneFromText, extractAddressFromText, extractSkillsFromText, extractExperienceFromText, extractEducationFromText, extractSummaryFromText, fileToBase64 };

      async function getAccessToken(): Promise<string> {
    const result = await response.json()
    return extractFieldsFromDocumentAI(result.document)
    */
    
  } catch (error) {
    console.error('Document AI processing failed:', error)
    return await fallbackResumeExtraction(file)
  }
}

export function extractFieldsFromDocumentAI(document: any): ResumeData {
  const entities = document.entities || []
  const text = document.text || ''
  
  const extractedData: ResumeData = {
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    skills: [],
    experience: [],
    education: [],
    summary: ''
  }

  entities.forEach((entity: any) => {
    const entityType = entity.type?.toLowerCase()
    const entityText = entity.textAnchor?.content || entity.mentionText || ''

    switch (entityType) {
      case 'person_name':
      case 'name':
        if (!extractedData.personalInfo.name) {
          extractedData.personalInfo.name = entityText
        }
        break
      case 'email':
      case 'email_address':
        extractedData.personalInfo.email = entityText
        break
      case 'phone_number':
      case 'phone':
        extractedData.personalInfo.phone = entityText
        break
      case 'address':
        extractedData.personalInfo.address = entityText
        break
      case 'skill':
      case 'technology':
        if (entityText && !extractedData.skills.includes(entityText)) {
          extractedData.skills.push(entityText)
        }
        break
    }
  })

  if (!extractedData.personalInfo.name) {
    extractedData.personalInfo.name = extractNameFromText(text)
  }
  
  if (!extractedData.personalInfo.email) {
    extractedData.personalInfo.email = extractEmailFromText(text)
  }
  
  if (!extractedData.personalInfo.phone) {
    extractedData.personalInfo.phone = extractPhoneFromText(text)
  }

  if (extractedData.skills.length === 0) {
    extractedData.skills = extractSkillsFromText(text)
  }

  extractedData.experience = extractExperienceFromText(text)
  extractedData.education = extractEducationFromText(text)
  extractedData.summary = extractSummaryFromText(text)

  return extractedData
}

async function fallbackResumeExtraction(file: File): Promise<ResumeData> {
  try {
    console.log('Starting fallback resume extraction...')
    
    if (!file) {
      throw new Error('No file provided for resume extraction')
    }

    console.log('Extracting text from PDF...')
    const text = await extractTextFromPDF(file)
    
    if (!text) {
      throw new Error('No text could be extracted from the PDF')
    }

    console.log('Text extracted successfully, parsing resume sections...')
    
    const personalInfo = {
      name: extractNameFromText(text),
      email: extractEmailFromText(text),
      phone: extractPhoneFromText(text),
      address: extractAddressFromText(text)
    }

    // Validate that we got at least some basic information
    if (!personalInfo.name && !personalInfo.email) {
      throw new Error('Could not extract basic information from the resume')
    }

    const resumeData: ResumeData = {
      personalInfo,
      skills: extractSkillsFromText(text),
      experience: extractExperienceFromText(text),
      education: extractEducationFromText(text),
      summary: extractSummaryFromText(text)
    }

    console.log('Resume extraction completed successfully')
    return resumeData
  } catch (error) {
    console.error('Fallback resume extraction failed:', error)
    if (error instanceof Error) {
      throw new Error(`Resume extraction failed: ${error.message}`)
    }
    throw new Error('Resume extraction failed: Unknown error')
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  if (!file) {
    throw new Error('No file provided for text extraction')
  }

  if (file.type !== 'application/pdf') {
    console.warn('File is not a PDF:', file.type)
    return file.name
  }

  try {
    console.log('Starting PDF extraction process...')
    const { getPdfDocument, pdfjs } = await import('@/config/pdfjs')
    
    // Make sure the worker is properly configured
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      throw new Error('PDF.js worker not configured')
    }
    
    console.log('Reading file contents...')
    const arrayBuffer = await file.arrayBuffer()
    const typedArray = new Uint8Array(arrayBuffer)
    
    console.log('Creating PDF document instance...')
    const pdfDoc = await getPdfDocument(typedArray).promise
    
    console.log(`PDF document loaded. Pages: ${pdfDoc.numPages}`)
    
    let fullText = ''
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      console.log(`Processing page ${i}/${pdfDoc.numPages}...`)
      const page = await pdfDoc.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .filter((item: any) => typeof item.str === 'string' && item.str.trim())
        .map((item: any) => item.str.trim())
        .join(' ')
      fullText += pageText + '\n'
    }
    
    if (!fullText.trim()) {
      throw new Error('No text content extracted from PDF')
    }

    console.log('PDF extraction completed successfully')
    return fullText.trim()
  } catch (error) {
    console.error('PDF extraction failed:', error)
    if (error instanceof Error) {
      throw new Error(`PDF extraction failed: ${error.message}`)
    }
    throw new Error('PDF extraction failed: Unknown error')
  }
}

function extractNameFromText(text: string): string {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  const firstLine = lines[0] || ''
  
  const namePattern = /^[A-Z][a-z]+ [A-Z][a-z]+/
  const match = firstLine.match(namePattern)
  
  return match ? match[0] : firstLine.split(' ').slice(0, 2).join(' ')
}

function extractEmailFromText(text: string): string {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  const match = text.match(emailPattern)
  return match ? match[0] : ''
}

function extractPhoneFromText(text: string): string {
  const phonePatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/,
    /\b\+?1?[-.]?\(?(\d{3})\)?[-.]?(\d{3})[-.]?(\d{4})\b/
  ]
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern)
    if (match) return match[0]
  }
  
  return ''
}

function extractAddressFromText(text: string): string {
  const addressPattern = /\b\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}\b/
  const match = text.match(addressPattern)
  return match ? match[0] : ''
}

function extractSkillsFromText(text: string): string[] {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Express',
    'Python', 'Django', 'Flask', 'Java', 'Spring', 'C++', 'C#', '.NET',
    'HTML', 'CSS', 'SASS', 'SCSS', 'MongoDB', 'MySQL', 'PostgreSQL',
    'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux',
    'REST', 'GraphQL', 'Redis', 'Elasticsearch', 'Jenkins', 'CI/CD'
  ]
  
  const foundSkills: string[] = []
  const lowerText = text.toLowerCase()
  
  commonSkills.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.push(skill)
    }
  })
  
  return [...new Set(foundSkills)]
}

function extractExperienceFromText(text: string): Array<{
  company: string
  position: string
  duration: string
  description: string
}> {
  const experience: Array<{
    company: string
    position: string
    duration: string
    description: string
  }> = []
  
  const companyPatterns = [
    /at\s+([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Company|Technologies|Tech|Solutions))/gi,
    /([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Company|Technologies|Tech|Solutions))/gi
  ]
  
  companyPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      if (experience.length < 3) {
        experience.push({
          company: match[1] || match[0],
          position: 'Software Developer',
          duration: '1-2 years',
          description: 'Software development experience'
        })
      }
    }
  })
  
  return experience
}

function extractEducationFromText(text: string): Array<{
  institution: string
  degree: string
  year: string
}> {
  const education: Array<{
    institution: string
    degree: string
    year: string
  }> = []
  
  const degreePatterns = [
    /Bachelor(?:'s)?\s+(?:of\s+)?(?:Science\s+in\s+)?Computer\s+Science/gi,
    /Master(?:'s)?\s+(?:of\s+)?(?:Science\s+in\s+)?Computer\s+Science/gi,
    /B\.?S\.?\s+Computer\s+Science/gi,
    /M\.?S\.?\s+Computer\s+Science/gi
  ]
  
  degreePatterns.forEach(pattern => {
    const match = text.match(pattern)
    if (match && education.length === 0) {
      education.push({
        institution: 'University',
        degree: match[0],
        year: '2020'
      })
    }
  })
  
  return education
}

function extractSummaryFromText(text: string): string {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  const summaryKeywords = ['summary', 'objective', 'profile', 'about']
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    if (summaryKeywords.some(keyword => line.includes(keyword))) {
      const summaryLines = lines.slice(i + 1, i + 4)
      return summaryLines.join(' ').substring(0, 200)
    }
  }
  
  return lines.slice(0, 3).join(' ').substring(0, 200)
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}