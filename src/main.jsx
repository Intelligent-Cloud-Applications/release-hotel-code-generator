import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { LoadingProvider } from "./Development/context/LoadingContext.jsx";
import { EditModeProvider } from "./Development/context/EditModeContext.jsx";
import { AuthContextProvider } from "./Development/context/AuthContext.jsx";
import { AppContextProvider } from "./Development/context/AppContext.jsx";
import { InstitutionProvider } from "./Development/context/InstitutionContext.jsx";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")).render(
  <LoadingProvider>
    <InstitutionProvider>
      <EditModeProvider>
        <AuthContextProvider>
          <AppContextProvider>
            <BrowserRouter>
              <App />
              <Toaster />
            </BrowserRouter>
          </AppContextProvider>
        </AuthContextProvider>
      </EditModeProvider>
    </InstitutionProvider>
  </LoadingProvider>
);
