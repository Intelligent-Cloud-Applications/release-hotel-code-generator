import Hero from "../components/Hero.jsx";
import HeroSection2 from "../components/HeroSection2.jsx";
import WeAccomodate from "../components/WeAccomodate.jsx";
import HeroSection3 from "../components/HeroSection3.jsx";
import RoomRates from "../components/RoomRates.jsx";
import Reviews from "../components/Reviews.jsx";
import { useEffect } from "react";
import Gallery from "../components/Gallery.jsx";
import FooterSection from "../components/FooterSection.jsx";

const Home = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full flex flex-col">
      <Hero />
      <HeroSection2 />
      <WeAccomodate />
      <HeroSection3 />
      <RoomRates />
      <Reviews />
      <Gallery />
      <FooterSection />
    </div>
  );
};

export default Home;
