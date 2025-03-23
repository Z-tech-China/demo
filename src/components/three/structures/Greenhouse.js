// greenhouse.js - 大棚模块化封装
import * as THREE from 'three';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
const greenhouseConfig = {
    length: 30,
    width: 14,
    height: 8,
    archHeight: 5,
    columns: 8,
    beams: 5,
    color: 0x808080,
    coverOpacity: 0.4
};

export const frameGroup = new THREE.Group();
export function createGreenhouse(scene) { // 添加scene参数
    
  
    scene.add(frameGroup); 
    // 生成立柱
    createColumns(frameGroup);
    //拱顶
    createArchRoof(frameGroup);
    //覆盖材料
    createCoverMaterial(frameGroup);
    //种植槽
    createBox(frameGroup);
    //门
    createSlidingDoor(frameGroup);
    //防晒网
    createShadingNet(frameGroup);

    createLightSensor(frameGroup);

    setFan(frameGroup);

    createIrrigationSystem(frameGroup,greenhouseConfig.width / 6.3);
}

// 立柱生成
function createColumns(group) {
  const material = new THREE.MeshPhongMaterial({ color: greenhouseConfig.color });
  const spacing = greenhouseConfig.length / (greenhouseConfig.columns - 1);
  
  // 创建普通立柱几何体
  const columnGeometry = new THREE.CylinderGeometry(0.1, 0.1, greenhouseConfig.height, 8);
  
  // 创建墙角加高立柱几何体
  const cornerColumnGeometry = new THREE.CylinderGeometry(
    0.1, 0.1, 
    greenhouseConfig.height + greenhouseConfig.archHeight, 
    8
  );
  
  // 创建横梁几何体
  const beamGeometry = new THREE.CylinderGeometry(0.08, 0.08, 3*greenhouseConfig.width, 8);
  // 创建连接墙角立柱的横梁几何体
  const cornerBeamXGeometry = new THREE.CylinderGeometry(0.08, 0.08, greenhouseConfig.length, 8);
  const cornerBeamZGeometry = new THREE.CylinderGeometry(0.08, 0.08, 3*greenhouseConfig.width, 8);
  
  for (let i = 0; i < greenhouseConfig.columns; i++) {
    // 计算x坐标
    const xPos = -greenhouseConfig.length/2 + i * spacing;
    
    // 创建前排立柱
    const column = new THREE.Mesh(columnGeometry, material);
    column.position.x = xPos;
    column.position.y = greenhouseConfig.height/2;
    column.position.z = 0;
    column.castShadow = true;
    group.add(column);
    
    // 镜像创建后面的立柱
    for(let j = 1; j < 4; j++){
      const mirrorColumn = column.clone();
      mirrorColumn.position.z = j * greenhouseConfig.width;
      group.add(mirrorColumn);
    }

    // 立柱最上端添加一个横梁
    const beam = new THREE.Mesh(beamGeometry, material);
    beam.position.x = column.position.x;
    beam.position.y = greenhouseConfig.height; // 放置在立柱的顶端
    beam.position.z = greenhouseConfig.width / 2 * 3;
    beam.rotation.x = Math.PI / 2; // 旋转横梁使其水平
    beam.castShadow = true;
    group.add(beam);
  }
  
  // 替换四个角落的立柱为加高版本
  // 获取四个角落的位置
  const cornerPositions = [
    {x: -greenhouseConfig.length/2, z: 0},                     // 左前
    {x: greenhouseConfig.length/2, z: 0},                      // 右前
    {x: -greenhouseConfig.length/2, z: 3*greenhouseConfig.width}, // 左后
    {x: greenhouseConfig.length/2, z: 3*greenhouseConfig.width}   // 右后
  ];
  
  // 创建四个墙角立柱
  const cornerColumns = [];
  for (let i = 0; i < 4; i++) {
    const cornerColumn = new THREE.Mesh(cornerColumnGeometry, material);
    cornerColumn.position.x = cornerPositions[i].x;
    // 由于高度增加，需要调整y轴位置使底部对齐
    cornerColumn.position.y = (greenhouseConfig.height + greenhouseConfig.archHeight) / 2;
    cornerColumn.position.z = cornerPositions[i].z;
    cornerColumn.castShadow = true;
    group.add(cornerColumn);
    cornerColumns.push(cornerColumn);
  }
  
  // 添加x方向的横梁(前后两根)
  const cornerBeamFront = new THREE.Mesh(cornerBeamXGeometry, material);
  cornerBeamFront.position.x = 0; // 居中
  cornerBeamFront.position.y = greenhouseConfig.height + greenhouseConfig.archHeight;
  cornerBeamFront.position.z = 0; // 前面
  cornerBeamFront.rotation.z = Math.PI / 2; // 使横梁水平并沿x轴方向
  cornerBeamFront.castShadow = true;
  group.add(cornerBeamFront);
  
  const cornerBeamBack = cornerBeamFront.clone();
  cornerBeamBack.position.z = 3 * greenhouseConfig.width; // 后面
  group.add(cornerBeamBack);
  
  // 添加z方向的横梁(左右两根)
  const cornerBeamLeft = new THREE.Mesh(cornerBeamZGeometry, material);
  cornerBeamLeft.position.x = -greenhouseConfig.length / 2; // 左侧
  cornerBeamLeft.position.y = greenhouseConfig.height + greenhouseConfig.archHeight;
  cornerBeamLeft.position.z = 1.5 * greenhouseConfig.width; // 居中
  cornerBeamLeft.rotation.x = Math.PI / 2; // 使横梁水平并沿z轴方向
  cornerBeamLeft.castShadow = true;
  group.add(cornerBeamLeft);
  
  const cornerBeamRight = cornerBeamLeft.clone();
  cornerBeamRight.position.x = greenhouseConfig.length / 2; // 右侧
  group.add(cornerBeamRight);
}

