import { useState, useEffect } from 'react';
import { Typography, Input, Button, Card, Alert, Tabs, Space, Divider, Tag, Row, Col, Table, Result, Timeline, notification, Avatar, Badge, Modal, Descriptions } from 'antd';
import { 
  BugOutlined, 
  SafetyOutlined, 
  UserOutlined, 
  LockOutlined,
  WarningOutlined,
  SearchOutlined,
  KeyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  LockFilled,
  UnlockOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { User } from '../../types';
import apiService from '../../api/api';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

// 样式组件
const CodeBlock = styled.pre`
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  font-family: monospace;
  position: relative;
`;

const AccessLogContainer = styled.div`
  margin-top: 16px;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 6px;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #d9d9d9;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
`;

const AccessDeniedAnimation = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    45deg,
    rgba(255, 77, 79, 0.05) 0%,
    rgba(255, 77, 79, 0.2) 50%,
    rgba(255, 77, 79, 0.05) 100%
  );
  border-radius: 6px;
  animation: pulseRed 2s infinite;
  z-index: 1;
  pointer-events: none;
  
  @keyframes pulseRed {
    0% {
      opacity: 0.1;
      box-shadow: 0 0 30px rgba(255, 77, 79, 0.2) inset;
    }
    50% {
      opacity: 0.5;
      box-shadow: 0 0 50px rgba(255, 77, 79, 0.4) inset;
    }
    100% {
      opacity: 0.1;
      box-shadow: 0 0 30px rgba(255, 77, 79, 0.2) inset;
    }
  }
`;

const AccessGrantedAnimation = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    45deg,
    rgba(82, 196, 26, 0.05) 0%,
    rgba(82, 196, 26, 0.2) 50%,
    rgba(82, 196, 26, 0.05) 100%
  );
  border-radius: 6px;
  animation: pulseGreen 2s infinite;
  z-index: 1;
  pointer-events: none;
  
  @keyframes pulseGreen {
    0% {
      opacity: 0.1;
      box-shadow: 0 0 30px rgba(82, 196, 26, 0.2) inset;
    }
    50% {
      opacity: 0.5;
      box-shadow: 0 0 50px rgba(82, 196, 26, 0.4) inset;
    }
    100% {
      opacity: 0.1;
      box-shadow: 0 0 30px rgba(82, 196, 26, 0.2) inset;
    }
  }
`;

const UserCard = styled(Card)`
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  margin-top: 20px;
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.1);
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-3px);
  }
`;

const DataField = styled.div`
  margin: 8px 0;
  position: relative;
  
  &.sensitive {
    padding: 8px;
    background-color: #fff2e8;
    border-radius: 4px;
    border-left: 2px solid #ff4d4f;
    margin-top: 12px;
    margin-bottom: 12px;
    
    &:before {
      content: '敏感信息';
      position: absolute;
      top: -10px;
      left: 8px;
      background-color: #ff4d4f;
      color: white;
      padding: 0 8px;
      border-radius: 2px;
      font-size: 12px;
    }
  }
`;

const AuthCheckAnimation = styled.div`
  padding: 20px;
  background-color: #141414;
  border-radius: 6px;
  color: #0f0;
  font-family: monospace;
  margin-top: 20px;
  position: relative;
  overflow: hidden;
  
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
                              transparent, 
                              rgba(0, 255, 0, 0.1), 
                              transparent);
    animation: scanEffect 2s linear infinite;
  }
  
  @keyframes scanEffect {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const AccessDeniedBanner = styled.div`
  background-color: #ff4d4f;
  color: white;
  padding: 15px;
  border-radius: 6px;
  margin-top: 16px;
  position: relative;
  overflow: hidden;
  animation: slideIn 0.5s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background-color: white;
    animation: blinkBorder 1s infinite;
  }
  
  @keyframes blinkBorder {
    50% {
      opacity: 0.5;
    }
  }
