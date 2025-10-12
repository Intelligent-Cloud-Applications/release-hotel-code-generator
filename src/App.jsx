import { BrowserRouter } from "react-router";
import AppRoutes from "./Development/AppRoutes.jsx";
import { Amplify } from "aws-amplify";
import { AppContextProvider } from "@/Development/context/AppContext.jsx";
import { AuthContextProvider } from "@/Development/context/AuthContext.jsx";
import { LoadingProvider } from "@/Development/context/LoadingContext.jsx";
import { Toaster } from "@/Development/components/ui/sonner";
import {
  InstitutionProvider,
  useInstitutionContext,
} from "./Development/context/InstitutionContext";
import { useEffect } from "react";
import { EditModeProvider } from "./Development/context/EditModeContext";

Amplify.configure({
  API: {
    REST: {
      main: {
        endpoint: import.meta.env.VITE_MAIN_ENDPOINT,
        region: import.meta.env.VITE_REGION,
      },

      frontdesk: {
        endpoint: import.meta.env.VITE_FRONTDESK_ENDPOINT,
        region: import.meta.env.VITE_REGION,
      },

      common: {
        endpoint: import.meta.env.VITE_COMMON_ENDPOINT,
        region: import.meta.env.VITE_REGION,
      },

      housekeeping: {
        endpoint: import.meta.env.VITE_HOUSEKEEPING_ENDPOINT,
        region: import.meta.env.VITE_REGION,
      },

      admin: {
        endpoint: import.meta.env.VITE_ADMIN_ENDPOINT,
        region: import.meta.env.VITE_REGION,
      },
      restaurant: {
        endpoint: import.meta.env.VITE_restaurant_ENDPOINT,
        region: import.meta.env.VITE_REGION,
        // endpoint: 'https://ppf65ueuea.execute-api.us-east-2.amazonaws.com/dev',
        // region: 'us-east-2',
      },
    },
  },
  Auth: {
    Cognito: {
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      region: import.meta.env.VITE_REGION,
    },
  },
});

const App = () => {
  return (
    <LoadingProvider>
      <InstitutionProvider>
        <EditModeProvider>
          <AuthContextProvider>
            <AppContextProvider>
              <BrowserRouter>
                <AppRoutes />
                <Toaster />
              </BrowserRouter>
            </AppContextProvider>
          </AuthContextProvider>
        </EditModeProvider>
      </InstitutionProvider>
    </LoadingProvider>
  );
};

export default App;
