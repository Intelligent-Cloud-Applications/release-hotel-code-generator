// components/CloudAnimation.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext.jsx";
import { useEditContext } from "../context/EditModeContext.jsx";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";

import cloud01 from "../assets/Images/clouds01.png";
import cloud02 from "../assets/Images/clouds02.png";
import cloud03 from "../assets/Images/clouds03.png";
import cloud04 from "../assets/Images/clouds04.png";
import cloud05 from "../assets/Images/clouds05.png";
import cloud06 from "../assets/Images/clouds06.png";
import cloud07 from "../assets/Images/clouds07.png";
import cloud08 from "../assets/Images/clouds08.png";
import cloud09 from "../assets/Images/clouds09.png";
import cloud10 from "../assets/Images/clouds10.png";
import cloud11 from "../assets/Images/clouds11.png";
import cloud12 from "../assets/Images/clouds12.png";
import cloud13 from "../assets/Images/clouds13.png";
import cloud14 from "../assets/Images/clouds14.png";
import cloud15 from "../assets/Images/clouds15.png";


const CloudAnimation = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode, setIsEditMode } = useEditContext();
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    setIsEditMode(false);
  }, []);

  const homeSection = institutionData?.homeSection?.homeSection1 || {};

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Array of cloud images (you can adjust which clouds to use)
  const clouds = [
    {
      src: cloud01,
      delay: 0,
      duration: 1.2,
      top: "2%",
      left: "40%",
      mdTop: "5%",
      mdLeft: "65%",
      width: "70vw", // Increased for mobile
      mdWidth: "47vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: 100, // Move from right to left
    },
    {
      src: cloud02,
      delay: 0,
      duration: 1.2,
      top: "3%",
      left: "10%",
      mdTop: "6%",
      mdLeft: "18%",
      width: "70vw", // Increased for mobile
      mdWidth: "47vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: -150, // Move from left to right
    },
    {
      src: cloud03,
      delay: 0,
      duration: 1.2,
      top: "-10%",
      left: "20%",
      mdTop: "-60%",
      mdLeft: "32%",
      width: "100vw", // Increased for mobile
      mdWidth: "80vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: 80,
    },
    {
      src: cloud04,
      delay: 0,
      duration: 1.2,
      top: "0%",
      left: "35%",
      mdTop: "-45%",
      mdLeft: "45%",
      width: "100vw", // Increased for mobile
      mdWidth: "80vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: -120,
    },
    {
      src: cloud05,
      delay: 0,
      duration: 1.2,
      top: "2%",
      right: "-10%",
      mdTop: "-7%",
      mdRight: "0%",
      width: "65vw", // Increased for mobile
      mdWidth: "44vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: 90,
    },
    {
      src: cloud06,
      delay: 0,
      duration: 1.2,
      top: "0%",
      left: "5%",
      mdTop: "-41%",
      mdLeft: "8%",
      width: "75vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: -100,
    },
    {
      src: cloud07,
      delay: 0,
      duration: 1.2,
      top: "8%",
      right: "-15%",
      mdTop: "-5%",
      mdRight: "-10%",
      width: "75vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "180deg",
      opacity: 1,
      animateX: 110,
    },
    {
      src: cloud08,
      delay: 0,
      duration: 1.2,
      top: "5%",
      left: "50%",
      mdTop: "-36%",
      mdLeft: "65%",
      width: "75vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: 130,
    },
    {
      src: cloud09,
      delay: 0,
      duration: 1.2,
      top: "-5%",
      left: "-5%",
      mdTop: "-50%",
      mdLeft: "0%",
      width: "75vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: -90,
    },
    {
      src: cloud09,
      delay: 0,
      duration: 1.2,
      top: "3%",
      right: "-5%",
      mdTop: "-12%",
      mdRight: "0%",
      width: "75vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: 95,
    },
    {
      src: cloud09,
      delay: 0,
      duration: 1.2,
      top: "6%",
      right: "-15%",
      mdTop: "-18%",
      mdRight: "-10%",
      width: "75vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: -85,
    },
    {
      src: cloud09,
      delay: 0,
      duration: 1.2,
      top: "-1%",
      left: "-15%",
      mdTop: "-25%",
      mdRight: "8%",
      width: "75vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: 105,
    },
    {
      src: cloud09,
      delay: 0,
      duration: 1.2,
      top: "9%",
      right: "-5%",
      mdTop: "-15%",
      mdRight: "20%",
      width: "80vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: -110,
    },
    {
      src: cloud10,
      delay: 0,
      duration: 1.2,
      top: "10%",
      left: "-25%",
      mdTop: "-8%",
      mdLeft: "21%",
      width: "90vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: 120,
    },
    {
      src: cloud11,
      delay: 0,
      duration: 1.2,
      top: "-10%",
      left: "45%",
      mdTop: "-39%",
      mdLeft: "76%",
      width: "90vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: -95,
    },
    {
      src: cloud12,
      delay: 0,
      duration: 1.2,
      top: "-10%",
      left: "12%",
      mdTop: "-58%",
      mdLeft: "10%",
      width: "80vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: 140,
    },
    {
      src: cloud13,
      delay: 0,
      duration: 1.2,
      top: "12%",
      right: "-18%",
      mdTop: "-23%",
      mdRight: "0%",
      width: "90vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: -130,
    },
    {
      src: cloud14,
      delay: 0,
      duration: 1.2,
      top: "4%",
      left: "-32%",
      mdTop: "-10%",
      mdLeft: "-20%",
      width: "80vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: 100,
    },
    {
      src: cloud15,
      delay: 0,
      duration: 1.2,
      top: "-10%",
      left: "-20%",
      mdTop: "-39%",
      mdLeft: "-13%",
      width: "75vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: -140,
    },
    {
      src: cloud15,
      delay: 0,
      duration: 1.2,
      top: "15%",
      left: "-3%",
      mdTop: "-6%",
      mdLeft: "0%",
      width: "80vw", // Increased for mobile
      mdWidth: "56vw", // Desktop width
      height: "auto",
      angle: "0deg",
      opacity: 1,
      animateX: 115,
    },
  ];

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 overflow-hidden">
      {clouds.map((cloud, index) => (
        <motion.img
          key={index}
          src={cloud.src}
          alt={`cloud-${index}`}
          className="absolute"
          initial={{
            x: cloud.animateX || 0,
            y: -200,
            opacity: 0,
            rotate: cloud.angle || "0deg",
          }}
          animate={{
            x: 0,
            y: 0,
            opacity: cloud.opacity || 0.7,
            rotate: cloud.angle || "0deg",
          }}
          transition={{
            duration: cloud.duration || 2,
            delay: cloud.delay || 0,
            ease: "easeOut",
          }}
          style={{
            width:
              windowWidth >= 768 ? cloud.mdWidth || cloud.width : cloud.width,
            height: cloud.height,
            top: windowWidth >= 768 ? cloud.mdTop || cloud.top : cloud.top,
            left: windowWidth >= 768 ? cloud.mdLeft || cloud.left : cloud.left,
            right:
              windowWidth >= 768 ? cloud.mdRight || cloud.right : cloud.right,
          }}
        />
      ))}

      <div className="absolute top-[12%] md:top-[18%] left-1/2 transform -translate-x-1/2 z-0 w-full gap-4 px-4 md:px-0 pointer-events-auto">
        <motion.h3
          className="text-black text-center mb-2 md:mb-4 ogg uppercase"
          initial={{
            opacity: 0,
            y: -50,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1,
            delay: 0.3,
            ease: "easeOut",
          }}
          style={{
            fontSize: "clamp(18px, 4vw, 32px)",
            lineHeight: "100%",
            letterSpacing: "clamp(0.2em, 0.5vw, 0.5em)",
          }}
        >
          {isEditMode ? (
            <input
              type="text"
              value={homeSection?.tagline1}
              onChange={(e) =>
                setInstitutionData({
                  ...institutionData,
                  homeSection: {
                    ...institutionData.homeSection,
                    homeSection1: {
                      ...institutionData.homeSection.homeSection1,
                      tagline1: e.target.value,
                    },
                  },
                })
              }
              className="bg-transparent border-2 border-black border-dashed text-black text-center w-fit p-1 outline-none uppercase ogg"
              style={{
                fontSize: "clamp(18px, 4vw, 32px)",
                lineHeight: "100%",
                letterSpacing: "clamp(0.2em, 0.5vw, 0.5em)",
              }}
              placeholder="Enter tagline..."
            />
          ) : (
            homeSection.tagline1 || "HOTEL"
          )}
        </motion.h3>
        <motion.h1
          className="mt-4 md:mt-8 font-[400] text-black text-center ogg uppercase"
          initial={{
            opacity: 0,
            y: -50,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 1,
            delay: 0.5,
            ease: "easeOut",
          }}
          style={{
            fontSize: "clamp(28px, 8vw, 64px)",
            lineHeight: "100%",
            letterSpacing: "clamp(0.1em, 0.3vw, 0.5em)",
          }}
        >
          {isEditMode ? (
            <input
              type="text"
              value={homeSection?.tagline2}
              onChange={(e) =>
                setInstitutionData({
                  ...institutionData,
                  homeSection: {
                    ...institutionData?.homeSection,
                    homeSection1: {
                      ...institutionData?.homeSection?.homeSection1,
                      tagline2: e.target.value,
                    },
                  },
                })
              }
              className="bg-transparent border-2 border-black border-dashed text-black text-center w-fit p-1 outline-none uppercase ogg font-[400]"
              style={{
                fontSize: "clamp(28px, 8vw, 64px)",
                lineHeight: "100%",
                letterSpacing: "clamp(0.1em, 0.3vw, 0.5em)",
              }}
              placeholder="Enter main title..."
            />
          ) : (
            homeSection?.tagline2 || "AMRAPALLI CLASSIC"
          )}
        </motion.h1>
      </div>
    </div>
  );
};

export default CloudAnimation;
