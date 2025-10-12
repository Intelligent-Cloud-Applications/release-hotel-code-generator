import React, { useEffect } from "react";
import { useNavigate } from "react-router";

const FrontDesk = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Perform any necessary side effects here
    navigate("/dashboard/frontdesk/room_list");
  }, []);

  return <div>Front Desk</div>;
};

export default FrontDesk;
