import React from "react";

const BillFooter = ({ billData }) => {
  return (
    <div className="border-t-2 border-dashed text-center border-black section-gap">
      <div className="text-xl font-bold mt-2">
        {billData.footer.thankYou}, {billData.footer.tagline}
      </div>
    </div>
  );
};

export default BillFooter;