// 拱顶生成
function createArchRoof(group) {
  const { length, width, height, archHeight } = greenhouseConfig;
  
  // 创建一个新的组来容纳所有拱顶结构
  const allArchesGroup = new THREE.Group();

  // 拱顶创建逻辑
  function createSingleArch(zOffset) {
    const curvePoints = [];
    const shapePoints = [];
    const archSegments = 20;
    const baseY = height;
    shapePoints.push(new THREE.Vector2(width/2, 0));

    for (let i = 0; i <= archSegments; i++) {
      const t = i / archSegments;
      const angle = t * Math.PI;
      const x = (Math.cos(angle) * width/2) - width/2;
      const y = Math.sin(angle) * archHeight;
      curvePoints.push(new THREE.Vector3(x, y, 0));
      shapePoints.push(new THREE.Vector2(x, y));
    }
    
    shapePoints.push(new THREE.Vector2(-width/2, 0));
    const archShape = new THREE.Shape(shapePoints);
    const shapeGeometry = new THREE.ShapeGeometry(archShape);

    const coverMaterial = new THREE.MeshPhongMaterial({
      color: 0x90caf9,
      transparent: true,
      opacity: greenhouseConfig.coverOpacity,
      side: THREE.DoubleSide
    });

    const archMesh = new THREE.Mesh(shapeGeometry, coverMaterial);
    archMesh.rotation.y = Math.PI/2;
    archMesh.position.set(-length/2, baseY, zOffset);
    allArchesGroup.add(archMesh);  

    const _arch = archMesh.clone();
    _arch.position.x = length/2; 
    allArchesGroup.add(_arch);  

    const tubeGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(curvePoints),
      16,
      0.10,
      16,
      false
    );

    const archMaterial = new THREE.MeshPhongMaterial({ 
      color: greenhouseConfig.color, 
      shininess: 30,
      side: THREE.DoubleSide
    });

    const mainArch = new THREE.Mesh(tubeGeometry, archMaterial);
    mainArch.rotation.y = Math.PI/2;
    mainArch.position.set(-length/2, baseY, zOffset);

    const archInterval = greenhouseConfig.length / (greenhouseConfig.columns-1);
    for (let i = 0; i < greenhouseConfig.columns; i++) {
      const arch = mainArch.clone();
      arch.position.x += i * archInterval;
      allArchesGroup.add(arch);  
    }

    // 创建横梁
    createBeams(zOffset);
  }

  function createBeams(zOffset) {
    const ridgeGeometry = new THREE.CylinderGeometry(0.12, 0.12, greenhouseConfig.length, 16, 1, false, 0, Math.PI);
    const ridge = new THREE.Mesh(ridgeGeometry, new THREE.MeshPhongMaterial({ color: greenhouseConfig.color, shininess: 30 }));
    ridge.position.set(0, greenhouseConfig.height + greenhouseConfig.archHeight, greenhouseConfig.width / 2 + zOffset);
    ridge.rotation.z = Math.PI / 2;
    ridge.rotation.x = Math.PI / 2;
    allArchesGroup.add(ridge);

    const radius = (width * width + 4 * archHeight * archHeight) / (6 * archHeight);
    const centerY = height + archHeight - radius;

    const positions = [width / 6, width / 3, width * 2 / 3, width * 5 / 6];

    positions.forEach(zPos => {
      const xOffset = zPos - (width / 2);
      const yOnCurve = centerY + Math.sqrt(radius * radius - xOffset * xOffset);
      
      const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, greenhouseConfig.length, 16, 1, false, 0, Math.PI);
      const beam = new THREE.Mesh(beamGeometry, new THREE.MeshPhongMaterial({ color: greenhouseConfig.color, shininess: 30 }));
      beam.position.set(0, yOnCurve, zPos + zOffset);
      beam.rotation.z = Math.PI / 2;
      beam.rotation.x = Math.PI / 2;
      allArchesGroup.add(beam);
    });
  }

  // 创建三个拱顶
  const archSpacing = width ; // 拱顶之间的间距
  createSingleArch(-archSpacing);
  createSingleArch(0);
  createSingleArch(archSpacing);

  // 将整个拱顶组添加到主组
  group.add(allArchesGroup);

  // 调整整个拱顶组的位置，使其居中
  allArchesGroup.position.z += archSpacing;
}

// 覆盖材料生成
function createCoverMaterial(group) {

  const { length, width, height, archHeight } = greenhouseConfig;

  // 创建一个新的组来容纳所有覆盖材料
  const allCoversGroup = new THREE.Group();

  const coverMaterial = new THREE.MeshPhongMaterial({
    color: 0x90caf9,
    transparent: true,
    opacity: greenhouseConfig.coverOpacity,
    side: THREE.DoubleSide
  });

  function createSingleCover(zOffset) {
    const coverGeometry = new ParametricGeometry((u, v, target) => {
      const angle = u * Math.PI;
      const x = Math.cos(angle) * width/2;
      const y = Math.sin(angle) * archHeight + height;
      const z = (v - 0.5) * length;
      
      target.set(x, y, z);
    }, 50, 50);
    
    const cover = new THREE.Mesh(coverGeometry, coverMaterial);
    cover.position.x = 0;
    cover.position.z = width/2 + zOffset;
    cover.rotation.y = Math.PI/2;
    cover.castShadow = true;
    cover.receiveShadow = true;
    allCoversGroup.add(cover);
  }

  // 创建三个覆盖材料
  const coverSpacing = width; // 覆盖材料之间的间距
  createSingleCover(-coverSpacing);
  createSingleCover(0);
  createSingleCover(coverSpacing);

  // 调整整个覆盖材料组的位置，使其居中
  allCoversGroup.position.z += coverSpacing;

  // 前后面板
  const frontCoverGeometry = new THREE.PlaneGeometry(length, height);
  const frontCover = new THREE.Mesh(frontCoverGeometry, coverMaterial);
  frontCover.position.set(0, height/2, -coverSpacing);
  allCoversGroup.add(frontCover);
  
  const backCover = frontCover.clone();
  backCover.position.z = 2*coverSpacing;
  allCoversGroup.add(backCover);

  // 左右面板
  const sideShape = new THREE.Shape();
  sideShape.moveTo(-3*width/2, 0);
  sideShape.lineTo(3*width/2, 0);
  sideShape.lineTo(3*width/2, height);
  sideShape.lineTo(-3*width/2, height);
  sideShape.lineTo(-3*width/2, 0);

  // 创建门洞
  const doorWidth = 1.5;
  const doorHeight = 2.5;
  const holeShape = new THREE.Path();
  holeShape.moveTo(-doorWidth/2, 0);
  holeShape.lineTo(doorWidth/2, 0);
  holeShape.lineTo(doorWidth/2, doorHeight);
  holeShape.lineTo(-doorWidth/2, doorHeight);
  holeShape.lineTo(-doorWidth/2, 0);

  // 将门洞添加到左侧面板的形状中
  sideShape.holes.push(holeShape);

  // 创建左侧面板的几何体
  const leftSideGeometry = new THREE.ShapeGeometry(sideShape);
  const leftSideCover = new THREE.Mesh(leftSideGeometry, coverMaterial);
  leftSideCover.position.set(length/2, 0,greenhouseConfig.width/2);
  leftSideCover.rotation.y = Math.PI/2;
  allCoversGroup.add(leftSideCover);

  // 创建右侧面板（不带门洞）
  const rightSideShape = new THREE.Shape();
  rightSideShape.moveTo(-3*width/2, 0);
  rightSideShape.lineTo(3*width/2, 0);
  rightSideShape.lineTo(3*width/2, height);
  rightSideShape.lineTo(-3*width/2, height);
  rightSideShape.lineTo(-3*width/2, 0);

  const rightSideGeometry = new THREE.ShapeGeometry(rightSideShape);
  const rightSideCover = new THREE.Mesh(rightSideGeometry, coverMaterial);
  rightSideCover.position.set(-length/2, 0, greenhouseConfig.width/2);
  rightSideCover.rotation.y = Math.PI/2;
  allCoversGroup.add(rightSideCover);

  // 将整个覆盖材料组添加到主组
  group.add(allCoversGroup);
}

