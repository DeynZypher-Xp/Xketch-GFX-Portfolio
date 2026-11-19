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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // High-performance Gravitational Raymarching Shader for Gargantua Black Hole
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

      // Pseudo-random & noise helpers for disk striations and plasma filaments
      float hash(float n) {
        return fract(sin(n) * 43758.5453123);
      }

      float noise(vec2 x) {
        vec2 p = floor(x);
        vec2 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        float n = p.x + p.y * 57.0;
        return mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                   mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
      }

      float fbm(vec2 p) {
        float f = 0.0;
        f += 0.5000 * noise(p); p = p * 2.02;
        f += 0.2500 * noise(p); p = p * 2.03;
        f += 0.1250 * noise(p); p = p * 2.01;
        f += 0.0625 * noise(p);
        return f;
      }

      // Matrix rotation utilities
      mat2 rot(float a) {
        float c = cos(a);
        float s = sin(a);
        return mat2(c, -s, s, c);
      }

      void main() {
        // Normalized coordinates [-1, 1] adjusted for screen aspect ratio
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        // Cinematic camera orientation based on scroll and mouse parallax
        float scroll = clamp(u_scroll, 0.0, 1.0);
        float pitch = 0.24 + sin(scroll * 3.14159) * 0.20 + u_mouse.y * 0.12;
        float yaw = -0.32 + scroll * 1.2 + u_mouse.x * 0.22;
        float roll = -0.15 + sin(scroll * 6.28) * 0.08;

        // Camera setup
        float camDist = 5.2 - sin(scroll * 3.14159) * 0.9;
        vec3 ro = vec3(0.0, 0.0, -camDist);
        vec3 rd = normalize(vec3(uv, 1.6));

        // Apply pitch, yaw, and roll rotations
        rd.yz = rot(pitch) * rd.yz;
        ro.yz = rot(pitch) * ro.yz;

        rd.xz = rot(yaw) * rd.xz;
        ro.xz = rot(yaw) * ro.xz;

        rd.xy = rot(roll) * rd.xy;
        ro.xy = rot(roll) * ro.xy;

        // Black Hole parameters
        const float Rs = 1.0;            // Schwarzschild radius (Event Horizon)
        const float Rin = 1.35;          // Inner edge of accretion disk (ISCO)
        const float Rout = 4.3;          // Outer boundary of accretion disk
        const float diskThickness = 0.045;

        // Matching Color Palette (Electric Purple, Neon Fuchsia, Radiant Lavender, Cyan Flares)
        vec3 colCore   = vec3(0.98, 0.92, 1.00); // Blazing white-lavender photon emission
        vec3 colMid    = vec3(0.72, 0.35, 0.98); // Vibrant website purple (#a855f7)
        vec3 colDeep   = vec3(0.44, 0.14, 0.78); // Cosmic deep violet
        vec3 colDark   = vec3(0.20, 0.04, 0.38); // Outer accretion dust
        vec3 colCyan   = vec3(0.35, 0.85, 1.00); // Relativistic energetic plasma flares

        vec3 accumColor = vec3(0.0);
        float accumAlpha = 0.0;
        float minDistance = 1000.0;

        vec3 p = ro;
        vec3 dir = rd;

        // Adaptive Gravitational Curved Ray Integration
        const int STEPS = 48;
        float dt = 0.18;

        for (int i = 0; i < STEPS; i++) {
          float r = length(p);
          minDistance = min(minDistance, r);

          // 1. Ray fell inside the Event Horizon (absorbed by singularity)
          if (r < Rs) {
            accumAlpha = 1.0;
            break;
          }

          // 2. Accretion Disk Interaction (near equatorial plane y = 0)
          float distToPlane = abs(p.y);
          if (distToPlane < diskThickness * (1.0 + r * 0.25) && r >= Rin && r <= Rout) {
            // Radial distance inside disk
            float normR = (r - Rin) / (Rout - Rin);

            // Polar coordinates on disk plane
            float angle = atan(p.z, p.x);

            // Keplerian orbital rotation speed: inner disk orbits faster than outer disk
            float orbitSpeed = (2.2 / sqrt(r)) * (0.8 + scroll * 1.5);
            float rotAngle = angle - u_time * orbitSpeed;

            // Concentric luminous striations and turbulent gas filaments
            float rings = sin(r * 42.0 + fbm(vec2(r * 5.0, rotAngle * 2.0)) * 4.0) * 0.5 + 0.5;
            float filament = fbm(vec2(rotAngle * 4.0, r * 12.0));
            float density = pow(1.0 - normR, 1.2) * (0.55 + 0.45 * rings) * (0.6 + 0.4 * filament);

            // Relativistic Doppler Beaming: matter moving towards camera is significantly brighter
            vec3 vOrbit = normalize(vec3(-p.z, 0.0, p.x));
            float doppler = dot(vOrbit, -dir);
            float beaming = pow(max(1.0 + doppler * 0.58, 0.1), 3.2);

            // Base disk color gradient
            vec3 diskCol = mix(colCore, colMid, smoothstep(0.0, 0.35, normR));
            diskCol = mix(diskCol, colDeep, smoothstep(0.35, 0.75, normR));
            diskCol = mix(diskCol, colDark, smoothstep(0.75, 1.0, normR));

            // Hot relativistic cyan/white plasma flares on the front inner track
            float flareMask = pow(smoothstep(0.3, 0.0, normR), 2.5) * max(doppler, 0.0);
            float flareClusters = pow(sin(rotAngle * 6.0 + u_time * 2.0) * 0.5 + 0.5, 6.0);
            diskCol += colCyan * flareClusters * flareMask * 3.5;

            // Emission & intensity accumulation
            float sliceAlpha = density * beaming * 0.42;
            accumColor += diskCol * sliceAlpha * (1.0 - accumAlpha) * beaming;
            accumAlpha += sliceAlpha * (1.0 - accumAlpha);

            if (accumAlpha > 0.96) break;
          }

          // 3. Spacetime Gravitational Bending (Einstein Lensing Deflection)
          // Deflect ray direction towards the singularity proportional to 1/r^2
          float bendForce = 1.45 * Rs / (r * r);
          vec3 bendDir = -normalize(p);
          dir = normalize(dir + bendDir * bendForce * dt);

          p += dir * dt;

          // Ray escaped into deep space
          if (r > 9.0) break;
        }

        // 4. Razor-Sharp Photon Ring (Light trapped at r ~= 1.5 * Rs)
        if (minDistance > Rs) {
          float photonDist = abs(minDistance - Rs * 1.05);
          float photonRing = exp(-photonDist * 35.0);
          accumColor += colCore * photonRing * 1.8 * (1.0 - accumAlpha);
        }

        // 5. Gravitational Lensing Outer Halo Glow
        float haloDist = abs(minDistance - Rs * 1.4);
        float haloGlow = exp(-haloDist * 3.5) * 0.35;
        accumColor += colMid * haloGlow * (1.0 - accumAlpha);

        // 6. Deep Space Background Stars with subtle gravitational distortion
        vec2 starUv = dir.xy * 25.0;
        float starNoise = hash(floor(starUv.x) + floor(starUv.y) * 131.0);
        float starIntensity = pow(starNoise, 40.0) * 0.8;
        vec3 starCol = mix(vec3(0.8, 0.7, 1.0), colCyan, hash(starNoise * 3.0));
        accumColor += starCol * starIntensity * (1.0 - accumAlpha);

        // Final tone mapping & contrast
        accumColor = accumColor / (accumColor + vec3(1.0)); // Reinhard tone mapping
        accumColor = pow(accumColor, vec3(0.92));            // Gamma adjustment

        gl_FragColor = vec4(accumColor, accumAlpha * 0.95);
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
      transparent: true,
      blending: THREE.NormalBlending,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    // Scroll and Mouse Listeners
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      uniforms.u_resolution.value.set(width, height);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);
    handleScroll();

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth lerp physics for scroll & cursor
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