`;

const AuthCheckSteps = [
  { key: 'request', title: '接收请求', description: '用户请求获取账户信息' },
  { key: 'check', title: '权限检查', description: '验证用户是否有权限查看' },
  { key: 'response', title: '返回响应', description: '返回相应数据或拒绝访问' }
];

// 扩展用户数据，添加更多字段用于演示
const extendedUserData = [
  { 
    id: 1, 
    username: 'admin', 
    email: 'admin@example.com', 
    created_at: '2023-01-01', 
    role: 'administrator',
    phone: '138****1234',
    address: '北京市海淀区',
    payment_info: {
      card_number: '**** **** **** 5678',
      expiry: '06/26'
    },
    balance: 10000,
    last_login: '2023-03-15 14:30:22'
  },
  { 
    id: 2, 
    username: 'test', 
    email: 'test@example.com', 
    created_at: '2023-01-15', 
    role: 'user',
    phone: '139****5678',
    address: '上海市徐汇区',
    payment_info: {
      card_number: '**** **** **** 1234',
      expiry: '09/25'
    },
    balance: 5000,
    last_login: '2023-03-14 08:15:42'
  },
  { 
    id: 3, 
    username: 'user', 
    email: 'user@example.com', 
    created_at: '2023-02-01', 
    role: 'user',
    phone: '137****9012',
    address: '广州市天河区',
    payment_info: {
      card_number: '**** **** **** 9012',
      expiry: '12/24'
    },
    balance: 3500,
    last_login: '2023-03-10 12:45:36'
  }
];

const InsecureReference = () => {
  const [userId, setUserId] = useState<string>('');
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [accessLogs, setAccessLogs] = useState<Array<{time: string, action: string, status: string}>>([]);
  const [showSensitiveData, setShowSensitiveData] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(false);
  const [currentAuthStep, setCurrentAuthStep] = useState<number>(0);
  const [showAccessAnimation, setShowAccessAnimation] = useState<boolean>(false);
  const [accessAnimationType, setAccessAnimationType] = useState<'denied' | 'granted'>('denied');
  const [securityScanActive, setSecurityScanActive] = useState<boolean>(false);
  const [scanConsoleOutput, setScanConsoleOutput] = useState<Array<{text: string, type: string}>>([]);
  const [securityBreach, setSecurityBreach] = useState<boolean>(false);
  const [accessViolation, setAccessViolation] = useState<boolean>(false);
  const [idorAnimation, setIdorAnimation] = useState<boolean>(false);
  const [detailedUserData, setDetailedUserData] = useState<any | null>(null);

  // 模拟用户会话 - 通常从登录状态中获取
  const currentUser = {
    id: 1, // 当前登录用户ID
    username: 'admin',
    role: 'admin'
  };

  useEffect(() => {
    // 添加一条初始访问日志
    addAccessLog('初始化系统', 'success');
  }, []);

  // 添加访问日志
  const addAccessLog = (action: string, status: 'success' | 'warning' | 'error') => {
    const now = new Date().toLocaleTimeString();
    setAccessLogs(prev => [{
      time: now,
      action,
      status
    }, ...prev].slice(0, 10)); // 只保留最近10条日志
  };

  // 增强不安全的用户数据获取 - 更好的动画效果
  const handleVulnerableSearch = async () => {
    if (!userId.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setIdorAnimation(false);
    setSecurityBreach(false);
    setDetailedUserData(null);
    
    // 记录请求日志
    addAccessLog(`请求用户ID: ${userId} 的数据 (不安全方式)`, 'warning');
    
    // 激活模拟数据库扫描
    setSecurityScanActive(true);
    setScanConsoleOutput([
      {text: '接收查询请求...', type: 'info'},
      {text: `搜索用户ID: ${userId}`, type: 'query'},
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setScanConsoleOutput(prev => [
      ...prev,
      {text: '构建SQL查询: SELECT * FROM users WHERE id = ' + userId, type: 'query'},
      {text: '执行数据库查询...', type: 'process'},
    ]);
    
    try {
      // 直接模拟API响应
      const id = parseInt(userId, 10);
      const userData = extendedUserData.find(user => user.id === id);
      
      // 模拟请求延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (userData) {
        setScanConsoleOutput(prev => [
          ...prev,
          {text: '找到用户记录', type: 'success'},
          {text: '返回用户数据...', type: 'process'},
          {text: '无权限验证 - 直接返回所有数据', type: 'warning'},
        ]);
        
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // 设置更详细的用户数据展示
        setDetailedUserData(userData);
        setResult(userData);
        
        // 记录成功日志
        addAccessLog(`已获取用户ID: ${userId} 的数据，无权限检查`, 'error');
        
        // 如果获取的是非当前用户的敏感数据，显示警告
        if (id !== currentUser.id) {
          setIdorAnimation(true);
          setSecurityBreach(true);
          
          setScanConsoleOutput(prev => [
            ...prev,
            {text: '安全警告: 访问了其他用户的数据!', type: 'error'},
            {text: '检测到不安全直接对象引用(IDOR)漏洞', type: 'error'},
          ]);
          
          // 模拟黑客工具请求
          setTimeout(() => {
            setScanConsoleOutput(prev => [
              ...prev,
              {text: 'IDOR漏洞允许未授权访问其他用户的私人数据', type: 'error'},
              {text: '实际攻击中，攻击者可以通过遍历ID获取所有用户数据', type: 'error'},
            ]);
          }, 800);
          
          notification.error({
            message: '安全漏洞',
            description: '您成功获取了其他用户的敏感数据。在不安全的应用中，这可能泄露用户私人信息。',
            duration: 0
          });
          
          // 显示权限被绕过的动画
          setAccessAnimationType('granted');
          setShowAccessAnimation(true);
          setTimeout(() => setShowAccessAnimation(false), 4000);
        }
      } else {
        setScanConsoleOutput(prev => [
          ...prev,
          {text: '未找到用户记录', type: 'error'},
          {text: '返回错误信息...', type: 'process'},
        ]);
        
        setError('用户不存在');
        addAccessLog(`用户ID: ${userId} 不存在`, 'error');
      }
    } catch (err: any) {
      console.error('获取用户数据失败:', err);
      setError(err.response?.data?.error || '获取数据失败');
      addAccessLog(`请求用户ID: ${userId} 的数据失败`, 'error');
    } finally {
      setLoading(false);
      
      // 保持控制台输出一段时间后关闭
      setTimeout(() => {
        setSecurityScanActive(false);
      }, 5000);
    }
  };

  // 安全的用户数据获取 - 增强视觉展示
  const handleSecureSearch = async () => {
    if (!userId.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setIdorAnimation(false);
    setSecurityBreach(false);
    setAccessViolation(false);
    setDetailedUserData(null);
    
    setShowAuthModal(true);
    setCheckingAuth(true);
    setCurrentAuthStep(0);
    
    // 记录请求日志
    addAccessLog(`请求用户ID: ${userId} 的数据 (安全方式)`, 'success');
    
    // 激活安全扫描动画
    setSecurityScanActive(true);
    setScanConsoleOutput([
      {text: '接收查询请求...', type: 'info'},
      {text: `搜索用户ID: ${userId}`, type: 'query'},
      {text: '启动权限验证...', type: 'process'},
    ]);
    
    // 模拟授权检查流程
    await new Promise(resolve => setTimeout(resolve, 800));
    setCurrentAuthStep(1);
    
    setScanConsoleOutput(prev => [
      ...prev,
      {text: '获取当前用户信息...', type: 'process'},
      {text: `当前用户ID: ${currentUser.id}, 角色: ${currentUser.role}`, type: 'info'},
      {text: '执行权限检查...', type: 'process'},
    ]);
    
    // 模拟授权检查 - 只允许访问自己的ID或管理员可以访问所有
    const requestedId = parseInt(userId, 10);
    const hasAccess = currentUser.role === 'admin' || currentUser.id === requestedId;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentAuthStep(2);
    
    if (!hasAccess) {
      setScanConsoleOutput(prev => [
        ...prev,
        {text: '权限验证失败!', type: 'error'},
        {text: '用户无权访问请求的资源', type: 'error'},
        {text: '终止请求并返回403错误', type: 'process'},
      ]);
      
      setIsAuthorized(false);
      setAccessViolation(true);
      addAccessLog(`拒绝访问用户ID: ${userId} 的数据，权限不足`, 'error');
      
      // 显示访问被拒绝的动画
      setAccessAnimationType('denied');
      setShowAccessAnimation(true);
      setTimeout(() => setShowAccessAnimation(false), 4000);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setCheckingAuth(false);
      setLoading(false);
      
      // 保持控制台输出一段时间后关闭
      setTimeout(() => {
        setSecurityScanActive(false);
      }, 5000);
      return;
    }
    
    setScanConsoleOutput(prev => [
      ...prev,
      {text: '权限验证通过!', type: 'success'},
      {text: '构建安全SQL查询...', type: 'process'},
      {text: '执行数据库查询...', type: 'process'},
    ]);
    
    setIsAuthorized(true);
    
    try {
      // 模拟API请求
      const userData = extendedUserData.find(user => user.id === requestedId);
      
      // 延长演示时间
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (userData) {
        setScanConsoleOutput(prev => [
          ...prev,
          {text: '找到用户记录', type: 'success'},
          {text: '返回授权的用户数据...', type: 'process'},
        ]);
        
        setResult(userData);
        setDetailedUserData(userData);
        addAccessLog(`已授权访问用户ID: ${userId} 的数据`, 'success');
        
        // 显示访问成功的动画
        setAccessAnimationType('granted');
        setShowAccessAnimation(true);
        setTimeout(() => setShowAccessAnimation(false), 3000);
      } else {
        setScanConsoleOutput(prev => [
          ...prev,
          {text: '未找到用户记录', type: 'error'},
          {text: '返回404错误', type: 'process'},
        ]);
        
        setError('用户不存在');
        addAccessLog(`用户ID: ${userId} 不存在`, 'error');
      }
    } catch (err: any) {
      console.error('获取用户数据失败:', err);
      setError(err.response?.data?.error || '获取数据失败');
      addAccessLog(`请求用户ID: ${userId} 的数据失败`, 'error');
    } finally {
      setLoading(false);
      setCheckingAuth(false);
      
      // 关闭模态窗口
      setTimeout(() => {
        setShowAuthModal(false);
      }, 800);
      
      // 保持控制台输出一段时间后关闭
      setTimeout(() => {
        setSecurityScanActive(false);
      }, 5000);
    }
  };

  // 敏感信息切换
  const toggleSensitiveData = () => {
    setShowSensitiveData(!showSensitiveData);
    if (!showSensitiveData) {
      notification.warning({
        message: '敏感数据已显示',
        description: '在实际应用中，敏感数据应有额外的保护措施，并确保只有授权用户才能访问。',
        duration: 3
      });
    }
  };

  // 渲染用户信息卡片
  const renderUserCard = (user: any) => {
    return (
      <UserCard 
        title={
          <Space>
            <Avatar 
              style={{ 
                backgroundColor: user.role === 'administrator' ? '#ff4d4f' : '#1890ff',
                verticalAlign: 'middle'
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
            <span>{user.username}</span>
            <Badge 
              count={user.role === 'administrator' ? '管理员' : '普通用户'} 
              style={{ 
                backgroundColor: user.role === 'administrator' ? '#ff4d4f' : '#1890ff'
              }} 
            />
          </Space>
        }
        extra={
          <Button 
            type="link" 
            icon={showSensitiveData ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={toggleSensitiveData}
          >
            {showSensitiveData ? '隐藏敏感信息' : '显示敏感信息'}
          </Button>
        }
      >
        {showAccessAnimation && (
          accessAnimationType === 'denied' 
            ? <AccessDeniedAnimation /> 
            : <AccessGrantedAnimation />
        )}
        
        {securityBreach && (
          <Alert
            message="检测到IDOR漏洞利用!"
            description="通过修改URL或参数中的ID值，访问了其他用户的数据。这个安全漏洞允许未授权用户访问系统中的敏感数据。"
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            banner
          />
        )}
        
        <Row gutter={16}>
          <Col span={12}>
            <DataField>
              <Text strong>用户ID:</Text> {user.id}
            </DataField>
            <DataField>
              <Text strong>电子邮箱:</Text> {user.email}
            </DataField>
            <DataField>
              <Text strong>注册时间:</Text> {user.created_at}
            </DataField>
            <DataField>
              <Text strong>上次登录:</Text> {user.last_login}
            </DataField>
          </Col>
          <Col span={12}>
            <DataField>
              <Text strong>角色:</Text> {user.role}
            </DataField>
            <DataField>
              <Text strong>电话号码:</Text> {user.phone}
            </DataField>
            <DataField>
              <Text strong>地址:</Text> {user.address}
            </DataField>
          </Col>
        </Row>
        
        {showSensitiveData && (
          <div style={{ marginTop: 16 }}>
            <Divider orientation="left">
              <Tag color="error">敏感信息</Tag>
            </Divider>
            <Row gutter={16}>
              <Col span={12}>
                <DataField className="sensitive">
                  <Text strong>支付信息:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color="red">卡号: {user.payment_info.card_number}</Tag>
                    <Tag color="red" style={{ marginTop: 4 }}>有效期: {user.payment_info.expiry}</Tag>
                  </div>
                </DataField>
              </Col>
              <Col span={12}>
                <DataField className="sensitive">
                  <Text strong>账户余额:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color="red" style={{ fontSize: 16 }}>¥{user.balance.toFixed(2)}</Tag>
                  </div>
                </DataField>
              </Col>
            </Row>
          </div>
        )}
      </UserCard>
    );
  };
  
  // 渲染安全扫描控制台
  const renderSecurityConsole = () => {
    if (!securityScanActive) return null;
    
    return (
      <AuthCheckAnimation>
        <div style={{ marginBottom: 10 }}>
          <LockOutlined style={{ marginRight: 8 }} /> 安全扫描日志
        </div>
        <div style={{ maxHeight: 150, overflowY: 'auto' }}>
          {scanConsoleOutput.map((line, index) => (
            <div key={index} style={{ 
              color: line.type === 'error' ? '#ff4d4f' : 
                     line.type === 'warning' ? '#faad14' : 
                     line.type === 'success' ? '#52c41a' : 
                     line.type === 'query' ? '#1890ff' : '#fff',
              marginBottom: 4
            }}>
              {line.type === 'error' ? <CloseCircleOutlined style={{ marginRight: 8 }} /> : 
               line.type === 'warning' ? <WarningOutlined style={{ marginRight: 8 }} /> :
               line.type === 'success' ? <CheckCircleOutlined style={{ marginRight: 8 }} /> :
               line.type === 'info' ? <InfoCircleOutlined style={{ marginRight: 8 }} /> :
               line.type === 'query' ? <SearchOutlined style={{ marginRight: 8 }} /> :
               <LoadingOutlined style={{ marginRight: 8 }} />}
              {line.text}
            </div>
          ))}
        </div>
      </AuthCheckAnimation>
    );
  };

  return (
    <div className="idor-page">
      <Title level={2}>
        <BugOutlined /> 不安全直接对象引用 (IDOR) 漏洞演示
      </Title>

      <Paragraph>
        不安全直接对象引用 (IDOR) 是一种访问控制漏洞，当应用程序直接使用用户提供的输入来访问对象而没有进行适当的授权检查时，
        攻击者可以通过修改参数值来访问未经授权的资源，例如其他用户的账户信息、文件等。
      </Paragraph>

      <Alert
        message="安全警告"
        description="此页面仅用于教育目的，演示不安全直接对象引用漏洞。在实际应用中，请务必实施适当的访问控制机制，确保用户只能访问其被授权的资源。"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card 
        title={
          <Space>
            <UserOutlined /> 当前登录用户
          </Space>
        } 
        style={{ marginBottom: 24 }}
      >
        <Space align="center">
          <Avatar style={{ backgroundColor: '#1890ff' }}>
            {currentUser.username.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div><Text strong>{currentUser.username}</Text></div>
            <div>
              <Tag color="blue">ID: {currentUser.id}</Tag>
              <Tag color="purple">角色: {currentUser.role}</Tag>
            </div>
          </div>
        </Space>
        
        <Divider />
        
        <Paragraph>
          在本演示中，将模拟以当前用户身份尝试访问不同ID的用户数据。
          <ul>
            <li>作为管理员，您有权限查看所有用户的数据（在安全实现中）</li>
            <li>作为普通用户，您只能查看自己的数据（ID: {currentUser.id}）</li>
          </ul>
        </Paragraph>
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={14}>
          <Tabs defaultActiveKey="1" style={{ marginBottom: 32 }}>
            <TabPane 
              tab={<span><BugOutlined /> 不安全实现 (易受攻击)</span>} 
              key="1"
            >
              <Alert
                message="漏洞提示"
                description="此实现直接根据用户提供的ID返回数据，没有检查当前用户是否有权限访问该数据。"
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <CodeBlock>
                <code>
                  // 不安全的实现 - 没有权限检查<br/>
                  app.get('/api/user/:id', (req, res) =&gt; &lbrace;<br/>
                  &nbsp;&nbsp;const userId = req.params.id;<br/><br/>
                  &nbsp;&nbsp;// 直接查询数据库，无权限验证<br/>
                  &nbsp;&nbsp;db.query('SELECT * FROM users WHERE id = ?', [userId])<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;.then(user =&gt; &lbrace;<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (!user) return res.status(404).json(&lbrace; error: '用户不存在' &rbrace;);<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;res.json(user);<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&rbrace;);<br/>
                  &rbrace;);
                </code>
              </CodeBlock>
              
              <Divider />
              
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  prefix={<UserOutlined />}
                  placeholder="输入要查询的用户ID（尝试查询不同的ID）"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onPressEnter={handleVulnerableSearch}
                />
                
                <Button 
                  type="primary" 
                  danger
                  icon={<SearchOutlined />}
                  onClick={handleVulnerableSearch} 
                  loading={loading}
                  disabled={!userId.trim()}
                >
                  获取用户数据 (不安全)
                </Button>
                
                {securityScanActive && renderSecurityConsole()}
                
                {error && (
                  <Alert message="错误" description={error} type="error" showIcon />
                )}
                
                {result && renderUserCard(result)}
                
                {idorAnimation && (
                  <Alert 
                    message="IDOR漏洞利用成功" 
                    description={
                      <div>
                        <p>您成功利用了不安全直接对象引用漏洞访问其他用户的数据。</p>
                        <p>在真实场景中，攻击者可以遍历ID值，批量获取系统中所有用户的敏感信息。</p>
                      </div>
                    }
                    type="error" 
                    showIcon 
                    style={{ marginTop: 16 }}
                  />
                )}
              </Space>
            </TabPane>
            
            <TabPane 
              tab={<span><SafetyOutlined /> 安全实现 (已防护)</span>} 
              key="2"
            >
              <Alert
                message="安全提示"
                description="此实现检查当前用户是否有权限访问请求的数据，只允许用户访问自己的数据或管理员访问所有数据。"
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <CodeBlock>
                <code>
                  // 安全的实现 - 包含权限检查<br/>
                  app.get('/api/secure/user/:id', authMiddleware, (req, res) =&gt; &lbrace;<br/>
                  &nbsp;&nbsp;const requestedUserId = req.params.id;<br/>
                  &nbsp;&nbsp;const currentUserId = req.user.id;<br/>
                  &nbsp;&nbsp;const isAdmin = req.user.role === 'admin';<br/><br/>
                  &nbsp;&nbsp;// 检查权限：只有用户本人或管理员可以访问<br/>
                  &nbsp;&nbsp;if (currentUserId !== requestedUserId && !isAdmin) &lbrace;<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;return res.status(403).json(&lbrace; error: '权限不足' &rbrace;);<br/>
                  &nbsp;&nbsp;&rbrace;<br/><br/>
                  &nbsp;&nbsp;// 查询数据库<br/>
                  &nbsp;&nbsp;db.query('SELECT * FROM users WHERE id = ?', [requestedUserId])<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;.then(user =&gt; &lbrace;<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (!user) return res.status(404).json(&lbrace; error: '用户不存在' &rbrace;);<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;res.json(user);<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&rbrace;);<br/>
                  &rbrace;);
                </code>
              </CodeBlock>
              
              <Divider />
              
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  prefix={<UserOutlined />}
                  placeholder="输入要查询的用户ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onPressEnter={handleSecureSearch}
                />
                
                <Button 
                  type="primary"
                  icon={<LockOutlined />}
                  onClick={handleSecureSearch} 
                  loading={loading}
                  disabled={!userId.trim()}
                >
                  获取用户数据 (安全)
                </Button>
                
                {securityScanActive && renderSecurityConsole()}
                
                {error && (
                  <Alert message="错误" description={error} type="error" showIcon />
                )}
                
                {accessViolation && (
                  <AccessDeniedBanner>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <LockFilled style={{ fontSize: 24, marginRight: 12 }} />
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>访问被拒绝</div>
                        <div>您没有权限访问请求的资源。安全系统阻止了未授权的数据访问请求。</div>
                      </div>
                    </div>
                  </AccessDeniedBanner>
                )}
                
                {!isAuthorized && !accessViolation && (
                  <Alert 
                    message="访问被拒绝" 
                    description="您没有权限访问此用户的数据。在安全系统中，用户只能访问自己的数据，除非具有管理员权限。" 
                    type="error" 
                    showIcon 
                    style={{ marginTop: 16 }}
                  />
                )}
                
                {result && isAuthorized && renderUserCard(result)}
              </Space>
            </TabPane>
          </Tabs>
        </Col>
        
        <Col xs={24} md={10}>
          <Card 
            title={
              <Space>
                <KeyOutlined /> 访问控制日志
              </Space>
            } 
            style={{ marginBottom: 16 }}
          >
            <AccessLogContainer>
              <Timeline mode="left" style={{ marginTop: 10 }}>
                {accessLogs.map((log, index) => (
                  <Timeline.Item 
                    key={index} 
                    color={
                      log.status === 'success' ? 'green' : 
                      log.status === 'warning' ? 'orange' : 'red'
                    }
                    label={log.time}
                  >
                    {log.action}
                  </Timeline.Item>
                ))}
              </Timeline>
            </AccessLogContainer>
          </Card>
          
          <Card 
            title={
              <Space>
                <SafetyOutlined /> 安全防护建议
              </Space>
            }
          >
            <Timeline>
              <Timeline.Item color="blue">
                <Text strong>实施基于用户角色的访问控制 (RBAC)</Text>
                <p>确保用户只能访问其有权查看的资源</p>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <Text strong>使用间接对象引用</Text>
                <p>使用与数据库ID无关的随机标识符或UUID代替直接ID</p>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <Text strong>对每个请求进行权限验证</Text>
                <p>确保每次资源访问前都验证用户权限</p>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <Text strong>限制API返回的敏感数据字段</Text>
                <p>只返回用户需要的数据，隐藏敏感信息</p>
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
      </Row>
      
      <Modal
        title="权限验证过程"
        open={showAuthModal}
        footer={null}
        closable={!checkingAuth}
        onCancel={() => setShowAuthModal(false)}
      >
        <div style={{ padding: '20px 0' }}>
          {AuthCheckSteps.map((step, index) => (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
              <div style={{ marginRight: 16 }}>
                {currentAuthStep > index ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />
                ) : currentAuthStep === index ? (
                  <LoadingOutlined style={{ color: '#1890ff', fontSize: 24 }} />
                ) : (
                  <div style={{ width: 24, height: 24, opacity: 0.25 }}>
                    {index + 1}
                  </div>
                )}
              </div>
              <div>
                <div><Text strong>{step.title}</Text></div>
                <div><Text type="secondary">{step.description}</Text></div>
              </div>
            </div>
          ))}
          
          {currentAuthStep === 2 && !isAuthorized && (
            <Alert
              message="访问被拒绝"
              description="当前用户没有权限访问请求的资源"
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
          
          {currentAuthStep === 2 && isAuthorized && (
            <Alert
              message="访问已授权"
              description="验证通过，用户有权访问请求的资源"
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default InsecureReference; 