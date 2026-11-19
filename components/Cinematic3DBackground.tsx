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

    // 3D Perspective Camera for deep spatial immersion
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.4, 12);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Initial cinematic tilt matching Interstellar black hole angle
    masterGroup.rotation.x = 0.40;

    // --- 1. Generate High-Res Smooth Gaussian Particle Glow Sprite ---
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 128;
    spriteCanvas.height = 128;
    const ctx = spriteCanvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      grad.addColorStop(0.18, "rgba(245, 210, 255, 0.95)");
      grad.addColorStop(0.42, "rgba(192, 132, 252, 0.55)"); // #c084fc
      grad.addColorStop(0.70, "rgba(168, 85, 247, 0.22)");  // #a855f7
      grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const particleTexture = new THREE.CanvasTexture(spriteCanvas);

    // --- 2. Generate Volumetric Blurred Accretion Glow Disc Texture ---
    const diskGlowCanvas = document.createElement("canvas");
    diskGlowCanvas.width = 512;
    diskGlowCanvas.height = 512;
    const diskCtx = diskGlowCanvas.getContext("2d");
    if (diskCtx) {
      const grad = diskCtx.createRadialGradient(256, 256, 20, 256, 256, 256);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      grad.addColorStop(0.20, "rgba(232, 121, 249, 0.75)"); // Fuchsia
      grad.addColorStop(0.45, "rgba(168, 85, 247, 0.45)");  // Purple
      grad.addColorStop(0.75, "rgba(124, 58, 237, 0.20)");  // Violet
      grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      diskCtx.fillStyle = grad;
      diskCtx.fillRect(0, 0, 512, 512);
    }
    const diskGlowTexture = new THREE.CanvasTexture(diskGlowCanvas);

    // --- 3. Physical Event Horizon (Pitch-Black Central Singularity) ---
    const sphereGeo = new THREE.SphereGeometry(1.68, 64, 64);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const singularity = new THREE.Mesh(sphereGeo, sphereMat);
    masterGroup.add(singularity);

    // --- 4. Volumetric Accretion Disk Glow Meshes (Soft Atmospheric Blurs) ---
    // Inner Radiant Photon Ring Glow
    const innerGlowGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      map: diskGlowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
      depthWrite: false,
    });
    const innerGlowMesh = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    innerGlowMesh.rotation.x = -Math.PI / 2;
    masterGroup.add(innerGlowMesh);

    // Wide Atmospheric Accretion Halo Blur
    const wideGlowGeo = new THREE.PlaneGeometry(15.5, 15.5);
    const wideGlowMat = new THREE.MeshBasicMaterial({
      map: diskGlowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.42,
      depthWrite: false,
    });
    const wideGlowMesh = new THREE.Mesh(wideGlowGeo, wideGlowMat);
    wideGlowMesh.rotation.x = -Math.PI / 2;
    masterGroup.add(wideGlowMesh);

    // Upper Gravitational Lensing Blurred Arch Glow (Behind Black Hole)
    const archGlowGeo = new THREE.PlaneGeometry(10.5, 7.5);
    const archGlowMat = new THREE.MeshBasicMaterial({
      map: diskGlowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.50,
      depthWrite: false,
    });
    const archGlowMesh = new THREE.Mesh(archGlowGeo, archGlowMat);
    archGlowMesh.position.set(-0.3, 1.2, -0.4);
    masterGroup.add(archGlowMesh);

    // --- 5. Razor-Sharp Inner Photon Ring (420 Luminous Points) ---
    const photonRingCount = 420;
    const photonRingGeo = new THREE.BufferGeometry();
    const photonPos = new Float32Array(photonRingCount * 3);
    const photonCol = new Float32Array(photonRingCount * 3);

    const cWhite = new THREE.Color(0xffffff);
    const cLavender = new THREE.Color(0xf5d0fe);

    for (let i = 0; i < photonRingCount; i++) {
      const theta = (i / photonRingCount) * Math.PI * 2;
      const r = 1.71 + (Math.random() - 0.5) * 0.04;
      photonPos[i * 3] = Math.cos(theta) * r;
      photonPos[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      photonPos[i * 3 + 2] = Math.sin(theta) * r;

      const c = Math.random() < 0.65 ? cWhite : cLavender;
      photonCol[i * 3] = c.r;
      photonCol[i * 3 + 1] = c.g;
      photonCol[i * 3 + 2] = c.b;
    }

    photonRingGeo.setAttribute("position", new THREE.BufferAttribute(photonPos, 3));
    photonRingGeo.setAttribute("color", new THREE.BufferAttribute(photonCol, 3));

    const photonMat = new THREE.PointsMaterial({
      size: 0.11,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const photonRing = new THREE.Points(photonRingGeo, photonMat);
    masterGroup.add(photonRing);

    // --- 6. Swirling Accretion Disk (3,800 Glowing Vortex Particles) ---
    const diskCount = 3800;
    const diskGeo = new THREE.BufferGeometry();
    const diskPos = new Float32Array(diskCount * 3);
    const diskCol = new Float32Array(diskCount * 3);
    const diskRadii = new Float32Array(diskCount);
    const diskAngles = new Float32Array(diskCount);
    const diskSpeeds = new Float32Array(diskCount);

    const cBrandPurple = new THREE.Color(0xa855f7); // #a855f7
    const cFuchsia = new THREE.Color(0xd946ef);     // #d946ef
    const cViolet = new THREE.Color(0x7c3aed);      // #7c3aed
    const cCyan = new THREE.Color(0x38bdf8);        // Relativistic cyan #38bdf8
    const cElectricPink = new THREE.Color(0xf472b6);// Light pink

    for (let i = 0; i < diskCount; i++) {
      const u = Math.random();
      const r = 1.76 + Math.pow(u, 1.5) * 6.5;
      const angle = Math.random() * Math.PI * 2;
      const vertical = (Math.random() - 0.5) * (0.09 + (r - 1.76) * 0.045);

      diskRadii[i] = r;
      diskAngles[i] = angle;
      diskSpeeds[i] = (2.5 / Math.sqrt(r)) * 0.0125;

      diskPos[i * 3] = Math.cos(angle) * r;
      diskPos[i * 3 + 1] = vertical;
      diskPos[i * 3 + 2] = Math.sin(angle) * r;

      const normR = (r - 1.76) / 6.5;
      const c = new THREE.Color();
      if (normR < 0.15) {
        c.lerpColors(cWhite, cElectricPink, normR / 0.15);
      } else if (normR < 0.55) {
        c.lerpColors(cFuchsia, cBrandPurple, (normR - 0.15) / 0.40);
      } else {
        c.lerpColors(cBrandPurple, Math.random() < 0.22 ? cCyan : cViolet, (normR - 0.55) / 0.45);
      }

      diskCol[i * 3] = c.r;
      diskCol[i * 3 + 1] = c.g;
      diskCol[i * 3 + 2] = c.b;
    }

    diskGeo.setAttribute("position", new THREE.BufferAttribute(diskPos, 3));
    diskGeo.setAttribute("color", new THREE.BufferAttribute(diskCol, 3));

    const diskMat = new THREE.PointsMaterial({
      size: 0.085, // Sized up for rich glowing blur overlap
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.90,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const accretionDisk = new THREE.Points(diskGeo, diskMat);
    masterGroup.add(accretionDisk);

    // --- 7. Gravitational Lensing Arches (1,600 Warped Particles) ---
    const lensCount = 1600;
    const lensGeo = new THREE.BufferGeometry();
    const lensPos = new Float32Array(lensCount * 3);
    const lensCol = new Float32Array(lensCount * 3);

    for (let i = 0; i < lensCount; i++) {
      const isTopArch = Math.random() < 0.65;
      const theta = (Math.random() - 0.5) * Math.PI * 0.95;
      const r = 1.95 + Math.random() * 2.6;

      if (isTopArch) {
        lensPos[i * 3] = Math.sin(theta) * (r * 1.35) - 0.35;
        lensPos[i * 3 + 1] = Math.cos(theta) * (r * 0.88) + 0.25;
        lensPos[i * 3 + 2] = -0.35 + (Math.random() - 0.5) * 0.4;
      } else {
        lensPos[i * 3] = Math.sin(theta) * (r * 1.1) + 0.25;
        lensPos[i * 3 + 1] = -Math.cos(theta) * (r * 0.78) - 0.35;
        lensPos[i * 3 + 2] = -0.35 + (Math.random() - 0.5) * 0.4;
      }

      const c = isTopArch
        ? Math.random() < 0.45 ? cFuchsia : cBrandPurple
        : cViolet;
      lensCol[i * 3] = c.r;
      lensCol[i * 3 + 1] = c.g;
      lensCol[i * 3 + 2] = c.b;
    }

    lensGeo.setAttribute("position", new THREE.BufferAttribute(lensPos, 3));
    lensGeo.setAttribute("color", new THREE.BufferAttribute(lensCol, 3));

    const lensMat = new THREE.PointsMaterial({
      size: 0.075,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lensingArches = new THREE.Points(lensGeo, lensMat);
    masterGroup.add(lensingArches);

    // --- 8. Relativistic Infalling Matter & Plasma Flares ---
    const infallCount = 450;
    const infallGeo = new THREE.BufferGeometry();
    const infallPos = new Float32Array(infallCount * 3);
    const infallCol = new Float32Array(infallCount * 3);
    const infallRadii = new Float32Array(infallCount);
    const infallAngles = new Float32Array(infallCount);
    const infallSpeeds = new Float32Array(infallCount);

    for (let i = 0; i < infallCount; i++) {
      infallRadii[i] = 1.72 + Math.random() * 4.8;
      infallAngles[i] = Math.random() * Math.PI * 2;
      infallSpeeds[i] = 0.014 + Math.random() * 0.022;

      infallPos[i * 3] = Math.cos(infallAngles[i]) * infallRadii[i];
      infallPos[i * 3 + 1] = (Math.random() - 0.5) * 0.35;
      infallPos[i * 3 + 2] = Math.sin(infallAngles[i]) * infallRadii[i];

      const c = Math.random() < 0.45 ? cCyan : cWhite;
      infallCol[i * 3] = c.r;
      infallCol[i * 3 + 1] = c.g;
      infallCol[i * 3 + 2] = c.b;
    }

    infallGeo.setAttribute("position", new THREE.BufferAttribute(infallPos, 3));
    infallGeo.setAttribute("color", new THREE.BufferAttribute(infallCol, 3));

    const infallMat = new THREE.PointsMaterial({
      size: 0.095,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const infallParticles = new THREE.Points(infallGeo, infallMat);
    masterGroup.add(infallParticles);

    // --- 9. Bokeh Depth-of-Field Cosmic Dust (1,400 Stars with Soft Blur) ---
    const starCount = 1400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 55;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 55;
      starPos[i * 3 + 2] = -5 - Math.random() * 35;

      const c = Math.random() < 0.55 ? cBrandPurple : Math.random() < 0.5 ? cCyan : cWhite;
      starCol[i * 3] = c.r;
      starCol[i * 3 + 1] = c.g;
      starCol[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.05,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
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

      if (width < 768) {
        masterGroup.position.set(0, 0, 0);
        masterGroup.scale.setScalar(0.72);
      } else {
        masterGroup.position.set(2.8, -0.3, 0);
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

      currentScroll += (targetScroll - currentScroll) * 0.055;
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      // Orbit Accretion Vortex
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

      // Infalling Matter
      const infPos = infallGeo.attributes.position as THREE.BufferAttribute;
      const infArray = infPos.array as Float32Array;

      for (let i = 0; i < infallCount; i++) {
        infallAngles[i] += infallSpeeds[i] * 1.8;
        infallRadii[i] -= 0.0095 * (1.0 + 2.0 / infallRadii[i]);

        if (infallRadii[i] < 1.68) {
          infallRadii[i] = 5.5 + Math.random() * 2.2;
          infallAngles[i] = Math.random() * Math.PI * 2;
        }

        infArray[i * 3] = Math.cos(infallAngles[i]) * infallRadii[i];
        infArray[i * 3 + 2] = Math.sin(infallAngles[i]) * infallRadii[i];
      }
      infPos.needsUpdate = true;

      // Subtle radiant glow breathing pulse
      const breathe = 1.0 + Math.sin(elapsedTime * 1.8) * 0.06;
      innerGlowMesh.scale.setScalar(breathe);
      wideGlowMesh.scale.setScalar(1.0 + Math.sin(elapsedTime * 1.2) * 0.04);
      archGlowMesh.scale.setScalar(1.0 + Math.cos(elapsedTime * 1.5) * 0.05);

      photonRing.rotation.y = elapsedTime * 0.08;

      // 3D Parallax & Scroll Orbit
      masterGroup.rotation.y = currentMouseX * 0.25 + currentScroll * 0.8;
      masterGroup.rotation.x = 0.40 - currentMouseY * 0.18 + Math.sin(currentScroll * Math.PI) * 0.22;
      masterGroup.rotation.z = Math.sin(currentScroll * Math.PI * 1.5) * 0.10;

      camera.position.z = 12 - Math.sin(currentScroll * Math.PI) * 2.8;
      camera.position.y = 2.4 - currentScroll * 1.8 + currentMouseY * 0.4;
      camera.position.x = currentMouseX * 0.5;
      camera.lookAt(masterGroup.position.x * 0.4, masterGroup.position.y * 0.4, 0);

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
      innerGlowGeo.dispose();
      innerGlowMat.dispose();
      wideGlowGeo.dispose();
      wideGlowMat.dispose();
      archGlowGeo.dispose();
      archGlowMat.dispose();
      diskGlowTexture.dispose();
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
