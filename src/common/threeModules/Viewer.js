// ThreeViewer.jsx
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import SkyBoxs from './SkyBoxs';
import Lights from './Lights';
import ThreeMouseEvent from './ThreeMouseEvent';

// 内部 Viewer 类 - 保持与原始代码相似的结构
class Viewer {
  constructor(domElement) {
    THREE.Cache.enabled = true; // 开启缓存
    this.viewerDom = domElement;
    this.renderer = undefined;
    this.scene = undefined;
    this.camera = undefined;
    this.controls = undefined;
    this.animateEventList = [];
    this.animationFrameId = null;
    this.initViewer();
  }

  initViewer() {
    this.initRenderer();
    this.initCamera();
    this.initScene();
    this.initControl();
    this.initSkybox();
    this.initLight();

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.updateDom();
      this.renderDom();
      // 全局的公共动画函数，添加函数可同步执行
      this.animateEventList.forEach(event => {
        event.fun && event.content && event.fun(event.content);
      });
    };

    animate();
  }

  addAxis() {
    // 显示坐标轴(x轴: 红色; y轴: 绿色; z轴: 蓝色)
    this.scene.add(new THREE.AxesHelper(100));
  }

  addStats() {
    if (!this.statsControls) {
      this.statsControls = new Stats();
    }
    this.statsControls.dom.style.position = 'absolute';
    this.viewerDom.appendChild(this.statsControls.dom);
    // 添加到动画
    this.statsUpdateObj = {
      fun: this.statsUpdate,
      content: this.statsControls
    };
    this.addAnimate(this.statsUpdateObj);
  }

  removeStats() {
    if (this.statsControls && this.statsUpdateObj) {
      this.viewerDom.removeChild(this.statsControls.dom);
      this.removeAnimate(this.statsUpdateObj);
    }
  }

  statsUpdate(statsControls) {
    statsControls.update();
  }

  updateDom() {
    this.controls.update();
    this.camera.aspect = this.viewerDom.clientWidth / this.viewerDom.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.viewerDom.clientWidth, this.viewerDom.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.labelRenderer.setSize(this.viewerDom.clientWidth, this.viewerDom.clientHeight);
    this.css3DRenderer.setSize(this.viewerDom.clientWidth, this.viewerDom.clientHeight);
  }

  renderDom() {
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
    this.css3DRenderer.render(this.css3dScene, this.camera);
  }

  initRenderer() {
    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      precision: "highp",
      premultipliedAlpha: true,
    });
    this.renderer.clearDepth();
    this.renderer.shadowMap.enabled = true;
    this.viewerDom.appendChild(this.renderer.domElement);

    // 二维标签
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.style.zIndex = 2;
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0px';
    this.labelRenderer.domElement.style.left = '0px';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.viewerDom.appendChild(this.labelRenderer.domElement);

    // 三维标签
    this.css3DRenderer = new CSS3DRenderer();
    this.css3DRenderer.domElement.style.zIndex = 0;
    this.css3DRenderer.domElement.style.position = 'absolute';
    this.css3DRenderer.domElement.style.top = '0px';
    this.css3DRenderer.domElement.style.left = '0px';
    this.css3DRenderer.domElement.style.pointerEvents = 'none';
    this.viewerDom.appendChild(this.css3DRenderer.domElement);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.viewerDom.clientWidth / this.viewerDom.clientHeight,
      0.1,
      500000
    );
    this.camera.position.set(0, 5, 50);
    this.camera.lookAt(0, 0, 22.5);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.css3dScene = new THREE.Scene();
    this.scene.background = new THREE.Color('rgb(5,24,38)');
  }

  initControl() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.screenSpacePanning = false;
  }

  initSkybox() {
    if (!this.skyboxs) {
      this.skyboxs = new SkyBoxs(this);
    }
    this.skyboxs.setSkybox();
  }

  initLight() {
    if (!this.lights) {
      this.lights = new Lights(this);
    }
  }

  addAnimate(animate) {
    this.animateEventList.push(animate);
  }

  removeAnimate(animate) {
    this.animateEventList.forEach((val, i) => {
      if (val === animate) this.animateEventList.splice(i, 1);
    });
  }

  startSelectEvent(mouseType, isSelect, callback) {
    if (!this.mouseEvent) {
      this.mouseEvent = new ThreeMouseEvent(this, isSelect, callback, mouseType);
    }
    this.mouseEvent.startSelect();
  }

  stopSelectEvent() {
    this.mouseEvent?.stopSelect();
  }

  // 清理资源
  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.removeStats();
    this.stopSelectEvent();

    if (this.renderer) {
      this.renderer.dispose();
      this.viewerDom.removeChild(this.renderer.domElement);
    }

    if (this.labelRenderer) {
      this.viewerDom.removeChild(this.labelRenderer.domElement);
    }

    if (this.css3DRenderer) {
      this.viewerDom.removeChild(this.css3DRenderer.domElement);
    }

    if (this.controls) {
      this.controls.dispose();
    }

    this.animateEventList = [];
  }
}

// React 组件
const ThreeViewer = forwardRef((props, ref) => {
  const { containerId, className, style = {} } = props;
  const containerRef = useRef(null);
  const viewerInstanceRef = useRef(null);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    addAxis: () => viewerInstanceRef.current?.addAxis(),
    addStats: () => viewerInstanceRef.current?.addStats(),
    removeStats: () => viewerInstanceRef.current?.removeStats(),
    addAnimate: (animate) => viewerInstanceRef.current?.addAnimate(animate),
    removeAnimate: (animate) => viewerInstanceRef.current?.removeAnimate(animate),
    startSelectEvent: (mouseType, isSelect, callback) => 
      viewerInstanceRef.current?.startSelectEvent(mouseType, isSelect, callback),
    stopSelectEvent: () => viewerInstanceRef.current?.stopSelectEvent(),
    
    // 访问内部属性
    getScene: () => viewerInstanceRef.current?.scene,
    getCamera: () => viewerInstanceRef.current?.camera,
    getRenderer: () => viewerInstanceRef.current?.renderer,
    getControls: () => viewerInstanceRef.current?.controls,
    
    // 获取整个实例
    getViewerInstance: () => viewerInstanceRef.current
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    
    // 创建 Viewer 实例
    viewerInstanceRef.current = new Viewer(containerRef.current);
    
    // 组件卸载时清理资源
    return () => {
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current.dispose();
        viewerInstanceRef.current = null;
      }
    };
  }, []); // 仅在挂载时运行一次

  return (
    <div
      id={containerId}
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        ...style
      }}
    />
  );
});

ThreeViewer.displayName = 'ThreeViewer';

export default Viewer;