import { memo, useCallback, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Card, Space, Tag, Button, Tooltip } from 'antd'
import { EyeOutlined, UserOutlined } from '@ant-design/icons'
import { Candidate } from '@/types/index'

interface VirtualizedTableProps {
  data: Candidate[]
  onViewDetails: (candidateId: string) => void
  itemHeight?: number
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'green'
    case 'in-progress': return 'blue'
    case 'rejected': return 'red'
    default: return 'default'
  }
}

const VirtualizedTable = memo(({ 
  data, 
  onViewDetails, 
  itemHeight = 120 
}: VirtualizedTableProps) => {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  })

  const handleViewDetails = useCallback((candidateId: string) => {
    onViewDetails(candidateId)
  }, [onViewDetails])

  if (data.length === 0) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px' }}>
        <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
        <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>No candidates found</div>
      </Card>
    )
  }

  return (
    <div
      ref={parentRef}
      style={{
        height: '600px',
        width: '100%',
        overflow: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#d9d9d9 transparent',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const candidate = data[virtualItem.index]
          
          if (!candidate) return null

          return (
            <div
              key={candidate.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                padding: '4px 8px',
              }}
            >
              <Card 
                size="small"
                style={{ 
                  margin: 0,
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  height: '100%'
                }}
                bodyStyle={{ padding: '12px' }}
                hoverable
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                      <div style={{ 
                        flex: 1, 
                        minWidth: 0, 
                        contain: 'layout size paint style' as any 
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 600,
                          lineHeight: '22px', 
                          marginBottom: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {candidate.name}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                        {candidate.position}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                        •
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                        {candidate.experience} years exp.
                      </div>
                      {candidate.score && (
                        <>
                          <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>•</div>
                          <div style={{ fontSize: '12px', color: '#52c41a' }}>
                            {Math.round(candidate.score * 100)}% score
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <Space wrap size={[4, 4]}>
                        {candidate.skills.slice(0, 4).map(skill => (
                          <Tag key={skill} style={{ fontSize: '10px', margin: 0 }}>
                            {skill}
                          </Tag>
                        ))}
                        {candidate.skills.length > 4 && (
                          <Tag style={{ fontSize: '10px', margin: 0 }}>
                            +{candidate.skills.length - 4}
                          </Tag>
                        )}
                      </Space>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                    <Tag 
                      color={getStatusColor(candidate.interviewStatus)}
                      style={{ fontSize: '10px' }}
                    >
                      {candidate.interviewStatus.toUpperCase()}
                    </Tag>
                    <Tooltip title="View Interview Details">
                      <Button 
                        type="primary"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleViewDetails(candidate.id)}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px'
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
})

VirtualizedTable.displayName = 'VirtualizedTable'

export default VirtualizedTable
