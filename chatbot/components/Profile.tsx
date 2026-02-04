"use client";

import { useState, useEffect } from "react";
import { chatService } from "../services/chatService";

type ProfileProps = {
  userId?: string;
  userEmail?: string;
  userName?: string;
  credits: number;
  onBuyCredits: () => void;
  onBack: () => void;
  onNameUpdate?: (newName: string) => void;
};




export default function Profile({
  userId,
  userEmail,
  userName,
  credits,
  onBuyCredits,
  onBack,
  onNameUpdate,
}: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem(`userName_${userId}`);
      return savedName || userName || "";
    }
    return userName || "";
  });
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`profileImage_${userId}`) || null;
    }
    return null;
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onBack();
    }, 200);
  };

  const handleSaveName = async () => {
    if (!userId || !name.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      await chatService.updateUserName(userId, name.trim());
      onNameUpdate?.(name.trim());
      if (typeof window !== 'undefined') {
        localStorage.setItem(`userName_${userId}`, name.trim());
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update name:", error);
      alert("Failed to update name. Please try again.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setProfileImage(imageData);
        if (typeof window !== 'undefined' && userId) {
          localStorage.setItem(`profileImage_${userId}`, imageData);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getProfilePicture = () => {
    if (profileImage) {
      return profileImage;
    }
    
    const display = name || userEmail || "User";
    const isGmail = userEmail?.includes("@gmail.com");

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(display)}&background=${
      isGmail ? "3b82f6" : "6b7280"
    }&color=fff&size=128`;
  };

  return (
   <div 
     className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-200 ease-out ${
       isVisible ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'
     }`} 
     onClick={handleClose}
   >
      <div 
        className={`bg-gray-900 rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto relative shadow-2xl border border-gray-700/50 transition-all duration-200 ease-out ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full p-2 transition-all duration-200"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

        <div className="bg-gray-800/80 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
       
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-linear-to-r from-purple-600 to-blue-500 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
                <img
                  src={getProfilePicture()}
                  alt="Profile"
                  className="relative w-32 h-32 rounded-full border-4 border-gray-900 shadow-xl object-cover"
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profile-image-upload"
                />
                
                <button
                  onClick={() => document.getElementById('profile-image-upload')?.click()}
                  className="absolute bottom-1 right-1 bg-linear-to-r from-purple-500 to-blue-500 text-white p-2.5 rounded-full hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 hover:scale-110"
                  type="button"
                  aria-label="Change photo"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
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
                      className="flex-1 px-4 py-2 bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ 
                        color: 'white',
                        WebkitTextFillColor: 'white',
                        caretColor: 'white'
                      }}
                    />

                    <button
                      onClick={handleSaveName}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      type="button"
                    >
                      Save
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
                      <img src="/blue-pencil.svg" alt="Edit" className="w-4 h-4" />
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
