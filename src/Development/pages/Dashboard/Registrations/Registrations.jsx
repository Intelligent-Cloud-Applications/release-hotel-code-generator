import React, { useEffect } from "react";
import { useNavigate } from "react-router";

const Registrations = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/dashboard/registrations/new_booking");
  }, []);

  return <div>Registrations</div>;
};

export default Registrations;
