"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

interface ParticlesBackgroundProps {
  className?: string;
}

export function ParticlesBackground({ className }: ParticlesBackgroundProps) {
  const [init, setInit] = useState(false);

  // Initialize particles engine - should only run once
  useEffect(() => {
    const initializeParticles = async () => {
      await initParticlesEngine(async (engine: Engine) => {
        await loadSlim(engine);
      });

      setInit(true);
    };

    initializeParticles();
  }, []);

  const particlesLoaded = async () => {
    // Optional: Do something with the container
    console.log("Particles container loaded");
  };

  if (!init) return null;

  return (
    <Particles
      id="tsparticles"
      className={className}
      particlesLoaded={particlesLoaded}
      options={{
        fullScreen: {
          enable: false,
        },
        fpsLimit: 60,
        particles: {
          color: {
            value: ["#10b981", "#059669", "#34d399"], // emerald colors
          },
          links: {
            color: "#10b981",
            distance: 150,
            enable: true,
            opacity: 0.3,
            width: 1,
          },
          collisions: {
            enable: true,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: 2,
            straight: false,
          },
          number: {
            density: {
              enable: true,
            },
            value: 180,
          },
          opacity: {
            value: 0.5,
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        interactivity: {
          events: {
            onClick: {
              enable: true,
              mode: "push",
            },
          },
          modes: {
            push: {
              quantity: 4,
            },
            repulse: {
              distance: 100,
              duration: 0.4,
            },
          },
        },
        detectRetina: true,
      }}
    />
  );
}
