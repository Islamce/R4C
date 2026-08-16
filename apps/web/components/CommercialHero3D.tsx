"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function CommercialHero3D({
  project,
  progress,
}: {
  project: string;
  progress: number;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b2f43);
    scene.fog = new THREE.Fog(0x0b2f43, 12, 26);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(9, 7, 11);
    camera.lookAt(0, 2.6, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    element.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xc9eff4, 0x18323d, 2.4));
    const key = new THREE.DirectionalLight(0xffe1b6, 4.2);
    key.position.set(7, 12, 8);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.PointLight(0x21d0d6, 18, 18);
    rim.position.set(-6, 5, 3);
    scene.add(rim);

    const group = new THREE.Group();
    const facade = new THREE.MeshStandardMaterial({
      color: 0xc7b192,
      roughness: 0.62,
      metalness: 0.08,
    });
    const glass = new THREE.MeshStandardMaterial({
      color: 0x173e4f,
      roughness: 0.18,
      metalness: 0.55,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: 0x0796a5,
      roughness: 0.32,
      metalness: 0.25,
      emissive: 0x02363b,
      emissiveIntensity: 0.45,
    });
    const towers: Array<[number, number, number]> = [
      [-3.1, 5.8, 2.5],
      [0, 7.2, 2.9],
      [3.1, 6.4, 2.6],
    ];
    towers.forEach(([x, height, width], towerIndex) => {
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 2.7),
        facade,
      );
      tower.position.set(x, height / 2, towerIndex === 1 ? -0.35 : 0);
      tower.castShadow = true;
      tower.receiveShadow = true;
      group.add(tower);
      const floors = Math.round(height * 1.65);
      for (let floor = 0; floor < floors; floor += 1) {
        for (let column = 0; column < 3; column += 1) {
          const windowPanel = new THREE.Mesh(
            new THREE.BoxGeometry(0.38, 0.28, 0.05),
            floor < Math.round((floors * progress) / 100) ? accent : glass,
          );
          windowPanel.position.set(
            x - width / 2 + 0.48 + column * ((width - 0.96) / 2),
            0.55 + floor * ((height - 0.8) / floors),
            1.37,
          );
          group.add(windowPanel);
        }
      }
    });
    const podium = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.8, 3.5), facade);
    podium.position.y = 0.4;
    podium.castShadow = true;
    group.add(podium);
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(8.5, 64),
      new THREE.MeshStandardMaterial({ color: 0x153d4c, roughness: 0.9 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground, group);

    let pointerX = 0;
    let pointerY = 0;
    const onPointer = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.34;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.12;
    };
    element.addEventListener("pointermove", onPointer);
    const observer = new ResizeObserver(() => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    });
    observer.observe(element);
    let frame = 0;
    const animate = (time: number) => {
      group.rotation.y +=
        (pointerX + Math.sin(time * 0.00025) * 0.035 - group.rotation.y) *
        0.045;
      group.rotation.x += (pointerY - group.rotation.x) * 0.04;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("pointermove", onPointer);
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.domElement.remove();
    };
  }, [progress]);

  return (
    <div
      className="commercial-hero-3d"
      ref={host}
      role="img"
      aria-label={`Interactive 3D construction model for ${project}`}
    />
  );
}
