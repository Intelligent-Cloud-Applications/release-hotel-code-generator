import { useState, useEffect } from "react";
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/Development/components/ui/alert.js";
import { Button } from "@/Development/components/ui/button.js";
import { Card, CardContent } from "@/Development/components/ui/card.js";
import { Checkbox } from "@/Development/components/ui/checkbox.js";
import { Input } from "@/Development/components/ui/input.js";
import { Label } from "@/Development/components/ui/label.js";
import { Link, useNavigate } from "react-router";
import { useAuthContext } from "@/Development/context/AuthContext.jsx";
import { product } from "@/Operation/data.json";

const dashboardRoutes = {
  admin: "/admin/room_list",
  frontdesk: "/frontdesk/room_list",
  housekeeping: "/housekeeping/room_status_list",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, userData, isLoading: authLoading } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && userData) {
      const userTypeRoutes = {
        admin: "/dashboard/admin/room_list",
        frontdesk: "/dashboard/frontdesk",
        housekeeping: "/dashboard/housekeeping/room_status_list",
        accountant: "/dashboard/accounting/cash-entry",
      };
      const redirectPath =
        product === "booking"
          ? "/dashboard/bookings"
          : userTypeRoutes[userData.userType] || "/dashboard";
      navigate(redirectPath, { replace: true });
    }
  }, [userData, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    // Form validation
    if (!email.trim()) {
      setLoginError("Email is required");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setLoginError("Password is required");
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const data = await login(email, password);
      if (!data) throw new Error();
      setLoginSuccess(true);
      navigate(
        "/dashboard" + product === "booking"
          ? "/bookings"
          : userTypeRoutes[userData.userType] || "/dashboard"
      );
    } catch (error) {
      console.error(error);
      setLoginError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail("staff@luxehotel.com");
    setPassword("password");
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 inter items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 inter">
      {/* Left side - Hotel Illustration */}
      <div className="hidden w-1/2 bg-primary lg:block">
        <div className="flex h-full items-center justify-center">
          <div className="w-3/4 max-w-md">
            <HotelIllustration />
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex w-full flex-col justify-center px-4 sm:px-6 lg:w-1/2 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="flex justify-center lg:hidden">
            <div className="mb-10 rounded-full bg-primary p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Login Portal
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to manage reservations, guest services, and tasks
            </p>
          </div>

          <div className="mt-8">
            <Card>
              <CardContent className="pt-6">
                {loginSuccess ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">
                      Login successful!
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Redirecting to your dashboard...
                    </p>
                  </div>
                ) : (
                  <div>
                    {loginError && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{loginError}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Staff email address
                        </Label>
                        <div className="relative">
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="name@luxehotel.com"
                            value={email}
                            onChange={(e) => {
                              setLoginError("");
                              setEmail(e.target.value);
                            }}
                            className="pr-10"
                            required
                          />
                          {email && (
                            <button
                              type="button"
                              className="absolute right-0 top-0 flex h-full items-center pr-3 text-gray-400"
                              onClick={() => setEmail("")}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="password"
                            className="text-sm font-medium"
                          >
                            Password
                          </Label>
                          <a
                            href="#"
                            className="text-xs font-medium text-primary hover:text-primary/80"
                          >
                            Forgot password?
                          </a>
                        </div>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => {
                              setLoginError("");
                              setPassword(e.target.value);
                            }}
                            required
                          />
                          <button
                            type="button"
                            className="absolute right-0 top-0 flex h-full items-center pr-3 text-gray-400"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        type="submit"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign in"
                        )}
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hotel-themed illustration component
function HotelIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 1000"
      style={{ width: "100%", height: "auto" }}
      fill="none"
    >
      <circle cx="500" cy="500" r="400" fill="white" fillOpacity="0.1" />
      <circle cx="500" cy="500" r="300" fill="white" fillOpacity="0.1" />

      {/* Hotel Building */}
      <rect
        x="300"
        y="200"
        width="400"
        height="500"
        rx="10"
        fill="white"
        fillOpacity="0.2"
      />

      {/* Hotel Entrance */}
      <rect
        x="425"
        y="600"
        width="150"
        height="100"
        fill="white"
        fillOpacity="0.3"
      />
      <rect
        x="475"
        y="600"
        width="50"
        height="100"
        fill="white"
        fillOpacity="0.4"
      />

      {/* Windows */}
      <rect
        x="350"
        y="250"
        width="60"
        height="80"
        rx="5"
        fill="white"
        fillOpacity="0.4"
      />
      <rect
        x="450"
        y="250"
        width="60"
        height="80"
        rx="5"
        fill="white"
        fillOpacity="0.4"
      />
      <rect
        x="550"
        y="250"
        width="60"
        height="80"
        rx="5"
        fill="white"
        fillOpacity="0.4"
      />

      <rect
        x="350"
        y="350"
        width="60"
        height="80"
        rx="5"
        fill="white"
        fillOpacity="0.4"
      />
      <rect
        x="450"
        y="350"
        width="60"
        height="80"
        rx="5"
        fill="white"
        fillOpacity="0.4"
      />
      <rect
        x="550"
        y="350"
        width="60"
        height="80"
        rx="5"
        fill="white"
        fillOpacity="0.4"
      />

      <rect
        x="350"
        y="450"
        width="60"
        height="80"
        rx="5"
        fill="white"
        fillOpacity="0.4"
      />
      <rect
        x="450"
        y="450"
        width="60"
        height="80"
        rx="5"
        fill="white"
        fillOpacity="0.4"
      />
      <rect
        x="550"
        y="450"
        width="60"
        height="80"
        rx="5"
        fill="white"
        fillOpacity="0.4"
      />

      {/* Hotel Sign */}
      <rect
        x="400"
        y="150"
        width="200"
        height="40"
        rx="5"
        fill="white"
        fillOpacity="0.5"
      />

      {/* Stars */}
      <circle cx="425" cy="170" r="10" fill="white" fillOpacity="0.9" />
      <circle cx="455" cy="170" r="10" fill="white" fillOpacity="0.9" />
      <circle cx="485" cy="170" r="10" fill="white" fillOpacity="0.9" />
      <circle cx="515" cy="170" r="10" fill="white" fillOpacity="0.9" />
      <circle cx="545" cy="170" r="10" fill="white" fillOpacity="0.9" />

      {/* Room Key */}
      <rect
        x="650"
        y="400"
        width="100"
        height="60"
        rx="10"
        fill="white"
        fillOpacity="0.3"
      />
      <circle cx="680" cy="430" r="15" fill="white" fillOpacity="0.5" />
      <rect
        x="700"
        y="425"
        width="40"
        height="10"
        rx="5"
        fill="white"
        fillOpacity="0.5"
      />

      {/* Bellhop Cart */}
      <rect
        x="200"
        y="550"
        width="80"
        height="50"
        rx="5"
        fill="white"
        fillOpacity="0.3"
      />
      <circle cx="220" cy="610" r="15" fill="white" fillOpacity="0.5" />
      <circle cx="260" cy="610" r="15" fill="white" fillOpacity="0.5" />
      <rect
        x="200"
        y="530"
        width="80"
        height="20"
        rx="5"
        fill="white"
        fillOpacity="0.4"
      />

      {/* Decorative elements */}
      <circle cx="700" cy="300" r="30" fill="white" fillOpacity="0.2" />
      <circle cx="300" cy="400" r="40" fill="white" fillOpacity="0.2" />
      <circle cx="650" cy="600" r="25" fill="white" fillOpacity="0.2" />
    </svg>
  );
}
