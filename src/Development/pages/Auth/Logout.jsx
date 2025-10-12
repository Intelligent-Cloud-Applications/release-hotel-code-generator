import {useEffect} from "react";
import {signOut} from "aws-amplify/auth";

const Logout = () => {
  useEffect(() => { signOut().then(() =>  window.location.href = "/login").catch(console.error) }, []);
}

export default Logout;