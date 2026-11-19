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
        alpha: false, // Deep black cosmic space background
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Exact Interstellar Gargantua Ray-Bending Shader
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;

      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_scroll;
      uniform vec2 u_mouse;

      // Hash and Noise generators for accretion disk filaments & turbulence
      float hash(float n) {
        return fract(sin(n) * 43758.5453123);
      }

      float hash2d(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash2d(i);
        float b = hash2d(i + vec2(1.0, 0.0));
        float c = hash2d(i + vec2(0.0, 1.0));
        float d = hash2d(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        v += 0.500 * noise(p); p *= 2.02;
        v += 0.250 * noise(p); p *= 2.03;
        v += 0.125 * noise(p); p *= 2.01;
        v += 0.062 * noise(p);
        return v;
      }

      mat2 rot(float a) {
        float c = cos(a);
        float s = sin(a);
        return mat2(c, -s, s, c);
      }

      // Exact Accretion Disk Radiant Emission function
      // Samples the striated filaments, Keplerian rotation, Doppler beaming, and plasma flares
      vec4 sampleDisk(vec3 pos, vec3 rayDir, float time, float scroll) {
        float r = length(pos.xz);
        const float Rin = 1.30;   // Innermost stable orbit
        const float Rout = 5.20;  // Outer accretion disk boundary

        if (r < Rin || r > Rout) {
          return vec4(0.0);
        }

        float normR = (r - Rin) / (Rout - Rin);
        float angle = atan(pos.z, pos.x);

        // Keplerian angular velocity (inner particles orbit much faster)
        float vOrbitSpeed = (2.4 / sqrt(r)) * (0.9 + scroll * 0.8);
        float flowAngle = angle - time * vOrbitSpeed;

        // --- 1. Luminous Thread-Like Striations (Concentric Fibers) ---
        // High-frequency radial bands layered with turbulent gas noise
        float denseBands = sin(r * 48.0 + fbm(vec2(r * 6.0, flowAngle * 2.0)) * 5.0) * 0.5 + 0.5;
        float fineBands  = sin(r * 115.0 + fbm(vec2(flowAngle * 4.0, r * 14.0)) * 3.0) * 0.5 + 0.5;
        float microBands = sin(r * 240.0) * 0.5 + 0.5;
        float striations = pow(denseBands * 0.5 + fineBands * 0.35 + microBands * 0.15, 1.3);

        // Turbulence filaments across the disk plane
        float gasTurbulence = fbm(vec2(flowAngle * 3.5, r * 8.0 - time * 0.4));
        float diskDensity = pow(1.0 - normR, 1.1) * (0.35 + 0.65 * striations) * (0.55 + 0.45 * gasTurbulence);

        // --- 2. Relativistic Doppler Beaming (Interstellar Effect) ---
        // Matter moving towards the camera (left side) is significantly amplified and flared
        vec3 vDir = normalize(vec3(-pos.z, 0.0, pos.x));
        float dopplerCos = dot(vDir, -rayDir);
        float beaming = pow(max(1.0 + dopplerCos * 0.62, 0.08), 3.4);

        // Extra width and flare on the approaching (left) side
        if (dopplerCos > 0.0) {
          diskDensity *= (1.0 + dopplerCos * 0.85);
        }

        // --- 3. Matching Color Palette (Electric Purple, Vivid Violet, Blazing Core, Cyan Flares) ---
        vec3 cHotWhite = vec3(1.00, 0.96, 1.00); // White-hot inner photon boundary
        vec3 cFuchsia  = vec3(0.92, 0.42, 0.98); // Vibrant fuchsia-purple (#e879f9)
        vec3 cBrand    = vec3(0.66, 0.33, 0.97); // Website signature purple (#a855f7)
        vec3 cDeep     = vec3(0.42, 0.12, 0.76); // Deep interstellar cosmic violet (#7c3aed)
        vec3 cDarkEdge = vec3(0.18, 0.03, 0.36); // Outer edge dust
        vec3 cCyan     = vec3(0.40, 0.88, 1.00); // Relativistic cyan plasma flare (#38bdf8)

        vec3 diskColor = mix(cHotWhite, cFuchsia, smoothstep(0.0, 0.22, normR));
        diskColor = mix(diskColor, cBrand, smoothstep(0.22, 0.55, normR));
        diskColor = mix(diskColor, cDeep, smoothstep(0.55, 0.82, normR));
        diskColor = mix(diskColor, cDarkEdge, smoothstep(0.82, 1.0, normR));

        // --- 4. Glowing Plasma Flares (Matching reference front disk puffs) ---
        // 3 bright plasma clumps on the inner track crossing in front of the black hole
        float innerTrack = smoothstep(0.35, 0.0, normR);
        float frontMask = max(dopplerCos, 0.0);
        float flareClump1 = pow(sin(flowAngle * 5.0 + time * 1.8) * 0.5 + 0.5, 8.0);
        float flareClump2 = pow(sin(flowAngle * 8.0 - 1.2 + time * 2.2) * 0.5 + 0.5, 12.0);
        float flareIntensity = (flareClump1 * 2.5 + flareClump2 * 3.2) * innerTrack * frontMask;

        diskColor += mix(cCyan, cHotWhite, 0.65) * flareIntensity * 2.8;

        float alpha = clamp(diskDensity * beaming * 0.45, 0.0, 1.0);
        return vec4(diskColor * beaming, alpha);
      }

      void main() {
        // Pixel coordinates [-1, 1] corrected for aspect ratio
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        // Composition alignment: Black hole center placed slightly to the right, just like the image
        vec2 bhCenter = vec2(0.24, -0.02);
        uv -= bhCenter;

        float scroll = clamp(u_scroll, 0.0, 1.0);

        // Exact Interstellar camera orientation:
        // Slanted accretion disk (~15 deg pitch, ~ -12 deg roll)
        float pitch = 0.26 + sin(scroll * 3.14159) * 0.16 + u_mouse.y * 0.08;
        float yaw   = -0.18 + scroll * 0.85 + u_mouse.x * 0.14;
        float roll  = -0.19 + sin(scroll * 6.28) * 0.06;

        vec3 ro = vec3(0.0, 0.0, -5.6 + sin(scroll * 3.14159) * 0.6);
        vec3 rd = normalize(vec3(uv, 1.55));

        // Camera rotation
        rd.yz = rot(pitch) * rd.yz;
        ro.yz = rot(pitch) * ro.yz;

        rd.xz = rot(yaw) * rd.xz;
        ro.xz = rot(yaw) * ro.xz;

        rd.xy = rot(roll) * rd.xy;
        ro.xy = rot(roll) * ro.xy;

        const float Rs = 1.0; // Event Horizon Radius
        vec3 p = ro;
        vec3 dir = rd;

        vec3 accumColor = vec3(0.0);
        float accumAlpha = 0.0;
        float minR = 1000.0;
        bool hitHorizon = false;

        const int STEPS = 64;
        float dt = 0.14;

        // Trace ray through Einstein curved spacetime
        for (int i = 0; i < STEPS; i++) {
          vec3 pPrev = p;
          float r = length(p);
          minR = min(minR, r);

          // Hit Event Horizon: absorbed by singularity
          if (r < Rs) {
            hitHorizon = true;
            accumAlpha = 1.0;
            break;
          }

          // Spacetime Gravitational Bending (deflect towards center proportional to Rs / r^2)
          float bend = 1.52 * Rs / (r * r);
          dir = normalize(dir - normalize(p) * bend * dt);
          p += dir * dt;

          // --- Exact Plane Crossing Detection ---
          // When pPrev and p are on opposite sides of the disk plane (y = 0),
          // the ray intersects the accretion disk!
          if (pPrev.y * p.y <= 0.0) {
            float s = -pPrev.y / (p.y - pPrev.y + 1e-6);
            vec3 pCross = mix(pPrev, p, clamp(s, 0.0, 1.0));

            // Check if this intersection is occluded by the black hole shadow
            bool inShadow = (pCross.z > 0.0 && length(pCross.xy) < Rs * 1.02);

            if (!inShadow) {
              vec4 sampleCol = sampleDisk(pCross, dir, u_time, scroll);
              accumColor += sampleCol.rgb * sampleCol.a * (1.0 - accumAlpha);
              accumAlpha += sampleCol.a * (1.0 - accumAlpha);
            }
          }

          if (r > 10.0 || accumAlpha >= 0.97) break;
        }

        // --- Razor-Sharp Photon Sphere Ring ---
        // Blinding thin ring of trapped photons circling right on the shadow edge
        if (!hitHorizon && minR > Rs) {
          float photonDist = abs(minR - Rs * 1.03);
          float photonIntensity = exp(-photonDist * 42.0);
          accumColor += vec3(1.0, 0.95, 1.0) * photonIntensity * 2.8 * (1.0 - accumAlpha);
        }

        // --- Gravitational Lensing Outer Halo Bloom ---
        float haloDist = abs(minR - Rs * 1.35);
        float haloGlow = exp(-haloDist * 4.2) * 0.45;
        accumColor += vec3(0.66, 0.33, 0.97) * haloGlow * (1.0 - accumAlpha);

        // --- Deep Cosmic Starfield with Gravitational Deflection ---
        vec2 starUv = dir.xy * 28.0;
        float starNoise = hash(floor(starUv.x) + floor(starUv.y) * 157.0);
        float star = pow(starNoise, 45.0) * 0.9;
        vec3 starColor = mix(vec3(0.8, 0.7, 1.0), vec3(0.4, 0.85, 1.0), hash(starNoise * 4.0));
        accumColor += starColor * star * (1.0 - accumAlpha);

        // Filmic ACES Tone Mapping & Gamma Curve for maximum cinematic contrast
        accumColor = (accumColor * (2.51 * accumColor + 0.03)) / (accumColor * (2.43 * accumColor + 0.59) + 0.14);
        accumColor = pow(clamp(accumColor, 0.0, 1.0), vec3(0.95));

        gl_FragColor = vec4(accumColor, 1.0);
      }
    `;

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_scroll: { value: 0 },
      u_mouse: { value: new THREE.Vector2(0, 0) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

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
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      uniforms.u_resolution.value.set(width, height);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);
    handleScroll();

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth inertia lerp
      currentScroll += (targetScroll - currentScroll) * 0.055;
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      uniforms.u_time.value = elapsedTime;
      uniforms.u_scroll.value = currentScroll;
      uniforms.u_mouse.value.set(currentMouseX, currentMouseY);

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
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden="true"
    />
  );
}
