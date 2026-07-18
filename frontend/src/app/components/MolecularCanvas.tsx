'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function MolecularCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 24);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 2. DNA Helix / Ambient Molecular Nodes (Shifted to background margin)
    const helixGroup = new THREE.Group();
    // Shifted to the right margin to prevent text overlap
    helixGroup.position.set(9, 0, -5);
    scene.add(helixGroup);

    const particleCount = 50;
    const sphereGeo = new THREE.SphereGeometry(0.14, 14, 14);
    const cyanMat = new THREE.MeshPhongMaterial({
      color: 0x0284c7, // Sky 600
      emissive: 0x0369a1,
      emissiveIntensity: 0.3,
      shininess: 90,
    });
    const emeraldMat = new THREE.MeshPhongMaterial({
      color: 0x059669, // Emerald 600
      emissive: 0x047857,
      emissiveIntensity: 0.3,
      shininess: 80,
    });

    // Construct DNA Double Helix
    for (let i = 0; i < particleCount; i++) {
      const t = (i / particleCount) * Math.PI * 6;
      const radius = 3.2;
      
      // Strand 1
      const x1 = Math.cos(t) * radius;
      const y1 = (i - particleCount / 2) * 0.45;
      const z1 = Math.sin(t) * radius;
      const pos1 = new THREE.Vector3(x1, y1, z1);

      const m1 = new THREE.Mesh(sphereGeo, cyanMat);
      m1.position.copy(pos1);
      helixGroup.add(m1);

      // Strand 2
      const x2 = Math.cos(t + Math.PI) * radius;
      const y2 = (i - particleCount / 2) * 0.45;
      const z2 = Math.sin(t + Math.PI) * radius;
      const pos2 = new THREE.Vector3(x2, y2, z2);

      const m2 = new THREE.Mesh(sphereGeo, emeraldMat);
      m2.position.copy(pos2);
      helixGroup.add(m2);

      // Connecting rungs every 3 steps
      if (i % 3 === 0) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([pos1, pos2]);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.25,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        helixGroup.add(line);
      }
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x0284c7, 2, 40);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Scroll & Mouse state
    let targetRotationY = 0;
    let scrollY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetRotationY = (e.clientX / window.innerWidth - 0.5) * 0.3;
    };

    const handleScroll = () => {
      scrollY = window.scrollY || window.pageYOffset;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Continuous rotation
      helixGroup.rotation.y += 0.006;
      helixGroup.rotation.x = Math.sin(Date.now() * 0.0005) * 0.08;

      // Scroll interaction: Helix shifts upward and rotates smoothly on scroll
      const scrollFactor = scrollY * 0.0012;
      helixGroup.position.y = -scrollFactor * 2.5;
      helixGroup.rotation.y += targetRotationY * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      sphereGeo.dispose();
      cyanMat.dispose();
      emeraldMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.3, // Subtle, clean background accent
      }}
    />
  );
}
