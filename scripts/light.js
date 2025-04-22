import * as THREE from "https://cdn.skypack.dev/three@0.136.0/build/three.module.js";
import { RectAreaLightHelper } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/helpers/RectAreaLightHelper.js";

class StudioLight {
  constructor(scene, target = null) {
    this.scene = scene;
    this.isOn = true;

    // Offset for light position relative to model
    this.offset = {
      x: 0,
      y: 0, // Height to light fixture
      z: 0, // Offset forward to match light fixture position
    };

    // Create spotlight
    this.light = new THREE.SpotLight(0xffffff, 2);
    this.light.angle = Math.PI / 6; // Narrower angle for more focused beam
    this.light.penumbra = 0.3; // Softer edges
    this.light.decay = 1; // Less decay for better distance performance
    this.light.distance = 200; // Increased distance for higher position

    // Create target if none provided
    this.target = target || new THREE.Object3D();
    this.scene.add(this.target);
    this.light.target = this.target;

    // Add light to scene
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

  // Set the offset for where the light originates relative to the model
  setOffset(x, y, z) {
    this.offset.x = x;
    this.offset.y = y;
    this.offset.z = z;
  }

  updatePosition(modelPosition, modelRotation) {
    // Calculate the offset position based on model's rotation
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(modelRotation);

    const offsetVector = new THREE.Vector3(
      this.offset.x,
      this.offset.y,
      this.offset.z
    );
    offsetVector.applyMatrix4(rotationMatrix);

    // Position light at the offset from model position
    const lightPosition = new THREE.Vector3(
      modelPosition.x + offsetVector.x,
      modelPosition.y + offsetVector.y,
      modelPosition.z + offsetVector.z
    );
    this.light.position.copy(lightPosition);
    if (this.helper) this.helper.position.copy(lightPosition);

    // Calculate target position based on model's rotation
    const targetDistance = 20; // Distance to target point

    // Initial 45-degree rotation (-x, +z direction)
    const initialAngle = Math.PI / 4; // 45 degrees
    const targetOffset = new THREE.Vector3(
      -targetDistance * Math.cos(initialAngle), // -x component
      -10, // downward
      targetDistance * Math.cos(initialAngle) // +z component (positive for forward)
    );
    targetOffset.applyMatrix4(rotationMatrix); // Apply the model's rotation to the target offset

    const targetPosition = new THREE.Vector3(
      modelPosition.x + targetOffset.x,
      modelPosition.y + targetOffset.y,
      modelPosition.z + targetOffset.z
    );

    this.target.position.copy(targetPosition);
    if (this.targetHelper) this.targetHelper.position.copy(targetPosition);
  }
}

class UmbrellaStudioLight extends StudioLight {
  constructor(scene, target = null) {
    super(scene, target);

    // Remove the point light that was created in parent class
    this.scene.remove(this.light);

    // Create spotlight with umbrella characteristics
    this.light = new THREE.SpotLight(0xffffff, 1.5);
    this.light.angle = Math.PI / 2.5; // Very wide angle (about 72 degrees)
    this.light.penumbra = 0.8; // Very soft edges
    this.light.decay = 1.5;
    this.light.distance = 150;

    // Create target if none provided
    this.target = target || new THREE.Object3D();
    this.scene.add(this.target);
    this.light.target = this.target;

    // Add light to scene
    this.scene.add(this.light);
  }

  updatePosition(modelPosition, modelRotation) {
    // Calculate the offset position based on model's rotation
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(modelRotation);

    const offsetVector = new THREE.Vector3(
      this.offset.x,
      this.offset.y,
      this.offset.z
    );
    offsetVector.applyMatrix4(rotationMatrix);

    // Position light at the offset from model position
    const lightPosition = new THREE.Vector3(
      modelPosition.x + offsetVector.x,
      modelPosition.y + offsetVector.y,
      modelPosition.z + offsetVector.z
    );
    this.light.position.copy(lightPosition);
    if (this.helper) this.helper.position.copy(lightPosition);

    // Calculate target position: point slightly downward and 90 degrees left
    const targetDistance = 20;
    const targetOffset = new THREE.Vector3(
      -targetDistance, // x component for 90 degrees left (full negative x)
      -5, // downward
      0 // no z offset at 90 degrees
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

class VistaBeamLight extends StudioLight {
  constructor(scene, target = null) {
    super(scene, target);

    // Remove the spotlight that was created in parent class
    this.scene.remove(this.light);
    this.scene.remove(this.target);
    this.scene.remove(this.targetHelper);

    // Create spotlight with controlled angle
    this.light = new THREE.SpotLight(0xffffff, 2);
    this.light.angle = Math.PI / 6; // 22.5 degrees (45 degrees total spread)
    this.light.penumbra = 0.2;
    this.light.decay = 1;
    this.light.distance = 200;

    // Create target
    this.target = target || new THREE.Object3D();
    this.scene.add(this.target);
    this.light.target = this.target;

    // Add light to scene
    this.scene.add(this.light);
  }

  updatePosition(modelPosition, modelRotation) {
    // Calculate the offset position based on model's rotation
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(modelRotation);

    const offsetVector = new THREE.Vector3(
      this.offset.x,
      this.offset.y,
      this.offset.z
    );
    offsetVector.applyMatrix4(rotationMatrix);

    // Position light at the offset from model position
    const lightPosition = new THREE.Vector3(
      modelPosition.x + offsetVector.x,
      modelPosition.y + offsetVector.y,
      modelPosition.z + offsetVector.z
    );
    this.light.position.copy(lightPosition);
    if (this.helper) this.helper.position.copy(lightPosition);

    // Calculate target position to point the light in the correct direction
    const targetDistance = 15;
    const angle = -Math.PI / 4 + (90 * Math.PI) / 180; // Current 45° + 30° more to the right
    const targetOffset = new THREE.Vector3(
      targetDistance * Math.cos(angle), // Adjusted angle for more right rotation
      -5, // slightly downward
      targetDistance * Math.sin(angle) // Adjusted angle for more right rotation
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

export { StudioLight, UmbrellaStudioLight, VistaBeamLight };