function createBox(group) {
  // 盒子的尺寸
  const width = greenhouseConfig.width/30;    // 宽度
  const length = greenhouseConfig.length-10;   // 长度
  const height = 0.4;   // 高度
  const thickness = 0.05; // 墙壁厚度

  // 创建外墙形状
  const outerShape = new THREE.Shape();
  outerShape.moveTo(-width/2, -length/2);
  outerShape.lineTo(width/2, -length/2);
  outerShape.lineTo(width/2, length/2);
  outerShape.lineTo(-width/2, length/2);
  outerShape.lineTo(-width/2, -length/2);

  // 创建内墙形状（挖空用）
  const holeShape = new THREE.Path();
  holeShape.moveTo(-width/2 + thickness, -length/2 + thickness);
  holeShape.lineTo(width/2 - thickness, -length/2 + thickness);
  holeShape.lineTo(width/2 - thickness, length/2 - thickness);
  holeShape.lineTo(-width/2 + thickness, length/2 - thickness);
  holeShape.lineTo(-width/2 + thickness, -length/2 + thickness);

  // 添加内墙到外墙形状中
  outerShape.holes.push(holeShape);

  // 挤出设置
  const extrudeSettings = {
    steps: 1,
    depth: height,
    bevelEnabled: false
  };

  // 创建几何体
  const geometry = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);

  // 创建底部形状
  const bottomShape = new THREE.Shape();
  bottomShape.moveTo(-width/2, -length/2);
  bottomShape.lineTo(width/2, -length/2);
  bottomShape.lineTo(width/2, length/2);
  bottomShape.lineTo(-width/2, length/2);
  bottomShape.lineTo(-width/2, -length/2);

  // 创建内部土壤形状
  const soilShape = new THREE.Shape();
  soilShape.moveTo(-width/2 + thickness, -length/2 + thickness);
  soilShape.lineTo(width/2 - thickness, -length/2 + thickness);
  soilShape.lineTo(width/2 - thickness, length/2 - thickness);
  soilShape.lineTo(-width/2 + thickness, length/2 - thickness);
  soilShape.lineTo(-width/2 + thickness, -length/2 + thickness);

  // 创建底部几何体
  const bottomGeometry = new THREE.ShapeGeometry(bottomShape);
  
  // 创建内部土壤几何体
  const soilGeometry = new THREE.ShapeGeometry(soilShape);

  // 加载泥土贴图
 // 加载泥土贴图
 const textureLoader = new THREE.TextureLoader();

 const textures = {
  diffuse: textureLoader.load('textures/Soil/earth_COLOR.jpg'),
  normal: textureLoader.load('textures/Soil/earth_NRM.jpg'),
  displacement: textureLoader.load('textures/Soil/earth_DISP.jpg'),
  occlusion: textureLoader.load('textures/Soil/earth_OCC.jpg'),
  roughness: textureLoader.load('textures/Soil/earth_SPEC.jpg') // 注意转换用途
}

 Object.values(textures).forEach(texture => {
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(5, 5)
  texture.anisotropy = 32
})

  // 创建泥土材质
  const soilMaterial = new THREE.MeshStandardMaterial({
    map: textures.diffuse,
    normalMap: textures.normal,
    displacementMap: textures.displacement,
    displacementScale: 0.0,  // 置换强度调节
    aoMap: textures.occlusion,
    roughnessMap: textures.roughness,
    metalness: 0.1,         // 配合高光控制
    roughness: 0.8          // 基础粗糙度
  });

  // 创建盒子材质
