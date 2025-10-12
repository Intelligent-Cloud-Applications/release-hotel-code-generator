import React from "react";
import { EditModeProvider } from "../context/EditModeContext.jsx";
import Navbar from "../components/template1/Navbar";
import Hero from "../components/template1/Hero";
import HotelRooms from "../components/template1/HotelRooms";
import Testimonials from "../components/template1/Testimonials";
import Footer from "../components/template1/Footer";
import WhyStayHere from "../components/template1/WhyStayHere";
import OurFacilities from "../components/template1/OurFacilities";
import {
  InstitutionProvider,
  useInstitutionContext,
} from "../context/InstitutionContext.jsx";

const Home = () => {
  return (
    <InstitutionProvider>
      <EditModeProvider>
        <div className="w-full h-screen flex flex-col">
          <Navbar />
          <Hero />
          <WhyStayHere />
          <OurFacilities />
          <HotelRooms />
          <Testimonials />
          <Footer />
        </div>
      </EditModeProvider>
    </InstitutionProvider>
  );
};

export default Home;
