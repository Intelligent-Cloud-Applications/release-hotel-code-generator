import React, { createContext, useState, useContext, useEffect } from "react";

const EditModeContext = createContext();

export const useEditContext = () => {
  return useContext(EditModeContext)
}

export const EditModeProvider = ({ children }) => {
  // Initialize from localStorage or default to false
  const [isEditMode, setIsEditMode] = useState(() => {
    const saved = localStorage.getItem('isEditMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist to localStorage whenever isEditMode changes
  useEffect(() => {
    localStorage.setItem('isEditMode', JSON.stringify(isEditMode));
  }, [isEditMode]);

  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
  };

  return (
    <EditModeContext.Provider value={{ isEditMode, toggleEditMode, setIsEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
};