// 创建盒子材质（塑料效果）
  const boxMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,  // 白色基础色
    roughness: 0.3,   // 较低的粗糙度，使表面更光滑
    metalness: 0.0,   // 非金属
    transparent: false, // 启用透明
    //opacity: 0.9,     // 轻微的透明度
    side: THREE.DoubleSide
  });

  // 创建底部材质
  const bottomMaterial = new THREE.MeshPhongMaterial({
    color: 0x808080,
    side: THREE.DoubleSide
  });

  // 创建网格
  const box = new THREE.Mesh(geometry, boxMaterial);
  const soil = new THREE.Mesh(soilGeometry, soilMaterial);
  const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
  
  const boxInterval = greenhouseConfig.width / 6.3;
  
  // 调整位置，使盒子底部在原点
  box.position.y = height+1;
  box.rotation.x= Math.PI/2;
  box.rotation.z= Math.PI/2;
  box.position.z = boxInterval;
  box.position.x = 0;
  
  // 设置土壤位置和旋转
  soil.position.y = height+1-height/10;
  soil.rotation.x = -Math.PI/2;
  soil.rotation.z = Math.PI/2;
  soil.position.z = boxInterval;
  soil.position.x = 0;
  
  bottom.position.y = 1;
  bottom.rotation.x= Math.PI/2;
  bottom.rotation.z= Math.PI/2;
  bottom.position.z = boxInterval;
  bottom.position.x = 0;
  
  // 创建组合对象
  const boxGroup = new THREE.Group();
  boxGroup.add(box);
  boxGroup.add(soil);
  
  group.add(boxGroup);
  group.add(bottom);

  // 克隆和添加多个盒子
  for (let i = 1; i < 18; i++) {
    const _boxGroup = boxGroup.clone();
    _boxGroup.position.z += i * boxInterval;
    group.add(_boxGroup);

    const _bottom = bottom.clone();
    _bottom.position.z += i * boxInterval;
    group.add(_bottom);
  }

  // 创建支撑柱函数
  function createSupportPillar() {
    const pillarGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const pillarMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });
    return new THREE.Mesh(pillarGeometry, pillarMaterial);
  }

  // 添加支撑柱
  const pillarCount = 5; // 每个底部的支撑柱数量
  const pillarInterval = length / (pillarCount + 1);

  for (let i = 0; i < 18; i++) { 
    for (let j = 0; j < pillarCount; j++) {
      const pillar = createSupportPillar();
      pillar.position.set(
        pillarInterval * (j + 1)-greenhouseConfig.length/3,
        0.5, // 支撑柱的一半高度
        boxInterval * i + boxInterval,
      );
      group.add(pillar);
    }
  }
}


function createSlidingDoor(group) {
  // 门的尺寸参数
  const doorWidth = 1.5;     // 门的宽度
  const doorHeight = 2.5;    // 门的高度  
  const doorThickness = 0.05; // 门的厚度
  const frameThickness = 0.08; // 门框厚度

  // 创建门框
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-doorWidth/2 - frameThickness, 0);
  frameShape.lineTo(doorWidth/2 + frameThickness, 0);
  frameShape.lineTo(doorWidth/2 + frameThickness, doorHeight + frameThickness);
  frameShape.lineTo(-doorWidth/2 - frameThickness, doorHeight + frameThickness);
  frameShape.lineTo(-doorWidth/2 - frameThickness, 0);

  // 创建门框内部挖空
  const holeShape = new THREE.Path();
  holeShape.moveTo(-doorWidth/2, 0);
  holeShape.lineTo(doorWidth/2, 0);
  holeShape.lineTo(doorWidth/2, doorHeight);
  holeShape.lineTo(-doorWidth/2, doorHeight);
  holeShape.lineTo(-doorWidth/2, 0);

  frameShape.holes.push(holeShape);

  // 门框挤出设置
  const frameExtrudeSettings = {
    steps: 1,
    depth: frameThickness * 2,
    bevelEnabled: false
  };

  // 创建门框几何体
  const frameGeometry = new THREE.ExtrudeGeometry(frameShape, frameExtrudeSettings);
  const frameMaterial = new THREE.MeshPhongMaterial({
    color: 0x808080
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.position.set(greenhouseConfig.length/2-doorThickness/2, 0, greenhouseConfig.width/2*3);
  frame.rotation.y =Math.PI/2;
  // 创建门板
  const doorGeometry = new THREE.BoxGeometry(doorWidth/2, doorHeight, doorThickness);
  // 创建毛玻璃材质
  const doorMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    roughness: 0.8,
    transmission: 0.8,
    thickness: doorThickness,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide
  });

  // 创建左右门板
  const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
  const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);

  // 设置门板位置
  leftDoor.position.set(greenhouseConfig.length/2-doorThickness/2, doorHeight/2, greenhouseConfig.width/2*3-doorWidth/4);
  rightDoor.position.set(greenhouseConfig.length/2+doorThickness/2,doorHeight/2, greenhouseConfig.width/2*3+doorWidth/4);
  leftDoor.rotation.y =Math.PI/2;
  rightDoor.rotation.y =Math.PI/2;

  // 创建滑轨
  const trackGeometry = new THREE.BoxGeometry(doorWidth + frameThickness * 2, 0.05, 0.05);
  const trackMaterial = new THREE.MeshPhongMaterial({
    color: 0x404040
  });
  const track = new THREE.Mesh(trackGeometry, trackMaterial);
  track.position.set(greenhouseConfig.length/2, 0, greenhouseConfig.width/2*3);
  track.rotation.y =Math.PI/2;
  // 将所有部件添加到组中
  group.add(frame);
  group.add(leftDoor);
  group.add(rightDoor);
  group.add(track);
  console.log(frame);

  function createHandle() {
    const handleGroup = new THREE.Group();

    // 创建把手主体
    const handleBarGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8);
    const handleMaterial = new THREE.MeshPhongMaterial({
      color: 0x404040,
      metalness: 0.8,
      roughness: 0.2
    });
    const handleBar = new THREE.Mesh(handleBarGeometry, handleMaterial);
    handleBar.rotation.x = Math.PI / 2;

    // 创建把手固定座
    const mountGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.03, 8);
    const mount1 = new THREE.Mesh(mountGeometry, handleMaterial);
    const mount2 = new THREE.Mesh(mountGeometry, handleMaterial);

    // 设置固定座位置
    mount1.position.z = 0.06;
    mount2.position.z = -0.06;

    // 将部件添加到把手组中
    handleGroup.add(handleBar);
    handleGroup.add(mount1);
    handleGroup.add(mount2);

    return handleGroup;
  }
  // 创建左右门的把手
  const leftHandle = createHandle();
  const rightHandle = createHandle();

  // 设置左门把手位置
  leftHandle.position.set(greenhouseConfig.length/2-doorThickness/2,doorHeight/2,greenhouseConfig.width/2*3-doorWidth/4 + doorThickness);
  leftHandle.rotation.y = Math.PI/2;

  // 设置右门把手位置
  rightHandle.position.set( greenhouseConfig.length/2+doorThickness/2,doorHeight/2,greenhouseConfig.width/2*3+doorWidth/4 - doorThickness);
  rightHandle.rotation.y = -Math.PI/2;

  // 将把手添加到组中
  group.add(leftHandle);
  group.add(rightHandle);
}

