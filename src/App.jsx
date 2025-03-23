import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Viewer from './common/threeModules/Viewer';
import ThreeViewer from './common/threeModules/Viewer';
import SkyBoxs from './common/threeModules/SkyBoxs';
import Lights from './common/threeModules/Lights';
import ModelLoader from './common/threeModules/ModelLoader';
import Labels from './common/threeModules/Labels';
import { createGreenhouse, controlShadingNet,frameGroup } from './components/three/structures/Greenhouse';

const App = () => {
  const containerRef = useRef(null);
  const [isNetRolledUp, setIsNetRolledUp] = useState(false);
  const greenhouseRef = useRef(null);
  
  // 保存实例的引用
  const viewerRef = useRef(null);
  const skyBoxRef = useRef(null);
  const modelLoaderRef = useRef(null);
  const labelInsRef = useRef(null);
  
  // 初始化 Three.js 场景
  useEffect(() => {
    // 确保DOM元素已经渲染
    if (!containerRef.current) return;
    
    // 初始化Three.js
    const initThree = () => {
      containerRef.current.style.width = '50vw';
      containerRef.current.style.height = '50vh';
      
      // 创建Viewer实例 - 传入DOM元素
      viewerRef.current = new Viewer(containerRef.current);
      
      // 设置相机和控制器
      viewerRef.current.camera.position.set(80, 10, 27);
      viewerRef.current.controls.maxPolarAngle = Math.PI / 2.1;
      
      // 渲染器设置
      viewerRef.current.renderer.setPixelRatio(window.devicePixelRatio * 2);
      viewerRef.current.renderer.shadowMap.enabled = true;
      viewerRef.current.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // 创建天空盒
      skyBoxRef.current = new SkyBoxs(viewerRef.current);
      
      // 设置光照
      const lights = new Lights(viewerRef.current);
      const ambientLight = lights.addAmbientLight();
      ambientLight.setOption({
        color: 0xffffff,
        intensity: 7
      });
      ambientLight.light.name = 'AmbientLight';
      
      // 添加平行光
      lights.addDirectionalLight([100, 100, -10], {
        color: 'rgb(253,253,253)',
        intensity: 4,
        castShadow: true
      });
      
      // 添加聚光灯
      const spotLights = new THREE.Group();
      spotLights.name = 'SpotLights';
      spotLights.add(initSpotLight(10, 32, -30));
      spotLights.add(initSpotLight(-2.5, 32, -30));
      spotLights.add(initSpotLight(-15, 32, -30));
      spotLights.add(initSpotLight(22.5, 32, -30));
      viewerRef.current.scene.add(spotLights);
      
      // 创建模型加载器和标签
      modelLoaderRef.current = new ModelLoader(viewerRef.current);
      labelInsRef.current = new Labels(viewerRef.current);
      
      // 添加坐标轴和性能监控
      viewerRef.current.addAxis();
      viewerRef.current.addStats();
      
      // 初始化场景内容
      // initVideoTexture();
       initGround();
       init_Ground();
       loadPeople();
       loadTree();
       createGreenhouse(viewerRef.current.scene);
      // loadVegetation();
      let greenhouse = frameGroup;
      greenhouseRef.current = greenhouse;
      // 开始渲染循环
      animate();
    };
    
    // 渲染循环
    const animate = () => {
      if (!viewerRef.current) return;
      
      // 如果 viewerRef.current 本身就是实例，直接调用方法
      viewerRef.current.updateDom();
      viewerRef.current.renderDom();
      
      requestAnimationFrame(animate);
    };
    
    // 初始化场景
    initThree();
    
    // 清理函数
    return () => {
      if (viewerRef.current) {
        // 清理Three.js资源
        viewerRef.current.dispose();
      }
    };
  }, []);
  

  const rollUpShadingNet = () => {
    if (!greenhouseRef.current) return;

    try {
      controlShadingNet(greenhouseRef.current, true, () => {
        setIsNetRolledUp(true);
      });
    } catch (error) {
      console.error('收起防晒网失败:', error);
    }
  };

  // 展开防晒网的方法
  const expandShadingNet = () => {
    if (!greenhouseRef.current) return;

    try {
      controlShadingNet(greenhouseRef.current, false, () => {
        setIsNetRolledUp(false);
      });
    } catch (error) {
      console.error('展开防晒网失败:', error);
    }
  };
  // 初始化聚光灯
  const initSpotLight = (x, y, z) => {
    const spotLightGroup = new THREE.Group();
    const spotLight = new THREE.SpotLight();
    const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    spotLightGroup.add(spotLight);
    spotLightGroup.add(spotLightHelper);
    spotLightGroup.add(spotLight.target);
    
    spotLight.position.set(x, y, z);
    spotLight.target.position.set(x, y - 2, z - 1);
    spotLight.penumbra = 0.8;
    
    spotLight.visible = false;
    spotLightHelper.visible = false;
    
    return spotLightGroup;
  };
  
  // 其他方法实现...
  const initVideoTexture = () => {
    const video = document.createElement('video');
    video.src = '/video/bi.mp4';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    document.body.appendChild(video);
    // 可以创建视频纹理：new THREE.VideoTexture(video)
  };
  
  // 初始化地面
  const initGround = () => {
    if (!viewerRef.current) return;
    
    const textureLoader = new THREE.TextureLoader();
  
    // 加载所有贴图（建议使用KTX2压缩格式提升性能）
    const textures = {
      diffuse: textureLoader.load('/textures/ground/ground_diffuse.jpg'),
      normal: textureLoader.load('/textures/ground/ground_normals.jpg'),
      displacement: textureLoader.load('/textures/ground/ground_displacement.jpg'),
      occlusion: textureLoader.load('/textures/ground/ground_occlusion.jpg'),
      roughness: textureLoader.load('/textures/ground/ground_specularity.jpg') // 注意转换用途
    };
  
    // 统一设置纹理参数
    Object.values(textures).forEach(texture => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(50, 50);
      texture.anisotropy = 16;
    });
  
    // 创建带细分的地面几何体（支持置换贴图）
    const geometry = new THREE.PlaneGeometry(80, 80, 25, 25);
    
    // 配置PBR材质
    const material = new THREE.MeshStandardMaterial({
      map: textures.diffuse,
      normalMap: textures.normal,
      displacementMap: textures.displacement,
      displacementScale: 1.5,  // 置换强度调节
      aoMap: textures.occlusion,
      roughnessMap: textures.roughness,
      metalness: 0.1,         // 配合高光控制
      roughness: 0.7          // 基础粗糙度
    });
  
    // 必须设置第二组UV坐标供aoMap使用
    geometry.setAttribute('uv2', new THREE.BufferAttribute(geometry.attributes.uv.array, 2));
  
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    ground.position.z = 20;
    ground.receiveShadow = true;
    ground.castShadow = true;  // 启用阴影投射
    ground.name = 'advanced_ground';
  
    // 自动适应场景缩放
    ground.onBeforeRender = () => {
      if (!viewerRef.current) return;
      
      const scaleFactor = viewerRef.current.camera.position.distanceTo(ground.position) / 500;
      textures.diffuse.repeat.set(50 * scaleFactor, 50 * scaleFactor);
      textures.diffuse.needsUpdate = true;
    };
  
    // 添加到场景
    viewerRef.current.scene.add(ground);
    
  };
  

