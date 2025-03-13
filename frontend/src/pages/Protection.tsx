import { useState } from 'react';
import { Typography, Card, Collapse, Steps, List, Tag, Row, Col, Alert, Button, Space, Divider } from 'antd';
import { 
  SafetyOutlined, 
  BugOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  DatabaseOutlined,
  CodeOutlined,
  LinkOutlined,
  FileProtectOutlined,
  UserOutlined,
  LockOutlined,
  AuditOutlined,
  KeyOutlined
} from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;
const { Step } = Steps;

// 样式组件
const ProtectionCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
`;

const CodeBlock = styled.pre`
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  font-family: monospace;
  position: relative;
`;

// 防护措施数据
const protectionCategories = [
  {
    title: 'SQL注入防护',
    icon: <DatabaseOutlined />,
    color: '#1890ff',
    measures: [
      { 
        name: '参数化查询', 
        description: '使用预处理语句和参数化查询，避免直接拼接SQL语句',
        codeExample: `// 不安全的方式\nconst query = "SELECT * FROM users WHERE username = '" + username + "'";\n\n// 安全的方式\nconst query = "SELECT * FROM users WHERE username = ?";\ndb.query(query, [username]);`,
      },
      { 
        name: '使用ORM框架', 
        description: '使用ORM框架如Sequelize、SQLAlchemy等，它们内置了防SQL注入机制',
        codeExample: `// 使用Sequelize ORM\nconst user = await User.findOne({\n  where: { username: username }\n});`,
      },
      { 
        name: '输入验证', 
        description: '验证用户输入，拒绝包含SQL特殊字符的输入或对其进行转义处理',
        codeExample: `function validateInput(input) {\n  // 移除或转义SQL特殊字符\n  return input.replace(/[\\';\\\"\\-\\-\\/*]/g, '');\n}`,
      },
      { 
        name: '最小权限原则', 
        description: '数据库用户只应被授予应用所需的最小权限，避免使用DBA/管理员账户',
        codeExample: `-- 创建受限数据库用户\nCREATE USER 'app_user'@'localhost' IDENTIFIED BY 'password';\nGRANT SELECT, INSERT, UPDATE ON app_db.* TO 'app_user'@'localhost';\n-- 不授予DELETE、CREATE、DROP等高危权限`,
      },
    ]
  },
  {
    title: 'XSS攻击防护',
    icon: <CodeOutlined />,
    color: '#52c41a',
    measures: [
      { 
        name: '输出编码', 
        description: '在将用户输入呈现在页面上之前，对HTML特殊字符进行编码',
        codeExample: `// 在JavaScript中编码HTML\nfunction encodeHTML(str) {\n  return str.replace(/&/g, '&amp;')\n    .replace(/</g, '&lt;')\n    .replace(/>/g, '&gt;')\n    .replace(/"/g, '&quot;')\n    .replace(/'/g, '&#39;');\n}`,
      },
      { 
        name: '内容安全策略(CSP)', 
        description: '通过设置Content-Security-Policy头部，限制可以执行的脚本源',
        codeExample: `// 在HTTP响应头中设置CSP\nres.setHeader(\n  'Content-Security-Policy',\n  "default-src 'self'; script-src 'self' https://trusted-cdn.com"\n);`,
      },
      { 
        name: '使用HTML净化库', 
        description: '使用如DOMPurify等专业库来清理HTML内容，移除危险标签和属性',
        codeExample: `// 使用DOMPurify净化HTML\nimport DOMPurify from 'dompurify';\n\nconst clean = DOMPurify.sanitize(userInput);`,
      },
      { 
        name: '使用现代框架', 
        description: 'React、Vue等现代前端框架默认会转义变量，减少XSS风险',
        codeExample: `// React自动转义变量\nfunction Component({ userInput }) {\n  return <div>{userInput}</div>; // 自动安全\n\n  // 危险方式：\n  // return <div dangerouslySetInnerHTML={{__html: userInput}} />;\n}`,
      },
    ]
  },
  {
    title: '文件上传防护',
    icon: <FileProtectOutlined />,
    color: '#fa8c16',
    measures: [
      { 
        name: '验证文件类型', 
        description: '检查文件扩展名、MIME类型和文件内容，只允许安全类型',
        codeExample: `// 验证文件类型\nconst allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];\n\nif (!allowedTypes.includes(file.mimetype)) {\n  return res.status(400).send('不支持的文件类型');\n}`,
      },
      { 
        name: '限制文件大小', 
        description: '设置文件大小限制，防止DoS攻击',
        codeExample: `// 限制文件大小为5MB\nconst MAX_SIZE = 5 * 1024 * 1024; // 5MB\n\nif (file.size > MAX_SIZE) {\n  return res.status(400).send('文件大小超过限制');\n}`,
      },
      { 
        name: '重命名文件', 
        description: '使用随机文件名，防止路径遍历攻击',
        codeExample: `// 生成随机文件名\nconst crypto = require('crypto');\nconst path = require('path');\n\nconst ext = path.extname(file.originalname);\nconst randomName = crypto.randomBytes(16).toString('hex') + ext;`,
      },
      { 
        name: '存储在安全位置', 
        description: '存储上传文件在Web根目录之外，或使用独立的存储服务',
        codeExample: `// 存储在Web根目录外\nconst UPLOAD_DIR = path.join(__dirname, '../uploads');\n\n// 更好的做法：使用云存储\n// const result = await s3.upload({\n//   Bucket: 'my-bucket',\n//   Key: fileName,\n//   Body: fileContent\n// }).promise();`,
      },
    ]
  },
  {
    title: '访问控制防护',
    icon: <LockOutlined />,
    color: '#722ed1',
    measures: [
      { 
        name: '实施身份验证', 
        description: '确保所有敏感操作都需要用户身份验证',
        codeExample: `// 身份验证中间件\nfunction requireAuth(req, res, next) {\n  if (!req.session.userId) {\n    return res.status(401).redirect('/login');\n  }\n  next();\n}`,
      },
      { 
        name: '授权检查', 
        description: '在访问敏感资源前验证用户是否有权限',
        codeExample: `// 授权检查\nfunction checkPermission(req, res, next) {\n  const resourceId = req.params.id;\n  const userId = req.session.userId;\n  \n  // 检查用户是否有权访问此资源\n  if (resource.ownerId !== userId && !req.session.isAdmin) {\n    return res.status(403).send('没有权限');\n  }\n  next();\n}`,
      },
      { 
        name: '使用间接引用', 
        description: '避免直接使用数据库ID，使用不可预测的引用',
        codeExample: `// 使用UUID作为间接引用\nconst uuid = require('uuid');\n\n// 创建用户时生成UUID\nconst user = {\n  internalId: 1234,  // 数据库ID，不暴露给前端\n  publicId: uuid.v4(), // 用于API请求的公开ID\n  name: 'John Doe'\n};`,
      },
      { 
        name: '实施RBAC', 
        description: '基于角色的访问控制，根据用户角色分配权限',
        codeExample: `// 基于角色的访问控制\nconst roles = {\n  user: ['read:own_data'],\n  editor: ['read:own_data', 'create:content', 'edit:own_content'],\n  admin: ['read:all_data', 'create:content', 'edit:any_content', 'delete:content']\n};\n\nfunction hasPermission(user, permission) {\n  return roles[user.role].includes(permission);\n}`,
      },
    ]
  },
  {
    title: '安全编码实践',
    icon: <AuditOutlined />,
    color: '#eb2f96',
    measures: [
      { 
        name: '输入验证', 
        description: '验证所有来自客户端的输入，确保符合预期格式和范围',
        codeExample: `// 输入验证示例\nconst { body } = req;\n\nif (!body.email || !body.email.match(/^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/)) {\n  return res.status(400).send('无效的邮箱格式');\n}\n\nif (!body.age || body.age < 18 || body.age > 120) {\n  return res.status(400).send('年龄必须在18到120之间');\n}`,
      },
      { 
        name: '安全配置', 
        description: '移除默认账户、示例程序和不必要的功能，保持软件更新',
        codeExample: `// 安全配置示例 - 在Express中使用Helmet\nconst express = require('express');\nconst helmet = require('helmet');\n\nconst app = express();\n\n// 设置各种HTTP头以增强安全性\napp.use(helmet());`,
      },
      { 
        name: '敏感数据保护', 
        description: '加密存储敏感数据，尤其是密码和个人信息',
        codeExample: `// 密码哈希示例\nconst bcrypt = require('bcrypt');\n\n// 存储密码\nasync function storePassword(password) {\n  const salt = await bcrypt.genSalt(10);\n  return await bcrypt.hash(password, salt);\n}\n\n// 验证密码\nasync function verifyPassword(password, hash) {\n  return await bcrypt.compare(password, hash);\n}`,
      },
      { 
        name: '日志和监控', 
        description: '记录安全相关事件，实施监控以检测攻击',
        codeExample: `// 安全日志示例\nfunction logSecurityEvent(req, event, success) {\n  const log = {\n    timestamp: new Date().toISOString(),\n    ip: req.ip,\n    userId: req.session.userId || 'anonymous',\n    event: event,\n    success: success,\n    userAgent: req.headers['user-agent']\n  };\n  \n  console.log(JSON.stringify(log));\n  // 在实际应用中，应将日志写入文件或发送到日志服务\n}`,
      },
    ]
  },
];