// 添加防晒网相关配置到greenhouseConfig
greenhouseConfig.shadingNet = {
  color: 0xCCCCCC,
  opacity: 0.8,
  segments: 20, // 网格细分数量，影响卷起动画的平滑度
  isRolledUp: false, // 防晒网是否卷起的状态
  rollSpeed: 0.05 // 卷起/展开的速度
};

// 创建防晒网覆盖材料
function createShadingNet(group) {
  const material = new THREE.MeshPhongMaterial({
    color: greenhouseConfig.shadingNet.color,
    transparent: true,
    opacity: greenhouseConfig.shadingNet.opacity,
    side: THREE.DoubleSide
  });
  
  // 获取顶部框架的尺寸
  const frameWidth = greenhouseConfig.length;
  const frameDepth = 3 * greenhouseConfig.width;
  const frameHeight = greenhouseConfig.height + greenhouseConfig.archHeight;
  
  // 创建防晒网平面
  const geometry = new THREE.PlaneGeometry(
    frameWidth, 
    frameDepth, 
    greenhouseConfig.shadingNet.segments, 
    greenhouseConfig.shadingNet.segments
  );
  
  const shadingNet = new THREE.Mesh(geometry, material);
  shadingNet.rotation.x = Math.PI / 2; // 水平放置
  shadingNet.position.y = frameHeight+0.11;
  shadingNet.position.z = frameDepth / 2;
  shadingNet.castShadow = true;
  shadingNet.receiveShadow = true;
  
  // 保存顶点的初始位置，用于动画
  shadingNet.userData.originalVertices = [];
  const positionAttribute = geometry.getAttribute('position');
  
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);
    
    shadingNet.userData.originalVertices.push({
      x: x,
      y: y,
      z: z
    });
  }
  
  // 将防晒网添加到group中
  group.add(shadingNet);
  // 保存对象引用到group中，方便后续访问
  group.userData.shadingNet = shadingNet;
  return shadingNet;
}

// 防晒网控制接口
/**
 * 调用示例   
 *  controlShadingNet(greenhouse, true, () => {
      isNetRolledUp.value = true;
      // 更新光照传感器值
      updateSensorValues();
    });
 */
export function controlShadingNet(greenhouse, rollUp = true, callback = null) {
  const shadingNet = greenhouse.userData.shadingNet;
  
  if (!shadingNet) {
    console.error('找不到防晒网');
    return;
  }
  
  // 已经处于目标状态，不需要动作
  if ((rollUp && greenhouseConfig.shadingNet.isRolledUp) || 
      (!rollUp && !greenhouseConfig.shadingNet.isRolledUp)) {
    if (callback) callback();
    return;
  }
  
  // 更新状态
  greenhouseConfig.shadingNet.isRolledUp = rollUp;
  
  // 保存初始宽度和位置
  const initialWidth = greenhouseConfig.length;
  const initialX = 0;
  
  // 动画函数
  let progress = 0;
  const animate = function() {
    progress += greenhouseConfig.shadingNet.rollSpeed;
    
    if (progress >= 1) {
      progress = 1;
      
      if (rollUp) {
        shadingNet.visible = false;
      }
      
      if (callback) callback();
    } else {
      requestAnimationFrame(animate);
    }
    
    // 计算当前缩放比例
    const currentScale = rollUp ? (1 - progress) : progress;
    
    // 更新网格的scale属性
    shadingNet.scale.x = currentScale;
    
    // 为保持网格的一侧固定，需要调整位置
    // 假设网格的原点在中心，需要调整x位置使其看起来从右向左卷起
    const offsetX = (initialWidth / 2) * (1 - currentScale);
    shadingNet.position.x = initialX - offsetX;
    
    // 如果是展开操作且这是第一帧，确保网格可见
    if (!rollUp && progress <= greenhouseConfig.shadingNet.rollSpeed) {
      shadingNet.visible = true;
      shadingNet.position.x = initialX - (initialWidth / 2);
    }
  };
  
  // 开始动画前的准备
  if (!rollUp) {
    // 展开前确保网格可见，但初始宽度为0
    shadingNet.visible = true;
    shadingNet.scale.x = 0;
    shadingNet.position.x = initialX - (initialWidth / 2);
  } else {
    // 确保卷起动画开始前网格是完全展开的
    shadingNet.scale.x = 1;
    shadingNet.position.x = initialX;
  }
  
  // 开始动画
  animate();
}

//光度传感器相关配置
greenhouseConfig.lightSensor = {
  size: 0.15,
  color: 0xc0c0c0,
  indicatorColor: 0xFFFF00,
  sensorValue: 0, // 0-1的值，表示当前光照强度
  maxHeight: 0.1, // 指示器最大高度
  position: { // 传感器默认位置
    x: greenhouseConfig.length - 0.5,
    y:0,// greenhouseConfig.height - 0.5, 
    z: greenhouseConfig.width * 1.5
  }
};

