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


  const filtered =
    selected === "All"
      ? projects
      : projects.filter((p) => p.category === selected);



  return (

<main
className="
relative
min-h-screen
w-full
max-w-full
overflow-x-hidden
bg-transparent
text-white
"
>


{/* Animated Scroll Background */}

<div className="fixed inset-0 -z-10 overflow-hidden bg-black">

<div
className="absolute inset-[-20%] transition-transform duration-300 ease-out"
style={{

transform:
`translateY(${scrollY * 0.2}px) scale(1.05)`,

background:`

radial-gradient(circle at 20% 30%, rgba(168,85,247,.45), transparent 35%),

radial-gradient(circle at 80% 20%, rgba(124,58,237,.4), transparent 35%),

radial-gradient(circle at 70% 80%, rgba(217,70,239,.35), transparent 30%),

radial-gradient(circle at 30% 80%, rgba(88,28,135,.45), transparent 35%)

`,

filter:"blur(90px)"

}}
/>


<div className="absolute inset-0 bg-black/50 backdrop-blur-[80px]" />

</div>



{/* Navbar */}

<header
className="
fixed
top-0
left-0
right-0
z-50
bg-black/20
backdrop-blur-3xl
border-b
border-white/10
"
>

<div
className="
max-w-7xl
mx-auto
h-20
px-5
md:px-6
flex
items-center
justify-between
"
>


<Image

src="/XketchPng.png"

alt="Xketch GFX"

width={220}

height={55}

className="
w-[180px]
md:w-[300px]
h-auto
"

/>


<nav
className="
hidden
md:flex
items-center
gap-5
text-lg
font-medium
"
>

{
[
"Home",
"About",
"Portfolio",
"Skills",
"Contact"

].map((item)=>(

<a

key={item}

href={`#${item.toLowerCase()}`}

className="
px-6
py-2
rounded-full
text-zinc-300
transition-all
duration-500

hover:text-white
hover:bg-purple-500/50
hover:scale-105
"

>

{item}

</a>

))

}

</nav>


</div>

</header>





{/* Hero */}

<section

className="
max-w-7xl
mx-auto
px-5
md:px-6
py-32

grid
lg:grid-cols-2

gap-10
items-center

"

>


<div>


<span

className="
px-4
py-2
rounded-full
bg-purple-600/20
border
border-purple-500/30
text-purple-300
text-sm
"

>

My Portfolio

</span>



<h1

className="
text-4xl
md:text-6xl
font-bold
tracking-tight
mt-8
leading-tight
"

>

Bringing Ideas

<span

className="
block
text-transparent
bg-gradient-to-r
from-purple-400
to-cyan-400
bg-clip-text
"

>

To Life

</span>

</h1>



<p

className="
text-zinc-400
mt-6
text-lg
leading-8
max-w-xl
"

>

Hi, I'm <b>Abhinav</b>. I create premium YouTube thumbnails,
posters, wallpapers, building plans and motion graphics with modern,
cinematic visuals.

</p>



<div className="flex flex-wrap gap-5 mt-10">


<a

href="#portfolio"

className="
px-7
py-4
rounded-2xl
border
border-white/15
hover:bg-purple-500
transition
font-semibold
"

>

View Portfolio

</a>



<a

href="#contact"

className="
px-7
py-4
rounded-2xl
border
border-white/15
bg-white/5
hover:bg-white/10
transition
"

>

Hire Me

</a>


</div>



<div

className="
grid
grid-cols-1
sm:grid-cols-3
gap-5
mt-14
"

>


{
[
["250+","Projects"],
["4+","Years"],
["100%","Creative"]

].map(([num,text])=>(


<div

key={text}

className="
rounded-3xl
bg-white/5
border
border-white/10
p-5
"

>

<h2 className="text-3xl font-bold text-purple-400">

{num}

</h2>

<p className="text-zinc-500 mt-1">

{text}

</p>


</div>


))

}


</div>


</div>





<div className="relative flex justify-center items-center">


<div

className="
absolute
w-[300px]
h-[300px]
md:w-[480px]
md:h-[480px]
rounded-full
bg-purple-600/25
blur-[140px]
"

/>



<div

className="
relative
w-[280px]
h-[280px]
md:w-[430px]
md:h-[430px]
rounded-full
overflow-hidden
border
border-white/10
shadow-2xl
flex
items-center
justify-center
"

>


<Image

src="/Mypc.png"

alt="Profile"

width={450}

height={450}

className="
w-[180px]
md:w-[300px]
h-auto
"

priority

/>


</div>


</div>



</section>
{/* About */}

<section
id="about"
className="
max-w-7xl
mx-auto
px-5
md:px-6
py-24
grid
lg:grid-cols-2
gap-12
"
>


<div
className="
rounded-[35px]
bg-white/5
border
border-white/10
p-5
md:p-10
"
>


<p className="uppercase tracking-[5px] text-purple-400 text-sm">
About Me
</p>


<h2
className="
text-4xl
md:text-6xl
font-bold
tracking-tight
mt-8
leading-tight
"
>

Graphic Designer &

<span className="text-purple-400">
 Architect
</span>

</h2>


<p className="text-zinc-400 mt-6 leading-8">

I specialize in creating eye-catching thumbnails,
cinematic posters, wallpapers, branding, UI concepts
and motion graphics. Every project is designed with
attention to detail and modern aesthetics.

</p>



<div className="mt-10">


<div
className="
grid
grid-cols-1
sm:grid-cols-3
gap-4
"
>

{

[
["250+","Projects"],
["4+","Years"],
["100%","Creativity"]

].map(([num,text])=>(

<div
key={text}
className="
rounded-2xl
border
border-white/10
bg-white/5
p-4
text-center
"
>

<h3 className="text-3xl font-black text-purple-400">
{num}
</h3>

<p className="mt-1 text-sm text-gray-400">
{text}
</p>

</div>

))

}

</div>



<div className="mt-10">

<h3 className="text-lg font-bold mb-4">
What I Create
</h3>


<div className="flex flex-wrap gap-3">


{
[
"YouTube Thumbnails",
"Posters",
"Wallpapers",
"Motion Graphics",
"UI Concepts",
"Branding"

].map(item=>(


<span
key={item}
className="
rounded-full
border
border-purple-500/30
bg-purple-500/10
px-4
py-2
text-sm
text-purple-300
"
>

{item}

</span>


))

}


</div>

</div>




<div
className="
mt-8
rounded-2xl
border
border-purple-500/20
bg-purple-500/10
p-5
"
>


<p className="text-xs uppercase tracking-[0.3em] text-purple-400">

Currently

</p>


<p className="mt-2 text-gray-300 leading-7">

Building my creative portfolio while studying
<b> B.Arch</b>, exploring UI/UX, motion graphics,
and cinematic visual design.

</p>


</div>


</div>


</div>






<div
className="
rounded-[32px]
border
border-white/10
bg-white/5
p-6
md:p-8
"
>


<p className="
text-sm
tracking-[0.35em]
text-purple-400
uppercase
mb-8
">

My Journey

</p>



<div className="relative border-l border-purple-500/30 ml-3">


{

[

{
year:"2022",
title:"Started Graphic Design",
desc:"Learned Photoshop and began creating thumbnails & posters."
},

{
year:"2023",
title:"Motion Graphics",
desc:"Started working with After Effects and video editing."
},

{
year:"2024",
title:"Creative Expansion",
desc:"Explored UI concepts, branding and wallpaper design."
},

{
year:"2025",
title:"Architecture & Portfolio",
desc:"Studying B.Arch while completing creative projects."
},

{
year:"2026",
title:"Currently Studying B.Arch",
desc:"Designing buildings and construction works."
}


].map(item=>(


<div
key={item.year}
className="
relative
mb-10
pl-8
last:mb-0
"
>


<div
className="
absolute
-left-[11px]
top-1
h-5
w-5
rounded-full
border-4
border-black
bg-purple-500
"
/>



<span className="text-sm font-semibold text-purple-400">

{item.year}

</span>



<h3 className="mt-1 text-xl font-bold">

{item.title}

</h3>



<p className="mt-2 text-gray-400 leading-7">

{item.desc}

</p>


</div>


))


}


</div>


</div>


</section>







{/* Portfolio */}


<section
id="portfolio"
className="
max-w-7xl
mx-auto
px-5
md:px-6
pb-24
"
>


<h2
className="
text-4xl
md:text-5xl
font-bold
tracking-tight
mb-6
"
>

Featured

<span className="text-purple-400">
 Projects
</span>


</h2>



<div className="flex flex-wrap gap-3 mb-10">


{
categories.map(cat=>(


<button

key={cat}

onClick={()=>setSelected(cat)}

className={`
px-5
py-2
rounded-full
transition

${
selected===cat
?
"bg-purple-600"
:
"bg-white/5 border border-white/10 hover:bg-white/10"
}

`}

>

{cat}

</button>


))

}


</div>





<div
className="
grid
grid-cols-1
sm:grid-cols-2
lg:grid-cols-3
gap-8
"
>


{

filtered.map(item=>(


<div

key={item.title}

className="
group
rounded-[30px]
overflow-hidden
border
border-white/10
bg-white/5
"

>


<div className="overflow-hidden">


{

item.video ?

(

<video

src={item.video}

autoPlay

muted

loop

playsInline

className="
w-full
h-64
object-cover
group-hover:scale-110
transition
duration-500
"

/>

)

:

(

<Image

src={item.image!}

alt={item.title}

width={600}

height={400}

className="
w-full
h-64
object-cover
group-hover:scale-110
transition
duration-500
"

/>

)

}


</div>



<div className="p-6">


<p className="text-purple-400 text-sm">

{item.category}

</p>


<h3 className="text-2xl font-bold mt-2">

{item.title}

</h3>


</div>


</div>


))


}


</div>


</section>





{/* Skills */}

<section
id="skills"
className="
max-w-7xl
mx-auto
px-5
md:px-6
py-24
"
>


<h2 className="
text-4xl
md:text-5xl
font-bold
mb-10
">

<span className="text-purple-400">
Skills
</span>

</h2>


<div
className="
grid
grid-cols-1
md:grid-cols-2
gap-6
"
>


{

[
["Adobe Photoshop","Expert",95,"🎨"],
["After Effects","Advanced",90,"🎬"],
["Premiere Pro","Advanced",85,"🎞️"],
["AutoCAD","Intermediate",75,"📐"]

].map(([title,level,percent,emoji])=>(


<div

key={title as string}

className="
rounded-3xl
border
border-white/10
bg-white/5
p-6
hover:border-purple-500
transition
"

>


<div className="flex justify-between items-center">


<div className="flex gap-4 items-center">


<div className="
w-14
h-14
rounded-2xl
bg-purple-500/10
flex
items-center
justify-center
text-3xl
">

{emoji}

</div>


<div>

<h3 className="text-xl font-bold">

{title}

</h3>

<p className="text-gray-400">

{level}

</p>

</div>


</div>


<span className="text-purple-400 font-bold">

{percent}%

</span>


</div>



<div className="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">

<div

className="
h-full
bg-gradient-to-r
from-purple-500
to-violet-400
rounded-full
"

style={{
width:`${percent}%`
}}

/>

</div>



</div>


))


}


</div>


</section>
{/* Services */}

<section
className="
max-w-7xl
mx-auto
px-5
md:px-6
pb-24
"
>

<h2
className="
text-4xl
md:text-5xl
font-bold
mb-10
"
>

<span className="text-purple-400">
Services
</span>

</h2>



<div
className="
grid
grid-cols-1
md:grid-cols-2
lg:grid-cols-3
gap-8
"
>


{

[
"YouTube Thumbnails",
"Gaming Posters",
"3D Modelling",
"UI/UX Design",
"Motion Graphics",
"Building Plans"

].map(service=>(


<div

key={service}

className="
rounded-3xl
bg-white/5
border
border-white/10
p-6
md:p-8
hover:border-purple-500
hover:-translate-y-2
transition
"

>


<h3 className="text-2xl font-bold mb-4">

{service}

</h3>



<p className="text-zinc-400 leading-7">

High-quality professional designs tailored
to your style and brand.

</p>


</div>


))


}


</div>


</section>






{/* Contact */}


<section

id="contact"

className="
max-w-5xl
mx-auto
px-5
md:px-6
pb-24
"

>


<div

className="
rounded-[35px]
bg-white/5
border
border-white/10
p-6
md:p-12
text-center
"

>


<h2

className="
text-4xl
md:text-5xl
font-bold
leading-tight
"

>

Let's Work

<span className="text-purple-400">
 Together
</span>


</h2>




<p

className="
text-zinc-400
mt-5
max-w-2xl
mx-auto
leading-7
"

>

Need stunning thumbnails, posters, wallpapers
or motion graphics? Get in touch and let's
create something amazing.

</p>





<div

className="
flex
flex-wrap
justify-center
gap-5
mt-10
"

>


<a

href="https://t.me/Deyn_Zypher"

target="_blank"

className="
px-7
py-4
rounded-2xl
border
border-white/10
bg-white/5
hover:bg-purple-500
transition
"

>

Telegram

</a>




<a

href="https://instagram.com/xketch.gfx"

target="_blank"

className="
px-7
py-4
rounded-2xl
border
border-white/10
bg-white/5
hover:bg-purple-500
transition
"

>

Instagram

</a>





<a

href="mailto:abhinav866313@gmail.com"

className="
px-7
py-4
rounded-2xl
border
border-white/10
bg-white/5
hover:bg-purple-500
transition
"

>

Email

</a>



</div>



</div>


</section>








{/* Footer */}


<footer

className="
border-t
border-white/10
py-10
text-center
text-zinc-500
"

>


<h2 className="
text-2xl
font-bold
text-white
">

Xketch

<span className="text-purple-400">
 GFX
</span>


</h2>



<p className="mt-3">

Graphic Designer • Motion Artist • Creative Editor

</p>




<p className="mt-6 text-sm">

© {new Date().getFullYear()} Xketch GFX.
All Rights Reserved.

</p>



</footer>



</main>

  );
}