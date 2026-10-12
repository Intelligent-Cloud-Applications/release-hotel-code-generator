import { createContext, useContext, useEffect, useState } from "react";
import { signIn, signOut } from "aws-amplify/auth";
import { get } from "aws-amplify/api";
import { institutionId } from "../../Operation/data.json";
import { GlobalLoader } from "../components/LoadingStates.jsx";

const AuthContext = createContext({});

export const useAuthContext = () => {
  return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (username, password) => {
    try {
      await signIn({
        username: username,
        password: password,
      });
      const data = await getUserData();

      setUserData(data);
      return data;
    } catch (error) {
      console.error(error);
      console.log(error.name);
      if (error.name === "UserAlreadyAuthenticatedException") {
        await signOut();
        await login(username, password);
      }
    }
  };

  const getUserData = async () => {
    const { body } = await get({
      apiName: "common",
      path: "/get-user/" + institutionId,
      options: {},
    }).response;
    const user = (await body.json()).user;
    const returnVal = {
      institutionId: user.institutionId,
      cognitoId: user.staff_id || user.cognitoId,
      emailId: user.email || user.emailId,
      phoneNumber: user.mobile || user.phoneNumber,
      userName: user.name || user.userName,
      userType: user.role || user.userType,
    };

    const allRoles = ["admin", "frontdesk", "housekeeping", "accountant", "laundry", "store"];
    const storedRole = typeof localStorage !== "undefined" && localStorage.getItem("userType")
      ? localStorage.getItem("userType").toLowerCase()
      : null;

    if (Array.isArray(returnVal.userType)) {
      returnVal.userTypes = returnVal.userType.map((t) => String(t).toLowerCase());
    } else if (typeof returnVal.userType === "string") {
      returnVal.userTypes = [returnVal.userType.toLowerCase()];
    } else {
      returnVal.userTypes = ["admin"];
    }

    const isAdmin = returnVal.userTypes.includes("admin");

    if (isAdmin) {
      // For admins, preserve whatever role is in the current URL route if present
      const pathSegment = typeof window !== "undefined" ? window.location.pathname.split("/")[2]?.toLowerCase() : "";
      let matchedRoleFromUrl = null;
      if (pathSegment === "laundry") matchedRoleFromUrl = "laundry";
      else if (pathSegment === "store") matchedRoleFromUrl = "store";
      else if (pathSegment === "frontdesk") matchedRoleFromUrl = "frontdesk";
      else if (pathSegment === "housekeeping") matchedRoleFromUrl = "housekeeping";
      else if (pathSegment === "accounting") matchedRoleFromUrl = "accountant";
      else if (pathSegment === "admin") matchedRoleFromUrl = "admin";

      if (matchedRoleFromUrl) {
        returnVal.userType = matchedRoleFromUrl;
        localStorage.setItem("userType", matchedRoleFromUrl);
      } else if (storedRole && allRoles.includes(storedRole)) {
        returnVal.userType = storedRole;
      } else {
        returnVal.userType = "admin";
        localStorage.setItem("userType", "admin");
      }
    } else {
      if (storedRole && returnVal.userTypes.includes(storedRole)) {
        returnVal.userType = storedRole;
      } else {
        returnVal.userType = returnVal.userTypes[0] || "frontdesk";
        localStorage.setItem("userType", returnVal.userType);
      }
    }
    console.log(returnVal);
    return returnVal;
  };

  useEffect(() => {
    getUserData()
      .then((data) => {
        console.log(data);
        setUserData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err.message);
        setUserData(null);
        setIsLoading(false);
      });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userData,
        setUserData,
        login,
        isLoading,
      }}
    >
      {isLoading ? <GlobalLoader type="AUTH_LOADING" /> : children}
    </AuthContext.Provider>
  );
};
