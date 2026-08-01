"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth"
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"
import { app, auth } from "../lib/firebaseConfig"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, extraData: any) => Promise<void>
  logout: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteFirebaseAccount: (currentPassword: string) => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const db = getFirestore(app)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, "users", firebaseUser.uid)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = docSnap.data()
            setUser({
              id: firebaseUser.uid,
              name: data.name || "",
              email: firebaseUser.email || "",
              avatar: data.avatar || undefined,
            })
          } else {
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.email || "",
              email: firebaseUser.email || "",
            })
          }
        } catch {
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.email || "",
            email: firebaseUser.email || "",
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const u = userCredential.user
    setUser({ id: u.uid, name: u.email || "", email: u.email || "" })
  }

  const register = async (name: string, email: string, password: string, extraData: any) => {
    const db = getFirestore(app)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const u = userCredential.user
    await setDoc(doc(db, "users", u.uid), {
      name,
      email,
      ...extraData,
      createdAt: new Date(),
    })
    setUser({ id: u.uid, name, email })
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  const sendPasswordReset = async (email: string) => {
    const trimmed = email.trim()
    if (!trimmed) {
      throw new Error("Email requerido")
    }
    await sendPasswordResetEmail(auth, trimmed)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const u = auth.currentUser
    const email = u?.email
    if (!u || !email) {
      throw new Error("Ningún usuario conectado con email/contraseña")
    }
    const cred = EmailAuthProvider.credential(email, currentPassword)
    await reauthenticateWithCredential(u, cred)
    await updatePassword(u, newPassword)
  }

  const deleteFirebaseAccount = async (currentPassword: string) => {
    const u = auth.currentUser
    const email = u?.email
    if (!u || !email) {
      throw new Error("Ningún usuario conectado con email/contraseña")
    }
    const cred = EmailAuthProvider.credential(email, currentPassword)
    await reauthenticateWithCredential(u, cred)
    await deleteUser(u)
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    sendPasswordReset,
    changePassword,
    deleteFirebaseAccount,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
