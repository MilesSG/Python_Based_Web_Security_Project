import { useState, useEffect } from 'react';
import { Typography, Input, Button, Card, Table, Alert, Tabs, Space, Divider, Tag, Row, Col, notification, Spin, Modal, Progress } from 'antd';
import { SearchOutlined, BugOutlined, SafetyOutlined, WarningOutlined, InfoCircleOutlined, AlertOutlined, LoadingOutlined } from '@ant-design/icons';
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

const AnimatedQueryContainer = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #000;
  border-radius: 6px;
  color: #33ff33;
  font-family: 'Courier New', monospace;
  overflow: hidden;
  position: relative;
  height: ${props => props.active ? '150px' : '0px'};
  transition: height 0.3s ease-in-out;
`;

const BlinkingCursor = styled.span`
  animation: blink 1s step-end infinite;
  @keyframes blink {
    50% { opacity: 0; }
  }
`;

const SqlInjection = () => {
  const [username, setUsername] = useState<string>('');
  const [secureUsername, setSecureUsername] = useState<string>('');
  const [result, setResult] = useState<User | null>(null);
  const [secureResult, setSecureResult] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secureError, setSecureError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [secureLoading, setSecureLoading] = useState<boolean>(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [secureResponseTime, setSecureResponseTime] = useState<number | null>(null);
  const [showRawQuery, setShowRawQuery] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [multipleResults, setMultipleResults] = useState<User[] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [attackProgress, setAttackProgress] = useState(0);
  const [attackStage, setAttackStage] = useState('');

  // 恶意SQL注入示例
  const sqlInjectionExamples = [
    { name: "正常输入", payload: "admin", description: "标准查询，返回指定用户" },
    { name: "显示所有用户", payload: "' OR '1'='1", description: "返回所有用户记录，绕过身份验证" },
    { name: "删除表", payload: "'; DROP TABLE users; --", description: "尝试删除整个用户表" },
    { name: "联合查询", payload: "' UNION SELECT username, password, '', '', '' FROM users --", description: "通过联合查询暴露密码字段" }
  ];

  useEffect(() => {
    // 动画效果：查询文本逐步显示
    if (isAnimating && queryText) {
      let currentIndex = 0;
      const text = queryText;
      setQueryText('');
      
      const typingInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setQueryText(prev => prev + text[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsAnimating(false);
        }
      }, 30);
      
      return () => clearInterval(typingInterval);
    }
  }, [isAnimating, queryText]);

  // 不安全查询 - 容易受到SQL注入攻击
  const handleVulnerableSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setMultipleResults(null);
    
    // 显示SQL查询动画
    const rawQuery = `SELECT * FROM users WHERE username = '${username}'`;
    setQueryText(rawQuery);
    setShowRawQuery(true);
    setIsAnimating(true);
    
    const startTime = performance.now();
    
    try {
      // 特殊处理某些SQL注入示例以增强演示效果
      if (username.includes("DROP TABLE")) {
        // 模拟表被删除的攻击
        await simulateDatabaseAttack("DROP TABLE");
        setError('严重错误: 数据表已被删除！需要系统管理员恢复数据。');
      } else if (username.includes("UNION SELECT")) {
        // 模拟联合查询攻击
        await new Promise(resolve => setTimeout(resolve, 800));
        setMultipleResults([
          { id: 1, username: 'admin', email: 'admin@example.com', created_at: '2023-01-01' },
          { id: 2, username: 'test', email: 'test@example.com', created_at: '2023-01-02' },
          { id: 3, username: 'user', password: 'user123', email: 'user@example.com', created_at: '2023-01-03' }
        ]);
        notification.error({
          message: '安全警告',
          description: '检测到SQL注入攻击，攻击者可能获取了敏感数据！',
          duration: 5
        });
      } else if (username.includes("OR '1'='1")) {
        // 模拟获取所有用户记录
        await new Promise(resolve => setTimeout(resolve, 600));
        setMultipleResults([
          { id: 1, username: 'admin', email: 'admin@example.com', created_at: '2023-01-01' },
          { id: 2, username: 'test', email: 'test@example.com', created_at: '2023-01-02' },
          { id: 3, username: 'user', email: 'user@example.com', created_at: '2023-01-03' },
          { id: 4, username: 'john', email: 'john@example.com', created_at: '2023-01-04' },
          { id: 5, username: 'jane', email: 'jane@example.com', created_at: '2023-01-05' }
        ]);
        notification.warning({
          message: '安全警告',
          description: '检测到SQL注入攻击，查询返回了所有用户记录！',
          duration: 4
        });
      } else {
        // 正常API调用
        const response = await apiService.getUserByUsername(username);
        const endTime = performance.now();
        setResponseTime(endTime - startTime);
        
        if (Array.isArray(response.data)) {
          setMultipleResults(response.data);
        } else {
          setResult(response.data);
        }
      }
    } catch (err: any) {
      const endTime = performance.now();
      setResponseTime(endTime - startTime);
      setError(err.response?.data?.error || '查询失败');
      console.error('查询失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 模拟数据库攻击
  const simulateDatabaseAttack = async (attackType: string) => {
    setShowModal(true);
    setAttackProgress(0);
    setAttackStage('正在连接到数据库...');
    
    await new Promise(resolve => setTimeout(resolve, 600));
    setAttackProgress(20);
    setAttackStage('解析SQL查询...');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setAttackProgress(40);
    setAttackStage('执行恶意SQL代码...');
    
    await new Promise(resolve => setTimeout(resolve, 700));
    setAttackProgress(60);
    
    if (attackType === "DROP TABLE") {
      setAttackStage('正在删除users表...');
      await new Promise(resolve => setTimeout(resolve, 800));
      setAttackProgress(80);
      setAttackStage('数据表已被删除!');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAttackProgress(100);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowModal(false);
  };

  // 安全查询 - 使用参数化查询
  const handleSecureSearch = async () => {
    setSecureLoading(true);
    setSecureError(null);
    setSecureResult(null);
    
    const startTime = performance.now();
    
    try {
      const response = await apiService.getUserByUsernameSecure(secureUsername);
      const endTime = performance.now();
      setSecureResponseTime(endTime - startTime);
      setSecureResult(response.data);
    } catch (err: any) {
      const endTime = performance.now();
      setSecureResponseTime(endTime - startTime);
      setSecureError(err.response?.data?.error || '查询失败');
      console.error('查询失败:', err);
    } finally {
      setSecureLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '密码',
      dataIndex: 'password',
      key: 'password',
      render: (text: string) => text ? (
        <Tag color="error">
          <WarningOutlined /> {text}
          <small style={{ marginLeft: 8, color: '#ff4d4f' }}>(敏感信息泄露!)</small>
        </Tag>
      ) : '******'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ];

  return (
    <div className="sql-injection-page">
      <Title level={2}>
        <BugOutlined /> SQL注入漏洞演示
      </Title>

      <Paragraph>
        SQL注入是一种常见的Web应用程序漏洞，攻击者可以在输入字段中注入恶意SQL代码，从而操纵数据库执行非预期的操作。
        这可能导致数据泄露、数据损坏或未授权访问敏感信息。
      </Paragraph>

      <Alert
        message="安全警告"
        description="此页面仅用于教育目的，演示SQL注入漏洞。在实际应用中，请务必使用参数化查询或ORM框架来防止SQL注入攻击。"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="SQL注入攻击示例" style={{ marginBottom: 24 }}>
        <Paragraph>
          以下是一些常见的SQL注入攻击示例，您可以在不安全查询中测试这些示例：
        </Paragraph>
        <Row gutter={[16, 16]}>
          {sqlInjectionExamples.map((example, index) => (
            <Col xs={24} md={12} key={index}>
              <Card size="small" hoverable style={{ backgroundColor: index === 0 ? '#f6ffed' : '#fff2e8' }}>
                <Space>
                  {index === 0 ? <InfoCircleOutlined /> : <WarningOutlined style={{ color: '#ff4d4f' }} />}
                  <div>
                    <div><strong>{example.name}</strong></div>
                    <div><small>{example.description}</small></div>
                    <div>
                      <Tag color={index === 0 ? 'success' : 'error'} style={{ marginTop: 8 }}>
                        {example.payload}
                      </Tag>
                    </div>
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => setUsername(example.payload)}
                      style={{ padding: 0, marginTop: 8 }}
                    >
                      使用此示例
                    </Button>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Tabs defaultActiveKey="1" style={{ marginBottom: 32 }}>
        <TabPane 
          tab={<span><BugOutlined /> 不安全查询 (易受攻击)</span>} 
          key="1"
        >
          <Alert
            message="漏洞提示"
            description="此查询直接拼接SQL语句，容易受到SQL注入攻击。"
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <CodeBlock>
            <code>
              // 不安全的SQL查询 - 直接拼接用户输入<br/>
              const query = `SELECT * FROM users WHERE username = '${username}'`;<br/>
              db.query(query);
            </code>
          </CodeBlock>
          
          <Divider />
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="输入用户名（尝试使用SQL注入）"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onPressEnter={handleVulnerableSearch}
            />
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                type="primary" 
                onClick={handleVulnerableSearch} 
                loading={loading}
                disabled={!username}
                danger
                icon={<AlertOutlined />}
              >
                执行不安全查询
              </Button>

              <Button 
                type="default" 
                onClick={() => setShowRawQuery(!showRawQuery)}
                disabled={!username}
              >
                {showRawQuery ? '隐藏原始SQL' : '显示原始SQL'}
              </Button>
            </div>
            
            {showRawQuery && (
              <AnimatedQueryContainer active={showRawQuery}>
                <div>
                  <span style={{ color: '#ffcc00' }}>执行查询: </span>
                  {queryText}<BlinkingCursor>_</BlinkingCursor>
                </div>
                {loading && <div style={{ marginTop: '10px' }}><LoadingOutlined /> 执行中...</div>}
                {!loading && !error && (result || multipleResults) && <div style={{ marginTop: '10px', color: '#00cc00' }}>查询成功！</div>}
                {!loading && error && <div style={{ marginTop: '10px', color: '#ff3333' }}>查询失败: {error}</div>}
              </AnimatedQueryContainer>
            )}
            
            {responseTime !== null && (
              <Text type="secondary">响应时间: {responseTime.toFixed(2)} ms</Text>
            )}
            
            {error && (
              <Alert message="错误" description={error} type="error" showIcon />
            )}
            
            {result && (
              <div style={{ marginTop: 16 }}>
                <Table
                  columns={columns}
                  dataSource={[result]}
                  rowKey="id"
                  pagination={false}
                  bordered
                />
              </div>
            )}

            {multipleResults && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  message="SQL注入成功"
                  description={`查询返回了 ${multipleResults.length} 条记录，而不是预期的单条记录。这表明SQL注入攻击已成功。`}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table
                  columns={columns}
                  dataSource={multipleResults}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  bordered
                />
              </div>
            )}
          </Space>
        </TabPane>
        
        <TabPane 
          tab={<span><SafetyOutlined /> 安全查询 (防护示例)</span>} 
          key="2"
        >
          <Alert
            message="安全提示"
            description="此查询使用参数化查询，可以防止SQL注入攻击。"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <CodeBlock>
            <code>
              // 安全的SQL查询 - 使用参数化查询<br/>
              const query = "SELECT * FROM users WHERE username = ?";<br/>
              db.query(query, [username]);
            </code>
          </CodeBlock>
          
          <Divider />
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="输入用户名（SQL注入将被阻止）"
              value={secureUsername}
              onChange={(e) => setSecureUsername(e.target.value)}
              onPressEnter={handleSecureSearch}
            />
            
            <Button 
              type="primary" 
              onClick={handleSecureSearch} 
              loading={secureLoading}
              disabled={!secureUsername}
            >
              搜索用户 (安全查询)
            </Button>
            
            {secureResponseTime !== null && (
              <Text type="secondary">响应时间: {secureResponseTime.toFixed(2)} ms</Text>
            )}
            
            {secureError && (
              <Alert message="错误" description={secureError} type="error" showIcon />
            )}
            
            {secureResult && (
              <div style={{ marginTop: 16 }}>
                <Table
                  columns={columns.filter(col => col.key !== 'password')}
                  dataSource={[secureResult]}
                  rowKey="id"
                  pagination={false}
                  bordered
                />
              </div>
            )}
          </Space>
        </TabPane>
      </Tabs>

      <Modal
        title={<span><WarningOutlined style={{ color: 'red' }} /> 数据库攻击进行中</span>}
        open={showModal}
        footer={null}
        closable={false}
        maskClosable={false}
      >
        <div style={{ padding: '20px 0' }}>
          <Progress percent={attackProgress} status={attackProgress === 100 ? "exception" : "active"} />
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Spin spinning={attackProgress < 100} />
            <div style={{ marginTop: 8 }}>{attackStage}</div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SqlInjection; 