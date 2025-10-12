import React from 'react';
import LegacySection from './LegacySection';
import TopPicksSection from './TopPicksSection';
import Navbar from './Navbar';
import Footer from './Footer';
import { EditModeProvider } from "../../context/EditModeContext.jsx";

const AboutUs = () => {
  return (
    <EditModeProvider>
      <div>
        <Navbar />
        <LegacySection />
        <TopPicksSection />
        <Footer />
      </div>
    </EditModeProvider>

  );
};

export default AboutUs;