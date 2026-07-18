'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeScrollCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    
    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 18);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 4. Main 3D Scroll Object Group (Positioned strictly below hero section)
    const scrollGroup = new THREE.Group();
    scrollGroup.position.set(7.5, -4, -2); // Positioned lower so it rests below hero
    scene.add(scrollGroup);

    // Core Molecule Geometry & Materials
    const sphereGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const cyanMat = new THREE.MeshPhongMaterial({
      color: 0x0891b2, // Cyan 600
      emissive: 0x0e7490,
      emissiveIntensity: 0.35,
      shininess: 90,
    });
    const emeraldMat = new THREE.MeshPhongMaterial({
      color: 0x059669, // Emerald 600
      emissive: 0x047857,
      emissiveIntensity: 0.35,
      shininess: 80,
    });

    // Create 3D Floating Particle Lattice
    const nodeCount = 45;
    const nodes: THREE.Mesh[] = [];
    const initialPositions: THREE.Vector3[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const mesh = new THREE.Mesh(sphereGeo, i % 2 === 0 ? cyanMat : emeraldMat);
      
      const radius = 3.5 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = (i - nodeCount / 2) * 0.35;
      const z = radius * Math.cos(phi);

      const pos = new THREE.Vector3(x, y, z);
      mesh.position.copy(pos);
      scrollGroup.add(mesh);

      nodes.push(mesh);
      initialPositions.push(pos.clone());
    }

    // 3D Orbital Target Rings
    const ringGeo1 = new THREE.TorusGeometry(3.5, 0.04, 16, 80);
    const ringGeo2 = new THREE.TorusGeometry(4.4, 0.03, 16, 80);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.45 });
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x059669, transparent: true, opacity: 0.45 });

    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    scrollGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    scrollGroup.add(ring2);

    // 5. Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x0891b2, 2.2, 40);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x059669, 2, 40);
    pointLight2.position.set(-10, -10, -5);
    scene.add(pointLight2);

    // 6. Scroll & Mouse Tracking
    let scrollProgress = 0;
    let targetMouseX = 0;
    let currentScrollY = 0;

    const handleScroll = () => {
      currentScrollY = window.scrollY || window.pageYOffset;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        scrollProgress = Math.min(1, Math.max(0, currentScrollY / totalHeight));
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    handleScroll(); // Initial check

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop with Strict Scroll Threshold Opacity
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Fade canvas opacity based on scrollY threshold:
      // Completely INVISIBLE (0) when in hero section (scrollY <= 180px)
      // Smoothly fades in to 0.55 as user scrolls into post-hero section (180px - 450px)
      let targetOpacity = 0;
      if (currentScrollY > 180) {
        targetOpacity = Math.min(0.55, ((currentScrollY - 180) / 270) * 0.55);
      }
      container.style.opacity = targetOpacity.toString();

      // Continuous subtle ambient rotation
      scrollGroup.rotation.y += 0.006;
      ring1.rotation.z += 0.009;
      ring2.rotation.z -= 0.007;

      // Scroll-driven 3D rotation, tilt, and vertical movement
      const scrollRotation = scrollProgress * Math.PI * 4;
      const scrollYOffset = -2.5 - scrollProgress * 10;
      const cameraZ = 18 - Math.sin(scrollProgress * Math.PI) * 3;

      scrollGroup.rotation.y = scrollRotation + targetMouseX;
      scrollGroup.rotation.x = Math.sin(scrollProgress * Math.PI * 2) * 0.35;
      scrollGroup.position.y = scrollYOffset;
      camera.position.z = cameraZ;

      // Dynamic Node Dispersion on Scroll
      nodes.forEach((node, idx) => {
        const initial = initialPositions[idx];
        const factor = 1 + Math.sin(scrollProgress * Math.PI * 3 + idx) * 0.35;
        node.position.x = initial.x * factor;
        node.position.z = initial.z * factor;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      sphereGeo.dispose();
      cyanMat.dispose();
      emeraldMat.dispose();
      ringGeo1.dispose();
      ringGeo2.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
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
        opacity: 0, // Starts at 0; fades in strictly after hero section
        transition: 'opacity 0.2s ease-out',
      }}
    />
  );
}
