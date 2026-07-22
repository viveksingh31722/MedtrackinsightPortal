'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeHeroViewport() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 12.5);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 4. Main 3D Molecule Object Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Central Core Molecule Sphere
    const coreGeometry = new THREE.IcosahedronGeometry(2.6, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x0284c7, // Sky 600
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    mainGroup.add(coreMesh);

    // Inner Solid Sphere
    const innerGeo = new THREE.SphereGeometry(1.6, 24, 24);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x059669, // Emerald 600
      roughness: 0.2,
      metalness: 0.8,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    mainGroup.add(innerMesh);

    // 3D Orbital Target Rings
    const createRing = (radius: number, color: number, rotX: number, rotY: number) => {
      const ringGeo = new THREE.TorusGeometry(radius, 0.05, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({ color, wireframe: false, transparent: true, opacity: 0.75 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = rotX;
      ringMesh.rotation.y = rotY;
      return ringMesh;
    };

    const ring1 = createRing(3.8, 0x0284c7, Math.PI / 3, Math.PI / 6);
    const ring2 = createRing(4.8, 0x059669, -Math.PI / 4, Math.PI / 3);
    const ring3 = createRing(5.8, 0x0891b2, Math.PI / 2, 0);

    mainGroup.add(ring1);
    mainGroup.add(ring2);
    mainGroup.add(ring3);

    // Orbiting Atom Nodes
    const atomGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const atomMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, shininess: 100 });
    const atomCount = 12;
    const atoms: THREE.Mesh[] = [];

    for (let i = 0; i < atomCount; i++) {
      const atom = new THREE.Mesh(atomGeo, atomMat);
      const angle = (i / atomCount) * Math.PI * 2;
      atom.position.set(Math.cos(angle) * 3.8, Math.sin(angle) * 3.8, 0);
      ring1.add(atom);
      atoms.push(atom);
    }

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x0284c7, 2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x059669, 1.5);
    dirLight2.position.set(-5, -10, -5);
    scene.add(dirLight2);

    // 6. Interaction & Scroll Physics
    let targetMouseX = 0;
    let targetMouseY = 0;
    let scrollY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / width - 0.5;
      const y = (e.clientY - rect.top) / height - 0.5;
      targetMouseX = x * 0.8;
      targetMouseY = y * 0.8;
    };

    const handleScroll = () => {
      scrollY = window.scrollY || window.pageYOffset;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Continuous 3D rotations
      mainGroup.rotation.y += 0.008;
      mainGroup.rotation.x += 0.004;
      ring1.rotation.z += 0.01;
      ring2.rotation.z -= 0.008;
      ring3.rotation.x += 0.005;

      // Mouse tilt reaction
      mainGroup.rotation.y += (targetMouseX - mainGroup.rotation.y) * 0.05;
      mainGroup.rotation.x += (targetMouseY - mainGroup.rotation.x) * 0.05;

      // Scroll physics: 3D scale and zoom dynamically react to scrolling
      const scrollFactor = scrollY * 0.002;
      const scale = 1 + Math.sin(scrollFactor) * 0.15;
      mainGroup.scale.set(scale, scale, scale);
      camera.position.z = 14 + scrollFactor * 3;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      coreGeometry.dispose();
      coreMaterial.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '350px',
        position: 'relative',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
      }}
    />
  );
}
