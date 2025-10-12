import React from 'react';
import Navbar from '../components/template1/Navbar.jsx';
import Footer from '../components/template1/Footer.jsx';
import { EditModeProvider } from "../context/EditModeContext.jsx";

const services = [
  {
    title: "Luxury Rooms",
    description: "Experience comfort and elegance in our luxury rooms, designed for relaxation and tranquility.",
    icon: "🛏️"
  },
  {
    title: "Fine Dining",
    description: "Enjoy gourmet meals prepared by world-class chefs in our exquisite restaurant.",
    icon: "🍽️"
  },
  {
    title: "Wellness Spa",
    description: "Unwind and rejuvenate with our full suite of spa and wellness treatments.",
    icon: "💆‍♀️"
  },
  {
    title: "Conference Halls",
    description: "State-of-the-art halls perfect for business meetings, conferences, and special events.",
    icon: "🏢"
  }
];

const Services = () => {
  return (
    <EditModeProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground font-quicksand">
        <Navbar />
        <main className="flex-1 container mx-auto py-16 px-4 lg:px-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center text-orange-500">Our Services</h1>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto text-center">
            Discover the range of luxurious services offered at our hotel to make your stay unforgettable.
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            {services.map((service, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-8 flex items-start gap-6 hover:shadow-2xl transition-shadow duration-300">
                <span className="text-5xl">{service.icon}</span>
                <div>
                  <h2 className="text-2xl font-semibold text-orange-600 mb-2">{service.title}</h2>
                  <p className="text-gray-500">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </EditModeProvider>
  );
};

export default Services;