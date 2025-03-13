import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import styled, { ThemeProvider } from 'styled-components'
import { Layout, Menu, theme, Typography, Button, Avatar, Space, Dropdown } from 'antd'
import {
  DashboardOutlined,
  BarChartOutlined,
  SafetyOutlined,
  BugOutlined,
  SettingOutlined,
  EyeOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CodeOutlined,
  DatabaseOutlined,
  FileOutlined,
  LinkOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content, Footer } = Layout
const { Title } = Typography

// 样式组件
const StyledLayout = styled(Layout)`
  min-height: 100vh;
`

const StyledLogo = styled.div`
  height: 32px;
  margin: 16px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
`

const StyledHeader = styled(Header)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
`

const StyledContent = styled(Content)`
  margin: 24px 16px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  overflow: auto;
`

const StyledFooter = styled(Footer)`
  text-align: center;
  color: #777;
`

function App() {
  return (
    <ThemeProvider theme={{}}>
      <AppLayout />
    </ThemeProvider>
  )
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { token } = theme.useToken()
  const location = useLocation()
  const navigate = useNavigate()
  
  // 确定当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname
    if (path.includes('/dashboard')) return ['dashboard']
    if (path.includes('/statistics')) return ['statistics']
    if (path.includes('/vulnerabilities')) {
      if (path.includes('/sql-injection')) return ['vulnerabilities', 'sql-injection']
      if (path.includes('/xss-attack')) return ['vulnerabilities', 'xss-attack']
      if (path.includes('/file-upload')) return ['vulnerabilities', 'file-upload']
      if (path.includes('/insecure-reference')) return ['vulnerabilities', 'insecure-reference']
      return ['vulnerabilities']
    }
    if (path.includes('/protection')) return ['protection']
    if (path.includes('/visualization')) return ['visualization']
    return ['dashboard']
  }

  // 用户下拉菜单
  const userMenu = (
    <Menu
      items={[
        { key: 'profile', label: '个人资料', icon: <UserOutlined /> },
        { key: 'settings', label: '设置', icon: <SettingOutlined /> },
        { key: 'logout', label: '退出登录', danger: true }
      ]}
    />
  )

  return (
    <StyledLayout>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="dark"
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: token.colorPrimary,
        }}
      >
        <StyledLogo>
          {!collapsed ? 'Web应用安全检测系统' : '安全系统'}
        </StyledLogo>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: <Link to="/dashboard">控制面板</Link>,
            },
            {
              key: 'statistics',
              icon: <BarChartOutlined />,
              label: <Link to="/statistics">数据统计</Link>,
            },
            {
              key: 'vulnerabilities',
              icon: <BugOutlined />,
              label: '漏洞演示',
              children: [
                {
                  key: 'sql-injection',
                  icon: <DatabaseOutlined />,
                  label: <Link to="/vulnerabilities/sql-injection">SQL注入</Link>,
                },
                {
                  key: 'xss-attack',
                  icon: <CodeOutlined />,
                  label: <Link to="/vulnerabilities/xss-attack">XSS攻击</Link>,
                },
                {
                  key: 'file-upload',
                  icon: <FileOutlined />,
                  label: <Link to="/vulnerabilities/file-upload">文件上传</Link>,
                },
                {
                  key: 'insecure-reference',
                  icon: <LinkOutlined />,
                  label: <Link to="/vulnerabilities/insecure-reference">不安全引用</Link>,
                },
              ],
            },
            {
              key: 'protection',
              icon: <SafetyOutlined />,
              label: <Link to="/protection">防护措施</Link>,
            },
            {
              key: 'visualization',
              icon: <EyeOutlined />,
              label: <Link to="/visualization">3D可视化</Link>,
            },
          ]}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s' }}>
        <StyledHeader>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px' }}
          />
          <Space>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>管理员</span>
              </Space>
            </Dropdown>
          </Space>
        </StyledHeader>
        <StyledContent>
          <Outlet />
        </StyledContent>
        <StyledFooter>
          Web应用安全漏洞检测和防护系统 ©{new Date().getFullYear()} 由Python驱动
        </StyledFooter>
      </Layout>
    </StyledLayout>
  )
}

export default App
