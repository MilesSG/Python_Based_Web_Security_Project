// Three.js扩展模块类型声明
declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, Object3D, Vector3, Quaternion } from 'three';

  export class OrbitControls {
    constructor(camera: Camera, domElement?: HTMLElement);
    
    enabled: boolean;
    target: Vector3;
    
    minDistance: number;
    maxDistance: number;
    
    minZoom: number;
    maxZoom: number;
    
    minPolarAngle: number;
    maxPolarAngle: number;
    
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    
    enableDamping: boolean;
    dampingFactor: number;
    
    enableZoom: boolean;
    zoomSpeed: number;
    
    enableRotate: boolean;
    rotateSpeed: number;
    
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    keyPanSpeed: number;
    
    autoRotate: boolean;
    autoRotateSpeed: number;
    
    enableKeys: boolean;
    keys: { LEFT: number; UP: number; RIGHT: number; BOTTOM: number };
    mouseButtons: { LEFT: number; MIDDLE: number; RIGHT: number };
    
    update(): boolean;
    
    listenToKeyEvents(domElement: HTMLElement): void;
    saveState(): void;
    reset(): void;
    dispose(): void;
    getAzimuthalAngle(): number;
    getPolarAngle(): number;
    getDistance(): number;
  }
}

declare module 'three/examples/jsm/renderers/CSS2DRenderer' {
  import { Camera, Object3D, Scene, Vector3 } from 'three';

  export class CSS2DObject extends Object3D {
    constructor(element: HTMLElement);
    element: HTMLElement;
    onBeforeRender: (renderer: CSS2DRenderer, scene: Scene, camera: Camera) => void;
    onAfterRender: (renderer: CSS2DRenderer, scene: Scene, camera: Camera) => void;
  }

  export class CSS2DRenderer {
    constructor();
    domElement: HTMLElement;
    
    getSize(): { width: number; height: number };
    setSize(width: number, height: number): void;
    render(scene: Scene, camera: Camera): void;
  }
}

// 添加GLTF加载器类型声明
declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Loader, LoadingManager, Group, Material, AnimationClip, Object3D } from 'three';
  
  export interface GLTF {
    animations: AnimationClip[];
    scene: Group;
    scenes: Group[];
    cameras: Camera[];
    asset: {
      copyright?: string;
      generator?: string;
      version?: string;
      minVersion?: string;
      extensions?: any;
      extras?: any;
    };
    parser: GLTFParser;
    userData: any;
  }
  
  export class GLTFLoader extends Loader {
    constructor(manager?: LoadingManager);
    
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    
    setDRACOLoader(dracoLoader: any): GLTFLoader;
    setDDSLoader(ddsLoader: any): GLTFLoader;
    
    parse(
      data: ArrayBuffer | string,
      path: string,
      onLoad: (gltf: GLTF) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
  
  export class GLTFParser {
    getDependency: (type: string, index: number) => Promise<any>;
    getDependencies: (type: string) => Promise<any[]>;
  }
} 