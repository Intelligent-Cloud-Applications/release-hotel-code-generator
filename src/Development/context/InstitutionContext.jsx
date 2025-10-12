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
      if (template === "template1") {
        setInstitutionData(data.template1);
      } else if (template === "template2") {
        setInstitutionData(data.template2);
      }
    } catch (error) {
      console.log("Error fetching institution data:", error);
      console.error("Full error details:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateInstitutionData() {
    try {
      console.log("Updating institution data:", institutionData);
      const res = await get({
        apiName: "common",
        path: `/any/${institutionId}/get-institution-data`,
      }).response;
      const existingData = await res.body.json();
      console.log("Existing institution data:", existingData);
      let updatedData = {};

      if (template === "template1") {
        updatedData = {
          ...existingData,
          template1: institutionData,
        };
      } else if (template === "template2") {
        updatedData = {
          ...existingData,
          template2: institutionData,
        };
      }
      console.log("Updated data: ", updatedData);

      console.log("Merged institution data to be sent:", updatedData);

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
