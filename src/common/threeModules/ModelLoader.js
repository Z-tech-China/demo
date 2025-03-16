// 修改 ModelLoader.js 为类组件
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import DsModel from './DsModel';

export default class ModelLoader {
  constructor(viewer) {
    this.viewer = viewer;
    this.scene = viewer.scene;
    this.loaderGLTF = new GLTFLoader();
    this.loaderFBX = new FBXLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/js/draco/');
    this.loaderGLTF.setDRACOLoader(this.dracoLoader);
  }

  loadModelToScene(url, callback, progress) {
    this.loadModel(url, model => {
      this.scene.add(model.object);
      callback?.(model);
    }, num => {
      progress?.(num);
    });
  }

  loadModel(url, callback, progress) {
    let loader = this.loaderGLTF;
    if (url.indexOf('.fbx') !== -1) {
      loader = this.loaderFBX;
    }
    loader.load(url, model => {
      callback?.(new DsModel(model, this.viewer));
    }, xhr => {
      progress?.((xhr.loaded / xhr.total).toFixed(2));
    }, error => {
      console.error('模型渲染报错：', error);
    });
  }
}