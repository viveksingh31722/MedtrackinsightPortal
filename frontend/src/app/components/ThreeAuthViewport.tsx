'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeAuthViewport() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    
    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 16);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 4. Main 3D Helix & Target Group
    const helixGroup = new THREE.Group();
    scene.add(helixGroup);

    // Geometry & Materials
    const sphereGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const cylinderGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);

    const cyanMat = new THREE.MeshPhongMaterial({
      color: 0x0284c7, // Sky Primary
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
      shininess: 90,
    });

    const emeraldMat = new THREE.MeshPhongMaterial({
      color: 0x059669, // Emerald Accent
      emissive: 0x047857,
      emissiveIntensity: 0.35,
      shininess: 80,
    });

    const rodMat = new THREE.MeshBasicMaterial({
      color: 0xcbd5e1,
      transparent: true,
      opacity: 0.5,
    });

    // Construct 3D DNA Double-Helix Structure
    const basePairs = 22;
    const helixRadius = 2.4;
    const strandSpacing = 0.45;

    for (let i = 0; i < basePairs; i++) {
      const t = (i - basePairs / 2) * strandSpacing;
      const angle = i * 0.45;

      // Strand 1 Node
      const x1 = Math.cos(angle) * helixRadius;
      const z1 = Math.sin(angle) * helixRadius;
      const mesh1 = new THREE.Mesh(sphereGeo, cyanMat);
      mesh1.position.set(x1, t, z1);
      helixGroup.add(mesh1);

      // Strand 2 Node (180 deg offset)
      const x2 = Math.cos(angle + Math.PI) * helixRadius;
      const z2 = Math.sin(angle + Math.PI) * helixRadius;
      const mesh2 = new THREE.Mesh(sphereGeo, emeraldMat);
      mesh2.position.set(x2, t, z2);
      helixGroup.add(mesh2);

      // Connecting Base Pair Rod
      const rod = new THREE.Mesh(cylinderGeo, rodMat);
      rod.position.set(0, t, 0);
      rod.scale.set(1, Math.sqrt((x1 - x2) ** 2 + (z1 - z2) ** 2), 1);
      rod.rotation.z = Math.PI / 2;
      rod.rotation.y = -angle;
      helixGroup.add(rod);
    }

    // 3D Orbital Target Rings around Helix
    const ringGeo = new THREE.TorusGeometry(3.6, 0.035, 16, 80);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    helixGroup.add(ring);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x0284c7, 2, 30);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x059669, 1.8, 30);
    pointLight2.position.set(-10, -10, -5);
    scene.add(pointLight2);

    // 6. Interactive Mouse Physics
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 0.8;
      targetY = y * 0.6;
    };

    container.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth 3D rotation & spring physics
      helixGroup.rotation.y += 0.012;
      ring.rotation.z += 0.008;

      helixGroup.rotation.x += (targetY - helixGroup.rotation.x) * 0.05;
      helixGroup.rotation.z += (-targetX - helixGroup.rotation.z) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      sphereGeo.dispose();
      cylinderGeo.dispose();
      cyanMat.dispose();
      emeraldMat.dispose();
      rodMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '460px',
        position: 'relative',
        cursor: 'grab',
      }}
    />
  );
}
