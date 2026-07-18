"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Space_Grotesk } from "next/font/google";


const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
});

type Project = {
  title: string;
  category: string;
  image?: string;
  video?: string;
};

const projects: Project[] = [
  {
    title: "YouTube Thumbnail",
    category: "Live Stream Thumbnails",
    image: "/Thumbnail.jpg",
  },
  {
    title: "Gaming Poster",
    category: "Poster Design",
    image: "/Gaming.png",
  },
  {
    title: "Sports Posters",
    category: "Poster",
    image: "/Arsenal.png",
  },
  {
    title: "Desktop Wallpapers",
    category: "Wallpaper",
    image: "/Wallpaper.png",
  },
  {
    title: "Motion Graphics",
    category: "Animation",
    video: "/Render.mp4",
  },
  {
    title: "Birthday Posters",
    category: "Poster",
    image: "/Birthday.png",
  },
];

export default function Home() {
  const [selected, setSelected] = useState("All");
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("#home");

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  

  const categories = [
    "All",
    "Thumbnail Design",
    "Poster Design",
    "Wallpaper",
    "UI/UX",
    "Animation",
    "Banner",
  ];

  const links = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Roms", href: "#Rom" },
    { name: "Projects", href: "#portfolio" },
    { name: "Contact", href: "#contact" },
  ];

  const filtered =
    selected === "All"
      ? projects
      : projects.filter((p) => p.category === selected);

  return (
    <main className="min-h-screen bg-transparent text-white overflow-x-hidden">

      {/* Scroll Reactive Premium Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
        <div
          className="absolute inset-[-20%] transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(${scrollY * 0.5}px) scale(${1 + scrollY * 0.001})`,
            background: `
              radial-gradient(circle at 20% 30%, rgba(168,85,247,0.45), transparent 35%),
              radial-gradient(circle at 80% 20%, rgba(124,58,237,0.4), transparent 35%),
              radial-gradient(circle at 70% 80%, rgba(217,70,239,0.35), transparent 30%),
              radial-gradient(circle at 30% 80%, rgba(88,28,135,0.45), transparent 35%)
            `,
            filter: "blur(90px)",
          }}
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[80px]" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto h-16 sm:h-19 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center">
              <Image
                src="/XketchPng.png"
                alt="Xketch GFX"
                width={220}
                height={55}
                className="w-[180px] sm:w-[260px] md:w-[300px] h-auto"
                priority
              />
            </div>
          </div>

          {/* Desktop Navigation */}
<nav className="hidden md:flex items-center gap-2 lg:gap-5 text-base lg:text-lg font-medium">
  {links.map((link) => (
    <a
      key={link.name}
      href={link.href}
      onClick={(e) => {
        e.preventDefault();

        setActiveLink(link.href);

        document.querySelector(link.href)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }}
      className={`
        relative px-4 lg:px-6 py-1.5 rounded-full
        transition-all duration-500 ease-out
        before:absolute before:inset-0 before:rounded-full
        before:bg-gradient-to-b before:from-white/15 before:to-transparent

        ${
          activeLink === link.href
            ? `
              text-white
              bg-purple-500/50
              border border-purple-500
              shadow-[0_0_30px_rgba(168,85,247,0.25)]
              scale-105
              before:opacity-100
            `
            : `
              text-zinc-300
              border border-white/0
              before:opacity-0
              hover:text-white
              hover:bg-purple-500/50
              hover:border-purple-500
              hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]
              hover:scale-105
              hover:before:opacity-100
            `
        }
      `}
    >
      <span className="relative z-10">{link.name}</span>
    </a>
  ))}
