import { createContext, useState, useContext, useEffect } from "react";
import { get, put } from "aws-amplify/api";
import { institutionId, template } from "../../Operation/data.json";
import { GlobalLoader } from "../components/LoadingStates.jsx";

const InstitutionContext = createContext();

export const useInstitutionContext = () => {
  return useContext(InstitutionContext);
};

export const InstitutionProvider = ({ children }) => {
  const [institutionData, setInstitutionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("InstitutionProvider component rendered");

  async function fetchInstitutionData() {
    // setLoading(true);
    setError(null);

    try {
      const response = await get({
        apiName: "common",
        path: `/any/${institutionId}/get-institution-data`,
      }).response;

      console.log("Response received:", response);

      const data = await response.body.json();
      console.log("Institution data fetched:", data);

      const currentTpl = (template === "template1" ? data?.template1 : data?.template2) || {};
      const fallbackTpl = (template === "template1" ? data?.template2 : data?.template1) || {};

      const resolvedData = {
        ...fallbackTpl,
        ...currentTpl,
        companyName: currentTpl.companyName || fallbackTpl.companyName || data?.companyName || data?.name || "",
        contactDetails: {
          ...(fallbackTpl.contactDetails || {}),
          ...(currentTpl.contactDetails || {}),
        },
        taxNumber: currentTpl.taxNumber || fallbackTpl.taxNumber || data?.taxNumber || "",
        taxType: currentTpl.taxType || fallbackTpl.taxType || data?.taxType || "GST",
        taxPercent:
          currentTpl.taxPercent !== undefined && currentTpl.taxPercent !== null
            ? currentTpl.taxPercent
            : fallbackTpl.taxPercent !== undefined && fallbackTpl.taxPercent !== null
            ? fallbackTpl.taxPercent
            : "18",
      };

      setInstitutionData(resolvedData);
    } catch (error) {
      console.log("Error fetching institution data:", error);
      console.error("Full error details:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateInstitutionData(customData = null) {
    try {
      const dataToSave = customData || institutionData;
      console.log("Updating institution data in backend database:", dataToSave);
      const res = await get({
        apiName: "common",
        path: `/any/${institutionId}/get-institution-data`,
      }).response;
      const existingData = await res.body.json();
      console.log("Existing institution data:", existingData);

      // Core settings that must stay identical across all templates
      const coreSettings = {
        companyName: dataToSave.companyName || "",
        name: dataToSave.name || dataToSave.companyName || "",
        contactDetails: {
          ...(dataToSave.contactDetails || {}),
        },
        taxNumber: dataToSave.taxNumber || "",
        taxType: dataToSave.taxType || "GST",
        taxPercent: dataToSave.taxPercent || "18",
      };

      let updatedData = {
        ...existingData,
        ...coreSettings,
        template1: {
          ...(existingData?.template1 || {}),
          ...(template === "template1" ? dataToSave : {}),
          ...coreSettings,
        },
        template2: {
          ...(existingData?.template2 || {}),
          ...(template === "template2" ? dataToSave : {}),
          ...coreSettings,
        },
      };

      // Also sync to any other template keys present in the database (e.g. template3, template4)
      Object.keys(existingData || {}).forEach((key) => {
        if (
          key.startsWith("template") &&
          key !== "template1" &&
          key !== "template2" &&
          typeof existingData[key] === "object" &&
          existingData[key] !== null
        ) {
          updatedData[key] = {
            ...existingData[key],
            ...coreSettings,
          };
        }
      });
      console.log("Updated data synced to all templates: ", updatedData);

      const restOperation = await put({
        apiName: "common",
        path: `/any/${institutionId}/update-institution-data`,
        options: {
          body: updatedData,
        },
      });
      const response = await restOperation.response;
      const data = await response.body.json();
      console.log("API Response (Institution):", data);
      await fetchInstitutionData();
      setError(null);
    } catch (error) {
      console.error("Error updating institution data:", error);
      setError("Failed to update institution data");
    }
  }

  useEffect(() => {
    fetchInstitutionData()
      .then(() => {
        console.log("fetchInstitutionData completed");
      })
      .catch((err) => {
        console.error("fetchInstitutionData failed:", err);
      });
  }, []);

  return (
    <InstitutionContext.Provider
      value={{
        institutionData,
        setInstitutionData,
        updateInstitutionData,
        loading,
        error,
        fetchInstitutionData,
      }}
    >
      {loading ? <GlobalLoader type="INSTITUTION_LOADING" /> : children}
    </InstitutionContext.Provider>
  );
};