// 创建光度传感器模型
function createLightSensor(group) {
  // 传感器组
  const sensorGroup = new THREE.Group();
  
  // 传感器底座
  const baseGeometry = new THREE.CylinderGeometry(
    greenhouseConfig.lightSensor.size,
    greenhouseConfig.lightSensor.size * 1.2,
    greenhouseConfig.lightSensor.size * 0.5,
    16
  );
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: greenhouseConfig.lightSensor.color,
    shininess: 100
  });

  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = greenhouseConfig.lightSensor.size * 0.25;
  sensorGroup.add(base);
  
  // 传感器主体
  const bodyGeometry = new THREE.SphereGeometry(
    greenhouseConfig.lightSensor.size * 0.7,
    16,
    12,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.6
  );
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: greenhouseConfig.lightSensor.color,
    transparent: true,
    opacity: 0.7,
    shininess: 100
  });

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = greenhouseConfig.lightSensor.size * 0.7;
  body.rotation.x = Math.PI;
  sensorGroup.add(body);
  
  // 光敏元件
  const sensorGeometry = new THREE.CircleGeometry(
    greenhouseConfig.lightSensor.size * 0.4,
    16
  );
  const sensorMaterial = new THREE.MeshPhongMaterial({
    color: 0x222222,
    shininess: 10
  });
  const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
  sensor.position.y = greenhouseConfig.lightSensor.size * 0.8;
  sensor.rotation.x = -Math.PI / 2;
  sensorGroup.add(sensor);
  
  // 指示器容器（透明圆柱）
  const indicatorContainerGeometry = new THREE.CylinderGeometry(
    greenhouseConfig.lightSensor.size * 0.15,
    greenhouseConfig.lightSensor.size * 0.15,
    greenhouseConfig.lightSensor.maxHeight,
    8
  );
  const indicatorContainerMaterial = new THREE.MeshPhongMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.8
  });
  const indicatorContainer = new THREE.Mesh(
    indicatorContainerGeometry, 
    indicatorContainerMaterial
  );
  indicatorContainer.position.y = greenhouseConfig.lightSensor.size + greenhouseConfig.lightSensor.maxHeight / 2;
  sensorGroup.add(indicatorContainer);
  
  // 光强指示器
  const indicatorGeometry = new THREE.CylinderGeometry(
    greenhouseConfig.lightSensor.size * 0.1,
    greenhouseConfig.lightSensor.size * 0.1,
    0.01, // 初始高度很小，将通过updateLightSensor调整
    8
  );
  const indicatorMaterial = new THREE.MeshPhongMaterial({
    color: greenhouseConfig.lightSensor.indicatorColor,
    emissive: greenhouseConfig.lightSensor.indicatorColor,
    emissiveIntensity: 0.5
  });
  const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
  indicator.position.y = greenhouseConfig.lightSensor.size * 1.2 + 0.01 / 2;
  sensorGroup.add(indicator);
  
  // 保存指示器的引用
  sensorGroup.userData.indicator = indicator;
  
  // 设置传感器的位置
  sensorGroup.position.set(
    greenhouseConfig.lightSensor.position.x,
    greenhouseConfig.lightSensor.position.y,
    greenhouseConfig.lightSensor.position.z
  );
  
  // 将传感器添加到组中
  group.add(sensorGroup);
  
  // 保存传感器引用到组中
  group.userData.lightSensor = sensorGroup;
  
  return sensorGroup;
}

// 更新光度传感器的显示值
function updateLightSensor(greenhouse, value) {
  // 确保值在0-1范围内
  value = Math.max(0, Math.min(1, value));
  
  const sensorGroup = greenhouse.userData.lightSensor;
  if (!sensorGroup) {
    console.error('找不到光度传感器');
    return;
  }
  
  const indicator = sensorGroup.userData.indicator;
  
  // 更新配置中的值
  greenhouseConfig.lightSensor.sensorValue = value;
  
  // 更新指示器高度
  const newHeight = Math.max(0.01, value * greenhouseConfig.lightSensor.maxHeight);
  
  // 更新几何体
  indicator.geometry.dispose(); // 清除旧几何体
  indicator.geometry = new THREE.CylinderGeometry(
    greenhouseConfig.lightSensor.size * 0.1,
    greenhouseConfig.lightSensor.size * 0.1,
    newHeight,
    8
  );
  
  // 更新位置
  indicator.position.y = greenhouseConfig.lightSensor.size * 1.2 + newHeight / 2;
  
  // 根据光照强度更新发光强度
  indicator.material.emissiveIntensity = 0.5 + value * 0.5;
}

