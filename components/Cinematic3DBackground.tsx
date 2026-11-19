"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Cinematic3DBackground() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // WebGL Renderer Setup
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
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Cinematic Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.5, 13);

    // Master Black Hole Pivot Group
    const blackHoleGroup = new THREE.Group();
    scene.add(blackHoleGroup);

    // --- 1. The Event Horizon (Pitch-black gravitational shadow) ---
    const horizonGeo = new THREE.SphereGeometry(2.1, 64, 64);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    const eventHorizon = new THREE.Mesh(horizonGeo, horizonMat);
    blackHoleGroup.add(eventHorizon);

    // Inner Photon Ring (Intense energy boundary where light orbits)
    const photonRingGeo = new THREE.TorusGeometry(2.14, 0.045, 32, 120);
    const photonRingMat = new THREE.MeshBasicMaterial({
      color: 0xf0abfc, // Radiant neon light
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const photonRing = new THREE.Mesh(photonRingGeo, photonRingMat);
    photonRing.rotation.x = Math.PI / 2;
    blackHoleGroup.add(photonRing);

    // --- 2. Gravitational Lensing Halo (Interstellar Warped Vertical Disk) ---
    // Warped ring around the shadow created by extreme spacetime bending
    const lensRingGeo = new THREE.TorusGeometry(2.4, 0.08, 32, 140);
    const lensRingMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7, // Brand Purple
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const lensRing = new THREE.Mesh(lensRingGeo, lensRingMat);
    blackHoleGroup.add(lensRing);

    const outerLensRingGeo = new THREE.TorusGeometry(2.8, 0.05, 32, 140);
    const outerLensRingMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed, // Violet
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const outerLensRing = new THREE.Mesh(outerLensRingGeo, outerLensRingMat);
    blackHoleGroup.add(outerLensRing);

    // --- 3. Swirling Accretion Disk (3,500 Keplerian vortex particles) ---
    const diskParticleCount = 3800;
    const diskPositions = new Float32Array(diskParticleCount * 3);
    const diskColors = new Float32Array(diskParticleCount * 3);
    const diskRadii = new Float32Array(diskParticleCount);
    const diskAngles = new Float32Array(diskParticleCount);
    const diskSpeeds = new Float32Array(diskParticleCount);
    const diskVerticals = new Float32Array(diskParticleCount);

    const colInner = new THREE.Color(0xf5d0fe); // White-violet hot inner boundary
    const colMid = new THREE.Color(0xa855f7);   // Website brand Purple
    const colOuter = new THREE.Color(0x6b21a8); // Deep interstellar violet
    const colCyan = new THREE.Color(0x38bdf8);  // Cyan relativistic jet highlight

    for (let i = 0; i < diskParticleCount; i++) {
      // Disk radial distribution: denser closer to event horizon
      const u = Math.random();
      const r = 2.25 + Math.pow(u, 1.8) * 6.5; // from 2.25 to ~8.75
      const angle = Math.random() * Math.PI * 2;
      const verticalSpread = (Math.random() - 0.5) * (0.12 + (r - 2.25) * 0.04);

      diskRadii[i] = r;
      diskAngles[i] = angle;
      // Keplerian velocity: inner particles orbit much faster than outer particles
      diskSpeeds[i] = (2.2 / Math.sqrt(r)) * 0.015;
      diskVerticals[i] = verticalSpread;

      // Color mapping from inner edge to outer edge
      const normR = (r - 2.25) / 6.5;
      const c = new THREE.Color();
      if (normR < 0.15) {
        c.lerpColors(colInner, colMid, normR / 0.15);
      } else if (normR < 0.6) {
        c.lerpColors(colMid, colOuter, (normR - 0.15) / 0.45);
      } else {
        c.lerpColors(colOuter, Math.random() < 0.15 ? colCyan : colMid, (normR - 0.6) / 0.4);
      }

      diskPositions[i * 3] = Math.cos(angle) * r;
      diskPositions[i * 3 + 1] = verticalSpread;
      diskPositions[i * 3 + 2] = Math.sin(angle) * r;

      diskColors[i * 3] = c.r;
      diskColors[i * 3 + 1] = c.g;
      diskColors[i * 3 + 2] = c.b;
    }

    const diskGeo = new THREE.BufferGeometry();
    diskGeo.setAttribute("position", new THREE.BufferAttribute(diskPositions, 3));
    diskGeo.setAttribute("color", new THREE.BufferAttribute(diskColors, 3));

    const diskMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const accretionDisk = new THREE.Points(diskGeo, diskMat);
    blackHoleGroup.add(accretionDisk);

    // --- 4. Relativistic Infalling Matter (Spiraling into the Abyss) ---
    const infallCount = 450;
    const infallPositions = new Float32Array(infallCount * 3);
    const infallColors = new Float32Array(infallCount * 3);
    const infallRadii = new Float32Array(infallCount);
    const infallAngles = new Float32Array(infallCount);
    const infallSpeeds = new Float32Array(infallCount);

    for (let i = 0; i < infallCount; i++) {
      infallRadii[i] = 2.2 + Math.random() * 5.0;
      infallAngles[i] = Math.random() * Math.PI * 2;
      infallSpeeds[i] = 0.008 + Math.random() * 0.015;

      infallPositions[i * 3] = Math.cos(infallAngles[i]) * infallRadii[i];
      infallPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      infallPositions[i * 3 + 2] = Math.sin(infallAngles[i]) * infallRadii[i];

      infallColors[i * 3] = colInner.r;
      infallColors[i * 3 + 1] = colInner.g;
      infallColors[i * 3 + 2] = colInner.b;
    }

    const infallGeo = new THREE.BufferGeometry();
    infallGeo.setAttribute("position", new THREE.BufferAttribute(infallPositions, 3));
    infallGeo.setAttribute("color", new THREE.BufferAttribute(infallColors, 3));

    const infallMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const infallParticles = new THREE.Points(infallGeo, infallMat);
    blackHoleGroup.add(infallParticles);

    // --- 5. Deep Space Gravitational Starfield (1,000 Distant Stars) ---
    const starCount = 1000;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const radius = 10 + Math.pow(u, 0.5) * 35;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const isPurple = Math.random() < 0.6;
      const c = isPurple ? colMid : Math.random() < 0.5 ? colCyan : colInner;
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // --- 6. Scroll & Mouse Tracking Variables ---
    let targetScrollProgress = 0;
    let currentScrollProgress = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleScroll = () => {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      targetScrollProgress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
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
    handleScroll();

    // Default tilt of the accretion disk (classic Interstellar angle)
    blackHoleGroup.rotation.x = 0.42;

    // --- Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smooth Lerping for cinematic inertia
      currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.05;
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      // --- Accretion Disk Keplerian Rotation ---
      const posAttr = diskGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      // Scroll speed booster (faster vortex when scrolling)
      const scrollSpeedBoost = 1 + Math.abs(targetScrollProgress - currentScrollProgress) * 12;

      for (let i = 0; i < diskParticleCount; i++) {
        diskAngles[i] += diskSpeeds[i] * scrollSpeedBoost;
        const r = diskRadii[i];
        posArray[i * 3] = Math.cos(diskAngles[i]) * r;
        posArray[i * 3 + 2] = Math.sin(diskAngles[i]) * r;
      }
      posAttr.needsUpdate = true;

      // --- Infalling Matter Simulation ---
      const infallAttr = infallGeo.attributes.position as THREE.BufferAttribute;
      const infallArray = infallAttr.array as Float32Array;

      for (let i = 0; i < infallCount; i++) {
        // Spiral inwards towards the event horizon
        infallAngles[i] += infallSpeeds[i] * 1.5;
        infallRadii[i] -= 0.007 * (1 + 2.5 / infallRadii[i]);

        // If swallowed by event horizon, respawn at outer boundary
        if (infallRadii[i] < 2.12) {
          infallRadii[i] = 6.8 + Math.random() * 1.5;
          infallAngles[i] = Math.random() * Math.PI * 2;
        }

        infallArray[i * 3] = Math.cos(infallAngles[i]) * infallRadii[i];
        infallArray[i * 3 + 2] = Math.sin(infallAngles[i]) * infallRadii[i];
      }
      infallAttr.needsUpdate = true;

      // --- Gravitational Lensing Wavelength Wobble & Photon Ring Pulse ---
      lensRing.rotation.y = currentScrollProgress * Math.PI * 1.2;
      outerLensRing.rotation.x = Math.PI / 2 + Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
      photonRing.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 1.8) * 0.015);

      // --- Cinematic Scroll Choreography ---
      // Progression across page sections:
      // Home: Majestic Interstellar angle (tilted ~25°), centered
      // About & Roms: Camera sweeps laterally, Black Hole tilts to reveal edge-on disk
      // Projects: Dramatic top-down vortex perspective
      // Notes & Contact: Smooth cosmic backdrop drift
      const scrollAngleX = 0.42 + Math.sin(currentScrollProgress * Math.PI) * 0.55;
      const scrollAngleY = currentScrollProgress * Math.PI * 1.6;

      blackHoleGroup.rotation.x = scrollAngleX + currentMouseY * 0.25;
      blackHoleGroup.rotation.y = scrollAngleY + currentMouseX * 0.35;
      blackHoleGroup.rotation.z = Math.sin(currentScrollProgress * Math.PI * 2) * 0.18;

      // Lateral drift across screen
      blackHoleGroup.position.x =
        Math.sin(currentScrollProgress * Math.PI * 2) * 2.2 + currentMouseX * 0.6;
      blackHoleGroup.position.y =
        -currentScrollProgress * 1.8 + Math.sin(clock.getElapsedTime() * 0.7) * 0.1;

      // Camera distance and altitude
      camera.position.z =
        13 - Math.sin(currentScrollProgress * Math.PI) * 3.5 + currentScrollProgress * 1.5;
      camera.position.y = 2.5 - currentScrollProgress * 1.5 + currentMouseY * 0.4;
      camera.position.x = currentMouseX * 0.5;
      camera.lookAt(
        blackHoleGroup.position.x * 0.3,
        blackHoleGroup.position.y * 0.5,
        0
      );

      // Starfield subtle cosmic parallax
      starField.rotation.y = clock.getElapsedTime() * 0.015 + currentScrollProgress * 0.4;

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
      horizonGeo.dispose();
      horizonMat.dispose();
      photonRingGeo.dispose();
      photonRingMat.dispose();
      lensRingGeo.dispose();
      lensRingMat.dispose();
      outerLensRingGeo.dispose();
      outerLensRingMat.dispose();
      diskGeo.dispose();
      diskMat.dispose();
      infallGeo.dispose();
      infallMat.dispose();
      starGeo.dispose();
      starMat.dispose();
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
