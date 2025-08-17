import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

function HeroSection() {
  useGSAP(() => {
    console.log("element found :", document.querySelector(".float-animate"));
    let rand20 = ((Math.random() * 10 % 2) ? -1 : 1 ) * (Math.random() * 1000) % 20;
    let rand10 = ((Math.random() * 10 % 2) ? -1 : 1 ) * (Math.random() * 1000) % 10;
    console.log("rand20 = ", rand20);
    console.log("rand10 = ", rand10);
    gsap
      .timeline()
      .from(".hero-text", {
        y: -50,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.2,
      })
      .to(".float-animate", {
        y: 0,
        x: rand10,
        duration: 3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.2,
      });
  });

  return (
    <section
      className="font-merri min-h-[33vh] bg-secondaryhero px-0 py-0 
         text-primaryhero font-bold 
        text-9xl text-center justify-center flex items-baseline 
        border-b-8 border-gray-300"
    >
      <div>
        <div className="float-animate hero-text  ">HOW IS YOUR DAY?</div>
      </div>
    </section>
  );
}

export default HeroSection;