// 光度传感器自动感应功能
function enableAutoLightSensing(greenhouse, scene) {
  // 创建一个虚拟光照计算点
  const virtualSensor = new THREE.Vector3();
  const sensorGroup = greenhouse.userData.lightSensor;
  
  // 更新函数
  function updateSensor() {
    if (!sensorGroup) return;
    
    // 获取传感器的世界坐标
    sensorGroup.getWorldPosition(virtualSensor);
    
    // 计算环境光照强度（简单模拟）
    let lightValue = 0;
    
    // 检查所有光源
    scene.traverse((object) => {
      if (object.isDirectionalLight || object.isPointLight || object.isSpotLight) {
        // 光源强度计算
        const intensity = object.intensity;
        const distance = object.position.distanceTo(virtualSensor);
        
        // 根据光源类型计算光照贡献
        if (object.isDirectionalLight) {
          // 定向光不随距离衰减
          lightValue += intensity * 0.5;
        } else {
          // 点光源和聚光灯根据距离衰减
          const attenuation = 1 / Math.max(1, distance * distance);
          lightValue += intensity * attenuation;
        }
        // 考虑阴影遮挡（简化处理）
        if (greenhouseConfig.shadingNet.isRolledUp === false) {
          // 如果防晒网展开，降低光照强度
          lightValue *= 0.5;
        }
      }
    });
    
    // 将光照值标准化到0-1范围
    lightValue = Math.min(1, lightValue);
    
    // 更新传感器显示
    updateLightSensor(greenhouse, lightValue);
    
    // 持续更新
    requestAnimationFrame(updateSensor);
  }
  
  // 启动自动感应
  updateSensor();
}
//==============================================
function createFan(scene) {
  // 创建一个组来存放整个风扇
  const fanGroup = new THREE.Group();
  
  // 创建风扇外壳（空心圆筒）
  function createHollowCylinder() {
      // 圆筒参数
      const outerRadius = 0.5;
      const innerRadius = 0.45;
      const height = 1;
      const radialSegments = 32;
      
      // 使用CylinderGeometry直接创建圆筒
      const geometry = new THREE.CylinderGeometry(
          outerRadius,   // 顶部半径
          outerRadius,   // 底部半径
          height,        // 高度
          radialSegments,// 径向分段数
          1,             // 高度分段数
          true           // 设置为true以开放圆柱体的顶部和底部
      );
      
      // 金属材质
      const material = new THREE.MeshStandardMaterial({
          color: 0x888888,
          roughness: 0.2,
          metalness: 0.8,
          side: THREE.DoubleSide
      });
      
      const outerCylinder = new THREE.Mesh(geometry, material);
      
      // 内部圆柱（挖孔）
      const innerGeometry = new THREE.CylinderGeometry(
          innerRadius,
          innerRadius,
          height + 0.2, // 稍微长一点以确保完全穿透
          radialSegments,
          1,
          true
      );
      
      const innerCylinder = new THREE.Mesh(innerGeometry, material);
      
      // 将内圆柱设为不可见
      innerCylinder.visible = false;
      
      // 创建圆柱组
      const cylinderGroup = new THREE.Group();
      cylinderGroup.add(outerCylinder);
      cylinderGroup.add(innerCylinder);
      
      return cylinderGroup;
  }
  
  // 创建风扇转子（圆台）
  function createTruncatedCone() {
      // 圆台参数
      const radiusTop = 0.1;      // 顶部半径
      const radiusBottom = 0.2;   // 底部半径
      const height = 0.3;         // 高度
      const radialSegments = 32;  // 径向分段数
      const heightSegments = 1;   // 高度分段数
      
      // 使用CylinderGeometry创建圆台
      const geometry = new THREE.CylinderGeometry(
          radiusTop,     // 顶部半径
          radiusBottom,  // 底部半径
          height,        // 高度
          radialSegments,// 圆周分段数
          heightSegments // 高度分段数
      );
      
      // 创建材质
      const material = new THREE.MeshStandardMaterial({
          color: 0x888888,
          roughness: 0.3,
          metalness: 0.7,
          side: THREE.DoubleSide
      });
      
      // 创建圆台网格
      const truncatedCone = new THREE.Mesh(geometry, material);
      
      // 调整位置
      truncatedCone.position.y = 0.2;
      
      // 创建圆台组
      const coneGroup = new THREE.Group();
      coneGroup.add(truncatedCone);
      
      return coneGroup;
  }
  
  // 创建风扇叶片（扇形数组）
  function createFanBlades(fanCount = 5) {
      // 创建一个组来存放所有扇形
      const fansGroup = new THREE.Group();
      
      // 计算每个扇形的旋转角度
      const angleStep = (2 * Math.PI) / fanCount;
      
      for(let i = 0; i < fanCount; i++) {
          // 扇形参数
          const radius = 0.45;           
          const angleStart = 0;      
          const angleEnd = Math.PI / 5; 
          const segments = 32;        
          const height = 0.03;         

          // 创建扇形路径
          const shape = new THREE.Shape();
          shape.moveTo(0, 0);
          shape.absarc(0, 0, radius, angleStart, angleEnd, false);
          shape.lineTo(0, 0);

          // 扇形的3D几何体设置
          const extrudeSettings = {
              depth: height,
              bevelEnabled: false
          };
          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

          // 创建材质
          const material = new THREE.MeshStandardMaterial({
              color: 0xffcc00,
              roughness: 0.5,
              metalness: 0.5
          });

          // 创建扇形网格
          const fanMesh = new THREE.Mesh(geometry, material);
          
          // 设置扇形的位置和旋转
          fanMesh.rotation.x = Math.PI/2;  // 基础倾斜角度
          fanMesh.position.y = 0.3;        // y轴位置
          
          // 绕Z轴旋转分布
          fanMesh.rotation.z = i * angleStep;
          
          // 将扇形添加到组中
          fansGroup.add(fanMesh);
      }
      
      return fansGroup;
  }
  
  // 创建风扇各部分
  const fanCase = createHollowCylinder();
  const rotorGroup = new THREE.Group(); // 包含转子和扇叶的旋转组
  const rotor = createTruncatedCone();
  const blades = createFanBlades(5);
  
  // 将扇叶和转子添加到同一个旋转组
  rotorGroup.add(rotor);
  rotorGroup.add(blades);
  
  // 将各部分添加到风扇组
  fanGroup.add(fanCase);
  fanGroup.add(rotorGroup);
  
  // 添加旋转控制接口
  const rotationControl = {
      // 旋转速度（弧度/帧）
      speed: 0.01,
      // 是否正在旋转
      isRotating: true,
      // 开始旋转
      startRotation: function() {
          this.isRotating = true;
      },
      // 停止旋转
      stopRotation: function() {
          this.isRotating = false;
      },
      // 设置旋转速度
      setSpeed: function(newSpeed) {
          this.speed = newSpeed;
      },
      // 更新旋转（在动画循环中调用）
      update: function() {
          if (this.isRotating) {
              rotorGroup.rotation.z += this.speed;
          }
      }
  };
  
  // 将整个风扇添加到场景
  scene.add(fanGroup);
  
  // 返回风扇对象和控制接口
  return {
    model: fanGroup,
    rotation: rotationControl,
    // 设置风扇整体位置
    setPosition: function(x, y, z) {
        fanGroup.position.set(x, y, z);
    },
    // 设置风扇整体旋转
    setRotation: function(x, y, z) {
        fanGroup.rotation.x = x;
        fanGroup.rotation.y = y;
        fanGroup.rotation.z = z;
    }
};
}

function setFan(scene){
  const fan = createFan(scene);

// 基本位置和旋转设置
fan.setPosition(greenhouseConfig.length/2+3, 10, greenhouseConfig.width/2);
fan.setRotation( 0, Math.PI,  Math.PI/2);


// 绕任意轴旋转
//fan.rotateAroundAxis(new THREE.Vector3(1, 1, 0), Math.PI/6);  // 绕(1,1,0)轴旋转30度
}