</nav>
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-300 hover:text-white focus:outline-none transition-transform active:scale-95"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

     {/* Premium Horizontal Mobile Navigation Dropdown */}
{mobileMenuOpen && (
  <nav className="md:hidden border-t border-white/10 bg-transparent px-4 py-3 flex flex-row gap-2 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]">
    {links.map((link) => (
      <a
        key={link.name}
        href={link.href}
        onClick={() => {
  setActiveLink(link.href);
}}
        className={`
          relative
          px-4 py-1.5
          rounded-full
          whitespace-nowrap
          text-sm
          font-medium
          transition-all
          duration-300
          ease-out
          before:absolute
          before:inset-0
          before:rounded-full
          before:bg-gradient-to-b
          before:from-white/15
          before:to-transparent

          ${
            activeLink === link.href
              ? `
                text-white
                bg-purple-500/40
                border border-purple-500/80
                shadow-[0_0_20px_rgba(168,85,247,0.25)]
                before:opacity-100
              `
              : `
                text-zinc-300
                border border-white/0
                before:opacity-0
                hover:text-white
                hover:bg-purple-500/40
                hover:border-purple-500/80
                hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]
                hover:before:opacity-100
              `
          }

          active:scale-95
        `}
      >
        <span className="relative z-10">{link.name}</span>
      </a>
    ))}
  </nav>
)}
      </header>

      {/* Hero */}
{/* Hero */}
<section
  id="home"
  className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
>

  {/* Left Side */}
  <div className="order-2 lg:order-1 text-center lg:text-left">
    <span className="inline-block px-4 py-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm">
      My Portfolio
    </span>

    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mt-6 lg:mt-8 leading-tight">
      Bringing Ideas
      <span className="block text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text">
        To Life
      </span>
    </h1>

    <p className="text-zinc-400 mt-6 text-base sm:text-lg leading-7 max-w-xl mx-auto lg:mx-0">
      Hi, I'm <b>Abhinav</b>. I create premium YouTube thumbnails,
      posters, wallpapers, Building Plans and motion graphics with modern,
      cinematic visuals.
    </p>

    <div className="flex justify-center lg:justify-start gap-4 sm:gap-5 mt-8 lg:mt-10">
      <a
        href="#portfolio"
        className="px-5 sm:px-7 py-3 sm:py-4 text-sm sm:text-base rounded-2xl border border-white/15  bg-white/5 hover:bg-purple-500/90 transition font-semibold"
      >
        View Portfolio
      </a>

      <a
        href="#contact"
        className="px-5 sm:px-7 py-3 sm:py-4 text-sm sm:text-base rounded-2xl border border-white/15 bg-white/5 hover:bg-purple-500/90 transition"
      >
        Hire Me
      </a>
    </div>

    <div className="grid grid-cols-3 gap-3 sm:gap-5 mt-10 lg:mt-14">
      <div className="rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 p-3 sm:p-5">
        <h2 className="text-xl sm:text-3xl font-bold text-purple-400">
          250+
        </h2>
        <p className="text-zinc-500 text-xs sm:text-sm mt-1">Projects</p>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 p-3 sm:p-5">
        <h2 className="text-xl sm:text-3xl font-bold text-purple-400">
          4+
        </h2>
        <p className="text-zinc-500 text-xs sm:text-sm mt-1">Years</p>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 p-3 sm:p-5">
        <h2 className="text-xl sm:text-3xl font-bold text-purple-400">
          100%
        </h2>
        <p className="text-zinc-500 text-xs sm:text-sm mt-1">Creative</p>
      </div>
    </div>
  </div>

  {/* Right Side */}
  <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end">

    {/* Glow */}
    <div className="absolute w-[280px] sm:w-[480px] h-[280px] sm:h-[480px] rounded-full bg-purple-600/25 blur-[80px] sm:blur-[140px]" />

    {/* Circle Frame */}
    <div className="relative w-[280px] sm:w-[430px] h-[280px] sm:h-[430px] rounded-full overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
      <Image
        src="/Mypc.png"
        alt="Profile"
        width={450}
        height={450}
        className="object-cover object-center translate-y-8 scale-100"
        priority
      />
    </div>

  </div>

