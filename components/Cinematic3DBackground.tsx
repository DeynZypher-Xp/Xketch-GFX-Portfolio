"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Cinematic3DBackground() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check for WebGL support
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Cinematic Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 14);

    // Main 3D Anchor Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // --- 1. Architectural Geometric Core (Nested Icosahedrons) ---
    const coreGeo = new THREE.IcosahedronGeometry(2.4, 2);
    const coreWireframe = new THREE.WireframeGeometry(coreGeo);
    const coreMat = new THREE.LineBasicMaterial({
      color: 0xa855f7, // Purple 500
      transparent: true,
      opacity: 0.65,
    });
    const coreLines = new THREE.LineSegments(coreWireframe, coreMat);
    masterGroup.add(coreLines);

    // Inner Glowing Core (Cyan accent)
    const innerGeo = new THREE.OctahedronGeometry(1.2, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Sky 400
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    masterGroup.add(innerCore);

    // --- 2. Floating Orbital Rings ---
    const ringGeo1 = new THREE.TorusGeometry(3.6, 0.025, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xd946ef, // Fuchsia 500
      transparent: true,
      opacity: 0.5,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    masterGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(4.4, 0.02, 16, 120);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x818cf8, // Indigo 400
      transparent: true,
      opacity: 0.35,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    masterGroup.add(ring2);

    // --- 3. Floating Architectural Grid Floor ---
    const gridHelper = new THREE.GridHelper(30, 30, 0xa855f7, 0x312e81);
    gridHelper.position.y = -4.5;
    if (Array.isArray(gridHelper.material)) {
      gridHelper.material.forEach((m) => {
        m.transparent = true;
        m.opacity = 0.2;
      });
    } else {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.2;
    }
    masterGroup.add(gridHelper);

    // --- 4. Deep Space Particle Dust Field ---
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0xa855f7); // Purple
    const color2 = new THREE.Color(0x38bdf8); // Cyan
    const color3 = new THREE.Color(0xe879f9); // Pink

    for (let i = 0; i < particleCount; i++) {
      // Cylindrical distribution around camera track
      const theta = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 15;
      const depth = (Math.random() - 0.5) * 40;

      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.sin(theta) * radius;
      positions[i * 3 + 2] = depth;

      const mixed = Math.random() < 0.5 ? color1 : Math.random() < 0.5 ? color2 : color3;
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- 5. Satellite Geometric Fragments ---
    const fragments: THREE.Mesh[] = [];
    const fragGeo = new THREE.TetrahedronGeometry(0.35, 0);
    const fragMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });

    for (let i = 0; i < 18; i++) {
      const frag = new THREE.Mesh(fragGeo, fragMat);
      frag.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16
      );
      frag.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      masterGroup.add(frag);
      fragments.push(frag);
    }

    // --- State & Interaction Variables ---
    let scrollY = window.scrollY;
    let targetScrollProgress = 0;
    let currentScrollProgress = 0;

    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleScroll = () => {
      scrollY = window.scrollY;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      targetScrollProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);

    // Trigger initial scroll calculation
    handleScroll();

    // --- Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth Lerping for cinematic feel (heavyweight, smooth inertia)
      currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.055;
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      // Base Ambient Idle Rotations
      coreLines.rotation.x = elapsedTime * 0.12;
      coreLines.rotation.y = elapsedTime * 0.18;
      innerCore.rotation.x = -elapsedTime * 0.2;
      innerCore.rotation.z = elapsedTime * 0.15;

      ring1.rotation.z = elapsedTime * 0.15;
      ring2.rotation.x = -elapsedTime * 0.12;

      // Rotate fragments
      fragments.forEach((frag, idx) => {
        frag.rotation.x += 0.005 * (idx % 2 === 0 ? 1 : -1);
        frag.rotation.y += 0.008 * (idx % 3 === 0 ? 1 : -1);
      });

      // --- Cinematic Scroll Trajectory & Choreography ---
      // 1. Move master geometry dynamically across sections
      // Top (Home): Center, scale 1.1
      // Middle (About/Roms/Projects): Shifts laterally, tilts dynamically
      // Notes/Contact: Expands and moves slightly into background
      const angle = currentScrollProgress * Math.PI * 2.8;
      masterGroup.rotation.y = angle * 0.8 + currentMouseX * 0.35;
      masterGroup.rotation.x =
        Math.sin(currentScrollProgress * Math.PI * 1.5) * 0.45 +
        currentMouseY * 0.25;
      masterGroup.rotation.z = Math.cos(angle * 0.5) * 0.2;

      // Lateral drift based on scroll
      masterGroup.position.x =
        Math.sin(currentScrollProgress * Math.PI * 2.2) * 2.8 +
        currentMouseX * 0.8;
      masterGroup.position.y =
        -currentScrollProgress * 3.5 + Math.cos(elapsedTime * 0.8) * 0.15;

      // Camera distance and subtle focal depth zoom
      camera.position.z =
        14 -
        Math.sin(currentScrollProgress * Math.PI) * 4.2 +
        currentScrollProgress * 2.5;
      camera.position.y = currentScrollProgress * 1.2 + currentMouseY * 0.4;
      camera.position.x = currentMouseX * 0.6;
      camera.lookAt(0, -currentScrollProgress * 1.2, 0);

      // Particle Field reacts to scroll speed (warp drift)
      particles.rotation.y = elapsedTime * 0.04 + currentScrollProgress * 0.8;
      particles.rotation.x = currentScrollProgress * 0.4;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      // Cleanup GPU resources
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreWireframe.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      gridHelper.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      fragGeo.dispose();
      fragMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden transition-opacity duration-1000"
      aria-hidden="true"
    />
  );
}
