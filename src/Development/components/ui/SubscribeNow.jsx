import { Lock } from "lucide-react";
import { Button } from "./button.js";


const SubscribeNow = () => {
  return (
    <div className="p-6 max-w-2xl mx-auto h-[70vh] flex justify-center items-center">
      {/* Subscription Required Card */}
      <div className="border rounded-lg p-8">
        <div className="text-center">
          {/* Lock Icon */}
          <div className="flex justify-center mb-4">
            <Lock className="h-12 w-12" />
          </div>

          {/* Heading */}
          <h2 className="text-xl font-bold mb-3">Subscription Required</h2>

          {/* Description */}
          <p className="mb-6">Please subscribe to access this feature.</p>

          {/* CTA Button */}
          <Button>Subscribe Now</Button>
        </div>
      </div>
    </div>
  );
};

export default SubscribeNow;
