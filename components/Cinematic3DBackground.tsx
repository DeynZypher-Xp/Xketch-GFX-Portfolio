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

    // 3D Perspective Camera for immersive spatial depth
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.5, 12);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Initial cinematic tilt (similar to Interstellar angle)
    masterGroup.rotation.x = 0.42;

    // --- Generate Circular Soft Radial Glow Sprite for Particles ---
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const ctx = spriteCanvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.25, "rgba(235, 200, 255, 0.85)");
      grad.addColorStop(0.55, "rgba(168, 85, 247, 0.45)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(spriteCanvas);

    // --- 1. The Physical Event Horizon (Pitch-Black Central Singularity) ---
    // Pure black 3D sphere that genuinely occludes light behind it
    const sphereGeo = new THREE.SphereGeometry(1.65, 64, 64);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const singularity = new THREE.Mesh(sphereGeo, sphereMat);
    masterGroup.add(singularity);

    // --- 2. Razor-Sharp Inner Photon Ring ---
    const photonRingCount = 380;
    const photonRingGeo = new THREE.BufferGeometry();
    const photonPos = new Float32Array(photonRingCount * 3);
    const photonCol = new Float32Array(photonRingCount * 3);

    const cWhite = new THREE.Color(0xffffff);
    const cLavender = new THREE.Color(0xf5d0fe);

    for (let i = 0; i < photonRingCount; i++) {
      const theta = (i / photonRingCount) * Math.PI * 2;
      const r = 1.68 + (Math.random() - 0.5) * 0.04;
      photonPos[i * 3] = Math.cos(theta) * r;
      photonPos[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      photonPos[i * 3 + 2] = Math.sin(theta) * r;

      const c = Math.random() < 0.6 ? cWhite : cLavender;
      photonCol[i * 3] = c.r;
      photonCol[i * 3 + 1] = c.g;
      photonCol[i * 3 + 2] = c.b;
    }

    photonRingGeo.setAttribute("position", new THREE.BufferAttribute(photonPos, 3));
    photonRingGeo.setAttribute("color", new THREE.BufferAttribute(photonCol, 3));

    const photonMat = new THREE.PointsMaterial({
      size: 0.08,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const photonRing = new THREE.Points(photonRingGeo, photonMat);
    masterGroup.add(photonRing);

    // --- 3. Swirling 3D Accretion Disk (3,200 Luminous Vortex Particles) ---
    const diskCount = 3400;
    const diskGeo = new THREE.BufferGeometry();
    const diskPos = new Float32Array(diskCount * 3);
    const diskCol = new Float32Array(diskCount * 3);
    const diskRadii = new Float32Array(diskCount);
    const diskAngles = new Float32Array(diskCount);
    const diskSpeeds = new Float32Array(diskCount);
    const diskVerticals = new Float32Array(diskCount);

    const cBrandPurple = new THREE.Color(0xa855f7); // Signature #a855f7
    const cFuchsia = new THREE.Color(0xd946ef);     // Fuchsia #d946ef
    const cViolet = new THREE.Color(0x7c3aed);      // Deep violet #7c3aed
    const cCyan = new THREE.Color(0x38bdf8);        // Relativistic cyan #38bdf8

    for (let i = 0; i < diskCount; i++) {
      const u = Math.random();
      // Dense near event horizon, spreading outward to 7.8 units
      const r = 1.75 + Math.pow(u, 1.6) * 6.2;
      const angle = Math.random() * Math.PI * 2;
      const vertical = (Math.random() - 0.5) * (0.08 + (r - 1.75) * 0.045);

      diskRadii[i] = r;
      diskAngles[i] = angle;
      // Keplerian physics: inner particles orbit much faster than outer particles
      diskSpeeds[i] = (2.4 / Math.sqrt(r)) * 0.012;
      diskVerticals[i] = vertical;

      diskPos[i * 3] = Math.cos(angle) * r;
      diskPos[i * 3 + 1] = vertical;
      diskPos[i * 3 + 2] = Math.sin(angle) * r;

      // Color gradient from inner hot edge to deep outer space
      const normR = (r - 1.75) / 6.2;
      const c = new THREE.Color();
      if (normR < 0.15) {
        c.lerpColors(cWhite, cFuchsia, normR / 0.15);
      } else if (normR < 0.6) {
        c.lerpColors(cFuchsia, cBrandPurple, (normR - 0.15) / 0.45);
      } else {
        c.lerpColors(cBrandPurple, Math.random() < 0.2 ? cCyan : cViolet, (normR - 0.6) / 0.4);
      }

      diskCol[i * 3] = c.r;
      diskCol[i * 3 + 1] = c.g;
      diskCol[i * 3 + 2] = c.b;
    }

    diskGeo.setAttribute("position", new THREE.BufferAttribute(diskPos, 3));
    diskGeo.setAttribute("color", new THREE.BufferAttribute(diskCol, 3));

    const diskMat = new THREE.PointsMaterial({
      size: 0.065,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const accretionDisk = new THREE.Points(diskGeo, diskMat);
    masterGroup.add(accretionDisk);

    // --- 4. Gravitational Lensing Arches (Warped Upper & Lower Particle Streams) ---
    // Simulates light bent by gravitational spacetime over the top and beneath the shadow
    const lensCount = 1400;
    const lensGeo = new THREE.BufferGeometry();
    const lensPos = new Float32Array(lensCount * 3);
    const lensCol = new Float32Array(lensCount * 3);

    for (let i = 0; i < lensCount; i++) {
      const isTopArch = Math.random() < 0.65;
      const theta = (Math.random() - 0.5) * Math.PI * 0.95; // Arc span
      const r = 1.9 + Math.random() * 2.5;

      if (isTopArch) {
        // Upper arch wrapping over the sphere
        lensPos[i * 3] = Math.sin(theta) * (r * 1.35) - 0.4; // Slightly broadened to the left
        lensPos[i * 3 + 1] = Math.cos(theta) * (r * 0.85) + 0.2;
        lensPos[i * 3 + 2] = -0.3 + (Math.random() - 0.5) * 0.4; // Behind sphere
      } else {
        // Lower crescent underneath
        lensPos[i * 3] = Math.sin(theta) * (r * 1.1) + 0.2;
        lensPos[i * 3 + 1] = -Math.cos(theta) * (r * 0.75) - 0.3;
        lensPos[i * 3 + 2] = -0.3 + (Math.random() - 0.5) * 0.4;
      }

      const c = isTopArch
        ? Math.random() < 0.4 ? cFuchsia : cBrandPurple
        : cViolet;
      lensCol[i * 3] = c.r;
      lensCol[i * 3 + 1] = c.g;
      lensCol[i * 3 + 2] = c.b;
    }

    lensGeo.setAttribute("position", new THREE.BufferAttribute(lensPos, 3));
    lensGeo.setAttribute("color", new THREE.BufferAttribute(lensCol, 3));

    const lensMat = new THREE.PointsMaterial({
      size: 0.055,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lensingArches = new THREE.Points(lensGeo, lensMat);
    masterGroup.add(lensingArches);

    // --- 5. Relativistic Infalling Matter (Particles Swirling into the Abyss) ---
    const infallCount = 350;
    const infallGeo = new THREE.BufferGeometry();
    const infallPos = new Float32Array(infallCount * 3);
    const infallCol = new Float32Array(infallCount * 3);
    const infallRadii = new Float32Array(infallCount);
    const infallAngles = new Float32Array(infallCount);
    const infallSpeeds = new Float32Array(infallCount);

    for (let i = 0; i < infallCount; i++) {
      infallRadii[i] = 1.7 + Math.random() * 4.5;
      infallAngles[i] = Math.random() * Math.PI * 2;
      infallSpeeds[i] = 0.012 + Math.random() * 0.02;

      infallPos[i * 3] = Math.cos(infallAngles[i]) * infallRadii[i];
      infallPos[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      infallPos[i * 3 + 2] = Math.sin(infallAngles[i]) * infallRadii[i];

      const c = Math.random() < 0.3 ? cCyan : cWhite;
      infallCol[i * 3] = c.r;
      infallCol[i * 3 + 1] = c.g;
      infallCol[i * 3 + 2] = c.b;
    }

    infallGeo.setAttribute("position", new THREE.BufferAttribute(infallPos, 3));
    infallGeo.setAttribute("color", new THREE.BufferAttribute(infallCol, 3));

    const infallMat = new THREE.PointsMaterial({
      size: 0.07,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const infallParticles = new THREE.Points(infallGeo, infallMat);
    masterGroup.add(infallParticles);

    // --- 6. Deep Space Ambient Star Dust (1,000 Distant Stars) ---
    const starCount = 1000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 50;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      starPos[i * 3 + 2] = -5 - Math.random() * 30;

      const c = Math.random() < 0.5 ? cBrandPurple : Math.random() < 0.5 ? cCyan : cWhite;
      starCol[i * 3] = c.r;
      starCol[i * 3 + 1] = c.g;
      starCol[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.04,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // --- Scroll & Mouse Interaction ---
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

      // Balanced placement so it doesn't collide with the hero text/avatar
      if (width < 768) {
        masterGroup.position.set(0, 0, 0);
        masterGroup.scale.setScalar(0.7);
      } else {
        masterGroup.position.set(2.8, -0.4, 0); // Positioned gracefully behind the avatar/right hero area
        masterGroup.scale.setScalar(1.0);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);
    handleScroll();
    handleResize();

    // --- 60 FPS Render Loop ---
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Fluid inertia smoothing
      currentScroll += (targetScroll - currentScroll) * 0.055;
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      // --- Accretion Disk Vortex Physics ---
      const dPos = diskGeo.attributes.position as THREE.BufferAttribute;
      const dArray = dPos.array as Float32Array;
      const scrollBoost = 1 + Math.abs(targetScroll - currentScroll) * 10;

      for (let i = 0; i < diskCount; i++) {
        diskAngles[i] += diskSpeeds[i] * scrollBoost;
        const r = diskRadii[i];
        dArray[i * 3] = Math.cos(diskAngles[i]) * r;
        dArray[i * 3 + 2] = Math.sin(diskAngles[i]) * r;
      }
      dPos.needsUpdate = true;

      // --- Infalling Matter Swirl Physics ---
      const infPos = infallGeo.attributes.position as THREE.BufferAttribute;
      const infArray = infPos.array as Float32Array;

      for (let i = 0; i < infallCount; i++) {
        infallAngles[i] += infallSpeeds[i] * 1.8;
        infallRadii[i] -= 0.009 * (1.0 + 2.0 / infallRadii[i]);

        // When swallowed by event horizon, respawn at outer rim
        if (infallRadii[i] < 1.66) {
          infallRadii[i] = 5.5 + Math.random() * 2.0;
          infallAngles[i] = Math.random() * Math.PI * 2;
        }

        infArray[i * 3] = Math.cos(infallAngles[i]) * infallRadii[i];
        infArray[i * 3 + 2] = Math.sin(infallAngles[i]) * infallRadii[i];
      }
      infPos.needsUpdate = true;

      // Pulse the razor photon ring subtly
      photonRing.rotation.y = elapsedTime * 0.08;

      // --- 3D Spatial Parallax & Cinematic Scroll Orbit ---
      // 1. Mouse Parallax (real-time 3D tilt)
      masterGroup.rotation.y = currentMouseX * 0.25 + currentScroll * 0.8;
      masterGroup.rotation.x = 0.42 - currentMouseY * 0.18 + Math.sin(currentScroll * Math.PI) * 0.25;
      masterGroup.rotation.z = Math.sin(currentScroll * Math.PI * 1.5) * 0.12;

      // 2. Camera Elevation & Distance on Scroll
      camera.position.z = 12 - Math.sin(currentScroll * Math.PI) * 2.8;
      camera.position.y = 2.5 - currentScroll * 1.8 + currentMouseY * 0.4;
      camera.position.x = currentMouseX * 0.5;
      camera.lookAt(masterGroup.position.x * 0.4, masterGroup.position.y * 0.4, 0);

      // Starfield cosmic drift
      stars.rotation.y = elapsedTime * 0.015 + currentScroll * 0.2;

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
      sphereGeo.dispose();
      sphereMat.dispose();
      photonRingGeo.dispose();
      photonMat.dispose();
      diskGeo.dispose();
      diskMat.dispose();
      lensGeo.dispose();
      lensMat.dispose();
      infallGeo.dispose();
      infallMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      particleTexture.dispose();
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
