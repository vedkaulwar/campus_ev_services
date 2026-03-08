"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    collegeId: "",
    email: "",
    password: "",
    contactNo: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong")
      }

      router.push("/login?registered=true")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <div className="auth-logo">
          ⚡ CampusEV
        </div>
        <div className="auth-subtitle">Create your account to start riding</div>

        {error && (
          <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required 
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe" 
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="age">Age</label>
              <input 
                type="number" 
                id="age" 
                name="age" 
                min="18"
                required 
                value={formData.age}
                onChange={handleChange}
                placeholder="18+" 
              />
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="collegeId">College ID</label>
              <input 
                type="text" 
                id="collegeId" 
                name="collegeId" 
                required 
                value={formData.collegeId}
                onChange={handleChange}
                placeholder="MITADT12345" 
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required 
              value={formData.email}
              onChange={handleChange}
              placeholder="student@mituniversity.edu.in" 
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactNo">Contact Number</label>
            <input 
              type="text" 
              id="contactNo" 
              name="contactNo" 
              required 
              value={formData.contactNo}
              onChange={handleChange}
              placeholder="+91 9876543210" 
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required 
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••" 
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Log in here</Link>
        </div>
      </div>
    </div>
  )
}
