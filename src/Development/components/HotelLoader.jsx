import React, { useState, useEffect, useRef } from 'react';

const HotelLoader = ({ message = "Verifying access credentials...", isLoading = true, onLoadComplete }) => {
  const [currentIcon, setCurrentIcon] = useState(0);
  const [nextIcon, setNextIcon] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [exitPhase, setExitPhase] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(0);

  // Hospitality quotes
  const quotes = [
    { text: "Where Luxury Meets Comfort", author: "" },
    { text: "Your Home Away From Home", author: "" },
    { text: "Experience Excellence", author: "" },
    { text: "Creating Memorable Moments", author: "" },
    { text: "Hospitality at Its Finest", author: "" },
    { text: "Where Every Guest is Royalty", author: "" },
    { text: "Elegance in Every Detail", author: "" },
    { text: "Crafting Perfect Stays", author: "" },
  ];

  // Hotel-related icons
  const icons = [
    // Hotel Building
    <svg key="hotel" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
      <path d="M7 14.5h2v2H7v-2zm0-4h2v2H7v-2zm0-4h2v2H7v-2zm6 8h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2v-2zm5 12V3.5A1.5 1.5 0 0016.5 2h-9A1.5 1.5 0 006 3.5v17H4v2h16v-2h-2zm-2 0H8v-17h8v17z"/>
    </svg>,
    // Food Service / Cloche
    <svg key="food" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
      <path d="M12 3c-1.66 0-3 .9-3 2v1h6V5c0-1.1-1.34-2-3-2zm9 12v2H3v-2c0-3.87 3.13-7 7-7h.17A3 3 0 0112 5a3 3 0 011.83 3H14c3.87 0 7 3.13 7 7zM4.21 19h15.58c-.1-.54-.29-1.05-.57-1.5H4.78c-.28.45-.47.96-.57 1.5z"/>
    </svg>,
    // Wine Glass / Bar
    <svg key="bar" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
      <path d="M6 3l1 8.5c.11.89.88 1.5 1.78 1.5h6.44c.9 0 1.67-.61 1.78-1.5L17 3H6zm10.28 8H7.72l-.78-6h10.12l-.78 6zM11 13v7H9v2h6v-2h-2v-7h-2z"/>
    </svg>,
    // Restaurant / Utensils
    <svg key="restaurant" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
      <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
    </svg>,
    // Bed / Room
    <svg key="room" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
      <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
    </svg>,
    // Spa / Wellness
    <svg key="spa" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
      <path d="M15.49 9.63c-.18-2.79-1.31-5.51-3.43-7.63a12.188 12.188 0 00-3.55 7.63c1.28.68 2.46 1.56 3.49 2.63 1.03-1.06 2.21-1.94 3.49-2.63zm-6.5 2.65c-.14-.1-.3-.19-.45-.29.15.11.31.19.45.29zm6.42-.25c-.13.09-.27.16-.4.26.13-.1.27-.17.4-.26zM12 15.45C9.85 12.17 6.18 10 2 10c0 5.32 3.36 9.82 8.03 11.49.63.23 1.29.4 1.97.51.68-.12 1.34-.29 1.97-.51C18.64 19.82 22 15.32 22 10c-4.18 0-7.85 2.17-10 5.45z"/>
    </svg>,
    // Pool / Swimming
    <svg key="pool" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
      <path d="M22 21c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.08.64-2.19.64-1.11 0-1.73-.37-2.18-.64-.37-.23-.6-.36-1.15-.36s-.78.13-1.15.36c-.46.27-1.08.64-2.19.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64 1.11 0 1.73.37 2.18.64.37.22.6.36 1.15.36s.78-.13 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36v2zM8.67 12c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64 1.11 0 1.73.37 2.18.64.37.22.6.36 1.15.36s.78-.13 1.15-.36c.12-.07.26-.15.41-.23L10.48 5C10.17 4.38 9.54 4 8.84 4c-.17 0-.34.02-.51.07l-5.3 1.43c-.54.14-.87.7-.72 1.24l.18.66 6.18-1.67 3.16 7.02c-.53.14-.78.27-.93.37-.46.27-1.08.64-2.19.64-.56 0-.78-.13-1.15-.36-.46-.27-1.08-.64-2.19-.64s-1.73.37-2.18.64c-.37.23-.59.36-1.15.36v2c1.11 0 1.73-.37 2.18-.64.37-.23.6-.36 1.15-.36z"/>
    </svg>,
    // Concierge / Bell
    <svg key="concierge" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
      <path d="M12 5c-4.96 0-9 2.01-9 4.5V12h18V9.5C21 7.01 16.96 5 12 5zm0 2c3.31 0 6 1.12 6 2.5S15.31 12 12 12s-6-1.12-6-2.5S8.69 7 12 7zM3 14v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4H3zm9-6c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1s1 .45 1 1v3c0 .55-.45 1-1 1z"/>
    </svg>,
    // Coffee / Cafe
    <svg key="coffee" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
      <path d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.83 2.95 7.18 6.78 7.29 3.96.12 7.22-3.06 7.22-7v-1h.5c1.93 0 3.5-1.57 3.5-3.5S20.43 3 18.5 3zM16 10c0 2.21-1.79 4-4 4s-4-1.79-4-4V5h8v5zm2.5-2H16V5h2.5c.83 0 1.5.67 1.5 1.5S19.33 8 18.5 8zM4 19h16v2H4v-2z"/>
    </svg>,
  ];

  // Smooth icon transition with morph effect
  useEffect(() => {
    const iconInterval = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        
        // After fade out, change the icon
        setTimeout(() => {
          setCurrentIcon((prev) => {
            const next = prev >= icons.length - 1 ? 0 : prev + 1;
            if (next === 0) {
              setTimeout(() => setShowLogo(true), 400);
            }
            return next;
          });
          setNextIcon((prev) => (prev >= icons.length - 1 ? 0 : prev + 1));
          
          // End transition
          setTimeout(() => {
            setIsTransitioning(false);
          }, 250);
        }, 250);
      }
    }, 1200); // Faster cycling to show more icons

    const logoTimeout = setInterval(() => {
      setShowLogo(false);
      setCurrentIcon(0);
      setNextIcon(1);
    }, 15000);


    return () => {
      clearInterval(iconInterval);
      clearInterval(logoTimeout);
    };
  }, [isTransitioning]);

  // Quote rotation
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev >= quotes.length - 1 ? 0 : prev + 1));
    }, 3000);

    return () => clearInterval(quoteInterval);
  }, []);

  // Handle multi-phase exit animation
  useEffect(() => {
    if (!isLoading && exitPhase === 0) {
      setExitPhase(1);
      setTimeout(() => setExitPhase(2), 400);
      setTimeout(() => setExitPhase(3), 900);
      setTimeout(() => {
        if (onLoadComplete) onLoadComplete();
      }, 1500);
    }
  }, [isLoading, exitPhase, onLoadComplete]);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: exitPhase >= 3 
          ? '#FBF6F0'
          : 'linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)',
        transition: 'background 0.6s ease-out',
      }}
    >
      {/* Expanding Circle Overlay */}
      <div 
        className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
        style={{ opacity: exitPhase >= 2 ? 1 : 0 }}
      >
        <div 
          className="rounded-full"
          style={{
            background: 'radial-gradient(circle, #FBF6F0 0%, #F5EDE4 50%, #FBF6F0 100%)',
            width: exitPhase >= 2 ? '300vmax' : '0px',
            height: exitPhase >= 2 ? '300vmax' : '0px',
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1), height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        ></div>
      </div>

      {/* Subtle Radial Glow */}
      <div 
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(201,162,39,0.15) 0%, transparent 50%)',
          opacity: exitPhase >= 1 ? 0 : 0.3,
        }}
      ></div>

      {/* Floating Gold Particles */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-500"
        style={{ opacity: exitPhase >= 1 ? 0 : 1 }}
      >
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold rounded-full"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              opacity: 0.4,
              animation: `float ${4 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Main Loader Container */}
      <div 
        className="relative z-30 flex flex-col items-center space-y-12 max-w-md mx-auto px-6"
        style={{
          opacity: exitPhase >= 2 ? 0 : 1,
          transform: exitPhase >= 1 ? 'scale(0.95)' : 'scale(1)',
          transition: 'opacity 0.4s ease-out, transform 0.5s ease-out',
        }}
      >
        {/* Animated Icon Container */}
        <div className="relative">
          {/* Outer Glow */}
          <div 
            className="absolute -inset-8 rounded-full"
            style={{ 
              background: 'radial-gradient(circle, rgba(201,162,39,0.3) 0%, transparent 70%)',
              opacity: 0.4,
            }}
          ></div>
          
          {/* Animated Ring */}
          <div 
            className="absolute -inset-4 rounded-full border border-gold/20"
            style={{
              animation: exitPhase === 0 ? 'spin 10s linear infinite' : 'none',
              opacity: exitPhase >= 1 ? 0 : 1,
              transition: 'opacity 0.3s ease-out',
            }}
          ></div>
          
          {/* Main Icon Container */}
          <div 
            className="relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, #C9A227 0%, #E8D48B 50%, #C9A227 100%)',
              boxShadow: exitPhase >= 2 
                ? '0 0 100px rgba(201, 162, 39, 0.8), 0 0 200px rgba(201, 162, 39, 0.4)'
                : '0 0 60px rgba(201, 162, 39, 0.4)',
              transform: exitPhase >= 2 ? 'scale(1.2)' : 'scale(1)',
              transition: 'box-shadow 0.5s ease-out, transform 0.5s ease-out',
            }}
          >
            {/* Icon with smooth morph transition */}
            <div 
              className="text-[#1a1a1a] absolute inset-0 flex items-center justify-center"
              style={{
                opacity: showLogo ? 0 : (isTransitioning ? 0 : 1),
                transform: isTransitioning ? 'scale(0.8) rotate(-10deg)' : 'scale(1) rotate(0deg)',
                filter: isTransitioning ? 'blur(4px)' : 'blur(0px)',
                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {icons[currentIcon]}
            </div>
            
            {/* Hotel Logo Text */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: showLogo ? 1 : 0,
                transform: showLogo ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(10deg)',
                filter: showLogo ? 'blur(0px)' : 'blur(4px)',
                transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <span 
                className="text-[#1a1a1a] text-2xl font-bold tracking-[-3px]"
                style={{ fontFamily: 'Ogg, serif' }}
              >
                HM
              </span>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div 
          className="text-center space-y-4"
          style={{
            opacity: exitPhase >= 1 ? 0 : 1,
            transform: exitPhase >= 1 ? 'translateY(10px)' : 'translateY(0)',
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          }}
        >
          <h3 
            className="text-lg font-light text-white/90 tracking-wide"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {message}
          </h3>
          
          {/* Minimal Animated Line */}
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-px bg-gold/40"></div>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
            </div>
            <div className="w-8 h-px bg-gold/40"></div>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div 
          className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden"
          style={{
            opacity: exitPhase >= 1 ? 0 : 1,
            transition: 'opacity 0.3s ease-out',
          }}
        >
          <div 
            className="h-full rounded-full"
            style={{ 
              background: 'linear-gradient(90deg, transparent, #C9A227, #E8D48B, #C9A227, transparent)',
              animation: 'progress 2s ease-in-out infinite',
            }}
          ></div>
        </div>

        {/* Quote */}
        <div 
          className="text-center"
          style={{
            opacity: exitPhase >= 1 ? 0 : 1,
            transform: exitPhase >= 1 ? 'translateY(10px)' : 'translateY(0)',
            transition: 'opacity 0.3s ease-out 0.1s, transform 0.3s ease-out 0.1s',
          }}
        >
          <h2 
            className="text-gold text-lg md:text-xl tracking-wide"
            style={{ fontFamily: 'Ogg, serif' }}
          >
            "Creating Memorable Moments"
          </h2>
          <p className="text-white/40 text-xs mt-2 tracking-widest uppercase">
            Premium Hospitality
          </p>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-15px) scale(1.1); opacity: 0.7; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default HotelLoader;
