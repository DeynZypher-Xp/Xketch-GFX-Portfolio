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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Orthographic camera ensures 100% full-screen edge-to-edge coverage with ZERO borders
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const textureLoader = new THREE.TextureLoader();
    const blackHoleTexture = textureLoader.load("/blackhole-purple.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
    });

    // Fullscreen borderless shader quad
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

      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_scroll;
      uniform vec2 u_mouse;

      // Hash helper for cosmic stardust
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        // Fullscreen aspect-ratio cover mapping (object-fit: cover equivalent)
        float screenAspect = u_resolution.x / u_resolution.y;
        const float imgAspect = 1024.0 / 576.0; // 16:9

        vec2 uv = vUv - 0.5;

        if (screenAspect > imgAspect) {
          uv.y *= (screenAspect / imgAspect);
        } else {
          uv.x *= (imgAspect / screenAspect);
        }

        // Interactive 3D mouse parallax (smooth tilt/panning)
        uv -= u_mouse * 0.035;

        // Cinematic scroll zoom and trajectory
        float zoom = 1.0 - u_scroll * 0.14;
        uv *= zoom;
        uv.y += u_scroll * 0.09;
        uv.x += u_scroll * 0.05;

        uv += 0.5;

        vec3 color = vec3(0.0);

        // Sample the exact Interstellar Gargantua Black Hole
        if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
          vec4 texColor = texture2D(u_texture, uv);
          color = texColor.rgb;

          // Add radiant cosmic breathing pulse on the glowing filaments
          float pulse = sin(u_time * 1.6) * 0.05;
          color += color * pulse;
        }

        // --- Deep Cosmic Stardust Particles in 3D Space ---
        vec2 starCoord = vUv * vec2(screenAspect * 40.0, 40.0);
        // Star movement reacting to time and scroll
        starCoord.y += u_time * 0.2 + u_scroll * 15.0;
        starCoord.x += sin(u_time * 0.1) * 2.0;

        vec2 id = floor(starCoord);
        float h = hash(id);
        if (h > 0.985) {
          vec2 localPos = fract(starCoord) - 0.5;
          float starDist = length(localPos);
          float starGlow = smoothstep(0.08, 0.0, starDist);
          float twinkle = sin(u_time * 3.0 + h * 6.28) * 0.5 + 0.5;

          vec3 starCol = mix(vec3(0.85, 0.65, 1.0), vec3(0.4, 0.85, 1.0), hash(id + 1.0));
          color += starCol * starGlow * twinkle * 0.8;
        }

        // Final filmic contrast
        color = pow(color, vec3(0.96));

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const uniforms = {
      u_texture: { value: blackHoleTexture },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_time: { value: 0 },
      u_scroll: { value: 0 },
      u_mouse: { value: new THREE.Vector2(0, 0) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
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

      // Smooth inertia lerp for scroll and cursor
      currentScroll += (targetScroll - currentScroll) * 0.05;
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
      blackHoleTexture.dispose();
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
