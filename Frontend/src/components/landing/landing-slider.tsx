"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const SLIDES = [
  { image: "/Login page/Screenshot 2026-10-07 011910.png", text: "Plan smarter. Execute faster. Deliver better." },
  { image: "/Login page/Screenshot 2026-10-07 012414.png", text: "One platform to manage projects, teams, and progress." },
  { image: "/Login page/abebe.png", text: "Turn software projects into organized, measurable results." },
  { image: "/Login page/Screenshot 2026-10-07 021910.png", text: "From tasks to delivery—everything your team needs." },
  { image: "/Image/p1.png", text: "Build better software. Manage every task. Stay on track." },
];

const INTERVAL_MS = 2500;

// A copy of the first slide sits after the last one, so the loop always keeps moving forward
// (no long backwards sweep) and snaps back to the real first slide, unseen, once it lands.
const TRACK = [...SLIDES, SLIDES[0]];

/** Full-screen landing carousel: slides move horizontally, each with its tagline and a centered "Get Started". */
export function LandingSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => Math.min(i + 1, SLIDES.length)), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div
      className="relative h-dvh min-h-[28rem] w-full overflow-hidden bg-[#4F46E5]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={cn("flex h-full will-change-transform", animate && "transition-transform duration-500 ease-in-out")}
        style={{ width: `${TRACK.length * 100}%`, transform: `translateX(-${(index * 100) / TRACK.length}%)` }}
        onTransitionEnd={() => {
          if (index !== SLIDES.length) return;
          setAnimate(false);
          setIndex(0);
          requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
        }}
      >
        {TRACK.map((slide, i) => (
          <div key={i} className="relative h-full" style={{ width: `${100 / TRACK.length}%` }}>
            <Image
              src={encodeURI(slide.image)}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#4F46E5]/35 backdrop-blur-[2px]" />
            <div className="relative flex h-full flex-col items-center justify-center px-5 pb-40 text-center sm:px-6 sm:pb-48">
              <h1 className="max-w-3xl text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">{slide.text}</h1>
            </div>
          </div>
        ))}
      </div>

      <Link href="/" className="absolute left-4 top-4 flex sm:left-6 sm:top-6 items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5] text-base font-bold text-white">
          T
        </span>
        <span className="text-lg font-semibold text-white">TaskFlow</span>
      </Link>

      <Link
        href="/login"
        className="absolute left-1/2 top-[56%] -translate-x-1/2 rounded-xl bg-[#4F46E5] px-10 py-3 text-base font-semibold sm:px-14 sm:py-4 sm:text-lg text-white shadow-lg transition-colors hover:bg-[#4338CA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Get Started
      </Link>

      <div className="absolute inset-x-0 bottom-10 flex justify-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            aria-label={`Show slide ${i + 1}`}
            onClick={() => {
              setAnimate(true);
              setIndex(i);
            }}
            className={cn("h-2 rounded-full transition-all", i === index % SLIDES.length ? "w-8 bg-white" : "w-2 bg-white/50")}
          />
        ))}
      </div>
    </div>
  );
}
