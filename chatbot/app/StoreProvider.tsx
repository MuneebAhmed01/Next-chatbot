// 'use client'
// import { useRef } from 'react'
// import { Provider } from 'react-redux'
// // import { makeStore, AppStore } from '../lib/store' //make store is used to create store which will store all global states

// export default function StoreProvider({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   //this func make sure that comp only get created once and in next render,reuse the same store
//   const storeRef = useRef<AppStore>(undefined)
//   if (!storeRef.current) { 
//     storeRef.current = makeStore()
//   }

//   return <Provider store={storeRef.current}>{children}</Provider>
// }