/**
 * 初始化地面
 */
const init_Ground = () => {
  const textureLoader = new THREE.TextureLoader()

  // 加载所有贴图（建议使用KTX2压缩格式提升性能）
  const textures = {
    diffuse: textureLoader.load('/textures/ground/_Ground_COLOR.jpg'),
    normal: textureLoader.load('/textures/ground/_Ground_NRM.jpg'),
    displacement: textureLoader.load('/textures/ground/_Ground_DISP.jpg'),
    occlusion: textureLoader.load('/textures/ground/_Ground_OCC.jpg'),
    roughness: textureLoader.load('/textures/ground/_Ground_SPEC.jpg') // 注意转换用途
  }

  // 统一设置纹理参数
  Object.values(textures).forEach(texture => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(50, 50)
    texture.anisotropy = 16
  })

  // 创建带细分的地面几何体（支持置换贴图）
  const geometry = new THREE.PlaneGeometry(30, 14*3, 25, 25)
  
  // 配置PBR材质
  const material = new THREE.MeshStandardMaterial({
    map: textures.diffuse,
    normalMap: textures.normal,
    displacementMap: textures.displacement,
    displacementScale: 1.5,  // 置换强度调节
    aoMap: textures.occlusion,
    roughnessMap: textures.roughness,
    metalness: 0.1,         // 配合高光控制
    roughness: 0.7          // 基础粗糙度
  })

  // 必须设置第二组UV坐标供aoMap使用
  geometry.setAttribute('uv2', new THREE.BufferAttribute(geometry.attributes.uv.array, 2))

  const _ground = new THREE.Mesh(geometry, material)
  _ground.rotation.x = -Math.PI / 2
  _ground.position.y =-0.8
  _ground.position.z =14*3/2
  _ground.receiveShadow = true
  _ground.castShadow = true  // 启用阴影投射
  _ground.name = 'advanced_ground'

  // 自动适应场景缩放
  _ground.onBeforeRender = () => {
    const scaleFactor = viewerRef.current.camera.position.distanceTo(_ground.position) / 500
    textures.diffuse.repeat.set(50 * scaleFactor, 50 * scaleFactor)
    textures.diffuse.needsUpdate = true
  }

  viewerRef.current.scene.add(_ground);
}


/**
 * 加载树
 */
 const loadTree = () => {
  modelLoaderRef.current.loadModelToScene('glTF/tree_animate/new-scene.gltf', (model) => {
    // 原始树木设置
    model.openCastShadow()
    model.object.position.set(0, 0, -10)
    model.object.scale.set(0.08, 0.08, 0.08)
    model.object.name = '树_01'
    model.startAnimal()

    // 生成随机位置参数
    const treePositions = [
      { x: 0, z: 50, scale: 0.07 },
      { x: 50, z: 25, scale: 0.06 },
      { x: 55, z: 25, scale: 0.09 },
      { x: 55, z: 28, scale: 0.05 }
    ]

    treePositions.forEach((pos, index) => {
      // 调用克隆方法
      const treeClone = model.cloneModel(
        [pos.x, 0, pos.z], // 位置数组
        pos.scale          // 缩放值
      )
      
      // 设置克隆体属性
      treeClone.object.name = `树_${index + 2}`
      treeClone.openCastShadow()
      treeClone.startAnimal()
      //treeClone.object.rotation.y = Math.random() * Math.PI * 2
    })
  })
}

const loadPeople = () => {
    modelLoaderRef.current.loadModelToScene('/glb/ren.glb', (model) => {
    model.openCastShadow()
    model.object.position.set(13, 0, 15)
    model.object.name = '人'
    model.startAnimal(1)
    //model.cloneModel([25, 0, 29]).startAnimal()
  })
}




  return (
    <div>
      <div ref={containerRef} id="container" />
      <div className="control-panel">
        <div className="control-card">
          <button 
            // disabled={isNetRolledUp}
            // onClick={rollUpShadingNet}
            className="tech-button"
          >
            收起防晒网
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;