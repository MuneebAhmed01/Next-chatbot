'use client';
import React from 'react'
import Sidebar from "@/components/Sidebar";
import Chatbox from '@/components/Chatbox';
const page = () => {
  return (
    <>
     <div className='flex'>
       <Sidebar/>
       <Chatbox/>
     </div>
     
    </>
  )
}

export default page
