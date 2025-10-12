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
import metaTagsData from "./Operation/metaTags.json";

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

const verifyMetaTags = () => {
  const metaTags = {
    title: document.querySelector('meta[name="title"]')?.content,
    description: document.querySelector('meta[name="description"]')?.content,
    keywords: document.querySelector('meta[name="keywords"]')?.content,
    documentTitle: document.title,
  };
  console.log("Current Meta Tags:", metaTags);
  return metaTags;
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const App = () => {
  const { institutionData } = useInstitutionContext();

  useEffect(() => {
    if (institutionData?.companyName) {
      document.title = `Welcome to ${capitalizeFirstLetter(
        institutionData.companyName
      )}`;
    }
    const logoUrl = institutionData?.logoUrl || "";
    const setFavicon = () => {
      if (!logoUrl) return;
      let link =
        document.querySelector("link[rel*='icon']") ||
        document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = logoUrl;
      document.head.appendChild(link);
    };
    setFavicon();
  }, [institutionData]);

  const metaTitle =
    metaTagsData?.seo?.title ||
    `Welcome to ${capitalizeFirstLetter(
      institutionData?.companyName || "Our Hotel"
    )}`;
  const metaDescription =
    metaTagsData?.seo?.description || "Best hotel services in town.";
  const metaKeywords =
    metaTagsData?.seo?.keywords?.join(", ") ||
    "hotel, luxury, accommodation, spa";
  const gtmId = metaTagsData?.gtmId || "GTM-XXXXXXX";

  // Meta tags management
  useEffect(() => {
    const updateOrCreateMetaTag = (name, content) => {};

    updateOrCreateMetaTag("title", metaTitle);
    updateOrCreateMetaTag("description", metaDescription);
    updateOrCreateMetaTag("keywords", metaKeywords);

    setTimeout(() => {
      verifyMetaTags();
    }, 1000);
  }, [metaTitle, metaDescription, metaKeywords]);

  // Google Tag Manager Integration
  useEffect(() => {
    if (!gtmId) return;
    const existingScript = document.querySelector(
      'script[src*="googletagmanager"]'
    );
    if (existingScript) existingScript.remove();
    const script = document.createElement("script");
    script.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `;
    document.head.appendChild(script);
    const noscript = document.createElement("noscript");
    noscript.innerHTML = `
        <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe>
      `;
    document.body.appendChild(noscript);
  }, [gtmId]);

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
