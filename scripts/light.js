import * as THREE from "https://cdn.skypack.dev/three@0.136.0/build/three.module.js";

// =============================== STUDIO LIGHT (K BABY) ===============================
class StudioLight {
  constructor(scene, target = null) {
    this.scene = scene;
    this.isOn = true;

    this.offset = {
      x: 0,
      y: 0,
      z: 0,
    };

    this.light = new THREE.SpotLight(0xffffff, 2);
    this.light.angle = Math.PI / 6;
    this.light.penumbra = 0.3;
    this.light.decay = 1;
    this.light.distance = 200;

    this.target = target || new THREE.Object3D();
    this.scene.add(this.target);
    this.light.target = this.target;

    this.scene.add(this.light);
  }

  setPosition(x, y, z) {
    this.light.position.set(x, y, z);
    if (this.helper) this.helper.position.copy(this.light.position);
  }

  setTarget(x, y, z) {
    this.target.position.set(x, y, z);
  }

  setIntensity(value) {
    this.light.intensity = value * 2;
  }

  setColor(color) {
    this.light.color.set(color);
  }

  toggle(value) {
    this.isOn = value;
    this.light.visible = value;
    if (this.helper) this.helper.visible = value;
  }

  setOffset(x, y, z) {
    this.offset.x = x;
    this.offset.y = y;
    this.offset.z = z;
  }

  updatePosition(modelPosition, modelRotation) {
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(modelRotation);

    const offsetVector = new THREE.Vector3(
      this.offset.x,
      this.offset.y,
      this.offset.z
    );
    offsetVector.applyMatrix4(rotationMatrix);

    const lightPosition = new THREE.Vector3(
      modelPosition.x + offsetVector.x,
      modelPosition.y + offsetVector.y,
      modelPosition.z + offsetVector.z
    );
    this.light.position.copy(lightPosition);
    if (this.helper) this.helper.position.copy(lightPosition);

    const targetDistance = 20;

    const initialAngle = Math.PI / 4;
    const targetOffset = new THREE.Vector3(
      -targetDistance * Math.cos(initialAngle),
      -10,
      targetDistance * Math.cos(initialAngle)
    );
    targetOffset.applyMatrix4(rotationMatrix);

    const targetPosition = new THREE.Vector3(
      modelPosition.x + targetOffset.x,
      modelPosition.y + targetOffset.y,
      modelPosition.z + targetOffset.z
    );

    this.target.position.copy(targetPosition);
    if (this.targetHelper) this.targetHelper.position.copy(targetPosition);
  }
}

// =============================== UMBRELLA STUDIO LIGHT ===============================
class UmbrellaLight extends StudioLight {
  constructor(scene, target = null) {
    super(scene, target);

    this.scene.remove(this.light);

    this.light = new THREE.SpotLight(0xffffff, 1.5);
    this.light.angle = Math.PI / 2.5;
    this.light.penumbra = 0.8;
    this.light.decay = 1.5;
    this.light.distance = 150;

    this.target = target || new THREE.Object3D();
    this.scene.add(this.target);
    this.light.target = this.target;

    this.scene.add(this.light);
  }

  updatePosition(modelPosition, modelRotation) {
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(modelRotation);

    const offsetVector = new THREE.Vector3(
      this.offset.x,
      this.offset.y,
      this.offset.z
    );
    offsetVector.applyMatrix4(rotationMatrix);

    const lightPosition = new THREE.Vector3(
      modelPosition.x + offsetVector.x,
      modelPosition.y + offsetVector.y,
      modelPosition.z + offsetVector.z
    );
    this.light.position.copy(lightPosition);
    if (this.helper) this.helper.position.copy(lightPosition);

    const targetDistance = 20;
    const targetOffset = new THREE.Vector3(-targetDistance, -5, 0);
    targetOffset.applyMatrix4(rotationMatrix);

    const targetPosition = new THREE.Vector3(
      modelPosition.x + targetOffset.x,
      modelPosition.y + targetOffset.y,
      modelPosition.z + targetOffset.z
    );

    this.target.position.copy(targetPosition);
  }

  setIntensity(value) {
    this.light.intensity = value * 2;
  }

  toggle(value) {
    this.isOn = value;
    this.light.visible = value;
    if (this.helper) this.helper.visible = value;
  }
}

// =============================== VISTA BEAM LIGHT ===============================
class VistaBeamLight extends StudioLight {
  constructor(scene, target = null) {
    super(scene, target);

    this.scene.remove(this.light);
    this.scene.remove(this.target);
    this.scene.remove(this.targetHelper);

    this.light = new THREE.SpotLight(0xffffff, 2);
    this.light.angle = Math.PI / 6;
    this.light.penumbra = 0.2;
    this.light.decay = 1;
    this.light.distance = 200;

    this.target = target || new THREE.Object3D();
    this.scene.add(this.target);
    this.light.target = this.target;

    this.scene.add(this.light);
  }

  updatePosition(modelPosition, modelRotation) {
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(modelRotation);

    const offsetVector = new THREE.Vector3(
      this.offset.x,
      this.offset.y,
      this.offset.z
    );
    offsetVector.applyMatrix4(rotationMatrix);

    const lightPosition = new THREE.Vector3(
      modelPosition.x + offsetVector.x,
      modelPosition.y + offsetVector.y,
      modelPosition.z + offsetVector.z
    );
    this.light.position.copy(lightPosition);
    if (this.helper) this.helper.position.copy(lightPosition);

    const targetDistance = 15;
    const angle = -Math.PI / 4 + (90 * Math.PI) / 180;
    const targetOffset = new THREE.Vector3(
      targetDistance * Math.cos(angle),
      -5,
      targetDistance * Math.sin(angle)
    );
    targetOffset.applyMatrix4(rotationMatrix);

    const targetPosition = new THREE.Vector3(
      modelPosition.x + targetOffset.x,
      modelPosition.y + targetOffset.y,
      modelPosition.z + targetOffset.z
    );

    this.target.position.copy(targetPosition);
  }

  setIntensity(value) {
    this.light.intensity = value * 2;
  }

  toggle(value) {
    this.isOn = value;
    this.light.visible = value;
    if (this.helper) this.helper.visible = value;
  }
}

export { StudioLight, UmbrellaLight, VistaBeamLight };