</section>

 {/* Rom Development */}
      <section id="Rom" className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 lg:pb-12">
        <div className="rounded-[24px] sm:rounded-[35px] bg-white/5 border border-white/10 p-8 sm:p-12 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">
            Custom Rom <span className="text-purple-400"> Development</span>
          </h2>

          <p className="text-zinc-400 mt-4 text-sm sm:text-base max-w-2xl mx-auto">
            I made Custom Port Roms for Redmi note 12 5G & POCO X5 5G which users can use freely and smoothly.
          </p>
           <p className="text-purple-400/90 mt-4 text-sm sm:text-base max-w-2xl mx-auto">
            Are you intrested in Custom Roms ? Then Take a look at this Button Below.
           </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 sm:mt-10">
            <a
              href="https://zypheros.vercel.app/"
              target="_blank"
              className="px-7 py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 hover:bg-purple-500 text-center transition"
            >
              Click Here
            </a>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="rounded-[24px] sm:rounded-[35px] bg-white/5 border border-white/10 p-6 sm:p-10">
          <p className="uppercase tracking-[3px] sm:tracking-[5px] text-purple-400 text-xs sm:text-sm">
            About Me
          </p>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mt-6 sm:mt-8 leading-tight">
            Graphic Designer &
            <span className="text-purple-400"> Architect</span>
          </h2>

          <p className="text-zinc-400 mt-6 text-sm sm:text-base leading-7 sm:leading-8">
            I specialize in creating eye-catching thumbnails, cinematic posters,
            wallpapers, branding, UI concepts and motion graphics. Every project
            is designed with attention to detail and modern aesthetics.
          </p>

          <div className="mt-8 sm:mt-10 space-y-6 sm:space-y-8">
            {/* Quick Stats Container */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 text-center">
                <h3 className="text-xl sm:text-3xl font-black text-purple-400">250+</h3>
                <p className="mt-1 text-xs text-gray-400">Projects</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 text-center">
                <h3 className="text-xl sm:text-3xl font-black text-purple-400">4+</h3>
                <p className="mt-1 text-xs text-gray-400">Years</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 text-center">
                <h3 className="text-xl sm:text-3xl font-black text-purple-400">100%</h3>
                <p className="mt-1 text-xs text-gray-400">Creativity</p>
              </div>
            </div>

            {/* Services inside About */}
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:text-white">
                What I Create
              </h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {[
                  "YouTube Thumbnails",
                  "Posters",
                  "Wallpapers",
                  "Motion Graphics",
                  "UI Concepts",
                  "Branding",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-purple-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Current Focus */}
            <div className="rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-purple-400">
                Currently
              </p>
              <p className="mt-2 text-sm sm:text-base text-gray-300 leading-6 sm:leading-7">
                Building my creative portfolio while studying <b>B.Arch</b>,
                exploring UI/UX, motion graphics, and cinematic visual design.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-[24px] sm:rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
          <p className="text-xs sm:text-sm tracking-[0.25em] sm:tracking-[0.35em] text-purple-400 uppercase mb-6 sm:mb-8">
            My Journey
          </p>

          <div className="relative border-l border-purple-500/30 ml-2 sm:ml-3">
            {[
              {
                year: "2022",
                title: "Started Graphic Design",
                desc: "Learned Photoshop and began creating thumbnails & posters.",
              },
              {
                year: "2023",
                title: "Motion Graphics",
                desc: "Started working with After Effects and video editing.",
              },
              {
                year: "2024",
                title: "Creative Expansion",
                desc: "Explored UI concepts, branding and wallpaper design.",
              },
              {
                year: "2025",
                title: "Architecture & Portfolio",
                desc: "Studying B.Arch while completing 250+ creative projects.",
              },
              {
                year: "2026",
                title: "Currently Studying B.Arch",
                desc: "To Design Buildings & Construction Works.",
              },
            ].map((item) => (
              <div key={item.year} className="relative mb-8 sm:mb-10 pl-6 sm:pl-8 last:mb-0">
                <div className="absolute -left-[7px] sm:-left-[11px] top-1 h-3 w-3 sm:h-5 sm:w-5 rounded-full border-2 sm:border-4 border-black bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]" />
                <span className="text-xs sm:text-sm font-semibold text-purple-400">
                  {item.year}
                </span>
                <h3 className="mt-1 text-lg sm:text-xl font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-gray-400 leading-6 sm:leading-7">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section id="portfolio" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 lg:pb-24">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
          Featured <span className="text-purple-400">Projects</span>
        </h2>

        {/* Filter Categories horizontally scrollable on mobile */}
        <div className="flex overflow-x-auto pb-3 mb-8 gap-2 no-scrollbar scrollbar-none snap-x mask-gradient">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelected(cat)}
              className={`px-4 sm:px-5 py-2 rounded-full whitespace-nowrap text-sm transition snap-center ${
                selected === cat
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((item) => (
            <div
              key={item.title}
              className="group rounded-[24px] sm:rounded-[30px] overflow-hidden border border-white/10 bg-white/5"
            >
              <div className="relative w-full aspect-video overflow-hidden">
                {item.video ? (
                  <video
                    src={item.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                ) : (
                  <Image
                    src={item.image!}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition duration-500"
                  />
                )}
              </div>

              <div className="p-5 sm:p-6">
                <p className="text-purple-400 text-xs sm:text-sm">
                  {item.category}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:text-white">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section id="skills" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-8">
          <span className="text-purple-400">Skills</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {[
            { title: "Adobe Photoshop", level: "Expert", percent: 95, emoji: "🎨" },
            { title: "After Effects", level: "Advanced", percent: 90, emoji: "🎬" },
            { title: "Premiere Pro", level: "Advanced", percent: 85, emoji: "🎞️" },
            { title: "AutoCAD", level: "Intermediate", percent: 75, emoji: "📐" },
          ].map((skill) => (
            <div
              key={skill.title}
              className="group rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-5 sm:p-6 transition-all duration-300 hover:border-purple-500 hover:shadow-[0_0_35px_rgba(168,85,247,0.25)] md:hover:-translate-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-purple-500/10 text-2xl sm:text-3xl transition group-hover:scale-110">
                    {skill.emoji}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      {skill.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      {skill.level}
                    </p>
                  </div>
                </div>
                <span className="text-base sm:text-lg font-bold text-purple-400">
                  {skill.percent}%
                </span>
              </div>

              <div className="mt-5 sm:mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all duration-700"
                  style={{ width: `${skill.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 lg:pb-24">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-8">
          <span className="text-purple-400">Services</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            "YouTube Thumbnails",
            "Gaming Posters",
            "3D Modelling",
            "UI/UX Design",
            "Motion Graphics",
            "Building Plans",
          ].map((service) => (
            <div
              key={service}
              className="rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 hover:border-purple-500 md:hover:-translate-y-2 transition duration-300"
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                {service}
              </h3>
              <p className="text-zinc-400 text-sm sm:text-base">
                High-quality professional designs tailored to your style and brand.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 lg:pb-12">
        <div className="rounded-[24px] sm:rounded-[35px] bg-white/5 border border-white/10 p-8 sm:p-12 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">
            Let's Work <span className="text-purple-400"> Together</span>
          </h2>

          <p className="text-zinc-400 mt-4 text-sm sm:text-base max-w-2xl mx-auto">
            Need stunning thumbnails, posters, wallpapers or motion graphics? Get in touch and let's create something amazing.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 sm:mt-10">
            <a
              href="https://t.me/Deyn_Zypher"
              target="_blank"
              className="px-7 py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 hover:bg-purple-500 text-center transition"
            >
              Telegram
            </a>
            <a
              href="https://instagram.com/xketch.gfx"
              target="_blank"
              className="px-7 py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 hover:bg-purple-500 text-center transition"
            >
              Instagram
            </a>
            <a
              href="mailto:abhinav866313@gmail.com"
              className="px-7 py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 hover:bg-purple-500 text-center transition"
            >
              Email
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4">
  <div className="flex justify-center items-center">
    <div className="w-[200px] h-[50px] overflow-hidden flex justify-center items-center">
      <Image
        src="/XketchPng.png"
        alt="Xketch GFX"
        width={300}
        height={150}
        className="scale-170"
      />
    </div>
  </div>

  <p className="mt-4 text-center text-zinc-400">
    Graphic Designer • Architect • Creative Editor
  </p>

  <p className="mt-2 text-center text-sm text-zinc-400">
    © 2026 Xketch GFX. All Rights Reserved.
  </p>
</footer>
    </main>
  );
}