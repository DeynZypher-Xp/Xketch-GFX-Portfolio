"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Cinematic3DBackground() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Perspective Camera for true 3D spatial depth & parallax
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 10);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // --- 1. Load the Exact Gargantua Black Hole Texture ---
    const loader = new THREE.TextureLoader();
    const texture = loader.load("/blackhole-purple.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
    });

    // Mesh sized to match aspect ratio (1024 x 576 -> 16:9)
    const planeGeo = new THREE.PlaneGeometry(10.2, 5.74);
    const planeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const blackHoleMesh = new THREE.Mesh(planeGeo, planeMat);
    masterGroup.add(blackHoleMesh);

    // --- 2. Ambient Radiant Purple Bloom Layer (Soft Glow Behind Black Hole) ---
    const glowGeo = new THREE.PlaneGeometry(14, 8);
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const ctx = glowCanvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      grad.addColorStop(0, "rgba(168, 85, 247, 0.45)"); // Brand Purple
      grad.addColorStop(0.4, "rgba(124, 58, 237, 0.25)"); // Violet
      grad.addColorStop(0.7, "rgba(217, 70, 239, 0.12)"); // Fuchsia
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.8,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.set(1.5, 0.2, -0.2); // Positioned behind the black hole shadow
    masterGroup.add(glowMesh);

    // --- 3. Swirling 3D Relativistic Orbiting Particles ---
    // 800 physical 3D space particles swirling in a vortex around the black hole plane
    const particleCount = 850;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const radii = new Float32Array(particleCount);
    const angles = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const zHeights = new Float32Array(particleCount);

    const cWhite = new THREE.Color(0xf5d0fe);
    const cPurple = new THREE.Color(0xa855f7);
    const cCyan = new THREE.Color(0x38bdf8);

    for (let i = 0; i < particleCount; i++) {
      const r = 2.0 + Math.pow(Math.random(), 1.5) * 6.5;
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.8 / Math.sqrt(r)) * 0.012;
      const z = (Math.random() - 0.5) * 1.8;

      radii[i] = r;
      angles[i] = angle;
      speeds[i] = speed;
      zHeights[i] = z;

      positions[i * 3] = 1.2 + Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * (r * 0.42);
      positions[i * 3 + 2] = z;

      const pick = Math.random();
      const col = pick < 0.6 ? cPurple : pick < 0.85 ? cCyan : cWhite;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    masterGroup.add(particles);

    // --- 4. Deep Space Starfield (1,200 Distant Stars) ---
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 45;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 45;
      starPositions[i * 3 + 2] = -5 - Math.random() * 25;

      const isPurple = Math.random() < 0.5;
      const c = isPurple ? cPurple : Math.random() < 0.5 ? cCyan : cWhite;
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // --- State & Interaction Variables ---
    let targetScroll = 0;
    let currentScroll = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleScroll = () => {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      targetScroll = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
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

      // Responsive scale for mobile vs desktop
      if (width < 768) {
        masterGroup.scale.setScalar(0.72);
      } else {
        masterGroup.scale.setScalar(1.0);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);
    handleScroll();
    handleResize();

    // --- Animation Loop ---
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth inertia lerp for scroll and cursor
      currentScroll += (targetScroll - currentScroll) * 0.05;
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      // Rotate orbiting relativistic particles
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const scrollBoost = 1 + Math.abs(targetScroll - currentScroll) * 8;

      for (let i = 0; i < particleCount; i++) {
        angles[i] += speeds[i] * scrollBoost;
        const r = radii[i];
        posArray[i * 3] = 1.2 + Math.cos(angles[i]) * r;
        posArray[i * 3 + 1] = Math.sin(angles[i]) * (r * 0.42);
      }
      posAttr.needsUpdate = true;

      // Subtle breathing pulse on the radiant purple bloom
      glowMesh.scale.setScalar(1 + Math.sin(elapsedTime * 1.5) * 0.04);

      // --- 3D Spatial Tilt & Cinematic Scroll Trajectory ---
      // 1. Mouse 3D Parallax Tilt
      masterGroup.rotation.y = currentMouseX * 0.18 + currentScroll * 0.25;
      masterGroup.rotation.x = -currentMouseY * 0.12 - currentScroll * 0.15;
      masterGroup.rotation.z = Math.sin(currentScroll * Math.PI) * 0.05;

      // 2. Cinematic Lateral Drift & Scale
      masterGroup.position.x =
        Math.sin(currentScroll * Math.PI * 1.8) * 1.2 + currentMouseX * 0.4;
      masterGroup.position.y =
        -currentScroll * 1.2 + Math.cos(elapsedTime * 0.8) * 0.08 + currentMouseY * 0.3;

      // 3. Camera Depth & Parallax
      camera.position.z = 10 - Math.sin(currentScroll * Math.PI) * 1.8;
      camera.position.x = currentMouseX * 0.35;
      camera.position.y = currentMouseY * 0.25;
      camera.lookAt(masterGroup.position.x * 0.3, masterGroup.position.y * 0.3, 0);

      // Distant stars slow drift
      stars.rotation.y = elapsedTime * 0.01 + currentScroll * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      planeGeo.dispose();
      planeMat.dispose();
      texture.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      glowTexture.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      starGeo.dispose();
      starMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-20 pointer-events-none overflow-hidden"
      aria-hidden="true"
    />
  );
}
