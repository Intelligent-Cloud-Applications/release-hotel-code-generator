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

    if (Array.isArray(returnVal.userType)) {
      returnVal.userTypes = returnVal.userType.map((userType) =>
        userType.toLowerCase()
      );
      returnVal.userType =
        localStorage.getItem("userType") &&
        returnVal.userTypes.includes(
          localStorage.getItem("userType").toLowerCase()
        )
          ? localStorage.getItem("userType").toLowerCase()
          : returnVal?.userTypes.includes("admin")
          ? "admin"
          : returnVal?.userTypes[0];

      if (
        !localStorage.getItem("userType") ||
        !returnVal.userTypes.includes(
          localStorage.getItem("userType").toLowerCase()
        )
      ) {
        localStorage.setItem("userType", returnVal.userType);
      }
    } else {
      returnVal.userType = returnVal.userType.toLowerCase();
      returnVal.userTypes = [returnVal.userType];
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
