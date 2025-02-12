import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';



const ProtectedRoute = () => {


const token = localStorage.getItem("token") // gets the token from the localStorage now instead of the UserID


return(
  token ? <Outlet/>:<Navigate to="/login"/>  // the token does not exists return to login screen.
)


}



const GroupRoute = () => {
  const groupId = localStorage.getItem("GroupId");

 
  if (groupId && groupId !== "null" && groupId !== "") {
    
    return <Navigate to="/dashboard" />;
  }

 
  return <Outlet />;
};


 // If no groupId, allow access to the route
export { ProtectedRoute, GroupRoute };


