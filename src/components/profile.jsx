import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

function Profile() {
  const [userDetails, setUserDetails] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          const docRef = doc(db, "Users", user.uid);
          try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setUserDetails(docSnap.data());
            } else {
              console.log("User data not found.");
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        } else {
          console.log("User is not logged in.");
          navigate('/login');
        }
      });

      // Cleanup subscription
      return () => unsubscribe();
    };
    fetchUserData();
  }, [navigate]);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
      console.log("User logged out successfully!");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const handleStartInterview = () => {
    navigate('/interview');
  };

  return (
    <div className="profile-container">
      <div className="profile-topbar">
        {userDetails ? (
          <>
            <div className="profile-header">
              <h1>Welcome, {userDetails.firstName}!</h1>
              <div className="profile-menu">
                <img
                  src={userDetails.photo || "/default-profile.png"}
                  alt="Profile"
                  className="profile-image"
                  onClick={toggleDropdown}
                />
                {showDropdown && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-item name">
                      <strong>{userDetails.firstName}</strong>
                    </div>
                    <div className="profile-dropdown-item">{userDetails.email}</div>
                    <div
                      className="profile-dropdown-item logout-button"
                      onClick={handleLogout}
                    >
                      Logout
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-content">
              <div className="welcome-section">
                <p>Ready to practice your interview skills?</p>
                <button 
                  className="start-interview-btn"
                  onClick={handleStartInterview}
                >
                  Start Now
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="loading-container">
            <p>Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;