"use client";

import { useState } from "react";

type ProfileProps = {
  userId?: string;
  userEmail?: string;
  userName?: string;
  credits: number;
  onBuyCredits: () => void;
  onBack: () => void;
};

function BackIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M15 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


export default function Profile({
  userId,
  userEmail,
  userName,
  credits,
  onBuyCredits,
  onBack,
}: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userName || "");

  const handleSaveName = async () => {
   
    setIsEditing(false);
  };

  const getProfilePicture = () => {
    const display = name || userEmail || "User";
    const isGmail = userEmail?.includes("@gmail.com");

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(display)}&background=${
      isGmail ? "3b82f6" : "6b7280"
    }&color=fff&size=128`;
  };

  return (
    <div className="flex h-full">
     
      <div className="w-[17%] min-w-[17%] bg-black opacity-50" />

     
      <div className="flex-1 bg-gray-900 p-8 overflow-y-auto">
      
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            type="button"
          >
            <BackIcon />
            <span>Back to Chat</span>
          </button>

          <h1 className="text-3xl font-bold text-white">My Profile</h1>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
       
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={getProfilePicture()}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg"
                />

                <button
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                  type="button"
                  aria-label="Change photo"
                >
                 
                </button>
              </div>

              <p className="text-gray-400 text-sm mt-2">Click to change photo</p>
            </div>

         
            <div className="md:col-span-2 space-y-6">
             
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Display Name
                </label>

                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      onClick={handleSaveName}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      type="button"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setName(userName || "");
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-white text-lg">{name || "Set your name"}</p>

                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      type="button"
                      aria-label="Edit name"
                    >
                      <EditIcon />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Address
                </label>

                <div className="flex items-center gap-2">
                  <p className="text-white text-lg">{userEmail}</p>
                  <span className="text-green-400 text-sm">✓ Verified</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  User ID
                </label>
                <p className="text-gray-400 text-sm font-mono">{userId}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="bg-purple-600 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-lg font-semibold">
                    Available Credits
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Use credits to chat with AI
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-4xl font-bold text-white">{credits}</p>

                  <button
                    onClick={onBuyCredits}
                    className="mt-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    type="button"
                  >
                    Buy More Credits
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
     
      </div>
    </div>
  );
}
