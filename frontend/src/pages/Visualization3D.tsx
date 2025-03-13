import { useEffect, useRef, useState } from 'react';
import { Typography, Card, Select, Divider, Button, Spin, Alert, Space, Row, Col, Slider, Radio } from 'antd';
import { EyeOutlined, ReloadOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import apiService from '../api/api';
import type { Vulnerability, ScanResult } from '../types';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const CanvasContainer = styled.div`
  position: relative;
  height: 70vh;
  min-height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: #000;
`;

const ControlPanel = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.85);
  padding: 15px;
  border-radius: 8px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-width: 300px;
  backdrop-filter: blur(5px);
`;

const Legend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LegendColor = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background-color: ${props => props.color};
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 200;
`;

const StatusBar = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  z-index: 100;
`;

// 安全可视化数据接口
interface VisData {
  nodes: {
    id: string;
    type: 'server' | 'database' | 'endpoint' | 'client' | 'attacker';
    vulnerabilities?: Vulnerability[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    position: [number, number, number];
  }[];
  links: {
    source: string;
    target: string;
    type: 'request' | 'response' | 'attack' | 'data';
    secure: boolean;
  }[];
}

// 严重性级别对应的颜色
const severityColors = {
  low: 0x4caf50,
  medium: 0xffc107,
  high: 0xff9800,
  critical: 0xf44336,
  secure: 0x2196f3,
  insecure: 0xff5722,
};

// 节点类型对应的大小
const nodeSize = {
  server: 2.5,
  database: 2,
  endpoint: 1.5,
  client: 1.8,
  attacker: 2.2,
};

// 模拟数据
const mockVisData: VisData = {
  nodes: [
    { id: 'server', type: 'server', riskLevel: 'medium', position: [0, 0, 0] },
    { id: 'db', type: 'database', riskLevel: 'high', position: [-6, -4, 0] },
    { id: 'api-endpoint-1', type: 'endpoint', riskLevel: 'medium', position: [4, 3, 1] },
    { id: 'api-endpoint-2', type: 'endpoint', riskLevel: 'low', position: [5, 0, -2] },
    { id: 'api-endpoint-3', type: 'endpoint', riskLevel: 'high', position: [3, -4, 2] },
    { id: 'client-1', type: 'client', riskLevel: 'low', position: [10, 6, 0] },
    { id: 'client-2', type: 'client', riskLevel: 'low', position: [12, 1, 3] },
    { id: 'client-3', type: 'client', riskLevel: 'low', position: [11, -3, -3] },
    { id: 'attacker', type: 'attacker', riskLevel: 'critical', position: [9, -8, 0] },
  ],
  links: [
    { source: 'client-1', target: 'api-endpoint-1', type: 'request', secure: true },
    { source: 'client-2', target: 'api-endpoint-2', type: 'request', secure: true },
    { source: 'client-3', target: 'api-endpoint-3', type: 'request', secure: true },
    { source: 'api-endpoint-1', target: 'server', type: 'request', secure: true },
    { source: 'api-endpoint-2', target: 'server', type: 'request', secure: true },
    { source: 'api-endpoint-3', target: 'server', type: 'request', secure: true },
    { source: 'server', target: 'db', type: 'data', secure: true },
    { source: 'attacker', target: 'api-endpoint-3', type: 'attack', secure: false },
    { source: 'attacker', target: 'db', type: 'attack', secure: false },
  ],
};

// 假设的漏洞数据
const mockVulnerabilities: Vulnerability[] = [
  { id: 1, name: 'SQL注入', severity: 'high', location: 'api-endpoint-3', status: 'open' },
  { id: 2, name: 'XSS攻击', severity: 'medium', location: 'api-endpoint-1', status: 'open' },
  { id: 3, name: '未授权访问', severity: 'critical', location: 'db', status: 'open' },
  { id: 4, name: '密码存储不安全', severity: 'high', location: 'db', status: 'open' },
  { id: 5, name: '跨站请求伪造', severity: 'medium', location: 'api-endpoint-2', status: 'open' },
];

const Visualization3D = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const labelRendererRef = useRef<CSS2DRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [visualizationMode, setVisualizationMode] = useState<'standard' | 'threat' | 'vulnerabilities'>('standard');
  const [highlightAttacks, setHighlightAttacks] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0);
  const [cameraDistance, setCameraDistance] = useState<number>(25);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [stats, setStats] = useState<{nodes: number, links: number, vulnerabilities: number}>({
    nodes: 0,
    links: 0,
    vulnerabilities: 0
  });
  const [error, setError] = useState<string | null>(null);

  // 初始化Three.js场景
  useEffect(() => {
    if (!canvasRef.current) return;

    const initialize = async () => {
      try {
        setLoading(true);
        // 在实际应用中，这里可以从API获取数据
        // const response = await apiService.getSecurityVisualizationData();
        // const data = response.data;
        const data = mockVisData;

        // 创建场景
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x121212);
        sceneRef.current = scene;

        // 创建相机
        const camera = new THREE.PerspectiveCamera(
          75, 
          canvasRef.current!.clientWidth / canvasRef.current!.clientHeight, 
          0.1, 
          1000
        );
        camera.position.z = cameraDistance;
        cameraRef.current = camera;
        
        // 创建渲染器
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(canvasRef.current!.clientWidth, canvasRef.current!.clientHeight);
        renderer.shadowMap.enabled = true;
        canvasRef.current!.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 创建CSS2D渲染器用于标签
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(canvasRef.current!.clientWidth, canvasRef.current!.clientHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0';
        labelRenderer.domElement.style.pointerEvents = 'none';
        canvasRef.current!.appendChild(labelRenderer.domElement);
        labelRendererRef.current = labelRenderer;

        // 创建控制器
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controlsRef.current = controls;

        // 添加环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // 添加方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // 创建节点
        const nodeObjects: { [key: string]: THREE.Mesh } = {};
        
        // 为节点分配漏洞（实际应用中应从后端获取）
        const nodeWithVulnerabilities = { ...data };
        nodeWithVulnerabilities.nodes = data.nodes.map(node => {
          const nodeVulnerabilities = mockVulnerabilities.filter(v => v.location === node.id);
          
          // 根据漏洞计算风险级别
          if (nodeVulnerabilities.length > 0) {
            const hasCritical = nodeVulnerabilities.some(v => v.severity === 'critical');
            const hasHigh = nodeVulnerabilities.some(v => v.severity === 'high');
            
            if (hasCritical) {
              return { ...node, vulnerabilities: nodeVulnerabilities, riskLevel: 'critical' as const };
            } else if (hasHigh) {
              return { ...node, vulnerabilities: nodeVulnerabilities, riskLevel: 'high' as const };
            } else {
              return { ...node, vulnerabilities: nodeVulnerabilities, riskLevel: 'medium' as const };
            }
          }
          return { ...node, vulnerabilities: [] };
        });

        // 创建节点
        nodeWithVulnerabilities.nodes.forEach(node => {
          let geometry;
          
          // 根据节点类型选择几何体
          switch (node.type) {
            case 'server':
              geometry = new THREE.BoxGeometry(nodeSize.server, nodeSize.server, nodeSize.server);
              break;
            case 'database':
              geometry = new THREE.CylinderGeometry(nodeSize.database / 2, nodeSize.database / 2, nodeSize.database, 32);
              break;
            case 'endpoint':
              geometry = new THREE.SphereGeometry(nodeSize.endpoint, 32, 32);
              break;
            case 'client':
              geometry = new THREE.TetrahedronGeometry(nodeSize.client);
              break;
            case 'attacker':
              geometry = new THREE.OctahedronGeometry(nodeSize.attacker);
              break;
            default:
              geometry = new THREE.SphereGeometry(1, 32, 32);
          }
          
          const material = new THREE.MeshPhongMaterial({ 
            color: severityColors[node.riskLevel], 
            transparent: true,
            opacity: 0.85,
          });
          
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(...node.position);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          scene.add(mesh);
          nodeObjects[node.id] = mesh;

          // 添加标签
          const labelDiv = document.createElement('div');
          labelDiv.className = 'node-label';
          labelDiv.textContent = node.id;
          labelDiv.style.color = 'white';
          labelDiv.style.padding = '2px 6px';
          labelDiv.style.borderRadius = '4px';
          labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          labelDiv.style.fontSize = '10px';
          
          const label = new CSS2DObject(labelDiv);
          label.position.set(0, nodeSize[node.type] + 0.5, 0);
          mesh.add(label);
        });

        // 创建链接
        data.links.forEach(link => {
          const sourceNode = nodeObjects[link.source];
          const targetNode = nodeObjects[link.target];
          
          if (sourceNode && targetNode) {
            const sourcePosition = sourceNode.position;
            const targetPosition = targetNode.position;
            
            // 计算方向向量
            const direction = new THREE.Vector3().subVectors(targetPosition, sourcePosition);
            const length = direction.length();
            
            // 创建线条几何体
            const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
            geometry.translate(0, length / 2, 0);
            
            // 旋转线条指向目标
            const axis = new THREE.Vector3(0, 1, 0);
            geometry.rotateX(Math.PI / 2);
            
            const q = new THREE.Quaternion().setFromUnitVectors(
              axis, 
              direction.clone().normalize()
            );
            
            // 创建线条材质
            const material = new THREE.MeshPhongMaterial({ 
              color: link.secure ? severityColors.secure : severityColors.insecure,
              transparent: true,
              opacity: link.type === 'attack' && highlightAttacks ? 0.9 : 0.4
            });
            
            // 创建线条网格
            const lineMesh = new THREE.Mesh(geometry, material);
            lineMesh.position.copy(sourcePosition);
            lineMesh.setRotationFromQuaternion(q);
            
            // 如果是攻击线条，添加动画效果
            if (link.type === 'attack') {
              // 在实际应用中可以添加粒子系统或动画效果
              lineMesh.userData.isAttack = true;
            }
            
            scene.add(lineMesh);
          }
        });

        // 更新状态
        setStats({
          nodes: data.nodes.length,
          links: data.links.length,
          vulnerabilities: mockVulnerabilities.length
        });
        
        // 动画循环
        const animate = () => {
          if (controlsRef.current) {
            controlsRef.current.update();
          }
          
          // 场景旋转
          if (rotationSpeed > 0 && sceneRef.current) {
            sceneRef.current.rotation.y += rotationSpeed * 0.005;
          }
          
          // 渲染场景
          if (rendererRef.current && cameraRef.current && sceneRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
          
          // 渲染标签
          if (labelRendererRef.current && cameraRef.current && sceneRef.current) {
            labelRendererRef.current.render(sceneRef.current, cameraRef.current);
          }
          
          animationFrameId.current = requestAnimationFrame(animate);
        };
        
        animate();
        setLoading(false);
      } catch (err) {
        console.error('初始化3D可视化出错:', err);
        setError('初始化3D可视化时出错，请刷新页面重试。');
        setLoading(false);
      }
    };

    initialize();

    // 窗口大小变化时调整渲染器大小
    const handleResize = () => {
      if (
        canvasRef.current && 
        rendererRef.current && 
        labelRendererRef.current && 
        cameraRef.current
      ) {
        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;
        
        rendererRef.current.setSize(width, height);
        labelRendererRef.current.setSize(width, height);
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      if (rendererRef.current && canvasRef.current) {
        canvasRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (labelRendererRef.current && canvasRef.current) {
        canvasRef.current.removeChild(labelRendererRef.current.domElement);
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [cameraDistance, highlightAttacks, rotationSpeed]);

  // 切换可视化模式
  const handleModeChange = (mode: 'standard' | 'threat' | 'vulnerabilities') => {
    setVisualizationMode(mode);
    // 在实际应用中，这里可以更新场景显示
  };

  // 重置视图
  const handleResetView = () => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.reset();
      cameraRef.current.position.z = cameraDistance;
    }
  };

  // 切换全屏
  const toggleFullscreen = () => {
    if (!canvasRef.current) return;

    if (!isFullscreen) {
      if (canvasRef.current.requestFullscreen) {
        canvasRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };

  // 更新相机距离
  const handleDistanceChange = (value: number) => {
    setCameraDistance(value);
    if (cameraRef.current) {
      cameraRef.current.position.z = value;
    }
  };

  return (
    <div className="visualization-page">
      <Title level={2}>
        <EyeOutlined /> 3D安全态势可视化
      </Title>

      <Paragraph>
        这个3D安全态势感知可视化展示了系统架构中的各个组件、它们之间的连接以及潜在的安全威胁和漏洞。
        通过这种直观的方式，安全分析人员可以更容易地理解系统的安全状态，识别潜在的攻击路径和薄弱环节。
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card>
            <CanvasContainer ref={canvasRef}>
              {loading && (
                <LoadingOverlay>
                  <Spin size="large" tip="加载3D可视化中..." />
                </LoadingOverlay>
              )}
              {error && (
                <LoadingOverlay>
                  <Alert
                    message="错误"
                    description={error}
                    type="error"
                    showIcon
                    action={
                      <Button size="small" danger onClick={() => window.location.reload()}>
                        重新加载
                      </Button>
                    }
                  />
                </LoadingOverlay>
              )}
              <ControlPanel>
                <div>
                  <Text strong>可视化模式</Text>
                  <Select 
                    value={visualizationMode} 
                    onChange={handleModeChange}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <Option value="standard">标准视图</Option>
                    <Option value="threat">威胁视图</Option>
                    <Option value="vulnerabilities">漏洞视图</Option>
                  </Select>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <Text strong>旋转速度</Text>
                  <Slider 
                    min={0} 
                    max={10} 
                    value={rotationSpeed}
                    onChange={setRotationSpeed}
                  />
                </div>
                <div style={{ marginTop: 12 }}>
                  <Text strong>相机距离</Text>
                  <Slider 
                    min={10} 
                    max={50} 
                    value={cameraDistance}
                    onChange={handleDistanceChange}
                  />
                </div>
                <div style={{ marginTop: 12 }}>
                  <Text strong>高亮攻击路径</Text>
                  <div>
                    <Radio.Group 
                      value={highlightAttacks ? 'yes' : 'no'} 
                      onChange={(e) => setHighlightAttacks(e.target.value === 'yes')}
                    >
                      <Radio.Button value="yes">是</Radio.Button>
                      <Radio.Button value="no">否</Radio.Button>
                    </Radio.Group>
                  </div>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={handleResetView}>
                    重置视图
                  </Button>
                  <Button 
                    icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? '退出全屏' : '全屏'}
                  </Button>
                </Space>
                <Legend>
                  <Text strong>图例</Text>
                  <LegendItem>
                    <LegendColor color="#4caf50" />
                    <Text>低风险</Text>
                  </LegendItem>
                  <LegendItem>
                    <LegendColor color="#ffc107" />
                    <Text>中风险</Text>
                  </LegendItem>
                  <LegendItem>
                    <LegendColor color="#ff9800" />
                    <Text>高风险</Text>
                  </LegendItem>
                  <LegendItem>
                    <LegendColor color="#f44336" />
                    <Text>严重风险</Text>
                  </LegendItem>
                  <Divider style={{ margin: '8px 0' }} />
                  <LegendItem>
                    <LegendColor color="#2196f3" />
                    <Text>安全连接</Text>
                  </LegendItem>
                  <LegendItem>
                    <LegendColor color="#ff5722" />
                    <Text>不安全连接</Text>
                  </LegendItem>
                </Legend>
              </ControlPanel>
              <StatusBar>
                显示 {stats.nodes} 个节点 | {stats.links} 个连接 | {stats.vulnerabilities} 个漏洞
              </StatusBar>
            </CanvasContainer>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="系统组件说明" style={{ marginBottom: 16 }}>
            <div>
              <Text strong>服务器 (方块)</Text>
              <Paragraph>处理应用程序逻辑的核心服务器，通常运行Web服务或应用服务。</Paragraph>
              
              <Text strong>数据库 (圆柱)</Text>
              <Paragraph>存储应用数据的数据库服务器，可能存在SQL注入等漏洞风险。</Paragraph>
              
              <Text strong>API端点 (球体)</Text>
              <Paragraph>应用程序的API接口，是客户端与服务器交互的入口点。</Paragraph>
              
              <Text strong>客户端 (四面体)</Text>
              <Paragraph>用户的浏览器或客户端应用，通过API端点与服务器交互。</Paragraph>
              
              <Text strong>攻击者 (八面体)</Text>
              <Paragraph>潜在的恶意用户，尝试利用系统中的漏洞进行攻击。</Paragraph>
            </div>
          </Card>
          
          <Card title="安全态势分析">
            <Paragraph>
              当前可视化展示了一个典型的Web应用系统架构，包含服务器、数据库、API端点和客户端。
              从可视化中可以观察到:
            </Paragraph>
            
            <ul>
              <li>存在一个攻击者正尝试攻击API端点和数据库</li>
              <li>数据库和API端点3存在高风险漏洞，需要优先修复</li>
              <li>大部分系统通信是安全的，但攻击路径上的连接不安全</li>
            </ul>
            
            <Text strong>建议的安全改进:</Text>
            <ul>
              <li>修复数据库中的未授权访问和密码存储不安全漏洞</li>
              <li>加固API端点3以防止SQL注入攻击</li>
              <li>实施入侵检测系统以监控和阻止可疑活动</li>
              <li>定期进行安全扫描和渗透测试</li>
            </ul>
            
            <Alert
              message="演示说明"
              description="这是一个模拟的3D安全态势可视化。在实际应用中，数据应从后端API获取，反映系统的实时安全状态。"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Visualization3D; 