function createIrrigationSystem(scene, boxInterval, boxCount = 18) {
  // 创建灌溉系统组
  const irrigationSystem = new THREE.Group();
  
  // 管道材质 
  const pipeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5dc,  // 米白色
    roughness: 0.4,    // 降低粗糙度使其更光滑
    metalness: 0.1,    // 降低金属感，更像PVC管
    envMapIntensity: 0.5, // 适度的环境反射
    flatShading: false    // 平滑着色
  });
  
  // 喷头材质
  const sprinklerMaterial = new THREE.MeshStandardMaterial({
    color: 0x404040,  // 深灰色喷头
    roughness: 0.4,
    metalness: 0.6
  });
  
  // 水滴材质
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x77aaff,
    transparent: true,
    opacity: 0.7,
    roughness: 0.1
  });
  
  // 获取种植槽长度 (使用与原始代码相同的参数)
  const boxLength = greenhouseConfig.length - 10;
  
  // 为每个种植槽创建平行水管和多个喷头
  for (let i = 0; i < boxCount; i++) {
    // 主水管 - 平行于种植槽
    const pipeRadius = 0.05;
    const pipeGeometry = new THREE.CylinderGeometry(
      pipeRadius, 
      pipeRadius, 
      boxLength, 
      16, 
      1, 
      false
    );
    
    const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.rotation.x = Math.PI / 2;  // 使管道水平
    pipe.rotation.z = Math.PI / 2;  // 与种植槽平行
    pipe.position.set(0, 1.65, boxInterval * i + boxInterval-0.2);
    
    irrigationSystem.add(pipe);
        // 创建圆弧连接部分
        const curveRadius = 0.15;
        const curveSegments = 8;
        const curvePath = new THREE.CurvePath();
        
        // 创建90度圆弧
        const arcCurve = new THREE.EllipseCurve(
          boxLength/2 + curveRadius, 1.65 - curveRadius, // 圆弧中心点
          curveRadius, curveRadius,   // x半径和y半径
          0, Math .PI/2,              // 起始角度和结束角度
          false,                      // 是否逆时针
          0                           // 旋转角度
        );
        
        curvePath.add(arcCurve);
        
        // 从圆弧创建管道几何体
        const curvePoints = curvePath.getPoints(curveSegments);
        const curveGeometry = new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(
            curvePoints.map(point => new THREE.Vector3(point.x, point.y, boxInterval * i + boxInterval))
          ),
          curveSegments,
          pipeRadius,
          12,
          false
        );
        
        const curvePipe = new THREE.Mesh(curveGeometry, pipeMaterial);
        curvePipe.position.z-=0.2;
        curvePipe.position.x-=curveRadius;
        irrigationSystem.add(curvePipe);
    
    // 添加连接到主供水系统的垂直管道
    const verticalPipeRadius = 0.05;
    const verticalPipeHeight = 1.7; // 从水平管道到地面的高度
    const verticalPipeGeometry = new THREE.CylinderGeometry(
      verticalPipeRadius, 
      verticalPipeRadius, 
      verticalPipeHeight-curveRadius*2, 
      16, 
      1, 
      false
    );
    
    const verticalPipe = new THREE.Mesh(verticalPipeGeometry, pipeMaterial);
    verticalPipe.position.set(boxLength/2+curveRadius, verticalPipeHeight/2, boxInterval * i + boxInterval-0.2);
    irrigationSystem.add(verticalPipe);
    

    
    // 在每根水管上添加多个喷头
    const sprinklerCount = 5;  // 每根水管上的喷头数量
    const sprinklerSpacing = boxLength / (sprinklerCount + 1);
    
    for (let j = 1; j <= sprinklerCount; j++) {
      // 确定喷头在管道上的位置
      const position = -boxLength/2 + j * sprinklerSpacing;
      
      // 喷头基座
      const sprinklerBaseGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.06, 12);
      const sprinklerBase = new THREE.Mesh(sprinklerBaseGeometry, sprinklerMaterial);
      sprinklerBase.position.set(position, 1.7, boxInterval * i + boxInterval-0.2);
      
      // 喷头
      const sprinklerHeadGeometry = new THREE.ConeGeometry(0.05, 0.08, 12);
      const sprinklerHead = new THREE.Mesh(sprinklerHeadGeometry, sprinklerMaterial);
      sprinklerHead.rotateX=Math.PI;
      sprinklerHead.position.set(position, 1.6, boxInterval * i + boxInterval-0.2);
      
      irrigationSystem.add(sprinklerBase);
      irrigationSystem.add(sprinklerHead);
      
      // 添加水滴效果（可选）
      if (j % 2 === 0) {  // 隔一个喷头添加水滴效果
        createWaterDrops(sprinklerHead.position, irrigationSystem);
      }
    }
  }
  
  scene.add(irrigationSystem);
  return irrigationSystem;
}

// 创建水滴效果的辅助函数
function createWaterDrops(sprinklerPosition, parent) {
  const dropCount = 6;
  const dropGroup = new THREE.Group();
  
  // 水滴材质
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x77aaff,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1
  });
  
  // 创建喷洒效果 - 细小水滴
  for (let i = 0; i < dropCount; i++) {
    const dropSize = 0.01 + Math.random() * 0.01;
    const dropGeometry = new THREE.SphereGeometry(dropSize, 6, 6);
    const drop = new THREE.Mesh(dropGeometry, waterMaterial);
    
    // 分散在喷头下方
    const spread = 0.15;
    const height = -0.05 - Math.random() * 0.15;
    
    drop.position.set(
      sprinklerPosition.x + (Math.random() - 0.5) * spread,
      sprinklerPosition.y + height,
      sprinklerPosition.z + (Math.random() - 0.5) * spread
    );
    
    dropGroup.add(drop);
  }
  
  // 喷洒锥形区域效果
  const mistGeometry = new THREE.ConeGeometry(0.15, 0.25, 8, 1, true);
  const mistMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaccff,
    transparent: true,
    opacity: 0.2,
    roughness: 0.1,
    side: THREE.DoubleSide
  });
  
  const mist = new THREE.Mesh(mistGeometry, mistMaterial);
  mist.rotation.x = Math.PI;  // 锥尖朝上
  mist.position.set(
    sprinklerPosition.x,
    sprinklerPosition.y - 0.12,
    sprinklerPosition.z
  );
  
  dropGroup.add(mist);
  parent.add(dropGroup);
  
  return dropGroup;
}