import React from "react";
import { motion } from "framer-motion";
import bgTexture from "../assets/Images/bgTexture.png";
import image1 from "../assets/Images/img1.jpg";
import image2 from "../assets/Images/img2.jpg";
import scribble from "../assets/Images/scribble.png";
import { useAppContext } from "../context/AppContext.jsx";
import { useEditContext } from "../context/EditModeContext.jsx";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";

const HeroSection3 = () => {
  const { institutionData, setInstitutionData } = useInstitutionContext();
  const { isEditMode, setIsEditMode } = useEditContext();

  const heroSection3 = institutionData?.homeSection?.homeSection4 || {};

  console.log(heroSection3);


  return (
    <div className="md:h-screen bg-champagne relative py-12 md:py-0">
      {/* Subtle Gold Tint Overlay */}
      <div className="absolute inset-0 w-full h-full z-0 bg-gold opacity-5 pointer-events-none"></div>

      <div className="flex flex-col items-center justify-center h-full relative z-20 px-4 uppercase">
        <motion.div
          className={`relative ${isEditMode ? "hidden" : ""}`}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h1
            className="text-center leading-none"
            style={{
              fontFamily: "Poppins",
              fontWeight: 800,
              fontSize: "clamp(60px, 15vw, 225px)",
              lineHeight: "clamp(52px, 13vw, 194.25px)",
              letterSpacing: "0%",
              display: isEditMode ? "hidden" : "",
            }}
          >
            {heroSection3?.title1 || "WE'RE"}
          </h1>
          <h1
            className="text-center leading-none"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            viewport={{ once: true }}
            style={{
              fontFamily: "Poppins",
              fontWeight: 800,
              fontSize: "clamp(60px, 15vw, 225px)",
              lineHeight: "clamp(52px, 13vw, 194.25px)",
              letterSpacing: "0%",
            }}
          >
            {heroSection3?.title2 || "THE"}
          </h1>
          <h1
            className="text-center leading-none"
            style={{
              fontFamily: "Poppins",
              fontWeight: 800,
              fontSize: "clamp(60px, 15vw, 225px)",
              lineHeight: "clamp(52px, 13vw, 194.25px)",
              letterSpacing: "0%",
            }}
          >
            {heroSection3?.title3 || "BEST"}
          </h1>

          <motion.p
            className="absolute top-[1vh] -right-[8vw] md:-right-[8vw] w-[35vw] md:w-[8vw] text-start z-50 hidden md:block"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            viewport={{ once: true }}
            style={{
              fontFamily: "Poppins",
              fontWeight: 500,
              fontSize: "clamp(10px, 1.5vw, 13.5px)",
              lineHeight: "clamp(18px, 2.5vw, 26.25px)",
              letterSpacing: "0%",
            }}
          >
            {heroSection3?.textRight ||
              "Hotel is accessible and approachable With Interior designed."}
          </motion.p>
          <div className="absolute top-[11vh] -right-[13vw] w-[12vw] z-50 hidden md:block">
            <img
              src={scribble}
              alt="Scribble"
              className="w-[12vw] h-auto text-black "
            />
          </div>

          <motion.p
            className="absolute -bottom-[8vh] -left-[15vw] md:-left-[15vw] w-[60vw] md:w-[19vw] text-start z-50 poppins font-[500] hidden md:block"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
            style={{
              fontSize: "clamp(10px, 1.5vw, 13.5px)",
              lineHeight: "clamp(18px, 2.5vw, 26.25px)",
            }}
          >
            {heroSection3?.textLeft ||
              "Experience a blend of accessibility and approachability with our thoughtfully designed interiors."}
          </motion.p>
        </motion.div>

        <motion.img
          src={heroSection3?.img1 || image1}
          alt="Image 1"
          className="absolute hidden md:block h-20 top-0 left-0 md:h-[62vh] md:w-[45vh] md:top-[45vh] md:left-[calc(50%-35vh)] transform -translate-y-1/2 -translate-x-1/2 object-cover rounded-lg shadow-lg"
          initial={{ opacity: 0, x: -200, rotate: 0 }}
          whileInView={{ opacity: 1, x: 0, rotate: 13.7 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          viewport={{ once: true }}
          style={{ rotate: "13.7deg" }}
        />
        <motion.img
          src={heroSection3?.img1 || image1}
          alt="Image 1"
          className="absolute md:hidden top-2/5 left-22 h-[20vh] w-[15vh]   transform -translate-y-1/2 -translate-x-1/2 object-cover rounded-lg shadow-lg"
          initial={{ opacity: 0, x: -50, rotate: 0 }}
          whileInView={{ opacity: 1, x: 0, rotate: 13.7 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          viewport={{ once: true }}
          style={{ rotate: "13.7deg" }}
        />
        <motion.img
          src={heroSection3?.img2 || image2}
          alt="Image 2"
          className="absolute top-2/3 right-0 h-[20vh] w-[15vh] md:h-[55vh] md:w-[35vh]  md:top-[60vh] md:right-[calc(50%-65vh)] transform -translate-y-1/2 -translate-x-1/2 object-cover rounded-lg shadow-lg"
          initial={{ opacity: 0, x: 200, rotate: 0 }}
          whileInView={{ opacity: 1, x: 0, rotate: -13.7 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          viewport={{ once: true }}
          style={{ rotate: "-13.7deg" }}
        />
        <motion.div
          className="absolute"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          viewport={{ once: true }}
        >
          <h1
            className="text-center leading-none"
            style={{
              fontFamily: "Poppins",
              fontWeight: 800,
              fontSize: "clamp(60px, 15vw, 225px)",
              lineHeight: "clamp(52px, 13vw, 194.25px)",
              letterSpacing: "0%",
              color: "transparent",
              WebkitTextStroke: "clamp(1px, 0.2vw, 2px) black",
              textStroke: "clamp(1px, 0.2vw, 2px) black",
            }}
          >
            {isEditMode ? (
              <input
                type="text"
                value={heroSection3?.title1}
                onChange={(e) => {
                  setInstitutionData((prev) => ({
                    ...prev,
                    homeSection: {
                      ...prev.homeSection,
                      homeSection4: {
                        ...prev.homeSection.homeSection4,
                        title1: e.target.value,
                      },
                    },
                  }));
                }}
                className="text-center leading-none uppercase bg-transparent border-2 border-gray-400 border-dashed outline-none font-[800] w-32 md:w-[60vw] resize-none h-[24vh]"
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 800,
                  fontSize: "clamp(60px, 15vw, 225px)",
                  lineHeight: "clamp(52px, 13vw, 194.25px)",
                  letterSpacing: "0%",

                  caretColor: "black",
                }}
              />
            ) : (
              heroSection3?.title1 || "WE'RE"
            )}
          </h1>
          <h1
            className="text-center leading-none"
            style={{
              fontFamily: "Poppins",
              fontWeight: 800,
              fontSize: "clamp(60px, 15vw, 225px)",
              lineHeight: "clamp(52px, 13vw, 194.25px)",
              letterSpacing: "0%",
              color: "transparent",
              WebkitTextStroke: "clamp(1px, 0.2vw, 2px) black",
              textStroke: "clamp(1px, 0.2vw, 2px) black",
            }}
          >
            {isEditMode ? (
              <input
                type="text"
                value={heroSection3?.title2}
                onChange={(e) => {
                  setInstitutionData((prev) => ({
                    ...prev,
                    homeSection: {
                      ...prev.homeSection,
                      homeSection4: {
                        ...prev.homeSection.homeSection4,
                        title2: e.target.value,
                      },
                    },
                  }));
                }}
                className="text-center leading-none uppercase bg-transparent border-2 border-gray-400 border-dashed outline-none font-[800] w-32 md:w-[60vw] resize-none h-[24vh] "
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 800,
                  fontSize: "clamp(60px, 15vw, 225px)",
                  lineHeight: "clamp(52px, 13vw, 194.25px)",
                  letterSpacing: "0%",

                  caretColor: "black",
                }}
              />
            ) : (
              heroSection3?.title2 || "THE"
            )}
          </h1>
          <h1
            className="text-center leading-none"
            style={{
              fontFamily: "Poppins",
              fontWeight: 800,
              fontSize: "clamp(60px, 15vw, 225px)",
              lineHeight: "clamp(52px, 13vw, 194.25px)",
              letterSpacing: "0%",
              color: "transparent",
              WebkitTextStroke: "clamp(1px, 0.2vw, 2px) black",
              textStroke: "clamp(1px, 0.2vw, 2px) black",
            }}
          >
            {isEditMode ? (
              <input
                type="text"
                value={heroSection3?.title3}
                onChange={(e) => {
                  setInstitutionData((prev) => ({
                    ...prev,
                    homeSection: {
                      ...prev.homeSection,
                      homeSection4: {
                        ...prev.homeSection.homeSection4,
                        title3: e.target.value,
                      },
                    },
                  }));
                }}
                className="text-center leading-none uppercase bg-transparent border-2 border-gray-400 border-dashed outline-none font-[800] w-32 md:w-[60vw] resize-none h-[24vh]"
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 800,
                  fontSize: "clamp(60px, 15vw, 225px)",
                  lineHeight: "clamp(52px, 13vw, 194.25px)",
                  letterSpacing: "0%",

                  caretColor: "black",
                }}
              />
            ) : (
              heroSection3?.title3 || "BEST"
            )}
          </h1>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection3;
