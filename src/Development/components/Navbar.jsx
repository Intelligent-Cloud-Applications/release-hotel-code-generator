// components/Navbar.jsx
import React from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { useAppContext } from "../context/AppContext.jsx";
import { useEditContext } from "../context/EditModeContext.jsx";
import { useInstitutionContext } from "../context/InstitutionContext.jsx";
import { useAuthContext } from "../context/AuthContext.jsx";

const Navbar = () => {
  const { updateInstitutionData } = useInstitutionContext();
  const { isEditMode, setIsEditMode } = useEditContext();
  const { userData } = useAuthContext();

  const isAdmin = userData?.userType === "admin"; // Assuming userData has a role property
  console.log(isAdmin);
  
  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Rooms", href: "/rooms" },
    { label: "Restaurant", href: "/restaurant" },
    { label: "Contact Us", href: "/contact" },  
  ];

  const [scrolled, setScrolled] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 0;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 py-5 md:py-6 transition-colors duration-300 z-[100] max-w-screen border-b ${
        scrolled
          ? "bg-[#FBF6F0] border-[#FBF6F0]"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-0">
        {/* Mobile hamburger button */}
        <div className="flex justify-between items-center md:hidden">
          <Link
            to="/"
            className="text-black ogg font-bold  text-2xl tracking-[-6px]"
          >
            JH
          </Link>
          <button
            onClick={toggleMenu}
            className="text-black hover:text-gold transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Desktop menu */}
        <div className="hidden md:flex justify-center space-x-8 md:space-x-12 lg:space-x-16 bg-transparent">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={index}
                to={item.href}
                onClick={closeMenu}
                className={`monsterrat font-[600] text-base md:text-lg transition-colors duration-300 bg-transparent ${
                  isActive ? "text-gold" : "text-black hover:text-gold"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 z-[10000] ease-in-out ${
            isMenuOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col space-y-4 bg-champagne rounded-lg p-4">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={index}
                  to={item.href}
                  onClick={closeMenu}
                  className={`monsterrat font-[600] text-base transition-colors duration-300 py-2 ${
                    isActive ? "text-gold" : "text-black hover:text-gold"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Edit mode switch */}
        {isAdmin && (
          <div className="fixed top-4 right-2 md:right-4 flex items-center gap-1 md:gap-2 bg-white rounded-lg p-1.5 md:p-2 shadow-md poppins z-[200]">
            <span className="text-xs md:text-sm font-medium hidden sm:block">Edit Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEditMode}
                onChange={(e) => {
                  setIsEditMode(e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-9 md:w-11 h-5 md:h-6 bg-gray-200 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 md:after:h-5 after:w-4 md:after:w-5 after:transition-all peer-checked:bg-gold"></div>
            </label>
            {isEditMode && (
              <button
                onClick={() => {
                  updateInstitutionData();
                  setIsEditMode(false);
                }}
                className="ml-1 md:ml-2 px-2 md:px-3 py-1 bg-green-600 text-white rounded-md text-xs md:text-sm hover:bg-green-700 transition-colors"
              >
                Save
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
