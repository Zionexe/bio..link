
"use client";

import React from "react";
import { FiChevronDown } from "react-icons/fi";

import ShaderBackground from "@/components/background/ShaderBackground";
import PresenceWithLyrics from "@/app/components/PresenceWithLyrics";
import TechIcon from "@/app/components/TechIcon";
import GithubReadme from "@/components/GithubReadme";

import { links } from "@/app/data/links";
import { tech } from "@/app/data/tech";

export default function Home() {
  const scrollToReadme = () => {
    document
      .getElementById("readme")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <>
<ShaderBackground   color={[1.0, 1.0, 1.0]}   speedMultiplier={1.0} />

      <main className="relative z-10 w-full">
        <section className="relative flex min-h-[100svh] w-full items-center justify-center px-4 py-16 sm:px-6">
          <div className="flex w-full max-w-[540px] flex-col items-center gap-7">

            {/* Profile */}
            <section className="fade-in-up flex flex-col items-center text-center">
              <h1 className="heading-font avatar-gradient-text text-5xl font-extrabold tracking-tight sm:text-6xl drop-shadow-[0_0_24px_rgba(255,255,255,0.5)]">
                Zion
              </h1>

              <p className="mt-3.5 max-w-sm text-sm leading-relaxed text-zinc-400 font-normal">
                passionate developer creating products for everyone.
              </p>

              <p className="heading-font source-gradient-text text-sm font-extrabold tracking-tight drop-shadow-[0_0_24px_rgba(255,255,255,0.5)]">
                you can download this source.
              </p>

              {/* Social Links */}
              <div className="mt-5 flex items-center gap-3">
                {links.map((item) => {
                  const Icon = item.icon;
                  const external = item.href.startsWith("http");

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      aria-label={item.label}
                      {...(external
                        ? {
                            target: "_blank",
                            rel: "noreferrer",
                          }
                        : {})}
                      className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-black/40 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.16)]"
                    >
                      <Icon
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        aria-hidden="true"
                      />
                    </a>
                  );
                })}
              </div>
            </section>

            {/* Spotify / Lyrics */}
            <PresenceWithLyrics />

            {/* Projects */}
            <section className="fade-in-up delay-2 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">

              {/* Valtrix */}
              <a
                href="https://discord.gg/valtrix"
                target="_blank"
                rel="noreferrer"
                className="group relative flex min-h-[160px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-black/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-start gap-3">
                  <span className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/50 p-1.5 shadow-inner transition-transform duration-300 group-hover:scale-105">
                    <img
                      src="https://cdn.discordapp.com/icons/1520993708135284868/b8b5575354119f3e5397ee7338d8e00f.webp?size=1024"
                      alt="Valtrix"
                      className="h-full w-full rounded-md object-contain"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-100 transition-colors group-hover:text-white">
                          Valtrix
                        </p>

                        <p className="mt-0.5 text-[10px] text-zinc-500">
                          Aug 2026 - present
                        </p>
                      </div>

                      <svg
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-600 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-300"
                        aria-hidden="true"
                      >
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                  Valtrix — Premium moderation, security, and ticket
                  management. One bot. Total control.
                </p>
              </a>

              {/* Velocity Shop */}
              <a
                href="https://discord.gg/velocityshop"
                target="_blank"
                rel="noreferrer"
                className="group relative flex min-h-[160px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-black/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-start gap-3">
                  <span className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/50 p-1.5 shadow-inner transition-transform duration-300 group-hover:scale-105">
                    <img
                      src="https://cdn.discordapp.com/icons/972563890934251580/fb620d172a1ec8b92db2a73c9f12b91c.webp?size=1024"
                      alt="Velocity Shop"
                      className="h-full w-full rounded-md object-contain"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-100 transition-colors group-hover:text-white">
                          VelocityShop
                        </p>

                        <p className="mt-0.5 text-[10px] text-zinc-500">
                          Sep 2026 - present
                        </p>
                      </div>

                      <svg
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-600 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-300"
                        aria-hidden="true"
                      >
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                  Premium FiveM assets, vehicles, clothing, scripts, and
                  server-ready resources — built to elevate your server.
                  <br />
                  <br />
                  Quality. Performance. Velocity.
                </p>
              </a>
            </section>

            {/* Tech Stack */}
            <section className="fade-in-up delay-3 w-full marquee-wrap py-1">
              <div className="marquee-track">
                {[...tech, ...tech, ...tech].map((tool, index) => (
                  <a
                    key={`${tool.label}-${index}`}
                    href={tool.href}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-pill gap-1.5 text-[11px] font-medium lowercase text-zinc-400 hover:text-white transition-all"
                  >
                    <TechIcon name={tool.label} />
                    {tool.label}
                  </a>
                ))}
              </div>
            </section>
          </div>

          {/* Scroll Button */}
          <button
            type="button"
            onClick={scrollToReadme}
            aria-label="Scroll down to README"
            className="absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-zinc-500 transition-colors hover:text-white"
          >
            <span className="text-[10px] uppercase tracking-[0.3em]">
              scroll
            </span>

            <FiChevronDown
              className="h-5 w-5 animate-bounce"
              aria-hidden="true"
            />
          </button>
        </section>

        {/* README */}
        <section
          id="readme"
          className="w-full scroll-mt-6 px-4 pb-20 sm:px-6"
        >
          <div className="mx-auto w-full max-w-[540px]">
            <GithubReadme />
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-8 text-center">
          <p
            className="text-[11px] text-zinc-500"
            style={{
              fontFamily:
                "var(--font-ibm-plex-mono), monospace",
            }}
          >
            &copy; {new Date().getFullYear()} Zion &middot;{" "}
            <a
              href="https://github.com/zionexe"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              github
            </a>
          </p>
        </footer>
      </main>
    </>
  );
}
