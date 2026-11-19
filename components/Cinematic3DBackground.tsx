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
        alpha: false,
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

      // Sample accretion disk filaments, Doppler boosting, and plasma flares
      vec4 sampleDisk(vec3 pos, vec3 rayDir, float time, float scroll, float Rin, float Rout) {
        float r = length(pos.xz);
        if (r < Rin || r > Rout) {
          return vec4(0.0);
        }

        float normR = (r - Rin) / (Rout - Rin);
        float angle = atan(pos.z, pos.x);

        // Keplerian orbit: inner particles orbit faster
        float vOrbitSpeed = (2.2 / sqrt(r)) * (0.8 + scroll * 0.6);
        float flowAngle = angle - time * vOrbitSpeed;

        // Concentric thread-like striations (matching Interstellar fibers)
        float denseBands = sin(r * 52.0 + fbm(vec2(r * 7.0, flowAngle * 2.5)) * 4.5) * 0.5 + 0.5;
        float fineBands  = sin(r * 120.0 + fbm(vec2(flowAngle * 4.0, r * 15.0)) * 3.0) * 0.5 + 0.5;
        float striations = pow(denseBands * 0.55 + fineBands * 0.45, 1.25);

        float gasTurbulence = fbm(vec2(flowAngle * 3.5, r * 8.0 - time * 0.4));
        float diskDensity = pow(1.0 - normR, 1.1) * (0.35 + 0.65 * striations) * (0.6 + 0.4 * gasTurbulence);

        // Relativistic Doppler Beaming (approaching left side is much brighter)
        vec3 vDir = normalize(vec3(-pos.z, 0.0, pos.x));
        float dopplerCos = dot(vDir, -rayDir);
        float beaming = pow(max(1.0 + dopplerCos * 0.62, 0.08), 3.2);

        if (dopplerCos > 0.0) {
          diskDensity *= (1.0 + dopplerCos * 0.75);
        }

        // Matching Color Palette (Glowing White-Lavender Core, Neon Fuchsia, Signature Purple, Deep Violet)
        vec3 cHotWhite = vec3(1.00, 0.96, 1.00); // Inner boundary
        vec3 cFuchsia  = vec3(0.92, 0.45, 0.98); // Fuchsia-purple (#e879f9)
        vec3 cBrand    = vec3(0.66, 0.33, 0.97); // Signature purple (#a855f7)
        vec3 cDeep     = vec3(0.42, 0.12, 0.76); // Deep cosmic violet (#7c3aed)
        vec3 cDarkEdge = vec3(0.18, 0.03, 0.36); // Edge dust
        vec3 cCyan     = vec3(0.40, 0.88, 1.00); // Relativistic cyan flare (#38bdf8)

        vec3 diskColor = mix(cHotWhite, cFuchsia, smoothstep(0.0, 0.22, normR));
        diskColor = mix(diskColor, cBrand, smoothstep(0.22, 0.55, normR));
        diskColor = mix(diskColor, cDeep, smoothstep(0.55, 0.82, normR));
        diskColor = mix(diskColor, cDarkEdge, smoothstep(0.82, 1.0, normR));

        // Relativistic plasma flares along the inner front track
        float innerTrack = smoothstep(0.35, 0.0, normR);
        float frontMask = max(dopplerCos, 0.0);
        float flareClump1 = pow(sin(flowAngle * 5.0 + time * 1.8) * 0.5 + 0.5, 8.0);
        float flareClump2 = pow(sin(flowAngle * 8.0 - 1.2 + time * 2.2) * 0.5 + 0.5, 12.0);
        float flareIntensity = (flareClump1 * 2.2 + flareClump2 * 3.0) * innerTrack * frontMask;

        diskColor += mix(cCyan, cHotWhite, 0.65) * flareIntensity * 2.5;

        float alpha = clamp(diskDensity * beaming * 0.48, 0.0, 1.0);
        return vec4(diskColor * beaming, alpha);
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        // Position Black Hole nicely in the upper-right / center-right area so it's a distinct celestial object
        vec2 bhCenter = vec2(0.22, 0.02);
        uv -= bhCenter;

        float scroll = clamp(u_scroll, 0.0, 1.0);

        // Slanted accretion disk angle matching the image
        float pitch = 0.25 + sin(scroll * 3.14159) * 0.14 + u_mouse.y * 0.08;
        float yaw   = -0.16 + scroll * 0.75 + u_mouse.x * 0.12;
        float roll  = -0.18 + sin(scroll * 6.28) * 0.05;

        // Scaled camera distance so the entire black hole, arches, and disk fit comfortably in viewport!
        float camDist = 9.4 - sin(scroll * 3.14159) * 0.8;
        vec3 ro = vec3(0.0, 0.0, -camDist);
        vec3 rd = normalize(vec3(uv, 1.65));

        // Apply rotations
        rd.yz = rot(pitch) * rd.yz;
        ro.yz = rot(pitch) * ro.yz;

        rd.xz = rot(yaw) * rd.xz;
        ro.xz = rot(yaw) * ro.xz;

        rd.xy = rot(roll) * rd.xy;
        ro.xy = rot(roll) * ro.xy;

        // Perfectly proportioned Black Hole scale
        const float Rs = 0.88;          // Event Horizon radius
        const float Rin = Rs * 1.26;    // Inner accretion disk edge
        const float Rout = Rs * 4.20;   // Outer accretion disk boundary

        vec3 p = ro;
        vec3 dir = rd;

        vec3 accumColor = vec3(0.0);
        float accumAlpha = 0.0;
        float minR = 1000.0;
        bool hitHorizon = false;

        const int STEPS = 64;
        float dt = 0.22;

        for (int i = 0; i < STEPS; i++) {
          vec3 pPrev = p;
          float r = length(p);
          minR = min(minR, r);

          if (r < Rs) {
            hitHorizon = true;
            accumAlpha = 1.0;
            break;
          }

          // Einstein gravitational deflection
          float bend = 1.50 * Rs / (r * r);
          dir = normalize(dir - normalize(p) * bend * dt);
          p += dir * dt;

          // Exact zero-crossing plane intersection
          if (pPrev.y * p.y <= 0.0) {
            float s = -pPrev.y / (p.y - pPrev.y + 1e-6);
            vec3 pCross = mix(pPrev, p, clamp(s, 0.0, 1.0));

            // Shadow occlusion check for rear intersections
            bool inShadow = (pCross.z > 0.0 && length(pCross.xy) < Rs * 1.02);

            if (!inShadow) {
              vec4 sampleCol = sampleDisk(pCross, dir, u_time, scroll, Rin, Rout);
              accumColor += sampleCol.rgb * sampleCol.a * (1.0 - accumAlpha);
              accumAlpha += sampleCol.a * (1.0 - accumAlpha);
            }
          }

          if (r > 12.0 || accumAlpha >= 0.98) break;
        }

        // --- 1. Razor-Sharp Inner Photon Ring ---
        if (!hitHorizon && minR > Rs) {
          float photonDist = abs(minR - Rs * 1.03);
          float photonIntensity = exp(-photonDist * 50.0);
          accumColor += vec3(1.0, 0.96, 1.0) * photonIntensity * 3.2 * (1.0 - accumAlpha);
        }

        // --- 2. Multi-Tier Radiant Purple & Violet Glow (Atmospheric Bloom) ---
        float haloDist = abs(minR - Rs * 1.25);
        float innerHalo = exp(-haloDist * 4.5) * 0.95;
        accumColor += vec3(0.85, 0.40, 1.0) * innerHalo * (1.0 - accumAlpha);

        float outerHaloDist = abs(minR - Rs * 1.8);
        float outerHalo = exp(-outerHaloDist * 2.2) * 0.65;
        accumColor += vec3(0.55, 0.20, 0.95) * outerHalo * (1.0 - accumAlpha);

        // Wide soft cosmic glow surrounding the entire system
        float cosmicAura = exp(-minR * 0.45) * 0.25;
        accumColor += vec3(0.40, 0.12, 0.70) * cosmicAura * (1.0 - accumAlpha);

        // --- 3. Deep Space Background Stars with Relativistic Deflection ---
        vec2 starUv = dir.xy * 28.0;
        float starNoise = hash(floor(starUv.x) + floor(starUv.y) * 157.0);
        float star = pow(starNoise, 48.0) * 0.85;
        vec3 starColor = mix(vec3(0.8, 0.7, 1.0), vec3(0.4, 0.85, 1.0), hash(starNoise * 4.0));
        accumColor += starColor * star * (1.0 - accumAlpha);

        // Filmic ACES Tone Mapping with High Contrast
        accumColor = (accumColor * (2.51 * accumColor + 0.03)) / (accumColor * (2.43 * accumColor + 0.59) + 0.14);
        accumColor = pow(clamp(accumColor, 0.0, 1.0), vec3(0.92));

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
      className="fixed inset-0 -z-20 pointer-events-none overflow-hidden"
      aria-hidden="true"
    />
  );
}
