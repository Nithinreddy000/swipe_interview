import { Menu, Space } from 'antd'
import { UserOutlined, TeamOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/interviewer',
      icon: <TeamOutlined />,
      label: 'Interviewer Dashboard',
    },
    {
      key: '/interviewee',
      icon: <UserOutlined />,
      label: 'Interview Session',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const selectedKeys = [location.pathname.startsWith('/interviewee') ? '/interviewee' : location.pathname]

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '0 24px',
      height: '64px'
    }}>
      <Space>
        <h3 style={{ margin: 0, color: 'white', fontSize: '20px' }}>
          Crisp Interview Assistant
        </h3>
      </Space>
      
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={selectedKeys}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ 
          flex: 1, 
          justifyContent: 'center',
          border: 'none'
        }}
      />
    </div>
  )
}

export default Navigation