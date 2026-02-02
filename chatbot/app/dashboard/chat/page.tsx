"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import ChatArea from "../../../components/ChatArea";
import Profile from "../../../components/Profile";

export default function NewChatPage() {
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [credits, setCredits] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const router = useRouter();

    useEffect(() => {
      
        const getUserFromCookie = () => {
            try {
                const userCookie = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('user='));

                if (userCookie) {
                    const userValue = decodeURIComponent(userCookie.split('=')[1]);
                    const userData = JSON.parse(userValue);
                    return userData;
                }
            } catch (e) {
                console.error("Failed to parse user cookie:", e);
            }
            return null;
        };

        const user = getUserFromCookie();

        
        const authCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('auth='));

        if (!authCookie || authCookie.split('=')[1] !== 'true') {
            router.push('/login');
            return;
        }

        if (user) {
            setUserEmail(user.email);
            setUserName(user.name || null);
            setUserId(user.id || user.email);
        }

        setIsLoading(false);
    }, [router]);

    function handleSelectChat(id: string | null) {
        setActiveChat(id);
    }

    function handleChatCreated(id: string) {
        setActiveChat(id);
    }

    function handleCreditsChange(newCredits: number) {
        setCredits(newCredits);
    }

    function handleBuyCredits() {
        if (!userId || !userEmail) {
            router.push('/login');
            return;
        }

        import('../../../services/chatService').then(({ chatService }) => {
            chatService.createCheckoutSession(userId, userEmail).then(({ url }) => {
                if (url) {
                    window.location.href = url;
                }
            }).catch((error) => {
                console.error("Failed to create checkout session:", error);
                alert("Failed to start checkout. Please try again.");
            });
        });
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-900">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (showProfile) {
        return (
            <Profile
                userId={userId || undefined}
                userEmail={userEmail || undefined}
                userName={userName || undefined}
                credits={credits}
                onBuyCredits={handleBuyCredits}
                onBack={() => setShowProfile(false)}
            />
        );
    }

    return (
        <div className="flex h-screen bg-zinc-900">
            <Sidebar
                onSelectChat={handleSelectChat}
                activeChat={activeChat}
                userId={userId || undefined}
                userEmail={userEmail || undefined}
                onCreditsChange={handleCreditsChange}
                onShowProfile={() => setShowProfile(true)}
            />
            <ChatArea
                chatId={activeChat}
                onChatCreated={handleChatCreated}
                userId={userId || undefined}
                credits={credits}
                onCreditsChange={handleCreditsChange}
            />
        </div>
    );
}
