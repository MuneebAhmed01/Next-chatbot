"use client";
import { useState } from "react";
import { useRouter } from 'next/navigation';

type ProfileProps = {
  userId?: string;
  userEmail?: string;
  userName?: string;
  credits: number;
  onBuyCredits: () => void;
  onBack: () => void;
};

export default function Profile({ userId, userEmail, userName, credits, onBuyCredits, onBack }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userName || '');
  const router = useRouter();

  const handleSaveName = async () => {
    // TODO: Implement name update API call
    setIsEditing(false);
  };

  const getProfilePicture = () => {
    if (userEmail && userEmail.includes('@gmail.com')) {
      // For Gmail users, you could integrate with Google Profile API
      // For now, return a default avatar
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || userEmail)}&background=3b82f6&color=fff&size=128`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6b7280&color=fff&size=128`;
  };

  return (
    <div className="flex h-full">
      {/* Sidebar (visible but dimmed) */}
      <div className="w-[17%] min-w-[17%] bg-black opacity-50">
        {/* This maintains the sidebar space but keeps it visible */}
      </div>

      {/* Profile Content */}
      <div className="flex-1 bg-gray-900 p-8 overflow-y-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Chat
          </button>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-800 rounded-2xl p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={getProfilePicture()}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg"
                />
                <button className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-2">Click to change photo</p>
            </div>

            {/* User Information Section */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setName(userName || '');
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-white text-lg">{name || 'Set your name'}</p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                <div className="flex items-center gap-2">
                  <p className="text-white text-lg">{userEmail}</p>
                  <span className="text-green-400 text-sm">✓ Verified</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">User ID</label>
                <p className="text-gray-400 text-sm font-mono">{userId}</p>
              </div>
            </div>
          </div>

          {/* Credits Section */}
          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-lg font-semibold">Available Credits</h3>
                  <p className="text-blue-100 text-sm">Use credits to chat with AI</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-white">{credits}</p>
                  <button
                    onClick={onBuyCredits}
                    className="mt-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Buy More Credits
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="mt-6 space-y-3">
            <button className="w-full text-left px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-between">
              <span>Account Settings</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button className="w-full text-left px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-between">
              <span>Privacy & Security</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button className="w-full text-left px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-between">
              <span>Help & Support</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