const Protection = () => {
  const [activeKey, setActiveKey] = useState<string[]>(['0']);
  const [showMore, setShowMore] = useState<boolean>(false);
  
  const handleCollapseChange = (key: string | string[]) => {
    setActiveKey(Array.isArray(key) ? key : [key]);
  };

  // 安全实施步骤
  const implementationSteps = [
    {
      title: '安全需求分析',
      description: '识别应用的安全需求和风险',
      items: [
        '确定需要保护的敏感数据',
        '识别潜在的威胁和攻击向量',
        '定义安全控制措施和要求',
        '制定安全标准和指南'
      ]
    },
    {
      title: '安全设计',
      description: '将安全考虑纳入应用设计',
      items: [
        '应用身份验证和授权机制',
        '数据保护策略',
        '安全通信协议',
        '错误处理和日志记录'
      ]
    },
    {
      title: '安全编码',
      description: '按照安全原则编写代码',
      items: [
        '遵循安全编码最佳实践',
        '使用安全的API和函数',
        '实施输入验证和输出编码',
        '安全地处理敏感数据'
      ]
    },
    {
      title: '安全测试',
      description: '验证应用的安全性',
      items: [
        '执行安全代码审查',
        '自动化安全测试',
        '渗透测试',
        '漏洞扫描'
      ]
    },
    {
      title: '部署和维护',
      description: '安全地部署和维护应用',
      items: [
        '安全配置服务器和应用',
        '定期更新和补丁管理',
        '监控安全事件',
        '制定安全事件响应计划'
      ]
    }
  ];

  // OWASP Top 10 漏洞列表
  const owaspTop10 = [
    { 
      id: 'A01:2021', 
      name: '失效的访问控制', 
      examples: ['越权访问', '未经授权的功能访问', 'CORS配置错误'],
      mitigations: ['实施适当的访问控制', '默认拒绝所有访问', '记录访问控制失败']
    },
    { 
      id: 'A02:2021', 
      name: '加密机制失效', 
      examples: ['明文存储密码', '弱加密算法', '硬编码密钥'],
      mitigations: ['使用强密码哈希函数', '加密所有敏感数据', '妥善管理密钥']
    },
    { 
      id: 'A03:2021', 
      name: '注入', 
      examples: ['SQL注入', 'NoSQL注入', 'OS命令注入'],
      mitigations: ['使用参数化查询', '上下文转义', '输入验证']
    },
    { 
      id: 'A04:2021', 
      name: '不安全设计', 
      examples: ['缺乏安全控制', '不安全的业务逻辑', '缺少防御深度'],
      mitigations: ['安全开发生命周期', '威胁建模', '安全设计模式']
    },
    { 
      id: 'A05:2021', 
      name: '安全配置错误', 
      examples: ['默认配置使用', '未使用HTTPS', '错误信息暴露'],
      mitigations: ['安全的默认配置', '最小化安装', '移除未使用的功能']
    },
  ];

  const showMoreOwaspTop10 = [
    { 
      id: 'A06:2021', 
      name: '易受攻击和过时的组件', 
      examples: ['使用过时的库', '未打补丁的系统', '未更新的依赖项'],
      mitigations: ['依赖管理', '定期更新', '移除未使用的依赖']
    },
    { 
      id: 'A07:2021', 
      name: '身份认证与会话管理失效', 
      examples: ['弱密码', '会话固定', '不安全的会话ID'],
      mitigations: ['多因素认证', '安全的会话管理', '强密码策略']
    },
    { 
      id: 'A08:2021', 
      name: '软件和数据完整性失效', 
      examples: ['未签名的代码', '不安全的CI/CD管道', '未验证的更新'],
      mitigations: ['使用数字签名', '验证完整性', '保护CI/CD管道']
    },
    { 
      id: 'A09:2021', 
      name: '安全日志和监控不足', 
      examples: ['缺少关键事件日志', '不监控可疑活动', '不保存日志'],
      mitigations: ['记录所有安全相关事件', '集中式日志管理', '实施告警系统']
    },
    { 
      id: 'A10:2021', 
      name: 'SSRF（服务端请求伪造）', 
      examples: ['未经验证的URL获取', '内部资源暴露', '绕过防火墙'],
      mitigations: ['验证和强制URL资源访问规则', '禁止请求内部资源', '网络分段']
    }
  ];

  return (
    <div className="protection-page">
      <Title level={2}>
        <SafetyOutlined /> Web应用漏洞防护措施
      </Title>

      <Paragraph>
        本页面介绍了各种常见Web应用漏洞的防护措施和最佳实践，帮助开发者构建更安全的应用程序。
        这些防护措施涵盖了OWASP Top 10等常见漏洞，提供了具体的安全编码示例和实施建议。
      </Paragraph>

      <Alert
        message="安全提示"
        description="安全是一个持续的过程，需要在整个软件开发生命周期中考虑。单一的防护措施不足以抵御所有攻击，应采用防御深度策略，结合多层安全控制。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Divider orientation="left">实施安全的步骤</Divider>
      
      <Steps 
        direction="vertical" 
        current={-1}
        style={{ marginBottom: 40 }}
      >
        {implementationSteps.map((step, index) => (
          <Step
            key={index}
            title={step.title}
            description={
              <div>
                <Paragraph>{step.description}</Paragraph>
                <ul>
                  {step.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            }
            icon={<SafetyOutlined />}
          />
        ))}
      </Steps>

      <Divider orientation="left">OWASP Top 10漏洞</Divider>
      
      <Alert 
        message="关于OWASP Top 10" 
        description="OWASP Top 10是由开放Web应用安全项目(OWASP)发布的最严重的Web应用程序安全风险列表。它代表了安全专家对最重要Web应用安全漏洞的共识。" 
        type="info" 
        showIcon 
        style={{ marginBottom: 16 }}
      />

      <List
        grid={{ gutter: 16, column: 2, xs: 1, sm: 1, md: 2 }}
        dataSource={owaspTop10.concat(showMore ? showMoreOwaspTop10 : [])}
        renderItem={(item) => (
          <List.Item>
            <Card 
              title={<Space><BugOutlined /> {item.id} - {item.name}</Space>}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <div>
                <Text strong>漏洞示例:</Text>
                <ul>
                  {item.examples.map((example, index) => (
                    <li key={index}>{example}</li>
                  ))}
                </ul>
                <Text strong>防护措施:</Text>
                <ul>
                  {item.mitigations.map((mitigation, index) => (
                    <li key={index}>{mitigation}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </List.Item>
        )}
      />

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Button type="primary" onClick={() => setShowMore(!showMore)}>
          {showMore ? '收起' : '查看全部 OWASP Top 10'}
        </Button>
      </div>

      <Divider orientation="left">详细防护措施</Divider>

      <Collapse 
        activeKey={activeKey}
        onChange={(key) => handleCollapseChange(key as string[])}
        style={{ marginBottom: 40 }}
      >
        {protectionCategories.map((category, index) => (
          <Panel 
            key={index.toString()} 
            header={
              <Space>
                <span style={{ color: category.color }}>{category.icon}</span>
                <span style={{ fontWeight: 'bold' }}>{category.title}</span>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              {category.measures.map((measure, mIndex) => (
                <Col xs={24} md={12} key={mIndex}>
                  <ProtectionCard
                    title={<Space><CheckCircleOutlined style={{ color: category.color }} /> {measure.name}</Space>}
                    size="small"
                  >
                    <Paragraph>{measure.description}</Paragraph>
                    <Text strong>示例代码:</Text>
                    <CodeBlock>
                      <code>{measure.codeExample}</code>
                    </CodeBlock>
                  </ProtectionCard>
                </Col>
              ))}
            </Row>
          </Panel>
        ))}
      </Collapse>

      <Divider orientation="left">安全编码清单</Divider>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> 安全编码最佳实践</Space>}>
            <ul>
              <li>验证所有用户输入</li>
              <li>使用参数化查询防止SQL注入</li>
              <li>对所有输出进行HTML编码防止XSS</li>
              <li>实施适当的身份验证和授权</li>
              <li>加密存储敏感数据</li>
              <li>使用安全的会话管理</li>
              <li>避免直接对象引用</li>
              <li>实施HTTPS和安全cookie</li>
              <li>禁用目录列表</li>
              <li>限制上传文件类型和大小</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<Space><CloseCircleOutlined style={{ color: '#f5222d' }} /> 应避免的不安全编码实践</Space>}>
            <ul>
              <li>硬编码敏感信息（密码、密钥等）</li>
              <li>明文存储或传输敏感数据</li>
              <li>直接拼接SQL查询字符串</li>
              <li>未经过滤的用户输入直接展示</li>
              <li>不安全的随机数生成</li>
              <li>依赖客户端验证作为唯一的安全控制</li>
              <li>使用过时的加密算法（MD5、SHA1等）</li>
              <li>信任HTTP头信息进行安全决策</li>
              <li>暴露详细的错误信息给用户</li>
              <li>忽略依赖项的安全更新</li>
            </ul>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Alert
        message="资源链接"
        description={
          <ul>
            <li><LinkOutlined /> <a href="https://owasp.org/www-project-top-ten/" target="_blank" rel="noopener noreferrer">OWASP Top 10</a></li>
            <li><LinkOutlined /> <a href="https://cheatsheetseries.owasp.org/" target="_blank" rel="noopener noreferrer">OWASP Cheat Sheet Series</a></li>
            <li><LinkOutlined /> <a href="https://portswigger.net/web-security" target="_blank" rel="noopener noreferrer">PortSwigger Web Security Academy</a></li>
            <li><LinkOutlined /> <a href="https://www.sans.org/security-resources/" target="_blank" rel="noopener noreferrer">SANS Security Resources</a></li>
          </ul>
        }
        type="info"
        showIcon
      />
    </div>
  );
};

export default Protection; 